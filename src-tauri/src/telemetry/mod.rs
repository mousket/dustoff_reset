// src-tauri/src/telemetry/mod.rs
// Telemetry module for Dustoff Reset
//
// This module handles:
// - Active app detection (cross-platform: macOS, Windows)
// - Platform abstraction layer
// - Monitor loop (polling every 2 seconds)
// - Event emission to frontend
// - Persistence to SQLite

pub mod types;
pub mod platform;
pub mod monitor_loop;
pub mod events;
pub mod persistence;

// Legacy app_monitor - kept for backward compatibility during migration
// TODO: Remove after full migration to platform abstraction
pub mod app_monitor;

pub use types::*;
pub use platform::{PlatformMonitor, create_monitor, is_platform_supported, current_platform};
pub use monitor_loop::*;
pub use events::*;
pub use persistence::*;
