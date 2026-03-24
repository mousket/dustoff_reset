# Phase 9: Presets & Quick Start
## Output A3-1: Entry Point - Architecture & Design

---

# The Problem: Too Many Steps to Start Working

## What Happens Today

When a user clicks the Play button on the HUD, they enter a wizard:

```
Current Flow (8 Steps)
──────────────────────────────────────────────────────────

Step 1: Choose Session Type
        [Deep Work] [Parking Lot] [Administrative]
                            │
                            ▼
Step 2: Choose Mode
        [Zen] [Flow] [Legend]
                            │
                            ▼
Step 3: Set Duration
        [Slider: 5 min ──────── 90 min]
                            │
                            ▼
Step 4: Whitelist Apps
        [Select which apps are allowed...]
                            │
                            ▼
Step 5: Whitelist Websites
        [Select which domains are allowed...]
                            │
                            ▼
Step 6: Mental Preparation (Page 1)
        [Set your intention...]
                            │
                            ▼
Step 7: Mental Preparation (Page 2)
        [Take a breath, grab water...]
                            │
                            ▼
Step 8: Start Session
        [Begin]
```

**That's 8 steps before doing actual work.**

---

## Why This Is a Problem

### Problem 1: Friction Kills Habit Formation

Every extra click is a chance for the user to abandon the process.

| Clicks | Abandonment Risk |
|--------|------------------|
| 1-2 | Low - feels instant |
| 3-4 | Medium - starting to feel tedious |
| 5-6 | High - "do I really need this?" |
| 7-8 | Very High - "I'll just work without it" |

**If users don't use the app, they don't build focus habits.**

### Problem 2: Repeat Configuration is Wasteful

Consider a developer who does the same type of work every day:

```
Monday:    Legend mode, 90 min, VS Code + Terminal, github.com
Tuesday:   Legend mode, 90 min, VS Code + Terminal, github.com
Wednesday: Legend mode, 90 min, VS Code + Terminal, github.com
Thursday:  Legend mode, 90 min, VS Code + Terminal, github.com
Friday:    Legend mode, 90 min, VS Code + Terminal, github.com
```

**They're configuring the same thing 5 times per week.**

That's 40 clicks per week wasted on configuration they've already done.

### Problem 3: One Size Doesn't Fit All

Different users have different needs:

| User | What They Want | Current Experience |
|------|----------------|-------------------|
| **Sam** (Speed Dev) | "Just let me work" | Forced through 8 steps |
| **Repeat User** | "Same as yesterday" | Must reconfigure everything |
| **New User** | "Help me set up" | This actually works for them |

**We're optimizing for new users at the expense of everyone else.**

---

## The Solution: A Decision Point

Instead of one path for everyone, let users choose their path upfront.

### The New Flow

```
New Flow (Choice-Based)
──────────────────────────────────────────────────────────

User clicks Play
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│                                                         │
│        "How do you want to start?"                      │
│                                                         │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│   │             │ │             │ │             │      │
│   │ ⚡ QUICK    │ │ 📁 USE      │ │ ✨ CREATE   │      │
│   │   START    │ │   PRESET    │ │    NEW      │      │
│   │             │ │             │ │             │      │
│   │ 2 clicks   │ │ 1 click     │ │ Full wizard │      │
│   │             │ │             │ │             │      │
│   └─────────────┘ └─────────────┘ └─────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
   Quick Start         Preset Picker       Full Wizard
   (2 more steps)      (1 more step)       (8 steps)
```

---

## The Three Paths Explained

### Path 1: Quick Start ⚡

**Who it's for:** Users who want to start immediately with sensible defaults.

**The Promise:** 2 clicks to session.

```
Quick Start Flow
──────────────────────────────────────────────────────────

Step 1: Choose Mode
        ┌─────────┐ ┌─────────┐ ┌─────────┐
        │   🧘    │ │   🌊    │ │   🔥    │
        │   Zen   │ │  Flow   │ │ Legend  │
        └─────────┘ └─────────┘ └─────────┘
                            │
                            ▼
Step 2: Choose Duration
        [15] [25] [30] [45] [60] [90]
        
        ───────────●─────────────────
        5 min              90 min
                            │
                            ▼
        ┌─────────────────────────────┐
        │      [ Start Session ]      │
        └─────────────────────────────┘
```

**What's skipped:**
- Session type selection (not needed)
- App whitelisting (uses smart defaults)
- Domain whitelisting (uses smart defaults)
- Mental preparation (skipped for speed)

**What's used instead:**
- Default whitelist (productivity apps allowed)
- Default blocklist (social media, games blocked)
- "Is this for work?" prompt for unknown apps

### Path 2: Use Preset 📁

**Who it's for:** Users who have saved configurations they want to reuse.

**The Promise:** 1 click to session.

```
Use Preset Flow
──────────────────────────────────────────────────────────

Step 1: Pick a Preset
        
        RECENT
        ┌─────────────────────────────────────────────┐
        │ 🔄 Last Session    Flow | 45 min   [Start] │
        └─────────────────────────────────────────────┘
        
        MY PRESETS
        ┌─────────────────────────────────────────────┐
        │ 🔥 Deep Coding    Legend | 90 min  [Start] │
        │ 📧 Email Time     Zen | 30 min     [Start] │
        └─────────────────────────────────────────────┘
        
        SUGGESTED
        ┌─────────────────────────────────────────────┐
        │ 🧘 Quick Focus    Zen | 25 min     [Start] │
        │ 🌊 Deep Work      Flow | 60 min    [Start] │
        └─────────────────────────────────────────────┘
                            │
                            ▼ (user clicks Start)
                            
        Session Begins Immediately
```

**What's skipped:**
- Everything! The preset contains all configuration.

**What's used:**
- Saved preset settings (mode, duration, whitelists)
- Preset's mental prep setting (on or off based on what was saved)

### Path 3: Create New ✨

**Who it's for:** First-time users or users creating a new session type.

**The Promise:** Full control over configuration.

```
Create New Flow
──────────────────────────────────────────────────────────

Step 1: Choose Mode
        [Zen] [Flow] [Legend]
                │
                ▼
Step 2: Set Duration
        [Slider]
                │
                ▼
Step 3: Whitelist Apps
        [App selection]
                │
                ▼
Step 4: Whitelist Websites
        [Domain selection]
                │
                ▼
Step 5: Mental Preparation (Optional)
        [Intention setting]
        [Skip button at bottom]
                │
                ▼
Step 6: Save as Preset? (NEW)
        "Save these settings for next time?"
        [Name: ____________]
        [Save & Start] [Just Start]
```

**What's new:**
- "Skip" option on mental preparation
- "Save as Preset?" prompt before starting

---

## Why This Design Works

### Principle 1: Self-Selection

Users know what they need. Let them choose.

| User Intent | They Choose | Result |
|-------------|-------------|--------|
| "I'm in a hurry" | Quick Start | 2 clicks, done |
| "Same as yesterday" | Last Session preset | 1 click, done |
| "I have a preset for this" | Their preset | 1 click, done |
| "This is a new type of work" | Create New | Full configuration |

### Principle 2: Progressive Disclosure

Don't show complexity until it's needed.

```
Entry Point shows:     3 simple options
Quick Start shows:     Mode + Duration only
Preset Picker shows:   Just the presets
Create New shows:      Full configuration
```

**Each path reveals only what's necessary for that path.**

### Principle 3: Sensible Defaults

Quick Start works because we've done the thinking for the user.

| Decision | Our Default | Why |
|----------|-------------|-----|
| Which apps are productive? | VS Code, Terminal, Notion, etc. | Pattern matching + categorization |
| Which apps are distracting? | Steam, Twitter app, etc. | Pattern matching + categorization |
| Which sites are productive? | github.com, docs.google.com, etc. | Curated list |
| Which sites are distracting? | twitter.com, netflix.com, etc. | Curated list |

**The user doesn't configure anything, but gets reasonable behavior.**

### Principle 4: Learning System

Quick Start gets better over time.

```
Session 1: User opens Discord → Prompt: "Is this for work?"
           User: "Yes" → Discord whitelisted
           
Session 2: User opens Discord → No prompt, already whitelisted

Session 5: System knows user's workflow perfectly
```

---

## Entry Point Panel: Detailed Design

### Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    DUSTOFF RESET                                │
│                                                                 │
│           How do you want to start?                             │
│                                                                 │
│   ┌─────────────────┐                                          │
│   │                 │                                          │
│   │       ⚡        │  Quick Start                             │
│   │                 │  Smart defaults, 2 clicks to focus       │
│   │                 │                                          │
│   └─────────────────┘                                          │
│                                                                 │
│   ┌─────────────────┐                                          │
│   │                 │                                          │
│   │       📁        │  Use Preset                              │
│   │                 │  Start from a saved configuration        │
│   │                 │                                          │
│   └─────────────────┘                                          │
│                                                                 │
│   ┌─────────────────┐                                          │
│   │                 │                                          │
│   │       ✨        │  Create New                              │
│   │                 │  Full configuration wizard               │
│   │                 │                                          │
│   └─────────────────┘                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Why Vertical Stack (Not Horizontal)?

| Layout | Pros | Cons |
|--------|------|------|
| Horizontal (3 columns) | Compact, all visible at once | Text gets cramped, hard to scan |
| Vertical (3 rows) | Easy to scan, room for descriptions | Takes more vertical space |

**We chose vertical because:**
1. The HUD window is already vertically oriented
2. Descriptions help users understand each option
3. Scanning top-to-bottom is natural
4. Touch targets are larger (better for trackpad users)

### Option Card Design

Each option is a card with:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ┌──────┐                                                     │
│   │      │                                                     │
│   │  ⚡  │   Quick Start                    ← Title            │
│   │      │   Smart defaults, 2 clicks      ← Description       │
│   └──────┘                                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
    ▲                ▲                            ▲
    │                │                            │
   Icon           Title                     Description
  (Large)        (Bold)                    (Subtle, gray)
```

### Interactive States

| State | Visual Treatment |
|-------|------------------|
| **Default** | Border: subtle gray, Background: transparent |
| **Hover** | Border: cyan/blue, Background: subtle blue tint |
| **Active/Pressed** | Border: bright cyan, Background: deeper blue tint |
| **Focused (keyboard)** | Ring: cyan outline for accessibility |

### Keyboard Navigation

```
Tab       → Move focus to next option
Shift+Tab → Move focus to previous option
Enter     → Select focused option
1, 2, 3   → Quick select (1=Quick Start, 2=Preset, 3=Create New)
Escape    → Close panel, return to HUD
```

---

## Entry Point Panel: Behavior

### When Does It Appear?

**Trigger:** User clicks the Play button on the HUD.

**Animation:** Panel slides up from the HUD or fades in (consistent with existing panel transitions).

### What Happens After Selection?

| Selection | Next Panel | Transition |
|-----------|------------|------------|
| Quick Start | QuickStartPanel | Slide left |
| Use Preset | PresetPickerPanel | Slide left |
| Create New | (Existing wizard flow) | Slide left |

### Can User Go Back?

**Yes.** Each subsequent panel has a back button that returns to the Entry Point.

```
Entry Point → Quick Start → [Back] → Entry Point
Entry Point → Preset Picker → [Back] → Entry Point
Entry Point → Create New Wizard → [Back] → Entry Point
```

---

## Handling Edge Cases

### Edge Case 1: No Presets Exist Yet

**Scenario:** New user, no saved presets, no last session.

**Behavior:** "Use Preset" option still appears, but shows a helpful message when clicked:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   SUGGESTED PRESETS                                             │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │ 🧘 Quick Focus    Zen | 25 min                 [Start]  │  │
│   │ 🌊 Deep Work      Flow | 60 min                [Start]  │  │
│   │ 🔥 Coding Sprint  Legend | 90 min              [Start]  │  │
│   │ 📧 Admin & Email  Zen | 30 min                 [Start]  │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ─────────────────────────────────────────────────────────    │
│                                                                 │
│   MY PRESETS                                                    │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                                                         │  │
│   │   You don't have any saved presets yet.                 │  │
│   │                                                         │  │
│   │   Complete a session with "Create New" to save one,     │  │
│   │   or try one of our suggested presets above!            │  │
│   │                                                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**The default presets ensure users always have something to choose.**

### Edge Case 2: User Clicks Back After Partial Configuration

**Scenario:** User goes to Create New, configures mode and duration, then clicks Back.

**Behavior:** Configuration is discarded. User returns to Entry Point with clean state.

**Rationale:** 
- Simplicity over complexity
- Users can easily re-select options
- Prevents confusing "partial state" bugs

### Edge Case 3: Session Already Active

**Scenario:** User clicks Play while a session is running.

**Behavior:** Entry Point does NOT appear. Instead, show the active session panel.

**Check:** Before showing Entry Point, verify no active session exists.

```typescript
const handlePlayClick = () => {
  if (activeSession) {
    showActiveSessionPanel();
  } else {
    showEntryPointPanel();
  }
};
```

### Edge Case 4: App Just Launched (First Time Ever)

**Scenario:** User installed app, first time opening.

**Special Behavior:**
1. Show Entry Point (same as normal)
2. Optionally highlight "Create New" with a subtle tooltip: "First time? Start here!"
3. Default presets are already populated (from A2 defaults)

---

## Information Architecture

### Panel Hierarchy

```
HUD (Always Visible)
│
├── Play Button Clicked
│   │
│   └── EntryPointPanel
│       │
│       ├── Quick Start Selected
│       │   └── QuickStartPanel
│       │       └── Session Starts
│       │
│       ├── Use Preset Selected
│       │   └── PresetPickerPanel
│       │       └── Session Starts
│       │
│       └── Create New Selected
│           └── CreateNewWizard (Existing)
│               ├── Step 1: Mode
│               ├── Step 2: Duration
│               ├── Step 3: Apps
│               ├── Step 4: Domains
│               ├── Step 5: Mental Prep (with Skip)
│               ├── Step 6: Save as Preset? (NEW)
│               └── Session Starts
```

### Navigation Flow

```
                    ┌───────────────┐
                    │               │
           ┌────────│  Entry Point  │────────┐
           │        │               │        │
           │        └───────────────┘        │
           │                │                │
           ▼                ▼                ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │             │  │             │  │             │
    │ Quick Start │  │   Preset    │  │  Create     │
    │   Panel     │  │   Picker    │  │  New Wizard │
    │             │  │             │  │             │
    └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
           │                │                │
           │                │                │
           ▼                ▼                ▼
    ┌─────────────────────────────────────────────┐
    │                                             │
    │              Active Session                 │
    │                                             │
    └─────────────────────────────────────────────┘
```

---

## Component Structure

### EntryPointPanel Component

```
EntryPointPanel/
├── EntryPointPanel.tsx      # Main container
├── EntryOptionCard.tsx      # Reusable option card
└── index.ts                 # Exports
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| `EntryPointPanel` | Layout, state management, navigation |
| `EntryOptionCard` | Display single option, handle click/hover/focus |

### Props Interface

```typescript
// EntryPointPanel
interface EntryPointPanelProps {
  onSelectQuickStart: () => void;
  onSelectPreset: () => void;
  onSelectCreateNew: () => void;
  onClose: () => void;
}

// EntryOptionCard
interface EntryOptionCardProps {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
  shortcutKey?: string;  // "1", "2", "3" for keyboard shortcuts
}
```

---

## Connection to Existing Code

### Where Entry Point Fits in App.tsx

**Current structure (simplified):**

```typescript
// Current App.tsx (simplified)
function App() {
  const [currentPanel, setCurrentPanel] = useState<PanelType>('hud');
  
  return (
    <>
      {currentPanel === 'hud' && <HUD onPlay={handlePlay} />}
      {currentPanel === 'modeSelect' && <ModeSelectPanel />}
      {/* ... more panels */}
    </>
  );
}

const handlePlay = () => {
  setCurrentPanel('modeSelect');  // Goes directly to wizard
};
```

**New structure:**

```typescript
// New App.tsx (simplified)
function App() {
  const [currentPanel, setCurrentPanel] = useState<PanelType>('hud');
  
  return (
    <>
      {currentPanel === 'hud' && <HUD onPlay={handlePlay} />}
      {currentPanel === 'entryPoint' && (
        <EntryPointPanel
          onSelectQuickStart={() => setCurrentPanel('quickStart')}
          onSelectPreset={() => setCurrentPanel('presetPicker')}
          onSelectCreateNew={() => setCurrentPanel('modeSelect')}
          onClose={() => setCurrentPanel('hud')}
        />
      )}
      {currentPanel === 'quickStart' && <QuickStartPanel />}
      {currentPanel === 'presetPicker' && <PresetPickerPanel />}
      {currentPanel === 'modeSelect' && <ModeSelectPanel />}
      {/* ... more panels */}
    </>
  );
}

const handlePlay = () => {
  setCurrentPanel('entryPoint');  // NEW: Goes to entry point first
};
```

### Panel Type Updates

```typescript
// Current
type PanelType = 'hud' | 'modeSelect' | 'duration' | 'apps' | 'domains' | ...;

// New
type PanelType = 
  | 'hud' 
  | 'entryPoint'      // NEW
  | 'quickStart'      // NEW
  | 'presetPicker'    // NEW
  | 'modeSelect' 
  | 'duration' 
  | 'apps' 
  | 'domains' 
  | ...;
```

---

## Summary: A3-1 Key Takeaways

1. **The problem is friction** - 8 steps is too many for repeat users
2. **The solution is choice** - Let users self-select their path
3. **Three paths serve three needs** - Quick (speed), Preset (repeat), Create (control)
4. **Entry Point is the decision point** - First thing users see after clicking Play
5. **Vertical card layout** - Easy to scan, room for descriptions
6. **Keyboard accessible** - Tab navigation + number shortcuts
7. **Edge cases handled** - No presets, back button, active session
