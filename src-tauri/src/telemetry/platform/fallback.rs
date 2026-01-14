// src-tauri/src/telemetry/platform/fallback.rs
// Fallback implementation for unsupported platforms (Linux, etc.)

#![cfg(not(any(target_os = "macos", target_os = "windows")))]

use crate::telemetry::types::ActiveAppInfo;
use crate::telemetry::platform::PlatformMonitor;

/// Fallback implementation for unsupported platforms
/// Returns errors for all operations - telemetry is not available
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
    fn get_frontmost_app(&self) -> Result<ActiveAppInfo, String> {
        Err("App detection is not supported on this platform. Supported platforms: macOS, Windows".to_string())
    }
    
    fn get_idle_time_seconds(&self) -> Result<u64, String> {
        Err("Idle detection is not supported on this platform. Supported platforms: macOS, Windows".to_string())
    }
    
    fn platform_name(&self) -> &'static str {
        "unsupported"
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_fallback_returns_error() {
        let monitor = FallbackMonitor::new();
        
        // Should return errors on unsupported platforms
        assert!(monitor.get_frontmost_app().is_err());
        assert!(monitor.get_idle_time_seconds().is_err());
        assert_eq!(monitor.platform_name(), "unsupported");
    }
}
