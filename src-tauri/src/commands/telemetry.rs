// src-tauri/src/commands/telemetry.rs
// Tauri commands for telemetry control

use crate::telemetry::{
    TelemetryConfig, TelemetryEventEmitter, TelemetryMonitor,
    SessionTelemetryStats, TelemetryEvent,
    persistence::{get_session_events, get_session_stats, save_session_stats},
    platform::apps::{InstalledApp, get_installed_apps, get_installed_browsers},
};
use std::sync::Arc;
use tauri::{command, AppHandle, State};
use tokio::sync::Mutex;

/// Global telemetry state managed by Tauri
pub struct TelemetryState {
    pub monitor: Arc<Mutex<Option<TelemetryMonitor>>>,
}

impl TelemetryState {
    pub fn new() -> Self {
        Self {
            monitor: Arc::new(Mutex::new(None)),
        }
    }
}

impl Default for TelemetryState {
    fn default() -> Self {
        Self::new()
    }
}

/// Start the telemetry monitor for a session
#[command]
pub async fn start_telemetry_monitor(
    app_handle: AppHandle,
    state: State<'_, TelemetryState>,
    session_id: String,
    whitelisted_apps: Vec<String>,
    whitelisted_domains: Vec<String>,
) -> Result<(), String> {
    println!("[Telemetry] ========================================");
    println!("[Telemetry] Starting monitor for session: {}", session_id);
    println!("[Telemetry] Whitelisted apps: {:?}", whitelisted_apps);
    println!("[Telemetry] Whitelisted domains: {:?}", whitelisted_domains);
    
    // Create config
    let config = TelemetryConfig {
        poll_interval_ms: 2000,
        track_browser_tabs: true,
        whitelisted_apps,
        whitelisted_domains,
        enabled: true,
    };
    println!("[Telemetry] Config created");
    
    // Create a fresh event emitter with the app handle
    let emitter = TelemetryEventEmitter::new();
    emitter.set_app_handle(app_handle).await;
    println!("[Telemetry] Event emitter created and app handle set");
    
    // Create a new monitor
    let monitor = TelemetryMonitor::new(emitter);
    println!("[Telemetry] Monitor instance created");
    
    // Start the session
    monitor.start_session(session_id.clone(), config).await;
    println!("[Telemetry] Session started on monitor");
    
    // Store the monitor
    let mut monitor_lock = state.monitor.lock().await;
    *monitor_lock = Some(monitor);
    
    println!("[Telemetry] ✅ Monitor started successfully for: {}", session_id);
    println!("[Telemetry] ========================================");
    Ok(())
}

/// Stop the telemetry monitor
#[command]
pub async fn stop_telemetry_monitor(
    state: State<'_, TelemetryState>,
) -> Result<(), String> {
    println!("[Telemetry] Stopping monitor");
    
    let mut monitor_lock = state.monitor.lock().await;
    
    if let Some(ref monitor) = *monitor_lock {
        monitor.stop_session().await;
    }
    
    // Clear the monitor
    *monitor_lock = None;
    
    println!("[Telemetry] Monitor stopped");
    Ok(())
}

/// Check if telemetry monitor is running
#[command]
pub async fn is_telemetry_running(
    state: State<'_, TelemetryState>,
) -> Result<bool, String> {
    let monitor_lock = state.monitor.lock().await;
    
    if let Some(ref monitor) = *monitor_lock {
        Ok(monitor.is_monitoring())
    } else {
        Ok(false)
    }
}

/// Get telemetry events for a session
#[command]
pub fn get_telemetry_events(
    app_state: State<'_, crate::AppState>,
    session_id: String,
) -> Result<Vec<TelemetryEvent>, String> {
    let conn = app_state.db.lock().map_err(|e| e.to_string())?;
    get_session_events(&conn, &session_id)
}

/// Get telemetry stats for a session
#[command]
pub fn get_telemetry_stats(
    app_state: State<'_, crate::AppState>,
    session_id: String,
) -> Result<Option<SessionTelemetryStats>, String> {
    let conn = app_state.db.lock().map_err(|e| e.to_string())?;
    get_session_stats(&conn, &session_id)
}

/// Save telemetry stats for a session
#[command]
pub fn save_telemetry_stats(
    app_state: State<'_, crate::AppState>,
    session_id: String,
    stats: SessionTelemetryStats,
) -> Result<(), String> {
    let conn = app_state.db.lock().map_err(|e| e.to_string())?;
    save_session_stats(&conn, &session_id, &stats)
}

/// Get list of installed applications on the system
#[command]
pub fn get_system_apps() -> Result<Vec<InstalledApp>, String> {
    println!("[Telemetry] Getting installed apps...");
    let apps = get_installed_apps()?;
    println!("[Telemetry] Found {} installed apps", apps.len());
    Ok(apps)
}

/// Get list of installed browsers
#[command]
pub fn get_system_browsers() -> Result<Vec<InstalledApp>, String> {
    println!("[Telemetry] Getting installed browsers...");
    let browsers = get_installed_browsers();
    println!("[Telemetry] Found {} browsers", browsers.len());
    Ok(browsers)
}
