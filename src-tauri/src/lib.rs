// Library crate for Dustoff Reset
// Modules are also declared in main.rs for the binary crate
// This lib.rs provides exports for tests and potential future library use

#![allow(ambiguous_glob_reexports)]

use rusqlite::Connection;
use std::sync::Mutex;

pub mod badges;
pub mod commands;
pub mod models;
pub mod storage;
pub mod telemetry;

/// App state holding database connection.
/// Used by Tauri commands to access the database.
pub struct AppState {
    pub db: Mutex<Connection>,
}

// Re-exports for convenient access
pub use badges::*;
pub use commands::*;
pub use models::*;
pub use storage::*;
pub use telemetry::*;