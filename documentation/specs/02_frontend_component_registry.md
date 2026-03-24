# Frontend Component Registry
**Priority**: HIGH  
**Last Updated**: 2026-01-12  
**Migration Status**: ⏳ Pending Desktop Implementation

---

## Overview

This document provides a complete inventory of all React components in the HumanCapacityOS web application, including their props interfaces, state management patterns, event handlers, and dependencies. This registry serves as the authoritative reference for migrating components to the Tauri desktop architecture.

---

## Component Hierarchy

```
App Root
├── DraggableContainer (HUD Container)
│   ├── FloatingHUD (Main HUD)
│   ├── DailyCalibrationPanel (conditional)
│   ├── InterventionOverlay (conditional)
│   ├── FlowCelebrationOverlay (conditional)
│   ├── MidSessionIntelligenceTestPanel (conditional)
│   ├── ParkingLotManagementPanel (conditional)
│   ├── PreSessionPanel (conditional)
│   ├── ResetPanel (conditional)
│   ├── PostSessionSummaryPanel (conditional)
│   ├── SessionReflectionPanel (conditional)
│   └── ParkingLotHarvestPanel (conditional)
│
├── Modals (Full-Screen Overlays)
│   ├── InterruptedSessionModal
│   ├── EndSessionModal
│   └── OvertimeNudgeToast
│
└── CalibrationCeremony (Standalone Flow)
    ├── Screen0_TimeAwareIntro
    ├── Screen1_HumanBandwidth
    ├── Screen2_SleepTracking
    ├── Screen3_EmotionalState
    ├── Screen4_DistractionsHurdles
    ├── Screen5_Intention
    └── Screen6_Completion
```

---

## 1. Core HUD Components

### 1.1 FloatingHUD

**Location**: `/features/desktop/hud/FloatingHUD/index.tsx`  
**Purpose**: Primary always-visible HUD displaying bandwidth score, session status, and quick actions

#### Props Interface
```typescript
interface FloatingHUDProps {
  // Display State
  demo?: boolean
  isCalibratedToday: boolean
  bandwidthScore: number | null // 0-100 or null if not calibrated
  estimatedDelta?: number // +/- bandwidth change estimate
  
  // Session State
  mode: HUDMode // "idle" | "session" | "paused" | "not-calibrated" | "estimated" | "break"
  sessionMode?: SessionMode // "Zen" | "Flow" | "Legend"
  sessionTime?: number // elapsed time in seconds
  timeRemaining?: number // remaining session time in seconds
  isInFlow?: boolean // persistent flow state indicator
  
  // Event Handlers
  onStartCalibration: () => void
  onStartSession: () => void
  onPauseSession?: () => void
  onResumeSession?: () => void
  onStopSession?: () => void
  onOpenParkingLot: () => void
  onOpenHistory: () => void
  onOpenSettings: () => void
}
```

#### Internal State
```typescript
interface HUDState {
  isExpanded: boolean // hover expansion state
  showTooltip: boolean // bandwidth tooltip visibility
}
```

#### Visual Features
- **Bandwidth Display**: Color-coded score with dynamic glow effects
  - 80-100: emerald-400 (excellent)
  - 60-79: cyan-400 (good)
  - 40-59: amber-400 (moderate)
  - 0-39: red-400 (low)
- **Session Timer**: MM:SS format with remaining time
- **Flow Indicator**: Persistent particle animation when in flow state
- **Mode-Specific Styling**:
  - Zen: emerald-500 accents, subtle animations
  - Flow: cyan-500 accents, medium animations
  - Legend: red-500/amber-500 accents, intense animations

#### Key Behaviors
- Auto-centers when panels open (via DraggableContainer)
- Displays "Not Calibrated" state with pulse animation
- Quick action buttons appear on hover in idle mode
- Session controls visible during active sessions

---

### 1.2 DraggableContainer

**Location**: `/features/desktop/hud/DraggableContainer/index.tsx`  
**Purpose**: Wrapper component providing drag functionality and auto-positioning for HUD and panels

#### Props Interface
```typescript
interface DraggableContainerProps {
  children: ReactNode
  initialX?: number // initial X position (defaults to right edge - 340px)
  initialY?: number // initial Y position (defaults to 20px from top)
  hasPanel?: boolean // enables panel dragging behavior
  onPositionChange?: (position: { x: number; y: number }) => void
}
```

#### Internal State
```typescript
interface DraggableState {
  position: { x: number; y: number }
  isDragging: boolean
  dragOffset: { x: number; y: number }
  hasBeenManuallyMoved: boolean
}
```

#### Key Features
- **Edge Constraints**: Maintains 60px margin from screen edges
- **Auto-Centering**: Centers HUD when container width > 800px (panels open)
- **Drag Prevention**: Ignores drag on buttons, inputs, textareas, selects, links
- **Resize Observer**: Automatically adjusts position on window resize
- **Smooth Transitions**: Animated repositioning when not manually moved

#### Drag Logic
1. User clicks outside interactive elements
2. Records drag offset from container origin
3. Updates position on mouse move with edge constraints
4. Sets `hasBeenManuallyMoved` flag on mouse up
5. Disables auto-centering after manual move

---

## 2. Session Management Panels

### 2.1 PreSessionPanel

**Location**: `/features/desktop/panels/PreSessionPanel/index.tsx`  
**Purpose**: 6-step pre-session configuration flow before starting a session

#### Props Interface
```typescript
interface PreSessionPanelProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: PreSessionData) => void
}

interface PreSessionData {
  sessionType: "deep" | "parking-lot" | "administrative"
  selectedParkingLotItems?: string[] // IDs of items to work on
  intention: string // session goal (required except parking-lot)
  mode: "Zen" | "Flow" | "Legend"
  duration: number // 15, 30, 50, or 90 minutes
  whitelistedApps: string[]
  whitelistedBrowser: string
  whitelistedTabs: string[]
  systemChecksComplete: boolean
  emotionalGrounding: number // 1-5 scale
  preparationMinutes: number // time spent preparing
  preparationChecklist: string[] // completed prep tasks
}
```

#### 6-Step Flow
1. **Session Type Selection**
   - Deep Work (intentional focus session)
   - Parking Lot (work on captured items)
   - Administrative (quick tasks)

2. **Intention + Mode + Duration**
   - Intention input (free text, required for deep/admin)
   - Mode selector: Zen (gentle), Flow (balanced), Legend (intense)
   - Duration buttons: 15, 30, 50, 90 minutes

3. **Application Whitelist**
   - Quick suggestions: Chrome, VSCode, Notion, Slack, etc.
   - Custom app input
   - Max 5 apps

4. **Browser & Tab Whitelist**
   - Browser selection (Chrome, Safari, Firefox, Edge, Arc)
   - Tab URL input (domain extraction)
   - Required: at least 1 tab if browser selected

5. **Preparation Ritual**
   - System checks: Water, Phone away, Notifications off, Desk clean
   - Emotional grounding slider (1-5)
   - Countdown timer before session start

6. **Parking Lot Items** (conditional, only for parking-lot sessions)
   - Displays items with status "PENDING" (marked for next session)
   - Multi-select up to 3 items
   - Shows item text, timestamp, category, tags

#### Validation Rules
- Intention required (except parking-lot sessions)
- At least 1 whitelisted tab when browser selected
- System checks must be complete before proceeding
- Max 3 parking lot items per session

#### Dependencies
- `lib/parking-lot-storage.ts`: getActiveParkingLotItems(), getPendingParkingLotItems()
- `components/animations/TimerHalo.tsx`: Preparation countdown animation

---

### 2.2 PostSessionSummaryPanel

**Location**: `/features/desktop/panels/PostSessionSummaryPanel/index.tsx`  
**Purpose**: Display "Game Tape" summary of completed session with metrics and timeline

#### Props Interface
```typescript
interface PostSessionSummaryPanelProps {
  isOpen: boolean
  session: SessionRecord | null
  onContinueToReflection: () => void
  onDone: () => void
}

// SessionRecord defined in lib/session-storage.ts
interface SessionRecord {
  id: string
  mode: "Zen" | "Flow" | "Legend"
  actualDurationMinutes: number
  flowEfficiency: number // 0-100
  longestStreakMinutes: number
  distractionAttempts: number
  interventionsUsed: number
  victoryLevel: string // e.g., "B", "A+", "S"
  timelineBlocks: Array<{
    state: "flow" | "working" | "distracted" | "reset"
    start: number // minutes
    end: number // minutes
  }>
  // ... other session data
}
```

#### Display Sections
1. **Timeline Visualization**
   - Horizontal bar chart of session timeline
   - Color-coded blocks:
     - Flow: emerald-500
     - Working: cyan-600
     - Distracted: red-500
     - Reset: slate-600
   - Proportional width based on time duration
   - Hover tooltips with state and time range

2. **Metrics Grid** (3 columns, 2 rows)
   - **Flow Efficiency**: % of session in flow/working state
   - **Longest Streak**: Maximum continuous focus time in minutes
   - **Distractions**: Count of distraction attempts (clickable for details)
   - **Interventions**: Count of interventions triggered (clickable for details)
   - **Victory Badge**: Session grade + mode indicator (spans 2 columns)

3. **Action Buttons**
   - Skip Reflection → closes panel
   - Continue → navigates to SessionReflectionPanel

#### Mode-Specific Colors
- Zen: emerald-500
- Flow: cyan-500
- Legend: red-500

---

### 2.3 SessionReflectionPanel

**Location**: `/features/desktop/panels/SessionReflectionPanel/index.tsx`  
**Purpose**: Structured post-session reflection (Debrief) with 2-3 questions

#### Props Interface
```typescript
interface SessionReflectionPanelProps {
  session: SessionRecord | null
  onSave: (reflection: ReflectionObject) => void
  onSkip: () => void
}

interface ReflectionObject {
  sessionId: string
  whatWentWell: string // Q1 response
  frictionNotes?: string // Q2 response (conditional)
  closingEnergy: number // 1-5 scale
  skipped: boolean
  createdAt: string // ISO timestamp
}
```

#### Internal State
```typescript
interface ReflectionState {
  whatWentWell: string
  frictionNotes: string
  closingEnergy: number // defaults to 3
  expandedSections: Record<string, boolean> // section toggle states
}
```

#### Reflection Questions
1. **Q1 (Always Shown)**: "What went well this session?"
   - Free text input
   - Auto-focus on mount
   - Prompts: "What worked? What surprised you? What would you repeat?"

2. **Q2 (Conditional)**: "What was the friction?"
   - Only shown if `session.flowEfficiency < 60%`
   - Amber-colored section (warning indicator)
   - Context: "Your flow efficiency was {X}%. What made it hard to stay focused?"
   - Prompts: "Distractions, interruptions, unclear goals, fatigue..."

3. **Q2/Q3**: "How's your closing energy?"
   - 5-button emoji selector:
     - 1: 😫 Drained
     - 2: 😐 Meh
     - 3: 😊 Okay (default)
     - 4: 😄 Energized
     - 5: 🔥 Fire

#### Expandable Sections
- Each question is collapsible accordion
- Default: Q1 expanded, Q2/Q3 collapsed
- Click header to toggle

#### Validation
- Q1 (whatWentWell) required for save
- Skip bypasses all validation

---

### 2.4 ParkingLotHarvestPanel

**Location**: `/features/desktop/panels/ParkingLotHarvestPanel/index.tsx`  
**Purpose**: Categorize and decide actions for parking lot items captured during session

#### Props Interface
```typescript
interface ParkingLotHarvestPanelProps {
  isOpen: boolean
  items: ParkingLotItemFull[] // items to harvest
  onComplete: (harvestedItems: Array<{
    id: string
    category: "task" | "idea" | "reminder" | "distraction"
    tags: string[]
    action: "next-session" | "keep" | "delete"
  }>) => void
  onSkip: () => void
}
```

#### Internal State
```typescript
interface HarvestState {
  harvestData: Record<string, {
    category: "task" | "idea" | "reminder" | "distraction"
    tags: string[]
    action: "next-session" | "keep" | "delete"
  }>
  copiedId: string | null // for copy-to-clipboard feedback
}
```

#### Per-Item Controls
1. **Category Selector** (4 options, single-select)
   - Task (default)
   - Idea
   - Reminder
   - Distraction

2. **Tags** (multi-select)
   - Available: urgent, follow-up, research, creative, admin, personal
   - Unlimited selection
   - Tag badges toggle on/off

3. **Action Selector** (3 options, single-select)
   - **Add to Next Session**: Auto-appears in next pre-session flow (status: PENDING)
   - **Keep in List**: Available for manual selection (status: OPEN)
   - **Delete**: Permanently removed (status: DELETED)

4. **Copy Button**
   - Copies item text to clipboard
   - Shows checkmark on success

#### Action Behaviors
| Action | Status | Next Session Behavior |
|--------|--------|----------------------|
| next-session | PENDING | Auto-shown in PreSessionPanel step 6 |
| keep | OPEN | Available in ParkingLotManagementPanel |
| delete | DELETED | Removed from all lists |

#### Dependencies
- `lib/parking-lot-storage.ts`: updateParkingLotItemHarvestAction()

---

### 2.5 ResetPanel

**Location**: `/features/desktop/panels/ResetPanel/index.tsx`  
**Purpose**: Mid-session reset ritual selection and countdown

#### Props Interface
```typescript
interface ResetPanelProps {
  isOpen: boolean
  onClose: () => void
  onSelectRitual: (ritualType: RitualType) => void
  sessionMode?: SessionMode
}

type RitualType = "breath" | "walk" | "dump" | "personal"
```

#### Internal State
```typescript
interface ResetState {
  activeRitual: RitualType | null
  timeRemaining: number // countdown in seconds
}
```

#### Available Rituals
| Ritual | Duration | Description |
|--------|----------|-------------|
| Breath Reset | 2 min | Ground yourself with breathing |
| Walk Reset | 5 min | Take a short walk |
| Dump Reset | 3 min | Write down your thoughts |
| Personal | 4 min | Conversation, bathroom break |

#### Two Views
1. **Selection View**
   - 2x2 grid of ritual cards
   - Shows name, description, duration
   - Cancel button

2. **Active View**
   - Ritual name and description
   - Countdown timer (MM:SS format)
   - TimerHalo animation (wave-ripple variant, emerald color)
   - Skip & Resume button
   - Auto-closes on completion

#### Timer Behavior
- Counts down from ritual duration to 0
- Updates every 1 second
- Auto-closes and calls `onClose()` when timer reaches 0

#### Dependencies
- `components/animations/TimerHalo.tsx`: Wave ripple animation

---

## 3. Overlay Components

### 3.1 InterventionOverlay

**Location**: `/features/desktop/overlays/InterventionOverlay/index.tsx`  
**Purpose**: Display context-sensitive interventions during sessions

#### Props Interface
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

type InterventionType = "friction" | "focus-slipping" | "non-whitelisted-app" | "tab-switch"
type SessionMode = "Zen" | "Flow" | "Legend"
```

#### Intervention Types × Modes Matrix

| Type | Zen | Flow | Legend |
|------|-----|------|--------|
| **friction** | "Take a moment to breathe" | "Pause and reset your focus" | "STOP NOW AND RESET" |
| **focus-slipping** | "Don't let yourself be distracted" | "Don't let yourself be distracted" | "DON'T LET YOURSELF BE DISTRACTED" |
| **non-whitelisted-app** | "Reserve your energy" | "Reserve your energy" | "RESERVE YOUR ENERGY" |
| **tab-switch** | "One tab at a time" | "One tab at a time" | "ONE TAB AT A TIME" |

#### Mode-Specific Rendering

**Zen Mode**:
- Width: 70% of container
- Border: emerald-500/50
- Glow: emerald shadow
- Layout: Inline panel, slides from right
- Auto-dismiss: 10 seconds
- Progress bar: emerald

**Flow Mode**:
- Width: 100%
- Border: cyan-500/50
- Glow: cyan shadow
- Layout: Inline panel, slides from left
- Animation: Two-stage (exploding → moving)
- Auto-dismiss: 10 seconds (after animation)
- Progress bar: cyan

**Legend Mode**:
- Full-screen modal overlay
- Border: red-500/50
- Glow: intense red pulsing shadow
- Background: Black/60% with gradient backdrop
- Auto-dismiss: 10 seconds
- Progress bar: red with glow

#### Auto-Dismiss Logic
1. **Regular Modes (Zen)**: 10 seconds from open
2. **Flow Mode**: 
   - Stage 1: Exploding animation (1 second)
   - Stage 2: Moving animation (1 second)
   - Countdown: 10 seconds
   - Total: 12 seconds
3. **Legend Mode**: 10 seconds

#### Button Actions
- Primary button: calls `onAction` or `onDismiss`
- Secondary button: calls `onDismiss`

---

### 3.2 FlowCelebrationOverlay

**Location**: `/features/desktop/overlays/FlowCelebrationOverlay/index.tsx`  
**Purpose**: Celebrate flow state achievement and extend session by 5 minutes

#### Props Interface
```typescript
interface FlowCelebrationOverlayProps {
  isOpen: boolean
  mode: FlowCelebrationMode // "Zen" | "Flow" | "Legend"
  onDismiss: () => void
}
```

#### Mode Messages
| Mode | Title | Message |
|------|-------|---------|
| Zen | "Beautiful Work" | "You've been in sustained focus for a while now. We're extending your session by 5 minutes to honor this flow state." |
| Flow | "Flow State Achieved" | "Exceptional focus detected. Your cognitive bandwidth is peaking. Session extended by 5 minutes. Keep going." |
| Legend | "PEAK PERFORMANCE" | "You're operating at maximum cognitive capacity. This is legendary work. Session extended 5 minutes. Finish strong." |

#### Visual Elements
- Pulsing circle animation (mode-specific color)
- Border and glow effects
- +5 minutes indicator
- Close button (X)

#### Auto-Dismiss
- Timer: 300 seconds (5 minutes)
- Triggers `onDismiss()` after duration

#### Mode Colors
- Zen: emerald-500
- Flow: cyan-500
- Legend: amber-500 to red-500 gradient

---

### 3.3 OvertimeNudgeToast

**Location**: `/features/desktop/overlays/OvertimeNudgeToast/index.tsx`  
**Purpose**: Notify user when session exceeds planned duration

#### Props Interface
```typescript
interface OvertimeNudgeToastProps {
  isOpen: boolean
  overtimeMinutes: number // minutes over planned duration
  onFinishSession: () => void
  onExtend: () => void
  onDismiss: () => void
}
```

#### Display
- Position: Bottom-right corner (toast notification)
- Border: amber-500/50
- Glow: amber shadow
- Message: "You're {X} minutes over. Time to wrap up or extend?"

#### Button Actions
1. **End Session**: calls `onFinishSession()` → triggers end session flow
2. **Keep Going**: calls `onExtend()` → adds 5 minutes to session
3. **Dismiss**: calls `onDismiss()` → closes toast

#### Trigger Conditions
- Session status: completed (timer reached 0)
- Session not manually ended
- 5 minutes elapsed since session completion

---

## 4. Modal Components

### 4.1 InterruptedSessionModal

**Location**: `/features/desktop/modals/InterruptedSessionModal/index.tsx`  
**Purpose**: Handle recovery of interrupted sessions (e.g., browser crash, refresh)

#### Props Interface
```typescript
interface InterruptedSessionModalProps {
  isOpen: boolean
  sessionData: RecoveryData | null
  sessionStartTime: number // timestamp in ms
  elapsedMinutes: number
  duration: number // planned duration in minutes
  onContinue: () => void
  onDiscard: () => void
  onRestart: () => void
}

interface RecoveryData {
  mode: SessionMode
  startTime: number
  duration: number
  intention: string
  sessionType: string
  whitelistedApps: string[]
  whitelistedTabs: string[]
  // ... other session config
}
```

#### Display Information
- Session mode badge (Zen/Flow/Legend with color)
- Planned duration: "25 minutes"
- Elapsed time: "12 min"
- Intention text
- Session type

#### Action Buttons
1. **Continue Session**: Resumes session with recovered state
2. **Discard & Start Fresh**: Clears recovery data, returns to idle
3. **Restart Session**: Clears recovery data, opens PreSessionPanel

#### Trigger Conditions
- Recovery data exists in localStorage (`session_recovery`)
- User opens app after interruption (crash, refresh, close)

#### Dependencies
- `lib/session-storage.ts`: getRecoveryData(), clearRecoveryData(), saveRecoveryData()

---

### 4.2 EndSessionModal

**Location**: `/features/desktop/modals/EndSessionModal/index.tsx`  
**Purpose**: Confirm session end and capture end reason

#### Props Interface
```typescript
interface EndSessionModalProps {
  isOpen: boolean
  onConfirm: (reason: EndReason) => void
  onCancel: () => void
}

type EndReason = 
  | "completed" 
  | "early-stop" 
  | "interruption" 
  | "emergency"
```

#### Display
- Title: "End Session?"
- End reason selector (radio buttons)
- Optional notes textarea

#### End Reasons
1. **Completed**: Session finished as planned
2. **Stopping Early**: Intentionally ending before planned duration
3. **Interruption**: External interruption forced end
4. **Emergency**: Unexpected urgent matter

#### Validation
- End reason required
- Notes optional

---

## 5. Management Panels

### 5.1 ParkingLotManagementPanel

**Location**: `/features/desktop/panels/ParkingLotManagementPanel/index.tsx`  
**Purpose**: CRUD operations for parking lot items outside of sessions

#### Props Interface
```typescript
interface ParkingLotManagementPanelProps {
  isOpen: boolean
  onClose: () => void
  onItemsChange?: (action?: {
    action: string
    id?: string
    text?: string
  }) => void
}
```

#### Internal State
```typescript
interface ManagementState {
  items: ParkingLotItemFull[]
  newItemText: string
  editingId: string | null
  editText: string
}
```

#### Operations
1. **Add Item**
   - Input field with placeholder
   - Press Enter or click button to add
   - Auto-clears input on success

2. **Edit Item**
   - Click item text to enter edit mode
   - Inline input with save (✓) and cancel (✕) buttons
   - Press Enter to save, Escape to cancel

3. **Delete Item**
   - Trash icon button (visible on hover)
   - Sets status to "DELETED"
   - Immediately removes from UI

4. **Status Change**
   - Dropdown: New → In Progress → Done
   - "Done" status auto-removes item (sets to COMPLETED)

#### Status Colors
| Status | Color |
|--------|-------|
| new | zinc-400 |
| in-progress | cyan-400 |
| done | emerald-400 |

#### Dependencies
- `lib/parking-lot-storage.ts`: 
  - getActiveParkingLotItems()
  - addParkingLotItem()
  - editParkingLotItemText()
  - deleteParkingLotItem()
  - completeParkingLotItem()
  - updateParkingLotItemStatus()

---

### 5.2 MidSessionIntelligenceTestPanel

**Location**: `/features/desktop/panels/MidSessionIntelligenceTestPanel/index.tsx`  
**Purpose**: Simulation and testing controls for bandwidth engine and session features

#### Props Interface (25+ handlers)
```typescript
interface MidSessionIntelligenceTestPanelProps {
  isOpen: boolean
  onClose: () => void
  
  // Bandwidth Controls
  onBandwidthChange: (delta: number) => void // +5 or -5
  onSetBandwidth: (value: number) => void // set specific value
  
  // Context Switching Simulation
  onSimulateTabSwitch: () => void
  onSimulateAppSwitch: () => void
  onSimulateTabBurst: () => void // rapid switching
  onSimulateAppBurst: () => void // rapid switching
  
  // Flow Simulation
  onSimulateSustainedFocus: (minutes: number) => void
  
  // Reset Rituals
  onSimulateBreathReset: () => void
  onSimulateWalkReset: () => void
  onSimulateDumpReset: () => void
  
  // Intervention Triggers
  onTriggerFriction: () => void
  onTriggerFocusSlipping: () => void
  onTriggerNonWhitelistedApp: () => void
  onTriggerTabSwitching: () => void
  
  // Flow Detection
  onForceEnterFlow: () => void
  onForceExitFlow: () => void
  onResetFlowState: () => void
  onSimulateInterruption: (type: string) => void
  
  // Session State
  onResetSessionState: () => void
  
  // Display Props
  currentBandwidth: number
  sessionMode: "Zen" | "Flow" | "Legend"
  flowState?: FlowStateObject
}

interface FlowStateObject {
  sustainedFocusMinutes: number
  flowEligible: boolean
  flowTriggered: boolean
  flowActive: boolean
  flowCelebrationTriggered: boolean
  flowStreakMinutes: number
  lastInterruptionTimestamp: number
  lastSwitchTimestamp: number
  conditionsValid: boolean
}
```

#### Testing Sections (Expandable Accordions)

**A. Bandwidth Controls**
- Current bandwidth display (realtime)
- +5 / -5 buttons
- Set specific value input (0-100)

**B. Context Switching Simulation**
- Single tab switch
- Single app switch
- Tab burst (10 switches in 30s)
- App burst (10 switches in 30s)

**C. Flow Simulation**
- Sustained focus buttons: 3 min, 6 min, 12 min
- Shows flow eligibility status

**D. Reset Ritual Simulation**
- Breath Reset button
- Walk Reset button
- Dump Reset button

**E. Intervention Simulation**
- Trigger Friction
- Trigger Focus Slipping
- Trigger Non-Whitelisted App
- Trigger Tab Switching

**F. Flow Detection Engine**
- Force Enter Flow
- Force Exit Flow
- Reset Flow State
- Simulate Interruption dropdown (app-switch, tab-switch, external)
- Flow state object display (JSON viewer)

**G. Demo Controls**
- Reset Calibration button (clears calibration data, reloads page)

---

### 5.3 DailyCalibrationPanel

**Location**: `/features/desktop/panels/DailyCalibrationPanel/index.tsx`  
**Purpose**: Quick in-HUD calibration (simplified version of CalibrationCeremony)

#### Props Interface
```typescript
interface DailyCalibrationPanelProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}
```

#### Simplified Flow
- Single panel with 3 key questions
- Sleep quality (1-5)
- Emotional state (1-5)
- Today's obstacles (free text)

#### Completion Behavior
- Saves calibration data with current date
- Updates HUD mode from "not-calibrated" to "idle"
- Calls `onComplete()` to trigger bandwidth refresh

---

## 6. Calibration Components

### 6.1 CalibrationCeremony

**Location**: `/features/calibration/CalibrationCeremony.tsx`  
**Purpose**: Full multi-screen calibration flow (daily ritual)

#### Props Interface
```typescript
interface CalibrationCeremonyProps {
  onComplete: () => void
  demo?: boolean
}
```

#### 7-Screen Flow

**Screen 0: Time-Aware Intro**
- Welcome message
- Time-of-day specific greeting
- RitualGlyph animation component

**Screen 1: Human Bandwidth Concept**
- Explanation of bandwidth system
- Visualization of capacity

**Screen 2: Sleep Tracking**
- Hours slept input
- Sleep quality (1-5 scale)
- Wake time

**Screen 3: Emotional State**
- Emotional grounding (1-5 scale)
- Emoji selector
- Current mood descriptors

**Screen 4: Distractions & Hurdles**
- Known obstacles for today
- Checkbox list of common distractions
- Custom obstacle input

**Screen 5: Intention Setting**
- Daily intention (free text)
- Priority areas (multi-select)

**Screen 6: Completion**
- Summary of inputs
- Calculated bandwidth preview
- Completion animation

#### Navigation
- Back button on screens 1-5
- Continue button on all screens
- Auto-advances on Screen 6

#### Data Saved
```typescript
interface CalibrationData {
  date: string // YYYY-MM-DD format
  sleep: {
    hours: number
    quality: number
  }
  emotional: {
    grounding: number
    descriptors: string[]
  }
  obstacles: string[]
  intention: string
  priorities: string[]
  calculatedBandwidth: number
  timestamp: string // ISO format
}
```

#### Dependencies
- `features/desktop/bandwidth-engine/storage.ts`: saveCalibration()

---

## 7. Shared/Utility Components

### 7.1 TimerHalo

**Location**: `/components/animations/TimerHalo.tsx`  
**Purpose**: Animated circular timer visualization

#### Props Interface
```typescript
interface TimerHaloProps {
  children: ReactNode // content inside circle
  variant: "wave-ripple" | "pulse" | "rotate"
  color: string // hex color
  size: number // diameter in pixels
  isActive: boolean
}
```

#### Variants
- **wave-ripple**: Expanding concentric circles
- **pulse**: Breathing scale animation
- **rotate**: Spinning border

#### Usage Examples
- ResetPanel countdown
- Pre-session preparation timer
- Flow celebration animation

---

## 8. Type Definitions

### 8.1 Common Types

```typescript
// Mode Types
type HUDMode = "idle" | "session" | "paused" | "not-calibrated" | "estimated" | "break"
type SessionMode = "Zen" | "Flow" | "Legend"
type SessionType = "deep" | "parking-lot" | "administrative"
type RitualType = "breath" | "walk" | "dump" | "personal"
type InterventionType = "friction" | "focus-slipping" | "non-whitelisted-app" | "tab-switch"

// Mode Color Mappings
const MODE_COLORS = {
  Zen: { primary: "emerald-500", text: "emerald-400", border: "emerald-500" },
  Flow: { primary: "cyan-500", text: "cyan-400", border: "cyan-500" },
  Legend: { primary: "red-500", text: "red-400", border: "red-500" }
}

// HUD Mode Indicators
const HUD_MODE_STYLES = {
  "idle": { color: "zinc-400", glow: "none" },
  "session": { color: "cyan-400", glow: "cyan" },
  "paused": { color: "amber-400", glow: "amber" },
  "not-calibrated": { color: "zinc-500", glow: "none" },
  "estimated": { color: "purple-400", glow: "purple" },
  "break": { color: "emerald-400", glow: "emerald" }
}
```

### 8.2 Storage Types

```typescript
// Parking Lot Item
interface ParkingLotItemFull {
  id: string
  text: string
  timestamp: number
  status: "OPEN" | "PENDING" | "COMPLETED" | "DELETED"
  itemStatus?: "new" | "in-progress" | "done" // UI display status
  category?: "task" | "idea" | "reminder" | "distraction"
  tags?: string[]
  createdAt: string
  updatedAt: string
}

// Session Record
interface SessionRecord {
  id: string
  mode: SessionMode
  sessionType: SessionType
  startTime: number
  endTime: number
  plannedDurationMinutes: number
  actualDurationMinutes: number
  intention: string
  flowEfficiency: number
  longestStreakMinutes: number
  distractionAttempts: number
  interventionsUsed: number
  victoryLevel: string
  timelineBlocks: TimelineBlock[]
  endReason: string
  whitelistedApps: string[]
  whitelistedTabs: string[]
}

// Timeline Block
interface TimelineBlock {
  state: "flow" | "working" | "distracted" | "reset"
  start: number // minutes from session start
  end: number // minutes from session start
}

// Reflection Object
interface ReflectionObject {
  sessionId: string
  whatWentWell: string
  frictionNotes?: string
  closingEnergy: number
  skipped: boolean
  createdAt: string
}
```

---

## 9. Component Dependencies Map

### External Dependencies
- **Lucide Icons**: X, Copy, Check, TrendingUp, Zap, Clock, Target, AlertTriangle
- **React**: useState, useEffect, useRef, ReactNode
- **Tailwind CSS**: Utility classes, custom animations

### Internal Dependencies

```
FloatingHUD
  └── No dependencies

DraggableContainer
  └── No dependencies

PreSessionPanel
  ├── lib/parking-lot-storage.ts
  └── components/animations/TimerHalo.tsx

PostSessionSummaryPanel
  └── lib/session-storage.ts

SessionReflectionPanel
  └── lib/session-storage.ts

ParkingLotHarvestPanel
  └── lib/parking-lot-storage.ts

ResetPanel
  └── components/animations/TimerHalo.tsx

InterventionOverlay
  └── No dependencies

FlowCelebrationOverlay
  └── No dependencies

OvertimeNudgeToast
  └── No dependencies

InterruptedSessionModal
  └── lib/session-storage.ts

EndSessionModal
  └── lib/session-storage.ts

ParkingLotManagementPanel
  └── lib/parking-lot-storage.ts

MidSessionIntelligenceTestPanel
  └── features/desktop/bandwidth-engine/*

DailyCalibrationPanel
  └── features/desktop/bandwidth-engine/storage.ts

CalibrationCeremony
  └── features/desktop/bandwidth-engine/storage.ts
```

---

## 10. Component Communication Patterns

### Parent-Child Communication
All panels use **unidirectional data flow**:
1. Parent (desktop/page.tsx) manages state
2. Props flow down to components
3. Callbacks flow up from components

### Example: PreSessionPanel Flow
```
Desktop Page (Parent)
  ├── State: showPreSession (boolean)
  ├── Handler: handlePreSessionComplete(data: PreSessionData)
  └── Renders: <PreSessionPanel isOpen={showPreSession} onComplete={handlePreSessionComplete} />

PreSessionPanel (Child)
  ├── Internal State: currentStep, formData
  ├── User completes 6-step flow
  └── Calls: onComplete(formData)

Desktop Page Receives Data
  ├── Saves to session storage
  ├── Starts session timer
  ├── Updates HUD mode to "session"
  └── Sets showPreSession = false
```

### Event Handler Naming Convention
- `on[Action]`: Callback props (e.g., `onComplete`, `onClose`, `onSave`)
- `handle[Action]`: Internal handlers (e.g., `handleSubmit`, `handleInputChange`)

---

## 11. Conditional Rendering Logic

### Panel Visibility Rules
All panels use the same pattern:
```typescript
if (!isOpen) return null
```

### Panel Priority Order (Z-Index)
Inside DraggableContainer, panels render in sequence:
1. FloatingHUD (always visible)
2. DailyCalibrationPanel (mode === "not-calibrated")
3. InterventionOverlay (interventionState.isOpen)
4. FlowCelebrationOverlay (flowCelebrationState.isOpen)
5. MidSessionIntelligenceTestPanel (showIntelligencePanel)
6. ParkingLotManagementPanel (showParkingLot)
7. PreSessionPanel (showPreSession)
8. ResetPanel (sessionStatus === "paused")
9. PostSessionSummaryPanel (showPostSessionSummary)
10. SessionReflectionPanel (showSessionReflection)
11. ParkingLotHarvestPanel (showParkingLotHarvest)

### Full-Screen Modals (Outside DraggableContainer)
- InterruptedSessionModal (hasRecoveryData)
- EndSessionModal (showEndSessionModal)
- OvertimeNudgeToast (showOvertimeNudge)

---

## 12. Styling Patterns

### Consistent Design Language
All components follow these patterns:

**Panel Container**:
```typescript
className="w-[475px] rounded-3xl bg-[#0a0f0d]/55 backdrop-blur-xl border border-{color}-500/30 shadow-2xl"
```

**Section Headers**:
```typescript
className="text-sm text-{color}-400 uppercase tracking-wider"
```

**Buttons**:
```typescript
// Primary Action
className="px-6 py-3 bg-{color}-500/10 hover:bg-{color}-500/20 text-zinc-300 uppercase tracking-wider rounded-2xl transition-all border border-{color}-500/30"

// Secondary Action
className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-lg transition-colors"
```

**Inputs**:
```typescript
className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-{color}-500 focus:ring-2 focus:ring-{color}-500/20"
```

---

## 13. Animation Patterns

### Tailwind Animations
```css
/* Slide In */
.animate-in.slide-in-from-right-full { /* ... */ }
.animate-in.slide-in-from-left-full { /* ... */ }

/* Fade In */
.animate-in.fade-in { /* ... */ }

/* Zoom In */
.animate-in.zoom-in-95 { /* ... */ }

/* Pulse */
.animate-pulse { /* ... */ }

/* Breathe (Custom) */
.animate-breathe { /* scale breathing animation */ }
```

### Custom Keyframe Animations
```css
@keyframes shrink {
  from { width: 100%; }
  to { width: 0%; }
}
```

---

## 14. Migration Notes

### Tauri Desktop Considerations

1. **Window Management**
   - DraggableContainer: May need OS-native window dragging
   - Full-screen modals: Use Tauri window API
   - Auto-positioning: Account for system taskbar/dock

2. **Storage Migration**
   - Replace localStorage with Tauri's Store API
   - Add migration layer for existing web data
   - Implement backup/restore for user data

3. **Component Isolation**
   - Each panel can be a separate Tauri window
   - Or use single-window with routing
   - Consider performance trade-offs

4. **Event Communication**
   - Replace React context with Tauri event system
   - Use IPC for component-to-backend communication
   - Implement proper event cleanup

5. **Styling Adjustments**
   - Test backdrop-blur support
   - Adjust for native window decorations
   - Ensure consistent rendering across OS

---

## 15. Testing Checklist

### Per-Component Tests
- [ ] Props validation (TypeScript types)
- [ ] State initialization and updates
- [ ] Event handler execution
- [ ] Conditional rendering logic
- [ ] Cleanup on unmount (timers, listeners)
- [ ] Error boundaries and fallbacks

### Integration Tests
- [ ] Parent-child communication
- [ ] Multiple panels open simultaneously
- [ ] Session flow: pre → active → post → reflection → harvest
- [ ] Interrupted session recovery
- [ ] Calibration → session flow
- [ ] Parking lot lifecycle: add → harvest → next session

### Visual Regression Tests
- [ ] Mode-specific styling (Zen/Flow/Legend)
- [ ] Responsive behavior (window resize)
- [ ] Animation smoothness
- [ ] Z-index layering
- [ ] Overflow handling (long text, many items)

---

**End of Component Registry**

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-12 | Initial creation with all 15 major components documented | v0 |
