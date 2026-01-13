# **13 - UI Architecture and Window Structure**

**Version:** 1.0  
**Last Updated:** January 13, 2026  
**Purpose:** Complete clarification of the Dustoff Reset UI architecture including window structure, panel hierarchy, component relationships, and file locations for Cursor/Claude integration.

---

## Table of Contents

1. [Window Structure Overview](#1-window-structure-overview)
2. [The Draggable System](#2-the-draggable-system)
3. [Component Hierarchy Map](#3-component-hierarchy-map)
4. [Panel/Screen Registry](#4-panelscreen-registry)
5. [Z-Index Stack](#5-z-index-stack)
6. [State Management Flow](#6-state-management-flow)
7. [File Location Reference](#7-file-location-reference)
8. [HUD-Panel Interaction Patterns](#8-hud-panel-interaction-patterns)
9. [Layout Specifications](#9-layout-specifications)
10. [Implementation Guidelines](#10-implementation-guidelines)

---

## 1. Window Structure Overview

### 1.1 Core Concept

**Dustoff Reset uses ONE floating window** that contains:
- The FloatingHUD (core control center - always visible)
- Conditional panels that slide in/out below the HUD
- Overlays that appear alongside panels
- Modals that appear above everything

All of this is wrapped in a **DraggableContainer** that makes the entire system movable.

---

### 1.2 Window Dimensions

**Base HUD (no panels):**
- Width: **320px**
- Height: **60px**
- Shape: Circular pill

**With Panels Open:**
- Width: **Varies by panel** (380px - 700px)
- Height: **HUD (60px) + Panel height + 12px gap**
- Layout: Vertical stack (HUD on top, panels below)

**Screen Constraints:**
- 60px margin from all screen edges
- Auto-centers when panels expand beyond screen width
- Respects viewport boundaries (no off-screen positioning)

---

### 1.3 Visual Layout

```
┌─────────────────────────────────────────────┐
│  DESKTOP BACKGROUND (full screen)          │
│                                             │
│    ┌─────────────────────────────┐         │
│    │  DraggableContainer         │         │
│    │  (z-index: 9999)            │         │
│    │                             │         │
│    │  ┌───────────────────────┐  │         │
│    │  │  FloatingHUD          │  │         │
│    │  │  320x60px             │  │         │
│    │  │  ┌────┬────────┬─────┐│  │         │
│    │  │  │ BW │ Status │ Btn ││  │         │
│    │  │  └────┴────────┴─────┘│  │         │
│    │  └───────────────────────┘  │         │
│    │                             │         │
│    │  ┌───────────────────────┐  │         │
│    │  │  Panel (conditional)  │  │         │
│    │  │  (slides in below)    │  │         │
│    │  │  • PreSessionPanel    │  │         │
│    │  │  • CalibrationPanel   │  │         │
│    │  │  • ResetPanel         │  │         │
│    │  │  • etc...             │  │         │
│    │  └───────────────────────┘  │         │
│    │                             │         │
│    └─────────────────────────────┘         │
│                                             │
│  ┌─────────────────────────────────┐       │
│  │  Modals (absolute, higher z)    │       │
│  │  • EndSessionModal (z-9999)     │       │
│  │  • InterruptedSessionModal      │       │
│  └─────────────────────────────────┘       │
│                                             │
│  ┌──────────────────┐                      │
│  │  OvertimeToast   │ (top-right, z-150)  │
│  └──────────────────┘                      │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 2. The Draggable System

### 2.1 DraggableContainer

**File:** `features/desktop/hud/DraggableContainer/index.tsx`

**Purpose:** 
- Makes the entire HUD + panels draggable as one unit
- Handles positioning, constraints, and auto-centering
- Manages screen edge collision detection

**Key Features:**

1. **Smart Initial Positioning:**
   ```typescript
   // Defaults to top-right
   initialX = window.innerWidth - 340
   initialY = 20
   ```

2. **Auto-Centering Logic:**
   ```typescript
   // When panel opens and width > 800px
   if (rect.width > 800) {
     newX = Math.max(EDGE_MARGIN, centeredX)
   }
   ```

3. **Edge Constraints:**
   ```typescript
   const EDGE_MARGIN = 60 // pixels from screen edges
   
   // Prevents container from going off-screen
   newX = Math.max(EDGE_MARGIN, newX)
   newX = Math.min(window.innerWidth - rect.width - EDGE_MARGIN, newX)
   ```

4. **Drag Behavior:**
   - Click and drag anywhere on panels to move
   - Buttons, inputs, and interactive elements don't trigger drag
   - Cursor changes to `grab` when hoverable, `grabbing` when dragging
   - Manual movement disables auto-positioning

5. **ResizeObserver:**
   ```typescript
   // Watches container size changes
   // Adjusts position when panels expand/collapse
   const resizeObserver = new ResizeObserver(() => {
     checkAndAdjustPosition()
   })
   ```

---

### 2.2 Drag States

| State | Cursor | Auto-Position | User Control |
|-------|--------|---------------|--------------|
| **No Panel Open** | `default` | No | HUD not draggable |
| **Panel Open** | `grab` | Yes (first time) | Can drag entire system |
| **Dragging** | `grabbing` | No | Full manual control |
| **Manually Moved** | `grab` | Disabled forever | User position persists |

---

## 3. Component Hierarchy Map

### 3.1 Full Tree Structure

```
DesktopPage (app/desktop/page.tsx)
│
├── HUDContainer (background wrapper)
│   └── styles: gradient background, grid pattern
│
└── DraggableContainer (z-9999)
    │
    ├── FloatingHUD (320x60px, always visible)
    │   ├── Bandwidth Display (left 16px)
    │   │   ├── Score number (0-100)
    │   │   ├── Particle animations (6 particles)
    │   │   └── Glow effects
    │   │
    │   ├── Status Display (center)
    │   │   ├── Mode indicator (Zen/Flow/Legend)
    │   │   ├── Timer (MM:SS / Total)
    │   │   └── State messages
    │   │
    │   └── Action Buttons (right)
    │       ├── Parking Lot button (☰)
    │       ├── Calibrate button (⚡) - when not calibrated
    │       ├── Start button (▶) - when idle
    │       ├── Pause button (⏸) - when active
    │       ├── Resume button (▶) - when paused
    │       └── Stop button (⏹) - when active/paused
    │
    ├── CONDITIONAL PANELS (rendered below HUD, 12px gap)
    │   │
    │   ├── DailyCalibrationPanel
    │   │   └── Triggers: mode === "not-calibrated"
    │   │
    │   ├── PreSessionPanel
    │   │   └── Triggers: onStartSession() called
    │   │
    │   ├── ResetPanel
    │   │   └── Triggers: user clicks ritual/reset button
    │   │
    │   ├── MidSessionIntelligenceTestPanel
    │   │   └── Triggers: debug/testing mode
    │   │
    │   ├── ParkingLotManagementPanel
    │   │   └── Triggers: onOpenParkingLot() called
    │   │
    │   ├── ParkingLotHarvestPanel
    │   │   └── Triggers: session ends (post-reflection)
    │   │
    │   ├── PostSessionSummaryPanel
    │   │   └── Triggers: session ends (before reflection)
    │   │
    │   ├── SessionReflectionPanel
    │   │   └── Triggers: after PostSessionSummaryPanel
    │   │
    │   ├── InterventionOverlay
    │   │   └── Triggers: bandwidth < 60 (friction) or < 50 (focus-slipping)
    │   │
    │   └── FlowCelebrationOverlay
    │       └── Triggers: sustained focus >= 12 minutes
    │
    └── MODALS (absolute positioned, outside DraggableContainer)
        │
        ├── InterruptedSessionModal (z-200)
        │   └── Triggers: page load with recovery data
        │
        ├── EndSessionModal (z-9999)
        │   └── Triggers: onStopSession() called
        │
        └── OvertimeNudgeToast (z-150, top-right corner)
            └── Triggers: session time > planned duration + 5 min
```

---

## 4. Panel/Screen Registry

### 4.1 Panel Types & Dimensions

| Panel Name | Width | Height | Purpose | Trigger |
|------------|-------|--------|---------|---------|
| **DailyCalibrationPanel** | 700px | ~600px | Daily bandwidth calibration ceremony | Not calibrated today |
| **PreSessionPanel** | 640px | ~500px | Session setup (mode, duration, whitelist) | Start session clicked |
| **ResetPanel** | 480px | ~400px | Ritual selection (breath, walk, dump) | Reset/ritual needed |
| **MidSessionIntelligenceTestPanel** | 520px | ~450px | Debug and testing controls | Debug mode |
| **ParkingLotManagementPanel** | 500px | ~550px | Capture thoughts during session | Parking lot button |
| **ParkingLotHarvestPanel** | 600px | ~650px | Review/categorize items post-session | Session ends |
| **PostSessionSummaryPanel** | 550px | ~500px | Session metrics and stats | Session ends (step 1) |
| **SessionReflectionPanel** | 520px | ~450px | Reflection questions | After summary (step 2) |
| **InterventionOverlay** | Varies | ~150px | Friction/focus-slipping warnings | Bandwidth drops |
| **FlowCelebrationOverlay** | 500px | ~200px | Flow state achievement | Sustained focus |

---

### 4.2 Panel Slide Animations

**All panels use the same basic pattern:**

```tsx
<div className={`
  w-[600px] 
  rounded-3xl 
  bg-[#0a0f0d]/55 
  backdrop-blur-xl 
  border 
  border-[#2f4a42]/40 
  shadow-2xl 
  overflow-hidden
  transition-all 
  duration-300
  ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
`}>
  {/* Panel content */}
</div>
```

**Animation Details:**
- Slide in from slightly below (`translate-y-4` → `translate-y-0`)
- Fade in (`opacity-0` → `opacity-100`)
- 300ms duration with easing
- No left/right sliding (all panels appear in center below HUD)

---

### 4.3 Show/Hide State Flags

**In DesktopPage:**

```typescript
const [showCalibrationPanel, setShowCalibrationPanel] = useState(false)
const [showPreSessionPanel, setShowPreSessionPanel] = useState(false)
const [showResetPanel, setShowResetPanel] = useState(false)
const [showMidSessionTest, setShowMidSessionTest] = useState(false)
const [showParkingLotPanel, setShowParkingLotPanel] = useState(false)
const [showParkingLotHarvest, setShowParkingLotHarvest] = useState(false)
const [showPostSessionSummary, setShowPostSessionSummary] = useState(false)
const [showSessionReflection, setShowSessionReflection] = useState(false)
const [showInterventionOverlay, setShowInterventionOverlay] = useState(false)
const [showFlowCelebration, setShowFlowCelebration] = useState(false)
const [showEndModal, setShowEndModal] = useState(false)
const [showOvertimeNudge, setShowOvertimeNudge] = useState(false)
const [showInterruptedModal, setShowInterruptedModal] = useState(false)
```

---

### 4.4 Trigger Events

| Event | State Change | Resulting Panel |
|-------|--------------|-----------------|
| **Page Load + Not Calibrated** | `mode = "not-calibrated"` | DailyCalibrationPanel |
| **Start Session Button** | `setShowPreSessionPanel(true)` | PreSessionPanel |
| **Pre-Session Complete** | `mode = "session"`, start timer | HUD shows session |
| **Bandwidth < 60** | `setShowInterventionOverlay(true)` | InterventionOverlay (friction) |
| **Bandwidth < 50** | `setShowInterventionOverlay(true)` | InterventionOverlay (focus-slipping) |
| **Sustained Focus 12+ min** | `setShowFlowCelebration(true)` | FlowCelebrationOverlay |
| **Stop Session Button** | `setShowEndModal(true)` | EndSessionModal |
| **End Modal Complete** | `setShowPostSessionSummary(true)` | PostSessionSummaryPanel |
| **Summary Complete** | `setShowSessionReflection(true)` | SessionReflectionPanel |
| **Reflection Complete** | `setShowParkingLotHarvest(true)` | ParkingLotHarvestPanel |
| **Time > Planned + 5 min** | `setShowOvertimeNudge(true)` | OvertimeNudgeToast |
| **Parking Lot Button** | `setShowParkingLotPanel(true)` | ParkingLotManagementPanel |

---

## 5. Z-Index Stack

### 5.1 Layer Hierarchy (Top to Bottom)

```
10000  ← EndSessionModal (full-screen blocker)
9999   ← DraggableContainer (HUD + panels)
       ↓  • FloatingHUD
       ↓  • All panels
       ↓  • InterventionOverlay (Zen/Flow modes)
       ↓  • FlowCelebrationOverlay
9999   ← InterventionOverlay (Legend mode only - full-screen)
200    ← InterruptedSessionModal
150    ← OvertimeNudgeToast (top-right corner)
10     ← HUDContainer (background)
0      ← Desktop background
```

---

### 5.2 Special Cases

**Legend Mode Intervention:**
```tsx
// ONLY Legend mode intervention goes full-screen
{mode === "Legend" && (
  <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md">
    {/* Full-screen intervention */}
  </div>
)}
```

**Zen/Flow Mode Interventions:**
```tsx
// Zen and Flow interventions stay within DraggableContainer
<div className="w-full mt-3 mb-3">
  {/* Inline intervention panel */}
</div>
```

---

## 6. State Management Flow

### 6.1 State Ownership

**DesktopPage owns ALL state:**
- `mode`: Current app mode ("not-calibrated" | "idle" | "session" | "paused")
- `sessionMode`: Session intensity ("Zen" | "Flow" | "Legend")
- `bandwidth`: Current bandwidth score (0-100)
- `bandwidthState`: Complete bandwidth engine state
- `sessionTime`: Elapsed seconds
- `timeRemaining`: Seconds until session end
- `isInFlow`: Boolean flow state indicator
- All panel visibility flags (showXxxPanel)

---

### 6.2 Data Flow Pattern

```
User Action (HUD Button Click)
    ↓
FloatingHUD fires callback
    ↓
DesktopPage updates state
    ↓
Panel visibility flag changes
    ↓
Panel renders (conditional)
    ↓
User completes panel action
    ↓
Panel fires onComplete callback
    ↓
DesktopPage updates state
    ↓
Panel closes, HUD updates
```

---

### 6.3 Bandwidth Update Flow

```
1. Timer tick (every 1 second)
    ↓
2. Bandwidth engine calculates entropy decay
    ↓
3. Check for telemetry events (context switch, sustained focus)
    ↓
4. Apply penalties or bonuses
    ↓
5. Update bandwidth state
    ↓
6. Check intervention thresholds
    ↓
7. Trigger InterventionOverlay if needed
    ↓
8. Update HUD display
```

---

## 7. File Location Reference

### 7.1 Directory Structure

```
features/desktop/
│
├── hud/
│   ├── FloatingHUD/
│   │   ├── index.tsx          (Main HUD component - 338 lines)
│   │   ├── types.ts           (Props, state interfaces)
│   │   ├── logic.ts           (Helper functions)
│   │   └── mockData.ts        (Demo data)
│   │
│   ├── DraggableContainer/
│   │   └── index.tsx          (Drag system - 180 lines)
│   │
│   └── HUDContainer/
│       └── index.tsx          (Background wrapper - 27 lines)
│
├── panels/
│   ├── DailyCalibrationPanel/
│   │   ├── index.tsx
│   │   └── types.ts
│   │
│   ├── PreSessionPanel/
│   │   ├── index.tsx
│   │   └── types.ts
│   │
│   ├── ResetPanel/
│   │   ├── index.tsx
│   │   └── types.ts
│   │
│   ├── MidSessionIntelligenceTestPanel/
│   │   ├── index.tsx
│   │   └── types.ts
│   │
│   ├── ParkingLotManagementPanel/
│   │   ├── index.tsx
│   │   └── types.ts
│   │
│   ├── ParkingLotHarvestPanel/
│   │   └── index.tsx
│   │
│   ├── PostSessionSummaryPanel/
│   │   └── index.tsx
│   │
│   └── SessionReflectionPanel/
│       └── index.tsx
│
├── overlays/
│   ├── InterventionOverlay/
│   │   ├── index.tsx          (Mode-specific interventions - 261 lines)
│   │   └── types.ts
│   │
│   ├── FlowCelebrationOverlay/
│   │   ├── index.tsx          (Flow achievement - 86 lines)
│   │   └── types.ts
│   │
│   └── OvertimeNudgeToast/
│       └── index.tsx          (Top-right toast - 55 lines)
│
├── modals/
│   ├── EndSessionModal/
│   │   └── index.tsx          (Exit reason selection - 181 lines)
│   │
│   └── InterruptedSessionModal/
│       └── index.tsx          (Session recovery - 64 lines)
│
└── bandwidth-engine/
    ├── session-bandwidth.ts   (Core bandwidth logic)
    ├── initial-bandwidth.ts   (Calibration → bandwidth)
    ├── storage.ts             (Bandwidth persistence)
    └── types.ts               (Bandwidth interfaces)
```

---

### 7.2 Main Entry Point

**File:** `app/desktop/page.tsx` (574 lines)

**Responsibilities:**
1. Orchestrates all state management
2. Renders HUDContainer (background)
3. Renders DraggableContainer with HUD + panels
4. Handles timer logic (1s intervals)
5. Manages bandwidth engine integration
6. Coordinates panel show/hide flow
7. Persists session state to storage

---

## 8. HUD-Panel Interaction Patterns

### 8.1 HUD Always Visible

**Rule:** The FloatingHUD NEVER hides or shrinks.

**When panels open:**
- HUD stays at the top (fixed position)
- Panels appear below with 12px gap
- DraggableContainer expands vertically
- HUD remains fully functional (all buttons active)

---

### 8.2 Panel Positioning

**All panels follow this layout:**

```tsx
<DraggableContainer hasPanel={anyPanelOpen}>
  <FloatingHUD {...hudProps} />
  
  {showPanel && (
    <div className="mt-3">  {/* 12px gap */}
      <Panel {...panelProps} />
    </div>
  )}
</DraggableContainer>
```

**Visual Result:**
```
┌──────────────┐
│ FloatingHUD  │  ← Always on top
├──────────────┤
│   12px gap   │
├──────────────┤
│              │
│ Panel Below  │  ← Slides in/out
│              │
└──────────────┘
```

---

### 8.3 Multiple Panels

**Rule:** Only ONE panel can be open at a time (except overlays).

**Exception:** InterventionOverlay and FlowCelebrationOverlay can appear alongside other panels.

**Example Stack:**
```
┌──────────────────┐
│   FloatingHUD    │
├──────────────────┤
│   12px gap       │
├──────────────────┤
│ PreSessionPanel  │  ← Main panel
├──────────────────┤
│   12px gap       │
├──────────────────┤
│ InterventionOvly │  ← Overlay (can coexist)
└──────────────────┘
```

---

### 8.4 Panel Dismissal

**All panels include a close button:**

```tsx
<button 
  onClick={() => {
    onClose()
    setShowXxxPanel(false)
  }}
  className="..."
>
  ✕
</button>
```

**Dismissal also triggered by:**
- Completing panel flow (e.g., calibration done)
- Clicking panel action button (e.g., "Start Session")
- Automatic timeout (e.g., InterventionOverlay after 10s)

---

## 9. Layout Specifications

### 9.1 Screen Margins

**Edge Buffer:** 60px minimum from all screen edges

```typescript
const EDGE_MARGIN = 60

// Constrain X position
newX = Math.max(EDGE_MARGIN, newX)
newX = Math.min(window.innerWidth - rect.width - EDGE_MARGIN, newX)

// Constrain Y position
newY = Math.max(20, newY)
newY = Math.min(window.innerHeight - rect.height - 20, newY)
```

---

### 9.2 Responsive Behavior

**Auto-Centering Threshold:**
```typescript
// If container width > 800px, auto-center horizontally
if (rect.width > 800) {
  const centeredX = (windowWidth - rect.width) / 2
  newX = Math.max(EDGE_MARGIN, centeredX)
}
```

**Window Resize Handling:**
```typescript
// ResizeObserver watches for container size changes
// Window resize event listener adjusts position
// Maintains edge constraints at all times
```

---

### 9.3 Visual Styling Constants

**Background Colors:**
```css
/* Primary dark background */
bg-[#0a0f0d]/90

/* Panel backgrounds */
bg-[#0a0f0d]/55 backdrop-blur-xl

/* Border colors */
border-[#2f4a42]/40  /* Default green tint */
border-emerald-500/30 /* Active emerald */
border-cyan-500/30    /* Flow mode */
border-amber-500/30   /* Legend mode */
```

**Mode-Specific Colors:**
```typescript
const MODE_COLORS = {
  Zen: {
    primary: '#10b981',   // emerald-500
    glow: 'rgba(16, 185, 129, 0.15)'
  },
  Flow: {
    primary: '#06b6d4',   // cyan-500
    glow: 'rgba(6, 182, 212, 0.15)'
  },
  Legend: {
    primary: '#f59e0b',   // amber-500
    glow: 'rgba(251, 191, 36, 0.15)'
  }
}
```

---

## 10. Implementation Guidelines

### 10.1 Adding a New Panel

**Step 1: Create Panel Component**
```tsx
// features/desktop/panels/MyNewPanel/index.tsx
interface MyNewPanelProps {
  isOpen: boolean
  onClose: () => void
  onComplete?: (data: any) => void
}

export function MyNewPanel({ isOpen, onClose, onComplete }: MyNewPanelProps) {
  if (!isOpen) return null
  
  return (
    <div className="w-[600px] rounded-3xl bg-[#0a0f0d]/55 backdrop-blur-xl border border-[#2f4a42]/40 shadow-2xl overflow-hidden">
      {/* Panel content */}
    </div>
  )
}
```

**Step 2: Add State to DesktopPage**
```tsx
const [showMyNewPanel, setShowMyNewPanel] = useState(false)
```

**Step 3: Add Trigger Logic**
```tsx
const handleTriggerMyPanel = () => {
  setShowMyNewPanel(true)
}
```

**Step 4: Render Conditionally**
```tsx
<DraggableContainer hasPanel={showMyNewPanel}>
  <FloatingHUD {...props} />
  
  {showMyNewPanel && (
    <div className="mt-3">
      <MyNewPanel 
        isOpen={showMyNewPanel}
        onClose={() => setShowMyNewPanel(false)}
        onComplete={(data) => {
          // Handle completion
          setShowMyNewPanel(false)
        }}
      />
    </div>
  )}
</DraggableContainer>
```

---

### 10.2 Adding a New Modal

**Step 1: Create Modal Component**
```tsx
// features/desktop/modals/MyNewModal/index.tsx
interface MyNewModalProps {
  isOpen: boolean
  onClose: () => void
}

export function MyNewModal({ isOpen, onClose }: MyNewModalProps) {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-[#0a0f0d]/95 backdrop-blur-xl border border-emerald-500/30 shadow-2xl p-6">
        {/* Modal content */}
      </div>
    </div>
  )
}
```

**Step 2: Render Outside DraggableContainer**
```tsx
// app/desktop/page.tsx
return (
  <HUDContainer>
    <DraggableContainer>
      {/* HUD and panels */}
    </DraggableContainer>
    
    {/* Modals render separately */}
    <MyNewModal isOpen={showMyNewModal} onClose={() => setShowMyNewModal(false)} />
  </HUDContainer>
)
```

---

### 10.3 Bandwidth Integration

**To trigger interventions based on bandwidth:**

```tsx
// In DesktopPage, inside useEffect that monitors bandwidth
useEffect(() => {
  if (bandwidth < 50) {
    setInterventionType('focus-slipping')
    setShowInterventionOverlay(true)
  } else if (bandwidth < 60) {
    setInterventionType('friction')
    setShowInterventionOverlay(true)
  }
}, [bandwidth])
```

---

### 10.4 Flow State Indicators

**To show persistent flow indicator on HUD:**

```tsx
// FloatingHUD automatically shows flow particles when isInFlow={true}
<FloatingHUD
  isInFlow={bandwidthState.flowState.isActive}
  {...otherProps}
/>
```

**Particle system renders:**
- 24 outer orbit particles (50px radius)
- 16 inner orbit particles (35px radius)
- Pulsing glow effect
- Green (#10b981) color scheme

---

## Summary

**The Dustoff Reset UI is a single draggable window containing:**

1. **FloatingHUD (320x60px)** - Always visible control center
2. **Panels (conditional)** - Slide in below HUD with 12px gap
3. **Overlays (inline)** - Appear alongside panels for events
4. **Modals (absolute)** - Float above everything for critical decisions

**All contained in DraggableContainer** which:
- Floats at z-index 9999
- Defaults to top-right corner (60px margins)
- Auto-centers when panels expand beyond 800px width
- Can be dragged manually (disables auto-positioning)
- Respects screen boundaries at all times

**State flows from DesktopPage → Components via props**  
**Events flow from Components → DesktopPage via callbacks**

This architecture creates a cohesive, floating UI system that can be extracted for the desktop application, with the HUD always serving as the anchor point and panels appearing contextually below it.

---

**End of UI Architecture Documentation**
