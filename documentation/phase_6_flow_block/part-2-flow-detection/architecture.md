# Flow Detection Architecture

## Phase: 6
## Part: 2
## Document Type: Architecture Specification

---

## Overview

Flow Detection tracks when users enter and maintain focus states during sessions. This enables celebration of deep work, flow streaks, and post-session insights.

---

## Flow State Definitions

| State | Threshold | Description |
|-------|-----------|-------------|
| None | 0 min | Not in flow (or < 30 min session) |
| Building | 5 min | Uninterrupted focus for 5 minutes |
| Established | 10 min | Solid focus maintained |
| Deep | 20 min | Optimal flow state achieved |

---

## Flow State Machine

```
                    ┌─────────────────────────────────────────────┐
                    │                                             │
                    ▼                                             │
              ┌──────────┐                                        │
    ──────────│   None   │◄───────────────────────────────────────┤
   Session    └────┬─────┘    Grace period exceeded               │
   Start           │          OR session < 30 min                 │
                   │                                              │
                   │ 5 min uninterrupted                          │
                   ▼                                              │
              ┌──────────┐                                        │
              │ Building │────────────────────────────────────────┤
              └────┬─────┘    Blocked app > 90 sec                │
                   │                                              │
                   │ 10 min uninterrupted                         │
                   ▼                                              │
              ┌──────────┐                                        │
              │Established│───────────────────────────────────────┤
              └────┬─────┘    Blocked app > 90 sec                │
                   │                                              │
                   │ 20 min uninterrupted                         │
                   ▼                                              │
              ┌──────────┐                                        │
              │   Deep   │────────────────────────────────────────┘
              └──────────┘    Blocked app > 90 sec
```

---

## Key Rules

### Session Duration Requirement
- Flow detection only active in sessions ≥ 30 minutes
- Shorter sessions: flow state always "None"

### Grace Period
- **Duration**: 90 seconds
- **Purpose**: Quick app checks don't break flow
- **Behavior**: Timer pauses during grace period, resumes if user returns to whitelisted app
- **Exceeded**: Flow resets to "None", hard reset of timer

### What Triggers Grace Period
- Switching to a non-whitelisted app
- Switching to a blocked app
- System dialog appears (debounce for quick dialogs)

### What Doesn't Trigger Grace Period
- Switching between whitelisted apps
- Dustoff Reset window focused
- System notifications (if not full-screen)

---

## Flow Celebrations

| Transition | Celebration | Achilles Mode | Hector Mode |
|------------|-------------|---------------|-------------|
| None → Building | "Flow building..." | Soft chime | Gentle notification |
| Building → Established | "🌊 In flow" | Warm tone | "You're doing great" |
| Established → Deep | "🔥 Deep flow!" | Rich achievement tone | "🌿 Deep flow - take pride in this" |
| Any → None (break) | "Flow broken" | Subtle, non-judgmental | "It's okay, let's refocus" |

---

## Flow Streaks

### Definition
A flow streak counts consecutive **weekdays** where user achieves Deep Flow.

### Weekend Handling
- **Weekends (Sat-Sun)**: Optional - don't break streak, don't extend
- **Future**: User-configurable work days

### Streak Milestones

| Days | Name | Badge | Emoji |
|------|------|-------|-------|
| 2 | Flow Spark | flow_spark | ⚡ |
| 3 | Flow Streak | flow_streak | 🔥 |
| 5 | Flow Master | flow_master | 🏆 |
| 7 | Flow Legend | flow_legend | 💎 |
| 14 | Unstoppable | flow_unstoppable | 👑 |

---

## Flow Protection (Opt-In)

### Auto-Extend
- **Trigger**: User in Deep Flow with < 5 min remaining
- **Action**: Extend session by 10 minutes (prompt user first)
- **Default**: Off

### Flow Warnings
- **Trigger**: User about to break flow (entering blocked app)
- **Action**: Show gentle reminder before block screen
- **Default**: Off

### Notification Suppression
- **Trigger**: User in Established or Deep flow
- **Action**: Suppress non-critical system notifications
- **Default**: Off (requires OS permissions)

---

## Data Model

### FlowState

```typescript
type FlowLevel = 'none' | 'building' | 'established' | 'deep';

interface FlowState {
  level: FlowLevel;
  startedAt: number | null;       // When current level started
  uninterruptedSince: number;     // When continuous focus began
  graceActive: boolean;           // In grace period?
  graceStartedAt: number | null;  // When grace period started
  graceTriggerApp: string | null; // App that triggered grace
}
```

### FlowPeriod (for history/analytics)

```typescript
interface FlowPeriod {
  id: string;
  sessionId: string;
  startedAt: number;
  endedAt: number | null;
  maxLevelReached: FlowLevel;
  wasInterrupted: boolean;
  interruptedByApp: string | null;
}
```

### FlowSessionSummary

```typescript
interface FlowSessionSummary {
  sessionId: string;
  totalFlowTime: number;           // Time spent in any flow state
  deepFlowTime: number;            // Time spent in deep flow
  flowPeriods: FlowPeriod[];       // All flow periods
  maxLevelReached: FlowLevel;
  longestFlowPeriod: number;       // Duration of longest unbroken flow
  flowBreaks: number;              // How many times flow was broken
  achievedDeepFlow: boolean;       // Did user reach deep flow?
}
```

### FlowStreak

```typescript
interface FlowStreak {
  currentStreak: number;           // Days
  longestStreak: number;           // Days
  lastDeepFlowDate: string;        // YYYY-MM-DD
  streakStartDate: string | null;  // YYYY-MM-DD
}
```

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FLOW DETECTION                           │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │    Flow     │  │   Grace     │  │    Flow     │             │
│  │   State     │  │   Period    │  │   Streak    │             │
│  │  Machine    │  │  Handler    │  │   Tracker   │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          │                                      │
│                          ▼                                      │
│                 ┌─────────────────┐                             │
│                 │   Flow Store    │                             │
│                 │  (Rust State)   │                             │
│                 └────────┬────────┘                             │
│                          │                                      │
│         ┌────────────────┼────────────────┐                     │
│         │                │                │                     │
│         ▼                ▼                ▼                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │     HUD     │  │ Celebration │  │   Session   │             │
│  │  Indicator  │  │   Handler   │  │   Summary   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Integration Points

### With App Monitoring (Part 1)
- Receives app focus change events
- Triggers grace period on blocked app
- Resets flow when grace exceeded

### With Session System
- Only active during sessions ≥ 30 min
- Pauses when session pauses
- Provides data for session summary

### With Badge System (Phase 8)
- Awards flow-related badges
- Tracks flow streaks

### With HUD
- Shows current flow state
- Shows time in flow
- Shows grace period countdown

---

## Rust Backend Requirements

### State Management
- FlowState stored in memory (resets per session)
- FlowStreak persisted to SQLite
- FlowPeriods logged to session_analytics

### Commands

| Command | Purpose |
|---------|---------|
| `start_flow_tracking` | Begin tracking for session |
| `stop_flow_tracking` | End tracking, return summary |
| `get_flow_state` | Get current flow state |
| `on_app_focus_change` | Handle app switch (internal) |
| `trigger_grace_period` | Start 90s grace timer |
| `check_grace_period` | Check if grace exceeded |
| `update_flow_streak` | Update streak after session |
| `get_flow_streak` | Get current streak data |
| `get_flow_badges` | Get earned flow badges |

### Events

| Event | When Fired |
|-------|------------|
| `flow_level_changed` | Flow state transitions |
| `grace_period_started` | Grace begins |
| `grace_period_ended` | Grace expires or user returns |
| `flow_broken` | Flow resets to none |

---

## UI Components

### HUD Flow Indicator

```
┌────────────────────────┐
│  🔥 Deep Flow          │
│  22:34 uninterrupted   │
└────────────────────────┘
```

States:
- Hidden (no flow or session < 30 min)
- Building: Subtle pulse animation
- Established: Steady glow
- Deep: Rich glow, special styling

### Grace Period Warning

```
┌────────────────────────────────────────┐
│  ⚠️ Flow at risk                       │
│  Return to focus in 1:12 to maintain  │
│  ━━━━━━━━━━━━░░░░░░░░░                │
└────────────────────────────────────────┘
```

### Post-Session Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Flow Timeline                                                  │
│                                                                 │
│  ░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██████████████░░░▓▓▓▓▓▓▓▓▓▓▓░░░      │
│  0        15        30        45        60        75        90 │
│                                                                 │
│  ░ None   ▓ Building/Established   █ Deep Flow                 │
│                                                                 │
│  Deep flow: 18 min                                              │
│  Total flow time: 54 min                                        │
│  Flow breaks: 1                                                 │
│                                                                 │
│  🔥 Flow streak: 3 days                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Testing Considerations

### Unit Tests
- Flow state transitions
- Grace period timing
- Streak calculation (including weekends)
- Badge eligibility

### Integration Tests
- App switch → grace period → return
- Full session with flow achievement
- Session end during flow

### Manual Tests
- Visual flow indicator updates
- Celebration timing
- Streak persistence across sessions
