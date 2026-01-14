// src-tauri/src/telemetry/platform/windows.rs
// Windows-specific app detection using Win32 APIs

#![cfg(target_os = "windows")]

use crate::telemetry::types::ActiveAppInfo;
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
    fn get_frontmost_app(&self) -> Result<ActiveAppInfo, String> {
        unsafe {
            // Get the foreground window handle
            let hwnd: HWND = GetForegroundWindow();
            if hwnd.0 == std::ptr::null_mut() {
                return Err("No foreground window found".to_string());
            }
            
            // Get window title
            let title_len = GetWindowTextLengthW(hwnd);
            let window_title = if title_len > 0 {
                let mut title_buf: Vec<u16> = vec![0; (title_len + 1) as usize];
                GetWindowTextW(hwnd, &mut title_buf);
                // Remove null terminator and convert
                let len = title_buf.iter().position(|&c| c == 0).unwrap_or(title_buf.len());
                Some(OsString::from_wide(&title_buf[..len])
                    .to_string_lossy()
                    .into_owned())
            } else {
                None
            };
            
            // Get process ID
            let mut pid: u32 = 0;
            GetWindowThreadProcessId(hwnd, Some(&mut pid));
            
            if pid == 0 {
                return Ok(ActiveAppInfo {
                    app_name: window_title.clone().unwrap_or_else(|| "Unknown".to_string()),
                    bundle_id: None,
                    window_title,
                    active_since: chrono::Utc::now().timestamp_millis(),
                });
            }
            
            // Open process to get executable path
            let process_handle = OpenProcess(
                PROCESS_QUERY_INFORMATION | PROCESS_VM_READ,
                BOOL(0),
                pid,
            );
            
            let (exe_path, exe_name) = if let Ok(handle) = process_handle {
                let mut path_buf: Vec<u16> = vec![0; MAX_PATH as usize];
                let len = GetModuleFileNameExW(handle, None, &mut path_buf);
                
                if len > 0 {
                    let path_str = OsString::from_wide(&path_buf[..len as usize])
                        .to_string_lossy()
                        .into_owned();
                    
                    // Extract executable name as identifier
                    let name = PathBuf::from(&path_str)
                        .file_name()
                        .map(|n| n.to_string_lossy().into_owned())
                        .unwrap_or_else(|| "unknown".to_string());
                    
                    (Some(path_str), name)
                } else {
                    (None, "unknown".to_string())
                }
            } else {
                (None, "unknown".to_string())
            };
            
            // Create a display name from the executable name
            let app_name = exe_name
                .trim_end_matches(".exe")
                .trim_end_matches(".EXE")
                .to_string();
            
            Ok(ActiveAppInfo {
                app_name,
                bundle_id: exe_path, // On Windows, we use the full path as identifier
                window_title,
                active_since: chrono::Utc::now().timestamp_millis(),
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
        
        assert!(result.is_ok(), "Should get frontmost app: {:?}", result.err());
        
        let app_info = result.unwrap();
        println!("Current app: {} ({:?})", app_info.app_name, app_info.bundle_id);
        println!("Window title: {:?}", app_info.window_title);
    }
    
    #[test]
    fn test_get_idle_time() {
        let monitor = WindowsMonitor::new();
        let result = monitor.get_idle_time_seconds();
        
        assert!(result.is_ok(), "Should get idle time: {:?}", result.err());
        println!("Idle time: {} seconds", result.unwrap());
    }
}
