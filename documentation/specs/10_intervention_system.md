
# **10 - Intervention System Specification**

**Version:** 1.0**Last Updated:** January 12, 2026**Purpose:** Complete specification of the intervention/warning system including trigger thresholds, mode-specific behaviors, UI overlays, and integration with bandwidth penalties and ritual recovery for Human Capacity OS.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Intervention Types](#2-intervention-types)
3. [Trigger System](#3-trigger-system)
4. [Mode-Specific Responses](#4-mode-specific-responses)
5. [Intervention Overlay UI](#5-intervention-overlay-ui)
6. [Manual vs Auto Interventions](#6-manual-vs-auto-interventions)
7. [Integration with Bandwidth](#7-integration-with-bandwidth)
8. [Integration with Rituals](#8-integration-with-rituals)
9. [Flow State Impact](#9-flow-state-impact)
10. [Implementation Notes](#10-implementation-notes)


---

## 1. Overview

### 1.1 Philosophy

The intervention system acts as a **cognitive capacity guardian** - detecting when bandwidth drops to critical levels and providing escalating warnings to prevent complete focus collapse.

**Key Principles:**

- **Progressive escalation** - Gentle nudges → Firm warnings → Hard stops (mode-dependent)
- **Mode-appropriate tone** - Zen is calming, Flow is focused, Legend is aggressive
- **Actionable guidance** - Always suggest concrete recovery paths (rituals)
- **Non-blocking (mostly)** - Zen/Flow modes allow dismissal, Legend mode forces action
- **Biological grounding** - Interventions trigger when capacity genuinely depleted


### 1.2 Core Concept

Interventions are **proactive warnings** triggered by low bandwidth. They signal:

- "Your capacity is depleted"
- "Continuing will be counterproductive"
- "Take action now to restore effectiveness"


Unlike penalties (which happen automatically), interventions require **user acknowledgment** and ideally lead to **ritual engagement**.

---

## 2. Intervention Types

### 2.1 Type Definitions

```typescript
type InterventionType = 
  | "friction"              // Moderate distraction detected
  | "focus-slipping"        // Severe distraction detected
  | "non-whitelisted-app"   // Blacklisted app opened
  | "tab-switch"            // Burst tab switching detected
```

---

### 2.2 Friction Intervention

**Trigger:** Bandwidth drops to 50-59 range

**Signal:** User has experienced multiple context switches or minor interventions, capacity is moderately depleted

**Severity:** **Moderate** - Warning level

**Suggested Action:** Brief pause and reset (2-3 min ritual)

**Use Case Examples:**

- Switched between 3-4 apps in short succession
- Multiple tab switches without burst threshold
- Mild distraction pattern emerging


---

### 2.3 Focus-Slipping Intervention

**Trigger:** Bandwidth drops below 50

**Signal:** User is significantly distracted, capacity critically depleted

**Severity:** **High** - Critical warning level

**Suggested Action:** Immediate pause and substantial reset (5 min ritual)

**Use Case Examples:**

- Opened non-whitelisted app multiple times
- Burst switching detected (>5 tabs or >3 apps in 60s)
- Sustained low bandwidth despite previous warnings
- Multiple friction interventions ignored


---

### 2.4 Non-Whitelisted App Intervention

**Trigger:** User switches to application outside pre-session whitelist

**Signal:** Explicit violation of focus boundaries

**Severity:** **High** - Immediate warning

**Suggested Action:** Close app immediately and return to whitelisted work

**Use Case Examples:**

- Opened Slack when not whitelisted
- Opened social media app
- Opened email client outside whitelist


---

### 2.5 Tab Switch Intervention

**Trigger:** >5 tab switches detected within 60-second window (burst)

**Signal:** Frantic context switching, scattered focus

**Severity:** **High** - Pattern warning

**Suggested Action:** Pause session and reset focus

**Use Case Examples:**

- Rapidly switching between 6+ browser tabs
- Unable to settle on one task
- Research rabbit hole or decision paralysis


---

## 3. Trigger System

### 3.1 Bandwidth-Based Triggers (Auto)

**Primary Trigger Function:**

```typescript
function checkAutoInterventionTrigger(
  bandwidth: number
): "friction" | "focus-slipping" | null {
  if (bandwidth < 50) {
    return "focus-slipping"  // Critical state
  }
  if (bandwidth < 60) {
    return "friction"        // Warning state
  }
  return null               // Normal state (≥60)
}
```

**Threshold Breakdown:**

| Bandwidth Range | Intervention Type | Auto-Trigger | Severity
|-----|-----|-----|-----
| 75-100 | None | No | Healthy
| 60-74 | None | No | Normal
| 50-59 | Friction | Yes | Warning
| 0-49 | Focus-Slipping | Yes | Critical


---

### 3.2 Event-Based Triggers (Auto)

**Non-Whitelisted App:**

```typescript
function handleAppSwitch(appName: string, whitelist: string[]) {
  if (!whitelist.includes(appName)) {
    // Trigger non-whitelisted-app intervention
    showIntervention({
      type: "non-whitelisted-app",
      details: { appName }
    })
  }
}
```

**Tab Switch Burst:**

```typescript
function handleTabSwitch(switchCount: number, timeWindow: number) {
  if (switchCount > 5 && timeWindow <= 60000) {
    // Trigger tab-switch intervention
    showIntervention({
      type: "tab-switch",
      details: { tabCount: switchCount }
    })
  }
}
```

---

### 3.3 Manual Triggers

**HUD Buttons:**

```typescript
// User can manually trigger interventions via HUD
<button onClick={() => handleManualIntervention("friction")}>
  Friction
</button>

<button onClick={() => handleManualIntervention("focus-slipping")}>
  Focus-Slipping
</button>
```

**Manual Trigger Behavior:**

- Applies same bandwidth penalty as auto-trigger
- Shows intervention overlay with mode-appropriate messaging
- Counts toward "interventions used" session metric


---

## 4. Mode-Specific Responses

### 4.1 Zen Mode

**Philosophy:** Gentle, supportive, calming tone. Respects user autonomy.

**Visual Style:**

- Emerald green theme (`#10b981`)
- Soft glow effects
- Slides in from right
- Auto-dismisses after 10 seconds


---

#### Friction (Zen)

```plaintext
┌─────────────────────────────────────────┐
│ FRICTION DETECTED                       │
│                                         │
│ Take a moment to breathe. Reset your   │
│ focus. You are in control of your      │
│ emotions.                               │
│                                         │
│  [Take a Break]     [Dismiss]          │
│                                         │
│  ████████░░░░░░░░░░ (10s countdown)    │
└─────────────────────────────────────────┘
```

**Action Button:** "Take a Break" → Opens ritual selection panel

---

#### Focus-Slipping (Zen)

```plaintext
┌─────────────────────────────────────────┐
│ FOCUS SLIPPING                          │
│                                         │
│ Don't let yourself be distracted.      │
│ Let's keep focus!                       │
│                                         │
│  [Pause & Reflect]  [Dismiss]          │
│                                         │
│  ████████░░░░░░░░░░ (10s countdown)    │
└─────────────────────────────────────────┘
```

**Action Button:** "Pause & Reflect" → Opens ritual selection panel

---

#### Non-Whitelisted App (Zen)

```plaintext
┌─────────────────────────────────────────┐
│ NON WHITELISTED APP OR WEBSITE          │
│                                         │
│ Reserve your energy for the tasks that │
│ matter. You can do this!                │
│                                         │
│  [Close & Refocus]  [Dismiss]          │
│                                         │
│  ████████░░░░░░░░░░ (10s countdown)    │
└─────────────────────────────────────────┘
```

**Action Button:** "Close & Refocus" → Opens ritual selection panel

---

#### Tab Switch (Zen)

```plaintext
┌─────────────────────────────────────────┐
│ DETRIMENTAL TAB OR CONTEXT SWITCHING    │
│                                         │
│ One tab at a time. One app at a time.  │
│ We will win the race.                   │
│                                         │
│  [Pause Session]    [Dismiss]          │
│                                         │
│  ████████░░░░░░░░░░ (10s countdown)    │
└─────────────────────────────────────────┘
```

**Action Button:** "Pause Session" → Opens ritual selection panel

---

### 4.2 Flow Mode

**Philosophy:** Focused, clear, practical tone. Emphasizes flow state preservation.

**Visual Style:**

- Cyan blue theme (`#06b6d4`)
- Clean, technical aesthetic
- Slides in from left
- Explode-in animation (1s) → Smooth movement (9s) → Auto-dismiss
- X button for manual dismiss


---

#### Friction (Flow)

```plaintext
┌─────────────────────────────────────────┐
│ FRICTION DETECTED               [X]     │
│                                         │
│ Pause and reset your focus. Multiple   │
│ context switches can pull you out of   │
│ flow state.                             │
│                                         │
│  [Reset Focus]      [Dismiss]          │
│                                         │
│  ████████░░░░░░░░░░ (10s countdown)    │
└─────────────────────────────────────────┘
```

**Action Button:** "Reset Focus" → Opens ritual selection panel

---

#### Focus-Slipping (Flow)

```plaintext
┌─────────────────────────────────────────┐
│ FOCUS SLIPPING                  [X]     │
│                                         │
│ Don't let yourself be distracted.      │
│ Let's keep focus!                       │
│                                         │
│  [Assess & Reset]   [Dismiss]          │
│                                         │
│  ████████░░░░░░░░░░ (10s countdown)    │
└─────────────────────────────────────────┘
```

**Action Button:** "Assess & Reset" → Opens ritual selection panel

---

#### Non-Whitelisted App (Flow)

```plaintext
┌─────────────────────────────────────────┐
│ NON WHITELISTED APP OR WEBSITE  [X]     │
│                                         │
│ Reserve your energy for the tasks that │
│ matter. You can do this!                │
│                                         │
│  [Close App]        [Dismiss]          │
│                                         │
│  ████████░░░░░░░░░░ (10s countdown)    │
└─────────────────────────────────────────┘
```

**Action Button:** "Close App" → Opens ritual selection panel

---

#### Tab Switch (Flow)

```plaintext
┌─────────────────────────────────────────┐
│ DETRIMENTAL TAB OR CONTEXT SWITCHING [X]│
│                                         │
│ One tab at a time. One app at a time.  │
│ We will win the race.                   │
│                                         │
│  [Reset Flow]       [Dismiss]          │
│                                         │
│  ████████░░░░░░░░░░ (10s countdown)    │
└─────────────────────────────────────────┘
```

**Action Button:** "Reset Flow" → Opens ritual selection panel

---

### 4.3 Legend Mode

**Philosophy:** Aggressive, confrontational, urgent tone. Forces user accountability.

**Visual Style:**

- Red theme (`#ef4444`)
- Full-screen modal with backdrop blur
- Pulsing glow effects
- ALL CAPS messaging
- No auto-dismiss (requires action)
- Larger buttons and text


---

#### Friction (Legend)

```plaintext
┌─────────────────────────────────────────┐
│                                         │
│         FRICTION DETECTED               │
│                                         │
│  Stop now and reset. Multiple          │
│  distractions detected. You're losing  │
│  cognitive bandwidth.                   │
│                                         │
│         [RESET NOW]                     │
│         [Dismiss]                       │
│                                         │
│  ████████████████░░ (10s countdown)    │
│                                         │
└─────────────────────────────────────────┘
```

**Action Button:** "RESET NOW" → Opens ritual selection panel

**No Auto-Dismiss:** User must click button to proceed

---

#### Focus-Slipping (Legend)

```plaintext
┌─────────────────────────────────────────┐
│                                         │
│         FOCUS SLIPPING                  │
│                                         │
│  Don't let yourself be distracted.     │
│  Let's keep focus!                      │
│                                         │
│         [STOP SESSION]                  │
│         [Dismiss]                       │
│                                         │
│  ████████████████░░ (10s countdown)    │
│                                         │
└─────────────────────────────────────────┘
```

**Action Button:** "STOP SESSION" → Ends session immediately (pulls user away)

**Critical Difference:** Legend mode focus-slipping suggests ending session, not just pausing

---

#### Non-Whitelisted App (Legend)

```plaintext
┌─────────────────────────────────────────┐
│                                         │
│   NON WHITELISTED APP OR WEBSITE        │
│                                         │
│  Reserve your energy for the tasks     │
│  that matter. You can do this!          │
│                                         │
│         [CLOSE NOW]                     │
│         [Dismiss]                       │
│                                         │
│  ████████████████░░ (10s countdown)    │
│                                         │
└─────────────────────────────────────────┘
```

**Action Button:** "CLOSE NOW" → Opens ritual selection panel

---

#### Tab Switch (Legend)

```plaintext
┌─────────────────────────────────────────┐
│                                         │
│ DETRIMENTAL TAB OR CONTEXT SWITCHING    │
│                                         │
│  One tab at a time. One app at a time. │
│  We will win the race.                  │
│                                         │
│         [FOCUS OR QUIT]                 │
│         [Dismiss]                       │
│                                         │
│  ████████████████░░ (10s countdown)    │
│                                         │
└─────────────────────────────────────────┘
```

**Action Button:** "FOCUS OR QUIT" → Opens ritual selection panel with ultimatum tone

---

## 5. Intervention Overlay UI

### 5.1 Component Structure

```typescript
interface InterventionOverlayProps {
  isOpen: boolean
  type: InterventionType
  mode: SessionMode
  details?: {
    appName?: string
    tabCount?: number
    duration?: number
  }
  onDismiss: () => void
  onAction?: () => void
}
```

---

### 5.2 Animation Sequences

**Zen Mode:**

```typescript
// Slide in from right
animate-in slide-in-from-right-full duration-700 ease-out

// Auto-dismiss after 10s
setTimeout(() => onDismiss(), 10000)
```

**Flow Mode:**

```typescript
// Two-stage animation
Stage 1 (0-1s): Explode in (zoom-in effect)
Stage 2 (1-10s): Smooth movement across screen
Stage 3 (10s): Fade out and dismiss

// X button always available for manual dismiss
```

**Legend Mode:**

```typescript
// Full-screen modal
animate-in fade-in duration-300
animate-in zoom-in-95 duration-500

// Pulsing background glow
w-96 h-96 rounded-full bg-red-500/20 animate-pulse blur-3xl

// No auto-dismiss
// User must click action button or dismiss button
```

---

### 5.3 Countdown Progress Bar

All interventions include a visual countdown showing time until auto-dismiss:

```typescript
<div className="w-full h-1 bg-emerald-900/40 rounded-full overflow-hidden">
  <div
    className="h-full bg-emerald-500/60"
    style={{
      animation: "shrink 10s linear"
    }}
  />
</div>

<style jsx>{`
  @keyframes shrink {
    from { width: 100%; }
    to { width: 0%; }
  }
`}</style>
```

**Visual Feedback:**

- Full width at 0s
- Linearly shrinks to 0% at 10s
- Color matches mode theme (emerald/cyan/red)


---

## 6. Manual vs Auto Interventions

### 6.1 Auto-Triggered Interventions

**Bandwidth-Based:**

```typescript
// Checked every second during active session
useEffect(() => {
  const interventionType = checkAutoInterventionTrigger(bandwidth)
  if (interventionType && !showIntervention) {
    setInterventionType(interventionType)
    setShowIntervention(true)
  }
}, [bandwidth])
```

**Event-Based:**

```typescript
// Triggered immediately when event detected
function handleNonWhitelistedApp(appName: string) {
  setInterventionType("non-whitelisted-app")
  setInterventionDetails({ appName })
  setShowIntervention(true)
}
```

---

### 6.2 Manual-Triggered Interventions

**HUD Buttons:**

```typescript
// Friction button
<button 
  onClick={() => handleManualIntervention("friction")}
  className="..."
>
  Friction
</button>

// Focus-slipping button
<button 
  onClick={() => handleManualIntervention("focus-slipping")}
  className="..."
>
  Focus-Slipping
</button>
```

**Behavior:**

```typescript
function handleManualIntervention(type: "friction" | "focus-slipping") {
  // 1. Apply bandwidth penalty
  const penalty = type === "friction" ? -5 : -10
  setBandwidth(prev => Math.max(0, prev + penalty))
  
  // 2. Show intervention overlay
  setInterventionType(type)
  setShowIntervention(true)
  
  // 3. Record intervention event
  addInterventionEvent({
    timestamp: Date.now(),
    type,
    manual: true
  })
}
```

---

### 6.3 Differences

| Aspect | Auto-Triggered | Manual-Triggered
|-----|-----|-----|-----
| **Initiation** | System detects event/threshold | User clicks HUD button
| **Timing** | Immediate when condition met | Any time during session
| **Penalty** | Already applied before trigger | Applied on trigger
| **Recording** | Marked as auto in session data | Marked as manual in session data
| **Use Case** | User unaware of capacity loss | User self-reports feeling


---

## 7. Integration with Bandwidth

### 7.1 Intervention Triggers Update Bandwidth

**Friction:**

```typescript
// Manual trigger
handleManualIntervention("friction")
  ↓
applyFrictionPenalty(currentBandwidth)
  ↓
currentBandwidth - 5
  ↓
If bandwidth drops below 60 → Auto-intervention may trigger
```

**Focus-Slipping:**

```typescript
// Manual trigger
handleManualIntervention("focus-slipping")
  ↓
applyFocusSlippingPenalty(currentBandwidth)
  ↓
currentBandwidth - 10
  ↓
If bandwidth drops below 50 → Auto-intervention already triggered
```

---

### 7.2 Cascade Effect

**Example Scenario:**

```plaintext
1. Bandwidth: 65
2. User manually triggers "Friction" → Bandwidth: 60
3. Auto-intervention triggers (bandwidth < 60) → Shows friction overlay
4. User dismisses without action
5. Bandwidth continues to decay (no sustained focus gain)
6. Bandwidth drops to 48
7. Auto-intervention upgrades to "Focus-Slipping"
8. User forced to take action
```

---

## 8. Integration with Rituals

### 8.1 Intervention → Ritual Flow

**User Journey:**

```plaintext
1. Bandwidth drops to 55
   ↓
2. Auto-intervention triggers (friction)
   ↓
3. Intervention overlay appears
   ↓
4. User clicks action button ("Reset Focus")
   ↓
5. onAction callback fires
   ↓
6. handlePauseSession() called
   ↓
7. Ritual selection panel opens
   ↓
8. User selects Walk Reset (5 min)
   ↓
9. Ritual countdown begins
   ↓
10. Ritual completes
    ↓
11. Bandwidth +7.5 → New bandwidth: 62.5
    ↓
12. Above friction threshold → Intervention resolved
```

---

### 8.2 Ritual Completion Resolution

**Successful Resolution:**

```typescript
// Before ritual
bandwidth: 55 (friction zone)
interventionActive: true

// After Walk Reset (+7.5)
bandwidth: 62.5 (normal zone)
interventionActive: false  // Auto-dismissed when bandwidth > 60
```

**Partial Resolution:**

```typescript
// Before ritual
bandwidth: 45 (focus-slipping zone)

// After Breath Reset (+5)
bandwidth: 50 (still in warning zone, but improved)
interventionActive: true  // Still showing, but less severe
interventionType: "friction"  // Downgraded from focus-slipping
```

---

## 9. Flow State Impact

### 9.1 Interventions Exit Flow

**Rule:** Any intervention (manual or auto) exits flow state immediately.

```typescript
function handleIntervention(type: InterventionType) {
  // Exit flow state
  if (flowState.isActive) {
    exitFlowState(flowState, `${type} intervention triggered`)
  }
  
  // Show intervention overlay
  showIntervention(type)
}
```

**Rationale:**

- Interventions signal distraction/capacity loss
- Flow requires sustained focus with no interruptions
- Triggering an intervention = breaking flow conditions


---

### 9.2 Flow Recovery After Intervention

**To Re-Enter Flow:**

```typescript
// All 4 conditions must be met again:
1. sustainedFocusMinutes >= 12 (reset to 0 after intervention)
2. No interventions in last 12 minutes
3. No context switches in last 12 minutes
4. bandwidth >= 75

// Example recovery timeline:
00:00 - Flow active (bandwidth 78)
15:00 - Intervention triggered (bandwidth drops to 55)
15:00 - Flow exits, sustained focus reset to 0
15:01 - User completes Walk Reset (+7.5) → bandwidth 62.5
15:06 - Session resumes
27:06 - 12 minutes sustained focus achieved
27:06 - Bandwidth recovered to 75+ (through sustained focus gains)
27:06 - Flow re-enters
```

---

## 10. Implementation Notes

### 10.1 Intervention State Management

```typescript
const [showIntervention, setShowIntervention] = useState(false)
const [interventionType, setInterventionType] = useState<InterventionType | null>(null)
const [interventionDetails, setInterventionDetails] = useState<any>(null)
```

---

### 10.2 Dismiss Logic

**Zen/Flow Modes:**

```typescript
function handleDismiss() {
  setShowIntervention(false)
  setInterventionType(null)
  setInterventionDetails(null)
  // User can continue without action (risky but allowed)
}
```

**Legend Mode:**

```typescript
// No auto-dismiss - buttons force action
// Can still dismiss manually but strongly discouraged
```

---

### 10.3 Session Recording

**Intervention Events:**

```typescript
interface InterventionEvent {
  timestamp: number      // Milliseconds since session start
  type: string          // "friction", "focus-slipping", etc.
  manual: boolean       // True if user-triggered, false if auto
  dismissed: boolean    // True if dismissed without action
  actionTaken?: string  // "ritual", "session-end", null
}
```

**Example Session Record:**

```typescript
{
  interventionEvents: [
    {
      timestamp: 900000,  // 15 minutes in
      type: "friction",
      manual: false,
      dismissed: false,
      actionTaken: "breath-reset"
    },
    {
      timestamp: 1800000,  // 30 minutes in
      type: "focus-slipping",
      manual: true,
      dismissed: false,
      actionTaken: "walk-reset"
    }
  ],
  interventionsUsed: 2
}
```

---

### 10.4 Testing Recommendations

**Unit Tests:**

```typescript
describe('Intervention Triggers', () => {
  it('should trigger friction at bandwidth 59', () => {
    expect(checkAutoInterventionTrigger(59)).toBe('friction')
  })
  
  it('should trigger focus-slipping at bandwidth 49', () => {
    expect(checkAutoInterventionTrigger(49)).toBe('focus-slipping')
  })
  
  it('should not trigger at bandwidth 60', () => {
    expect(checkAutoInterventionTrigger(60)).toBe(null)
  })
})
```

---

### 10.5 Future Enhancements

**Adaptive Thresholds:**

- Learn user's typical bandwidth patterns
- Adjust intervention thresholds per user
- Example: Power user might not need friction until 45


**Intervention History:**

- Track which interventions are most effective
- Suggest optimal ritual based on intervention type
- Show trends over time


**Smart Timing:**

- Avoid interrupting during critical moments
- Delay intervention if in middle of typing
- Queue intervention for natural break point


---

**End of Intervention System Specification**

---

**You can now save this as `documentation/`**

This document provides complete specifications for the intervention/warning system including all trigger logic, mode-specific messaging and UI, animation sequences, bandwidth integration, ritual pathways, and flow state impacts. All behaviors match the current implementation in version 104.