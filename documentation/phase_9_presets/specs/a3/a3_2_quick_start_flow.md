# Phase 9: Presets & Quick Start
## Output A3-2: Quick Start - Architecture & Design

---

# The Quick Start Panel: 2 Clicks to Focus

## What Quick Start Accomplishes

Quick Start is the answer to Sam's feedback: "Just let me work."

| Traditional Flow | Quick Start Flow |
|------------------|------------------|
| 8 steps, ~40 seconds | 2 steps, ~5 seconds |
| Configure everything | Configure nothing |
| Decision fatigue | Two simple choices |
| Same every time | Smart defaults handle the rest |

**Quick Start is not a dumbed-down version.** It's an intelligent version that makes decisions for the user.

---

## The Two Decisions

Quick Start asks the user to make exactly two choices:

### Decision 1: Mode

```
"How intense do you want this session?"

┌─────────┐  ┌─────────┐  ┌─────────┐
│   🧘    │  │   🌊    │  │   🔥    │
│   Zen   │  │  Flow   │  │ Legend  │
│         │  │         │  │         │
│ Gentle  │  │ Balanced│  │ Intense │
└─────────┘  └─────────┘  └─────────┘
```

**Why this matters:**
- Zen = Tracking only, no interventions
- Flow = Delay gates when distracted
- Legend = Hard blocks, penalties, extensions

**The mode determines the consequence of distraction.**

### Decision 2: Duration

```
"How long do you want to focus?"

Quick options:  [15] [25] [30] [45] [60] [90]

Or use slider:
5 ─────────────●───────────────────── 120
              45 min
```

**Why this matters:**
- Shorter sessions = easier to complete, good for building habits
- Longer sessions = deeper work, but harder to finish

**The duration sets the commitment level.**

---

## Everything Else: Smart Defaults

What the user doesn't configure (and what happens instead):

| Configuration | User Action | Smart Default |
|---------------|-------------|---------------|
| Session type | None | Not needed for Quick Start |
| Whitelisted apps | None | Productivity apps auto-allowed |
| Blocked apps | None | Social/games auto-blocked |
| Whitelisted domains | None | Productivity sites auto-allowed |
| Blocked domains | None | Distracting sites auto-blocked |
| Mental preparation | None | Skipped for speed |
| Unknown apps | Asked once | "Is this for work?" prompt |

**The user makes 2 decisions. We make the other 6 for them.**

---

## Quick Start Panel: Visual Design

### Full Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ← Back                                     Quick Start  ⚡     │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  CHOOSE YOUR MODE                                               │
│                                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │                 │ │                 │ │                 │   │
│  │       🧘        │ │       🌊        │ │       🔥        │   │
│  │                 │ │                 │ │                 │   │
│  │      Zen        │ │      Flow       │ │     Legend      │   │
│  │                 │ │                 │ │                 │   │
│  │  Gentle focus   │ │  Stay on track  │ │   No escape     │   │
│  │  No penalties   │ │  Delay gates    │ │   Hard blocks   │   │
│  │                 │ │                 │ │                 │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  SET DURATION                                                   │
│                                                                 │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                          │
│  │15 │ │25 │ │30 │ │45 │ │60 │ │90 │   minutes                │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  5 ──────────────────●────────────────────────── 120    │   │
│  │                     45 min                              │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │                   Start Session                         │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Using smart defaults: productivity apps allowed,               │
│  social media & games blocked. Learn more →                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Mode Selector: Detailed Design

### Why Horizontal Layout?

| Layout | Pros | Cons |
|--------|------|------|
| Vertical stack | More room for descriptions | Takes too much space |
| Horizontal row | Compact, easy to compare | Limited text space |
| Grid (2x2) | Doesn't work with 3 options | N/A |

**Horizontal works because:**
- Only 3 options (fits comfortably)
- Modes are parallel choices (equal weight)
- Easy to visually scan left-to-right
- Natural "intensity progression" (Zen → Flow → Legend)

### Mode Card Design

```
┌─────────────────────────────────┐
│                                 │
│              🧘                 │  ← Large emoji (32-40px)
│                                 │
│             Zen                 │  ← Mode name (bold)
│                                 │
│        Gentle focus             │  ← Primary benefit
│        No penalties             │  ← Key characteristic
│                                 │
└─────────────────────────────────┘
```

### Mode Descriptions

| Mode | Primary Benefit | Key Characteristic |
|------|-----------------|-------------------|
| **Zen** | Gentle focus | No penalties |
| **Flow** | Stay on track | Delay gates |
| **Legend** | No escape | Hard blocks |

**Why these specific descriptions?**

- **Zen - "Gentle focus"**: Emphasizes the non-punitive nature
- **Zen - "No penalties"**: Clear expectation of consequences
- **Flow - "Stay on track"**: Active but supportive language
- **Flow - "Delay gates"**: Names the intervention mechanism
- **Legend - "No escape"**: Sets serious expectations
- **Legend - "Hard blocks"**: Clear that distractions are blocked

### Selection States

| State | Visual Treatment |
|-------|------------------|
| **Unselected** | Border: gray, Background: transparent |
| **Hover** | Border: mode color (light), Background: subtle tint |
| **Selected** | Border: mode color (bright), Background: mode color (10% opacity), Checkmark in corner |

### Mode Colors

| Mode | Primary Color | Rationale |
|------|---------------|-----------|
| **Zen** | Calm blue (`#60A5FA`) | Peaceful, relaxed |
| **Flow** | Purple (`#A78BFA`) | Focused, in the zone |
| **Legend** | Red/Orange (`#F87171`) | Intense, serious |

---

## Duration Selector: Detailed Design

### Dual Input Design

We offer two ways to select duration:

1. **Quick buttons** - Common durations, one tap
2. **Slider** - Fine control, any value

**Why both?**

| Method | Good For | Limitation |
|--------|----------|------------|
| Quick buttons | Speed, common values | Limited options |
| Slider | Precision, custom values | Slower, less precise |

**Together they cover all use cases.**

### Quick Duration Buttons

```
┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
│15 │ │25 │ │30 │ │45 │ │60 │ │90 │   minutes
└───┘ └───┘ └───┘ └───┘ └───┘ └───┘
```

**Why these specific values?**

| Duration | Rationale |
|----------|-----------|
| **15 min** | Quick task, low commitment |
| **25 min** | Pomodoro standard (widely known) |
| **30 min** | Half hour, common work block |
| **45 min** | Slightly longer focus block |
| **60 min** | One hour, substantial work |
| **90 min** | Deep work block (ultradian rhythm) |

**Why not 120?** It's available via slider, but not common enough for a button.

### Duration Slider

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  5 ────────────────────●──────────────────────────── 120    │
│                       45 min                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Slider specifications:**

| Property | Value | Rationale |
|----------|-------|-----------|
| Minimum | 5 minutes | Shorter is too trivial |
| Maximum | 120 minutes | Longer is unrealistic for most |
| Step | 5 minutes | Granular enough without being fiddly |
| Default | 30 minutes | Common starting point |

### Synchronization

**Quick buttons and slider are synchronized:**

```
User clicks [45] button → Slider moves to 45
User drags slider to 50 → No button highlighted (50 isn't a preset)
User drags slider to 60 → [60] button highlights
```

**Implementation:**

```typescript
const [duration, setDuration] = useState(30);

// Quick button click
const handleQuickDuration = (mins: number) => {
  setDuration(mins);
};

// Slider change
const handleSliderChange = (mins: number) => {
  setDuration(mins);
};

// Determine if a quick button should be highlighted
const isQuickDurationSelected = (mins: number) => duration === mins;
```

---

## The "Start Session" Button

### Design

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                     Start Session                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Button specifications:**

| Property | Value |
|----------|-------|
| Width | Full width (with padding) |
| Height | 48-56px (large, easy to tap) |
| Color | Mode color (changes based on selection) |
| Text | "Start Session" (clear action) |

### Button State

The button reflects the selected mode:

| Mode Selected | Button Color |
|---------------|--------------|
| Zen | Calm blue |
| Flow | Purple |
| Legend | Red/Orange |
| None selected | Gray (disabled) |

### Disabled State

Button is disabled until both mode AND duration are selected:

```typescript
const canStart = selectedMode !== null && duration > 0;
```

**Visual treatment when disabled:**
- Gray background
- Reduced opacity (50%)
- Cursor: not-allowed

---

## Smart Defaults Footer

At the bottom of the panel, we show a brief explanation:

```
Using smart defaults: productivity apps allowed,
social media & games blocked. Learn more →
```

### Why Include This?

| Purpose | Benefit |
|---------|---------|
| **Transparency** | User knows what's happening behind the scenes |
| **Trust** | Not hiding behavior, being upfront |
| **Education** | User learns what "smart defaults" means |
| **Escape hatch** | "Learn more" links to details or settings |

### "Learn More" Behavior

Clicking "Learn more" shows a tooltip or modal:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  SMART DEFAULTS                                             │
│                                                             │
│  Quick Start uses intelligent defaults so you can start    │
│  working immediately.                                       │
│                                                             │
│  ✅ Allowed:                                                │
│     VS Code, Terminal, Slack, Notion, Chrome...            │
│     github.com, docs.google.com, notion.so...              │
│                                                             │
│  ❌ Blocked:                                                │
│     Social media (Twitter, Instagram, TikTok...)           │
│     Games (Steam, Epic Games...)                           │
│     Entertainment (Netflix, Twitch...)                     │
│                                                             │
│  ⚠️ Unknown apps will ask "Is this for work?"              │
│                                                             │
│  Want full control? Use "Create New" instead.              │
│                                                             │
│                                        [Got it]            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## What Happens When "Start Session" Is Clicked

### Step 1: Build Configuration

```typescript
const handleStartSession = async () => {
  // Get smart defaults from backend
  const config = await invoke('get_quick_start_config', {
    mode: selectedMode,
    durationMinutes: duration
  });
  
  // config contains:
  // - mode: 'Flow'
  // - durationMinutes: 45
  // - whitelistedApps: ['VS Code', 'Terminal', ...]
  // - whitelistedDomains: ['github.com', ...]
  // - blockedApps: ['Steam', ...]
  // - blockedDomains: ['twitter.com', ...]
};
```

### Step 2: Save as Last Session

```typescript
// Save this configuration as "Last Session" for next time
await invoke('save_as_last_session', {
  mode: selectedMode,
  durationMinutes: duration,
  whitelistedApps: config.whitelistedApps,
  whitelistedDomains: config.whitelistedDomains,
  useDefaultBlocklist: true,
  includeMentalPrep: false
});
```

### Step 3: Start Session

```typescript
// Start the actual session
startSession({
  mode: config.mode,
  duration: config.durationMinutes,
  whitelistedApps: config.whitelistedApps,
  whitelistedDomains: config.whitelistedDomains,
  blockedApps: config.blockedApps,
  blockedDomains: config.blockedDomains
});

// Transition to active session view
setCurrentPanel('activeSession');
```

### The Full Flow

```
User clicks "Start Session"
         │
         ▼
┌─────────────────────┐
│ get_quick_start_    │
│ config()            │──── Backend builds smart defaults
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ save_as_last_       │
│ session()           │──── So "Last Session" preset works next time
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ startSession()      │──── Existing session logic
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Active Session      │──── User is now focusing
│ Panel               │
└─────────────────────┘
```

---

## State Management

### Local State (QuickStartPanel)

```typescript
interface QuickStartPanelState {
  selectedMode: SessionMode | null;  // 'Zen' | 'Flow' | 'Legend' | null
  duration: number;                   // 5-120, default 30
  isLoading: boolean;                 // True while starting session
  error: string | null;               // Error message if start fails
}
```

### Initial State

```typescript
const [selectedMode, setSelectedMode] = useState<SessionMode | null>(null);
const [duration, setDuration] = useState(30);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### Why No Global State Here?

Quick Start's state is **ephemeral**:
- Only matters while the panel is open
- Discarded when session starts
- Discarded when user goes back

**No need to persist this in global state or context.**

---

## The useQuickStart Hook

To keep the component clean, we extract logic into a hook:

### Hook Interface

```typescript
interface UseQuickStartReturn {
  // State
  selectedMode: SessionMode | null;
  duration: number;
  isLoading: boolean;
  error: string | null;
  
  // Computed
  canStart: boolean;
  buttonColor: string;
  
  // Actions
  setMode: (mode: SessionMode) => void;
  setDuration: (minutes: number) => void;
  startSession: () => Promise<void>;
}
```

### Hook Implementation

```typescript
export function useQuickStart(): UseQuickStartReturn {
  const [selectedMode, setSelectedMode] = useState<SessionMode | null>(null);
  const [duration, setDuration] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Computed values
  const canStart = selectedMode !== null && duration > 0;
  
  const buttonColor = useMemo(() => {
    switch (selectedMode) {
      case 'Zen': return 'bg-blue-500';
      case 'Flow': return 'bg-purple-500';
      case 'Legend': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  }, [selectedMode]);
  
  // Actions
  const setMode = (mode: SessionMode) => {
    setSelectedMode(mode);
    setError(null);
  };
  
  const setDurationValue = (minutes: number) => {
    setDuration(Math.min(120, Math.max(5, minutes)));
    setError(null);
  };
  
  const startSession = async () => {
    if (!canStart) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Get smart defaults
      const config = await tauriBridge.getQuickStartConfig(
        selectedMode!,
        duration
      );
      
      // 2. Save as last session
      await tauriBridge.saveAsLastSession(
        selectedMode!,
        duration,
        config.whitelistedApps,
        config.whitelistedDomains,
        true,  // useDefaultBlocklist
        false  // includeMentalPrep
      );
      
      // 3. Start session (this would call existing session logic)
      // ... session start logic ...
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    selectedMode,
    duration,
    isLoading,
    error,
    canStart,
    buttonColor,
    setMode,
    setDuration: setDurationValue,
    startSession,
  };
}
```

---

## Component Structure

### File Organization

```
src/components/presets/
├── QuickStartPanel/
│   ├── QuickStartPanel.tsx      # Main container
│   ├── ModeSelector.tsx         # Mode selection cards
│   ├── DurationSelector.tsx     # Duration buttons + slider
│   ├── SmartDefaultsInfo.tsx    # Footer explanation
│   └── index.ts                 # Exports
│
├── shared/
│   ├── ModeCard.tsx             # Reusable mode display card
│   ├── DurationButton.tsx       # Single duration quick button
│   ├── DurationSlider.tsx       # Range slider component
│   └── index.ts
│
└── index.ts
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| `QuickStartPanel` | Layout, orchestrates hook, handles navigation |
| `ModeSelector` | Renders 3 mode cards, handles selection |
| `DurationSelector` | Renders buttons + slider, syncs values |
| `SmartDefaultsInfo` | Footer text, "Learn more" modal |
| `ModeCard` | Single mode option display |
| `DurationButton` | Single duration quick-select button |
| `DurationSlider` | Range input for custom duration |

---

## Props Interfaces

### QuickStartPanel

```typescript
interface QuickStartPanelProps {
  onBack: () => void;           // Return to Entry Point
  onSessionStart: (config: QuickStartConfig) => void;  // Session started
}
```

### ModeSelector

```typescript
interface ModeSelectorProps {
  selectedMode: SessionMode | null;
  onSelect: (mode: SessionMode) => void;
}
```

### DurationSelector

```typescript
interface DurationSelectorProps {
  duration: number;
  onChange: (minutes: number) => void;
  quickOptions?: number[];  // Default: [15, 25, 30, 45, 60, 90]
  min?: number;             // Default: 5
  max?: number;             // Default: 120
  step?: number;            // Default: 5
}
```

### ModeCard

```typescript
interface ModeCardProps {
  mode: SessionMode;
  icon: string;
  title: string;
  primaryBenefit: string;
  keyCharacteristic: string;
  isSelected: boolean;
  onClick: () => void;
}
```

---

## Keyboard Navigation

### Quick Start Panel Shortcuts

| Key | Action |
|-----|--------|
| `1` | Select Zen mode |
| `2` | Select Flow mode |
| `3` | Select Legend mode |
| `Tab` | Move focus between elements |
| `Enter` | Activate focused element / Start session |
| `Escape` | Go back to Entry Point |
| `←` `→` | Adjust slider when focused |

### Implementation

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case '1':
        setMode('Zen');
        break;
      case '2':
        setMode('Flow');
        break;
      case '3':
        setMode('Legend');
        break;
      case 'Escape':
        onBack();
        break;
      case 'Enter':
        if (canStart && !isLoading) {
          startSession();
        }
        break;
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [canStart, isLoading, setMode, onBack, startSession]);
```

---

## Error Handling

### What Can Go Wrong?

| Error | Cause | User Message |
|-------|-------|--------------|
| Backend unreachable | Tauri bridge issue | "Unable to connect. Please restart the app." |
| Database error | SQLite issue | "Something went wrong. Please try again." |
| Invalid configuration | Bug in our code | "Configuration error. Please try Create New instead." |

### Error Display

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ⚠️ Unable to start session                                 │
│                                                             │
│  Something went wrong. Please try again.                    │
│                                                             │
│  [Try Again]                          [Use Create New]      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Error State in Hook

```typescript
// In useQuickStart
const startSession = async () => {
  try {
    // ... start session logic ...
  } catch (err) {
    console.error('Quick Start failed:', err);
    
    // User-friendly message
    if (err instanceof Error && err.message.includes('database')) {
      setError('Something went wrong. Please try again.');
    } else {
      setError('Unable to start session. Please restart the app.');
    }
  }
};
```

---

## Integration with Existing Session Flow

### Where Quick Start Connects

Quick Start needs to eventually call the existing session start logic:

```
Quick Start Panel
        │
        ▼
useQuickStart.startSession()
        │
        ▼
Build QuickStartConfig
        │
        ▼
Save as Last Session
        │
        ▼
┌─────────────────────────────────────────────┐
│                                             │
│   EXISTING SESSION LOGIC                    │
│                                             │
│   - Initialize session state                │
│   - Start app monitoring                    │
│   - Start timer                             │
│   - Show active session panel               │
│                                             │
└─────────────────────────────────────────────┘
```

### The Handoff

Quick Start produces a `QuickStartConfig` object:

```typescript
interface QuickStartConfig {
  mode: SessionMode;
  durationMinutes: number;
  whitelistedApps: string[];
  whitelistedDomains: string[];
  blockedApps: string[];
  blockedDomains: string[];
}
```

This config contains everything the existing session logic needs. The existing code doesn't know (or care) that it came from Quick Start vs Create New.

**This is important:** We're not rewriting session logic. We're providing a new way to configure it.

---

## Testing Considerations

### What to Test

| Test | What It Verifies |
|------|------------------|
| Mode selection | Clicking mode card updates state |
| Duration quick buttons | Clicking button updates duration |
| Duration slider | Dragging slider updates duration |
| Button sync | Slider and buttons stay in sync |
| Start button disabled | Can't start without mode selected |
| Start button color | Changes based on selected mode |
| Keyboard shortcuts | 1, 2, 3 select modes |
| Back button | Returns to Entry Point |
| Session starts | Clicking Start creates session |

### Testing Checklist

```
[ ] Select Zen → Button turns blue
[ ] Select Flow → Button turns purple
[ ] Select Legend → Button turns red
[ ] Click [30] → Slider moves to 30
[ ] Drag slider to 45 → [45] button highlights
[ ] Press "1" key → Zen selected
[ ] Press "2" key → Flow selected
[ ] Press "3" key → Legend selected
[ ] Press Escape → Returns to Entry Point
[ ] Click Start → Session begins
[ ] No mode selected → Start button disabled
```

---

## Summary: A3-2 Key Takeaways

1. **Quick Start = 2 decisions** - Mode and Duration, nothing else
2. **Smart defaults handle the rest** - Backend provides whitelists/blocklists
3. **Mode selector is horizontal** - 3 cards with emoji, title, descriptions
4. **Duration has dual input** - Quick buttons + slider, synchronized
5. **Start button reflects mode** - Color changes based on selection
6. **useQuickStart hook** - Encapsulates all logic, keeps component clean
7. **Saves as Last Session** - So next time user can use preset
8. **Connects to existing session logic** - Not a rewrite, just new config path

