// src-tauri/src/telemetry/platform/mod.rs
// Platform abstraction layer for cross-platform app detection

use super::types::ActiveAppInfo;

// App discovery module
pub mod apps;
pub use apps::{InstalledApp, get_installed_apps, get_installed_browsers};

/// Platform-specific monitor trait
/// Implemented by each platform (macOS, Windows)
pub trait PlatformMonitor: Send + Sync {
    /// Get the currently active (frontmost) application
    fn get_frontmost_app(&self) -> Result<ActiveAppInfo, String>;
    
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

// Fallback for unsupported platforms (Linux, etc.)
#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub mod fallback;

// Re-export the native monitor for the current platform
#[cfg(target_os = "macos")]
pub use macos::MacOSMonitor as NativeMonitor;

#[cfg(target_os = "windows")]
pub use windows::WindowsMonitor as NativeMonitor;

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
