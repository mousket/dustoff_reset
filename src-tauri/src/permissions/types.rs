// src-tauri/src/permissions/types.rs

use serde::{Deserialize, Serialize};

/// Permission status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PermissionStatus {
    /// Permission is granted
    Granted,
    /// Permission is denied
    Denied,
    /// Permission status is unknown or not applicable
    Unknown,
    /// Permission is not required on this platform
    NotRequired,
}

/// Types of permissions the app may need
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PermissionType {
    /// Accessibility permission (macOS)
    Accessibility,
    /// Screen recording permission (macOS, for some features)
    ScreenRecording,
    /// Automation permission (macOS)
    Automation,
}

/// Overall permission state for the app
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionState {
    /// Current platform
    pub platform: String,
    /// Whether all required permissions are granted
    pub all_granted: bool,
    /// Individual permission statuses
    pub permissions: Vec<PermissionDetail>,
    /// Human-readable instructions if permissions are missing
    pub instructions: Option<String>,
}

/// Detail about a specific permission
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionDetail {
    /// Type of permission
    pub permission_type: PermissionType,
    /// Current status
    pub status: PermissionStatus,
    /// Whether this permission is required for core functionality
    pub required: bool,
    /// Description of what this permission enables
    pub description: String,
}

impl PermissionState {
    /// Create a state indicating all permissions are granted
    pub fn all_granted(platform: &str) -> Self {
        Self {
            platform: platform.to_string(),
            all_granted: true,
            permissions: vec![],
            instructions: None,
        }
    }
    
    /// Create a state with missing permissions
    pub fn missing(platform: &str, permissions: Vec<PermissionDetail>, instructions: &str) -> Self {
        Self {
            platform: platform.to_string(),
            all_granted: false,
            permissions,
            instructions: Some(instructions.to_string()),
        }
    }
}
