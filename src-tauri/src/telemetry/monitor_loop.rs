// src-tauri/src/telemetry/monitor_loop.rs
// Main monitoring loop that polls for active app changes
// Cross-platform: uses platform abstraction layer for app detection

use super::platform::{create_monitor, current_platform};
use super::app_monitor::{get_browser_tab, is_browser}; // Browser detection still uses legacy code
use super::events::TelemetryEventEmitter;
use super::types::{MonitorState, TelemetryConfig, TelemetryEventType};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;
use tokio::time::interval;

/// The telemetry monitor that runs the polling loop
pub struct TelemetryMonitor {
    /// Configuration
    config: Arc<Mutex<TelemetryConfig>>,
    /// Current state
    state: Arc<Mutex<MonitorState>>,
    /// Whether the monitor is running
    is_running: Arc<AtomicBool>,
    /// Current session ID (if in a session)
    session_id: Arc<Mutex<Option<String>>>,
    /// Event emitter
    event_emitter: Arc<TelemetryEventEmitter>,
}

impl TelemetryMonitor {
    /// Create a new telemetry monitor
    pub fn new(event_emitter: TelemetryEventEmitter) -> Self {
        Self {
            config: Arc::new(Mutex::new(TelemetryConfig::default())),
            state: Arc::new(Mutex::new(MonitorState::default())),
            is_running: Arc::new(AtomicBool::new(false)),
            session_id: Arc::new(Mutex::new(None)),
            event_emitter: Arc::new(event_emitter),
        }
    }

    /// Update the configuration
    pub async fn update_config(&self, config: TelemetryConfig) {
        let mut current = self.config.lock().await;
        *current = config;
    }

    /// Start monitoring for a session
    pub async fn start_session(&self, session_id: String, config: TelemetryConfig) {
        // Update config
        {
            let mut current = self.config.lock().await;
            *current = config;
        }

        // Set session ID
        {
            let mut sid = self.session_id.lock().await;
            *sid = Some(session_id.clone());
        }

        // Reset state
        {
            let mut state = self.state.lock().await;
            *state = MonitorState::default();
        }

        // Emit session start event
        self.event_emitter
            .emit_event(TelemetryEventType::SessionStart, &session_id, None, None, None)
            .await;

        // Start the monitoring loop
        self.is_running.store(true, Ordering::SeqCst);
        
        let config = self.config.clone();
        let state = self.state.clone();
        let is_running = self.is_running.clone();
        let session_id_arc = self.session_id.clone();
        let event_emitter = self.event_emitter.clone();

        tokio::spawn(async move {
            Self::run_monitor_loop(config, state, is_running, session_id_arc, event_emitter).await;
        });
    }

    /// Stop monitoring
    pub async fn stop_session(&self) {
        self.is_running.store(false, Ordering::SeqCst);

        // Emit session end event
        if let Some(session_id) = self.session_id.lock().await.as_ref() {
            self.event_emitter
                .emit_event(TelemetryEventType::SessionEnd, session_id, None, None, None)
                .await;
        }

        // Clear session ID
        {
            let mut sid = self.session_id.lock().await;
            *sid = None;
        }
    }

    /// Check if monitoring is active
    pub fn is_monitoring(&self) -> bool {
        self.is_running.load(Ordering::SeqCst)
    }

    /// The main monitoring loop
    async fn run_monitor_loop(
        config: Arc<Mutex<TelemetryConfig>>,
        state: Arc<Mutex<MonitorState>>,
        is_running: Arc<AtomicBool>,
        session_id: Arc<Mutex<Option<String>>>,
        event_emitter: Arc<TelemetryEventEmitter>,
    ) {
        // Create platform-specific monitor
        let monitor = create_monitor();
        
        println!("[Telemetry Loop] Starting monitor loop on platform: {}", current_platform());
        println!("[Telemetry Loop] Using monitor: {}", monitor.platform_name());
        
        let poll_interval = {
            let cfg = config.lock().await;
            cfg.poll_interval_ms
        };

        println!("[Telemetry Loop] Poll interval: {}ms", poll_interval);

        let mut interval = interval(Duration::from_millis(poll_interval));
        let mut loop_count = 0u32;

        while is_running.load(Ordering::SeqCst) {
            interval.tick().await;
            loop_count += 1;

            // Log every 5 iterations to show the loop is running
            if loop_count <= 3 || loop_count % 5 == 0 {
                println!("[Telemetry Loop] Tick #{}", loop_count);
            }

            // Get current session ID
            let sid = {
                let sid_lock = session_id.lock().await;
                match sid_lock.as_ref() {
                    Some(s) => s.clone(),
                    None => {
                        println!("[Telemetry Loop] No session ID, skipping");
                        continue;
                    }
                }
            };

            // Get current config
            let cfg = config.lock().await.clone();
            if !cfg.enabled {
                println!("[Telemetry Loop] Config disabled, skipping");
                continue;
            }

            // Get active app using platform abstraction
            let current_app = match monitor.get_frontmost_app() {
                Ok(app) => Some(app),
                Err(e) => {
                    if loop_count <= 3 {
                        println!("[Telemetry Loop] Failed to get frontmost app: {}", e);
                    }
                    None
                }
            };
            
            // Log app detection results (first few times and on changes)
            if loop_count <= 3 {
                println!("[Telemetry Loop] Active app: {:?}", current_app.as_ref().map(|a| &a.app_name));
            }

            // Get previous state
            let mut current_state = state.lock().await;
            let previous_app = current_state.current_app.clone();

            // Check for app switch
            if let Some(ref app) = current_app {
                let app_changed = match &previous_app {
                    Some(prev) => prev.app_name != app.app_name,
                    None => true,
                };

                if app_changed {
                    // Helper: Check if app is Dustoff Reset (always whitelisted)
                    let is_dustoff_reset = {
                        let name_lower = app.app_name.to_lowercase();
                        let bundle_lower = app.bundle_id.as_ref().map(|b| b.to_lowercase()).unwrap_or_default();
                        name_lower.contains("dustoff") || bundle_lower.contains("dustoff")
                    };
                    
                    // Check if new app is whitelisted (Dustoff Reset is always whitelisted)
                    let is_whitelisted = is_dustoff_reset || cfg
                        .whitelisted_apps
                        .iter()
                        .any(|w| app.app_name.to_lowercase().contains(&w.to_lowercase()));

                    // Emit app switch event
                    event_emitter
                        .emit_event(
                            TelemetryEventType::AppSwitch,
                            &sid,
                            Some(app.clone()),
                            None,
                            None,
                        )
                        .await;

                    // Emit non-whitelisted app event if applicable
                    if !is_whitelisted && !cfg.whitelisted_apps.is_empty() {
                        event_emitter
                            .emit_event(
                                TelemetryEventType::NonWhitelistedApp,
                                &sid,
                                Some(app.clone()),
                                None,
                                None,
                            )
                            .await;
                    }

                    // Check if returned to whitelisted
                    if is_whitelisted && !current_state.is_whitelisted {
                        event_emitter
                            .emit_event(
                                TelemetryEventType::ReturnToWhitelisted,
                                &sid,
                                Some(app.clone()),
                                None,
                                None,
                            )
                            .await;
                    }

                    current_state.is_whitelisted = is_whitelisted;
                }

                // Check for browser tab changes
                if cfg.track_browser_tabs && is_browser(&app.bundle_id) {
                    if let Some(tab) = get_browser_tab(&app.bundle_id) {
                        let tab_changed = match &current_state.current_tab {
                            Some(prev) => prev.url != tab.url,
                            None => true,
                        };

                        if tab_changed {
                            // Check if domain is whitelisted
                            let domain_whitelisted = tab.domain.as_ref().map_or(false, |d| {
                                cfg.whitelisted_domains
                                    .iter()
                                    .any(|w| d.to_lowercase().contains(&w.to_lowercase()))
                            });

                            // Emit tab switch event
                            event_emitter
                                .emit_event(
                                    TelemetryEventType::TabSwitch,
                                    &sid,
                                    Some(app.clone()),
                                    Some(tab.clone()),
                                    None,
                                )
                                .await;

                            // Emit non-whitelisted domain event if applicable
                            if !domain_whitelisted && !cfg.whitelisted_domains.is_empty() {
                                event_emitter
                                    .emit_event(
                                        TelemetryEventType::NonWhitelistedDomain,
                                        &sid,
                                        Some(app.clone()),
                                        Some(tab.clone()),
                                        None,
                                    )
                                    .await;
                            }

                            current_state.current_tab = Some(tab);
                        }
                    }
                }

                current_state.current_app = Some(app.clone());
            }

            current_state.last_check = chrono::Utc::now().timestamp_millis();
        }
    }
}
