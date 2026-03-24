# Phase 9: Presets & Quick Start
## Output A4-2: Preset Cards & Actions - Architecture & Design

---

# The Preset Card: Your Saved Session at a Glance

## What a Preset Card Shows

Each preset is displayed as a card containing everything the user needs to recognize and start it:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🔥  Deep Coding                                                │
│                                                                 │
│      Legend  •  90 min                                          │
│                                                                 │
│                                           [Start]    [•••]     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Card Anatomy

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [Icon]  [Name]                                    [Actions]    │
│                                                                 │
│          [Mode Badge]  •  [Duration]                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

     │        │              │           │              │
     │        │              │           │              │
     ▼        ▼              ▼           ▼              ▼
   Emoji   Preset         Session      Time         Start +
   chosen  name           mode         length       More menu
   by user
```

### Element Details

| Element | Content | Purpose |
|---------|---------|---------|
| **Icon** | Emoji (🔥, 🧘, etc.) | Visual recognition, personality |
| **Name** | "Deep Coding" | Identifies the preset |
| **Mode Badge** | "Legend" | Shows intensity level |
| **Duration** | "90 min" | Shows time commitment |
| **Start Button** | Primary action | One click to begin |
| **More Menu** | Edit, Delete | Secondary actions (user presets only) |

---

## Card Variants

### Variant 1: Last Session Card

Special styling to stand out in the Recent section:

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │  🔄  Last Session                              [Start]      │ │
│ │                                                             │ │
│ │      Flow  •  45 min                                        │ │
│ │                                                             │ │
│ │      ────────────────────────────────────────────────────   │ │
│ │      VS Code, Terminal, Chrome  •  github.com, notion.so    │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Differences from standard card:**
- Subtle background highlight
- Shows whitelisted apps/domains preview
- No "more" menu (can't edit/delete Last Session)
- Larger touch target

**Why show app preview?**
- Reminds user what they configured
- Confirms it's the right session to repeat
- "Oh right, I was working on that React project"

### Variant 2: User Preset Card

Standard card with full actions:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🔥  Deep Coding                                                │
│                                                                 │
│      Legend  •  90 min                                          │
│                                                                 │
│                                           [Start]    [•••]     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Start button (primary action)
- More menu with Edit and Delete
- User's chosen icon and name

### Variant 3: Default Preset Card

System presets with limited actions:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🧘  Quick Focus                                    [Start]     │
│                                                                 │
│      Zen  •  25 min                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Differences from user preset:**
- No "more" menu (can't edit/delete defaults)
- Slightly muted styling
- Same Start functionality

---

## Mode Badge Styling

The mode badge uses color to indicate intensity:

| Mode | Badge Color | Background |
|------|-------------|------------|
| **Zen** | Blue text | Blue/10% opacity |
| **Flow** | Purple text | Purple/10% opacity |
| **Legend** | Red text | Red/10% opacity |

```
┌───────────┐   ┌───────────┐   ┌───────────┐
│    Zen    │   │   Flow    │   │  Legend   │
│  (blue)   │   │ (purple)  │   │   (red)   │
└───────────┘   └───────────┘   └───────────┘
```

**Why color-code modes?**
- Instant recognition without reading
- Consistent with Quick Start mode selector
- Visual hierarchy (Legend = attention-grabbing red)

---

## The Start Button

### Design

```
┌─────────────┐
│    Start    │
└─────────────┘
```

| Property | Value |
|----------|-------|
| Size | Compact (fits in card) |
| Color | Cyan/teal (consistent with app) |
| Shape | Rounded rectangle |
| State | Solid when idle, darker on hover |

### States

| State | Visual |
|-------|--------|
| **Default** | Cyan background, white text |
| **Hover** | Darker cyan background |
| **Active/Pressed** | Even darker, slight scale down |
| **Loading** | Spinner replaces text |
| **Disabled** | Gray, reduced opacity |

### Click Behavior

```
User clicks Start
       │
       ▼
Button shows loading spinner
       │
       ▼
Call usePreset(id) to record usage
       │
       ▼
onSelectPreset(preset) fires
       │
       ▼
Parent starts session
```

---

## The More Menu (•••)

For user presets, a "more" button reveals additional actions:

### Trigger

```
┌─────┐
│ ••• │  ← Three dots, vertical or horizontal
└─────┘
```

### Menu Contents

```
┌─────────────────┐
│  ✏️  Edit       │
│  ─────────────  │
│  🗑️  Delete     │
└─────────────────┘
```

### Menu Behavior

| Trigger | Action |
|---------|--------|
| Click ••• | Menu opens |
| Click outside | Menu closes |
| Click Edit | Opens edit panel |
| Click Delete | Shows confirmation dialog |
| Press Escape | Menu closes |

### Why a Menu Instead of Inline Buttons?

| Approach | Pros | Cons |
|----------|------|------|
| Inline buttons | Always visible | Cluttered, accidental clicks |
| More menu | Clean, intentional | Extra click for actions |

**We chose the menu because:**
- Start is the primary action (90% of clicks)
- Edit/Delete are rare (maybe once a week)
- Keeps the card clean and scannable

---

## Edit Action

### When Triggered

User clicks Edit in the more menu.

### Edit Panel Design

Edit happens in a **slide-over panel** or **modal**:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ← Back                              Edit Preset                │
│                                                                 │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  NAME                                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Deep Coding                                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ICON                                                           │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐       │
│  │ 🎯│ │ 🔥│ │ 🌊│ │ 🧘│ │ ⚡│ │ 🚀│ │ 💻│ │ 📝│ │ 📧│       │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘       │
│                                                                 │
│  MODE                                                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │     Zen     │ │    Flow     │ │   Legend    │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                 │
│  DURATION                                                       │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                          │
│  │15 │ │25 │ │30 │ │45 │ │60 │ │90 │  minutes                  │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                          │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     Save Changes                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                        Cancel                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### What Can Be Edited

| Field | Editable? | Notes |
|-------|-----------|-------|
| Name | ✅ Yes | Text input, required |
| Icon | ✅ Yes | Emoji picker |
| Mode | ✅ Yes | Mode selector (reuse from Quick Start) |
| Duration | ✅ Yes | Duration selector (reuse from Quick Start) |
| Whitelisted Apps | ❌ No (Phase 9) | Would require app picker UI |
| Whitelisted Domains | ❌ No (Phase 9) | Would require domain input UI |
| Mental Prep | ✅ Yes | Toggle switch |

**Why limit editing?**

For Phase 9, we focus on the most common edits:
- "I want to rename this"
- "I want a different icon"
- "I want to change the duration"

Full app/domain editing can come in a future phase.

### Edit Flow

```
User clicks Edit
       │
       ▼
Edit panel opens with current values
       │
       ▼
User modifies fields
       │
       ▼
User clicks Save Changes
       │
       ▼
Call tauriBridge.updateUserPreset(input)
       │
       ▼
Preset list refreshes
       │
       ▼
Edit panel closes
```

---

## Delete Action

### When Triggered

User clicks Delete in the more menu.

### Confirmation Dialog

**Never delete without confirmation.** Users might click accidentally.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                          🗑️                                     │
│                                                                 │
│              Delete "Deep Coding"?                              │
│                                                                 │
│      This preset will be permanently removed.                   │
│      This action cannot be undone.                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                       Delete                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                       Cancel                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Dialog Design

| Element | Styling |
|---------|---------|
| Icon | Trash emoji or icon, large |
| Title | Preset name in quotes |
| Message | Clear consequence statement |
| Delete button | Red/destructive color |
| Cancel button | Gray/neutral, below Delete |

### Delete Flow

```
User clicks Delete
       │
       ▼
Confirmation dialog appears
       │
       ├── User clicks Cancel
       │         │
       │         ▼
       │   Dialog closes, no change
       │
       └── User clicks Delete
                 │
                 ▼
         Call tauriBridge.deleteUserPreset(id)
                 │
                 ▼
         Preset removed from list
                 │
                 ▼
         Dialog closes
                 │
                 ▼
         (Optional) Show "Deleted" toast
```

---

## Component Structure

### Files

```
src/components/presets/
├── PresetCard/
│   ├── PresetCard.tsx           # Main card component
│   ├── LastSessionCard.tsx      # Special variant for Last Session
│   ├── PresetCardMenu.tsx       # More menu (•••)
│   └── index.ts
│
├── PresetEdit/
│   ├── PresetEditPanel.tsx      # Edit panel/modal
│   ├── IconPicker.tsx           # Emoji selection grid
│   └── index.ts
│
├── PresetDelete/
│   ├── DeleteConfirmDialog.tsx  # Confirmation modal
│   └── index.ts
│
└── index.ts                     # Export all
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| `PresetCard` | Display preset info, Start button, menu trigger |
| `LastSessionCard` | Enhanced card with app preview |
| `PresetCardMenu` | Dropdown with Edit/Delete options |
| `PresetEditPanel` | Form for editing preset |
| `IconPicker` | Grid of emoji options |
| `DeleteConfirmDialog` | Confirmation before delete |

---

## Props Interfaces

### PresetCard

```typescript
interface PresetCardProps {
  preset: SessionPreset;
  variant: 'user' | 'default' | 'lastSession';
  onStart: (preset: SessionPreset) => void;
  onEdit?: (preset: SessionPreset) => void;    // Only for 'user' variant
  onDelete?: (preset: SessionPreset) => void;  // Only for 'user' variant
  isLoading?: boolean;
}
```

### LastSessionCard

```typescript
interface LastSessionCardProps {
  preset: SessionPreset;
  onStart: (preset: SessionPreset) => void;
  isLoading?: boolean;
}
```

### PresetEditPanel

```typescript
interface PresetEditPanelProps {
  preset: SessionPreset;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: SessionPreset) => void;
}
```

### DeleteConfirmDialog

```typescript
interface DeleteConfirmDialogProps {
  preset: SessionPreset;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}
```

### IconPicker

```typescript
interface IconPickerProps {
  selectedIcon: string;
  onSelect: (icon: string) => void;
}
```

---

## State Management for Edit/Delete

### In PresetPickerPanel

```typescript
const [editingPreset, setEditingPreset] = useState<SessionPreset | null>(null);
const [deletingPreset, setDeletingPreset] = useState<SessionPreset | null>(null);

// Open edit panel
const handleEdit = (preset: SessionPreset) => {
  setEditingPreset(preset);
};

// Open delete confirmation
const handleDelete = (preset: SessionPreset) => {
  setDeletingPreset(preset);
};

// Save edit
const handleSaveEdit = async (updated: SessionPreset) => {
  await updatePreset(updated);
  setEditingPreset(null);
};

// Confirm delete
const handleConfirmDelete = async () => {
  if (deletingPreset) {
    await deletePreset(deletingPreset.id);
    setDeletingPreset(null);
  }
};
```

### Rendering

```tsx
return (
  <>
    {/* Main panel content */}
    <div>
      {/* Sections with PresetCards */}
    </div>

    {/* Edit Panel (slides over or modal) */}
    {editingPreset && (
      <PresetEditPanel
        preset={editingPreset}
        isOpen={true}
        onClose={() => setEditingPreset(null)}
        onSave={handleSaveEdit}
      />
    )}

    {/* Delete Confirmation */}
    {deletingPreset && (
      <DeleteConfirmDialog
        preset={deletingPreset}
        isOpen={true}
        onClose={() => setDeletingPreset(null)}
        onConfirm={handleConfirmDelete}
      />
    )}
  </>
);
```

---

## Accessibility

### Keyboard Navigation

| Key | Context | Action |
|-----|---------|--------|
| `Tab` | Card | Move focus between cards |
| `Enter` | Card focused | Start the preset |
| `Enter` | Start button | Start the preset |
| `Enter` | ••• button | Open menu |
| `Escape` | Menu open | Close menu |
| `Escape` | Edit panel | Close panel |
| `Escape` | Delete dialog | Close dialog |
| `↓` | Menu open | Move to next menu item |
| `↑` | Menu open | Move to previous menu item |

### Screen Reader

```tsx
<article 
  aria-label={`Preset: ${preset.name}, ${preset.mode} mode, ${preset.durationMinutes} minutes`}
>
  {/* Card content */}
</article>

<button aria-label={`Start ${preset.name} preset`}>
  Start
</button>

<button aria-label={`More options for ${preset.name}`}>
  •••
</button>
```

---

## Error Handling

### Start Fails

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ⚠️ Couldn't start preset                                       │
│                                                                 │
│  Something went wrong. Please try again.                        │
│                                                                 │
│                                              [Dismiss]          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Save Edit Fails

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ⚠️ Couldn't save changes                                       │
│                                                                 │
│  Please try again.                                              │
│                                                                 │
│                                              [Dismiss]          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Delete Fails

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ⚠️ Couldn't delete preset                                      │
│                                                                 │
│  Please try again.                                              │
│                                                                 │
│                                              [Dismiss]          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Animations

### Card Hover

```css
/* Subtle lift on hover */
transform: translateY(-2px);
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
transition: all 0.15s ease;
```

### Menu Open

```css
/* Fade and scale in */
opacity: 0 → 1;
transform: scale(0.95) → scale(1);
transition: all 0.1s ease;
```

### Delete Removal

```css
/* Fade and shrink out */
opacity: 1 → 0;
transform: scale(1) → scale(0.95);
height: auto → 0;
transition: all 0.2s ease;
```

---

## Summary: A4-2 Key Takeaways

1. **Three card variants** - Last Session (enhanced), User (full actions), Default (start only)
2. **Mode badge is color-coded** - Blue/Purple/Red for Zen/Flow/Legend
3. **Start is primary action** - Always visible, one click
4. **More menu for secondary actions** - Edit/Delete behind •••
5. **Delete requires confirmation** - Never delete without asking
6. **Edit is limited for Phase 9** - Name, icon, mode, duration (not apps/domains)
7. **State managed in parent** - PresetPickerPanel tracks editing/deleting
8. **Accessible** - Keyboard navigation, screen reader labels

