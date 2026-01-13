use tauri::{AppHandle, Manager, LogicalSize, LogicalPosition};

/// Resize the main window to the specified dimensions
#[tauri::command]
pub fn resize_window(app: AppHandle, width: f64, height: f64) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window
            .set_size(LogicalSize::new(width, height))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Get the current window size
#[tauri::command]
pub fn get_window_size(app: AppHandle) -> Result<(f64, f64), String> {
    if let Some(window) = app.get_webview_window("main") {
        let size = window.outer_size().map_err(|e| e.to_string())?;
        Ok((size.width as f64, size.height as f64))
    } else {
        Err("Window not found".to_string())
    }
}

/// Start dragging the window (call this on mousedown of drag handle)
#[tauri::command]
pub fn start_dragging(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.start_dragging().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Set window position
#[tauri::command]
pub fn set_window_position(app: AppHandle, x: f64, y: f64) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window
            .set_position(LogicalPosition::new(x, y))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Get current window position
#[tauri::command]
pub fn get_window_position(app: AppHandle) -> Result<(f64, f64), String> {
    if let Some(window) = app.get_webview_window("main") {
        let pos = window.outer_position().map_err(|e| e.to_string())?;
        Ok((pos.x as f64, pos.y as f64))
    } else {
        Err("Window not found".to_string())
    }
}