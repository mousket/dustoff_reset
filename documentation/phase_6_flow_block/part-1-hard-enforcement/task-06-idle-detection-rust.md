# Task: Implement Idle Detection Rust Backend

## Phase: 6
## Part: 1 (Hard Enforcement)
## Task: 06
## Depends On: task-05-app-blocking-integration
## Estimated Time: 2 hours

---

## Context Files

- `src-tauri/src/enforcement/idle_detection.rs` (create)
- `src-tauri/src/enforcement/mod.rs` (update)
- `src-tauri/src/commands/enforcement.rs` (update)

---

## Success Criteria

- [ ] `get_system_idle_time` command returns seconds since last input
- [ ] `is_screen_locked` command returns true/false
- [ ] Idle detection works on macOS using IOKit
- [ ] Windows placeholder implementation exists
- [ ] Cargo build succeeds with no errors
- [ ] All commands are callable from frontend

---

## Test Cases

- Call `get_system_idle_time` immediately after input → expect 0-2 seconds
- Call `get_system_idle_time` after waiting 10 seconds → expect ~10 seconds
- Call `is_screen_locked` when unlocked → expect false
- Call `is_screen_locked` when locked → expect true
- Rapid repeated calls → expect consistent results (no crashes)

---

## Implementation Prompt

```
Create the idle detection Rust backend.

Create file: src-tauri/src/enforcement/idle_detection.rs

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IdleInfo {
    pub idle_seconds: f64,
    pub screen_locked: bool,
}

#[cfg(target_os = "macos")]
mod macos {
    use super::IdleInfo;
    use std::process::Command;
    
    /// Get system idle time in seconds using IOKit via ioreg
    pub fn get_system_idle_time() -> Result<f64, String> {
        // Use ioreg to get HIDIdleTime from IOHIDSystem
        let output = Command::new("ioreg")
            .args(["-c", "IOHIDSystem", "-d", "4"])
            .output()
            .map_err(|e| format!("Failed to run ioreg: {}", e))?;
        
        if !output.status.success() {
            return Err("ioreg command failed".to_string());
        }
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        
        // Find HIDIdleTime in output
        // Format: "HIDIdleTime" = 1234567890
        for line in stdout.lines() {
            if line.contains("HIDIdleTime") {
                // Extract the number
                if let Some(value_str) = line.split('=').nth(1) {
                    let cleaned = value_str.trim().trim_end_matches(|c| c == ' ');
                    if let Ok(nanoseconds) = cleaned.parse::<u64>() {
                        // Convert nanoseconds to seconds
                        return Ok(nanoseconds as f64 / 1_000_000_000.0);
                    }
                }
            }
        }
        
        // If we can't find it, return 0 (assume active)
        Ok(0.0)
    }
    
    /// Check if the screen is locked
    pub fn is_screen_locked() -> Result<bool, String> {
        // Method 1: Check CGSessionCopyCurrentDictionary via Python bridge
        // (Rust doesn't have direct CoreGraphics bindings easily)
        let script = r#"
            import Quartz
            d = Quartz.CGSessionCopyCurrentDictionary()
            if d:
                locked = d.get('CGSSessionScreenIsLocked', 0)
                print(1 if locked else 0)
            else:
                print(0)
        "#;
        
        let output = Command::new("python3")
            .arg("-c")
            .arg(script)
            .output();
        
        match output {
            Ok(out) => {
                let result = String::from_utf8_lossy(&out.stdout).trim().to_string();
                Ok(result == "1")
            }
            Err(_) => {
                // Fallback: Use AppleScript to check screen saver
                let script = r#"
                    tell application "System Events"
                        get running of screen saver preferences
                    end tell
                "#;
                
                let output = Command::new("osascript")
                    .arg("-e")
                    .arg(script)
                    .output()
                    .map_err(|e| format!("Failed to check screen saver: {}", e))?;
                
                let result = String::from_utf8_lossy(&output.stdout).trim().to_string();
                Ok(result == "true")
            }
        }
    }
    
    /// Get combined idle info
    pub fn get_idle_info() -> Result<IdleInfo, String> {
        Ok(IdleInfo {
            idle_seconds: get_system_idle_time()?,
            screen_locked: is_screen_locked().unwrap_or(false),
        })
    }
}

#[cfg(target_os = "windows")]
mod windows {
    use super::IdleInfo;
    
    pub fn get_system_idle_time() -> Result<f64, String> {
        // Windows implementation placeholder
        // Would use GetLastInputInfo from user32.dll
        // 
        // use winapi::um::winuser::{GetLastInputInfo, LASTINPUTINFO};
        // use winapi::um::sysinfoapi::GetTickCount;
        //
        // let mut lii = LASTINPUTINFO { cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32, dwTime: 0 };
        // if GetLastInputInfo(&mut lii) != 0 {
        //     let idle_ms = GetTickCount() - lii.dwTime;
        //     return Ok(idle_ms as f64 / 1000.0);
        // }
        
        Err("Windows implementation not yet complete".to_string())
    }
    
    pub fn is_screen_locked() -> Result<bool, String> {
        // Windows implementation placeholder
        // Would check if LockWorkStation is active or use WTSQuerySessionInformation
        Err("Windows implementation not yet complete".to_string())
    }
    
    pub fn get_idle_info() -> Result<IdleInfo, String> {
        Ok(IdleInfo {
            idle_seconds: get_system_idle_time().unwrap_or(0.0),
            screen_locked: is_screen_locked().unwrap_or(false),
        })
    }
}

// Platform-agnostic exports
#[cfg(target_os = "macos")]
pub use macos::*;

#[cfg(target_os = "windows")]
pub use windows::*;

/// Idle thresholds (in seconds)
pub mod thresholds {
    pub const WARNING: f64 = 120.0;  // 2 minutes - show "still there?"
    pub const PAUSE: f64 = 300.0;    // 5 minutes - pause session
}

/// Check if user should be warned about idle
pub fn should_show_idle_warning(idle_seconds: f64) -> bool {
    idle_seconds >= thresholds::WARNING && idle_seconds < thresholds::PAUSE
}

/// Check if session should be paused due to idle
pub fn should_pause_for_idle(idle_seconds: f64) -> bool {
    idle_seconds >= thresholds::PAUSE
}
```

Update file: src-tauri/src/enforcement/mod.rs

Add:
```rust
pub mod idle_detection;
pub use idle_detection::*;
```

Update file: src-tauri/src/commands/enforcement.rs

Add these commands:

```rust
use crate::enforcement::idle_detection::{
    IdleInfo,
    get_system_idle_time as get_idle_time_impl,
    is_screen_locked as is_locked_impl,
    get_idle_info as get_idle_info_impl,
    should_show_idle_warning,
    should_pause_for_idle,
};

#[command]
pub fn get_system_idle_time() -> Result<f64, String> {
    get_idle_time_impl()
}

#[command]
pub fn is_screen_locked() -> Result<bool, String> {
    is_locked_impl()
}

#[command]
pub fn get_idle_info() -> Result<IdleInfo, String> {
    get_idle_info_impl()
}

#[command]
pub fn check_idle_status() -> Result<(bool, bool), String> {
    // Returns (should_warn, should_pause)
    let idle_seconds = get_idle_time_impl()?;
    Ok((
        should_show_idle_warning(idle_seconds),
        should_pause_for_idle(idle_seconds),
    ))
}
```

Register new commands in main.rs invoke_handler:
- get_system_idle_time
- is_screen_locked
- get_idle_info
- check_idle_status

After making these changes:
1. Run `cargo build` in src-tauri directory
2. Verify no compilation errors
3. Test commands in browser DevTools
```

---

## Verification

After completing this task:

```bash
cd src-tauri
cargo build
```

Expected: No compilation errors.

Then in the app's DevTools console:

```javascript
// Test idle time (should be low if you just typed)
const idleTime = await window.__TAURI__.invoke('get_system_idle_time');
console.log('Idle time (seconds):', idleTime);
// Expected: Small number (0-5 seconds)

// Wait 10 seconds without touching keyboard/mouse, then:
const idleTime2 = await window.__TAURI__.invoke('get_system_idle_time');
console.log('Idle time after waiting:', idleTime2);
// Expected: ~10 seconds

// Test screen lock status
const isLocked = await window.__TAURI__.invoke('is_screen_locked');
console.log('Screen locked:', isLocked);
// Expected: false (unless screen is actually locked)

// Test combined info
const info = await window.__TAURI__.invoke('get_idle_info');
console.log('Idle info:', info);
// Expected: { idle_seconds: X, screen_locked: false }

// Test idle status check
const [shouldWarn, shouldPause] = await window.__TAURI__.invoke('check_idle_status');
console.log('Should warn:', shouldWarn, 'Should pause:', shouldPause);
// Expected: Both false if recently active
```

### Manual Verification

1. Lock your screen (Cmd+Ctrl+Q on macOS)
2. Unlock and immediately run:
   ```javascript
   await window.__TAURI__.invoke('is_screen_locked');
   ```
   Expected: false (screen is now unlocked)

3. Note: Testing `is_screen_locked` returning `true` requires checking immediately after locking, which is tricky. The important test is that it returns `false` when unlocked.
