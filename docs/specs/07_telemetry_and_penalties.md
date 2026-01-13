Thought for 2sI'll provide you the complete Telemetry and Penalties documentation as text that you can copy and save manually.

Gathered telemetry architectureHere's the complete **Telemetry and Penalties** documentation as text you can save manually:

---

# **07 - Telemetry and Penalties Specification**

**Version:** 1.0**Last Updated:** January 12, 2026**Purpose:** Complete specification of telemetry monitoring, distraction detection, penalty system, and intervention triggering logic for Human Capacity OS.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Event Detection System](#2-event-detection-system)
3. [Penalty Architecture](#3-penalty-architecture)
4. [Burst Detection Logic](#4-burst-detection-logic)
5. [Intervention Trigger System](#5-intervention-trigger-system)
6. [Whitelist Management](#6-whitelist-management)
7. [State Tracking](#7-state-tracking)
8. [Implementation Guidelines](#8-implementation-guidelines)


---

## 1. Overview

### 1.1 Philosophy

The telemetry system monitors user behavior to detect patterns that indicate diminishing cognitive capacity. Rather than punitive, the system is **corrective** - it detects distraction signals early and provides interventions before deep work is lost.

**Key Principles:**

- **Non-invasive monitoring** - Track patterns, not content
- **Burst detection** - Distinguish between intentional context shifts and frantic switching
- **Escalating responses** - Gentle nudges → Firm warnings → Hard stops (mode-dependent)
- **Recovery pathways** - Always provide a way to restore bandwidth through rituals


---

### 1.2 Event Types

All bandwidth adjustments are triggered by discrete events:

```typescript
type BandwidthEventType =
  | 'friction'              // User frustration detected
  | 'focus-slipping'        // Attention wandering detected
  | 'non-whitelisted-app'   // Opened blacklisted app
  | 'tab-switch'            // Browser tab switched
  | 'app-switch'            // Desktop app switched
  | 'sustained-focus'       // Continuous focus maintained
  | 'flow-celebration'      // Flow state achieved
  | 'breath-reset'          // Breath ritual completed
  | 'walk-reset'            // Walk ritual completed
  | 'dump-reset'            // Parking lot dump completed
```

Each event includes:

- **type**: Event classification
- **timestamp**: Milliseconds since epoch
- **details**: Optional metadata (app name, switch count, etc.)


---

## 2. Event Detection System

### 2.1 Manual Intervention Events

Users can manually trigger interventions via HUD buttons:

#### **Friction Event**

**Trigger:** User clicks "Friction" button in HUD

**Detection Signal:** User reports feeling stuck, confused, or frustrated

**Penalty Applied:**

```typescript
function applyFrictionPenalty(current: number): number {
  return Math.max(0, current - 5)
}
```

**Bandwidth Impact:** -5 points

---

#### **Focus-Slipping Event**

**Trigger:** User clicks "Focus-Slipping" button in HUD

**Detection Signal:** User reports mind wandering, distraction, or fatigue

**Penalty Applied:**

```typescript
function applyFocusSlippingPenalty(current: number): number {
  return Math.max(0, current - 10)
}
```

**Bandwidth Impact:** -10 points (larger than friction to signal more serious capacity loss)

---

### 2.2 Auto-Detection Events (Future Implementation)

**Phase 2 Feature:** These events are currently simulated via the Mid-Session Intelligence Test Panel but will be auto-detected via OS telemetry in the Tauri desktop app.

---

#### **Non-Whitelisted App Event**

**Trigger:** User switches to an application outside the pre-session whitelist

**Detection Method:** OS-level process monitoring (Tauri background thread)

**Penalty Logic:**

```typescript
function applyNonWhitelistedAppPenalty(
  current: number,
  appName: string,
  lastOccurrence: number | undefined
): number {
  const now = Date.now()
  const isRepeat = lastOccurrence && (now - lastOccurrence) < 120000 // 2 minutes
  
  if (isRepeat) {
    return Math.max(0, current - 6)  // Repeat offense penalty
  }
  return Math.max(0, current - 12)   // First offense penalty
}
```

**Bandwidth Impact:**

- First violation: **-12 points** (strong deterrent)
- Repeat within 2 minutes: **-6 points** (recognizes pull is hard to resist)


**Example:**

- User opens Slack (not whitelisted) at 10:00:00 → -12 bandwidth
- User opens Slack again at 10:01:30 → -6 bandwidth (repeat within 2 min window)
- User opens Slack again at 10:05:00 → -12 bandwidth (outside 2 min window, treated as first offense again)


---

#### **Tab Switch Event**

**Trigger:** User switches browser tabs

**Detection Method:** Browser extension or OS-level window monitoring (Tauri)

**Penalty Logic:**

```typescript
function applyTabSwitchPenalty(
  current: number, 
  switchCount: number, 
  timeWindow: number
): number {
  // Burst detection: >5 switches in 60 seconds
  if (switchCount > 5 && timeWindow <= 60000) {
    return Math.max(0, current - 5)  // Burst penalty
  }
  // Normal switch
  return Math.max(0, current - 2)    // Single switch penalty
}
```

**Bandwidth Impact:**

- Single tab switch: **-2 points** (small penalty, acknowledges legitimate shifts)
- Burst (>5 switches in 60s): **-5 points** (recognizes frantic behavior)


**Example:**

- Switch from VSCode to Chrome tab 1 → -2 bandwidth
- Switch rapidly between 6 tabs in 45 seconds → -5 bandwidth (burst detected)


---

#### **App Switch Event**

**Trigger:** User switches between desktop applications

**Detection Method:** OS-level active window monitoring (Tauri)

**Penalty Logic:**

```typescript
function applyAppSwitchPenalty(
  current: number, 
  switchCount: number, 
  timeWindow: number
): number {
  // Burst detection: >3 switches in 60 seconds
  if (switchCount > 3 && timeWindow <= 60000) {
    return Math.max(0, current - 6)  // Burst penalty
  }
  // Normal switch
  return Math.max(0, current - 4)    // Single switch penalty
}
```

**Bandwidth Impact:**

- Single app switch: **-4 points** (moderate penalty, app switches are more expensive than tab switches)
- Burst (>3 switches in 60s): **-6 points** (recognizes task-switching fatigue)


**Example:**

- Switch from VSCode to Terminal → -4 bandwidth
- Switch VSCode → Terminal → Chrome → Slack in 30 seconds → -6 bandwidth (burst detected)


---

### 2.3 Positive Events

#### **Sustained Focus Gain**

**Trigger:** Every minute of continuous focus (no switches, no interventions)

**Detection Method:** Timer increments if no distraction events occur

**Gain Logic:**

```typescript
function applySustainedFocusGain(current: number): number {
  return Math.min(95, current + 1)  // +1 per minute, cap at 95
}
```

**Bandwidth Impact:** +1 point per minute

**Rationale:** Slow, steady recovery that rewards genuine focus but caps at 95 to prevent gaming the system.

---

#### **Flow Celebration Bonus**

**Trigger:** Flow state detected (see Section 4)

**Gain Logic:**

```typescript
function applyFlowCelebrationBonus(current: number): number {
  return Math.min(95, current + 5)  // One-time +5 bonus
}
```

**Bandwidth Impact:** +5 points (one-time bonus when flow overlay appears)

---

#### **Reset Ritual Restorations**

**Breath Reset:**

```typescript
function applyBreathResetRestoration(current: number): number {
  return Math.min(100, current + 5)  // +5 restoration
}
```

**Walk Reset:**

```typescript
function applyWalkResetRestoration(current: number): number {
  return Math.min(100, current + 7.5)  // +7.5 restoration (strongest)
}
```

**Dump Reset (Parking Lot):**

```typescript
function applyDumpResetRestoration(current: number): number {
  return Math.min(100, current + 6)  // +6 restoration
}
```

**Rationale:**

- Walk is most restorative (+7.5) due to physical movement and mental break
- Dump is second (+6) as it clears mental clutter through externalization
- Breath is quickest (+5) but less intensive


---

## 3. Penalty Architecture

### 3.1 Penalty Summary Table

| Event Type | First Occurrence | Repeat Condition | Repeat Penalty | Recovery Method
|-----|-----|-----|-----|-----
| **Friction** | -5 | N/A | N/A | Ritual (+5-7.5)
| **Focus-Slipping** | -10 | N/A | N/A | Ritual (+5-7.5)
| **Non-Whitelisted App** | -12 | Within 2 min | -6 | Ritual (+5-7.5)
| **Tab Switch (Normal)** | -2 | N/A | N/A | Sustained focus (+1/min)
| **Tab Switch (Burst)** | -5 | >5 in 60s | -5 | Ritual (+5-7.5)
| **App Switch (Normal)** | -4 | N/A | N/A | Ritual (+5-7.5)
| **App Switch (Burst)** | -6 | >3 in 60s | -6 | Ritual (+5-7.5)


---

### 3.2 Bandwidth Clamping

All bandwidth values are clamped to [0, 100]:

```typescript
function clampBandwidth(value: number): number {
  return Math.max(0, Math.min(100, value))
}
```

**Examples:**

- Current: 8, Penalty: -12 → Result: 0 (not -4)
- Current: 92, Gain: +10 → Result: 100 (not 102)


---

## 4. Burst Detection Logic

### 4.1 Tab Switch Burst Detection

**Definition:** More than 5 tab switches within a 60-second rolling window

**Implementation:**

```typescript
interface SwitchTracker {
  lastSwitchTimestamp: number
  switchCount: number
}

function detectTabSwitchBurst(
  tracker: SwitchTracker, 
  currentTimestamp: number
): boolean {
  const timeWindow = currentTimestamp - tracker.lastSwitchTimestamp
  
  // Reset count if outside 60-second window
  if (timeWindow > 60000) {
    tracker.switchCount = 1
    tracker.lastSwitchTimestamp = currentTimestamp
    return false
  }
  
  // Increment count within window
  tracker.switchCount++
  tracker.lastSwitchTimestamp = currentTimestamp
  
  // Burst detected if >5 switches
  return tracker.switchCount > 5
}
```

**Example Timeline:**

```plaintext
10:00:00 - Switch (count: 1)
10:00:15 - Switch (count: 2)
10:00:30 - Switch (count: 3)
10:00:45 - Switch (count: 4)
10:00:50 - Switch (count: 5)
10:00:55 - Switch (count: 6) → BURST DETECTED! Apply -5 penalty
```

---

### 4.2 App Switch Burst Detection

**Definition:** More than 3 app switches within a 60-second rolling window

**Implementation:**

```typescript
function detectAppSwitchBurst(
  tracker: SwitchTracker, 
  currentTimestamp: number
): boolean {
  const timeWindow = currentTimestamp - tracker.lastSwitchTimestamp
  
  // Reset count if outside 60-second window
  if (timeWindow > 60000) {
    tracker.switchCount = 1
    tracker.lastSwitchTimestamp = currentTimestamp
    return false
  }
  
  // Increment count within window
  tracker.switchCount++
  tracker.lastSwitchTimestamp = currentTimestamp
  
  // Burst detected if >3 switches
  return tracker.switchCount > 3
}
```

**Example Timeline:**

```plaintext
10:00:00 - VSCode (count: 1)
10:00:20 - Terminal (count: 2)
10:00:40 - Chrome (count: 3)
10:00:50 - Slack (count: 4) → BURST DETECTED! Apply -6 penalty
```

---

## 5. Intervention Trigger System

### 5.1 Auto-Intervention Thresholds

The system automatically triggers interventions based on bandwidth levels:

```typescript
function checkAutoInterventionTrigger(
  bandwidth: number
): 'friction' | 'focus-slipping' | null {
  if (bandwidth < 50) {
    return 'focus-slipping'  // Critical state
  }
  if (bandwidth < 60) {
    return 'friction'        // Warning state
  }
  return null               // Normal state
}
```

**Threshold Breakdown:**

- **bandwidth >= 60:** No auto-intervention
- **50 ≤ bandwidth < 60:** Friction intervention pane appears
- **bandwidth < 50:** Focus-slipping intervention pane appears (overrides friction)


---

### 5.2 Intervention Type Definitions

#### **Friction Intervention**

**Trigger Conditions:**

- Auto: bandwidth drops below 60
- Manual: User clicks "Friction" button


**Mode-Specific Responses:**

**Zen Mode:**

```plaintext
Title: "Friction Detected"
Message: "Take a moment to breathe. Reset your focus. You are in control of your emotions."
Action: "Take a Break"
```

**Flow Mode:**

```plaintext
Title: "Friction Detected"
Message: "Pause and reset your focus. Multiple context switches can pull you out of flow state."
Action: "Reset Focus"
```

**Legend Mode:**

```plaintext
Title: "FRICTION DETECTED"
Message: "Stop now and reset. Multiple distractions detected. You're losing cognitive bandwidth."
Action: "RESET NOW"
```

---

#### **Focus-Slipping Intervention**

**Trigger Conditions:**

- Auto: bandwidth drops below 50
- Manual: User clicks "Focus-Slipping" button


**Mode-Specific Responses:**

**Zen Mode:**

```plaintext
Title: "Focus Slipping"
Message: "Don't let yourself be distracted. Let's keep focus!"
Action: "Pause & Reflect"
```

**Flow Mode:**

```plaintext
Title: "Focus Slipping"
Message: "Don't let yourself be distracted. Let's keep focus!"
Action: "Assess & Reset"
```

**Legend Mode:**

```plaintext
Title: "FOCUS SLIPPING"
Message: "Don't let yourself be distracted. Let's keep focus!"
Action: "STOP SESSION"
```

---

#### **Non-Whitelisted App Intervention**

**Trigger Conditions:**

- Auto: User opens app outside whitelist
- Manual: Never (auto-only)


**Mode-Specific Responses:**

**Zen Mode:**

```plaintext
Title: "Non Whitelisted App or Website"
Message: "Reserve your energy for the tasks that matter. You can do this!"
Action: "Close & Refocus"
```

**Flow Mode:**

```plaintext
Title: "Non Whitelisted App or Website"
Message: "Reserve your energy for the tasks that matter. You can do this!"
Action: "Close App"
```

**Legend Mode:**

```plaintext
Title: "NON WHITELISTED APP OR WEBSITE"
Message: "Reserve your energy for the tasks that matter. You can do this!"
Action: "CLOSE NOW"
```

---

#### **Tab Switch Intervention**

**Trigger Conditions:**

- Auto: Tab switch burst detected (>5 in 60s)
- Manual: Never (auto-only)


**Mode-Specific Responses:**

**Zen Mode:**

```plaintext
Title: "Detrimental Tab or Context Switching"
Message: "One tab at a time. One app at a time. We will win the race."
Action: "Pause Session"
```

**Flow Mode:**

```plaintext
Title: "Detrimental Tab or Context Switching"
Message: "One tab at a time. One app at a time. We will win the race."
Action: "Reset Flow"
```

**Legend Mode:**

```plaintext
Title: "DETRIMENTAL TAB OR CONTEXT SWITCHING"
Message: "One tab at a time. One app at a time. We will win the race."
Action: "FOCUS OR QUIT"
```

---

### 5.3 Intervention UI Behavior

**Zen Mode:**

- Overlay appears in center of DraggableContainer
- Slides in from right with emerald green theme
- Auto-dismisses after 10 seconds
- User can dismiss early or take action


**Flow Mode:**

- Overlay appears in center of DraggableContainer
- Slides in from left with cyan blue theme
- Explodes in → moves smoothly → fades out (10s total)
- User can dismiss with X button


**Legend Mode:**

- Full-screen modal with backdrop blur
- Red theme with pulsing glow effect
- Aggressive messaging with ALL CAPS
- No auto-dismiss (requires user action)


---

## 6. Whitelist Management

### 6.1 Whitelist Structure

**Pre-Session Whitelist Definition:**

```typescript
interface Whitelist {
  apps: string[]              // Desktop applications (e.g., "VSCode", "Terminal")
  browser: string | "None"    // Browser name (e.g., "Chrome", "Firefox")
  tabs: string[]              // Whitelisted URLs/domains (e.g., "github.com")
}
```

**Example:**

```typescript
const whitelist: Whitelist = {
  apps: ["Visual Studio Code", "iTerm2", "Notion"],
  browser: "Chrome",
  tabs: ["github.com/myrepo", "stackoverflow.com", "docs.react.dev"]
}
```

---

### 6.2 Whitelist Validation

**App Validation:**

```typescript
function isAppWhitelisted(appName: string, whitelist: Whitelist): boolean {
  return whitelist.apps.includes(appName)
}
```

**Tab Validation:**

```typescript
function isTabWhitelisted(url: string, whitelist: Whitelist): boolean {
  if (whitelist.browser === "None") return false
  
  return whitelist.tabs.some(domain => 
    url.includes(domain) || new URL(url).hostname.includes(domain)
  )
}
```

---

### 6.3 Whitelist Modifier (Pre-Session Bonus)

Users receive bandwidth bonuses for setting up whitelists:

```typescript
function getWhitelistModifier(
  whitelistedApps?: string[],
  whitelistedBrowser?: string,
  whitelistedTabs?: string[]
): number {
  if (!whitelistedApps || !whitelistedBrowser) return 0
  
  // Apps component (max +2)
  const appCount = whitelistedApps.length
  let appBonus = 0
  if (appCount >= 1 && appCount <= 3) appBonus = 2
  else if (appCount >= 4 && appCount <= 6) appBonus = 1
  
  // Browser + tabs component (max +2)
  let browserBonus = 0
  if (whitelistedBrowser !== "None") {
    const tabCount = whitelistedTabs?.length || 0
    if (tabCount >= 1 && tabCount <= 3) browserBonus = 2
    else if (tabCount >= 4 && tabCount <= 5) browserBonus = 1
  }
  
  return appBonus + browserBonus  // Max +4 bonus
}
```

**Bonus Breakdown:**

- 1-3 apps: +2 bandwidth
- 4-6 apps: +1 bandwidth
- 1-3 browser tabs: +2 bandwidth
- 4-5 browser tabs: +1 bandwidth
- Maximum bonus: +4 bandwidth


---

## 7. State Tracking

### 7.1 BandwidthState Structure

```typescript
interface BandwidthState {
  currentBandwidth: number                       // 0-100 scale
  lastEventTimestamp: number                     // Last event time (ms)
  sustainedFocusMinutes: number                  // Continuous focus time
  lastSwitchTimestamp: number                    // Last tab/app switch time
  switchCount: number                            // Switches in current 60s window
  nonWhitelistedAppHistory: Map<string, number>  // App name → last violation time
  flowState: FlowState                           // Flow detection state
}
```

---

### 7.2 Event Processing

**Main Event Handler:**

```typescript
function applyBandwidthEvent(
  event: BandwidthEvent,
  state: BandwidthState
): { newBandwidth: number; updatedState: BandwidthState } {
  let newBandwidth = state.currentBandwidth
  
  switch (event.type) {
    case 'friction':
      newBandwidth = applyFrictionPenalty(newBandwidth)
      break
    
    case 'focus-slipping':
      newBandwidth = applyFocusSlippingPenalty(newBandwidth)
      break
    
    case 'non-whitelisted-app':
      const appName = event.details?.appName || 'unknown'
      const lastOccurrence = state.nonWhitelistedAppHistory.get(appName)
      newBandwidth = applyNonWhitelistedAppPenalty(newBandwidth, appName, lastOccurrence)
      state.nonWhitelistedAppHistory.set(appName, event.timestamp)
      break
    
    case 'tab-switch':
      const tabTimeWindow = event.timestamp - state.lastSwitchTimestamp
      const tabSwitchCount = tabTimeWindow <= 60000 ? state.switchCount + 1 : 1
      newBandwidth = applyTabSwitchPenalty(newBandwidth, tabSwitchCount, tabTimeWindow)
      state.switchCount = tabSwitchCount
      state.lastSwitchTimestamp = event.timestamp
      break
    
    case 'app-switch':
      const appTimeWindow = event.timestamp - state.lastSwitchTimestamp
      const appSwitchCount = appTimeWindow <= 60000 ? state.switchCount + 1 : 1
      newBandwidth = applyAppSwitchPenalty(newBandwidth, appSwitchCount, appTimeWindow)
      state.switchCount = appSwitchCount
      state.lastSwitchTimestamp = event.timestamp
      break
    
    case 'sustained-focus':
      newBandwidth = applySustainedFocusGain(newBandwidth)
      state.sustainedFocusMinutes++
      break
    
    case 'flow-celebration':
      newBandwidth = applyFlowCelebrationBonus(newBandwidth)
      break
    
    case 'breath-reset':
      newBandwidth = applyBreathResetRestoration(newBandwidth)
      break
    
    case 'walk-reset':
      newBandwidth = applyWalkResetRestoration(newBandwidth)
      break
    
    case 'dump-reset':
      newBandwidth = applyDumpResetRestoration(newBandwidth)
      break
  }
  
  // Clamp to 0-100
  newBandwidth = Math.max(0, Math.min(100, newBandwidth))
  
  return {
    newBandwidth,
    updatedState: {
      ...state,
      currentBandwidth: newBandwidth,
      lastEventTimestamp: event.timestamp
    }
  }
}
```

---

## 8. Implementation Guidelines

### 8.1 Phase 1 (Current: Web Prototype)

**Manual Simulation:**

- Friction and Focus-Slipping are manually triggered via HUD buttons
- Mid-Session Intelligence Test Panel simulates all other events
- No real OS telemetry integration


---

### 8.2 Phase 2 (Tauri Desktop)

**Auto-Detection Implementation:**

**Background Thread Architecture:**

```rust
// src-tauri/src/telemetry/monitor.rs

pub struct TelemetryMonitor {
    active_window: String,
    tab_history: Vec<(String, i64)>,
    app_history: Vec<(String, i64)>,
    whitelist: Whitelist,
}

impl TelemetryMonitor {
    pub fn start_monitoring(&mut self) {
        loop {
            std::thread::sleep(Duration::from_millis(500));
            
            // Check active window
            let current_window = get_active_window_name();
            if current_window != self.active_window {
                self.handle_window_switch(current_window);
            }
            
            // Check for non-whitelisted apps
            if !self.is_whitelisted(&current_window) {
                self.emit_event(BandwidthEvent {
                    type: "non-whitelisted-app",
                    timestamp: now(),
                    details: { appName: current_window }
                });
            }
        }
    }
}
```

---

### 8.3 Testing Recommendations

**Unit Tests:**

- Test each penalty function with boundary values (0, 50, 95, 100)
- Test burst detection with various switch patterns
- Test whitelist validation with edge cases
- Test repeat violation tracking


**Example Test:**

```typescript
describe('applyTabSwitchPenalty', () => {
  it('should apply -2 for single switch', () => {
    expect(applyTabSwitchPenalty(70, 1, 5000)).toBe(68)
  })
  
  it('should apply -5 for burst (>5 switches)', () => {
    expect(applyTabSwitchPenalty(70, 6, 45000)).toBe(65)
  })
  
  it('should not go below 0', () => {
    expect(applyTabSwitchPenalty(3, 6, 45000)).toBe(0)
  })
})
```

---

**End of Telemetry and Penalties Specification**

---

**You can now save this as `documentation/07_telemetry_and_penalties.md`**

This document provides complete specifications for event detection, penalty calculations, burst detection logic, intervention triggers, and whitelist management. All formulas match the current implementation in version 104 and include guidelines for Tauri desktop migration in Phase 2.