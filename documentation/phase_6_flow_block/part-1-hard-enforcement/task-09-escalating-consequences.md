# Task: Implement Escalating Consequences System

## Phase: 6
## Part: 1 (Hard Enforcement)
## Task: 09
## Depends On: task-08-session-pause-resume
## Estimated Time: 1.5 hours

---

## Context Files

- `src-tauri/src/enforcement/escalation.rs` (create)
- `src-tauri/src/enforcement/mod.rs` (update)
- `src-tauri/src/commands/enforcement.rs` (update)
- `src/hooks/useEnforcement.ts` (update)

---

## Success Criteria

- [ ] Violation count persists across block screen dismissals
- [ ] Escalation level increases with each violation (1→2→3→4)
- [ ] Level 4 is max (4th+ violations stay at level 4)
- [ ] Block duration increases per level: 30s, 60s, 90s, 120s
- [ ] Reflection prompt appears at level 3+
- [ ] Reflection selection is stored with violation record
- [ ] Reset escalation when session ends
- [ ] `get_escalation_summary` returns violation history

---

## Test Cases

- First violation → expect level 1, 30s duration
- Second violation → expect level 2, 60s duration
- Third violation → expect level 3, 90s duration, reflection shown
- Fourth violation → expect level 4, 120s duration
- Fifth violation → expect level 4 (stays at max)
- Select reflection option → expect stored with violation
- End session → expect escalation resets
- Get escalation summary → expect all violations listed with levels

---

## Implementation Prompt

```
Implement the escalating consequences system for repeated violations.

Create file: src-tauri/src/enforcement/escalation.rs

```rust
use std::sync::Mutex;
use once_cell::sync::Lazy;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ViolationRecord {
    pub id: String,
    pub timestamp: i64,
    pub app_name: String,
    pub app_bundle_id: String,
    pub escalation_level: i32,
    pub duration_seconds: i32,
    pub reflection_option: Option<String>,
    pub time_spent_on_block: i32, // How long they actually waited
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EscalationState {
    pub violation_count: i32,
    pub current_level: i32,
    pub violations: Vec<ViolationRecord>,
    pub session_id: Option<String>,
}

impl Default for EscalationState {
    fn default() -> Self {
        Self {
            violation_count: 0,
            current_level: 0,
            violations: Vec::new(),
            session_id: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EscalationConfig {
    pub level: i32,
    pub duration_seconds: i32,
    pub message: String,
    pub show_reflection: bool,
}

static ESCALATION_STATE: Lazy<Mutex<EscalationState>> =
    Lazy::new(|| Mutex::new(EscalationState::default()));

/// Get escalation configuration for a given violation count
pub fn get_escalation_config(violation_count: i32) -> EscalationConfig {
    match violation_count {
        1 => EscalationConfig {
            level: 1,
            duration_seconds: 30,
            message: "Let's get back on track".to_string(),
            show_reflection: false,
        },
        2 => EscalationConfig {
            level: 2,
            duration_seconds: 60,
            message: "This is your second distraction".to_string(),
            show_reflection: false,
        },
        3 => EscalationConfig {
            level: 3,
            duration_seconds: 90,
            message: "Three distractions. Take a breath.".to_string(),
            show_reflection: true,
        },
        _ => EscalationConfig {
            level: 4,
            duration_seconds: 120,
            message: "Consider what you're trying to achieve".to_string(),
            show_reflection: true,
        },
    }
}

/// Record a new violation and return the escalation config
pub fn record_violation(
    app_name: &str,
    app_bundle_id: &str,
) -> Result<(ViolationRecord, EscalationConfig), String> {
    let mut state = ESCALATION_STATE.lock().map_err(|e| e.to_string())?;
    
    state.violation_count += 1;
    let config = get_escalation_config(state.violation_count);
    state.current_level = config.level;
    
    let violation = ViolationRecord {
        id: Uuid::new_v4().to_string(),
        timestamp: Utc::now().timestamp_millis(),
        app_name: app_name.to_string(),
        app_bundle_id: app_bundle_id.to_string(),
        escalation_level: config.level,
        duration_seconds: config.duration_seconds,
        reflection_option: None,
        time_spent_on_block: 0,
    };
    
    state.violations.push(violation.clone());
    
    println!(
        "[Escalation] Violation #{} recorded. Level: {}, Duration: {}s",
        state.violation_count, config.level, config.duration_seconds
    );
    
    Ok((violation, config))
}

/// Update the most recent violation with reflection choice
pub fn set_violation_reflection(
    violation_id: &str,
    reflection_option: &str,
) -> Result<(), String> {
    let mut state = ESCALATION_STATE.lock().map_err(|e| e.to_string())?;
    
    if let Some(violation) = state.violations.iter_mut().find(|v| v.id == violation_id) {
        violation.reflection_option = Some(reflection_option.to_string());
        println!(
            "[Escalation] Reflection set for violation {}: {}",
            violation_id, reflection_option
        );
        Ok(())
    } else {
        Err(format!("Violation {} not found", violation_id))
    }
}

/// Update violation with actual time spent on block screen
pub fn set_violation_time_spent(
    violation_id: &str,
    time_spent_seconds: i32,
) -> Result<(), String> {
    let mut state = ESCALATION_STATE.lock().map_err(|e| e.to_string())?;
    
    if let Some(violation) = state.violations.iter_mut().find(|v| v.id == violation_id) {
        violation.time_spent_on_block = time_spent_seconds;
        Ok(())
    } else {
        Err(format!("Violation {} not found", violation_id))
    }
}

/// Get current escalation state
pub fn get_escalation_state() -> EscalationState {
    ESCALATION_STATE.lock()
        .map(|state| state.clone())
        .unwrap_or_default()
}

/// Get summary of all violations
pub fn get_escalation_summary() -> EscalationSummary {
    let state = ESCALATION_STATE.lock()
        .map(|s| s.clone())
        .unwrap_or_default();
    
    let total_block_time: i32 = state.violations.iter()
        .map(|v| v.time_spent_on_block)
        .sum();
    
    let reflection_counts: std::collections::HashMap<String, i32> = state.violations.iter()
        .filter_map(|v| v.reflection_option.as_ref())
        .fold(std::collections::HashMap::new(), |mut acc, r| {
            *acc.entry(r.clone()).or_insert(0) += 1;
            acc
        });
    
    EscalationSummary {
        total_violations: state.violation_count,
        max_level_reached: state.current_level,
        total_block_time_seconds: total_block_time,
        violations: state.violations,
        reflection_summary: reflection_counts,
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EscalationSummary {
    pub total_violations: i32,
    pub max_level_reached: i32,
    pub total_block_time_seconds: i32,
    pub violations: Vec<ViolationRecord>,
    pub reflection_summary: std::collections::HashMap<String, i32>,
}

/// Reset escalation state (call when starting new session)
pub fn reset_escalation(session_id: Option<String>) {
    if let Ok(mut state) = ESCALATION_STATE.lock() {
        *state = EscalationState {
            session_id,
            ..Default::default()
        };
    }
    println!("[Escalation] State reset for new session");
}

/// Set session ID for tracking
pub fn set_session_id(session_id: &str) {
    if let Ok(mut state) = ESCALATION_STATE.lock() {
        state.session_id = Some(session_id.to_string());
    }
}
```

Update file: src-tauri/src/enforcement/mod.rs

Add:
```rust
pub mod escalation;
pub use escalation::*;
```

Update file: src-tauri/src/commands/enforcement.rs

Add these commands:

```rust
use crate::enforcement::escalation::{
    ViolationRecord,
    EscalationConfig,
    EscalationState,
    EscalationSummary,
    record_violation as record_violation_impl,
    set_violation_reflection as set_reflection_impl,
    set_violation_time_spent as set_time_spent_impl,
    get_escalation_state as get_escalation_state_impl,
    get_escalation_summary as get_escalation_summary_impl,
    get_escalation_config as get_config_impl,
    reset_escalation as reset_escalation_impl,
};

#[command]
pub fn record_violation(
    app_name: String,
    app_bundle_id: String,
) -> Result<(ViolationRecord, EscalationConfig), String> {
    record_violation_impl(&app_name, &app_bundle_id)
}

#[command]
pub fn set_violation_reflection(
    violation_id: String,
    reflection_option: String,
) -> Result<(), String> {
    set_reflection_impl(&violation_id, &reflection_option)
}

#[command]
pub fn set_violation_time_spent(
    violation_id: String,
    time_spent_seconds: i32,
) -> Result<(), String> {
    set_time_spent_impl(&violation_id, time_spent_seconds)
}

#[command]
pub fn get_escalation_state() -> EscalationState {
    get_escalation_state_impl()
}

#[command]
pub fn get_escalation_summary() -> EscalationSummary {
    get_escalation_summary_impl()
}

#[command]
pub fn get_escalation_config_for_count(violation_count: i32) -> EscalationConfig {
    get_config_impl(violation_count)
}

#[command]
pub fn reset_escalation(session_id: Option<String>) {
    reset_escalation_impl(session_id)
}
```

Register new commands in main.rs invoke_handler:
- record_violation
- set_violation_reflection
- set_violation_time_spent
- get_escalation_state
- get_escalation_summary
- get_escalation_config_for_count
- reset_escalation

After making these changes:
1. Run `cargo build` in src-tauri directory
2. Verify no compilation errors
3. Test escalation in DevTools
```

---

## Verification

After completing this task:

```bash
cd src-tauri
cargo build
```

Expected: No compilation errors.

Test in DevTools console:

```javascript
// Reset for clean test
await window.__TAURI__.invoke('reset_escalation', { sessionId: 'test-session' });

// First violation
const [v1, c1] = await window.__TAURI__.invoke('record_violation', {
  appName: 'Twitter',
  appBundleId: 'com.twitter.app'
});
console.log('Violation 1:', v1, 'Config:', c1);
// Expected: level: 1, duration_seconds: 30, show_reflection: false

// Second violation
const [v2, c2] = await window.__TAURI__.invoke('record_violation', {
  appName: 'Facebook',
  appBundleId: 'com.facebook.app'
});
console.log('Violation 2:', v2, 'Config:', c2);
// Expected: level: 2, duration_seconds: 60

// Third violation
const [v3, c3] = await window.__TAURI__.invoke('record_violation', {
  appName: 'Instagram',
  appBundleId: 'com.instagram.app'
});
console.log('Violation 3:', v3, 'Config:', c3);
// Expected: level: 3, duration_seconds: 90, show_reflection: true

// Set reflection
await window.__TAURI__.invoke('set_violation_reflection', {
  violationId: v3.id,
  reflectionOption: 'tired'
});

// Fourth violation (should cap at level 4)
const [v4, c4] = await window.__TAURI__.invoke('record_violation', {
  appName: 'TikTok',
  appBundleId: 'com.tiktok.app'
});
console.log('Violation 4:', v4, 'Config:', c4);
// Expected: level: 4, duration_seconds: 120

// Get summary
const summary = await window.__TAURI__.invoke('get_escalation_summary');
console.log('Summary:', summary);
// Expected: total_violations: 4, max_level_reached: 4, reflection_summary: { tired: 1 }
```
