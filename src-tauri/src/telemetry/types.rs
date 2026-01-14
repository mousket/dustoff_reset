// src-tauri/src/telemetry/types.rs
// Type definitions for telemetry data

use serde::{Deserialize, Serialize};

/// Information about the currently active application
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActiveAppInfo {
    /// Application name (e.g., "Google Chrome", "VS Code")
    pub app_name: String,
    /// Bundle identifier on macOS (e.g., "com.google.Chrome")
    pub bundle_id: Option<String>,
    /// Window title if available
    pub window_title: Option<String>,
    /// Timestamp when this app became active (Unix ms)
    pub active_since: i64,
}

/// Browser tab information (if the active app is a browser)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BrowserTabInfo {
    /// Browser name
    pub browser: String,
    /// Tab URL
    pub url: Option<String>,
    /// Tab title
    pub title: Option<String>,
    /// Domain extracted from URL
    pub domain: Option<String>,
}

/// A single telemetry event recorded during a session
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TelemetryEvent {
    /// Unique event ID
    pub id: String,
    /// Session ID this event belongs to
    pub session_id: String,
    /// Event type
    pub event_type: TelemetryEventType,
    /// Timestamp (Unix ms)
    pub timestamp: i64,
    /// App info at time of event
    pub app_info: Option<ActiveAppInfo>,
    /// Browser tab info if applicable
    pub browser_tab: Option<BrowserTabInfo>,
    /// Additional metadata
    pub metadata: Option<String>,
}

/// Types of telemetry events
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum TelemetryEventType {
    /// User switched to a different app
    AppSwitch,
    /// User switched to a non-whitelisted app
    NonWhitelistedApp,
    /// User switched browser tabs
    TabSwitch,
    /// User visited a non-whitelisted domain
    NonWhitelistedDomain,
    /// User returned to a whitelisted app
    ReturnToWhitelisted,
    /// Session started
    SessionStart,
    /// Session ended
    SessionEnd,
    /// Intervention triggered
    InterventionTriggered,
    /// User dismissed intervention
    InterventionDismissed,
}

/// Aggregated telemetry stats for a session
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SessionTelemetryStats {
    /// Total number of app switches
    pub app_switches: i32,
    /// Number of switches to non-whitelisted apps
    pub non_whitelisted_switches: i32,
    /// Number of tab switches in browser
    pub tab_switches: i32,
    /// Number of visits to non-whitelisted domains
    pub non_whitelisted_domains: i32,
    /// Time spent in whitelisted apps (seconds)
    pub time_in_whitelisted: i64,
    /// Time spent in non-whitelisted apps (seconds)
    pub time_in_non_whitelisted: i64,
    /// Most used apps (app_name -> seconds)
    pub app_usage: std::collections::HashMap<String, i64>,
    /// Most visited domains (domain -> visit count)
    pub domain_visits: std::collections::HashMap<String, i32>,
}

/// Configuration for the telemetry monitor
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TelemetryConfig {
    /// Polling interval in milliseconds (default: 2000)
    pub poll_interval_ms: u64,
    /// Whether to track browser tabs
    pub track_browser_tabs: bool,
    /// Whitelisted app names
    pub whitelisted_apps: Vec<String>,
    /// Whitelisted domains
    pub whitelisted_domains: Vec<String>,
    /// Whether telemetry is enabled
    pub enabled: bool,
}

impl Default for TelemetryConfig {
    fn default() -> Self {
        Self {
            poll_interval_ms: 2000,
            track_browser_tabs: true,
            whitelisted_apps: vec![],
            whitelisted_domains: vec![],
            enabled: true,
        }
    }
}

/// Monitor state for tracking changes
#[derive(Debug, Clone, Default)]
pub struct MonitorState {
    /// Currently active app
    pub current_app: Option<ActiveAppInfo>,
    /// Current browser tab (if in browser)
    pub current_tab: Option<BrowserTabInfo>,
    /// Whether currently in a whitelisted context
    pub is_whitelisted: bool,
    /// Last check timestamp
    pub last_check: i64,
}
