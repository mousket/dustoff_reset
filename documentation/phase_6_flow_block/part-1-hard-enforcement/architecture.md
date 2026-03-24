# Hard Enforcement Architecture

## Phase: 6
## Part: 1
## Document Type: Architecture Specification

---

## Overview

Hard Enforcement transforms Dustoff Reset from an accountability tool into an actual blocker. In Legend mode, distracting apps are not just flagged—they're blocked.

---

## Current State vs. Target State

| Aspect | Current (Phase 4.5) | Target (Phase 6) |
|--------|---------------------|------------------|
| Distraction detected | Show Delay Gate / Block Screen | Actually prevent access |
| Block screen | Can be dismissed | Cannot be dismissed (Legend) |
| Repeated violations | Same response | Escalating consequences |
| User walks away | Session continues | Session pauses |
| Screen locked | Session continues | Session pauses |

---

## Hard Enforcement Modes by Session Mode

| Session Mode | Enforcement Level |
|--------------|-------------------|
| Zen | No enforcement (tracking only) |
| Flow | Delay Gate (current behavior) |
| Legend | Hard Block (new behavior) |

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        HARD ENFORCEMENT                         │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Block     │  │    App      │  │    Idle     │             │
│  │   Screen    │  │  Blocking   │  │  Detection  │             │
│  │  (Enhanced) │  │   (New)     │  │   (New)     │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          │                                      │
│                          ▼                                      │
│                 ┌─────────────────┐                             │
│                 │    Session      │                             │
│                 │   Controller    │                             │
│                 └─────────────────┘                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Block Screen Enhancement

### Current Block Screen

- Appears when user accesses blocked app
- Shows countdown timer
- User can wait or dismiss

### Enhanced Block Screen (Legend Mode)

- **Cannot be dismissed** until timer completes
- **Covers entire screen** (not just a panel)
- **Prevents app switching** while active
- **Shows escalating messages** for repeat offenses

### Block Screen States

```
┌─────────────┐
│   Hidden    │ ← No violation
└──────┬──────┘
       │ Violation detected
       ▼
┌─────────────┐
│  Countdown  │ ← Timer running (Legend: 30-120 sec)
└──────┬──────┘
       │ Timer complete
       ▼
┌─────────────┐
│ Dismissable │ ← User can close
└──────┬──────┘
       │ User closes
       ▼
┌─────────────┐
│   Hidden    │
└─────────────┘
```

### Countdown Durations by Violation Count

| Violation # | Duration | Message Tone |
|-------------|----------|--------------|
| 1st | 30 seconds | "Let's get back on track" |
| 2nd | 60 seconds | "This is your second distraction" |
| 3rd | 90 seconds | "Three distractions. Take a breath." |
| 4th+ | 120 seconds | "Consider what you're trying to achieve" |

---

## App Blocking Mechanism

### Strategy: Window Management

Rather than killing processes (aggressive, may lose work), we:

1. **Detect** when blocked app gains focus
2. **Immediately** show block screen overlay
3. **Optionally** minimize the blocked app
4. **Return focus** to last whitelisted app

### macOS Implementation

```rust
// Pseudocode
fn on_app_focus_change(app: &App) {
    if session.is_active() && session.mode == Legend {
        if is_blocked(app) {
            show_block_screen();
            minimize_app(app);
            focus_app(session.last_whitelisted_app);
        }
    }
}
```

### Windows Implementation

Similar approach using Windows API for window management.

---

## Idle Detection

### Purpose

Detect when user is not actively at the computer so we can:
1. Pause the session timer
2. Pause flow tracking
3. Resume automatically when they return

### Detection Methods

| Method | What It Detects | Reliability |
|--------|-----------------|-------------|
| Screen lock | User locked computer | High |
| Screen saver | User inactive | High |
| System idle time | No input for X minutes | Medium |

### Idle Thresholds

| Threshold | Action |
|-----------|--------|
| 2 minutes no input | Show "Still there?" prompt |
| 5 minutes no input | Pause session |
| Screen lock | Pause session immediately |
| Screen unlock | Resume session (with confirmation) |

### Session Pause State

```
┌─────────────┐
│   Active    │
└──────┬──────┘
       │ Idle detected
       ▼
┌─────────────┐
│   Paused    │ ← Timer stops, flow pauses
└──────┬──────┘
       │ Activity detected
       ▼
┌─────────────┐
│  Resuming   │ ← "Welcome back! Continue session?"
└──────┬──────┘
       │ User confirms
       ▼
┌─────────────┐
│   Active    │
└─────────────┘
```

---

## Escalating Consequences

### Philosophy

Repeated distractions within a session indicate:
- The task is difficult
- The user is fatigued
- The blocklist needs adjustment

### Escalation Ladder

| Level | Trigger | Consequence |
|-------|---------|-------------|
| 1 | 1st distraction | Standard block screen (30s) |
| 2 | 2nd distraction | Longer block (60s) + message |
| 3 | 3rd distraction | Longer block (90s) + reflection prompt |
| 4 | 4th+ distraction | Maximum block (120s) + suggestion to end session |

### Reflection Prompts (Level 3+)

```
"You've been distracted 3 times this session.

What's making it hard to focus right now?

○ The task is unclear
○ I'm tired or fatigued  
○ Something is on my mind
○ I need a break
○ The wrong apps are blocked"
```

This data could feed into future insights (Hector mode, conversational AI).

---

## Data Model Additions

### Session Enforcement State

```typescript
interface SessionEnforcementState {
  violationCount: number;
  violations: Violation[];
  currentBlockScreen: BlockScreenState | null;
  isPaused: boolean;
  pausedAt: number | null;
  pauseReason: 'idle' | 'user' | 'system' | null;
  totalPausedTime: number;
}

interface Violation {
  id: string;
  timestamp: number;
  appName: string;
  appBundleId: string;
  duration: number; // How long block screen was shown
  escalationLevel: number;
}

interface BlockScreenState {
  isVisible: boolean;
  startTime: number;
  duration: number;
  canDismiss: boolean;
  violationNumber: number;
  message: string;
}
```

### Idle State

```typescript
interface IdleState {
  isIdle: boolean;
  idleStartTime: number | null;
  lastActivityTime: number;
  screenLocked: boolean;
}
```

---

## Rust Backend Requirements

### New Commands

| Command | Purpose |
|---------|---------|
| `get_system_idle_time` | Get seconds since last input |
| `is_screen_locked` | Check if screen is locked |
| `minimize_window` | Minimize a specific app window |
| `focus_window` | Bring app to foreground |
| `get_frontmost_app` | Get currently focused app |

### Event Subscriptions

| Event | When Fired |
|-------|------------|
| `app_focus_changed` | User switches apps |
| `screen_locked` | Screen lock activated |
| `screen_unlocked` | Screen unlocked |
| `system_idle` | No input for threshold time |
| `system_active` | Input detected after idle |

---

## UI Components

### Enhanced Block Screen

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│                                                                 │
│                           🛑                                    │
│                                                                 │
│                    You opened Twitter                           │
│                                                                 │
│              This app is blocked during Legend mode             │
│                                                                 │
│                                                                 │
│                         ┌────────┐                              │
│                         │   47   │                              │
│                         │  sec   │                              │
│                         └────────┘                              │
│                                                                 │
│                   Wait to continue your session                 │
│                                                                 │
│                                                                 │
│           ─────────────────────────────────────────             │
│                                                                 │
│                  This is distraction #2 today                   │
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Session Paused Overlay

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                           ⏸️                                    │
│                                                                 │
│                    Session Paused                               │
│                                                                 │
│              You've been away for 5 minutes                     │
│                                                                 │
│                                                                 │
│                    ┌─────────────────┐                          │
│                    │  Resume Session │                          │
│                    └─────────────────┘                          │
│                                                                 │
│                      End Session                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Integration Points

### With Existing Session System

- Block screen triggers use existing intervention system
- Violation tracking extends existing telemetry
- Pause state integrates with session timer

### With Flow Detection (Part 2)

- Idle detection shares signals with flow
- Block screen triggers reset flow state
- Pause state pauses flow tracking

---

## Security Considerations

### Preventing Bypass

In Legend mode, we want to make bypassing difficult (but not impossible—this isn't malware):

1. Block screen is a top-level window
2. Keyboard shortcuts are captured (Cmd+Tab shows block screen again)
3. Force quit of Dustoff Reset ends the session (not a bypass)

### Not Malware

Important: Users can always:
- Force quit Dustoff Reset
- End the session early (with penalty)
- Switch to Zen mode next time

We're building accountability, not prison software.

---

## Testing Considerations

### Unit Tests

- Block screen timer accuracy
- Escalation level calculation
- Idle time detection
- Pause/resume state transitions

### Integration Tests

- App switch → block screen flow
- Screen lock → pause → unlock → resume flow
- Multiple violations → escalation flow

### Manual Tests

- Block screen covers full screen
- Cannot switch apps while block screen visible
- Session pauses when screen locks
- Resume prompt appears on return
