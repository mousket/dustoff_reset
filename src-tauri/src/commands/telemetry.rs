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

/// Focus/activate an application by name
/// This brings the specified app to the foreground (like Alt+Tab)
#[command]
pub fn focus_app(app_name: String) -> Result<bool, String> {
    println!("[Telemetry] Focusing app: {}", app_name);
    
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        // Use AppleScript to activate the app
        let script = format!(
            r#"tell application "{}" to activate"#,
            app_name.replace("\"", "\\\"")
        );
        
        let output = Command::new("osascript")
            .arg("-e")
            .arg(&script)
            .output()
            .map_err(|e| format!("Failed to execute osascript: {}", e))?;
        
        if output.status.success() {
            println!("[Telemetry] Successfully focused: {}", app_name);
            Ok(true)
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            println!("[Telemetry] Failed to focus {}: {}", app_name, stderr);
            // Try alternative method using open command
            let open_output = Command::new("open")
                .arg("-a")
                .arg(&app_name)
                .output()
                .map_err(|e| format!("Failed to execute open: {}", e))?;
            
            if open_output.status.success() {
                println!("[Telemetry] Successfully focused via open: {}", app_name);
                Ok(true)
            } else {
                Ok(false)
            }
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        // Windows implementation would use SetForegroundWindow
        // For now, return false as not implemented
        println!("[Telemetry] Windows focus not implemented yet");
        Ok(false)
    }
    
    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        
        // Try using wmctrl to activate window
        let output = Command::new("wmctrl")
            .arg("-a")
            .arg(&app_name)
            .output();
        
        match output {
            Ok(o) if o.status.success() => {
                println!("[Telemetry] Successfully focused via wmctrl: {}", app_name);
                Ok(true)
            }
            _ => {
                println!("[Telemetry] Linux focus failed");
                Ok(false)
            }
        }
    }
}

/// Minimize an application's window (Flow Mode intervention)
/// This hides the distracting app without closing it
#[command]
pub fn minimize_app(app_name: String) -> Result<bool, String> {
    println!("[Telemetry] Minimizing app: {}", app_name);
    
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        // Use AppleScript to minimize the app's front window
        let script = format!(
            r#"tell application "System Events"
                tell process "{}"
                    try
                        set visible to false
                    end try
                end tell
            end tell"#,
            app_name.replace("\"", "\\\"")
        );
        
        let output = Command::new("osascript")
            .arg("-e")
            .arg(&script)
            .output()
            .map_err(|e| format!("Failed to execute osascript: {}", e))?;
        
        if output.status.success() {
            println!("[Telemetry] Successfully minimized: {}", app_name);
            Ok(true)
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            println!("[Telemetry] Failed to minimize {}: {}", app_name, stderr);
            Ok(false)
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        println!("[Telemetry] Windows minimize not implemented yet");
        Ok(false)
    }
    
    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        
        // Try using xdotool to minimize
        let output = Command::new("xdotool")
            .args(["search", "--name", &app_name, "windowminimize"])
            .output();
        
        match output {
            Ok(o) if o.status.success() => {
                println!("[Telemetry] Successfully minimized via xdotool: {}", app_name);
                Ok(true)
            }
            _ => {
                println!("[Telemetry] Linux minimize failed");
                Ok(false)
            }
        }
    }
}

/// Close the current tab in a browser (Legend Mode intervention)
/// This is a strict intervention that closes the distracting content
#[command]
pub fn close_browser_tab(browser_name: String) -> Result<bool, String> {
    println!("[Telemetry] Closing tab in browser: {}", browser_name);
    
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        // Different browsers need different AppleScript
        let script = if browser_name.to_lowercase().contains("chrome") {
            r#"tell application "Google Chrome"
                if (count of windows) > 0 then
                    tell front window
                        if (count of tabs) > 1 then
                            close active tab
                        else
                            close
                        end if
                    end tell
                end if
            end tell"#.to_string()
        } else if browser_name.to_lowercase().contains("safari") {
            r#"tell application "Safari"
                if (count of windows) > 0 then
                    tell front window
                        if (count of tabs) > 1 then
                            close current tab
                        else
                            close
                        end if
                    end tell
                end if
            end tell"#.to_string()
        } else if browser_name.to_lowercase().contains("firefox") {
            // Firefox needs a different approach - use Cmd+W
            r#"tell application "System Events"
                tell process "Firefox"
                    keystroke "w" using command down
                end tell
            end tell"#.to_string()
        } else if browser_name.to_lowercase().contains("arc") {
            r#"tell application "Arc"
                if (count of windows) > 0 then
                    tell front window
                        close active tab
                    end tell
                end if
            end tell"#.to_string()
        } else if browser_name.to_lowercase().contains("brave") {
            // Brave is Chromium-based, similar to Chrome
            r#"tell application "Brave Browser"
                if (count of windows) > 0 then
                    tell front window
                        if (count of tabs) > 1 then
                            close active tab
                        else
                            close
                        end if
                    end tell
                end if
            end tell"#.to_string()
        } else if browser_name.to_lowercase().contains("edge") {
            r#"tell application "Microsoft Edge"
                if (count of windows) > 0 then
                    tell front window
                        if (count of tabs) > 1 then
                            close active tab
                        else
                            close
                        end if
                    end tell
                end if
            end tell"#.to_string()
        } else {
            // Generic fallback - use Cmd+W keyboard shortcut
            format!(
                r#"tell application "System Events"
                    tell process "{}"
                        keystroke "w" using command down
                    end tell
                end tell"#,
                browser_name.replace("\"", "\\\"")
            )
        };
        
        let output = Command::new("osascript")
            .arg("-e")
            .arg(&script)
            .output()
            .map_err(|e| format!("Failed to execute osascript: {}", e))?;
        
        if output.status.success() {
            println!("[Telemetry] Successfully closed tab in: {}", browser_name);
            Ok(true)
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            println!("[Telemetry] Failed to close tab in {}: {}", browser_name, stderr);
            Ok(false)
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        println!("[Telemetry] Windows close tab not implemented yet");
        Ok(false)
    }
    
    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        
        // Use xdotool to send Ctrl+W
        let output = Command::new("xdotool")
            .args(["key", "--window", "$(xdotool getactivewindow)", "ctrl+w"])
            .output();
        
        match output {
            Ok(o) if o.status.success() => {
                println!("[Telemetry] Successfully sent Ctrl+W");
                Ok(true)
            }
            _ => {
                println!("[Telemetry] Linux close tab failed");
                Ok(false)
            }
        }
    }
}
