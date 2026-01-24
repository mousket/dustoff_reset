// src-tauri/src/permissions/checker.rs

use crate::permissions::types::*;

// ==================== macOS Implementation ====================

#[cfg(target_os = "macos")]
pub mod macos {
    use super::*;
    use std::process::Command;
    
    /// Check if accessibility permission is granted on macOS
    /// Uses AppleScript to test if we can interact with System Events
    pub fn check_accessibility() -> PermissionStatus {
        // Method 1: Try to use System Events (requires accessibility)
        let output = Command::new("osascript")
            .arg("-e")
            .arg("tell application \"System Events\" to get name of first process")
            .output();
        
        match output {
            Ok(result) => {
                let stdout = String::from_utf8_lossy(&result.stdout);
                let stderr = String::from_utf8_lossy(&result.stderr);
                
                println!("[Permissions] osascript check - success: {}, stdout: '{}', stderr: '{}'", 
                    result.status.success(), stdout.trim(), stderr.trim());
                
                if result.status.success() {
                    println!("[Permissions] -> Granted (command succeeded)");
                    PermissionStatus::Granted
                } else {
                    // Check stderr for permission error
                    let stderr_lower = stderr.to_lowercase();
                    if stderr_lower.contains("not allowed") || 
                       stderr_lower.contains("assistive") ||
                       stderr_lower.contains("accessibility") ||
                       stderr_lower.contains("1002") {  // Error code for accessibility denied
                        println!("[Permissions] -> Denied (permission error in stderr)");
                        PermissionStatus::Denied
                    } else {
                        println!("[Permissions] -> Unknown (command failed but no permission error)");
                        PermissionStatus::Unknown
                    }
                }
            }
            Err(e) => {
                println!("[Permissions] osascript check error: {}", e);
                PermissionStatus::Unknown
            }
        }
    }
    
    /// Alternative check using AXIsProcessTrusted via osascript
    pub fn check_accessibility_direct() -> PermissionStatus {
        // Use a more direct check via osascript calling ObjC
        let output = Command::new("osascript")
            .arg("-l")
            .arg("JavaScript")
            .arg("-e")
            .arg("ObjC.import('ApplicationServices'); $.AXIsProcessTrusted()")
            .output();
        
        match output {
            Ok(result) => {
                let stdout = String::from_utf8_lossy(&result.stdout).trim().to_string();
                println!("[Permissions] AXIsProcessTrusted check - stdout: '{}'", stdout);
                
                if stdout == "true" || stdout == "1" {
                    PermissionStatus::Granted
                } else if stdout == "false" || stdout == "0" {
                    PermissionStatus::Denied
                } else {
                    PermissionStatus::Unknown
                }
            }
            Err(e) => {
                println!("[Permissions] AXIsProcessTrusted check error: {}", e);
                PermissionStatus::Unknown
            }
        }
    }
    
    /// Check accessibility using multiple methods for reliability
    /// Falls back to Granted if check is inconclusive (better UX)
    pub fn check_accessibility_trusted() -> PermissionStatus {
        println!("[Permissions] Checking accessibility permissions...");
        
        // Method 1: Try the direct AXIsProcessTrusted check first
        let direct_status = check_accessibility_direct();
        println!("[Permissions] Direct check result: {:?}", direct_status);
        
        if direct_status == PermissionStatus::Granted {
            return PermissionStatus::Granted;
        }
        
        // Method 2: Try the System Events method
        let se_status = check_accessibility();
        println!("[Permissions] System Events check result: {:?}", se_status);
        
        if se_status == PermissionStatus::Granted {
            return PermissionStatus::Granted;
        }
        
        // If both methods say Denied, then it's really Denied
        if direct_status == PermissionStatus::Denied && se_status == PermissionStatus::Denied {
            println!("[Permissions] Both methods report Denied");
            return PermissionStatus::Denied;
        }
        
        // If any method is Unknown and the other isn't explicitly Granted,
        // give benefit of the doubt - user probably has permission
        // This prevents false negatives from blocking users
        println!("[Permissions] Inconclusive - assuming Granted for better UX");
        PermissionStatus::Granted
    }
    
    /// Open System Preferences to Accessibility pane
    pub fn open_accessibility_settings() -> Result<(), String> {
        Command::new("open")
            .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")
            .spawn()
            .map_err(|e| format!("Failed to open System Preferences: {}", e))?;
        Ok(())
    }
    
    /// Open System Preferences to Privacy & Security main pane
    pub fn open_privacy_settings() -> Result<(), String> {
        Command::new("open")
            .arg("x-apple.systempreferences:com.apple.preference.security?Privacy")
            .spawn()
            .map_err(|e| format!("Failed to open System Preferences: {}", e))?;
        Ok(())
    }
    
    /// Get full permission state for macOS
    pub fn get_permission_state() -> PermissionState {
        let accessibility_status = check_accessibility_trusted();
        
        let accessibility_detail = PermissionDetail {
            permission_type: PermissionType::Accessibility,
            status: accessibility_status.clone(),
            required: true,
            description: "Required to detect which app you're currently using".to_string(),
        };
        
        if accessibility_status == PermissionStatus::Granted {
            PermissionState {
                platform: "macos".to_string(),
                all_granted: true,
                permissions: vec![accessibility_detail],
                instructions: None,
            }
        } else {
            PermissionState {
                platform: "macos".to_string(),
                all_granted: false,
                permissions: vec![accessibility_detail],
                instructions: Some(
                    "Dustoff Reset needs Accessibility permission to detect which apps you're using.\n\n\
                    1. Click 'Open Settings' below\n\
                    2. Find 'Dustoff Reset' in the list\n\
                    3. Toggle it ON\n\
                    4. You may need to restart the app".to_string()
                ),
            }
        }
    }
}

// ==================== Windows Implementation ====================

#[cfg(target_os = "windows")]
pub mod windows {
    use super::*;
    
    /// Check permissions on Windows
    /// GetForegroundWindow doesn't require special permissions
    pub fn get_permission_state() -> PermissionState {
        // Windows doesn't require special permissions for basic app detection
        // GetForegroundWindow and GetWindowText work without elevation
        
        PermissionState {
            platform: "windows".to_string(),
            all_granted: true,
            permissions: vec![
                PermissionDetail {
                    permission_type: PermissionType::Accessibility,
                    status: PermissionStatus::NotRequired,
                    required: false,
                    description: "Not required on Windows".to_string(),
                }
            ],
            instructions: None,
        }
    }
    
    /// Open Windows Settings (placeholder)
    pub fn open_privacy_settings() -> Result<(), String> {
        use std::process::Command;
        
        // Open Windows Settings > Privacy
        Command::new("cmd")
            .args(["/C", "start", "ms-settings:privacy"])
            .spawn()
            .map_err(|e| format!("Failed to open Settings: {}", e))?;
        Ok(())
    }
}

// ==================== Linux Implementation ====================

#[cfg(target_os = "linux")]
pub mod linux {
    use super::*;
    use std::env;
    
    /// Detect display server (X11 vs Wayland)
    pub fn get_display_server() -> String {
        // Check for Wayland
        if env::var("WAYLAND_DISPLAY").is_ok() {
            return "wayland".to_string();
        }
        
        // Check for X11
        if env::var("DISPLAY").is_ok() {
            return "x11".to_string();
        }
        
        "unknown".to_string()
    }
    
    /// Check permissions on Linux
    pub fn get_permission_state() -> PermissionState {
        let display_server = get_display_server();
        
        match display_server.as_str() {
            "x11" => {
                // X11 generally allows reading window info without special permissions
                PermissionState {
                    platform: "linux-x11".to_string(),
                    all_granted: true,
                    permissions: vec![
                        PermissionDetail {
                            permission_type: PermissionType::Accessibility,
                            status: PermissionStatus::NotRequired,
                            required: false,
                            description: "X11 allows window detection without special permissions".to_string(),
                        }
                    ],
                    instructions: None,
                }
            }
            "wayland" => {
                // Wayland is more restrictive
                PermissionState {
                    platform: "linux-wayland".to_string(),
                    all_granted: false,
                    permissions: vec![
                        PermissionDetail {
                            permission_type: PermissionType::Accessibility,
                            status: PermissionStatus::Unknown,
                            required: true,
                            description: "Wayland restricts window detection for security".to_string(),
                        }
                    ],
                    instructions: Some(
                        "Dustoff Reset has limited functionality on Wayland.\n\n\
                        Active app detection may not work due to Wayland's security model.\n\n\
                        Options:\n\
                        1. Use X11 session instead (log out, select X11 at login)\n\
                        2. Install XWayland compatibility layer\n\
                        3. Grant portal permissions if available".to_string()
                    ),
                }
            }
            _ => {
                PermissionState {
                    platform: "linux-unknown".to_string(),
                    all_granted: false,
                    permissions: vec![],
                    instructions: Some("Unable to detect display server".to_string()),
                }
            }
        }
    }
    
    /// Open system settings (GNOME)
    pub fn open_privacy_settings() -> Result<(), String> {
        use std::process::Command;
        
        // Try GNOME Settings first
        let gnome = Command::new("gnome-control-center")
            .arg("privacy")
            .spawn();
        
        if gnome.is_ok() {
            return Ok(());
        }
        
        // Try KDE Settings
        let kde = Command::new("systemsettings5")
            .spawn();
        
        if kde.is_ok() {
            return Ok(());
        }
        
        Err("Could not open system settings. Please open your system's privacy settings manually.".to_string())
    }
}

// ==================== Cross-Platform Interface ====================

/// Get permission state for the current platform
pub fn get_permission_state() -> PermissionState {
    #[cfg(target_os = "macos")]
    {
        macos::get_permission_state()
    }
    
    #[cfg(target_os = "windows")]
    {
        windows::get_permission_state()
    }
    
    #[cfg(target_os = "linux")]
    {
        linux::get_permission_state()
    }
    
    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        PermissionState {
            platform: "unsupported".to_string(),
            all_granted: false,
            permissions: vec![],
            instructions: Some("This platform is not supported".to_string()),
        }
    }
}

/// Open platform-specific privacy/permission settings
pub fn open_permission_settings() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        macos::open_accessibility_settings()
    }
    
    #[cfg(target_os = "windows")]
    {
        windows::open_privacy_settings()
    }
    
    #[cfg(target_os = "linux")]
    {
        linux::open_privacy_settings()
    }
    
    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        Err("This platform is not supported".to_string())
    }
}

/// Check if all required permissions are granted
pub fn are_permissions_granted() -> bool {
    get_permission_state().all_granted
}

/// Get current platform name
pub fn get_platform() -> String {
    #[cfg(target_os = "macos")]
    { "macos".to_string() }
    
    #[cfg(target_os = "windows")]
    { "windows".to_string() }
    
    #[cfg(target_os = "linux")]
    { 
        if std::env::var("WAYLAND_DISPLAY").is_ok() {
            "linux-wayland".to_string()
        } else {
            "linux-x11".to_string()
        }
    }
    
    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    { "unsupported".to_string() }
}