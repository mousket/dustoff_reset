// src-tauri/src/telemetry/platform/macos.rs
// macOS-specific app detection using Cocoa/objc APIs

#![cfg(target_os = "macos")]

use crate::telemetry::types::ActiveAppInfo;
use crate::telemetry::platform::PlatformMonitor;

use objc::{class, msg_send, sel, sel_impl};

/// macOS implementation of the platform monitor
pub struct MacOSMonitor;

impl MacOSMonitor {
    pub fn new() -> Self {
        Self
    }
}

impl Default for MacOSMonitor {
    fn default() -> Self {
        Self::new()
    }
}

impl PlatformMonitor for MacOSMonitor {
    fn get_frontmost_app(&self) -> Result<ActiveAppInfo, String> {
        unsafe {
            // Get shared workspace
            let workspace: *mut objc::runtime::Object = 
                msg_send![class!(NSWorkspace), sharedWorkspace];
            if workspace.is_null() {
                return Err("Failed to get NSWorkspace".to_string());
            }
            
            // Get frontmost application
            let frontmost_app: *mut objc::runtime::Object = 
                msg_send![workspace, frontmostApplication];
            if frontmost_app.is_null() {
                return Err("Failed to get frontmost application".to_string());
            }
            
            // Get app name
            let name_ns: *mut objc::runtime::Object = 
                msg_send![frontmost_app, localizedName];
            let app_name = nsstring_to_string(name_ns)
                .unwrap_or_else(|| "Unknown".to_string());
            
            // Get bundle identifier
            let bundle_id_ns: *mut objc::runtime::Object = 
                msg_send![frontmost_app, bundleIdentifier];
            let bundle_id = nsstring_to_string(bundle_id_ns);
            
            // Get window title (from frontmost window if available)
            let window_title = get_frontmost_window_title(&app_name);
            
            Ok(ActiveAppInfo {
                app_name,
                bundle_id,
                window_title,
                active_since: chrono::Utc::now().timestamp_millis(),
            })
        }
    }
    
    fn get_idle_time_seconds(&self) -> Result<u64, String> {
        // Use ioreg to get HIDIdleTime (more reliable than CGEventSource)
        use std::process::Command;
        
        let output = Command::new("ioreg")
            .args(["-c", "IOHIDSystem", "-d", "4"])
            .output()
            .map_err(|e| format!("Failed to run ioreg: {}", e))?;
        
        if !output.status.success() {
            return Err("ioreg command failed".to_string());
        }
        
        let output_str = String::from_utf8_lossy(&output.stdout);
        
        // Look for HIDIdleTime in the output
        for line in output_str.lines() {
            if line.contains("HIDIdleTime") {
                // Extract the number from the line
                if let Some(start) = line.find('=') {
                    let value_str = line[start + 1..].trim();
                    if let Ok(nanoseconds) = value_str.parse::<u64>() {
                        // Convert nanoseconds to seconds
                        return Ok(nanoseconds / 1_000_000_000);
                    }
                }
            }
        }
        
        // Fallback: return 0 if we can't determine idle time
        Ok(0)
    }
    
    fn platform_name(&self) -> &'static str {
        "macos"
    }
}

/// Convert NSString to Rust String
unsafe fn nsstring_to_string(ns_string: *mut objc::runtime::Object) -> Option<String> {
    if ns_string.is_null() {
        return None;
    }
    
    let utf8_ptr: *const i8 = msg_send![ns_string, UTF8String];
    if utf8_ptr.is_null() {
        return None;
    }
    
    let c_str = std::ffi::CStr::from_ptr(utf8_ptr);
    c_str.to_str().ok().map(|s| s.to_string())
}

/// Get the title of the frontmost window for an application
/// Uses AppleScript as a fallback for window title since NSWorkspace doesn't provide it directly
fn get_frontmost_window_title(app_name: &str) -> Option<String> {
    use std::process::Command;
    
    let script = format!(
        r#"
        tell application "System Events"
            tell process "{}"
                if exists (window 1) then
                    return name of window 1
                else
                    return ""
                end if
            end tell
        end tell
        "#,
        app_name
    );

    let output = Command::new("osascript")
        .arg("-e")
        .arg(&script)
        .output()
        .ok()?;

    if output.status.success() {
        let title = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !title.is_empty() {
            return Some(title);
        }
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_get_frontmost_app() {
        let monitor = MacOSMonitor::new();
        let result = monitor.get_frontmost_app();
        
        assert!(result.is_ok(), "Should get frontmost app: {:?}", result.err());
        
        let app_info = result.unwrap();
        println!("Current app: {} ({:?})", app_info.app_name, app_info.bundle_id);
        println!("Window title: {:?}", app_info.window_title);
    }
    
    #[test]
    fn test_get_idle_time() {
        let monitor = MacOSMonitor::new();
        let result = monitor.get_idle_time_seconds();
        
        assert!(result.is_ok(), "Should get idle time: {:?}", result.err());
        println!("Idle time: {} seconds", result.unwrap());
    }
}
