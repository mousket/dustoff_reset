Thought for 1sI'll provide you the complete Calibration Logic documentation as text that you can copy and save manually.

Read calibration formulasRead calibration UI flowRead daily calibration panelHere's the complete **Calibration Logic** documentation as text you can save manually:

---

# **08 - Calibration Logic Specification**

**Version:** 1.0**Last Updated:** January 12, 2026**Purpose:** Complete specification of the daily calibration system including scoring algorithms, UI flow, data persistence, and workday boundary logic for Human Capacity OS.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Calibration Score Calculation](#2-calibration-score-calculation)
3. [Workday Boundary Logic](#3-workday-boundary-logic)
4. [Calibration UI Flow](#4-calibration-ui-flow)
5. [Data Persistence](#5-data-persistence)
6. [Calibration States](#6-calibration-states)
7. [Integration with Session Flow](#7-integration-with-session-flow)
8. [Implementation Notes](#8-implementation-notes)


---

## 1. Overview

### 1.1 Purpose

Daily calibration establishes the **baseline cognitive bandwidth** for each workday by assessing three biological factors:

- **Sleep Recovery** (40 points max)
- **Emotional State** (40 points max)
- **Distraction Awareness** (20 points max)


The calibration score (0-100) serves as the starting bandwidth for all sessions that day.

### 1.2 Philosophy

**Biological Grounding:**

- Human capacity is NOT constant - it varies daily based on recovery, emotional state, and metacognitive awareness
- Forcing someone to pretend they have high capacity when they don't leads to failure and guilt
- Honest self-assessment enables realistic session planning and achievable goals


**Daily Ritual:**

- Calibration happens once per workday (5am boundary, not midnight)
- Forces a moment of self-reflection before diving into work
- Creates awareness of current capacity before making commitments


---

## 2. Calibration Score Calculation

### 2.1 Total Score Formula

```typescript
Total Score = Sleep Score + Emotional Score + Distraction Score

Where:
- Sleep Score: 0-40 points
- Emotional Score: 0-40 points
- Distraction Score: 0-20 points
- Total: 0-100 points
```

---

### 2.2 Sleep Score (40 points max)

#### 2.2.1 Sleep Hours Component (25 points max)

**Formula:**

```typescript
function calculateHoursScore(sleepHours: number): number {
  if (sleepHours >= 7 && sleepHours <= 9) {
    return 25  // Optimal recovery zone
  } else if (sleepHours === 6 || sleepHours === 10) {
    return 20  // Acceptable, slight deficit
  } else if (sleepHours === 5 || sleepHours === 11) {
    return 12  // Suboptimal, significant impact
  } else {
    return 5   // Critical impairment (<5 or >11 hours)
  }
}
```

**Scoring Table:**

| Sleep Hours | Points | Rationale
|-----|-----|-----
| 7-9 hours | 25 | Optimal recovery zone based on sleep research
| 6 or 10 hours | 20 | Acceptable but slightly outside ideal range
| 5 or 11 hours | 12 | Significant cognitive impairment expected
| `<5 or >`11 hours | 5 | Critical sleep deprivation or oversleeping


---

#### 2.2.2 Sleep Quality Component (15 points max)

**Formula:**

```typescript
function calculateQualityScore(sleepQuality: number): number {
  if (sleepQuality >= 8) {
    return 15  // Deep, restorative sleep
  } else if (sleepQuality >= 6) {
    return 10  // Decent sleep, some interruptions
  } else if (sleepQuality >= 4) {
    return 5   // Restless, fragmented sleep
  } else {
    return 2   // Poor, non-restorative sleep
  }
}
```

**Scoring Table:**

| Quality Rating (1-10) | Points | Description
|-----|-----|-----
| 8-10 | 15 | Deep, restorative sleep - woke up refreshed
| 6-7 | 10 | Decent sleep - some interruptions but overall okay
| 4-5 | 5 | Restless, fragmented - tossed and turned
| 1-3 | 2 | Poor quality - didn't feel rested at all


---

#### 2.2.3 Combined Sleep Score

```typescript
function calculateSleepScore(sleepHours: number, sleepQuality: number): number {
  const hoursScore = calculateHoursScore(sleepHours)
  const qualityScore = calculateQualityScore(sleepQuality)
  return hoursScore + qualityScore  // 0-40 points
}
```

**Example Calculations:**

- 8 hours, quality 9/10 → 25 + 15 = **40 points** (perfect sleep)
- 6 hours, quality 7/10 → 20 + 10 = **30 points** (good but short)
- 5 hours, quality 4/10 → 12 + 5 = **17 points** (poor sleep)


---

### 2.3 Emotional Score (40 points max)

#### 2.3.1 Emotional Residue Component (20 points max)

**Definition:** Emotional residue is the lingering stress, anxiety, or psychological burden carried from previous days.

**Formula:**

```typescript
function calculateResidueScore(emotionalResidue: number): number {
  if (emotionalResidue <= 3) {
    return 20  // Clear, no lingering stress
  } else if (emotionalResidue <= 5) {
    return 15  // Mild background stress
  } else if (emotionalResidue <= 7) {
    return 8   // Moderate unresolved tension
  } else {
    return 3   // Heavy emotional burden (8-10)
  }
}
```

**Scoring Table:**

| Residue Level (1-10) | Points | Description
|-----|-----|-----
| 1-3 | 20 | Clear mind, no lingering emotional weight
| 4-5 | 15 | Mild background stress, manageable
| 6-7 | 8 | Moderate unresolved tension, noticeable drag
| 8-10 | 3 | Heavy emotional burden, significant impact


**Note:** This is an **inverted scale** - higher residue = lower capacity.

---

#### 2.3.2 Emotional State Component (20 points max)

**Definition:** Current emotional state at the moment of calibration.

**Formula:**

```typescript
function calculateStateScore(emotionalState: string): number {
  const stateScores: Record<string, number> = {
    'Energized': 20,  // High energy, motivated
    'Focused': 18,    // Clear-minded, ready to work
    'Calm': 15,       // Balanced, centered, peaceful
    'Tired': 8,       // Low energy, fatigued
    'Anxious': 5,     // Worried, nervous, tense
    'Scattered': 3    // Distracted, unfocused, chaotic
  }
  return stateScores[emotionalState] || 10  // Default fallback
}
```

**Scoring Table:**

| Emotional State | Points | Description
|-----|-----|-----
| Energized | 20 | High energy, motivated, ready to tackle challenges
| Focused | 18 | Clear-minded, sharp, ready for deep work
| Calm | 15 | Balanced, centered, peaceful
| Tired | 8 | Low energy, fatigued, sluggish
| Anxious | 5 | Worried, nervous, tense
| Scattered | 3 | Distracted, unfocused, chaotic thinking


---

#### 2.3.3 Combined Emotional Score

```typescript
function calculateEmotionalScore(
  emotionalResidue: number, 
  emotionalState: string
): number {
  const residueScore = calculateResidueScore(emotionalResidue)
  const stateScore = calculateStateScore(emotionalState)
  return residueScore + stateScore  // 0-40 points
}
```

**Example Calculations:**

- Residue 2, State "Energized" → 20 + 20 = **40 points** (optimal emotional state)
- Residue 5, State "Focused" → 15 + 18 = **33 points** (good but some baggage)
- Residue 8, State "Anxious" → 3 + 5 = **8 points** (struggling emotionally)


---

### 2.4 Distraction Awareness Score (20 points max)

**Definition:** Metacognitive awareness of potential distraction vectors for the day.

**Philosophy:**

- Identifying distractions = awareness = higher capacity
- NOT identifying distractions = blind spots = lower capacity
- Too many distractions (5-6) = overwhelmed = lowest capacity


**Formula:**

```typescript
function calculateDistractionScore(distractions: string[]): number {
  const count = distractions.length
  
  if (count === 0) {
    return 20  // Clear awareness, nothing identified
  } else if (count === 1) {
    return 16  // High awareness, one known vector
  } else if (count === 2) {
    return 12  // Moderate awareness
  } else if (count === 3) {
    return 8   // Some awareness
  } else if (count === 4) {
    return 5   // Low awareness, many vectors
  } else {
    return 2   // Overwhelmed (5-6 distractions)
  }
}
```

**Scoring Table:**

| Distractions Identified | Points | Reasoning
|-----|-----|-----
| 0 distractions | 20 | Clear day, no known distraction vectors
| 1 distraction | 16 | High awareness, one known challenge
| 2 distractions | 12 | Moderate awareness, manageable
| 3 distractions | 8 | Some awareness, getting complex
| 4 distractions | 5 | Low awareness, many competing demands
| 5-6 distractions | 2 | Overwhelmed, too many vectors to manage


**Distraction Options:**

- Email
- Slack
- Social Media
- Meetings
- Phone Calls
- Other Tasks


---

### 2.5 Complete Calibration Formula

```typescript
interface CalibrationData {
  sleepHours: number              // 3-12 hours
  sleepQuality: number            // 1-10 scale
  emotionalResidue: number        // 1-10 scale (inverted)
  emotionalState: string          // 'Energized' | 'Focused' | 'Calm' | 'Tired' | 'Anxious' | 'Scattered'
  distractions: string[]          // Array of distraction types
}

interface CalibrationScore {
  sleepScore: number              // 0-40
  emotionalScore: number          // 0-40
  distractionScore: number        // 0-20
  totalScore: number              // 0-100
  timestamp: number               // Milliseconds since epoch
}

function calculateCalibrationScore(data: CalibrationData): CalibrationScore {
  const sleepScore = calculateSleepScore(data.sleepHours, data.sleepQuality)
  const emotionalScore = calculateEmotionalScore(data.emotionalResidue, data.emotionalState)
  const distractionScore = calculateDistractionScore(data.distractions)
  const totalScore = sleepScore + emotionalScore + distractionScore
  
  return {
    sleepScore,
    emotionalScore,
    distractionScore,
    totalScore,
    timestamp: Date.now()
  }
}
```

**Example Full Calculation:**

```typescript
const calibrationData = {
  sleepHours: 7.5,
  sleepQuality: 8,
  emotionalResidue: 3,
  emotionalState: 'Focused',
  distractions: ['Email', 'Meetings']
}

const result = calculateCalibrationScore(calibrationData)
// sleepScore: 25 + 15 = 40
// emotionalScore: 20 + 18 = 38
// distractionScore: 12 (2 distractions)
// totalScore: 40 + 38 + 12 = 90
```

---

## 3. Workday Boundary Logic

### 3.1 The 5am Rule

**Philosophy:** The workday starts at 5am, not midnight.

**Rationale:**

- Late-night work sessions (2am-4am) belong to the previous workday
- Prevents awkward recalibration prompts at 2am
- Calibration remains valid until 5am, then expires
- Aligns with biological circadian rhythms


---

### 3.2 Workday Date Calculation

**Formula:**

```typescript
function calculateWorkdayDate(): string {
  const now = new Date()
  const hour = now.getHours()
  
  // If before 5am, use yesterday's date
  if (hour < 5) {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split('T')[0]  // YYYY-MM-DD
  }
  
  // 5am or later, use today's date
  return now.toISOString().split('T')[0]  // YYYY-MM-DD
}
```

**Example Timeline:**

```plaintext
Date: January 12, 2026

2:00am - calculateWorkdayDate() → "2026-01-11" (previous day)
4:59am - calculateWorkdayDate() → "2026-01-11" (previous day)
5:00am - calculateWorkdayDate() → "2026-01-12" (current day)
11:00pm - calculateWorkdayDate() → "2026-01-12" (current day)
```

---

### 3.3 Calibration Expiry Logic

**Rule:** Calibration expires when the workday date changes.

**Implementation:**

```typescript
function isCalibrationExpired(calibrationDate: string): boolean {
  const currentWorkdayDate = calculateWorkdayDate()
  return calibrationDate !== currentWorkdayDate
}
```

**Example:**

```plaintext
Calibrated on: 2026-01-12 at 8:00am
Current time: 2026-01-12 at 11:00pm → Not expired (same workday)
Current time: 2026-01-13 at 4:00am → Not expired (still previous workday)
Current time: 2026-01-13 at 5:01am → EXPIRED (new workday started)
```

---

## 4. Calibration UI Flow

### 4.1 Calibration Ceremony (First-Time Onboarding)

**Screens:**

**Screen 0: Welcome**

- Ritual glyph animation
- "Welcome to Your Daily Calibration"
- Explanation of why calibration matters
- "Begin Calibration" button


**Screen 1: Sleep Hours**

- "How many hours did you sleep last night?"
- Slider: 3-12 hours
- Visual: Animated sleep icon


**Screen 2: Sleep Quality**

- "How would you rate your sleep quality?"
- Slider: 1-10
- Visual feedback: Poor → Excellent


**Screen 3: Emotional Residue**

- "How much emotional baggage are you carrying?"
- Slider: 1-10 (inverted - high = heavy)
- Visual feedback: Light → Heavy


**Screen 4: Emotional State**

- "How are you feeling right now?"
- 6 buttons: Energized, Focused, Calm, Tired, Anxious, Scattered
- Multi-select disabled (choose one)


**Screen 5: Distraction Awareness**

- "What might distract you today?"
- 6 buttons: Email, Slack, Social Media, Meetings, Phone Calls, Other Tasks
- Multi-select enabled (choose 0-6)


**Screen 6: Score Reveal**

- Animated score counting up from 0 to total
- Breakdown: Sleep (X/40), Emotional (X/40), Distraction (X/20)
- "Your Starting Bandwidth: X/100"
- "Begin Your Day" button


---

### 4.2 Daily Calibration Panel (Quick Recalibration)

**Compact 4-Step Flow:**

**Step 1: Sleep**

- Sleep hours slider (3-12)
- Sleep quality slider (1-10)
- Combined in one step for speed


**Step 2: Emotional Residue**

- "How much emotional baggage?" (1-10 slider)
- Inverted scale explanation text


**Step 3: Emotional State**

- 6 state buttons in 2x3 grid
- Single selection


**Step 4: Distractions**

- 6 distraction buttons in 2x3 grid
- Multi-selection (0-6)


**Footer Navigation:**

- "Back" button (visible steps 2-4)
- "Next" button (steps 1-3)
- "Complete Calibration" button (step 4)


---

### 4.3 HUD Calibration Display

**Format:**

```plaintext
Calibrate today    [Text changes color based on state]
```

**Color States:**

**Green (Calibrated Today):**

```typescript
className="text-emerald-400"
```

**Red (Not Calibrated):**

```typescript
className="text-red-400"
```

**Yellow (Expired):**

```typescript
className="text-amber-400"
```

**Logic:**

```typescript
function getCalibrationDisplayColor(
  calibrationDate: string | null
): 'green' | 'red' | 'yellow' {
  if (!calibrationDate) return 'red'  // Never calibrated
  
  const currentWorkday = calculateWorkdayDate()
  if (calibrationDate === currentWorkday) {
    return 'green'  // Calibrated today
  }
  return 'yellow'  // Expired (old calibration)
}
```

---

## 5. Data Persistence

### 5.1 Storage Structure

**Browser (localStorage):**

```typescript
interface StoredCalibration {
  date: string                    // YYYY-MM-DD (workday adjusted)
  calibrationScore: number        // 0-100
  calibrationData: {
    sleepHours: number
    sleepQuality: number
    emotionalResidue: number
    emotionalState: string
    distractions: string[]
  }
  timestamp: number               // Milliseconds since epoch
}

// Key: "hcos_calibration_data"
localStorage.setItem('hcos_calibration_data', JSON.stringify(calibration))
```

**Tauri (SQLite or JSON file):**

```sql
CREATE TABLE calibrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    calibration_score REAL NOT NULL,
    sleep_hours REAL NOT NULL,
    sleep_quality INTEGER NOT NULL,
    emotional_residue INTEGER NOT NULL,
    emotional_state TEXT NOT NULL,
    distractions TEXT,  -- JSON array
    timestamp INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

### 5.2 Save Operation

```typescript
function saveCalibration(data: CalibrationData): void {
  const score = calculateCalibrationScore(data)
  const workdayDate = calculateWorkdayDate()
  
  const calibration: StoredCalibration = {
    date: workdayDate,
    calibrationScore: score.totalScore,
    calibrationData: data,
    timestamp: score.timestamp
  }
  
  localStorage.setItem('hcos_calibration_data', JSON.stringify(calibration))
}
```

---

### 5.3 Load Operation

```typescript
function loadCalibration(): StoredCalibration | null {
  const stored = localStorage.getItem('hcos_calibration_data')
  if (!stored) return null
  
  const calibration = JSON.parse(stored) as StoredCalibration
  
  // Check if expired
  if (isCalibrationExpired(calibration.date)) {
    return null  // Treat expired as non-existent
  }
  
  return calibration
}
```

---

### 5.4 Clear Operation (Demo/Reset)

```typescript
function clearCalibration(): void {
  localStorage.removeItem('hcos_calibration_data')
}
```

---

## 6. Calibration States

### 6.1 State Machine

```typescript
type CalibrationState =
  | 'not_calibrated'      // No calibration exists
  | 'calibrated_today'    // Valid calibration for current workday
  | 'expired'             // Calibration exists but for previous workday
```

**State Determination:**

```typescript
function getCalibrationState(): CalibrationState {
  const calibration = loadCalibration()
  
  if (!calibration) {
    return 'not_calibrated'
  }
  
  const currentWorkday = calculateWorkdayDate()
  if (calibration.date === currentWorkday) {
    return 'calibrated_today'
  }
  
  return 'expired'
}
```

---

### 6.2 State Transitions

```plaintext
┌─────────────────┐
│ not_calibrated  │
└────────┬────────┘
         │ User completes calibration
         ▼
┌─────────────────┐
│ calibrated_today│
└────────┬────────┘
         │ 5am boundary crossed
         ▼
┌─────────────────┐
│    expired      │
└────────┬────────┘
         │ User recalibrates
         ▼
┌─────────────────┐
│ calibrated_today│
└─────────────────┘
```

---

## 7. Integration with Session Flow

### 7.1 Pre-Session Flow Check

**Before starting a session:**

```typescript
function checkCalibrationBeforeSession(): boolean {
  const state = getCalibrationState()
  
  if (state === 'not_calibrated' || state === 'expired') {
    // Show calibration panel
    showDailyCalibrationPanel()
    return false  // Block session start
  }
  
  // Calibrated - proceed to session
  return true
}
```

---

### 7.2 Starting Bandwidth

**Session bandwidth initialization:**

```typescript
function getStartingBandwidth(): number {
  const calibration = loadCalibration()
  
  if (!calibration) {
    return 70  // Default fallback if somehow bypassed
  }
  
  return calibration.calibrationScore  // 0-100
}
```

---

### 7.3 HUD Display Integration

**In FloatingHUD:**

```typescript
const calibrationState = getCalibrationState()
const calibrationColor = calibrationState === 'calibrated_today' 
  ? 'text-emerald-400' 
  : 'text-red-400'

<button 
  onClick={openDailyCalibrationPanel}
  className={calibrationColor}
>
  Calibrate today
</button>
```

---

## 8. Implementation Notes

### 8.1 Edge Cases

**Case 1: Calibration at 4:59am**

- User calibrates at 4:59am
- Date saved: Previous day (e.g., "2026-01-11")
- At 5:00am, calibration expires
- User must recalibrate


**Solution:** Warn user if calibrating between 4:00am-4:59am

---

**Case 2: Multiple Calibrations Same Day**

- User calibrates at 8am (score: 85)
- User recalibrates at 2pm (score: 70)
- Which score is used?


**Solution:** Latest calibration overwrites previous. Storage key is date-based, so only one calibration per workday.

---

**Case 3: Session Started Without Calibration**

- User bypasses calibration somehow
- Session bandwidth defaults to 70


**Solution:** Always check calibration before allowing pre-session panel to proceed.

---

### 8.2 Timezone Handling

**Always use local timezone:**

```typescript
const now = new Date()  // Local time, not UTC
const hour = now.getHours()  // Local hour, not UTC hour
```

**Never use UTC for workday calculations:**

```typescript
// ❌ WRONG
const now = new Date()
const utcHour = now.getUTCHours()

// ✅ CORRECT
const now = new Date()
const localHour = now.getHours()
```

---

### 8.3 Testing Recommendations

**Unit Tests:**

```typescript
describe('calculateCalibrationScore', () => {
  it('should return perfect score for optimal inputs', () => {
    const data = {
      sleepHours: 8,
      sleepQuality: 10,
      emotionalResidue: 1,
      emotionalState: 'Energized',
      distractions: []
    }
    const result = calculateCalibrationScore(data)
    expect(result.totalScore).toBe(100)
  })
  
  it('should return minimum score for worst inputs', () => {
    const data = {
      sleepHours: 3,
      sleepQuality: 1,
      emotionalResidue: 10,
      emotionalState: 'Scattered',
      distractions: ['Email', 'Slack', 'Social Media', 'Meetings', 'Phone Calls', 'Other Tasks']
    }
    const result = calculateCalibrationScore(data)
    expect(result.totalScore).toBe(12)  // 5+2 + 3+3 + 2
  })
})
```

---

### 8.4 Future Enhancements

**Calibration History:**

- Track calibration scores over 7/30/90 days
- Show trends and patterns
- Identify optimal days/conditions


**Predictive Calibration:**

- ML model learns user's patterns
- Pre-fills calibration inputs based on historical data
- User confirms or adjusts


**Wearable Integration:**

- Import sleep data from Apple Watch/Oura Ring
- Auto-populate sleep hours and quality
- User only answers emotional/distraction questions


---

**End of Calibration Logic Specification**

---

**You can now save this as `documentation/08_calibration_logic.md`**

This document provides complete specifications for the daily calibration system including all scoring algorithms, workday boundary logic, UI flows, data persistence patterns, and integration points with the session lifecycle. All formulas match the current implementation in version 104.