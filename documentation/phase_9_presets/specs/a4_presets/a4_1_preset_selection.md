# Phase 9: Presets & Quick Start
## Output A4-1: Preset Selection - Architecture & Design

---

# The Preset Picker: One Click to Focus

## What We're Building

The Preset Picker is where users browse and select saved configurations. It's the second path from the Entry Point - for users who want to reuse previous settings.

```
Entry Point
    │
    ├── Quick Start ──────► (Built in A3-2 ✅)
    │
    ├── Use Preset ───────► Preset Picker Panel (THIS DOCUMENT)
    │
    └── Create New ───────► Existing wizard
```

---

## The Problem It Solves

### Without Presets

```
Monday:    Configure Legend, 90 min, VS Code, github.com... (40 seconds)
Tuesday:   Configure Legend, 90 min, VS Code, github.com... (40 seconds)
Wednesday: Configure Legend, 90 min, VS Code, github.com... (40 seconds)
```

**Same configuration, repeated daily.**

### With Presets

```
Monday:    Click "Deep Coding" preset (1 second)
Tuesday:   Click "Deep Coding" preset (1 second)
Wednesday: Click "Deep Coding" preset (1 second)
```

**One click, same result.**

---

## The Three Sections

The Preset Picker organizes presets into three clear sections:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ← Back                              Use Preset  📁             │
│                                                                 │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  RECENT                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔄 Last Session       Flow | 45 min            [Start]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  MY PRESETS                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔥 Deep Coding        Legend | 90 min          [Start]  │   │
│  │ 📧 Email Time         Zen | 30 min             [Start]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  SUGGESTED                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🧘 Quick Focus        Zen | 25 min             [Start]  │   │
│  │ 🌊 Deep Work          Flow | 60 min            [Start]  │   │
│  │ 🔥 Coding Sprint      Legend | 90 min          [Start]  │   │
│  │ 📧 Admin & Email      Zen | 30 min             [Start]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Section Breakdown

### Section 1: Recent

**Purpose:** Instant replay of the last session.

**Contents:**
- "Last Session" preset (auto-saved after every session)

**When visible:**
- Only when a Last Session exists
- Hidden on first app launch (no sessions yet)

**Why it's first:**
- Most common use case: "Same as yesterday"
- Reduces cognitive load (no scanning needed)
- One click to repeat

### Section 2: My Presets

**Purpose:** User-created custom configurations.

**Contents:**
- User's saved presets (max 5)
- Sorted by most recently used

**When visible:**
- Always visible (even when empty)
- Shows empty state message when no presets exist

**Why it's second:**
- User's own presets are more relevant than defaults
- Personal investment = higher likelihood of use

### Section 3: Suggested

**Purpose:** Ready-to-use presets for common scenarios.

**Contents:**
- Default presets we ship (4 presets)
- Cannot be edited or deleted

**When visible:**
- Always visible

**Why it's last:**
- Fallback for users without custom presets
- Inspiration for creating custom presets
- Always available starting point

---

## Why This Order?

The order follows **frequency of use**:

```
Most Used ─────────────────────────────► Least Used

┌──────────┐    ┌──────────┐    ┌──────────┐
│  Recent  │ → │My Presets│ → │ Suggested │
│          │    │          │    │          │
│ "Same as │    │ "My      │    │ "Give me │
│ yesterday"│    │ workflow"│    │  ideas"  │
└──────────┘    └──────────┘    └──────────┘
```

**Research insight:** Users scan top-to-bottom. Put the most likely choice at the top.

---

## Empty States

### State 1: No Last Session (First Launch)

The "Recent" section is hidden entirely:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  MY PRESETS                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │   You don't have any saved presets yet.                 │   │
│  │                                                         │   │
│  │   Complete a session with "Create New" to save one,     │   │
│  │   or try one of our suggested presets below!            │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  SUGGESTED                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🧘 Quick Focus        Zen | 25 min             [Start]  │   │
│  │ 🌊 Deep Work          Flow | 60 min            [Start]  │   │
│  │ 🔥 Coding Sprint      Legend | 90 min          [Start]  │   │
│  │ 📧 Admin & Email      Zen | 30 min             [Start]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Why hide Recent instead of showing empty state?**
- "No last session" is obvious on first launch
- Showing an empty section adds noise
- Better to guide users to Suggested presets

### State 2: Has Last Session, No User Presets

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  RECENT                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔄 Last Session       Flow | 45 min            [Start]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  MY PRESETS                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │   No saved presets yet.                                 │   │
│  │   Use "Create New" to build and save your own!          │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  SUGGESTED                                                      │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### State 3: Everything Populated

The full view shown at the beginning of this document.

---

## Loading State

While presets are being fetched from the backend:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ← Back                              Use Preset  📁             │
│                                                                 │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  RECENT                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  MY PRESETS                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  SUGGESTED                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Skeleton loaders:**
- Show section headers (known structure)
- Animated gray bars for content
- Gives sense of progress

**Why skeleton over spinner?**
- Reduces perceived wait time
- Shows structure before content
- Feels more responsive

---

## Error State

If preset loading fails:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ← Back                              Use Preset  📁             │
│                                                                 │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │                        ⚠️                                │   │
│  │                                                         │   │
│  │          Couldn't load your presets                     │   │
│  │                                                         │   │
│  │   Something went wrong. Please try again.               │   │
│  │                                                         │   │
│  │                   [Try Again]                           │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### When Panel Opens

```
PresetPickerPanel mounts
         │
         ▼
usePresets hook initializes
         │
         ▼
Call: tauriBridge.getAllPresets()
         │
         ▼
Backend: get_all_presets command
         │
         ▼
Returns: {
  lastSession: SessionPreset | null,
  userPresets: SessionPreset[],
  defaultPresets: SessionPreset[]
}
         │
         ▼
Hook updates state
         │
         ▼
Panel renders sections based on data
```

### When User Clicks Start

```
User clicks Start on a preset
         │
         ▼
Call: tauriBridge.usePreset(id)
         │
         ▼
Backend: Records usage (updates last_used_at, usage_count)
         │
         ▼
Returns: Full preset object
         │
         ▼
onSelectPreset callback fires
         │
         ▼
Parent component starts session with preset config
```

---

## Component Structure

### PresetPickerPanel

The main container that orchestrates everything:

```
PresetPickerPanel/
├── PresetPickerPanel.tsx      # Main container
├── PresetSection.tsx          # Section header + content wrapper
├── PresetSkeleton.tsx         # Loading skeleton
├── EmptyPresets.tsx           # Empty state message
└── index.ts                   # Exports
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| `PresetPickerPanel` | Layout, data fetching via hook, navigation |
| `PresetSection` | Section header styling, content wrapper |
| `PresetSkeleton` | Animated loading placeholder |
| `EmptyPresets` | Empty state messaging |
| `PresetCard` | Individual preset display (covered in A4-2) |

---

## PresetSection Component

A reusable wrapper for each section:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  SECTION TITLE                                    (optional)   │
│  ───────────────────────────────────────────────────────────   │
│                                                                 │
│  [Content goes here - cards, empty state, or skeleton]         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Props

```typescript
interface PresetSectionProps {
  title: string;              // "RECENT", "MY PRESETS", "SUGGESTED"
  badge?: string;             // Optional count badge "3"
  children: React.ReactNode;  // Section content
  hidden?: boolean;           // Don't render at all
}
```

### Visual Design

| Element | Styling |
|---------|---------|
| Title | Uppercase, small, gray, tracking-wide |
| Badge | Small pill, subtle background |
| Divider | Thin gray line below title |
| Content | Padded below divider |

---

## Panel Layout

### Header

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ← Back                              Use Preset  📁             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- Back button (left) - returns to Entry Point
- Title with icon (right) - identifies the panel

### Content Area

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [Scrollable area containing all sections]                      │
│                                                                 │
│  - RECENT section                                               │
│  - MY PRESETS section                                           │
│  - SUGGESTED section                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- Scrollable if content exceeds viewport
- Sections stack vertically
- Consistent padding throughout

---

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Escape` | Go back to Entry Point |
| `Tab` | Move focus through preset cards |
| `Enter` | Start focused preset |
| `↑` / `↓` | Move focus between presets |

### Focus Management

```
Tab order:
1. Back button
2. First preset in Recent
3. First preset in My Presets
4. Second preset in My Presets
5. ... (continue through My Presets)
6. First preset in Suggested
7. ... (continue through Suggested)
```

---

## Connection to usePresets Hook

The PresetPickerPanel uses the `usePresets` hook we created in B3-1:

```typescript
const {
  lastSession,        // SessionPreset | null
  userPresets,        // SessionPreset[]
  defaultPresets,     // SessionPreset[]
  isLoading,          // boolean
  error,              // string | null
  hasLastSession,     // boolean (computed)
  hasUserPresets,     // boolean (computed)
  refreshPresets,     // () => Promise<void>
  usePreset,          // (id: string) => Promise<SessionPreset>
} = usePresets();
```

### Mapping to Sections

| Section | Data Source | Condition |
|---------|-------------|-----------|
| Recent | `lastSession` | Show if `hasLastSession` |
| My Presets | `userPresets` | Always show (may be empty) |
| Suggested | `defaultPresets` | Always show |

---

## Interaction: Starting a Preset

When user clicks Start on any preset:

```typescript
const handleStartPreset = async (preset: SessionPreset) => {
  try {
    // 1. Record usage (increments count, updates last_used_at)
    await usePreset(preset.id);
    
    // 2. Notify parent to start session
    onSelectPreset(preset);
    
  } catch (error) {
    // Show error toast or message
    console.error('Failed to start preset:', error);
  }
};
```

### What Happens Next

The parent component (App.tsx or navigation controller) receives the preset and:

1. Extracts session configuration from preset
2. Starts the session with that configuration
3. Transitions to active session view

---

## Sorting Logic

### My Presets Order

Sorted by most recently used, then by creation date:

```sql
ORDER BY last_used_at DESC NULLS LAST, created_at DESC
```

**Why this order?**
- Most relevant presets bubble to top
- New presets appear at top until used
- Frequently used presets stay accessible

### Suggested Presets Order

Sorted alphabetically by name:

```sql
ORDER BY name ASC
```

**Why alphabetical?**
- Consistent, predictable order
- Easy to scan
- No "favorite" among defaults

---

## Visual Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  HEADER ───────────────────────────────────── Prominent         │
│                                                                 │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  RECENT ─────────────────────────────────────── Highlighted     │
│  [Last Session card with emphasis]                              │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  MY PRESETS ──────────────────────────────────── Standard       │
│  [User preset cards]                                            │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  SUGGESTED ──────────────────────────────────── Subtle          │
│  [Default preset cards, slightly muted]                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Visual Differentiation

| Section | Treatment |
|---------|-----------|
| Recent | Subtle highlight background, "Last Session" badge |
| My Presets | Standard styling, user's icons |
| Suggested | Slightly muted, system icons |

This creates visual priority without being heavy-handed.

---

## Props Interface

### PresetPickerPanel

```typescript
interface PresetPickerPanelProps {
  onBack: () => void;                           // Return to Entry Point
  onSelectPreset: (preset: SessionPreset) => void;  // Preset selected, start session
}
```

### Parent Usage

```typescript
<PresetPickerPanel
  onBack={() => setCurrentPanel('entryPoint')}
  onSelectPreset={(preset) => {
    startSessionFromPreset(preset);
    setCurrentPanel('activeSession');
  }}
/>
```

---

## Summary: A4-1 Key Takeaways

1. **Three sections** - Recent, My Presets, Suggested (in priority order)
2. **Recent is conditional** - Hidden when no Last Session exists
3. **My Presets shows empty state** - Guides users to Create New
4. **Suggested is always visible** - Fallback and inspiration
5. **Loading state uses skeletons** - Reduces perceived wait time
6. **Uses existing usePresets hook** - Data management already built
7. **Start records usage** - Keeps Most Recently Used sorting accurate
8. **Keyboard navigable** - Tab through presets, Enter to start
