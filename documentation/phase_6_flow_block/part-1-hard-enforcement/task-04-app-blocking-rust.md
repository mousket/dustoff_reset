# Task: Implement App Blocking Rust Backend

## Phase: 6
## Part: 1 (Hard Enforcement)
## Task: 04
## Depends On: task-03-block-screen-ui
## Estimated Time: 2.5 hours

---

## Context Files

- `src-tauri/src/enforcement/app_blocking.rs` (create)
- `src-tauri/src/enforcement/mod.rs` (update)
- `src-tauri/src/commands/enforcement.rs` (update)

---

## Success Criteria

- [ ] `get_frontmost_app` command returns current focused app info
- [ ] `minimize_app` command minimizes specified app window
- [ ] `focus_app` command brings specified app to foreground
- [ ] `is_app_blocked` command checks if app is in blocklist
- [ ] `on_app_focus_change` event fires when user switches apps
- [ ] macOS implementation uses Core Foundation / AppKit APIs
- [ ] Cargo build succeeds with no errors
- [ ] All commands are callable from frontend

---

## Test Cases

- Call `get_frontmost_app` → expect { name, bundleId, pid } object
- Call `minimize_app` with valid bundle ID → expect window minimizes
- Call `focus_app` with valid bundle ID → expect app comes to front
- Call `is_app_blocked("com.twitter.app", blocklist)` → expect true if Twitter in list
- Switch apps manually → expect app_focus_changed event fires
- Call `minimize_app` with invalid bundle ID → expect graceful error

---

## Implementation Prompt

```
Create the app blocking Rust backend for window management.

Create file: src-tauri/src/enforcement/app_blocking.rs

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppInfo {
    pub name: String,
    pub bundle_id: String,
    pub pid: i32,
}

#[cfg(target_os = "macos")]
mod macos {
    use super::AppInfo;
    use std::process::Command;
    
    /// Get the frontmost (focused) application
    pub fn get_frontmost_app() -> Result<AppInfo, String> {
        // Use AppleScript to get frontmost app info
        let script = r#"
            tell application "System Events"
                set frontApp to first application process whose frontmost is true
                set appName to name of frontApp
                set appBundle to bundle identifier of frontApp
                set appPid to unix id of frontApp
                return appName & "|" & appBundle & "|" & appPid
            end tell
        "#;
        
        let output = Command::new("osascript")
            .arg("-e")
            .arg(script)
            .output()
            .map_err(|e| format!("Failed to run AppleScript: {}", e))?;
        
        if !output.status.success() {
            return Err(format!(
                "AppleScript failed: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }
        
        let result = String::from_utf8_lossy(&output.stdout).trim().to_string();
        let parts: Vec<&str> = result.split('|').collect();
        
        if parts.len() < 3 {
            return Err("Failed to parse app info".to_string());
        }
        
        Ok(AppInfo {
            name: parts[0].to_string(),
            bundle_id: parts[1].to_string(),
            pid: parts[2].parse().unwrap_or(0),
        })
    }
    
    /// Minimize an application window
    pub fn minimize_app(bundle_id: &str) -> Result<(), String> {
        let script = format!(
            r#"
            tell application id "{}"
                try
                    set miniaturized of windows to true
                end try
            end tell
            "#,
            bundle_id
        );
        
        let output = Command::new("osascript")
            .arg("-e")
            .arg(&script)
            .output()
            .map_err(|e| format!("Failed to minimize app: {}", e))?;
        
        if !output.status.success() {
            // Log but don't fail - some apps don't support this
            eprintln!(
                "Warning: Could not minimize {}: {}",
                bundle_id,
                String::from_utf8_lossy(&output.stderr)
            );
        }
        
        Ok(())
    }
    
    /// Bring an application to the foreground
    pub fn focus_app(bundle_id: &str) -> Result<(), String> {
        let script = format!(
            r#"
            tell application id "{}"
                activate
            end tell
            "#,
            bundle_id
        );
        
        let output = Command::new("osascript")
            .arg("-e")
            .arg(&script)
            .output()
            .map_err(|e| format!("Failed to focus app: {}", e))?;
        
        if !output.status.success() {
            return Err(format!(
                "Failed to focus {}: {}",
                bundle_id,
                String::from_utf8_lossy(&output.stderr)
            ));
        }
        
        Ok(())
    }
    
    /// Hide an application
    pub fn hide_app(bundle_id: &str) -> Result<(), String> {
        let script = format!(
            r#"
            tell application "System Events"
                set visible of application process (name of application id "{}") to false
            end tell
            "#,
            bundle_id
        );
        
        let output = Command::new("osascript")
            .arg("-e")
            .arg(&script)
            .output()
            .map_err(|e| format!("Failed to hide app: {}", e))?;
        
        if !output.status.success() {
            eprintln!(
                "Warning: Could not hide {}: {}",
                bundle_id,
                String::from_utf8_lossy(&output.stderr)
            );
        }
        
        Ok(())
    }
}

#[cfg(target_os = "windows")]
mod windows {
    use super::AppInfo;
    
    pub fn get_frontmost_app() -> Result<AppInfo, String> {
        // Windows implementation placeholder
        // Will use Windows API: GetForegroundWindow, GetWindowThreadProcessId
        Err("Windows implementation not yet complete".to_string())
    }
    
    pub fn minimize_app(_bundle_id: &str) -> Result<(), String> {
        Err("Windows implementation not yet complete".to_string())
    }
    
    pub fn focus_app(_bundle_id: &str) -> Result<(), String> {
        Err("Windows implementation not yet complete".to_string())
    }
    
    pub fn hide_app(_bundle_id: &str) -> Result<(), String> {
        Err("Windows implementation not yet complete".to_string())
    }
}

// Platform-agnostic exports
#[cfg(target_os = "macos")]
pub use macos::*;

#[cfg(target_os = "windows")]
pub use windows::*;

/// Check if an app is in the blocklist
pub fn is_app_blocked(bundle_id: &str, blocklist: &[String]) -> bool {
    blocklist.iter().any(|blocked| {
        blocked.eq_ignore_ascii_case(bundle_id) ||
        // Also check if bundle_id contains the blocked pattern
        bundle_id.to_lowercase().contains(&blocked.to_lowercase())
    })
}

/// Check if an app is in the whitelist
pub fn is_app_whitelisted(bundle_id: &str, whitelist: &[String]) -> bool {
    whitelist.iter().any(|allowed| {
        allowed.eq_ignore_ascii_case(bundle_id) ||
        bundle_id.to_lowercase().contains(&allowed.to_lowercase())
    })
}
```

Update file: src-tauri/src/enforcement/mod.rs

Add:
```rust
pub mod app_blocking;
pub use app_blocking::*;
```

Update file: src-tauri/src/commands/enforcement.rs

Add these commands:

```rust
use crate::enforcement::app_blocking::{
    AppInfo, 
    get_frontmost_app as get_frontmost_app_impl,
    minimize_app as minimize_app_impl,
    focus_app as focus_app_impl,
    hide_app as hide_app_impl,
    is_app_blocked as is_app_blocked_impl,
    is_app_whitelisted as is_app_whitelisted_impl,
};

#[command]
pub fn get_frontmost_app() -> Result<AppInfo, String> {
    get_frontmost_app_impl()
}

#[command]
pub fn minimize_app(bundle_id: String) -> Result<(), String> {
    minimize_app_impl(&bundle_id)
}

#[command]
pub fn focus_app(bundle_id: String) -> Result<(), String> {
    focus_app_impl(&bundle_id)
}

#[command]
pub fn hide_app(bundle_id: String) -> Result<(), String> {
    hide_app_impl(&bundle_id)
}

#[command]
pub fn is_app_blocked(bundle_id: String, blocklist: Vec<String>) -> bool {
    is_app_blocked_impl(&bundle_id, &blocklist)
}

#[command]
pub fn is_app_whitelisted(bundle_id: String, whitelist: Vec<String>) -> bool {
    is_app_whitelisted_impl(&bundle_id, &whitelist)
}
```

Register all new commands in main.rs invoke_handler:
- get_frontmost_app
- minimize_app
- focus_app
- hide_app
- is_app_blocked
- is_app_whitelisted

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
// Test get frontmost app
const app = await window.__TAURI__.invoke('get_frontmost_app');
console.log('Current app:', app);
// Expected: { name: "Chrome", bundleId: "com.google.Chrome", pid: 12345 }

// Test minimize (will minimize the current app!)
// await window.__TAURI__.invoke('minimize_app', { bundleId: 'com.google.Chrome' });

// Test is_app_blocked
const blocked = await window.__TAURI__.invoke('is_app_blocked', {
  bundleId: 'com.twitter.Twitter',
  blocklist: ['com.twitter', 'com.facebook']
});
console.log('Is Twitter blocked:', blocked);
// Expected: true

// Test is_app_whitelisted
const whitelisted = await window.__TAURI__.invoke('is_app_whitelisted', {
  bundleId: 'com.microsoft.VSCode',
  whitelist: ['com.microsoft', 'com.apple']
});
console.log('Is VS Code whitelisted:', whitelisted);
// Expected: true
```
