# Task: Implement Flow Detection Rust Backend

## Phase: 6
## Part: 2 (Flow Detection)
## Task: 03
## Depends On: task-02-flow-state-machine
## Estimated Time: 2.5 hours

---

## Context Files

- `src-tauri/src/flow/mod.rs` (create)
- `src-tauri/src/flow/types.rs` (create)
- `src-tauri/src/flow/state.rs` (create)
- `src-tauri/src/flow/streak.rs` (create)
- `src-tauri/src/commands/flow.rs` (create)
- `src-tauri/src/lib.rs` (update)
- `src-tauri/src/main.rs` (update)

---

## Success Criteria

- [ ] Flow module exists in Rust backend
- [ ] `start_flow_tracking` command initializes flow state
- [ ] `stop_flow_tracking` command returns flow summary
- [ ] `get_flow_state` command returns current state
- [ ] `handle_app_focus` command processes app switches
- [ ] `update_flow_streak` command updates streak in database
- [ ] `get_flow_streak` command returns current streak
- [ ] All types match frontend TypeScript types
- [ ] Cargo build succeeds with no errors

---

## Test Cases

- Call `start_flow_tracking` with 45 min session → expect isTracking true
- Call `start_flow_tracking` with 20 min session → expect isTracking false
- Call `get_flow_state` → expect current state returned
- Call `handle_app_focus` with blocked app → expect grace period starts
- Call `handle_app_focus` with whitelisted app during grace → expect grace ends
- Call `stop_flow_tracking` → expect summary with max level and total time
- Call `update_flow_streak` after deep flow → expect streak increments
- Call `get_flow_streak` → expect { currentStreak, longestStreak, ... }

---

## Implementation Prompt

```
Create the Rust backend for flow detection.

Create file: src-tauri/src/flow/mod.rs

```rust
pub mod types;
pub mod state;
pub mod streak;

pub use types::*;
pub use state::*;
pub use streak::*;
```

Create file: src-tauri/src/flow/types.rs

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FlowLevel {
    None,
    Building,
    Established,
    Deep,
}

impl Default for FlowLevel {
    fn default() -> Self {
        FlowLevel::None
    }
}

impl FlowLevel {
    pub fn as_str(&self) -> &'static str {
        match self {
            FlowLevel::None => "none",
            FlowLevel::Building => "building",
            FlowLevel::Established => "established",
            FlowLevel::Deep => "deep",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraceState {
    pub active: bool,
    pub started_at: Option<i64>,
    pub trigger_app: Option<String>,
    pub trigger_app_bundle_id: Option<String>,
    pub remaining_ms: i64,
}

impl Default for GraceState {
    fn default() -> Self {
        Self {
            active: false,
            started_at: None,
            trigger_app: None,
            trigger_app_bundle_id: None,
            remaining_ms: 90_000, // 90 seconds
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlowState {
    pub level: FlowLevel,
    pub level_started_at: Option<i64>,
    pub uninterrupted_since: Option<i64>,
    pub grace: GraceState,
    pub is_tracking: bool,
    pub session_duration_ms: i64,
}

impl Default for FlowState {
    fn default() -> Self {
        Self {
            level: FlowLevel::None,
            level_started_at: None,
            uninterrupted_since: None,
            grace: GraceState::default(),
            is_tracking: false,
            session_duration_ms: 0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlowPeriod {
    pub id: String,
    pub session_id: String,
    pub started_at: i64,
    pub ended_at: Option<i64>,
    pub max_level_reached: FlowLevel,
    pub was_interrupted: bool,
    pub interrupted_by_app: Option<String>,
    pub duration_ms: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlowSessionSummary {
    pub session_id: String,
    pub total_flow_time_ms: i64,
    pub deep_flow_time_ms: i64,
    pub flow_periods: Vec<FlowPeriod>,
    pub max_level_reached: FlowLevel,
    pub longest_flow_period_ms: i64,
    pub flow_breaks: i32,
    pub achieved_deep_flow: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlowStreak {
    pub current_streak: i32,
    pub longest_streak: i32,
    pub last_deep_flow_date: Option<String>, // YYYY-MM-DD
    pub streak_start_date: Option<String>,   // YYYY-MM-DD
}

impl Default for FlowStreak {
    fn default() -> Self {
        Self {
            current_streak: 0,
            longest_streak: 0,
            last_deep_flow_date: None,
            streak_start_date: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppFocusInput {
    pub name: String,
    pub bundle_id: String,
    pub is_whitelisted: bool,
    pub is_blocked: bool,
}

// Flow thresholds in milliseconds
pub mod thresholds {
    pub const BUILDING: i64 = 5 * 60 * 1000;     // 5 minutes
    pub const ESTABLISHED: i64 = 10 * 60 * 1000; // 10 minutes
    pub const DEEP: i64 = 20 * 60 * 1000;        // 20 minutes
    pub const GRACE_PERIOD: i64 = 90 * 1000;     // 90 seconds
    pub const MIN_SESSION: i64 = 30 * 60 * 1000; // 30 minutes
}
```

Create file: src-tauri/src/flow/state.rs

```rust
use std::sync::Mutex;
use once_cell::sync::Lazy;
use chrono::Utc;
use uuid::Uuid;

use super::types::*;

static FLOW_STATE: Lazy<Mutex<FlowState>> = Lazy::new(|| Mutex::new(FlowState::default()));
static FLOW_PERIODS: Lazy<Mutex<Vec<FlowPeriod>>> = Lazy::new(|| Mutex::new(Vec::new()));
static CURRENT_SESSION_ID: Lazy<Mutex<Option<String>>> = Lazy::new(|| Mutex::new(None));

pub fn start_flow_tracking(session_id: &str, session_duration_ms: i64) -> FlowState {
    let mut state = FLOW_STATE.lock().unwrap();
    let mut periods = FLOW_PERIODS.lock().unwrap();
    let mut current_session = CURRENT_SESSION_ID.lock().unwrap();

    let is_tracking = session_duration_ms >= thresholds::MIN_SESSION;

    *state = FlowState {
        level: FlowLevel::None,
        level_started_at: None,
        uninterrupted_since: if is_tracking { Some(Utc::now().timestamp_millis()) } else { None },
        grace: GraceState::default(),
        is_tracking,
        session_duration_ms,
    };

    periods.clear();
    *current_session = Some(session_id.to_string());

    println!(
        "[Flow] Tracking started. Session: {}, Duration: {}ms, Active: {}",
        session_id, session_duration_ms, is_tracking
    );

    state.clone()
}

pub fn stop_flow_tracking() -> FlowSessionSummary {
    let state = FLOW_STATE.lock().unwrap();
    let periods = FLOW_PERIODS.lock().unwrap();
    let current_session = CURRENT_SESSION_ID.lock().unwrap();

    let session_id = current_session.clone().unwrap_or_default();

    let total_flow_time_ms: i64 = periods.iter().map(|p| p.duration_ms).sum();
    let deep_flow_time_ms: i64 = periods.iter()
        .filter(|p| matches!(p.max_level_reached, FlowLevel::Deep))
        .map(|p| p.duration_ms)
        .sum();

    let max_level = periods.iter()
        .map(|p| &p.max_level_reached)
        .max_by_key(|l| match l {
            FlowLevel::None => 0,
            FlowLevel::Building => 1,
            FlowLevel::Established => 2,
            FlowLevel::Deep => 3,
        })
        .cloned()
        .unwrap_or(state.level.clone());

    let longest = periods.iter().map(|p| p.duration_ms).max().unwrap_or(0);
    let breaks = periods.iter().filter(|p| p.was_interrupted).count() as i32;
    let achieved_deep = periods.iter().any(|p| matches!(p.max_level_reached, FlowLevel::Deep))
        || matches!(state.level, FlowLevel::Deep);

    FlowSessionSummary {
        session_id,
        total_flow_time_ms,
        deep_flow_time_ms,
        flow_periods: periods.clone(),
        max_level_reached: max_level,
        longest_flow_period_ms: longest,
        flow_breaks: breaks,
        achieved_deep_flow: achieved_deep,
    }
}

pub fn get_flow_state() -> FlowState {
    FLOW_STATE.lock().unwrap().clone()
}

pub fn tick_flow() -> FlowState {
    let mut state = FLOW_STATE.lock().unwrap();
    
    if !state.is_tracking {
        return state.clone();
    }

    let now = Utc::now().timestamp_millis();

    // Handle grace period
    if state.grace.active {
        if let Some(started) = state.grace.started_at {
            let elapsed = now - started;
            let remaining = thresholds::GRACE_PERIOD - elapsed;

            if remaining <= 0 {
                // Grace exceeded - reset flow
                let old_level = state.level.clone();
                let trigger_app = state.grace.trigger_app.clone();

                // Record the broken flow period
                record_flow_period(&state, true, trigger_app.clone());

                state.level = FlowLevel::None;
                state.level_started_at = None;
                state.uninterrupted_since = None;
                state.grace = GraceState::default();

                println!("[Flow] Grace exceeded. Flow broken by {:?}", trigger_app);
            } else {
                state.grace.remaining_ms = remaining;
            }
        }
        return state.clone();
    }

    // Advance flow state
    if state.uninterrupted_since.is_none() {
        state.uninterrupted_since = Some(now);
    }

    if let Some(since) = state.uninterrupted_since {
        let uninterrupted_time = now - since;

        let new_level = if uninterrupted_time >= thresholds::DEEP {
            FlowLevel::Deep
        } else if uninterrupted_time >= thresholds::ESTABLISHED {
            FlowLevel::Established
        } else if uninterrupted_time >= thresholds::BUILDING {
            FlowLevel::Building
        } else {
            FlowLevel::None
        };

        if new_level != state.level {
            println!("[Flow] Level changed: {:?} -> {:?}", state.level, new_level);
            state.level = new_level;
            state.level_started_at = Some(now);
        }
    }

    state.clone()
}

pub fn handle_app_focus(app: AppFocusInput) -> FlowState {
    let mut state = FLOW_STATE.lock().unwrap();
    
    if !state.is_tracking {
        return state.clone();
    }

    let now = Utc::now().timestamp_millis();

    if app.is_whitelisted {
        // Returning to focus
        if state.grace.active {
            println!("[Flow] Grace ended - returned to whitelisted app");
            state.grace = GraceState::default();
        }
    } else if !state.grace.active && state.level != FlowLevel::None {
        // Starting grace period
        println!("[Flow] Grace started - switched to {}", app.name);
        state.grace = GraceState {
            active: true,
            started_at: Some(now),
            trigger_app: Some(app.name),
            trigger_app_bundle_id: Some(app.bundle_id),
            remaining_ms: thresholds::GRACE_PERIOD,
        };
    }

    state.clone()
}

fn record_flow_period(state: &FlowState, interrupted: bool, interrupted_by: Option<String>) {
    let mut periods = FLOW_PERIODS.lock().unwrap();
    let current_session = CURRENT_SESSION_ID.lock().unwrap();

    if let Some(since) = state.uninterrupted_since {
        let now = Utc::now().timestamp_millis();
        let duration = now - since;

        let period = FlowPeriod {
            id: Uuid::new_v4().to_string(),
            session_id: current_session.clone().unwrap_or_default(),
            started_at: since,
            ended_at: Some(now),
            max_level_reached: state.level.clone(),
            was_interrupted: interrupted,
            interrupted_by_app: interrupted_by,
            duration_ms: duration,
        };

        periods.push(period);
    }
}

pub fn pause_flow_tracking() {
    let mut state = FLOW_STATE.lock().unwrap();
    
    if state.is_tracking {
        // Record current period before pausing
        record_flow_period(&state, false, None);
        state.is_tracking = false;
        state.uninterrupted_since = None;
        println!("[Flow] Tracking paused");
    }
}

pub fn resume_flow_tracking() {
    let mut state = FLOW_STATE.lock().unwrap();
    
    if state.session_duration_ms >= thresholds::MIN_SESSION {
        state.is_tracking = true;
        state.uninterrupted_since = Some(Utc::now().timestamp_millis());
        state.level = FlowLevel::None; // Reset level on resume
        state.level_started_at = None;
        println!("[Flow] Tracking resumed");
    }
}
```

Create file: src-tauri/src/flow/streak.rs

```rust
use chrono::{Datelike, Local, NaiveDate, Weekday};
use super::types::FlowStreak;

// In-memory streak (would be persisted to SQLite in production)
use std::sync::Mutex;
use once_cell::sync::Lazy;

static FLOW_STREAK: Lazy<Mutex<FlowStreak>> = Lazy::new(|| Mutex::new(FlowStreak::default()));

pub fn get_flow_streak() -> FlowStreak {
    FLOW_STREAK.lock().unwrap().clone()
}

pub fn update_flow_streak(achieved_deep_flow: bool) -> FlowStreak {
    let mut streak = FLOW_STREAK.lock().unwrap();
    let today = Local::now().format("%Y-%m-%d").to_string();
    let today_date = Local::now().date_naive();

    if !achieved_deep_flow {
        // Check if streak should be broken (weekday with no deep flow)
        if !is_weekend(today_date) {
            if let Some(ref last_date_str) = streak.last_deep_flow_date {
                if let Ok(last_date) = NaiveDate::parse_from_str(last_date_str, "%Y-%m-%d") {
                    let days_since = (today_date - last_date).num_days();
                    
                    // Count non-weekend days since last deep flow
                    let mut weekdays_missed = 0;
                    for i in 1..=days_since {
                        if let Some(check_date) = last_date.checked_add_signed(chrono::Duration::days(i)) {
                            if !is_weekend(check_date) {
                                weekdays_missed += 1;
                            }
                        }
                    }

                    if weekdays_missed > 1 {
                        // Streak broken
                        streak.current_streak = 0;
                        streak.streak_start_date = None;
                        println!("[FlowStreak] Streak broken - {} weekdays missed", weekdays_missed);
                    }
                }
            }
        }
        return streak.clone();
    }

    // Achieved deep flow
    let is_today_weekend = is_weekend(today_date);

    if is_today_weekend {
        // Weekend: Don't extend streak, but don't break it
        println!("[FlowStreak] Deep flow on weekend - streak unchanged");
        return streak.clone();
    }

    // Weekday with deep flow
    if let Some(ref last_date_str) = streak.last_deep_flow_date {
        if last_date_str == &today {
            // Already recorded today
            println!("[FlowStreak] Deep flow already recorded today");
            return streak.clone();
        }

        if let Ok(last_date) = NaiveDate::parse_from_str(last_date_str, "%Y-%m-%d") {
            let days_since = (today_date - last_date).num_days();
            
            // Check if any weekdays were missed
            let mut weekdays_missed = 0;
            for i in 1..days_since {
                if let Some(check_date) = last_date.checked_add_signed(chrono::Duration::days(i)) {
                    if !is_weekend(check_date) {
                        weekdays_missed += 1;
                    }
                }
            }

            if weekdays_missed > 0 {
                // Missed weekdays - restart streak
                streak.current_streak = 1;
                streak.streak_start_date = Some(today.clone());
                println!("[FlowStreak] Streak restarted (missed {} weekdays)", weekdays_missed);
            } else {
                // Continuing streak
                streak.current_streak += 1;
                println!("[FlowStreak] Streak extended to {} days", streak.current_streak);
            }
        }
    } else {
        // First deep flow ever
        streak.current_streak = 1;
        streak.streak_start_date = Some(today.clone());
        println!("[FlowStreak] First deep flow! Streak started.");
    }

    streak.last_deep_flow_date = Some(today);

    // Update longest streak
    if streak.current_streak > streak.longest_streak {
        streak.longest_streak = streak.current_streak;
    }

    streak.clone()
}

fn is_weekend(date: NaiveDate) -> bool {
    matches!(date.weekday(), Weekday::Sat | Weekday::Sun)
}

pub fn reset_flow_streak() {
    let mut streak = FLOW_STREAK.lock().unwrap();
    *streak = FlowStreak::default();
}
```

Create file: src-tauri/src/commands/flow.rs

```rust
use tauri::command;
use crate::flow::{
    self,
    types::{FlowState, FlowSessionSummary, FlowStreak, AppFocusInput},
};

#[command]
pub fn start_flow_tracking(session_id: String, session_duration_ms: i64) -> FlowState {
    flow::start_flow_tracking(&session_id, session_duration_ms)
}

#[command]
pub fn stop_flow_tracking() -> FlowSessionSummary {
    flow::stop_flow_tracking()
}

#[command]
pub fn get_flow_state() -> FlowState {
    flow::get_flow_state()
}

#[command]
pub fn tick_flow() -> FlowState {
    flow::tick_flow()
}

#[command]
pub fn handle_app_focus(app: AppFocusInput) -> FlowState {
    flow::handle_app_focus(app)
}

#[command]
pub fn pause_flow_tracking() {
    flow::pause_flow_tracking()
}

#[command]
pub fn resume_flow_tracking() {
    flow::resume_flow_tracking()
}

#[command]
pub fn get_flow_streak() -> FlowStreak {
    flow::get_flow_streak()
}

#[command]
pub fn update_flow_streak(achieved_deep_flow: bool) -> FlowStreak {
    flow::update_flow_streak(achieved_deep_flow)
}

#[command]
pub fn reset_flow_streak() {
    flow::reset_flow_streak()
}
```

Update src-tauri/src/lib.rs:
```rust
pub mod flow;
```

Register commands in main.rs invoke_handler:
- start_flow_tracking
- stop_flow_tracking
- get_flow_state
- tick_flow
- handle_app_focus
- pause_flow_tracking
- resume_flow_tracking
- get_flow_streak
- update_flow_streak
- reset_flow_streak

After making these changes:
1. Run `cargo build` in src-tauri directory
2. Verify no compilation errors
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
// Start tracking
const state = await window.__TAURI__.invoke('start_flow_tracking', {
  sessionId: 'test-session',
  sessionDurationMs: 45 * 60 * 1000 // 45 min
});
console.log('Initial state:', state);
// Expected: { is_tracking: true, level: 'none', ... }

// Simulate tick (call repeatedly to advance state)
const ticked = await window.__TAURI__.invoke('tick_flow');
console.log('After tick:', ticked);

// Test app focus
const afterFocus = await window.__TAURI__.invoke('handle_app_focus', {
  app: {
    name: 'Twitter',
    bundleId: 'com.twitter',
    isWhitelisted: false,
    isBlocked: true
  }
});
console.log('After blocked app:', afterFocus);
// Expected: grace.active: true

// Stop tracking
const summary = await window.__TAURI__.invoke('stop_flow_tracking');
console.log('Summary:', summary);

// Test streak
const streak = await window.__TAURI__.invoke('get_flow_streak');
console.log('Streak:', streak);
```
