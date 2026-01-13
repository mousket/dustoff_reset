// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod models;
mod storage;

use std::sync::Mutex;
use storage::init_database;
use tauri::Manager;

// Import AppState from the library crate
use dustoff_reset_lib::AppState;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Initialize database
            let conn = init_database(&app.handle()).expect("Failed to initialize database");

            // Store in app state
            app.manage(AppState {
                db: Mutex::new(conn),
            });

            println!("Dustoff Reset initialized successfully");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Window commands (from Day 1)
            commands::windows::resize_window,
            commands::windows::get_window_size,
            commands::windows::start_dragging,
            commands::windows::set_window_position,
            commands::windows::get_window_position,
            // Data commands (adding today)
            commands::data::save_calibration,
            commands::data::load_calibration,
            commands::data::clear_calibration,
            commands::data::save_session,
            commands::data::get_session,
            commands::data::get_all_sessions,
            commands::data::save_reflection,
            commands::data::get_reflection,
            commands::data::save_recovery_data,
            commands::data::get_recovery_data,
            commands::data::clear_recovery_data,
            commands::data::add_parking_lot_item,
            commands::data::update_parking_lot_item,
            commands::data::get_active_parking_lot_items,
            commands::data::get_next_session_items,
            commands::data::delete_parking_lot_item,
            commands::data::save_user,
            commands::data::get_user,
            commands::data::get_workday_date,
            commands::data::generate_uuid,
            commands::data::reset_all_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
