# 03 - Frontend Process Flows Documentation

**Project:** DustOff Reset (Human Capacity OS)  
**Purpose:** Complete user journey and state transition documentation  
**Version:** 1.0.0

---

## Table of Contents

1. [Session Lifecycle State Machine](#1-session-lifecycle-state-machine)
2. [Calibration Flow](#2-calibration-flow)
3. [Pre-Session Airlock](#3-pre-session-airlock)
4. [Active Session Flow](#4-active-session-flow)
5. [Bandwidth Monitoring & Events](#5-bandwidth-monitoring--events)
6. [Flow State Detection](#6-flow-state-detection)
7. [Intervention System Flow](#7-intervention-system-flow)
8. [Reset Ritual Flow](#8-reset-ritual-flow)
9. [Session Ending Flow](#9-session-ending-flow)
10. [Post-Session Debrief](#10-post-session-debrief)
11. [Parking Lot Harvest](#11-parking-lot-harvest)
12. [Recovery Flow (Interrupted Sessions)](#12-recovery-flow-interrupted-sessions)
13. [Overtime Flow](#13-overtime-flow)
14. [Complete State Diagram](#14-complete-state-diagram)

---

## 1. Session Lifecycle State Machine

### App Mode States

```typescript
type AppMode = "not-calibrated" | "idle" | "session" | "paused"
```

### Session Mode Types

```typescript
type SessionMode = "Zen" | "Flow" | "Legend"
```

### High-Level Flow

```
NOT-CALIBRATED → IDLE → PRE-SESSION → SESSION → POST-SESSION → IDLE
                   ↑                        ↓
                   ↑←------- PAUSED ←-------↓
```

---

## 2. Calibration Flow

### Entry Condition

- App loads and no calibration exists for today's "workday"
- Workday boundary: **5am local time** (not midnight)

### Flow Steps

```
1. App initialization
   └─ getBandwidthEngine().getTodaysCalibration()
      └─ Returns null → setMode("not-calibrated")

2. HUD displays "Not Calibrated" state
   └─ Shows green "Calibrate today" text
   └─ Green lightning bolt button (⚡) pulsing

3. User clicks calibrate button
   └─ handleStartCalibration()
   └─ setShowCalibration(true)

4. DailyCalibrationPanel opens
   ├─ Question 1: Hours of sleep last night (slider 0-12)
   ├─ Question 2: Emotional state (1-5 emoji scale)
   ├─ Question 3: Current drain factors (multi-select)
   └─ Question 4: Current boost factors (multi-select)

5. User submits calibration
   └─ handleCompleteCalibration(data)
      ├─ Calculate initial bandwidth from inputs
      ├─ Save calibration data with today's date
      ├─ setMode("idle")
      ├─ setBandwidth(calculatedBandwidth)
      └─ setShowCalibration(false)
```

### Calibration Reset Logic

**Daily Reset Boundary:** 5am local time

```typescript
function getWorkdayKey(): string {
  const now = new Date()
  let adjustedDate = new Date(now)
  
  // If before 5am, use previous day's date
  if (now.getHours() < 5) {
    adjustedDate.setDate(adjustedDate.getDate() - 1)
  }
  
  return adjustedDate.toISOString().split('T')[0]
}
```

**Example Scenario:**
- User calibrates Monday at 9am → Key: `2024-01-15`
- User works until 3am Tuesday → Still valid (key: `2024-01-15`)
- At 5am Tuesday → New workday begins → Calibration required (key: `2024-01-16`)

---

## 3. Pre-Session Airlock

### Entry Condition

- User clicks "Start your session" button in HUD
- Mode: `idle`

### Flow Steps

```
1. handleStartSession()
   └─ setShowPreSession(true)

2. PreSessionPanel opens with 6-step flow:

   STEP 1: Session Type Selection
   ├─ Regular Session
   └─ Parking Lot Session
      └─ If selected, loads pending parking lot items

   STEP 2: Parking Lot Item Review (if applicable)
   └─ Shows items marked "next-session" from previous harvest
   └─ User can deselect items they don't want to work on

   STEP 3: Session Configuration
   ├─ Duration selection (15, 25, 45, 90 minutes, custom)
   ├─ Intention input (text field: "What's the mission?")
   └─ Mode selection (Zen, Flow, Legend)

   STEP 4: Application Whitelist
   └─ User selects which apps are allowed during session
   └─ Any other app will trigger intervention

   STEP 5: Pre-Session Checklist
   ├─ Phone on silent/airplane mode
   ├─ Notifications disabled
   ├─ Water nearby
   └─ Workspace clear

   STEP 6: Countdown (3... 2... 1... Begin)
   └─ Visual countdown with breathing prompt

3. handleCompletePreSession(data)
   ├─ setSessionMode(data.mode)
   ├─ setMode("session")
   ├─ setSessionActive(true)
   ├─ setTimeRemaining(data.duration * 60)
   ├─ initializeBandwidthState(currentBandwidth)
   ├─ saveRecoveryData({
   │    sessionId, startedAt, plannedDurationMinutes,
   │    mode, intention, elapsedSeconds: 0
   │  })
   └─ setShowPreSession(false)
```

---

## 4. Active Session Flow

### Core Session Loop

```typescript
// Timer tick (every 1 second)
useEffect(() => {
  if (!sessionActive) return
  
  const interval = setInterval(() => {
    setSessionTime((prev) => prev + 1)
    setTimeRemaining((prev) => {
      const newTime = Math.max(0, prev - 1)
      if (newTime === 0 && prev > 0) {
        // Session time reached, trigger overtime nudge after 5 min
        setTimeout(() => {
          setShowOvertimeNudge(true)
        }, 300000) // 5 minutes
      }
      return newTime
    })
  }, 1000)
  
  return () => clearInterval(interval)
}, [sessionActive])
```

### Focus Monitoring Loop

```typescript
// Every 60 seconds: Check sustained focus and flow conditions
useEffect(() => {
  if (!sessionActive || !bandwidthState) return
  
  const focusInterval = setInterval(() => {
    // Apply sustained focus bonus
    const event: BandwidthEvent = {
      type: "sustained-focus",
      timestamp: Date.now()
    }
    const result = applyBandwidthEvent(event, bandwidthState)
    setBandwidth(result.newBandwidth)
    setBandwidthState(result.updatedState)
    
    // Check if flow conditions met
    const flowConditions = checkFlowConditions(
      result.updatedState.sustainedFocusMinutes,
      result.newBandwidth,
      result.updatedState.flowState.lastInterruptionTimestamp,
      result.updatedState.lastSwitchTimestamp
    )
    
    if (flowConditions && !result.updatedState.flowState.flowTriggered) {
      handleTriggerFlowCelebration()
      setBandwidthState({
        ...result.updatedState,
        flowState: enterFlowState(result.updatedState.flowState)
      })
    }
  }, 60000) // Every 60 seconds
  
  return () => clearInterval(focusInterval)
}, [sessionActive, bandwidthState])
```

---

## 5. Bandwidth Monitoring & Events

### Bandwidth Event Types

```typescript
type BandwidthEventType =
  | "friction"              // User frustration detected
  | "focus-slipping"        // Attention wandering
  | "non-whitelisted-app"   // Off-limits app opened
  | "tab-switch"            // Browser tab switching
  | "app-switch"            // Application switching
  | "sustained-focus"       // Continuous focus minute
  | "flow-celebration"      // Flow state milestone
  | "breath-reset"          // Breath ritual completed
  | "walk-reset"            // Walk ritual completed
  | "dump-reset"            // Brain dump ritual completed
```

### Bandwidth Penalties

| Event Type | Penalty | Condition |
|------------|---------|-----------|
| Friction | -5 points | User-triggered or auto-detected |
| Focus Slipping | -10 points | Bandwidth < 50 |
| Non-Whitelisted App (first) | -12 points | New app within 2 minutes |
| Non-Whitelisted App (repeat) | -6 points | Same app within 2 minutes |
| Tab Switch (normal) | -2 points | Single switch |
| Tab Switch (burst) | -5 points | >5 switches in 60 seconds |
| App Switch (normal) | -4 points | Single switch |
| App Switch (burst) | -6 points | >3 switches in 60 seconds |

### Bandwidth Gains

| Event Type | Gain | Cap |
|------------|------|-----|
| Sustained Focus | +1 point/min | 95 |
| Flow Celebration | +5 points | 95 |
| Breath Reset | +5 points | 100 |
| Walk Reset | +7.5 points | 100 |
| Dump Reset | +6 points | 100 |

### Event Application Logic

```typescript
function applyBandwidthEvent(
  event: BandwidthEvent,
  state: BandwidthState
): { newBandwidth: number; updatedState: BandwidthState } {
  let newBandwidth = state.currentBandwidth
  
  switch (event.type) {
    case "friction":
      newBandwidth = Math.max(0, newBandwidth - 5)
      break
    
    case "focus-slipping":
      newBandwidth = Math.max(0, newBandwidth - 10)
      break
    
    case "non-whitelisted-app":
      const appName = event.details?.appName || "unknown"
      const lastOccurrence = state.nonWhitelistedAppHistory.get(appName)
      const isRepeat = lastOccurrence && 
                       (Date.now() - lastOccurrence < 120000)
      newBandwidth = Math.max(0, newBandwidth - (isRepeat ? 6 : 12))
      state.nonWhitelistedAppHistory.set(appName, event.timestamp)
      break
    
    case "tab-switch":
      const timeWindow = event.timestamp - state.lastSwitchTimestamp
      const switchCount = timeWindow <= 60000 ? state.switchCount + 1 : 1
      const isBurst = switchCount > 5 && timeWindow <= 60000
      newBandwidth = Math.max(0, newBandwidth - (isBurst ? 5 : 2))
      state.switchCount = switchCount
      state.lastSwitchTimestamp = event.timestamp
      break
    
    case "sustained-focus":
      newBandwidth = Math.min(95, newBandwidth + 1)
      state.sustainedFocusMinutes++
      break
    
    case "flow-celebration":
      newBandwidth = Math.min(95, newBandwidth + 5)
      break
    
    case "breath-reset":
      newBandwidth = Math.min(100, newBandwidth + 5)
      break
    
    case "walk-reset":
      newBandwidth = Math.min(100, newBandwidth + 7.5)
      break
    
    case "dump-reset":
      newBandwidth = Math.min(100, newBandwidth + 6)
      break
  }
  
  // Clamp final value
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

## 6. Flow State Detection

### Flow Entry Conditions (ALL must be TRUE)

```typescript
function checkFlowConditions(
  sustainedFocusMinutes: number,
  bandwidth: number,
  lastInterruptionTimestamp: number,
  lastSwitchTimestamp: number
): boolean {
  const now = Date.now()
  const TWELVE_MINUTES_MS = 12 * 60 * 1000
  
  // Condition 1: 12+ minutes sustained focus
  const hasSustainedFocus = sustainedFocusMinutes >= 12
  
  // Condition 2: No context switching in last 12 minutes
  const noRecentSwitches = 
    now - lastSwitchTimestamp > TWELVE_MINUTES_MS || 
    lastSwitchTimestamp === 0
  
  // Condition 3: No interventions in last 12 minutes
  const noRecentInterventions = 
    now - lastInterruptionTimestamp > TWELVE_MINUTES_MS || 
    lastInterruptionTimestamp === 0
  
  // Condition 4: Bandwidth >= 75
  const bandwidthThreshold = bandwidth >= 75
  
  return hasSustainedFocus && 
         noRecentSwitches && 
         noRecentInterventions && 
         bandwidthThreshold
}
```

### Flow State Transitions

#### Entering Flow

```typescript
function enterFlowState(flowState: FlowState): FlowState {
  return {
    ...flowState,
    isActive: true,
    flowEligible: true,
    flowTriggered: true,
    flowCelebrationTriggered: true,
    conditionsValid: true
  }
}
```

#### Flow Celebration Trigger

```
1. Flow conditions met
   └─ handleTriggerFlowCelebration()
      ├─ setShowFlowCelebration(true)
      ├─ setIsInFlow(true)
      ├─ Apply +5 bandwidth bonus
      └─ Extend session by 5 minutes

2. FlowCelebrationOverlay displays
   ├─ Mode-specific message
   ├─ Visual glow animation
   └─ Auto-dismiss after 5 minutes (300000ms)

3. Session timer extended
   └─ setTimeRemaining(prev => prev + 300)
```

#### Exiting Flow

```typescript
function exitFlowState(flowState: FlowState, reason: string): FlowState {
  console.log("[v0] Flow state exited:", reason)
  return {
    ...flowState,
    isActive: false,
    flowStreakMinutes: 0,
    conditionsValid: false
  }
}
```

**Exit Triggers:**
- Context switch (tab/app switching)
- Intervention triggered
- Bandwidth drops below 75
- User pauses session

---

## 7. Intervention System Flow

### Auto-Intervention Triggers

```typescript
function checkAutoInterventionTrigger(
  bandwidth: number
): "friction" | "focus-slipping" | null {
  if (bandwidth < 50) return "focus-slipping"
  if (bandwidth < 60) return "friction"
  return null
}
```

### Manual Intervention Triggers

Available in MidSessionIntelligenceTestPanel (debug panel):
- Friction
- Focus Slipping
- Non-Whitelisted App
- Tab Switching

### Intervention Flow

```
1. Trigger condition met
   └─ handleTriggerIntervention(type, details?)

2. Create bandwidth event
   └─ applyBandwidthEvent({ type, timestamp, details })
   └─ Update bandwidth state

3. Show InterventionOverlay
   └─ setInterventionState({ isOpen: true, type, details })

4. InterventionOverlay displays (mode-specific)
   ├─ Zen Mode: Gentle reminder (10s auto-dismiss)
   ├─ Flow Mode: Exploding → Moving animation (10s total)
   └─ Legend Mode: Full-screen urgent warning (10s auto-dismiss)

5. User dismisses or auto-dismisses
   └─ setInterventionState({ isOpen: false, ... })
```

### Intervention Messages by Mode

#### Friction

- **Zen:** "Friction Detected" → "Take a moment to breathe. Reset your focus."
- **Flow:** "Friction Detected" → "Pause and reset your focus."
- **Legend:** "FRICTION DETECTED" → "Stop now and reset."

#### Focus Slipping

- **Zen:** "Focus Slipping" → "Don't let yourself be distracted."
- **Flow:** "Focus Slipping" → "Don't let yourself be distracted."
- **Legend:** "FOCUS SLIPPING" → "Don't let yourself be distracted."

#### Non-Whitelisted App

- **Zen:** "Non Whitelisted App" → "Reserve your energy for the tasks that matter."
- **Flow:** "Non Whitelisted App" → "Reserve your energy for the tasks that matter."
- **Legend:** "NON WHITELISTED APP" → "Reserve your energy for the tasks that matter."

#### Tab Switching

- **Zen:** "Detrimental Tab Switching" → "One tab at a time."
- **Flow:** "Detrimental Tab Switching" → "Reset Flow."
- **Legend:** "DETRIMENTAL TAB SWITCHING" → "FOCUS OR QUIT."

---

## 8. Reset Ritual Flow

### Entry Condition

- User clicks pause button in HUD during active session
- `sessionActive = true`, `mode = "session"`

### Ritual Options

```typescript
const ritualOptions = [
  {
    id: "breath",
    label: "Breath Reset",
    duration: 120, // 2 minutes
    description: "Ground yourself with breathing",
    bandwidthGain: +5
  },
  {
    id: "walk",
    label: "Walk Reset",
    duration: 300, // 5 minutes
    description: "Take a short walk",
    bandwidthGain: +7.5
  },
  {
    id: "dump",
    label: "Dump Reset",
    duration: 180, // 3 minutes
    description: "Write down your thoughts",
    bandwidthGain: +6
  },
  {
    id: "personal",
    label: "Personal",
    duration: 240, // 4 minutes
    description: "Conversation, bathroom break",
    bandwidthGain: 0
  }
]
```

### Flow Steps

```
1. handlePauseSession()
   └─ setMode("paused")
   └─ setShowResetPanel(true)

2. ResetPanel displays ritual options
   └─ User selects ritual

3. handleSelectRitual(ritual)
   ├─ setActiveRitual(ritual.id)
   ├─ setTimeRemaining(ritual.duration)
   └─ Start countdown timer

4. Countdown display
   ├─ TimerHalo animation (wave-ripple)
   └─ Format: "2:00", "1:59", "1:58"...

5. When timer reaches 0:00
   └─ handleCompleteRitual(ritualType)
      ├─ applyBandwidthEvent({ type: `${ritual}-reset` })
      ├─ Update bandwidth with gain
      ├─ setMode("session")
      ├─ setShowResetPanel(false)
      └─ Resume session timer

OR User clicks "Skip & Resume"
   └─ handleSkipRitual()
      ├─ setActiveRitual(null)
      ├─ setMode("session")
      └─ setShowResetPanel(false)
```

---

## 9. Session Ending Flow

### Entry Condition

- User clicks "End Session" button in HUD
- Session time reaches 0 (optional: overtime nudge appears first)

### End Session Modal Flow

```
1. handleStopSession()
   └─ setShowEndSessionModal(true)

2. EndSessionModal displays two options:

   Option A: Quick Exit
   └─ handleEndSessionQuickExit()
      └─ handleEndSession("quick_exit")

   Option B: Continue & Select Reason
   └─ Shows reason selection:
      ├─ "Mission Complete" (endReason: "mission_complete")
      │  └─ Sub-reasons: "Hit my target", "Finished early", "Perfect timing"
      │
      ├─ "I'm Stopping Early" (endReason: "stopping_early")
      │  └─ Sub-reasons: "Need a break", "Lost focus", "Ran out of time"
      │
      └─ "I'm Being Pulled Away" (endReason: "pulled_away")
         └─ Sub-reasons: "Emergency", "Meeting", "Interruption"
   
   └─ handleEndSessionContinue(reason, subReason)
      └─ handleEndSession(reason, subReason)

3. handleEndSession(reason, subReason?)
   ├─ Create SessionRecord
   │  ├─ sessionId, startedAt, endedAt
   │  ├─ plannedDurationMinutes, actualDurationMinutes
   │  ├─ mode, victoryLevel, flowEfficiency
   │  ├─ longestStreakMinutes, distractionAttempts
   │  ├─ interventionsUsed, endReason, endSubReason
   │  ├─ timelineBlocks, distractionEvents, interventionEvents
   │  └─ reflection: null
   │
   ├─ saveSessionRecord(sessionRecord)
   ├─ clearRecoveryData()
   ├─ setMode("idle")
   ├─ setSessionActive(false)
   ├─ setShowEndSessionModal(false)
   ├─ setCurrentSessionRecord(sessionRecord)
   └─ setShowPostSessionSummary(true)
```

---

## 10. Post-Session Debrief

### Phase 1: Game Tape (Summary)

```
1. showPostSessionSummary = true
   └─ PostSessionSummaryPanel displays

2. Summary displays:
   ├─ Session Timeline (visual blocks)
   │  ├─ Flow (green)
   │  ├─ Working (cyan)
   │  ├─ Distracted (red)
   │  └─ Reset (gray)
   │
   ├─ Metrics Grid:
   │  ├─ Flow Efficiency (%)
   │  ├─ Longest Streak (minutes)
   │  ├─ Distraction Attempts (count)
   │  ├─ Interventions Used (count)
   │  └─ Victory Badge (Minimum/Good/Legend/Missed + Mode)

3. User actions:
   ├─ "Skip Reflection" → handleSkipReflection()
   │  └─ showPostSessionSummary = false
   │  └─ Check for parking lot items
   │
   └─ "Continue" → handleContinueToReflection()
      ├─ showPostSessionSummary = false
      └─ showSessionReflection = true
```

### Phase 2: Reflection (Debrief)

```
1. showSessionReflection = true
   └─ SessionReflectionPanel displays

2. Reflection questions (collapsible sections):
   
   Q1: What went well this session?
   └─ Free-text textarea (required)
   
   Q2: What was the friction? (ONLY if flowEfficiency < 60%)
   └─ Free-text textarea (optional)
   └─ Context: "Your flow efficiency was {X}%. What made it hard?"
   
   Q3: How's your closing energy?
   └─ 1-5 emoji scale (required)
      ├─ 1: 😫 Drained
      ├─ 2: 😐 Meh
      ├─ 3: 😊 Okay
      ├─ 4: 😄 Energized
      └─ 5: 🔥 Fire

3. User actions:
   ├─ "Skip" → handleReflectionSkip()
   │  ├─ showSessionReflection = false
   │  └─ Check for parking lot items
   │     ├─ If items exist → showParkingLotHarvest = true
   │     └─ Else → setMode("idle")
   │
   └─ "Save Reflection" → handleReflectionSave(reflection)
      ├─ Create ReflectionObject
      │  ├─ sessionId, whatWentWell, frictionNotes?
      │  ├─ closingEnergy, skipped: false, createdAt
      │
      ├─ saveReflection(reflection)
      ├─ showSessionReflection = false
      └─ Check for parking lot items
         ├─ If items exist → showParkingLotHarvest = true
         └─ Else → setMode("idle")
```

---

## 11. Parking Lot Harvest

### Entry Condition

- User completes or skips reflection
- Active parking lot items exist (status: "OPEN" or "PENDING")

### Flow Steps

```
1. Check for harvestable items
   └─ const items = getActiveParkingLotItems()
   └─ If items.length > 0 → showParkingLotHarvest = true

2. ParkingLotHarvestPanel displays
   └─ For each parking lot item:

3. Item Processing (per item):
   
   A. Category Selection (required)
   └─ Options: task | idea | reminder | distraction
   
   B. Tags (optional)
   └─ Available tags:
      ├─ urgent, follow-up, research
      ├─ creative, admin, personal
   └─ User can select multiple
   
   C. Action (required)
   └─ Options:
      ├─ "Add to Next Session" (status: PENDING)
      │  └─ Auto-appears in next session's pre-flow
      │  └─ Auto-selected for next parking lot session
      │
      ├─ "Keep in List" (status: OPEN)
      │  └─ Stays available in parking lot
      │  └─ Manual selection in next session
      │
      └─ "Delete" (status: DELETED)
         └─ Permanently removed from parking lot

4. User actions:
   ├─ "Skip" → handleHarvestSkip()
   │  └─ showParkingLotHarvest = false
   │  └─ setMode("idle")
   │
   └─ "Complete Harvest" → handleHarvestComplete(harvestedItems)
      ├─ For each item:
      │  └─ updateParkingLotItemHarvestAction(id, category, tags, action)
      │     └─ If action = "next-session" → status = "PENDING"
      │     └─ If action = "keep" → status = "OPEN"
      │     └─ If action = "delete" → status = "DELETED"
      │
      ├─ showParkingLotHarvest = false
      └─ setMode("idle")
```

### Parking Lot Item Lifecycle

```
CREATED (status: "OPEN")
  ↓
Used in session → No change (still "OPEN")
  ↓
Harvest action selected:
  ├─ "Add to Next Session" → status = "PENDING"
  ├─ "Keep in List" → status = "OPEN"
  └─ "Delete" → status = "DELETED"
  ↓
Next session starts:
  ├─ "PENDING" items → Auto-selected in pre-session
  ├─ "OPEN" items → Available for manual selection
  └─ "DELETED" items → Permanently hidden
  ↓
Session ends → Harvest again (cycle repeats)
```

---

## 12. Recovery Flow (Interrupted Sessions)

### Detection

```typescript
useEffect(() => {
  // On app load, check for recovery data
  const recovery = getCurrentSession()
  if (recovery) {
    setShowInterruptedModal(true)
    setRecoveryData(recovery)
  }
}, [])
```

### Recovery Data Structure

```typescript
interface RecoveryData {
  sessionId: string
  startedAt: string              // ISO timestamp
  plannedDurationMinutes: number
  mode: "Zen" | "Flow" | "Legend"
  intention: string
  elapsedSeconds: number         // Time elapsed when crashed
}
```

### Flow Steps

```
1. App loads → Recovery data found
   └─ setShowInterruptedModal(true)

2. InterruptedSessionModal displays:
   ├─ "Session Interrupted" message
   ├─ Planned duration: "25 minutes"
   ├─ Elapsed time: "12 min"
   │
   ├─ "Discard" button
   │  └─ handleDiscardRecovery()
   │     ├─ clearRecoveryData()
   │     ├─ setShowInterruptedModal(false)
   │     └─ User starts fresh
   │
   └─ "Continue Session" button
      └─ handleRecoverSession()
         ├─ setSessionMode(recoveryData.mode)
         ├─ setMode("session")
         ├─ setSessionActive(true)
         ├─ Calculate remaining time:
         │  └─ const remaining = Math.max(0, 
         │       duration * 60 - elapsed_seconds)
         │  └─ setTimeRemaining(remaining)
         │
         ├─ Restore bandwidth state (use last known value)
         ├─ Resume session timer
         └─ setShowInterruptedModal(false)
```

---

## 13. Overtime Flow

### Detection

```typescript
useEffect(() => {
  if (!sessionActive) return
  
  const interval = setInterval(() => {
    setSessionTime((prev) => prev + 1)
    setTimeRemaining((prev) => {
      const newTime = Math.max(0, prev - 1)
      
      if (newTime === 0 && prev > 0) {
        // Session time reached, start 5-minute delay
        setTimeout(() => {
          setShowOvertimeNudge(true)
        }, 300000) // 5 minutes = 300000ms
      }
      
      return newTime
    })
  }, 1000)
  
  return () => clearInterval(interval)
}, [sessionActive])
```

### Flow Steps

```
1. Session timer reaches 0:00
   └─ Session continues without nudge

2. 5 minutes pass (overtime threshold)
   └─ setShowOvertimeNudge(true)

3. OvertimeNudgeToast displays (top-right corner)
   ├─ Message: "You're X minutes over your planned duration."
   ├─ "End Session" button
   │  └─ onFinishSession()
   │     └─ handleStopSession()
   │     └─ Proceed to post-session flow
   │
   └─ "+5 Minutes" button
      └─ onExtend()
         ├─ setTimeRemaining((prev) => prev + 300)
         ├─ setShowOvertimeNudge(false)
         └─ Countdown resumes from 5:00

4. If user extends, overtime nudge will reappear in 5 more minutes
```

---

## 14. Complete State Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                    SESSION LIFECYCLE STATE MACHINE                   │
└──────────────────────────────────────────────────────────────────────┘

                           NOT-CALIBRATED
                                 │
                                 ↓ (Complete Calibration)
                                 
                                IDLE
                                 ↑ ↓
                 ┌───────────────┼───────────────┐
                 │               │               │
                 ↓               ↓               ↓
           CALIBRATING    PRE-SESSION      PARKING-LOT
                 │               │         (view only)
                 └───────┬───────┘
                         │
                         ↓ (Start Session)
                         
                    IN-SESSION ←─────────┐
                         ↑ ↓             │
                 ┌───────┼───────┐       │
                 │       │       │       │
                 ↓       ↓       ↓       │
             PAUSED  FLOW-ST  INTERVENTION
             (Reset)  (Active)  (Overlay)
                 │       │       │       │
                 └───────┼───────┘       │
                         │               │
                         ↓ (End/Overtime)
                         
                    ENDING-SESSION
                         │
                         ↓ (Save Record)
                         
                 POST-SESSION-SUMMARY
                    (Game Tape)
                         │
                         ↓ (User Saves/Skips)
                         
                    REFLECTION
                    (Debrief)
                         │
                         ↓ (If items exist)
                         
                 PARKING-LOT-HARVEST
                         │
                         ↓ (Complete)
                         
                      COMPLETE
                         │
                         ↓ (Return)
                         
                        IDLE
```

---

## Summary

This documentation captures all user journeys and state transitions in the DustOff Reset application. Key characteristics:

1. **Sequential Flow:** Most flows are linear with clear entry/exit conditions
2. **State Persistence:** Recovery data ensures no session is lost
3. **User Choice:** Multiple exit points allow users to skip optional flows
4. **Mode-Specific Behavior:** Zen/Flow/Legend modes change intervention intensity
5. **Automated Triggers:** Flow detection, interventions, and overtime nudges happen automatically
6. **Parking Lot Integration:** Seamlessly integrated into pre-session and post-session flows

All flows converge back to the IDLE state, ready for the next calibration or session.

---

**End of Frontend Process Flows Documentation**
