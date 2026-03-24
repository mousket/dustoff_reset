# Task: Implement Block Screen Rust Backend

## Phase: 6
## Part: 1 (Hard Enforcement)
## Task: 02
## Depends On: task-01-block-screen-types
## Estimated Time: 2 hours

---

## Context Files

- `src-tauri/src/enforcement/mod.rs` (create)
- `src-tauri/src/enforcement/block_screen.rs` (create)
- `src-tauri/src/commands/enforcement.rs` (create)
- `src-tauri/src/main.rs` (update to register commands)
- `src-tauri/src/lib.rs` (update to include module)

---

## Success Criteria

- [ ] `enforcement` module exists in Rust backend
- [ ] `trigger_block_screen` command is registered
- [ ] `dismiss_block_screen` command is registered
- [ ] `record_violation` command is registered
- [ ] `get_enforcement_state` command is registered
- [ ] Violation is stored with timestamp, app name, escalation level
- [ ] Cargo build succeeds with no errors
- [ ] Commands are callable from frontend via Tauri invoke

---

## Test Cases

- Call `trigger_block_screen` with app name → expect block screen state returned
- Call `get_enforcement_state` → expect current state with violation count
- Call `record_violation` → expect violation count to increment
- Call `dismiss_block_screen` when timer not complete (Legend) → expect error
- Call `dismiss_block_screen` when timer complete → expect success
- Multiple violations → expect escalation level to increase

---

## Implementation Prompt

```
Create the Rust backend for the block screen enforcement system.

First, create the module structure:

Create file: src-tauri/src/enforcement/mod.rs

```rust
pub mod block_screen;
pub mod types;

pub use block_screen::*;
pub use types::*;
```

Create file: src-tauri/src/enforcement/types.rs

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Violation {
    pub id: String,
    pub timestamp: i64,
    pub app_name: String,
    pub app_bundle_id: String,
    pub duration_shown: i32,
    pub escalation_level: i32,
    pub user_response: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockScreenState {
    pub is_visible: bool,
    pub start_time: i64,
    pub total_duration: i32,
    pub remaining_time: i32,
    pub can_dismiss: bool,
    pub violation_number: i32,
    pub app_name: String,
    pub message: String,
    pub escalation_level: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnforcementState {
    pub violation_count: i32,
    pub violations: Vec<Violation>,
    pub block_screen: Option<BlockScreenState>,
    pub is_paused: bool,
    pub paused_at: Option<i64>,
    pub pause_reason: Option<String>,
    pub total_paused_time: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TriggerBlockScreenInput {
    pub app_name: String,
    pub app_bundle_id: String,
    pub session_mode: String,
}

impl Default for EnforcementState {
    fn default() -> Self {
        Self {
            violation_count: 0,
            violations: Vec::new(),
            block_screen: None,
            is_paused: false,
            paused_at: None,
            pause_reason: None,
            total_paused_time: 0,
        }
    }
}
```

Create file: src-tauri/src/enforcement/block_screen.rs

```rust
use std::sync::Mutex;
use once_cell::sync::Lazy;
use chrono::Utc;
use uuid::Uuid;

use super::types::{BlockScreenState, EnforcementState, Violation};

// Global enforcement state (per session)
static ENFORCEMENT_STATE: Lazy<Mutex<EnforcementState>> = 
    Lazy::new(|| Mutex::new(EnforcementState::default()));

// Escalation configuration
fn get_escalation_config(violation_count: i32) -> (i32, &'static str) {
    match violation_count {
        1 => (30, "Let's get back on track"),
        2 => (60, "This is your second distraction"),
        3 => (90, "Three distractions. Take a breath."),
        _ => (120, "Consider what you're trying to achieve"),
    }
}

fn get_escalation_level(violation_count: i32) -> i32 {
    match violation_count {
        1 => 1,
        2 => 2,
        3 => 3,
        _ => 4,
    }
}

pub fn trigger_block_screen(
    app_name: &str,
    app_bundle_id: &str,
    session_mode: &str,
) -> Result<BlockScreenState, String> {
    let mut state = ENFORCEMENT_STATE.lock().map_err(|e| e.to_string())?;
    
    // Increment violation count
    state.violation_count += 1;
    let violation_number = state.violation_count;
    
    // Get escalation config
    let (duration, message) = get_escalation_config(violation_number);
    let escalation_level = get_escalation_level(violation_number);
    
    // Determine if dismissable (only Legend mode requires waiting)
    let can_dismiss = session_mode != "Legend";
    
    let now = Utc::now().timestamp_millis();
    
    // Create block screen state
    let block_screen = BlockScreenState {
        is_visible: true,
        start_time: now,
        total_duration: duration,
        remaining_time: duration,
        can_dismiss,
        violation_number,
        app_name: app_name.to_string(),
        message: message.to_string(),
        escalation_level,
    };
    
    // Record the violation
    let violation = Violation {
        id: Uuid::new_v4().to_string(),
        timestamp: now,
        app_name: app_name.to_string(),
        app_bundle_id: app_bundle_id.to_string(),
        duration_shown: 0, // Will be updated when dismissed
        escalation_level,
        user_response: None,
    };
    
    state.violations.push(violation);
    state.block_screen = Some(block_screen.clone());
    
    Ok(block_screen)
}

pub fn dismiss_block_screen(force: bool) -> Result<(), String> {
    let mut state = ENFORCEMENT_STATE.lock().map_err(|e| e.to_string())?;
    
    if let Some(ref block_screen) = state.block_screen {
        // Check if can dismiss
        if !block_screen.can_dismiss && !force {
            let elapsed = (Utc::now().timestamp_millis() - block_screen.start_time) / 1000;
            if elapsed < block_screen.total_duration as i64 {
                return Err(format!(
                    "Cannot dismiss yet. {} seconds remaining.",
                    block_screen.total_duration as i64 - elapsed
                ));
            }
        }
        
        // Update the last violation with duration shown
        if let Some(last_violation) = state.violations.last_mut() {
            let elapsed = (Utc::now().timestamp_millis() - block_screen.start_time) / 1000;
            last_violation.duration_shown = elapsed as i32;
            last_violation.user_response = Some("waited".to_string());
        }
    }
    
    state.block_screen = None;
    Ok(())
}

pub fn get_enforcement_state() -> EnforcementState {
    ENFORCEMENT_STATE.lock()
        .map(|state| state.clone())
        .unwrap_or_default()
}

pub fn reset_enforcement_state() {
    if let Ok(mut state) = ENFORCEMENT_STATE.lock() {
        *state = EnforcementState::default();
    }
}

pub fn update_remaining_time() -> Option<i32> {
    let mut state = ENFORCEMENT_STATE.lock().ok()?;
    
    if let Some(ref mut block_screen) = state.block_screen {
        let elapsed = (Utc::now().timestamp_millis() - block_screen.start_time) / 1000;
        let remaining = block_screen.total_duration as i64 - elapsed;
        block_screen.remaining_time = remaining.max(0) as i32;
        
        // Auto-enable dismiss when timer complete
        if remaining <= 0 {
            block_screen.can_dismiss = true;
        }
        
        return Some(block_screen.remaining_time);
    }
    
    None
}
```

Create file: src-tauri/src/commands/enforcement.rs

```rust
use tauri::command;
use crate::enforcement::{
    self,
    types::{BlockScreenState, EnforcementState, TriggerBlockScreenInput},
};

#[command]
pub fn trigger_block_screen(input: TriggerBlockScreenInput) -> Result<BlockScreenState, String> {
    enforcement::trigger_block_screen(
        &input.app_name,
        &input.app_bundle_id,
        &input.session_mode,
    )
}

#[command]
pub fn dismiss_block_screen(force: bool) -> Result<(), String> {
    enforcement::dismiss_block_screen(force)
}

#[command]
pub fn get_enforcement_state() -> EnforcementState {
    enforcement::get_enforcement_state()
}

#[command]
pub fn reset_enforcement_state() {
    enforcement::reset_enforcement_state()
}

#[command]
pub fn update_block_screen_timer() -> Option<i32> {
    enforcement::update_remaining_time()
}
```

Update src-tauri/src/main.rs to register the new commands:

Add to the invoke_handler:
- trigger_block_screen
- dismiss_block_screen
- get_enforcement_state
- reset_enforcement_state
- update_block_screen_timer

Update src-tauri/src/lib.rs to include the enforcement module:
```rust
pub mod enforcement;
```

After making these changes:
1. Run `cargo build` in src-tauri directory
2. Verify no compilation errors
3. Test commands are registered by checking they appear in Tauri's command list
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
// Test trigger block screen
const result = await window.__TAURI__.invoke('trigger_block_screen', {
  input: {
    appName: 'Twitter',
    appBundleId: 'com.twitter.app',
    sessionMode: 'Legend'
  }
});
console.log('Block screen:', result);
// Expected: BlockScreenState object with is_visible: true, can_dismiss: false

// Test get state
const state = await window.__TAURI__.invoke('get_enforcement_state');
console.log('Enforcement state:', state);
// Expected: violation_count: 1

// Test dismiss (should fail - timer not complete)
try {
  await window.__TAURI__.invoke('dismiss_block_screen', { force: false });
} catch (e) {
  console.log('Expected error:', e);
  // Expected: "Cannot dismiss yet. X seconds remaining."
}

// Test reset
await window.__TAURI__.invoke('reset_enforcement_state');
const resetState = await window.__TAURI__.invoke('get_enforcement_state');
console.log('Reset state:', resetState);
// Expected: violation_count: 0
```
