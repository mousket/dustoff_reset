// src-tauri/src/telemetry/events.rs
// Event emission to frontend via Tauri events

use super::types::{ActiveAppInfo, BrowserTabInfo, TelemetryEvent, TelemetryEventType};
use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;
use uuid::Uuid;

/// Event names for frontend
pub const EVENT_APP_SWITCH: &str = "telemetry:app-switch";
pub const EVENT_NON_WHITELISTED_APP: &str = "telemetry:non-whitelisted-app";
pub const EVENT_TAB_SWITCH: &str = "telemetry:tab-switch";
pub const EVENT_NON_WHITELISTED_DOMAIN: &str = "telemetry:non-whitelisted-domain";
pub const EVENT_RETURN_TO_WHITELISTED: &str = "telemetry:return-to-whitelisted";
pub const EVENT_SESSION_START: &str = "telemetry:session-start";
pub const EVENT_SESSION_END: &str = "telemetry:session-end";
pub const EVENT_INTERVENTION_TRIGGERED: &str = "telemetry:intervention-triggered";

/// Emits telemetry events to the frontend
pub struct TelemetryEventEmitter {
    app_handle: Mutex<Option<AppHandle>>,
}

impl TelemetryEventEmitter {
    /// Create a new event emitter
    pub fn new() -> Self {
        Self {
            app_handle: Mutex::new(None),
        }
    }

    /// Set the app handle for emitting events
    pub async fn set_app_handle(&self, handle: AppHandle) {
        let mut app_handle = self.app_handle.lock().await;
        *app_handle = Some(handle);
    }

    /// Emit a telemetry event
    pub async fn emit_event(
        &self,
        event_type: TelemetryEventType,
        session_id: &str,
        app_info: Option<ActiveAppInfo>,
        browser_tab: Option<BrowserTabInfo>,
        metadata: Option<String>,
    ) {
        let event = TelemetryEvent {
            id: Uuid::new_v4().to_string(),
            session_id: session_id.to_string(),
            event_type: event_type.clone(),
            timestamp: chrono::Utc::now().timestamp_millis(),
            app_info,
            browser_tab,
            metadata,
        };

        // Get the event name
        let event_name = match event_type {
            TelemetryEventType::AppSwitch => EVENT_APP_SWITCH,
            TelemetryEventType::NonWhitelistedApp => EVENT_NON_WHITELISTED_APP,
            TelemetryEventType::TabSwitch => EVENT_TAB_SWITCH,
            TelemetryEventType::NonWhitelistedDomain => EVENT_NON_WHITELISTED_DOMAIN,
            TelemetryEventType::ReturnToWhitelisted => EVENT_RETURN_TO_WHITELISTED,
            TelemetryEventType::SessionStart => EVENT_SESSION_START,
            TelemetryEventType::SessionEnd => EVENT_SESSION_END,
            TelemetryEventType::InterventionTriggered => EVENT_INTERVENTION_TRIGGERED,
            TelemetryEventType::InterventionDismissed => EVENT_INTERVENTION_TRIGGERED,
        };

        // Emit to frontend
        if let Some(handle) = self.app_handle.lock().await.as_ref() {
            let _ = handle.emit(event_name, &event);
            
            // Also emit a generic telemetry event for logging/persistence
            let _ = handle.emit("telemetry:event", &event);
        }

        // Log for debugging
        #[cfg(debug_assertions)]
        println!(
            "[Telemetry] {:?} - App: {:?}",
            event_type,
            event.app_info.as_ref().map(|a| &a.app_name)
        );
    }

    /// Emit a custom event with arbitrary payload
    pub async fn emit_custom<S: serde::Serialize + Clone>(&self, event_name: &str, payload: S) {
        if let Some(handle) = self.app_handle.lock().await.as_ref() {
            let _ = handle.emit(event_name, payload);
        }
    }
}

impl Default for TelemetryEventEmitter {
    fn default() -> Self {
        Self::new()
    }
}

/// Helper to create event emitter and set app handle
pub fn create_event_emitter(_app: &tauri::App) -> TelemetryEventEmitter {
    let emitter = TelemetryEventEmitter::new();
    // Note: set_app_handle is async, so caller should await it
    emitter
}
