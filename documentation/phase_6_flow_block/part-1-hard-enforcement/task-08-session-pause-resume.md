# Task: Implement Session Pause/Resume Logic

## Phase: 6
## Part: 1 (Hard Enforcement)
## Task: 08
## Depends On: task-07-idle-detection-ui
## Estimated Time: 2 hours

---

## Context Files

- `src-tauri/src/enforcement/session_pause.rs` (create)
- `src-tauri/src/enforcement/mod.rs` (update)
- `src-tauri/src/commands/enforcement.rs` (update)
- `src/hooks/useSessionTimer.ts` (update or create)
- `src/hooks/useEnforcement.ts` (update)

---

## Success Criteria

- [ ] `pause_session` Rust command stores pause start time
- [ ] `resume_session` Rust command calculates pause duration
- [ ] Session timer stops when paused
- [ ] Session timer resumes with correct remaining time
- [ ] Total paused time is tracked for session summary
- [ ] Multiple pause/resume cycles accumulate correctly
- [ ] Pause reason is stored (idle, screenLock, user)
- [ ] Flow detection is notified of pause (for Part 2)

---

## Test Cases

- Pause session → expect timer stops at current value
- Pause for 2 min, resume → expect timer shows same value as when paused
- Pause, resume, pause again → expect total paused time accumulates
- 10 min session, pause at 5 min for 3 min → expect session ends after 8 min wall time
- Get session summary → expect totalPausedTime reflects all pauses
- Pause with reason 'idle' → expect reason stored correctly
- Resume session → expect pause reason cleared

---

## Implementation Prompt

```
Implement session pause/resume logic in Rust backend and integrate with frontend hooks.

Create file: src-tauri/src/enforcement/session_pause.rs

```rust
use std::sync::Mutex;
use once_cell::sync::Lazy;
use chrono::Utc;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PauseReason {
    Idle,
    ScreenLock,
    User,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PauseRecord {
    pub started_at: i64,
    pub ended_at: Option<i64>,
    pub reason: PauseReason,
    pub duration_ms: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionPauseState {
    pub is_paused: bool,
    pub current_pause_started: Option<i64>,
    pub current_pause_reason: Option<PauseReason>,
    pub pause_history: Vec<PauseRecord>,
    pub total_paused_ms: i64,
}

impl Default for SessionPauseState {
    fn default() -> Self {
        Self {
            is_paused: false,
            current_pause_started: None,
            current_pause_reason: None,
            pause_history: Vec::new(),
            total_paused_ms: 0,
        }
    }
}

static PAUSE_STATE: Lazy<Mutex<SessionPauseState>> =
    Lazy::new(|| Mutex::new(SessionPauseState::default()));

/// Pause the session
pub fn pause_session(reason: PauseReason) -> Result<SessionPauseState, String> {
    let mut state = PAUSE_STATE.lock().map_err(|e| e.to_string())?;
    
    if state.is_paused {
        return Err("Session is already paused".to_string());
    }
    
    let now = Utc::now().timestamp_millis();
    
    state.is_paused = true;
    state.current_pause_started = Some(now);
    state.current_pause_reason = Some(reason);
    
    println!("[SessionPause] Session paused at {} for reason {:?}", now, reason);
    
    Ok(state.clone())
}

/// Resume the session
pub fn resume_session() -> Result<SessionPauseState, String> {
    let mut state = PAUSE_STATE.lock().map_err(|e| e.to_string())?;
    
    if !state.is_paused {
        return Err("Session is not paused".to_string());
    }
    
    let now = Utc::now().timestamp_millis();
    let pause_started = state.current_pause_started
        .ok_or("No pause start time recorded")?;
    
    let pause_duration = now - pause_started;
    
    // Record the pause
    let pause_record = PauseRecord {
        started_at: pause_started,
        ended_at: Some(now),
        reason: state.current_pause_reason.unwrap_or(PauseReason::User),
        duration_ms: pause_duration,
    };
    
    state.pause_history.push(pause_record);
    state.total_paused_ms += pause_duration;
    
    // Clear current pause
    state.is_paused = false;
    state.current_pause_started = None;
    state.current_pause_reason = None;
    
    println!(
        "[SessionPause] Session resumed. Pause duration: {}ms, Total paused: {}ms",
        pause_duration, state.total_paused_ms
    );
    
    Ok(state.clone())
}

/// Get current pause state
pub fn get_pause_state() -> SessionPauseState {
    PAUSE_STATE.lock()
        .map(|state| state.clone())
        .unwrap_or_default()
}

/// Reset pause state (call when starting new session)
pub fn reset_pause_state() {
    if let Ok(mut state) = PAUSE_STATE.lock() {
        *state = SessionPauseState::default();
    }
}

/// Get total paused time in milliseconds
pub fn get_total_paused_time() -> i64 {
    PAUSE_STATE.lock()
        .map(|state| state.total_paused_ms)
        .unwrap_or(0)
}

/// Check if session is currently paused
pub fn is_session_paused() -> bool {
    PAUSE_STATE.lock()
        .map(|state| state.is_paused)
        .unwrap_or(false)
}
```

Update file: src-tauri/src/enforcement/mod.rs

Add:
```rust
pub mod session_pause;
pub use session_pause::*;
```

Update file: src-tauri/src/commands/enforcement.rs

Add these commands:

```rust
use crate::enforcement::session_pause::{
    PauseReason,
    SessionPauseState,
    pause_session as pause_session_impl,
    resume_session as resume_session_impl,
    get_pause_state as get_pause_state_impl,
    reset_pause_state as reset_pause_state_impl,
    get_total_paused_time as get_total_paused_time_impl,
    is_session_paused as is_session_paused_impl,
};

#[command]
pub fn pause_session(reason: String) -> Result<SessionPauseState, String> {
    let pause_reason = match reason.to_lowercase().as_str() {
        "idle" => PauseReason::Idle,
        "screenlock" | "screen_lock" => PauseReason::ScreenLock,
        _ => PauseReason::User,
    };
    pause_session_impl(pause_reason)
}

#[command]
pub fn resume_session() -> Result<SessionPauseState, String> {
    resume_session_impl()
}

#[command]
pub fn get_pause_state() -> SessionPauseState {
    get_pause_state_impl()
}

#[command]
pub fn reset_pause_state() {
    reset_pause_state_impl()
}

#[command]
pub fn get_total_paused_time() -> i64 {
    get_total_paused_time_impl()
}

#[command]
pub fn is_session_paused() -> bool {
    is_session_paused_impl()
}
```

Register new commands in main.rs invoke_handler:
- pause_session
- resume_session
- get_pause_state
- reset_pause_state
- get_total_paused_time
- is_session_paused

Now update the frontend:

Update file: src/lib/tauri-bridge.ts

Add:
```typescript
// Session pause commands
pauseSession: async (reason: 'idle' | 'screenLock' | 'user'): Promise<SessionPauseState> => {
  return invoke('pause_session', { reason });
},

resumeSession: async (): Promise<SessionPauseState> => {
  return invoke('resume_session');
},

getPauseState: async (): Promise<SessionPauseState> => {
  return invoke('get_pause_state');
},

resetPauseState: async (): Promise<void> => {
  return invoke('reset_pause_state');
},

getTotalPausedTime: async (): Promise<number> => {
  return invoke('get_total_paused_time');
},

isSessionPaused: async (): Promise<boolean> => {
  return invoke('is_session_paused');
},
```

Add the type:
```typescript
interface SessionPauseState {
  isPaused: boolean;
  currentPauseStarted: number | null;
  currentPauseReason: 'idle' | 'screenLock' | 'user' | null;
  pauseHistory: Array<{
    startedAt: number;
    endedAt: number | null;
    reason: string;
    durationMs: number;
  }>;
  totalPausedMs: number;
}
```

Update file: src/hooks/useEnforcement.ts

Integrate pause/resume with idle detection:

```typescript
// Add to existing useEnforcement hook

const {
  idleSeconds,
  isScreenLocked,
  showWarning,
  showPaused: idlePaused,
  dismissWarning,
  resumeSession: resumeFromIdle,
} = useIdleDetection({
  enabled: sessionActive && !blockScreenVisible,
  onPause: async () => {
    // Pause the session timer
    const reason = isScreenLocked ? 'screenLock' : 'idle';
    await tauriBridge.pauseSession(reason);
    setIsPaused(true);
    setPauseReason(reason);
  },
});

const handleResume = useCallback(async () => {
  try {
    await tauriBridge.resumeSession();
    setIsPaused(false);
    setPauseReason(null);
    resumeFromIdle();
    console.log('[useEnforcement] Session resumed');
  } catch (err) {
    console.error('[useEnforcement] Failed to resume:', err);
  }
}, [resumeFromIdle]);

const handleEndSession = useCallback(() => {
  // Propagate to parent to end the session
  onEndSession?.();
}, [onEndSession]);

// Return additional values
return {
  // ... existing returns
  isPaused,
  pauseReason,
  showIdleWarning: showWarning,
  showSessionPaused: idlePaused,
  dismissIdleWarning: dismissWarning,
  resumeSession: handleResume,
  endSession: handleEndSession,
};
```

After making these changes:
1. Run `cargo build` in src-tauri directory
2. Run `npm run build` to verify TypeScript
3. Test pause/resume flow manually
```

---

## Verification

After completing this task:

```bash
cd src-tauri
cargo build
npm run build
```

Expected: No compilation errors.

Test in DevTools console:

```javascript
// Test pause
const pauseState = await window.__TAURI__.invoke('pause_session', { reason: 'idle' });
console.log('Paused:', pauseState);
// Expected: { is_paused: true, current_pause_started: <timestamp>, ... }

// Wait a few seconds...

// Test resume
const resumeState = await window.__TAURI__.invoke('resume_session');
console.log('Resumed:', resumeState);
// Expected: { is_paused: false, total_paused_ms: ~3000, pause_history: [1 record] }

// Test total paused time
const totalPaused = await window.__TAURI__.invoke('get_total_paused_time');
console.log('Total paused (ms):', totalPaused);
// Expected: ~3000 (however long you waited)

// Reset for next session
await window.__TAURI__.invoke('reset_pause_state');
const resetState = await window.__TAURI__.invoke('get_pause_state');
console.log('Reset state:', resetState);
// Expected: { is_paused: false, total_paused_ms: 0, pause_history: [] }
```

### Integration Test

1. Start a session
2. Wait 2+ minutes (or temporarily lower threshold for testing)
3. Expect: Idle warning appears
4. Continue waiting to 5+ minutes
5. Expect: Session paused overlay appears
6. Click "Resume Session"
7. Expect: Session continues, timer shows correct remaining time
8. Complete or end session
9. Check session summary includes total paused time
