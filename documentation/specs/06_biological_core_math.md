
# **06 - Biological Core Math Specification**

**Version:** 1.0  
**Last Updated:** January 12, 2026  
**Purpose:** Complete mathematical specification of all biological algorithms, bandwidth calculations, flow state detection, and calibration scoring in Human Capacity OS.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Daily Calibration Scoring](#2-daily-calibration-scoring)
3. [Bandwidth Event System](#3-bandwidth-event-system)
4. [Flow State Detection](#4-flow-state-detection)
5. [Intervention Triggers](#5-intervention-triggers)
6. [Session Metrics Calculation](#6-session-metrics-calculation)
7. [Victory Level Determination](#7-victory-level-determination)
8. [Implementation Notes](#8-implementation-notes)

---

## 1. Overview

### 1.1 Philosophy

Human Capacity OS models human cognitive bandwidth as a **dynamic, biological variable** that fluctuates based on:
- **Sleep quality** (foundational recovery)
- **Emotional state** (psychological readiness)
- **Distraction awareness** (metacognitive clarity)
- **In-session behavior** (real-time adjustments)

The math is designed to be:
- **Biologically grounded** - Reflects actual human capacity patterns
- **Recoverable** - Penalties can be overcome through reset rituals
- **Non-gamifiable** - Cannot be "hacked" without genuine focus
- **Forgiving** - Small mistakes don't cascade into catastrophic penalties

### 1.2 Core Equation

```
Current Bandwidth = Base Calibration Score + Session Adjustments

Where:
- Base Calibration Score: 0-100 (calculated daily at 5am boundary)
- Session Adjustments: Real-time penalties and gains during active session
- Final Range: 0-100 (clamped)
```

---

## 2. Daily Calibration Scoring

### 2.1 Total Score Calculation

**Formula:**
```
Total Score = Sleep Score + Emotional Score + Distraction Score

Where:
- Sleep Score: 0-40 points
- Emotional Score: 0-40 points
- Distraction Score: 0-20 points
- Total: 0-100 points
```

### 2.2 Sleep Score (40 points max)

**Section 2.2.1: Sleep Hours (25 points max)**

| Sleep Hours | Points | Reasoning |
|-------------|--------|-----------|
| 7-9 hours   | 25     | Optimal recovery zone |
| 6 or 10 hours | 20   | Acceptable, slight deficit |
| 5 or 11 hours | 12   | Suboptimal, significant impact |
| <5 or >11 hours | 5  | Critical impairment |

**Formula:**
```typescript
function calculateHoursScore(hours: number): number {
  if (hours >= 7 && hours <= 9) return 25
  if (hours === 6 || hours === 10) return 20
  if (hours === 5 || hours === 11) return 12
  return 5
}
```

**Section 2.2.2: Sleep Quality (15 points max)**

| Quality Rating (1-10) | Points | Description |
|-----------------------|--------|-------------|
| 8-10                  | 15     | Deep, restorative sleep |
| 6-7                   | 10     | Decent sleep, some interruptions |
| 4-5                   | 5      | Restless, fragmented sleep |
| 1-3                   | 2      | Poor, non-restorative sleep |

**Formula:**
```typescript
function calculateQualityScore(quality: number): number {
  if (quality >= 8) return 15
  if (quality >= 6) return 10
  if (quality >= 4) return 5
  return 2
}
```

**Combined Sleep Score:**
```typescript
function calculateSleepScore(hours: number, quality: number): number {
  return calculateHoursScore(hours) + calculateQualityScore(quality)
}
```

---

### 2.3 Emotional Score (40 points max)

**Section 2.3.1: Emotional Residue (20 points max)**

| Residue Level (1-10) | Points | Description |
|----------------------|--------|-------------|
| 1-3                  | 20     | Clear, no lingering stress |
| 4-5                  | 15     | Mild background stress |
| 6-7                  | 8      | Moderate unresolved tension |
| 8-10                 | 3      | Heavy emotional burden |

**Formula:**
```typescript
function calculateResidueScore(residue: number): number {
  if (residue <= 3) return 20
  if (residue <= 5) return 15
  if (residue <= 7) return 8
  return 3
}
```

**Section 2.3.2: Emotional State (20 points max)**

| State       | Points | Description |
|-------------|--------|-------------|
| Energized   | 20     | High energy, motivated |
| Focused     | 18     | Clear-minded, ready |
| Calm        | 15     | Balanced, centered |
| Tired       | 8      | Low energy, fatigued |
| Anxious     | 5      | Worried, nervous |
| Scattered   | 3      | Distracted, unfocused |

**Formula:**
```typescript
function calculateStateScore(state: string): number {
  const scores: Record<string, number> = {
    'Energized': 20,
    'Focused': 18,
    'Calm': 15,
    'Tired': 8,
    'Anxious': 5,
    'Scattered': 3
  }
  return scores[state] || 10 // Default fallback
}
```

**Combined Emotional Score:**
```typescript
function calculateEmotionalScore(residue: number, state: string): number {
  return calculateResidueScore(residue) + calculateStateScore(state)
}
```

---

### 2.4 Distraction Awareness (20 points max)

| Distractions Identified | Points | Reasoning |
|-------------------------|--------|-----------|
| 0 distractions          | 20     | Clear awareness, nothing identified |
| 1 distraction           | 16     | High awareness |
| 2 distractions          | 12     | Moderate awareness |
| 3 distractions          | 8      | Some awareness |
| 4 distractions          | 5      | Low awareness |
| 5-6 distractions        | 2      | Overwhelmed, too many vectors |

**Formula:**
```typescript
function calculateDistractionScore(distractions: string[]): number {
  const count = distractions.length
  if (count === 0) return 20
  if (count === 1) return 16
  if (count === 2) return 12
  if (count === 3) return 8
  if (count === 4) return 5
  return 2 // 5-6 distractions
}
```

---

### 2.5 Complete Calibration Formula

```typescript
interface CalibrationData {
  sleepHours: number
  sleepQuality: number // 1-10
  emotionalResidue: number // 1-10
  emotionalState: 'Energized' | 'Focused' | 'Calm' | 'Tired' | 'Anxious' | 'Scattered'
  distractions: string[]
}

function calculateCalibrationScore(data: CalibrationData): number {
  const sleepScore = calculateSleepScore(data.sleepHours, data.sleepQuality)
  const emotionalScore = calculateEmotionalScore(data.emotionalResidue, data.emotionalState)
  const distractionScore = calculateDistractionScore(data.distractions)
  
  return sleepScore + emotionalScore + distractionScore // 0-100
}
```

---

## 3. Bandwidth Event System

### 3.1 Event Types

All bandwidth adjustments during a session are modeled as discrete events:

```typescript
type BandwidthEventType =
  | 'friction'              // Manual intervention trigger
  | 'focus-slipping'        // Manual intervention trigger
  | 'non-whitelisted-app'   // Auto-detected (future: telemetry)
  | 'tab-switch'            // Auto-detected (future: telemetry)
  | 'app-switch'            // Auto-detected (future: telemetry)
  | 'sustained-focus'       // Auto-gained every minute
  | 'flow-celebration'      // Bonus when entering flow
  | 'breath-reset'          // Reset ritual restoration
  | 'walk-reset'            // Reset ritual restoration
  | 'dump-reset'            // Reset ritual restoration
```

---

### 3.2 Penalty Formulas

#### 3.2.1 Friction Penalty

**Trigger:** User manually reports feeling friction (stuckness, confusion, frustration)

**Formula:**
```typescript
function applyFrictionPenalty(current: number): number {
  return Math.max(0, current - 5)
}
```

**Rationale:** Moderate penalty (-5) to signal subtle resistance without catastrophic loss.

---

#### 3.2.2 Focus Slipping Penalty

**Trigger:** User manually reports focus slipping (mind wandering, fatigue, disengagement)

**Formula:**
```typescript
function applyFocusSlippingPenalty(current: number): number {
  return Math.max(0, current - 10)
}
```

**Rationale:** Larger penalty (-10) as focus loss is a stronger signal of capacity depletion.

---

#### 3.2.3 Non-Whitelisted App Penalty

**Trigger:** User switches to a non-whitelisted application (detected via telemetry)

**Formula:**
```typescript
function applyNonWhitelistedAppPenalty(
  current: number,
  appName: string,
  lastOccurrence: number | undefined
): number {
  const now = Date.now()
  const isRepeat = lastOccurrence && (now - lastOccurrence) < 120000 // 2 minutes
  
  if (isRepeat) {
    return Math.max(0, current - 6)  // Smaller repeat penalty
  }
  return Math.max(0, current - 12)  // Initial large penalty
}
```

**Rationale:**
- First offense: -12 (strong deterrent for breaking into distraction apps)
- Repeat within 2 minutes: -6 (still penalized, but recognizes the pull is hard to resist)

---

#### 3.2.4 Tab Switch Penalty

**Trigger:** User switches browser tabs (detected via telemetry)

**Formula:**
```typescript
function applyTabSwitchPenalty(
  current: number,
  switchCount: number,
  timeWindow: number // milliseconds since last switch
): number {
  // Check for burst switching (>5 switches in 60 seconds)
  if (switchCount > 5 && timeWindow <= 60000) {
    return Math.max(0, current - 5) // Burst penalty
  }
  return Math.max(0, current - 2) // Normal switch penalty
}
```

**Rationale:**
- Normal tab switching: -2 (small penalty, acknowledges legitimate context shifts)
- Burst switching: -5 (recognizes frantic behavior pattern)

---

#### 3.2.5 App Switch Penalty

**Trigger:** User switches between desktop applications (detected via telemetry)

**Formula:**
```typescript
function applyAppSwitchPenalty(
  current: number,
  switchCount: number,
  timeWindow: number // milliseconds since last switch
): number {
  // Check for burst switching (>3 switches in 60 seconds)
  if (switchCount > 3 && timeWindow <= 60000) {
    return Math.max(0, current - 6) // Burst penalty
  }
  return Math.max(0, current - 4) // Normal switch penalty
}
```

**Rationale:**
- Normal app switching: -4 (moderate penalty, app switches are costlier than tabs)
- Burst switching: -6 (recognizes task-switching fatigue)

---

### 3.3 Gain Formulas

#### 3.3.1 Sustained Focus Gain

**Trigger:** Every minute of sustained focus (no distractions, no switches)

**Formula:**
```typescript
function applySustainedFocusGain(current: number): number {
  return Math.min(95, current + 1) // +1 per minute, cap at 95
}
```

**Rationale:**
- Slow, steady recovery (+1/minute)
- Cap at 95 to prevent "gaming" the system by just waiting

---

#### 3.3.2 Flow Celebration Bonus

**Trigger:** When flow state is detected and celebration overlay appears

**Formula:**
```typescript
function applyFlowCelebrationBonus(current: number): number {
  return Math.min(95, current + 5) // +5 bonus, cap at 95
}
```

**Rationale:** Reward for achieving flow state with a one-time bonus.

---

#### 3.3.3 Flow Streak Gain

**Trigger:** Every minute while in active flow state

**Formula:**
```typescript
function applyFlowStreakGain(current: number, flowState: FlowState): number {
  if (!flowState.isActive) return current
  return Math.min(95, current + 1) // +1 per minute while in flow
}
```

**Rationale:** Flow state maintains high bandwidth automatically (+1/minute).

---

#### 3.3.4 Reset Ritual Restorations

**Breath Reset:**
```typescript
function applyBreathResetRestoration(current: number): number {
  return Math.min(100, current + 5) // +5 restoration
}
```

**Walk Reset:**
```typescript
function applyWalkResetRestoration(current: number): number {
  return Math.min(100, current + 7.5) // +7.5 restoration (strongest)
}
```

**Dump Reset (Parking Lot):**
```typescript
function applyDumpResetRestoration(current: number): number {
  return Math.min(100, current + 6) // +6 restoration
}
```

**Rationale:**
- Walk is most restorative (+7.5) due to physical movement
- Dump is second (+6) as it clears mental clutter
- Breath is quickest (+5) but less intensive

---

## 4. Flow State Detection

### 4.1 Flow Entry Conditions

Flow state is triggered when ALL four conditions are met simultaneously:

**Condition 1: Sustained Focus (12+ minutes)**
```typescript
const hasSustainedFocus = sustainedFocusMinutes >= 12
```

**Condition 2: No Context Switching (12 minutes)**
```typescript
const now = Date.now()
const TWELVE_MINUTES_MS = 12 * 60 * 1000
const noRecentSwitches = (now - lastSwitchTimestamp) > TWELVE_MINUTES_MS || lastSwitchTimestamp === 0
```

**Condition 3: No Interventions (12 minutes)**
```typescript
const noRecentInterventions = (now - lastInterruptionTimestamp) > TWELVE_MINUTES_MS || lastInterruptionTimestamp === 0
```

**Condition 4: Bandwidth Threshold (≥75)**
```typescript
const bandwidthThreshold = bandwidth >= 75
```

**Combined Check:**
```typescript
function checkFlowConditions(
  sustainedFocusMinutes: number,
  bandwidth: number,
  lastInterruptionTimestamp: number,
  lastSwitchTimestamp: number
): boolean {
  const now = Date.now()
  const TWELVE_MINUTES_MS = 12 * 60 * 1000
  
  const hasSustainedFocus = sustainedFocusMinutes >= 12
  const noRecentSwitches = (now - lastSwitchTimestamp) > TWELVE_MINUTES_MS || lastSwitchTimestamp === 0
  const noRecentInterventions = (now - lastInterruptionTimestamp) > TWELVE_MINUTES_MS || lastInterruptionTimestamp === 0
  const bandwidthThreshold = bandwidth >= 75
  
  return hasSustainedFocus && noRecentSwitches && noRecentInterventions && bandwidthThreshold
}
```

---

### 4.2 Flow Exit Conditions

Flow state is exited when ANY of the following occurs:

**Exit Trigger 1: Context Switch (tab or app)**
```typescript
// Automatic exit on any switch event
exitFlowState(flowState, 'context switch detected')
```

**Exit Trigger 2: Intervention Used**
```typescript
// Automatic exit when friction/focus-slipping intervention triggered
exitFlowState(flowState, 'intervention used')
```

**Exit Trigger 3: Bandwidth Drops Below 75**
```typescript
if (bandwidth < 75 && flowState.isActive) {
  exitFlowState(flowState, 'bandwidth dropped below threshold')
}
```

**Exit Trigger 4: Session Paused/Ended**
```typescript
// Flow state resets when session is paused or completed
exitFlowState(flowState, 'session ended')
```

---

### 4.3 Flow State Model

```typescript
interface FlowState {
  isActive: boolean                  // Currently in flow
  sustainedFocusMinutes: number      // Total sustained focus time
  flowEligible: boolean              // Met conditions at least once
  flowTriggered: boolean             // Flow celebration shown
  flowCelebrationTriggered: boolean  // Celebration overlay displayed
  flowStreakMinutes: number          // Minutes spent in active flow
  lastInterruptionTimestamp: number  // Last friction/focus-slipping event
  conditionsValid: boolean           // All 4 conditions currently met
}
```

---

## 5. Intervention Triggers

### 5.1 Auto-Intervention Logic

**Friction Intervention (60 < bandwidth < 75):**
```typescript
function checkAutoInterventionTrigger(bandwidth: number): 'friction' | 'focus-slipping' | null {
  if (bandwidth < 50) {
    return 'focus-slipping'
  }
  if (bandwidth < 60) {
    return 'friction'
  }
  return null
}
```

**Thresholds:**
- **60 ≤ bandwidth < 75:** Friction intervention pane appears
- **bandwidth < 60:** Focus-slipping intervention pane appears (overrides friction)
- **50 < bandwidth < 60:** Friction only
- **bandwidth ≤ 50:** Focus-slipping only

---

### 5.2 Manual Intervention

Users can manually trigger interventions at any time via the HUD buttons:
- **Friction button:** Always available, triggers friction intervention pane
- **Focus-slipping button:** Always available, triggers focus-slipping intervention pane

Manual triggers apply the same penalties as auto-triggers.

---

## 6. Session Metrics Calculation

### 6.1 Flow Efficiency

**Formula:**
```typescript
function calculateFlowEfficiency(timelineBlocks: TimelineBlock[]): number {
  const totalSessionTime = timelineBlocks.reduce((sum, block) => sum + (block.end - block.start), 0)
  const flowTime = timelineBlocks
    .filter(block => block.state === 'flow')
    .reduce((sum, block) => sum + (block.end - block.start), 0)
  
  return totalSessionTime > 0 ? (flowTime / totalSessionTime) * 100 : 0
}
```

**Output:** Percentage of session spent in flow state (0-100%)

---

### 6.2 Longest Focus Streak

**Formula:**
```typescript
function calculateLongestStreak(timelineBlocks: TimelineBlock[]): number {
  let longestStreak = 0
  let currentStreak = 0
  
  for (const block of timelineBlocks) {
    if (block.state === 'flow' || block.state === 'working') {
      currentStreak += (block.end - block.start) / 60000 // Convert to minutes
    } else {
      longestStreak = Math.max(longestStreak, currentStreak)
      currentStreak = 0
    }
  }
  
  return Math.max(longestStreak, currentStreak)
}
```

**Output:** Longest uninterrupted focus period in minutes

---

### 6.3 Distraction Attempts

**Formula:**
```typescript
function countDistractionAttempts(distractionEvents: DistractionEvent[]): number {
  return distractionEvents.length
}
```

**Counted Events:**
- Non-whitelisted app switches
- Tab switches (bursts count as 1)
- App switches (bursts count as 1)

---

### 6.4 Interventions Used

**Formula:**
```typescript
function countInterventionsUsed(interventionEvents: InterventionEvent[]): number {
  return interventionEvents.length
}
```

**Counted Events:**
- Friction interventions (manual + auto)
- Focus-slipping interventions (manual + auto)

---

## 7. Victory Level Determination

### 7.1 Victory Level Logic

Victory level is determined at session end based on planned vs. actual duration:

**Formula:**
```typescript
function calculateVictoryLevel(
  plannedMinutes: number,
  actualMinutes: number,
  endReason: 'mission_complete' | 'stopping_early' | 'pulled_away'
): 'Legend' | 'Good' | 'Minimum' | 'Missed' {
  if (endReason === 'pulled_away') {
    return 'Missed' // Interrupted sessions always get "Missed"
  }
  
  const percentageCompleted = (actualMinutes / plannedMinutes) * 100
  
  if (percentageCompleted >= 100) {
    return 'Legend' // Completed full session
  }
  if (percentageCompleted >= 80) {
    return 'Good' // 80-99% completion
  }
  if (percentageCompleted >= 60) {
    return 'Minimum' // 60-79% completion
  }
  return 'Missed' // <60% completion
}
```

**Victory Levels:**
- **Legend:** 100%+ of planned time (mission complete)
- **Good:** 80-99% of planned time (stopping early but close)
- **Minimum:** 60-79% of planned time (stopping early, minimal acceptable)
- **Missed:** <60% of planned time OR pulled away (interrupted)

---

## 8. Implementation Notes

### 8.1 Bandwidth Clamping

All bandwidth values are clamped to the range [0, 100]:

```typescript
function clampBandwidth(value: number): number {
  return Math.max(0, Math.min(100, value))
}
```

---

### 8.2 Floating Point Precision

All bandwidth calculations use floating-point arithmetic for precision:

```typescript
// Example: Walk reset gives +7.5, not +7 or +8
applyWalkResetRestoration(current: number): number {
  return Math.min(100, current + 7.5) // Precise restoration
}
```

---

### 8.3 Time Windows

All time-based calculations use milliseconds internally:

```typescript
const TWELVE_MINUTES_MS = 12 * 60 * 1000 // 720,000 milliseconds
const TWO_MINUTES_MS = 2 * 60 * 1000     // 120,000 milliseconds
const SIXTY_SECONDS_MS = 60 * 1000       // 60,000 milliseconds
```

---

### 8.4 Calibration Expiry

Calibration scores expire at 5am local time (workday boundary):

```typescript
function isCalibrationExpired(calibrationDate: string): boolean {
  const workdayDate = calculateWorkdayDate() // Returns YYYY-MM-DD for current workday
  return calibrationDate !== workdayDate
}

function calculateWorkdayDate(): string {
  const now = new Date()
  const hour = now.getHours()
  
  // If before 5am, use yesterday's date
  if (hour < 5) {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split('T')[0] // YYYY-MM-DD
  }
  
  return now.toISOString().split('T')[0] // YYYY-MM-DD
}
```

---

### 8.5 Switch Burst Detection

Tab and app switches are tracked with burst detection:

```typescript
interface SwitchTracker {
  lastSwitchTimestamp: number
  switchCount: number
}

function detectBurst(tracker: SwitchTracker, currentTimestamp: number): boolean {
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
  
  // Burst detected if >5 tab switches or >3 app switches in 60s
  return tracker.switchCount > 5 // (adjust threshold per event type)
}
```

---

### 8.6 Testing Recommendations

**Unit Test Coverage:**
- All penalty functions with edge cases (0, 50, 95, 100)
- All gain functions with capping behavior
- Calibration score calculation with extreme inputs
- Flow condition checks with various states
- Victory level determination with boundary values

**Example Test:**
```typescript
describe('applyFrictionPenalty', () => {
  it('should reduce bandwidth by 5', () => {
    expect(applyFrictionPenalty(70)).toBe(65)
  })
  
  it('should not go below 0', () => {
    expect(applyFrictionPenalty(3)).toBe(0)
  })
})
```

---

**End of Biological Core Math Specification**

---

**You can now save this as `documentation/06_biological_core_math.md`**

This document provides complete mathematical specifications for all bandwidth calculations, calibration scoring, flow detection, and intervention logic used in Human Capacity OS. All formulas are production-ready and match the current implementation in version 104.