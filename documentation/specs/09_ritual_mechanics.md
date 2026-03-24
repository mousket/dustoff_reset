
# **09 - Ritual Mechanics Specification**

**Version:** 1.0**Last Updated:** January 12, 2026**Purpose:** Complete specification of reset ritual mechanics including bandwidth restoration, timing, UI flows, and integration with session lifecycle for Human Capacity OS.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Ritual Types and Restoration Values](#2-ritual-types-and-restoration-values)
3. [Ritual Trigger System](#3-ritual-trigger-system)
4. [Ritual UI Flow](#4-ritual-ui-flow)
5. [Bandwidth Restoration Formulas](#5-bandwidth-restoration-formulas)
6. [Timing and Countdown Logic](#6-timing-and-countdown-logic)
7. [Parking Lot Integration](#7-parking-lot-integration)
8. [Intervention-Ritual Relationship](#8-intervention-ritual-relationship)
9. [Session Impact and Recording](#9-session-impact-and-recording)
10. [Implementation Notes](#10-implementation-notes)


---

## 1. Overview

### 1.1 Philosophy

Rituals are **recovery mechanisms** that allow users to restore cognitive bandwidth during active sessions. Unlike penalties which happen automatically or through detected events, rituals require conscious user action and time investment.

**Design Principles:**

- **Embodied recovery** - Physical or mental actions that genuinely restore capacity
- **Time-boxed commitment** - Each ritual has a fixed duration that must be honored
- **Proportional restoration** - More intensive rituals provide greater bandwidth gains
- **Non-exploitable** - Cannot be spammed or gamed; genuine engagement required
- **Optional participation** - User chooses when to engage rituals


### 1.2 When to Use Rituals

**Ideal Scenarios:**

- Bandwidth has dropped due to context switching or interventions
- Feeling overwhelmed or scattered (intervention triggered)
- Proactive reset before bandwidth drops too low
- Mid-session recalibration after long focus stretch


**Not Recommended:**

- As a way to "game" the system for higher bandwidth
- During high flow state (unnecessary interruption)
- Repeatedly without genuine engagement


---

## 2. Ritual Types and Restoration Values

### 2.1 Complete Ritual Specification

| Ritual Type | Duration | Bandwidth Gain | Cap | Description | Best For
|-----|-----|-----|-----|-----|-----
| **Breath Reset** | 120 seconds (2 min) | +5 points | 100 | Guided breathing exercise | Quick recenter when mildly scattered
| **Walk Reset** | 300 seconds (5 min) | +7.5 points | 100 | Physical movement break | Physical restlessness, eye strain, stiffness
| **Dump Reset** | 180 seconds (3 min) | +6 points | 100 | Brain dump via parking lot | Mental clutter, intrusive thoughts
| **Personal Reset** | 240 seconds (4 min) | 0 points | — | Bathroom, conversation, etc. | Biological needs, external interruptions


---

### 2.2 Ritual Ranking by Effectiveness

**Highest Restoration: Walk Reset (+7.5)**

- **Why:** Combines physical movement (blood flow, oxygen) with mental break
- **Mechanics:** Changes environment, engages body, creates mental distance
- **Best scenario:** Sitting for 45+ minutes, feeling physically tense


**Medium-High Restoration: Dump Reset (+6)**

- **Why:** Externalizes intrusive thoughts, clears working memory
- **Mechanics:** Offloads mental burden to parking lot for later processing
- **Best scenario:** Many competing thoughts, unable to focus on primary task


**Medium Restoration: Breath Reset (+5)**

- **Why:** Activates parasympathetic nervous system, reduces stress hormones
- **Mechanics:** Controlled breathing pattern with visual guidance
- **Best scenario:** Feeling anxious, scattered, or mildly overwhelmed


**No Restoration: Personal Reset (0)**

- **Why:** Not a cognitive recovery mechanism, just a pause
- **Use case:** Necessary break for biological needs or unavoidable external interruptions
- **Effect:** Pauses session timer, no bandwidth impact


---

## 3. Ritual Trigger System

### 3.1 Entry Conditions

**Primary Trigger:**

```typescript
function handlePauseSession() {
  setMode("paused")
  setShowResetPanel(true)
}
```

**User Actions that Open Ritual Panel:**

1. Clicking pause button (⏸) in FloatingHUD
2. Clicking "Pause & Reflect" action button in Intervention overlay (Zen mode)
3. Clicking "Reset Focus" action button in Intervention overlay (Flow mode)
4. Manual pause via keyboard shortcut (future feature)


---

### 3.2 Session State Changes

**Before Pause:**

```typescript
mode: "session"
sessionActive: true
showResetPanel: false
```

**During Pause (Ritual Selection):**

```typescript
mode: "paused"
sessionActive: false  // Timer stops
showResetPanel: true
activeRitual: null    // No ritual selected yet
```

**During Ritual Execution:**

```typescript
mode: "paused"
sessionActive: false
showResetPanel: true
activeRitual: "breath" | "walk" | "dump" | "personal"
timeRemaining: <ritual duration in seconds>
```

**After Ritual Completion:**

```typescript
mode: "session"
sessionActive: true   // Timer resumes
showResetPanel: false
activeRitual: null
// Bandwidth updated with restoration value
```

---

## 4. Ritual UI Flow

### 4.1 Ritual Selection Phase

**Component:** `ResetPanel` (shown within DraggableContainer) or `ResetModal` (onboarding variant)

**Layout:**

```plaintext
┌─────────────────────────────────────────┐
│  Choose Your Reset                      │
│  Take a moment to recharge and return   │
│  focused                                │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────┐  ┌──────────┐           │
│  │  Breath  │  │   Walk   │           │
│  │  Reset   │  │  Reset   │           │
│  │  2 min   │  │  5 min   │           │
│  └──────────┘  └──────────┘           │
│                                         │
│  ┌──────────┐  ┌──────────┐           │
│  │   Dump   │  │ Personal │           │
│  │  Reset   │  │          │           │
│  │  3 min   │  │  4 min   │           │
│  └──────────┘  └──────────┘           │
│                                         │
├─────────────────────────────────────────┤
│        [Cancel]                         │
└─────────────────────────────────────────┘
```

**Interaction:**

- User hovers over ritual card → Border changes to emerald-500
- User clicks ritual → `handleSelectRitual(ritual)` called
- Panel transitions to countdown phase


---

### 4.2 Ritual Countdown Phase

**Component:** Same `ResetPanel` with conditional rendering

**Layout:**

```plaintext
┌─────────────────────────────────────────┐
│         Breath Reset                    │
│  Ground yourself with breathing         │
├─────────────────────────────────────────┤
│                                         │
│          ┌─────────┐                   │
│          │         │                   │
│          │  2:00   │                   │
│          │         │                   │
│          └─────────┘                   │
│      (Wave ripple animation)           │
│                                         │
├─────────────────────────────────────────┤
│     [Skip & Resume]                     │
└─────────────────────────────────────────┘
```

**Animation:** `TimerHalo` component with `variant="wave-ripple"`

- Green pulsing circles expanding from center
- Synced with countdown timer
- Creates calming, rhythmic visual


**Countdown Format:**

```typescript
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Examples:
// 120 seconds → "2:00"
// 90 seconds → "1:30"
// 5 seconds → "0:05"
```

---

### 4.3 Ritual Completion

**Auto-Complete (Timer Reaches 0):**

```typescript
useEffect(() => {
  if (activeRitual && timeRemaining > 0) {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Ritual complete!
          setActiveRitual(null)
          onClose()  // Triggers handleCompleteRitual in parent
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }
}, [activeRitual, timeRemaining, onClose])
```

**Manual Skip (User Clicks "Skip & Resume"):**

```typescript
function handleSkipRitual() {
  setActiveRitual(null)
  setTimeRemaining(0)
  onClose()  // No bandwidth restoration applied
}
```

---

## 5. Bandwidth Restoration Formulas

### 5.1 Breath Reset

**Formula:**

```typescript
function applyBreathResetRestoration(current: number): number {
  return Math.min(100, current + 5)
}
```

**Examples:**

- Current: 45 → Result: **50** (+5)
- Current: 70 → Result: **75** (+5)
- Current: 96 → Result: **100** (+4, capped)


**Bandwidth Event:**

```typescript
{
  type: "breath-reset",
  timestamp: Date.now(),
  details: { duration: 120 }
}
```

---

### 5.2 Walk Reset

**Formula:**

```typescript
function applyWalkResetRestoration(current: number): number {
  return Math.min(100, current + 7.5)
}
```

**Examples:**

- Current: 45 → Result: **52.5** (+7.5)
- Current: 70 → Result: **77.5** (+7.5)
- Current: 95 → Result: **100** (+5, capped)


**Bandwidth Event:**

```typescript
{
  type: "walk-reset",
  timestamp: Date.now(),
  details: { duration: 300 }
}
```

**Note:** This is the **only formula that produces decimal values** in bandwidth calculations.

---

### 5.3 Dump Reset

**Formula:**

```typescript
function applyDumpResetRestoration(current: number): number {
  return Math.min(100, current + 6)
}
```

**Examples:**

- Current: 45 → Result: **51** (+6)
- Current: 70 → Result: **76** (+6)
- Current: 95 → Result: **100** (+5, capped)


**Bandwidth Event:**

```typescript
{
  type: "dump-reset",
  timestamp: Date.now(),
  details: { 
    duration: 180,
    itemsCaptured: 3  // Number of parking lot items added
  }
}
```

---

### 5.4 Personal Reset

**Formula:**

```typescript
// No bandwidth restoration
function applyPersonalReset(current: number): number {
  return current  // No change
}
```

**Purpose:** Allows session pause without penalty but also without restoration.

**No Bandwidth Event Created:** Personal resets are not recorded as bandwidth events.

---

## 6. Timing and Countdown Logic

### 6.1 Countdown Timer Implementation

**State Management:**

```typescript
const [activeRitual, setActiveRitual] = useState<RitualType | null>(null)
const [timeRemaining, setTimeRemaining] = useState(0)
```

**Timer Loop:**

```typescript
useEffect(() => {
  if (!activeRitual || timeRemaining <= 0) return
  
  const interval = setInterval(() => {
    setTimeRemaining((prev) => {
      const newTime = prev - 1
      
      if (newTime <= 0) {
        // Ritual completed
        handleCompleteRitual(activeRitual)
        return 0
      }
      
      return newTime
    })
  }, 1000)  // Tick every second
  
  return () => clearInterval(interval)
}, [activeRitual, timeRemaining])
```

---

### 6.2 Session Timer Behavior During Rituals

**Session Timer Paused:**

```typescript
// While mode === "paused", session timer does NOT decrement
useEffect(() => {
  if (mode !== "session") return  // Skip if paused
  
  const interval = setInterval(() => {
    setSessionTime(prev => prev + 1)
    setTimeRemaining(prev => Math.max(0, prev - 1))
  }, 1000)
  
  return () => clearInterval(interval)
}, [mode])  // Dependency on mode ensures pausing works
```

**Result:** Ritual time does NOT count against planned session duration.

**Example Timeline:**

```plaintext
00:00 - Session starts (45 min planned)
15:00 - User pauses for Walk Reset (5 min)
15:00-20:00 - Walk ritual (session timer frozen at 15:00)
20:00 - Session resumes (30 minutes remaining)
50:00 - Session reaches planned end time
```

---

## 7. Parking Lot Integration

### 7.1 Dump Reset + Parking Lot Capture

**When User Selects "Dump Reset":**

1. Ritual countdown begins (180 seconds)
2. Simultaneously, user can open **ParkingLotCapturePanel** to add items
3. Each captured thought/task is added to parking lot with status "OPEN"
4. When timer completes, bandwidth +6 is applied


**Parking Lot Capture Panel:**

```typescript
interface ParkingLotCaptureProps {
  isOpen: boolean
  onClose: () => void
  onAddItem: (text: string) => void
  currentItems: ParkingLotItem[]
  maxItems: number  // Default: 5
}
```

**Flow:**

```plaintext
User selects Dump Reset
  ↓
Ritual countdown starts (3:00)
  ↓
User types thoughts into parking lot panel
  → "Review PRs" (Enter)
  → "Email client about proposal" (Enter)
  → "Research new framework" (Enter)
  ↓
Timer reaches 0:00
  ↓
Bandwidth +6 applied
  ↓
Session resumes with cleared mind
```

---

### 7.2 Parking Lot Item Structure

**Created During Dump Reset:**

```typescript
interface ParkingLotItem {
  id: string              // UUID
  text: string            // User's captured thought
  timestamp: number       // Creation time (ms)
  status: "OPEN"          // Always OPEN when first created
  createdAt: string       // ISO timestamp
  updatedAt: string       // ISO timestamp
  itemStatus?: "new"      // Default item status
  category?: undefined    // Set later during harvest
  tags?: undefined        // Set later during harvest
  action?: undefined      // Set later during harvest
  resolvedAt?: undefined  // Set when completed/deleted
}
```

---

## 8. Intervention-Ritual Relationship

### 8.1 Intervention Triggers Ritual Suggestion

**Bandwidth Thresholds:**

- **bandwidth < 50:** Focus-slipping intervention
- **50 ≤ bandwidth < 60:** Friction intervention


**Intervention Overlay Action Buttons:**

**Zen Mode:**

- Friction: "Take a Break" → Suggests opening ritual panel
- Focus-Slipping: "Pause & Reflect" → Opens ritual panel


**Flow Mode:**

- Friction: "Reset Focus" → Opens ritual panel
- Focus-Slipping: "Assess & Reset" → Opens ritual panel


**Legend Mode:**

- Friction: "RESET NOW" → Forces ritual selection
- Focus-Slipping: "STOP SESSION" → Ends session immediately


---

### 8.2 Intervention → Ritual Flow

```plaintext
1. Bandwidth drops to 55 (friction zone)
   └─ checkAutoInterventionTrigger(55) → "friction"

2. InterventionOverlay appears
   └─ Shows friction message for current mode
   └─ Action button: "Reset Focus" (Flow mode)

3. User clicks "Reset Focus"
   └─ onAction() callback triggered
   └─ handlePauseSession()
      ├─ setMode("paused")
      └─ setShowResetPanel(true)

4. ResetPanel displays ritual options
   └─ User selects Walk Reset

5. Walk ritual completes
   └─ Bandwidth: 55 + 7.5 = 62.5
   └─ Above friction threshold (60)
   └─ Intervention resolved
```

---

## 9. Session Impact and Recording

### 9.1 Ritual Events in Session Timeline

**Timeline Block Structure:**

```typescript
interface TimelineBlock {
  start: number      // Milliseconds since session start
  end: number        // Milliseconds since session start
  state: 'flow' | 'working' | 'distracted' | 'reset'
}
```

**Ritual Period Recorded as "reset":**

```typescript
// Example timeline with rituals
[
  { start: 0, end: 900000, state: "working" },        // 0-15 min
  { start: 900000, end: 1020000, state: "reset" },    // 15-17 min (Breath Reset)
  { start: 1020000, end: 1800000, state: "flow" },    // 17-30 min
  { start: 1800000, end: 2100000, state: "reset" },   // 30-35 min (Walk Reset)
  { start: 2100000, end: 2700000, state: "working" }  // 35-45 min
]
```

---

### 9.2 Ritual Count in Session Metrics

**Intervention Events Array:**

```typescript
interface InterventionEvent {
  timestamp: number      // Milliseconds since session start
  type: string          // "breath-reset", "walk-reset", "dump-reset"
}
```

**Example Session Record:**

```typescript
{
  sessionId: "session-123",
  interventionEvents: [
    { timestamp: 900000, type: "breath-reset" },
    { timestamp: 1800000, type: "walk-reset" }
  ],
  interventionsUsed: 2,  // Count includes rituals
  // ... other session data
}
```

**Note:** Reset rituals ARE counted as "interventions used" in session summary.

---

### 9.3 Victory Level Impact

Rituals do NOT negatively impact victory level. They are seen as **proactive capacity management**, not failures.

**Victory Calculation (Unaffected by Rituals):**

```typescript
function calculateVictoryLevel(
  plannedMinutes: number,
  actualMinutes: number,
  endReason: string
): 'Legend' | 'Good' | 'Minimum' | 'Missed' {
  if (endReason === 'pulled_away') return 'Missed'
  
  const percentageCompleted = (actualMinutes / plannedMinutes) * 100
  
  if (percentageCompleted >= 100) return 'Legend'
  if (percentageCompleted >= 80) return 'Good'
  if (percentageCompleted >= 60) return 'Minimum'
  return 'Missed'
}
```

Rituals pause session timer, so they don't reduce `actualMinutes`.

---

## 10. Implementation Notes

### 10.1 Ritual State Machine

```plaintext
IDLE (mode: "session")
  ↓
PAUSE_REQUESTED
  ↓
RITUAL_SELECTION (mode: "paused", showResetPanel: true)
  ↓
RITUAL_ACTIVE (activeRitual: "breath" | "walk" | "dump" | "personal")
  ↓
RITUAL_COMPLETE
  ↓
RESUME (mode: "session", showResetPanel: false)
```

---

### 10.2 Edge Cases

**Case 1: User Closes Panel During Ritual**

```typescript
// Panel has "Skip & Resume" button
// If user closes panel mid-ritual:
function handleSkipRitual() {
  setActiveRitual(null)
  setTimeRemaining(0)
  onClose()
  // No bandwidth restoration applied
  // Session resumes immediately
}
```

**Case 2: Multiple Rituals in Quick Succession**

**Allowed:** User can take multiple rituals during one session.

**Example:**

- 10 min: Breath Reset (+5) → Bandwidth: 60
- 25 min: Walk Reset (+7.5) → Bandwidth: 67.5
- 40 min: Dump Reset (+6) → Bandwidth: 73.5


**No cooldown or penalty for multiple rituals.**

---

**Case 3: Ritual During Overtime**

**Behavior:** Rituals work identically during overtime (after session timer reaches 0).

**Overtime nudge** can appear while ritual panel is open, creating potential UI conflict.

**Solution:** Dismiss overtime nudge if ritual panel is active.

---

### 10.3 Testing Recommendations

**Unit Tests:**

```typescript
describe('Ritual Restoration Formulas', () => {
  it('breath reset should add 5 points', () => {
    expect(applyBreathResetRestoration(50)).toBe(55)
  })
  
  it('walk reset should add 7.5 points', () => {
    expect(applyWalkResetRestoration(50)).toBe(57.5)
  })
  
  it('dump reset should add 6 points', () => {
    expect(applyDumpResetRestoration(50)).toBe(56)
  })
  
  it('should cap all rituals at 100', () => {
    expect(applyBreathResetRestoration(98)).toBe(100)
    expect(applyWalkResetRestoration(98)).toBe(100)
    expect(applyDumpResetRestoration(98)).toBe(100)
  })
})
```

---

### 10.4 Future Enhancements

**Guided Breath Exercise:**

- Visual breathing pattern (inhale 4s, hold 4s, exhale 6s)
- Audio cues for breathing rhythm
- Progress through multiple breath cycles


**Walk Suggestions:**

- "Go outside if possible"
- "Walk around your space"
- "Stretch and move your body"


**Dump Reset Prompts:**

- Guided questions to help externalize thoughts
- "What's distracting you?"
- "What can wait until later?"


**Ritual Analytics:**

- Track which rituals are most effective per user
- Suggest optimal ritual based on current state
- Identify patterns (e.g., "You often need Walk Reset after 30 min")


---

**End of Ritual Mechanics Specification**

---

**You can now save this as `documentation/09_ritual_mechanics.md`**

This document provides complete specifications for all reset rituals including restoration formulas, timing logic, UI flows, parking lot integration, intervention relationships, and session impact tracking. All formulas and flows match the current implementation in version 104.