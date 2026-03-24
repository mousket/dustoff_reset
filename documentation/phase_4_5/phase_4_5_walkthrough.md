# Phase 4.5 Walkthrough

## Telemetry & Basic Enforcement (Cross-Platform)

---

## Overview

This walkthrough provides step-by-step prompts for Cursor to build the telemetry and basic enforcement system with **cross-platform support for macOS and Windows** from day one.

**Total Time:** 22-28 hours (includes cross-platform abstraction)
**Milestones:** 6

| Milestone | Description | Hours |
|-----------|-------------|-------|
| M1 | Detection Foundation (Cross-Platform) | 5-7h |
| M2 | Classification & Penalties | 3-4h |
| M3 | Delay Gate (Flow Mode) | 3-4h |
| M4 | Block Screen (Legend Mode) | 3-4h |
| M5 | Escalation & Tracking | 3-4h |
| M6 | Integration & Polish | 2-3h |

---

## Pre-Flight Checklist

Before starting, verify:

```bash
# Node version (must be 22+)
node --version

# Rust builds
cd src-tauri && cargo build

# App runs
npm run tauri dev
```

If any fail, fix them first.

---

# Milestone 1: Detection Foundation (Cross-Platform)

**Goal:** Detect active app on both macOS and Windows, emit events to frontend
**Time:** 5-7 hours
**Checkpoint:** Open Twitter → see console log with app info (on either platform)

---

## Step 1.1: Create Telemetry Module Structure

**Create file:** `src-tauri/src/telemetry/mod.rs`

**Give Cursor this prompt:**

```
Create the telemetry module structure for Dustoff Reset with cross-platform support.

Create file: src-tauri/src/telemetry/mod.rs

```rust
// src-tauri/src/telemetry/mod.rs

pub mod types;
pub mod platform;
pub mod monitor_loop;
pub mod events;
pub mod persistence;

pub use types::*;
pub use platform::PlatformMonitor;
pub use monitor_loop::*;
pub use events::*;
pub use persistence::*;
```

This module will handle:
- Active app detection (macOS and Windows)
- Platform abstraction layer
- Monitor loop (polling every 2 seconds)
- Event emission to frontend
- Persistence to SQLite
```

---

## Step 1.2: Define Telemetry Types

**Create file:** `src-tauri/src/telemetry/types.rs`

**Give Cursor this prompt:**

```
Create the telemetry types for Dustoff Reset. These types are platform-agnostic.

Create file: src-tauri/src/telemetry/types.rs

```rust
// src-tauri/src/telemetry/types.rs

use serde::{Deserialize, Serialize};

/// Information about an application (cross-platform)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AppInfo {
    /// Display name of the app (e.g., "Twitter", "Google Chrome")
    pub name: String,
    
    /// Platform-specific identifier
    /// - macOS: Bundle ID (e.g., "com.twitter.twitter-mac")
    /// - Windows: Executable name (e.g., "chrome.exe")
    pub identifier: String,
    
    /// Path to the application
    /// - macOS: "/Applications/Twitter.app"
    /// - Windows: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    pub path: String,
    
    /// Process ID (useful for window management)
    pub pid: Option<u32>,
}

impl AppInfo {
    /// Create an empty/unknown app info
    pub fn unknown() -> Self {
        Self {
            name: "Unknown".to_string(),
            identifier: "unknown".to_string(),
            path: String::new(),
            pid: None,
        }
    }
    
    /// Check if this is the same app (by identifier)
    pub fn is_same_app(&self, other: &AppInfo) -> bool {
        self.identifier == other.identifier
    }
}

/// Event emitted when the active app changes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppChangeEvent {
    /// Previous app
    pub from_app: AppInfo,
    /// New app
    pub to_app: AppInfo,
    /// Unix timestamp in milliseconds
    pub timestamp: u64,
    /// Current session ID (if in a session)
    pub session_id: Option<String>,
}

/// Event emitted when idle is detected
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IdleEvent {
    /// How long the user has been idle (seconds)
    pub duration_seconds: u64,
    /// Type of last activity before idle
    pub last_activity_type: String,
    /// Unix timestamp in milliseconds
    pub timestamp: u64,
    /// Current session ID (if in a session)
    pub session_id: Option<String>,
}

/// Error event for monitor issues
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitorErrorEvent {
    /// Error code
    pub code: String,
    /// Human-readable message
    pub message: String,
    /// Additional context
    pub context: String,
    /// Unix timestamp in milliseconds
    pub timestamp: u64,
}

/// Telemetry event for database storage
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryEventRecord {
    pub id: String,
    pub session_id: String,
    pub event_type: String,
    pub timestamp: u64,
    
    // App change fields
    pub from_app_name: Option<String>,
    pub from_app_identifier: Option<String>,
    pub to_app_name: Option<String>,
    pub to_app_identifier: Option<String>,
    pub to_app_category: Option<String>,
    
    // Penalty/bonus
    pub penalty_applied: Option<f64>,
    pub bonus_applied: Option<f64>,
    pub bandwidth_before: Option<f64>,
    pub bandwidth_after: Option<f64>,
    
    // Intervention
    pub intervention_triggered: Option<String>,
    pub intervention_response: Option<String>,
    pub intervention_time_ms: Option<u64>,
    
    // Escalation
    pub offense_number: Option<i32>,
    pub escalation_multiplier: Option<f64>,
    
    // Platform info
    pub platform: Option<String>,
    
    // JSON context
    pub context: Option<String>,
}

/// Get current Unix timestamp in milliseconds
pub fn now_ms() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64
}

/// Get current platform as string
pub fn current_platform() -> &'static str {
    #[cfg(target_os = "macos")]
    { "macos" }
    #[cfg(target_os = "windows")]
    { "windows" }
    #[cfg(target_os = "linux")]
    { "linux" }
    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    { "unknown" }
}
```

These types are platform-agnostic and work on both macOS and Windows.
```

---

## Step 1.3: Create Platform Abstraction Layer

**Create file:** `src-tauri/src/telemetry/platform/mod.rs`

**Give Cursor this prompt:**

```
Create the platform abstraction layer for cross-platform app detection.

Create file: src-tauri/src/telemetry/platform/mod.rs

```rust
// src-tauri/src/telemetry/platform/mod.rs

use crate::telemetry::types::AppInfo;

/// Platform-specific monitor trait
/// Implemented by each platform (macOS, Windows)
pub trait PlatformMonitor: Send + Sync {
    /// Get the currently active (frontmost) application
    fn get_frontmost_app(&self) -> Result<AppInfo, String>;
    
    /// Get idle time in seconds (time since last user input)
    fn get_idle_time_seconds(&self) -> Result<u64, String>;
    
    /// Get platform name
    fn platform_name(&self) -> &'static str;
}

// Platform-specific implementations
#[cfg(target_os = "macos")]
pub mod macos;

#[cfg(target_os = "windows")]
pub mod windows;

// Re-export the native monitor for the current platform
#[cfg(target_os = "macos")]
pub use macos::MacOSMonitor as NativeMonitor;

#[cfg(target_os = "windows")]
pub use windows::WindowsMonitor as NativeMonitor;

// Fallback for unsupported platforms
#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub mod fallback;

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub use fallback::FallbackMonitor as NativeMonitor;

/// Create the appropriate monitor for the current platform
pub fn create_monitor() -> Box<dyn PlatformMonitor> {
    Box::new(NativeMonitor::new())
}

/// Check if the current platform is supported
pub fn is_platform_supported() -> bool {
    cfg!(any(target_os = "macos", target_os = "windows"))
}
```

This provides a common interface that both macOS and Windows implementations will use.
```

---

## Step 1.4: Implement macOS Monitor

**Create file:** `src-tauri/src/telemetry/platform/macos.rs`

**Give Cursor this prompt:**

```
Create the macOS-specific app detection implementation.

Create file: src-tauri/src/telemetry/platform/macos.rs

```rust
// src-tauri/src/telemetry/platform/macos.rs

#![cfg(target_os = "macos")]

use crate::telemetry::types::AppInfo;
use crate::telemetry::platform::PlatformMonitor;

use cocoa::base::nil;
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
    fn get_frontmost_app(&self) -> Result<AppInfo, String> {
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
            let name = nsstring_to_string(name_ns)
                .unwrap_or_else(|| "Unknown".to_string());
            
            // Get bundle identifier
            let bundle_id_ns: *mut objc::runtime::Object = 
                msg_send![frontmost_app, bundleIdentifier];
            let identifier = nsstring_to_string(bundle_id_ns)
                .unwrap_or_else(|| "unknown".to_string());
            
            // Get bundle URL and path
            let bundle_url: *mut objc::runtime::Object = 
                msg_send![frontmost_app, bundleURL];
            let path = if !bundle_url.is_null() {
                let path_ns: *mut objc::runtime::Object = 
                    msg_send![bundle_url, path];
                nsstring_to_string(path_ns).unwrap_or_default()
            } else {
                String::new()
            };
            
            // Get process ID
            let pid: i32 = msg_send![frontmost_app, processIdentifier];
            
            Ok(AppInfo {
                name,
                identifier,
                path,
                pid: Some(pid as u32),
            })
        }
    }
    
    fn get_idle_time_seconds(&self) -> Result<u64, String> {
        use core_graphics::event_source::{
            CGEventSourceStateID, 
            CGEventSourceGetSecondssinceLastEventType
        };
        use core_graphics::event::CGEventType;
        
        let idle_time = unsafe {
            CGEventSourceGetSecondssinceLastEventType(
                CGEventSourceStateID::CombinedSessionState,
                CGEventType::Null  // Any event type
            )
        };
        
        Ok(idle_time as u64)
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

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_get_frontmost_app() {
        let monitor = MacOSMonitor::new();
        let result = monitor.get_frontmost_app();
        
        assert!(result.is_ok(), "Should get frontmost app");
        
        let app_info = result.unwrap();
        assert!(!app_info.name.is_empty(), "App name should not be empty");
        assert!(!app_info.identifier.is_empty(), "Identifier should not be empty");
        
        println!("Current app: {} ({})", app_info.name, app_info.identifier);
    }
    
    #[test]
    fn test_get_idle_time() {
        let monitor = MacOSMonitor::new();
        let result = monitor.get_idle_time_seconds();
        
        assert!(result.is_ok(), "Should get idle time");
        println!("Idle time: {} seconds", result.unwrap());
    }
}
```

This is the macOS-specific implementation using Cocoa/AppKit APIs.
```

---

## Step 1.5: Implement Windows Monitor

**Create file:** `src-tauri/src/telemetry/platform/windows.rs`

**Give Cursor this prompt:**

```
Create the Windows-specific app detection implementation.

Create file: src-tauri/src/telemetry/platform/windows.rs

```rust
// src-tauri/src/telemetry/platform/windows.rs

#![cfg(target_os = "windows")]

use crate::telemetry::types::AppInfo;
use crate::telemetry::platform::PlatformMonitor;

use std::ffi::OsString;
use std::os::windows::ffi::OsStringExt;
use std::path::PathBuf;

use windows::Win32::Foundation::{HWND, MAX_PATH, BOOL};
use windows::Win32::UI::WindowsAndMessaging::{
    GetForegroundWindow, 
    GetWindowThreadProcessId,
    GetWindowTextW,
    GetWindowTextLengthW,
};
use windows::Win32::System::Threading::{
    OpenProcess, 
    PROCESS_QUERY_INFORMATION, 
    PROCESS_VM_READ,
};
use windows::Win32::System::ProcessStatus::GetModuleFileNameExW;
use windows::Win32::UI::Input::KeyboardAndMouse::GetLastInputInfo;
use windows::Win32::UI::Input::KeyboardAndMouse::LASTINPUTINFO;

/// Windows implementation of the platform monitor
pub struct WindowsMonitor;

impl WindowsMonitor {
    pub fn new() -> Self {
        Self
    }
}

impl Default for WindowsMonitor {
    fn default() -> Self {
        Self::new()
    }
}

impl PlatformMonitor for WindowsMonitor {
    fn get_frontmost_app(&self) -> Result<AppInfo, String> {
        unsafe {
            // Get the foreground window handle
            let hwnd: HWND = GetForegroundWindow();
            if hwnd.0 == 0 {
                return Err("No foreground window found".to_string());
            }
            
            // Get window title
            let title_len = GetWindowTextLengthW(hwnd);
            let name = if title_len > 0 {
                let mut title_buf: Vec<u16> = vec![0; (title_len + 1) as usize];
                GetWindowTextW(hwnd, &mut title_buf);
                // Remove null terminator and convert
                let len = title_buf.iter().position(|&c| c == 0).unwrap_or(title_buf.len());
                OsString::from_wide(&title_buf[..len])
                    .to_string_lossy()
                    .into_owned()
            } else {
                "Unknown".to_string()
            };
            
            // Get process ID
            let mut pid: u32 = 0;
            GetWindowThreadProcessId(hwnd, Some(&mut pid));
            
            if pid == 0 {
                return Ok(AppInfo {
                    name,
                    identifier: "unknown".to_string(),
                    path: String::new(),
                    pid: None,
                });
            }
            
            // Open process to get executable path
            let process_handle = OpenProcess(
                PROCESS_QUERY_INFORMATION | PROCESS_VM_READ,
                BOOL(0),
                pid,
            );
            
            let (path, identifier) = if let Ok(handle) = process_handle {
                let mut path_buf: Vec<u16> = vec![0; MAX_PATH as usize];
                let len = GetModuleFileNameExW(handle, None, &mut path_buf);
                
                if len > 0 {
                    let path_str = OsString::from_wide(&path_buf[..len as usize])
                        .to_string_lossy()
                        .into_owned();
                    
                    // Extract executable name as identifier
                    let exe_name = PathBuf::from(&path_str)
                        .file_name()
                        .map(|n| n.to_string_lossy().into_owned())
                        .unwrap_or_else(|| "unknown".to_string());
                    
                    (path_str, exe_name)
                } else {
                    (String::new(), "unknown".to_string())
                }
            } else {
                (String::new(), "unknown".to_string())
            };
            
            // If name is empty or generic, use the executable name
            let display_name = if name.is_empty() || name == "Unknown" {
                // Remove .exe and capitalize
                identifier
                    .trim_end_matches(".exe")
                    .trim_end_matches(".EXE")
                    .to_string()
            } else {
                name
            };
            
            Ok(AppInfo {
                name: display_name,
                identifier,
                path,
                pid: Some(pid),
            })
        }
    }
    
    fn get_idle_time_seconds(&self) -> Result<u64, String> {
        unsafe {
            let mut last_input = LASTINPUTINFO {
                cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32,
                dwTime: 0,
            };
            
            if GetLastInputInfo(&mut last_input).as_bool() {
                let tick_count = windows::Win32::System::SystemInformation::GetTickCount();
                let idle_ms = tick_count - last_input.dwTime;
                Ok((idle_ms / 1000) as u64)
            } else {
                Err("Failed to get last input info".to_string())
            }
        }
    }
    
    fn platform_name(&self) -> &'static str {
        "windows"
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_get_frontmost_app() {
        let monitor = WindowsMonitor::new();
        let result = monitor.get_frontmost_app();
        
        assert!(result.is_ok(), "Should get frontmost app");
        
        let app_info = result.unwrap();
        println!("Current app: {} ({})", app_info.name, app_info.identifier);
        println!("Path: {}", app_info.path);
    }
    
    #[test]
    fn test_get_idle_time() {
        let monitor = WindowsMonitor::new();
        let result = monitor.get_idle_time_seconds();
        
        assert!(result.is_ok(), "Should get idle time");
        println!("Idle time: {} seconds", result.unwrap());
    }
}
```

This is the Windows-specific implementation using Win32 APIs.
```

---

## Step 1.6: Create Fallback Monitor (Unsupported Platforms)

**Create file:** `src-tauri/src/telemetry/platform/fallback.rs`

**Give Cursor this prompt:**

```
Create a fallback monitor for unsupported platforms (Linux, etc.).

Create file: src-tauri/src/telemetry/platform/fallback.rs

```rust
// src-tauri/src/telemetry/platform/fallback.rs

#![cfg(not(any(target_os = "macos", target_os = "windows")))]

use crate::telemetry::types::AppInfo;
use crate::telemetry::platform::PlatformMonitor;

/// Fallback implementation for unsupported platforms
/// Returns errors for all operations
pub struct FallbackMonitor;

impl FallbackMonitor {
    pub fn new() -> Self {
        Self
    }
}

impl Default for FallbackMonitor {
    fn default() -> Self {
        Self::new()
    }
}

impl PlatformMonitor for FallbackMonitor {
    fn get_frontmost_app(&self) -> Result<AppInfo, String> {
        Err("App detection is not supported on this platform. Supported platforms: macOS, Windows".to_string())
    }
    
    fn get_idle_time_seconds(&self) -> Result<u64, String> {
        Err("Idle detection is not supported on this platform. Supported platforms: macOS, Windows".to_string())
    }
    
    fn platform_name(&self) -> &'static str {
        "unsupported"
    }
}
```

This provides a graceful fallback for unsupported platforms.
```

---

## Step 1.7: Update Cargo.toml with Platform Dependencies

**Update file:** `src-tauri/Cargo.toml`

**Give Cursor this prompt:**

```
Update Cargo.toml with platform-specific dependencies for cross-platform support.

Add these dependencies to src-tauri/Cargo.toml:

```toml
[dependencies]
# ... existing dependencies ...

# Cross-platform dependencies
uuid = { version = "1.0", features = ["v4"] }

# macOS-specific dependencies
[target.'cfg(target_os = "macos")'.dependencies]
cocoa = "0.25"
objc = "0.2"
core-graphics = "0.23"

# Windows-specific dependencies  
[target.'cfg(target_os = "windows")'.dependencies]
windows = { version = "0.52", features = [
    "Win32_Foundation",
    "Win32_UI_WindowsAndMessaging",
    "Win32_System_Threading",
    "Win32_System_ProcessStatus",
    "Win32_UI_Input_KeyboardAndMouse",
    "Win32_System_SystemInformation",
]}
```

This configures conditional compilation so:
- macOS builds include cocoa, objc, core-graphics
- Windows builds include the windows crate with required features
- Both platforms share common dependencies
```

---

## Step 1.8: Implement Cross-Platform Monitor Loop

**Create file:** `src-tauri/src/telemetry/monitor_loop.rs`

**Give Cursor this prompt:**

```
Create the monitor loop that uses the platform abstraction.

Create file: src-tauri/src/telemetry/monitor_loop.rs

```rust
// src-tauri/src/telemetry/monitor_loop.rs

use std::sync::{Arc, Mutex, atomic::{AtomicBool, Ordering}};
use std::thread;
use std::time::Duration;
use tauri::AppHandle;

use crate::telemetry::types::{AppInfo, AppChangeEvent, now_ms};
use crate::telemetry::platform::{create_monitor, PlatformMonitor, is_platform_supported};
use crate::telemetry::events::emit_app_changed;

/// Shared state for the monitor
pub struct MonitorState {
    /// Whether the monitor is running
    is_running: Arc<AtomicBool>,
    /// Current session ID
    session_id: Arc<Mutex<Option<String>>>,
    /// Last detected app
    last_app: Arc<Mutex<Option<AppInfo>>>,
    /// Poll interval in milliseconds
    poll_interval_ms: u64,
}

impl MonitorState {
    pub fn new() -> Self {
        Self {
            is_running: Arc::new(AtomicBool::new(false)),
            session_id: Arc::new(Mutex::new(None)),
            last_app: Arc::new(Mutex::new(None)),
            poll_interval_ms: 2000, // 2 seconds
        }
    }
    
    /// Check if monitor is running
    pub fn is_running(&self) -> bool {
        self.is_running.load(Ordering::SeqCst)
    }
    
    /// Start the monitor
    pub fn start(&self, app_handle: AppHandle, session_id: String) -> Result<(), String> {
        // Check platform support
        if !is_platform_supported() {
            return Err("Telemetry is not supported on this platform. Supported: macOS, Windows".to_string());
        }
        
        // Check if already running
        if self.is_running() {
            return Err("Monitor is already running".to_string());
        }
        
        // Set session ID
        {
            let mut sid = self.session_id.lock().map_err(|e| e.to_string())?;
            *sid = Some(session_id);
        }
        
        // Clear last app
        {
            let mut last = self.last_app.lock().map_err(|e| e.to_string())?;
            *last = None;
        }
        
        // Mark as running
        self.is_running.store(true, Ordering::SeqCst);
        
        // Clone Arcs for the thread
        let is_running = self.is_running.clone();
        let session_id_arc = self.session_id.clone();
        let last_app = self.last_app.clone();
        let poll_interval = self.poll_interval_ms;
        
        // Spawn monitor thread
        thread::spawn(move || {
            // Create platform-specific monitor
            let monitor = create_monitor();
            
            println!(
                "[Telemetry] Monitor started on platform: {}", 
                monitor.platform_name()
            );
            
            while is_running.load(Ordering::SeqCst) {
                // Get current frontmost app
                match monitor.get_frontmost_app() {
                    Ok(current_app) => {
                        let mut last = last_app.lock().unwrap();
                        
                        // Check if app changed
                        if let Some(ref prev_app) = *last {
                            if !prev_app.is_same_app(&current_app) {
                                // App changed! Emit event
                                let session_id = session_id_arc.lock().unwrap().clone();
                                
                                let event = AppChangeEvent {
                                    from_app: prev_app.clone(),
                                    to_app: current_app.clone(),
                                    timestamp: now_ms(),
                                    session_id,
                                };
                                
                                println!(
                                    "[Telemetry] App changed: {} -> {}", 
                                    prev_app.name, 
                                    current_app.name
                                );
                                
                                // Emit to frontend
                                if let Err(e) = emit_app_changed(&app_handle, event) {
                                    eprintln!("[Telemetry] Failed to emit event: {}", e);
                                }
                            }
                        }
                        
                        // Update last app
                        *last = Some(current_app);
                    }
                    Err(e) => {
                        eprintln!("[Telemetry] Error getting frontmost app: {}", e);
                    }
                }
                
                // Sleep before next poll
                thread::sleep(Duration::from_millis(poll_interval));
            }
            
            println!("[Telemetry] Monitor stopped");
        });
        
        Ok(())
    }
    
    /// Stop the monitor
    pub fn stop(&self) -> Result<(), String> {
        if !self.is_running() {
            return Err("Monitor is not running".to_string());
        }
        
        self.is_running.store(false, Ordering::SeqCst);
        
        // Clear session ID
        {
            let mut sid = self.session_id.lock().map_err(|e| e.to_string())?;
            *sid = None;
        }
        
        Ok(())
    }
    
    /// Get current session ID
    pub fn get_session_id(&self) -> Option<String> {
        self.session_id.lock().ok().and_then(|s| s.clone())
    }
    
    /// Check if platform is supported
    pub fn is_supported(&self) -> bool {
        is_platform_supported()
    }
}

impl Default for MonitorState {
    fn default() -> Self {
        Self::new()
    }
}
```

This monitor loop uses the platform abstraction to work on both macOS and Windows.
```

---

## Step 1.9: Implement Event Emission

**Create file:** `src-tauri/src/telemetry/events.rs`

**Give Cursor this prompt:**

```
Create the event emission module for Dustoff Reset telemetry.

Create file: src-tauri/src/telemetry/events.rs

```rust
// src-tauri/src/telemetry/events.rs

use tauri::{AppHandle, Manager};
use crate::telemetry::types::{AppChangeEvent, IdleEvent, MonitorErrorEvent};

/// Event name constants
pub const EVENT_APP_CHANGED: &str = "telemetry:app_changed";
pub const EVENT_IDLE_START: &str = "telemetry:idle_start";
pub const EVENT_IDLE_END: &str = "telemetry:idle_end";
pub const EVENT_MONITOR_ERROR: &str = "telemetry:monitor_error";

/// Emit an app change event to the frontend
pub fn emit_app_changed(app_handle: &AppHandle, event: AppChangeEvent) -> Result<(), String> {
    app_handle
        .emit_all(EVENT_APP_CHANGED, event)
        .map_err(|e| format!("Failed to emit app_changed event: {}", e))
}

/// Emit an idle start event to the frontend
pub fn emit_idle_start(app_handle: &AppHandle, event: IdleEvent) -> Result<(), String> {
    app_handle
        .emit_all(EVENT_IDLE_START, event)
        .map_err(|e| format!("Failed to emit idle_start event: {}", e))
}

/// Emit an idle end event to the frontend
pub fn emit_idle_end(app_handle: &AppHandle, event: IdleEvent) -> Result<(), String> {
    app_handle
        .emit_all(EVENT_IDLE_END, event)
        .map_err(|e| format!("Failed to emit idle_end event: {}", e))
}

/// Emit a monitor error event to the frontend
pub fn emit_monitor_error(app_handle: &AppHandle, event: MonitorErrorEvent) -> Result<(), String> {
    app_handle
        .emit_all(EVENT_MONITOR_ERROR, event)
        .map_err(|e| format!("Failed to emit monitor_error event: {}", e))
}
```

This module provides functions to emit typed events to the frontend via Tauri's event system.
```

---

## Step 1.10: Create Placeholder Persistence Module

**Create file:** `src-tauri/src/telemetry/persistence.rs`

**Give Cursor this prompt:**

```
Create a placeholder persistence module for telemetry events.

We'll implement full persistence in Milestone 5. For now, create the module structure.

Create file: src-tauri/src/telemetry/persistence.rs

```rust
// src-tauri/src/telemetry/persistence.rs

use rusqlite::Connection;
use crate::telemetry::types::TelemetryEventRecord;

/// Save a telemetry event to the database
pub fn save_telemetry_event(_conn: &Connection, event: &TelemetryEventRecord) -> Result<(), String> {
    // TODO: Implement in Milestone 5
    println!("[Telemetry] Would save event: {:?}", event.event_type);
    Ok(())
}

/// Get all telemetry events for a session
pub fn get_session_telemetry(_conn: &Connection, _session_id: &str) -> Result<Vec<TelemetryEventRecord>, String> {
    // TODO: Implement in Milestone 5
    Ok(vec![])
}

/// Get offense count for current session
pub fn get_offense_count(_conn: &Connection, _session_id: &str) -> Result<i32, String> {
    // TODO: Implement in Milestone 5
    Ok(0)
}
```

This is a placeholder. Full implementation comes in Milestone 5.
```

---

## Step 1.11: Add Tauri Commands for Telemetry

**Create file:** `src-tauri/src/commands/telemetry.rs`

**Give Cursor this prompt:**

```
Create Tauri commands for telemetry control.

Create file: src-tauri/src/commands/telemetry.rs

```rust
// src-tauri/src/commands/telemetry.rs

use tauri::{command, AppHandle, State};
use std::sync::Mutex;

use crate::telemetry::MonitorState;
use crate::telemetry::platform::is_platform_supported;

/// Global monitor state
pub struct TelemetryState {
    pub monitor: Mutex<MonitorState>,
}

impl TelemetryState {
    pub fn new() -> Self {
        Self {
            monitor: Mutex::new(MonitorState::new()),
        }
    }
}

impl Default for TelemetryState {
    fn default() -> Self {
        Self::new()
    }
}

/// Start the telemetry monitor
#[command]
pub fn start_telemetry_monitor(
    app_handle: AppHandle,
    state: State<TelemetryState>,
    session_id: String,
) -> Result<(), String> {
    let monitor = state.monitor.lock().map_err(|e| e.to_string())?;
    monitor.start(app_handle, session_id)
}

/// Stop the telemetry monitor
#[command]
pub fn stop_telemetry_monitor(
    state: State<TelemetryState>,
) -> Result<(), String> {
    let monitor = state.monitor.lock().map_err(|e| e.to_string())?;
    monitor.stop()
}

/// Check if telemetry monitor is running
#[command]
pub fn is_telemetry_monitor_running(
    state: State<TelemetryState>,
) -> Result<bool, String> {
    let monitor = state.monitor.lock().map_err(|e| e.to_string())?;
    Ok(monitor.is_running())
}

/// Check if current platform supports telemetry
#[command]
pub fn is_telemetry_supported() -> bool {
    is_platform_supported()
}

/// Get current platform name
#[command]
pub fn get_telemetry_platform() -> String {
    crate::telemetry::types::current_platform().to_string()
}
```

Update src-tauri/src/commands/mod.rs to include:
```rust
pub mod telemetry;
pub use telemetry::*;
```
```

---

## Step 1.12: Update main.rs

**Update file:** `src-tauri/src/main.rs`

**Give Cursor this prompt:**

```
Update main.rs to include the telemetry module and commands.

Add these changes to src-tauri/src/main.rs:

1. Add module declaration at the top:
```rust
mod telemetry;
```

2. Import the telemetry commands:
```rust
use commands::telemetry::{
    TelemetryState,
    start_telemetry_monitor,
    stop_telemetry_monitor,
    is_telemetry_monitor_running,
    is_telemetry_supported,
    get_telemetry_platform,
};
```

3. Add TelemetryState to managed state in the builder:
```rust
.manage(TelemetryState::new())
```

4. Add telemetry commands to the invoke_handler:
```rust
.invoke_handler(tauri::generate_handler![
    // ... existing commands ...
    start_telemetry_monitor,
    stop_telemetry_monitor,
    is_telemetry_monitor_running,
    is_telemetry_supported,
    get_telemetry_platform,
])
```

Make sure the telemetry module is properly exported.
```

---

## Step 1.13: Create TypeScript Event Listener

**Create file:** `src/lib/telemetry/telemetry-listener.ts`

**Give Cursor this prompt:**

```
Create the TypeScript telemetry event listener with cross-platform support.

Create file: src/lib/telemetry/telemetry-listener.ts

```typescript
// src/lib/telemetry/telemetry-listener.ts

import { listen, UnlistenFn } from '@tauri-apps/api/event'

// Event names (must match Rust constants)
export const EVENT_APP_CHANGED = 'telemetry:app_changed'
export const EVENT_IDLE_START = 'telemetry:idle_start'
export const EVENT_IDLE_END = 'telemetry:idle_end'
export const EVENT_MONITOR_ERROR = 'telemetry:monitor_error'

/**
 * Cross-platform app information
 * - macOS: identifier is bundle ID (e.g., "com.twitter.twitter-mac")
 * - Windows: identifier is exe name (e.g., "chrome.exe")
 */
export interface AppInfo {
  name: string
  identifier: string
  path: string
  pid: number | null
}

export interface AppChangeEvent {
  from_app: AppInfo
  to_app: AppInfo
  timestamp: number
  session_id: string | null
}

export interface IdleEvent {
  duration_seconds: number
  last_activity_type: string
  timestamp: number
  session_id: string | null
}

export interface MonitorErrorEvent {
  code: string
  message: string
  context: string
  timestamp: number
}

// Handler types
export interface TelemetryHandlers {
  onAppChanged?: (event: AppChangeEvent) => void
  onIdleStart?: (event: IdleEvent) => void
  onIdleEnd?: (event: IdleEvent) => void
  onMonitorError?: (event: MonitorErrorEvent) => void
}

// Listener setup
let unlisteners: UnlistenFn[] = []

/**
 * Setup telemetry event listeners
 * Call this once when the app starts or session begins
 * Returns a cleanup function to remove listeners
 */
export async function setupTelemetryListeners(
  handlers: TelemetryHandlers
): Promise<() => void> {
  // Clean up any existing listeners
  await cleanupTelemetryListeners()
  
  // Setup new listeners
  if (handlers.onAppChanged) {
    const unlisten = await listen<AppChangeEvent>(
      EVENT_APP_CHANGED,
      (event) => {
        console.log('[Telemetry] App changed:', event.payload)
        handlers.onAppChanged?.(event.payload)
      }
    )
    unlisteners.push(unlisten)
  }
  
  if (handlers.onIdleStart) {
    const unlisten = await listen<IdleEvent>(
      EVENT_IDLE_START,
      (event) => {
        console.log('[Telemetry] Idle start:', event.payload)
        handlers.onIdleStart?.(event.payload)
      }
    )
    unlisteners.push(unlisten)
  }
  
  if (handlers.onIdleEnd) {
    const unlisten = await listen<IdleEvent>(
      EVENT_IDLE_END,
      (event) => {
        console.log('[Telemetry] Idle end:', event.payload)
        handlers.onIdleEnd?.(event.payload)
      }
    )
    unlisteners.push(unlisten)
  }
  
  if (handlers.onMonitorError) {
    const unlisten = await listen<MonitorErrorEvent>(
      EVENT_MONITOR_ERROR,
      (event) => {
        console.error('[Telemetry] Monitor error:', event.payload)
        handlers.onMonitorError?.(event.payload)
      }
    )
    unlisteners.push(unlisten)
  }
  
  console.log('[Telemetry] Listeners setup complete')
  
  // Return cleanup function
  return cleanupTelemetryListeners
}

/**
 * Cleanup all telemetry listeners
 */
export async function cleanupTelemetryListeners(): Promise<void> {
  for (const unlisten of unlisteners) {
    unlisten()
  }
  unlisteners = []
  console.log('[Telemetry] Listeners cleaned up')
}
```

This module works identically on both macOS and Windows.
```

---

## Step 1.14: Update Tauri Bridge

**Update file:** `src/lib/tauri-bridge.ts`

**Give Cursor this prompt:**

```
Add telemetry commands to the Tauri bridge with platform support.

Add these methods to src/lib/tauri-bridge.ts in the tauriBridge object:

```typescript
// Telemetry commands
startTelemetryMonitor: async (sessionId: string): Promise<void> => {
  return invoke('start_telemetry_monitor', { sessionId })
},

stopTelemetryMonitor: async (): Promise<void> => {
  return invoke('stop_telemetry_monitor')
},

isTelemetryMonitorRunning: async (): Promise<boolean> => {
  return invoke('is_telemetry_monitor_running')
},

isTelemetrySupported: async (): Promise<boolean> => {
  return invoke('is_telemetry_supported')
},

getTelemetryPlatform: async (): Promise<string> => {
  return invoke('get_telemetry_platform')
},
```

These commands control the Rust telemetry monitor and provide platform information.
```

---

## Step 1.15: Verify Detection Works on Current Platform

**Test the implementation:**

```bash
npm run tauri dev
```

**Give Cursor this prompt:**

```
Create a simple test to verify cross-platform telemetry detection works.

Add this temporary code to App.tsx to test telemetry:

```typescript
// Add at top of App.tsx
import { useEffect, useState } from 'react'
import { setupTelemetryListeners, AppChangeEvent } from '@/lib/telemetry/telemetry-listener'
import { tauriBridge } from '@/lib/tauri-bridge'

// Add inside App component, after other useEffects:
const [platform, setPlatform] = useState<string>('unknown')
const [isSupported, setIsSupported] = useState<boolean>(false)

useEffect(() => {
  // Check platform support
  const checkPlatform = async () => {
    const supported = await tauriBridge.isTelemetrySupported()
    const platformName = await tauriBridge.getTelemetryPlatform()
    setIsSupported(supported)
    setPlatform(platformName)
    console.log(`[Test] Platform: ${platformName}, Supported: ${supported}`)
  }
  checkPlatform()
}, [])

useEffect(() => {
  if (!isSupported) {
    console.log('[Test] Telemetry not supported on this platform')
    return
  }
  
  // Test telemetry on mount
  const testTelemetry = async () => {
    console.log('[Test] Setting up telemetry listeners...')
    
    await setupTelemetryListeners({
      onAppChanged: (event: AppChangeEvent) => {
        console.log('[Test] APP CHANGED!')
        console.log(`  From: ${event.from_app.name} (${event.from_app.identifier})`)
        console.log(`  To: ${event.to_app.name} (${event.to_app.identifier})`)
      },
      onMonitorError: (error) => {
        console.error('[Test] Monitor error:', error)
      },
    })
    
    console.log('[Test] Starting telemetry monitor...')
    try {
      await tauriBridge.startTelemetryMonitor('test-session-123')
      console.log('[Test] Monitor started!')
    } catch (error) {
      console.error('[Test] Failed to start monitor:', error)
    }
  }
  
  testTelemetry()
  
  return () => {
    tauriBridge.stopTelemetryMonitor().catch(console.error)
  }
}, [isSupported])
```

Now test on your current platform:

**On macOS:**
1. Run `npm run tauri dev`
2. Open the browser console
3. Should see: "Platform: macos, Supported: true"
4. Switch to another app (e.g., Twitter, Chrome)
5. Should see: "APP CHANGED! From: ... To: ..."

**On Windows:**
1. Run `npm run tauri dev`
2. Open the browser console
3. Should see: "Platform: windows, Supported: true"
4. Switch to another app (e.g., Chrome, Discord)
5. Should see: "APP CHANGED! From: ... To: ..."

Expected output format differs by platform:
- macOS: identifier = "com.twitter.twitter-mac"
- Windows: identifier = "chrome.exe"

If this works, Milestone 1 is complete!
```

---

## Milestone 1 Checkpoint

**Verify on your platform:**
- [ ] `npm run tauri dev` runs without errors
- [ ] Console shows correct platform name
- [ ] Console shows "Supported: true"
- [ ] Console shows "Monitor started!" on app launch
- [ ] Switching apps shows "APP CHANGED!" in console
- [ ] App names and identifiers are correct for your platform

**If checkpoint passes, continue to Milestone 2.**

---

# Milestone 2: Classification & Penalties

**Goal:** App switches cause correct bandwidth changes based on mode
**Time:** 3-4 hours
**Checkpoint:** Open Twitter → bandwidth drops by mode-appropriate amount

---

## Step 2.1: Create Cross-Platform App Categories

**Create file:** `src/lib/telemetry/app-categories.ts`

**Give Cursor this prompt:**

```
Create the app category definitions with cross-platform support.

Create file: src/lib/telemetry/app-categories.ts

```typescript
// src/lib/telemetry/app-categories.ts

import { AppInfo } from './telemetry-listener'

/**
 * App categories from least to most distracting
 */
export enum AppCategory {
  PRODUCTIVE = 'productive',
  NEUTRAL = 'neutral',
  COMMUNICATION = 'communication',
  SOCIAL_MEDIA = 'social_media',
  ENTERTAINMENT = 'entertainment',
  GAMING = 'gaming',
  UNKNOWN = 'unknown',
}

/**
 * macOS Bundle ID to category mapping
 */
export const MACOS_BUNDLE_CATEGORIES: Record<string, AppCategory> = {
  // === PRODUCTIVE ===
  // IDEs & Editors
  'com.microsoft.VSCode': AppCategory.PRODUCTIVE,
  'com.microsoft.VSCodeInsiders': AppCategory.PRODUCTIVE,
  'com.apple.dt.Xcode': AppCategory.PRODUCTIVE,
  'com.sublimetext.4': AppCategory.PRODUCTIVE,
  'com.sublimetext.3': AppCategory.PRODUCTIVE,
  'com.jetbrains.intellij': AppCategory.PRODUCTIVE,
  'com.jetbrains.WebStorm': AppCategory.PRODUCTIVE,
  'com.jetbrains.pycharm': AppCategory.PRODUCTIVE,
  'com.github.atom': AppCategory.PRODUCTIVE,
  'abnerworks.Typora': AppCategory.PRODUCTIVE,
  'com.cursor.Cursor': AppCategory.PRODUCTIVE,
  
  // Terminals
  'com.apple.Terminal': AppCategory.PRODUCTIVE,
  'com.googlecode.iterm2': AppCategory.PRODUCTIVE,
  'dev.warp.Warp-Stable': AppCategory.PRODUCTIVE,
  'co.zeit.hyper': AppCategory.PRODUCTIVE,
  
  // Design
  'com.figma.Desktop': AppCategory.PRODUCTIVE,
  'com.bohemiancoding.sketch3': AppCategory.PRODUCTIVE,
  'com.adobe.illustrator': AppCategory.PRODUCTIVE,
  'com.adobe.Photoshop': AppCategory.PRODUCTIVE,
  
  // Notes & Docs
  'notion.id': AppCategory.PRODUCTIVE,
  'md.obsidian': AppCategory.PRODUCTIVE,
  'com.apple.Notes': AppCategory.PRODUCTIVE,
  'com.apple.iWork.Pages': AppCategory.PRODUCTIVE,
  'com.microsoft.Word': AppCategory.PRODUCTIVE,
  
  // Project Management
  'com.linear': AppCategory.PRODUCTIVE,
  
  // Development Tools
  'com.apple.dt.Instruments': AppCategory.PRODUCTIVE,
  'com.postmanlabs.mac': AppCategory.PRODUCTIVE,
  'com.docker.docker': AppCategory.PRODUCTIVE,
  
  // === NEUTRAL ===
  'com.apple.finder': AppCategory.NEUTRAL,
  'com.apple.Preview': AppCategory.NEUTRAL,
  'com.apple.calculator': AppCategory.NEUTRAL,
  'com.apple.systempreferences': AppCategory.NEUTRAL,
  'com.apple.ActivityMonitor': AppCategory.NEUTRAL,
  'com.apple.iCal': AppCategory.NEUTRAL,
  'com.1password.1password': AppCategory.NEUTRAL,
  
  // Browsers (neutral by default)
  'com.google.Chrome': AppCategory.NEUTRAL,
  'com.apple.Safari': AppCategory.NEUTRAL,
  'org.mozilla.firefox': AppCategory.NEUTRAL,
  'com.brave.Browser': AppCategory.NEUTRAL,
  'company.thebrowser.Browser': AppCategory.NEUTRAL, // Arc
  
  // === COMMUNICATION ===
  'com.tinyspeck.slackmacgap': AppCategory.COMMUNICATION,
  'com.hnc.Discord': AppCategory.COMMUNICATION,
  'com.apple.MobileSMS': AppCategory.COMMUNICATION,
  'com.apple.mail': AppCategory.COMMUNICATION,
  'com.microsoft.Outlook': AppCategory.COMMUNICATION,
  'us.zoom.xos': AppCategory.COMMUNICATION,
  'com.microsoft.teams': AppCategory.COMMUNICATION,
  'ru.keepcoder.Telegram': AppCategory.COMMUNICATION,
  'net.whatsapp.WhatsApp': AppCategory.COMMUNICATION,
  
  // === SOCIAL MEDIA ===
  'com.twitter.twitter-mac': AppCategory.SOCIAL_MEDIA,
  'com.atebits.Tweetie2': AppCategory.SOCIAL_MEDIA,
  'com.facebook.Facebook': AppCategory.SOCIAL_MEDIA,
  'com.burbn.instagram': AppCategory.SOCIAL_MEDIA,
  'com.zhiliaoapp.musically': AppCategory.SOCIAL_MEDIA, // TikTok
  'com.linkedin.LinkedIn': AppCategory.SOCIAL_MEDIA,
  
  // === ENTERTAINMENT ===
  'com.spotify.client': AppCategory.ENTERTAINMENT,
  'com.apple.Music': AppCategory.ENTERTAINMENT,
  'com.netflix.Netflix': AppCategory.ENTERTAINMENT,
  'tv.twitch.TwitchApp': AppCategory.ENTERTAINMENT,
  'com.reddit.Reddit': AppCategory.ENTERTAINMENT,
  'com.apple.TV': AppCategory.ENTERTAINMENT,
  
  // === GAMING ===
  'com.valvesoftware.steam': AppCategory.GAMING,
  'com.epicgames.EpicGamesLauncher': AppCategory.GAMING,
  'com.blizzard.bnetlauncher': AppCategory.GAMING,
}

/**
 * Windows executable name to category mapping
 * Keys should be lowercase .exe names
 */
export const WINDOWS_EXE_CATEGORIES: Record<string, AppCategory> = {
  // === PRODUCTIVE ===
  // IDEs & Editors
  'code.exe': AppCategory.PRODUCTIVE,
  'code - insiders.exe': AppCategory.PRODUCTIVE,
  'devenv.exe': AppCategory.PRODUCTIVE, // Visual Studio
  'idea64.exe': AppCategory.PRODUCTIVE,
  'webstorm64.exe': AppCategory.PRODUCTIVE,
  'pycharm64.exe': AppCategory.PRODUCTIVE,
  'sublime_text.exe': AppCategory.PRODUCTIVE,
  'atom.exe': AppCategory.PRODUCTIVE,
  'cursor.exe': AppCategory.PRODUCTIVE,
  'notepad++.exe': AppCategory.PRODUCTIVE,
  
  // Terminals
  'windowsterminal.exe': AppCategory.PRODUCTIVE,
  'cmd.exe': AppCategory.PRODUCTIVE,
  'powershell.exe': AppCategory.PRODUCTIVE,
  'pwsh.exe': AppCategory.PRODUCTIVE,
  'warp.exe': AppCategory.PRODUCTIVE,
  
  // Design
  'figma.exe': AppCategory.PRODUCTIVE,
  'illustrator.exe': AppCategory.PRODUCTIVE,
  'photoshop.exe': AppCategory.PRODUCTIVE,
  
  // Notes & Docs
  'notion.exe': AppCategory.PRODUCTIVE,
  'obsidian.exe': AppCategory.PRODUCTIVE,
  'winword.exe': AppCategory.PRODUCTIVE, // Microsoft Word
  'excel.exe': AppCategory.PRODUCTIVE,
  'powerpnt.exe': AppCategory.PRODUCTIVE,
  'onenote.exe': AppCategory.PRODUCTIVE,
  
  // Development Tools
  'docker desktop.exe': AppCategory.PRODUCTIVE,
  'postman.exe': AppCategory.PRODUCTIVE,
  
  // === NEUTRAL ===
  'explorer.exe': AppCategory.NEUTRAL,
  'systemsettings.exe': AppCategory.NEUTRAL,
  'taskmgr.exe': AppCategory.NEUTRAL,
  'calc.exe': AppCategory.NEUTRAL,
  '1password.exe': AppCategory.NEUTRAL,
  'bitwarden.exe': AppCategory.NEUTRAL,
  
  // Browsers (neutral by default)
  'chrome.exe': AppCategory.NEUTRAL,
  'msedge.exe': AppCategory.NEUTRAL,
  'firefox.exe': AppCategory.NEUTRAL,
  'brave.exe': AppCategory.NEUTRAL,
  'arc.exe': AppCategory.NEUTRAL,
  'opera.exe': AppCategory.NEUTRAL,
  
  // === COMMUNICATION ===
  'slack.exe': AppCategory.COMMUNICATION,
  'discord.exe': AppCategory.COMMUNICATION,
  'teams.exe': AppCategory.COMMUNICATION,
  'outlook.exe': AppCategory.COMMUNICATION,
  'zoom.exe': AppCategory.COMMUNICATION,
  'telegram.exe': AppCategory.COMMUNICATION,
  'whatsapp.exe': AppCategory.COMMUNICATION,
  'signal.exe': AppCategory.COMMUNICATION,
  'skype.exe': AppCategory.COMMUNICATION,
  
  // === SOCIAL MEDIA ===
  'twitter.exe': AppCategory.SOCIAL_MEDIA,
  'facebook.exe': AppCategory.SOCIAL_MEDIA,
  'instagram.exe': AppCategory.SOCIAL_MEDIA,
  'tiktok.exe': AppCategory.SOCIAL_MEDIA,
  'linkedin.exe': AppCategory.SOCIAL_MEDIA,
  
  // === ENTERTAINMENT ===
  'spotify.exe': AppCategory.ENTERTAINMENT,
  'netflix.exe': AppCategory.ENTERTAINMENT,
  'twitch.exe': AppCategory.ENTERTAINMENT,
  'vlc.exe': AppCategory.ENTERTAINMENT,
  'wmplayer.exe': AppCategory.ENTERTAINMENT,
  
  // === GAMING ===
  'steam.exe': AppCategory.GAMING,
  'steamwebhelper.exe': AppCategory.GAMING,
  'epicgameslauncher.exe': AppCategory.GAMING,
  'battle.net.exe': AppCategory.GAMING,
  'riotclientservices.exe': AppCategory.GAMING,
  'origin.exe': AppCategory.GAMING,
  'gog galaxy.exe': AppCategory.GAMING,
}

/**
 * Fallback: check app name keywords (works on both platforms)
 * Keys should be lowercase
 */
export const APP_NAME_KEYWORDS: Record<string, AppCategory> = {
  // Social Media
  'twitter': AppCategory.SOCIAL_MEDIA,
  'tweetbot': AppCategory.SOCIAL_MEDIA,
  'facebook': AppCategory.SOCIAL_MEDIA,
  'instagram': AppCategory.SOCIAL_MEDIA,
  'tiktok': AppCategory.SOCIAL_MEDIA,
  'linkedin': AppCategory.SOCIAL_MEDIA,
  'snapchat': AppCategory.SOCIAL_MEDIA,
  
  // Entertainment
  'youtube': AppCategory.ENTERTAINMENT,
  'netflix': AppCategory.ENTERTAINMENT,
  'spotify': AppCategory.ENTERTAINMENT,
  'twitch': AppCategory.ENTERTAINMENT,
  'reddit': AppCategory.ENTERTAINMENT,
  'hulu': AppCategory.ENTERTAINMENT,
  'disney': AppCategory.ENTERTAINMENT,
  'prime video': AppCategory.ENTERTAINMENT,
  
  // Communication
  'slack': AppCategory.COMMUNICATION,
  'discord': AppCategory.COMMUNICATION,
  'zoom': AppCategory.COMMUNICATION,
  'teams': AppCategory.COMMUNICATION,
  'telegram': AppCategory.COMMUNICATION,
  'whatsapp': AppCategory.COMMUNICATION,
  'messenger': AppCategory.COMMUNICATION,
  'outlook': AppCategory.COMMUNICATION,
  'mail': AppCategory.COMMUNICATION,
  
  // Productive
  'code': AppCategory.PRODUCTIVE,
  'vscode': AppCategory.PRODUCTIVE,
  'visual studio': AppCategory.PRODUCTIVE,
  'xcode': AppCategory.PRODUCTIVE,
  'terminal': AppCategory.PRODUCTIVE,
  'iterm': AppCategory.PRODUCTIVE,
  'figma': AppCategory.PRODUCTIVE,
  'notion': AppCategory.PRODUCTIVE,
  'obsidian': AppCategory.PRODUCTIVE,
  
  // Gaming
  'steam': AppCategory.GAMING,
  'epic games': AppCategory.GAMING,
  'battle.net': AppCategory.GAMING,
  'riot': AppCategory.GAMING,
}

/**
 * Detect current platform
 */
function isMacOS(): boolean {
  return navigator.platform.toLowerCase().includes('mac')
}

function isWindows(): boolean {
  return navigator.platform.toLowerCase().includes('win')
}

/**
 * Get the category for an app (cross-platform)
 */
export function getAppCategory(appInfo: AppInfo): AppCategory {
  const identifier = appInfo.identifier.toLowerCase()
  
  // Try platform-specific lookup first
  if (isMacOS()) {
    // macOS: identifier is bundle ID
    if (MACOS_BUNDLE_CATEGORIES[appInfo.identifier]) {
      return MACOS_BUNDLE_CATEGORIES[appInfo.identifier]
    }
  } else if (isWindows()) {
    // Windows: identifier is exe name
    if (WINDOWS_EXE_CATEGORIES[identifier]) {
      return WINDOWS_EXE_CATEGORIES[identifier]
    }
  }
  
  // Fallback: check app name keywords (works on both platforms)
  const nameLower = appInfo.name.toLowerCase()
  for (const [keyword, category] of Object.entries(APP_NAME_KEYWORDS)) {
    if (nameLower.includes(keyword) || identifier.includes(keyword)) {
      return category
    }
  }
  
  // Default to unknown
  return AppCategory.UNKNOWN
}

/**
 * Check if a category is considered a distraction
 */
export function isDistraction(category: AppCategory): boolean {
  return [
    AppCategory.SOCIAL_MEDIA,
    AppCategory.ENTERTAINMENT,
    AppCategory.GAMING,
  ].includes(category)
}

/**
 * Check if a category requires intervention based on mode
 */
export function requiresIntervention(
  category: AppCategory, 
  mode: 'Zen' | 'Flow' | 'Legend'
): boolean {
  if (mode === 'Zen') {
    return false // Zen never blocks
  }
  
  if (mode === 'Flow') {
    return isDistraction(category) // Flow blocks distractions
  }
  
  if (mode === 'Legend') {
    // Legend blocks distractions AND communication
    return isDistraction(category) || category === AppCategory.COMMUNICATION
  }
  
  return false
}

/**
 * Get distraction level (0-5) for a category
 */
export function getDistractionLevel(category: AppCategory): number {
  switch (category) {
    case AppCategory.PRODUCTIVE: return 0
    case AppCategory.NEUTRAL: return 1
    case AppCategory.COMMUNICATION: return 2
    case AppCategory.SOCIAL_MEDIA: return 4
    case AppCategory.ENTERTAINMENT: return 5
    case AppCategory.GAMING: return 5
    case AppCategory.UNKNOWN: return 3
    default: return 3
  }
}
```

This module provides cross-platform app categorization:
- macOS uses bundle IDs (e.g., "com.twitter.twitter-mac")
- Windows uses exe names (e.g., "twitter.exe", "chrome.exe")
- Fallback uses name keywords for both platforms
```

---

## Step 2.2: Create Mode Weights Configuration

**Create file:** `src/lib/telemetry/mode-weights.ts`

**Give Cursor this prompt:**

```
Create the mode weights configuration. This is platform-agnostic.

Create file: src/lib/telemetry/mode-weights.ts

```typescript
// src/lib/telemetry/mode-weights.ts

/**
 * Mode type
 */
export type Mode = 'Zen' | 'Flow' | 'Legend'

/**
 * Weight configuration for each mode
 */
export interface ModeWeights {
  /** Multiplier for passive drains (entropy) */
  drainWeight: number
  /** Multiplier for penalties (app switches, friction) */
  penaltyWeight: number
  /** Multiplier for bonuses (focus, flow, resistance) */
  bonusWeight: number
}

/**
 * Mode weight configurations
 * 
 * Zen: Training ground - gentle, forgiving
 * Flow: Proving ground - balanced, moderate accountability
 * Legend: The arena - harsh, unforgiving
 */
export const MODE_WEIGHTS: Record<Mode, ModeWeights> = {
  Zen: {
    drainWeight: 1.0,    // Normal entropy
    penaltyWeight: 1.0,  // Normal penalties
    bonusWeight: 1.25,   // Generous bonuses (encourage good behavior)
  },
  Flow: {
    drainWeight: 1.0,    // Normal entropy
    penaltyWeight: 1.25, // Elevated penalties (distractions cost more)
    bonusWeight: 1.0,    // Normal bonuses
  },
  Legend: {
    drainWeight: 1.25,   // Faster entropy (time is enemy)
    penaltyWeight: 1.5,  // Severe penalties (every slip cuts deep)
    bonusWeight: 0.75,   // Reduced bonuses (glory is earned)
  },
}

/**
 * Get weights for a mode
 */
export function getModeWeights(mode: Mode): ModeWeights {
  return MODE_WEIGHTS[mode]
}

/**
 * Get the penalty weight for a mode
 */
export function getPenaltyWeight(mode: Mode): number {
  return MODE_WEIGHTS[mode].penaltyWeight
}

/**
 * Get the bonus weight for a mode
 */
export function getBonusWeight(mode: Mode): number {
  return MODE_WEIGHTS[mode].bonusWeight
}

/**
 * Get the drain weight for a mode
 */
export function getDrainWeight(mode: Mode): number {
  return MODE_WEIGHTS[mode].drainWeight
}
```
```

---

## Step 2.3: Create Base Penalties Configuration

**Create file:** `src/lib/telemetry/penalties.ts`

**Give Cursor this prompt:**

```
Create the base penalties and bonuses configuration. This is platform-agnostic.

Create file: src/lib/telemetry/penalties.ts

```typescript
// src/lib/telemetry/penalties.ts

/**
 * Base penalty values (before mode weight applied)
 * Negative numbers = bandwidth loss
 */
export const BASE_PENALTIES = {
  // App switches by category
  app_switch_productive: 0,        // No penalty for productive apps
  app_switch_neutral: -2,          // Minor penalty
  app_switch_communication: -4,    // Moderate penalty
  app_switch_social_media: -8,     // Significant penalty
  app_switch_entertainment: -10,   // Heavy penalty
  app_switch_gaming: -12,          // Heaviest penalty
  app_switch_unknown: -3,          // Unknown apps get moderate penalty
  app_switch_non_whitelist: -5,    // Not on whitelist
  
  // Block attempts (Legend mode)
  block_attempt: -10,              // Tried to open blocked app
  repeated_block_attempt: -15,     // Tried again
  bypass_attempt: -20,             // Tried to circumvent blocking
  
  // Rapid switching
  rapid_switch: -3,                // 3rd+ switch in 2 minutes
} as const

/**
 * Base bonus values (before mode weight applied)
 * Positive numbers = bandwidth gain
 */
export const BASE_BONUSES = {
  // Intervention responses
  delay_gate_returned: 5,          // Chose to return from delay gate
  block_accepted: 3,               // Accepted block without rage
  quick_return: 2,                 // Returned to work < 10 seconds
  temptation_resisted: 4,          // Hovered but didn't click
  
  // Self-correction
  self_close_distraction: 3,       // Closed distraction app yourself
} as const

/**
 * Escalation multipliers based on offense number
 * Applied to penalties for distractions
 */
export const ESCALATION_MULTIPLIERS = [
  1.0,    // 1st offense - full penalty
  1.15,   // 2nd offense - 15% more
  1.3,    // 3rd offense - 30% more
  1.4,    // 4th offense - 40% more
  1.5,    // 5th offense - 50% more
  1.5,    // 6th+ offense - capped at 50%
] as const

/**
 * Delay gate timing based on offense number (Flow mode)
 * In seconds
 */
export const DELAY_GATE_SECONDS = [
  10,     // 1st offense - 10 seconds
  15,     // 2nd offense - 15 seconds
  20,     // 3rd offense - 20 seconds
  30,     // 4th+ offense - 30 seconds (capped)
] as const

/**
 * Session extension triggers (Legend mode)
 * Offense numbers that trigger +5 minute extension
 */
export const EXTENSION_TRIGGERS = [3, 6, 9, 12] as const

/**
 * Get escalation multiplier for offense number
 */
export function getEscalationMultiplier(offenseNumber: number): number {
  const index = Math.min(
    Math.max(0, offenseNumber - 1),
    ESCALATION_MULTIPLIERS.length - 1
  )
  return ESCALATION_MULTIPLIERS[index]
}

/**
 * Get delay gate seconds for offense number
 */
export function getDelayGateSeconds(offenseNumber: number): number {
  const index = Math.min(
    Math.max(0, offenseNumber - 1),
    DELAY_GATE_SECONDS.length - 1
  )
  return DELAY_GATE_SECONDS[index]
}

/**
 * Check if offense number triggers session extension
 */
export function triggersExtension(offenseNumber: number): boolean {
  return EXTENSION_TRIGGERS.includes(offenseNumber as typeof EXTENSION_TRIGGERS[number])
}

/**
 * Get penalty key for app category
 */
export function getPenaltyKeyForCategory(category: string): keyof typeof BASE_PENALTIES {
  const mapping: Record<string, keyof typeof BASE_PENALTIES> = {
    productive: 'app_switch_productive',
    neutral: 'app_switch_neutral',
    communication: 'app_switch_communication',
    social_media: 'app_switch_social_media',
    entertainment: 'app_switch_entertainment',
    gaming: 'app_switch_gaming',
    unknown: 'app_switch_unknown',
  }
  return mapping[category] || 'app_switch_unknown'
}
```
```

---

## Step 2.4: Create Penalty Calculator

**Create file:** `src/lib/telemetry/penalty-calculator.ts`

**Give Cursor this prompt:**

```
Create the penalty calculator module. This is platform-agnostic.

Create file: src/lib/telemetry/penalty-calculator.ts

```typescript
// src/lib/telemetry/penalty-calculator.ts

import { AppCategory, isDistraction, getAppCategory } from './app-categories'
import { Mode, getModeWeights } from './mode-weights'
import {
  BASE_PENALTIES,
  BASE_BONUSES,
  getEscalationMultiplier,
  getDelayGateSeconds,
  getPenaltyKeyForCategory,
  triggersExtension,
} from './penalties'
import { AppInfo } from './telemetry-listener'

/**
 * Result of a penalty calculation
 */
export interface PenaltyResult {
  basePenalty: number
  modeWeight: number
  escalationMultiplier: number
  finalPenalty: number
  category: AppCategory
  penaltyType: string
}

/**
 * Result of a bonus calculation
 */
export interface BonusResult {
  baseBonus: number
  modeWeight: number
  finalBonus: number
  bonusType: string
}

/**
 * Intervention configuration
 */
export interface InterventionConfig {
  type: 'delay_gate' | 'block_screen' | 'communication_warning' | 'none'
  delaySeconds?: number
  canWaitThrough: boolean
  triggerExtension: boolean
  extensionMinutes: number
  message?: string
}

/**
 * Calculate the penalty for an app switch
 */
export function calculateAppSwitchPenalty(
  toApp: AppInfo,
  mode: Mode,
  offenseNumber: number,
  isWhitelisted: boolean = false
): PenaltyResult {
  // Get category
  const category = getAppCategory(toApp)
  
  // If whitelisted, no penalty
  if (isWhitelisted) {
    return {
      basePenalty: 0,
      modeWeight: 1,
      escalationMultiplier: 1,
      finalPenalty: 0,
      category,
      penaltyType: 'whitelisted',
    }
  }
  
  // If productive, no penalty
  if (category === AppCategory.PRODUCTIVE) {
    return {
      basePenalty: 0,
      modeWeight: 1,
      escalationMultiplier: 1,
      finalPenalty: 0,
      category,
      penaltyType: 'productive',
    }
  }
  
  // Get base penalty for category
  const penaltyKey = getPenaltyKeyForCategory(category)
  const basePenalty = BASE_PENALTIES[penaltyKey]
  
  // Get mode weight
  const modeWeight = getModeWeights(mode).penaltyWeight
  
  // Get escalation (only for distractions)
  const escalationMultiplier = isDistraction(category)
    ? getEscalationMultiplier(offenseNumber)
    : 1.0
  
  // Calculate final penalty
  const finalPenalty = Math.round(
    basePenalty * modeWeight * escalationMultiplier * 10
  ) / 10
  
  return {
    basePenalty,
    modeWeight,
    escalationMultiplier,
    finalPenalty,
    category,
    penaltyType: penaltyKey,
  }
}

/**
 * Calculate a bonus
 */
export function calculateBonus(
  bonusType: keyof typeof BASE_BONUSES,
  mode: Mode
): BonusResult {
  const baseBonus = BASE_BONUSES[bonusType]
  const modeWeight = getModeWeights(mode).bonusWeight
  const finalBonus = Math.round(baseBonus * modeWeight * 10) / 10
  
  return {
    baseBonus,
    modeWeight,
    finalBonus,
    bonusType,
  }
}

/**
 * Get intervention configuration for an app switch
 */
export function getInterventionConfig(
  toApp: AppInfo,
  mode: Mode,
  offenseNumber: number,
  communicationUsed: boolean = false
): InterventionConfig {
  const category = getAppCategory(toApp)
  
  // Zen mode: never intervene
  if (mode === 'Zen') {
    return {
      type: 'none',
      canWaitThrough: true,
      triggerExtension: false,
      extensionMinutes: 0,
    }
  }
  
  // Not a distraction or communication: no intervention
  if (!isDistraction(category) && category !== AppCategory.COMMUNICATION) {
    return {
      type: 'none',
      canWaitThrough: true,
      triggerExtension: false,
      extensionMinutes: 0,
    }
  }
  
  // Flow mode: delay gate for distractions
  if (mode === 'Flow') {
    if (isDistraction(category)) {
      return {
        type: 'delay_gate',
        delaySeconds: getDelayGateSeconds(offenseNumber),
        canWaitThrough: true,
        triggerExtension: false,
        extensionMinutes: 0,
        message: getDelayGateMessage(offenseNumber),
      }
    }
    // Flow allows communication without intervention
    return {
      type: 'none',
      canWaitThrough: true,
      triggerExtension: false,
      extensionMinutes: 0,
    }
  }
  
  // Legend mode: strict enforcement
  if (mode === 'Legend') {
    // Communication: warning first time, then block
    if (category === AppCategory.COMMUNICATION) {
      if (!communicationUsed) {
        return {
          type: 'communication_warning',
          delaySeconds: 30,
          canWaitThrough: true,
          triggerExtension: false,
          extensionMinutes: 0,
          message: 'You have 30 seconds. After that, communication apps are blocked.',
        }
      } else {
        return {
          type: 'block_screen',
          canWaitThrough: false,
          triggerExtension: triggersExtension(offenseNumber),
          extensionMinutes: triggersExtension(offenseNumber) ? 5 : 0,
          message: 'Communication apps are blocked for this session.',
        }
      }
    }
    
    // Distractions: always block
    if (isDistraction(category)) {
      return {
        type: 'block_screen',
        canWaitThrough: false,
        triggerExtension: triggersExtension(offenseNumber),
        extensionMinutes: triggersExtension(offenseNumber) ? 5 : 0,
        message: getBlockMessage(offenseNumber, toApp.name),
      }
    }
  }
  
  // Default: no intervention
  return {
    type: 'none',
    canWaitThrough: true,
    triggerExtension: false,
    extensionMinutes: 0,
  }
}

/**
 * Get delay gate message based on offense number
 */
function getDelayGateMessage(offenseNumber: number): string {
  switch (offenseNumber) {
    case 1:
      return 'Wait to continue, or return to work.'
    case 2:
      return 'Second time. Is this worth it?'
    case 3:
      return "You're slipping."
    default:
      return "Don't let yourself down."
  }
}

/**
 * Get block message based on offense number
 */
function getBlockMessage(offenseNumber: number, appName: string): string {
  switch (offenseNumber) {
    case 1:
      return `${appName} is blocked.`
    case 2:
      return `Again? ${appName} is blocked.`
    case 3:
      return 'Session extended +5 minutes.'
    case 4:
    case 5:
      return "You're fighting yourself."
    default:
      return 'The wall is here to help you.'
  }
}

/**
 * Check if an app switch should be penalized
 */
export function shouldPenalize(
  toApp: AppInfo,
  mode: Mode,
  isWhitelisted: boolean = false
): boolean {
  if (isWhitelisted) return false
  
  const category = getAppCategory(toApp)
  
  // Never penalize productive apps
  if (category === AppCategory.PRODUCTIVE) return false
  
  return true
}
```
```

---

## Step 2.5: Create Telemetry Module Index

**Create file:** `src/lib/telemetry/index.ts`

**Give Cursor this prompt:**

```
Create the telemetry module index to export all utilities.

Create file: src/lib/telemetry/index.ts

```typescript
// src/lib/telemetry/index.ts

// Types and listener
export * from './telemetry-listener'

// App categories (cross-platform)
export * from './app-categories'

// Mode weights
export * from './mode-weights'

// Penalties and bonuses
export * from './penalties'

// Calculator
export * from './penalty-calculator'
```
```

---

## Steps 2.6 - 2.8: Create useTelemetry Hook and Wire Up

Continue with the same prompts from the original walkthrough for:
- Step 2.6: Create useTelemetry Hook
- Step 2.7: Integrate with Bandwidth Engine
- Step 2.8: Test Classification and Penalties

**The code for these steps is platform-agnostic and doesn't require changes.**

---

## Milestone 2 Checkpoint

**Verify on your platform:**
- [ ] Twitter/social apps trigger social_media category
- [ ] Chrome/browsers trigger neutral category
- [ ] VS Code/IDEs trigger productive category (no penalty)
- [ ] Penalties apply correctly based on mode
- [ ] Bandwidth updates when penalties applied

**Platform-specific verification:**
- **macOS:** Categories match bundle IDs
- **Windows:** Categories match .exe names

---

# Milestones 3-6: UI Components

**Milestones 3-6 are platform-agnostic** since they only involve React components and TypeScript logic. Use the same prompts from the original walkthrough for:

- **Milestone 3:** Delay Gate (Flow Mode)
- **Milestone 4:** Block Screen (Legend Mode)
- **Milestone 5:** Escalation & Tracking
- **Milestone 6:** Integration & Polish

---

## Phase 4.5 Cross-Platform Summary

### What's Platform-Specific

| Component | macOS | Windows |
|-----------|-------|---------|
| App detection API | NSWorkspace | GetForegroundWindow |
| Idle detection API | CGEventSource | GetLastInputInfo |
| App identifier | Bundle ID | .exe name |
| App categories | MACOS_BUNDLE_CATEGORIES | WINDOWS_EXE_CATEGORIES |

### What's Platform-Agnostic

| Component | Notes |
|-----------|-------|
| Types (AppInfo, etc.) | Shared across platforms |
| Event emission | Tauri handles cross-platform |
| Monitor loop logic | Uses platform abstraction |
| Penalty calculator | Pure TypeScript |
| Mode weights | Pure TypeScript |
| UI components | React, works everywhere |
| Database schema | SQLite, works everywhere |

### Testing on Both Platforms

To test on the other platform:

```bash
# On macOS, build for macOS
npm run tauri build

# On Windows, build for Windows
npm run tauri build
```

Or use CI/CD to build for both platforms automatically.

---

## Additional Windows Notes

### Windows-Specific Considerations

1. **Permissions:** Windows doesn't require accessibility permissions like macOS
2. **App Names:** Windows window titles are often more descriptive than macOS
3. **Exe Names:** Some apps have different exe names (e.g., "msedge.exe" for Edge)
4. **UWP Apps:** Modern Windows apps may have different identifiers

### Expanding Windows Support

To add more Windows apps, update `WINDOWS_EXE_CATEGORIES` in `app-categories.ts`:

```typescript
// Add more Windows apps as needed
'newapp.exe': AppCategory.SOCIAL_MEDIA,
```

---

## Phase 4.5 Complete! 🎉

You now have a **cross-platform** telemetry and enforcement system that works on both macOS and Windows from day one.

**Files Created:**

```
src-tauri/src/telemetry/
├── mod.rs
├── types.rs
├── events.rs
├── monitor_loop.rs
├── persistence.rs
└── platform/
    ├── mod.rs
    ├── macos.rs
    ├── windows.rs
    └── fallback.rs

src/lib/telemetry/
├── index.ts
├── telemetry-listener.ts
├── app-categories.ts      # Cross-platform!
├── mode-weights.ts
├── penalties.ts
└── penalty-calculator.ts

src/components/interventions/
├── DelayGate.tsx
├── BlockScreen.tsx
└── index.ts

src/hooks/
└── useTelemetry.ts
```
