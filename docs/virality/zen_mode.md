Let me create the complete specification for Zen mode.

---

# Zen Mode: Complete Specification

## Philosophy

**Zen is the training ground.** It's for:
- First-time users learning the system
- Recovery days when willpower is low
- Building awareness without punishment
- Gentle habit formation

**Zen says:** "I'm here to help you notice, not punish you."

---

## Mode Weights

| Weight Type | Multiplier | Rationale |
|-------------|------------|-----------|
| **Drain Weight** | 1.0x | Normal entropy decay |
| **Penalty Weight** | 1.0x | Full awareness, minimal punishment |
| **Bonus Weight** | 1.25x | Reward good behavior generously |

---

## Part 1: Detection

### 1.1 Activity Detection

| Signal | How Detected | Poll Rate | Data Stored |
|--------|--------------|-----------|-------------|
| **Active App** | macOS `NSWorkspace.shared.frontmostApplication` | Every 2 sec | `{ app_name, bundle_id, timestamp }` |
| **Active Window Title** | Accessibility API `AXUIElementCopyAttributeValue` | Every 2 sec | `{ window_title, app_name, timestamp }` |
| **App Switch** | Compare current vs previous app | Every 2 sec | `{ from_app, to_app, timestamp, was_whitelisted }` |
| **Time in App** | Accumulate while app is active | Continuous | `{ app_name, duration_seconds, session_id }` |
| **Idle State** | `CGEventSourceSecondsSinceLastEventType` | Every 5 sec | `{ idle_duration, last_activity_type }` |

### 1.2 Typing Detection

| Signal | How Detected | Threshold | Data Stored |
|--------|--------------|-----------|-------------|
| **Keystroke Rate** | Global key event monitor | N/A | `{ keys_per_minute, timestamp }` |
| **Typing Cadence** | Interval between keystrokes | Steady: σ < 150ms | `{ cadence_score, variability }` |
| **Backspace Count** | Count `kVK_Delete` key | N/A | `{ count, window_5min }` |
| **Backspace Burst** | 5+ backspaces in 3 seconds | 5 in 3 sec | `{ burst_detected, count, timestamp }` |
| **Undo Burst** | 3+ Cmd+Z in 10 seconds | 3 in 10 sec | `{ burst_detected, count, timestamp }` |
| **Typing Pause** | No typing for 30+ seconds | 30 sec | `{ pause_duration, during_flow }` |

### 1.3 Mouse Detection

| Signal | How Detected | Threshold | Data Stored |
|--------|--------------|-----------|-------------|
| **Mouse Speed** | Distance / time between samples | N/A | `{ avg_speed, max_speed }` |
| **Mouse Jitter** | Direction changes per second | > 8 changes/sec | `{ jitter_score, timestamp }` |
| **Click Rate** | Count mouse clicks | N/A | `{ clicks_per_minute }` |
| **Rapid Clicks** | 5+ clicks in 2 seconds | 5 in 2 sec | `{ burst_detected, count }` |
| **Scroll Behavior** | Scroll events and direction | N/A | `{ scroll_intensity, reading_pattern }` |

### 1.4 Cognitive State Detection

| State | Detection Algorithm | Confidence Threshold |
|-------|--------------------|--------------------|
| **Thinking** | `typing_rate < 10/min AND app_switches < 1/5min AND current_app in [IDE, Docs, Notes]` | 70% |
| **Flow** | `typing_cadence == steady AND app_switches < 2/10min AND backspace_rate < 5/min AND time_in_app > 5min` | 80% |
| **Drift** | `app_switches > 3/5min OR time_on_non_whitelist > 30sec OR idle > 3min` | 60% |
| **Distraction** | `current_app in distraction_list OR current_url in distraction_urls` | 90% |
| **Cognitive Friction** | `backspace_burst OR undo_burst OR mouse_jitter > threshold OR rapid_clicks` | 75% |

### 1.5 App Classification

| Category | Apps | Distraction Level |
|----------|------|-------------------|
| **Productive** | VS Code, Xcode, Terminal, iTerm, Figma, Notion, Obsidian, Linear | 0 (Safe) |
| **Neutral** | Finder, Preview, Calculator, Calendar | 1 (Low) |
| **Communication** | Slack, Discord, Messages, Mail, Zoom, Teams | 2 (Medium) |
| **Social Media** | Twitter/X, Facebook, Instagram, TikTok, LinkedIn | 4 (High) |
| **Entertainment** | YouTube, Netflix, Spotify, Twitch, Reddit | 5 (Very High) |
| **Gaming** | Steam, Any game app | 5 (Very High) |

---

## Part 2: Drains (Passive Bandwidth Loss)

Drains happen automatically over time, regardless of behavior.

### 2.1 Base Entropy Drain

| Drain Type | Base Rate | Zen Weight (1.0x) | Per Second | Notes |
|------------|-----------|-------------------|------------|-------|
| **Time Decay** | 0.15 / min | 0.15 / min | 0.0025 | Always active during session |

### 2.2 Contextual Drains

| Drain Type | Base Rate | Zen Rate | Trigger | Notes |
|------------|-----------|----------|---------|-------|
| **Idle Drain** | 0.5 / min | 0.5 / min | Idle > 2 min | Stacks with base decay |
| **Extended Idle** | 1.0 / min | 1.0 / min | Idle > 5 min | Replaces idle drain |
| **Non-Whitelist Passive** | 0.3 / min | 0.3 / min | On non-whitelist app | While present, not switching |
| **Communication App Drain** | 0.2 / min | 0.2 / min | On Slack/Discord/etc | Lower than social |

### 2.3 Drain Tracking

```typescript
interface DrainEvent {
  type: 'time_decay' | 'idle' | 'extended_idle' | 'non_whitelist_passive' | 'communication'
  amount: number
  timestamp: number
  session_id: string
  bandwidth_before: number
  bandwidth_after: number
}
```

**Storage:** Append to `drain_events` table, aggregate in session summary.

---

## Part 3: Penalties (Active Bandwidth Loss)

Penalties happen when user takes a distracting action.

### 3.1 App Switch Penalties

| Penalty Type | Base Value | Zen Value (1.0x) | Trigger |
|--------------|------------|------------------|---------|
| **Neutral Switch** | -2 | -2 | Switch to neutral app |
| **Communication Switch** | -4 | -4 | Switch to Slack/Discord/etc |
| **Social Media Switch** | -8 | -8 | Switch to Twitter/etc |
| **Entertainment Switch** | -10 | -10 | Switch to YouTube/etc |
| **Gaming Switch** | -12 | -12 | Switch to any game |
| **Non-Whitelist Switch** | -5 | -5 | Switch to app not on whitelist |

### 3.2 Tab Switch Penalties

| Penalty Type | Base Value | Zen Value | Trigger |
|--------------|------------|-----------|---------|
| **Tab Switch (Work)** | -1 | -1 | Switch between work tabs |
| **Tab Switch (Distraction)** | -6 | -6 | Switch to distraction tab |
| **New Tab (Social)** | -8 | -8 | Open new social media tab |

### 3.3 Cognitive Friction Penalties

| Penalty Type | Base Value | Zen Value | Trigger |
|--------------|------------|-----------|---------|
| **Backspace Burst** | -3 | -3 | 5+ backspaces in 3 sec |
| **Sustained Backspacing** | -5 | -5 | 20+ backspaces in 30 sec |
| **Undo Burst** | -3 | -3 | 3+ undos in 10 sec |
| **Mouse Jitter Spike** | -2 | -2 | Jitter score > threshold |
| **Rapid Clicking** | -2 | -2 | 5+ clicks in 2 sec |
| **Rage Pattern** | -8 | -8 | Multiple friction signals simultaneous |

### 3.4 Escalation (Repeated Offenses)

In Zen mode, escalation is **gentle**:

| Offense # | Multiplier | Example (Base -8) |
|-----------|------------|-------------------|
| 1st | 1.0x | -8 |
| 2nd | 1.1x | -8.8 |
| 3rd | 1.2x | -9.6 |
| 4th | 1.25x | -10 |
| 5th+ | 1.25x (capped) | -10 |

### 3.5 Penalty Tracking

```typescript
interface PenaltyEvent {
  type: string  // 'app_switch_social', 'backspace_burst', etc
  base_value: number
  mode_weight: number
  escalation_multiplier: number
  final_value: number
  timestamp: number
  session_id: string
  offense_number: number
  bandwidth_before: number
  bandwidth_after: number
  context: {
    from_app?: string
    to_app?: string
    backspace_count?: number
    // etc
  }
}
```

---

## Part 4: Bonuses (Bandwidth Gains)

### 4.1 Focus Bonuses

| Bonus Type | Base Value | Zen Value (1.25x) | Trigger |
|------------|------------|-------------------|---------|
| **Sustained Focus (5 min)** | +3 | +3.75 | 5 min no switches, on whitelist |
| **Sustained Focus (10 min)** | +5 | +6.25 | 10 min no switches |
| **Deep Work (15 min)** | +8 | +10 | 15 min uninterrupted |
| **Deep Work (30 min)** | +12 | +15 | 30 min uninterrupted |

### 4.2 Flow State Bonuses

| Bonus Type | Base Value | Zen Value | Trigger |
|------------|------------|-----------|---------|
| **Enter Flow** | +5 | +6.25 | Flow state detected |
| **Maintain Flow (per min)** | +1 | +1.25 | While in flow |
| **Flow Streak (12 min)** | +10 | +12.5 | 12 min continuous flow |
| **Flow Streak (20 min)** | +15 | +18.75 | 20 min continuous flow |

### 4.3 Recovery Bonuses

| Bonus Type | Base Value | Zen Value | Trigger |
|------------|------------|-----------|---------|
| **Quick Return** | 50% refund | 60% refund | Return to work < 10 sec |
| **Self-Correction** | +2 | +2.5 | Close distraction voluntarily |
| **Resist Temptation** | +3 | +3.75 | Open distraction, close < 5 sec |

### 4.4 Reset Ritual Bonuses

| Ritual Type | Base Value | Zen Value | Duration |
|-------------|------------|-----------|----------|
| **Breathing Reset** | +5 | +6.25 | 30 sec |
| **Movement Reset** | +8 | +10 | 60 sec |
| **Hydration Reset** | +6 | +7.5 | 45 sec |
| **Mindfulness Reset** | +10 | +12.5 | 90 sec |
| **Micro-Reset** | +3 | +3.75 | 15 sec |

### 4.5 Bonus Tracking

```typescript
interface BonusEvent {
  type: string  // 'sustained_focus_5', 'flow_enter', 'reset_breathing', etc
  base_value: number
  mode_weight: number
  final_value: number
  timestamp: number
  session_id: string
  bandwidth_before: number
  bandwidth_after: number
  context: {
    duration_minutes?: number
    flow_quality?: number
    ritual_completed?: boolean
  }
}
```

---

## Part 5: Interventions

### 5.1 Intervention Triggers

| Trigger | Threshold | Intervention Type |
|---------|-----------|-------------------|
| **Low Bandwidth** | < 60 | Gentle awareness nudge |
| **Critical Bandwidth** | < 40 | Suggest reset ritual |
| **Drift Detected** | 3+ switches in 5 min | Soft reminder |
| **Distraction App** | Open social/entertainment | Gentle notice |
| **Cognitive Friction** | Friction score > threshold | Wellness check |
| **Extended Idle** | > 5 min idle | Gentle ping |
| **Flow Broken** | Exit flow state | Encouragement |

### 5.2 Intervention Responses (Zen Mode)

#### Low Bandwidth Nudge
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                         💚                                       │
│                                                                 │
│              Your bandwidth is getting low.                     │
│                                                                 │
│              Consider a short reset when ready.                 │
│                                                                 │
│              Bandwidth: 54                                      │
│                                                                 │
│          [ BREATHING RESET ]    [ CONTINUE ]                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Appears as small overlay below HUD
- No blocking
- Auto-dismisses after 10 seconds if no action
- Sound: Soft chime

#### Critical Bandwidth Nudge
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                         🧘                                       │
│                                                                 │
│              Time for a reset.                                  │
│                                                                 │
│              Your bandwidth has dropped to 38.                  │
│              A quick reset will help you finish strong.         │
│                                                                 │
│          [ START RESET ]    [ REMIND ME LATER ]                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Slightly larger overlay
- Still no blocking
- Persists until dismissed
- Sound: Gentle bell

#### Drift Detection
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              You're moving around a lot.                        │
│                                                                 │
│              3 app switches in the last 5 minutes.              │
│              Need to capture something in the parking lot?      │
│                                                                 │
│          [ OPEN PARKING LOT ]    [ I'M FOCUSED ]                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Small toast notification
- Offers parking lot as solution
- Auto-dismisses after 8 seconds
- Sound: Soft notification

#### Distraction App Notice
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              📱 You've opened Twitter.                          │
│                                                                 │
│              That's okay — just noticing.                       │
│              Your bandwidth will drift while you're here.       │
│                                                                 │
│                      Bandwidth: 72 ↓                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Small, non-blocking notice
- Shows bandwidth is draining
- No action required
- Auto-dismisses after 5 seconds
- Sound: None (just visual)

#### Cognitive Friction Check
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                         ⌨️                                       │
│                                                                 │
│              Heavy editing detected.                            │
│                                                                 │
│              Looks like you're working through something.       │
│              A 30-second breather might help clarity.           │
│                                                                 │
│          [ BREATHING RESET ]    [ I'M GOOD ]                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Gentle, supportive tone
- Offers reset, doesn't push
- Sound: Soft alert

#### Extended Idle Ping
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              Still there?                                       │
│                                                                 │
│              No activity for 6 minutes.                         │
│              Taking a break or deep in thought?                 │
│                                                                 │
│          [ I'M THINKING ]    [ TAKING A BREAK ]                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Non-judgmental check-in
- "I'm thinking" stops idle drain temporarily
- "Taking a break" pauses session
- Sound: Gentle ping

#### Flow Broken Encouragement
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              Flow state ended.                                  │
│                                                                 │
│              You had 8 minutes of great focus.                  │
│              Ready to build another streak?                     │
│                                                                 │
│                      [ LET'S GO ]                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Positive framing
- Celebrates what was achieved
- Motivates next streak
- Sound: Soft positive chime

### 5.3 Intervention Tracking

```typescript
interface InterventionEvent {
  type: string  // 'low_bandwidth', 'drift_detected', 'friction_check', etc
  trigger_reason: string
  trigger_value: number  // bandwidth level, switch count, etc
  timestamp: number
  session_id: string
  response: 'accepted' | 'dismissed' | 'ignored' | 'timed_out'
  response_timestamp: number
  time_to_respond_ms: number
  bandwidth_at_trigger: number
  bandwidth_after: number
}
```

---

## Part 6: Session Summary & Reporting

### 6.1 Data Aggregation

At session end, calculate:

```typescript
interface ZenSessionSummary {
  session_id: string
  mode: 'Zen'
  started_at: string
  ended_at: string
  planned_duration_minutes: number
  actual_duration_minutes: number
  
  // Bandwidth
  bandwidth_start: number
  bandwidth_end: number
  bandwidth_low: number
  bandwidth_high: number
  bandwidth_average: number
  
  // Focus Metrics
  flow_state_entries: number
  flow_state_total_minutes: number
  flow_state_longest_streak_minutes: number
  flow_percentage: number  // time in flow / total time
  
  // Activity Metrics
  app_switches_total: number
  app_switches_to_distraction: number
  tab_switches_total: number
  time_on_whitelist_minutes: number
  time_on_distraction_minutes: number
  time_idle_minutes: number
  
  // Friction Metrics
  backspace_bursts: number
  total_backspaces: number
  undo_bursts: number
  mouse_jitter_spikes: number
  friction_score_average: number
  
  // Drains & Penalties
  total_drain: number
  total_penalties: number
  penalty_breakdown: {
    app_switches: number
    tab_switches: number
    friction: number
    other: number
  }
  
  // Bonuses
  total_bonuses: number
  bonus_breakdown: {
    focus: number
    flow: number
    recovery: number
    resets: number
  }
  
  // Interventions
  interventions_shown: number
  interventions_accepted: number
  interventions_dismissed: number
  resets_completed: number
  
  // Outcome
  victory_level: 'Legend' | 'Good' | 'Minimum' | 'Missed'
  end_reason: 'mission_complete' | 'stopping_early' | 'pulled_away'
}
```

### 6.2 Badges Earned (Zen Mode)

| Badge | Criteria | Icon |
|-------|----------|------|
| **First Steps** | Complete first Zen session | 🌱 |
| **Gentle Start** | Complete 3 Zen sessions | 🌿 |
| **Awareness Rising** | Respond to 5 interventions | 👁️ |
| **Reset Learner** | Complete 3 reset rituals | 🧘 |
| **Flow Taster** | Achieve flow state once | 💧 |
| **Calm Focus** | 30 min session with < 5 distractions | 🍃 |
| **Zen Student** | 10 completed Zen sessions | 📿 |
| **Friction Friend** | Respond to friction check, do reset | 🤝 |

### 6.3 Walks of Shame (Zen Mode)

In Zen mode, shame is **reframed as learning**:

| Event | Display | Tone |
|-------|---------|------|
| **High Distraction** | "Busy day! 23 app switches." | Observational |
| **Low Flow** | "Building focus takes time." | Encouraging |
| **Bandwidth Crash** | "Your bandwidth hit 28. Resets help!" | Educational |
| **Rage Quit** | "Session ended early. Tomorrow's fresh." | Forgiving |

---

## Part 7: Zen Mode Sound Design

| Event | Sound | Duration | Volume |
|-------|-------|----------|--------|
| **Session Start** | Soft ambient pad | 3 sec | 40% |
| **Enter Flow** | Gentle rising tone | 2 sec | 30% |
| **Exit Flow** | Soft falling tone | 2 sec | 25% |
| **Intervention (Info)** | Light chime | 1 sec | 35% |
| **Intervention (Suggest Reset)** | Gentle bell | 1.5 sec | 40% |
| **Reset Start** | Breathing ambient | Loop | 30% |
| **Reset Complete** | Positive ding | 1 sec | 45% |
| **Session Complete** | Warm completion sound | 3 sec | 50% |
| **Bonus Earned** | Soft sparkle | 1 sec | 30% |

---

## Part 8: Database Schema (Zen Mode Events)

```sql
-- All events for Zen sessions
CREATE TABLE zen_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,  -- 'drain', 'penalty', 'bonus', 'intervention', 'state_change'
  event_subtype TEXT NOT NULL,  -- specific event name
  timestamp INTEGER NOT NULL,
  bandwidth_before REAL,
  bandwidth_after REAL,
  value REAL,  -- drain/penalty/bonus amount
  mode_weight REAL DEFAULT 1.0,
  escalation_multiplier REAL DEFAULT 1.0,
  context TEXT,  -- JSON blob with event-specific data
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE INDEX idx_zen_events_session ON zen_events(session_id);
CREATE INDEX idx_zen_events_type ON zen_events(event_type);
CREATE INDEX idx_zen_events_timestamp ON zen_events(timestamp);

-- Zen-specific aggregates per session
CREATE TABLE zen_session_metrics (
  session_id TEXT PRIMARY KEY,
  flow_entries INTEGER DEFAULT 0,
  flow_total_seconds INTEGER DEFAULT 0,
  flow_longest_streak_seconds INTEGER DEFAULT 0,
  app_switches INTEGER DEFAULT 0,
  distraction_switches INTEGER DEFAULT 0,
  backspace_bursts INTEGER DEFAULT 0,
  friction_spikes INTEGER DEFAULT 0,
  interventions_shown INTEGER DEFAULT 0,
  interventions_accepted INTEGER DEFAULT 0,
  resets_completed INTEGER DEFAULT 0,
  total_drain REAL DEFAULT 0,
  total_penalties REAL DEFAULT 0,
  total_bonuses REAL DEFAULT 0,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);
```

---

## Part 9: Zen Mode Summary

### The Zen Experience

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ZEN MODE: THE TRAINING GROUND                                 │
│                                                                 │
│   • Detection: Full (we see everything)                         │
│   • Enforcement: None (we don't block)                          │
│   • Intervention: Gentle (we suggest, not demand)               │
│   • Penalties: Normal (awareness of impact)                     │
│   • Bonuses: Generous (reward good behavior)                    │
│   • Tone: Supportive, observational, encouraging                │
│                                                                 │
│   "I'm here to help you notice, not punish you."                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Differentiators from Flow/Legend

| Aspect | Zen | Flow | Legend |
|--------|-----|------|--------|
| Blocking | ❌ Never | ⏱️ Delay gate | 🛑 Full block |
| Tone | Gentle | Challenging | Demanding |
| Penalties | 1.0x | 1.25x | 1.5x |
| Bonuses | 1.25x | 1.0x | 0.75x |
| Escalation Cap | 1.25x | 1.5x | 2.0x |
| Shame | Reframed | Visible | Public option |
