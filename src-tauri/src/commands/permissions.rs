// src-tauri/src/commands/permissions.rs

use tauri::command;
use crate::permissions::{
    types::PermissionState,
    checker::{get_permission_state, open_permission_settings, are_permissions_granted, get_platform},
};

/// Get the current permission state for the platform
#[command]
pub fn check_permissions() -> PermissionState {
    get_permission_state()
}

/// Check if all required permissions are granted
#[command]
pub fn are_all_permissions_granted() -> bool {
    are_permissions_granted()
}

/// Open the system's permission/privacy settings
#[command]
pub fn open_system_permissions() -> Result<(), String> {
    open_permission_settings()
}

/// Get the current platform name
#[command]
pub fn get_current_platform() -> String {
    get_platform()
}

/// Request permission (mainly for future use with proper permission APIs)
/// For now, this just opens settings since macOS requires manual grant
#[command]
pub fn request_permission(permission_type: String) -> Result<(), String> {
    match permission_type.as_str() {
        "accessibility" => {
            #[cfg(target_os = "macos")]
            {
                // On macOS, we can trigger the permission prompt by attempting
                // to use accessibility features. The OS will show a dialog.
                // But the user still has to manually enable in System Preferences.
                crate::permissions::checker::macos::open_accessibility_settings()
            }
            
            #[cfg(not(target_os = "macos"))]
            {
                Ok(()) // Not needed on other platforms
            }
        }
        _ => Err(format!("Unknown permission type: {}", permission_type)),
    }
}