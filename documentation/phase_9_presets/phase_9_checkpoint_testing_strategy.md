# Phase 9: Checkpoint Strategy

## Overview

After each B document, you should have something **testable and visible**. This ensures we catch bugs early and build confidence as we progress.

---

## Checkpoint Map

```
B1 (Backend)
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ CHECKPOINT 1: Backend Foundation                            │
│                                                             │
│ Test: Rust compiles, commands work in DevTools console      │
│ Verify: Presets table exists, default presets loaded        │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
B3-1 (Entry Point UI)
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ CHECKPOINT 2: Entry Point Visible                           │
│                                                             │
│ Test: Entry Point panel renders, cards clickable            │
│ Verify: Keyboard shortcuts work, navigation triggers        │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
B3-2 (Quick Start UI)
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ CHECKPOINT 3: Quick Start Functional                        │
│                                                             │
│ Test: Can select mode, duration, and start a session        │
│ Verify: Smart defaults applied, Last Session saved          │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
B4-1 (Preset Selection UI)
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ CHECKPOINT 4: Preset Picker Visible                         │
│                                                             │
│ Test: Preset picker shows all sections                      │
│ Verify: Last Session, My Presets, Suggested all render      │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
B4-2 (Preset Cards & Actions)
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ CHECKPOINT 5: Preset Actions Work                           │
│                                                             │
│ Test: Can start session from preset, edit, delete           │
│ Verify: Usage count increments, preset updates persist      │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
B5 (Create New Updates)
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ CHECKPOINT 6: Save as Preset Works                          │
│                                                             │
│ Test: Can save session config as new preset                 │
│ Verify: Skip mental prep works, preset appears in list      │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
B6 (Integration)
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│ CHECKPOINT 7: Full Flow Complete                            │
│                                                             │
│ Test: All three entry paths work end-to-end                 │
│ Verify: Quick Start → Session → Last Session → Preset       │
└─────────────────────────────────────────────────────────────┘
```

---

## Detailed Checkpoints

### Checkpoint 1: Backend Foundation (After B1)

**What You Built:**
- Rust types, persistence, commands
- Database tables (presets, cached_apps, blocked_domains)
- Default presets inserted

**How to Test:**

```bash
# 1. Build Rust
cd src-tauri
cargo build
```
**Expected:** No compilation errors.

```bash
# 2. Run app
npm run tauri dev
```

**In DevTools Console:**

```javascript
// Initialize presets
await window.__TAURI__.invoke('init_presets')
// Expected: No error

// Get all presets
const presets = await window.__TAURI__.invoke('get_all_presets')
console.log('Last Session:', presets.lastSession)
console.log('User Presets:', presets.userPresets.length)
console.log('Default Presets:', presets.defaultPresets.map(p => p.name))
// Expected: 
// Last Session: null
// User Presets: 0
// Default Presets: ["Admin & Email", "Coding Sprint", "Deep Work", "Quick Focus"]

// Test Quick Start config
const config = await window.__TAURI__.invoke('get_quick_start_config', {
  mode: 'Flow',
  durationMinutes: 45
})
console.log('Whitelisted Apps:', config.whitelistedApps.length)
console.log('Blocked Domains:', config.blockedDomains.length)
// Expected: Numbers > 0

// Test create preset
const newPreset = await window.__TAURI__.invoke('create_user_preset', {
  input: {
    name: 'Test Preset',
    icon: '🧪',
    mode: 'Zen',
    durationMinutes: 30,
    whitelistedApps: ['VS Code'],
    whitelistedDomains: ['github.com'],
    useDefaultBlocklist: true,
    includeMentalPrep: false
  }
})
console.log('Created:', newPreset.name)
// Expected: "Created: Test Preset"

// Cleanup
await window.__TAURI__.invoke('delete_user_preset', { id: newPreset.id })
console.log('Deleted test preset')
```

**Checklist:**
- [ ] `cargo build` succeeds
- [ ] `init_presets` runs without error
- [ ] `get_all_presets` returns 4 default presets
- [ ] `get_quick_start_config` returns lists
- [ ] `create_user_preset` creates a preset
- [ ] `delete_user_preset` deletes the preset

---

### Checkpoint 2: Entry Point Visible (After B3-1)

**What You Built:**
- TypeScript types for presets
- Tauri bridge preset commands
- usePresets hook
- EntryOptionCard component
- EntryPointPanel component

**How to Test:**

```bash
npm run build
```
**Expected:** No TypeScript errors.

```bash
npm run tauri dev
```

**Visual Test:**

Temporarily modify App.tsx to show Entry Point:

```typescript
import { EntryPointPanel } from '@/components/presets';

// In your render:
<EntryPointPanel
  onSelectQuickStart={() => console.log('Quick Start')}
  onSelectPreset={() => console.log('Preset')}
  onSelectCreateNew={() => console.log('Create New')}
  onClose={() => console.log('Close')}
/>
```

**Checklist:**
- [ ] `npm run build` succeeds
- [ ] Panel renders with 3 option cards
- [ ] Cards show correct icons (⚡, 📁, ✨)
- [ ] Clicking cards logs to console
- [ ] Keyboard "1", "2", "3" triggers selection
- [ ] Keyboard "Escape" triggers close
- [ ] Hover states visible on cards
- [ ] Tab navigation works with focus rings

---

### Checkpoint 3: Quick Start Functional (After B3-2)

**What You Built:**
- ModeSelector component
- DurationSelector component
- QuickStartPanel component
- useQuickStart hook

**How to Test:**

**Visual Test:**

Temporarily show Quick Start panel:

```typescript
import { QuickStartPanel } from '@/components/presets';

<QuickStartPanel
  onBack={() => console.log('Back')}
  onSessionStart={(config) => console.log('Session config:', config)}
/>
```

**Interaction Test:**

| Action | Expected |
|--------|----------|
| Click Zen card | Zen selected, button turns blue |
| Click Flow card | Flow selected, button turns purple |
| Click Legend card | Legend selected, button turns red |
| Click [30] button | Duration shows 30, slider at 30 |
| Drag slider to 45 | Duration shows 45, [45] highlighted |
| Press "1" key | Zen selected |
| Press "2" key | Flow selected |
| Press "3" key | Legend selected |
| Click Start (no mode) | Button disabled, nothing happens |
| Select mode + duration, click Start | Console shows config |
| Click Back | Console: "Back" |

**Backend Integration Test:**

```javascript
// After clicking Start, verify Last Session was saved
const presets = await window.__TAURI__.invoke('get_all_presets')
console.log('Last Session:', presets.lastSession)
// Expected: Last Session object with mode/duration you selected
```

**Checklist:**
- [ ] Mode cards render with correct colors
- [ ] Mode selection updates button color
- [ ] Duration buttons and slider sync
- [ ] Keyboard shortcuts work
- [ ] Start button disabled until mode selected
- [ ] Session starts with correct config
- [ ] Last Session saved after start

---

### Checkpoint 4: Preset Picker Visible (After B4-1)

**What You Built:**
- PresetPickerPanel component
- Section headers (Recent, My Presets, Suggested)
- Loading and empty states

**How to Test:**

**Visual Test:**

```typescript
import { PresetPickerPanel } from '@/components/presets';

<PresetPickerPanel
  onBack={() => console.log('Back')}
  onSelectPreset={(preset) => console.log('Selected:', preset.name)}
/>
```

**Scenarios to Test:**

| State | Expected Display |
|-------|------------------|
| First launch (no last session) | "Recent" section empty or hidden |
| After one Quick Start session | "Recent" shows Last Session |
| No user presets | "My Presets" shows empty state message |
| Default presets exist | "Suggested" shows 4 presets |

**Checklist:**
- [ ] Panel renders with section headers
- [ ] "Suggested" shows default presets
- [ ] "My Presets" shows empty state (initially)
- [ ] "Recent" shows Last Session (after Quick Start)
- [ ] Back button works

---

### Checkpoint 5: Preset Actions Work (After B4-2)

**What You Built:**
- PresetCard component with actions
- Start, Edit, Delete functionality
- Confirmation dialogs

**How to Test:**

**Create a Test Preset First:**

```javascript
await window.__TAURI__.invoke('create_user_preset', {
  input: {
    name: 'My Coding Preset',
    icon: '💻',
    mode: 'Legend',
    durationMinutes: 90,
    whitelistedApps: ['VS Code'],
    whitelistedDomains: ['github.com'],
    useDefaultBlocklist: true,
    includeMentalPrep: false
  }
})
```

**Interaction Test:**

| Action | Expected |
|--------|----------|
| Click preset Start button | Session starts with preset config |
| Click preset Edit button | Edit panel opens |
| Change preset name, save | Name updates in list |
| Click preset Delete button | Confirmation appears |
| Confirm delete | Preset removed from list |
| Click default preset Start | Session starts |
| Try to edit default preset | Not allowed (no edit button) |

**Checklist:**
- [ ] User presets show in "My Presets"
- [ ] Start button starts session
- [ ] Edit button opens edit UI
- [ ] Delete button shows confirmation
- [ ] Default presets can't be edited/deleted
- [ ] Usage count increments on use

---

### Checkpoint 6: Save as Preset Works (After B5)

**What You Built:**
- SavePresetPrompt component
- Skip mental prep option
- Updated Create New wizard

**How to Test:**

**Flow Test:**

1. Go to Entry Point → Create New
2. Configure mode, duration, apps, domains
3. On mental prep screen, click "Skip"
4. See "Save as Preset?" prompt
5. Enter name, click Save
6. Session starts
7. Go to Entry Point → Use Preset
8. Verify new preset appears

**Checklist:**
- [ ] Skip mental prep button works
- [ ] Save as Preset prompt appears
- [ ] Can name the preset
- [ ] Preset saves and appears in list
- [ ] Can start session without saving
- [ ] Preset limit (5) is enforced

---

### Checkpoint 7: Full Flow Complete (After B6)

**What You Built:**
- Full integration with App.tsx
- Panel navigation system
- End-to-end flows

**How to Test:**

**Full End-to-End Test:**

```
Test A: Quick Start Flow
─────────────────────────
1. Launch app
2. Click Play on HUD
3. Entry Point appears
4. Click Quick Start
5. Select Flow mode
6. Select 45 minutes
7. Click Start Session
8. Session runs (verify in HUD)
9. Complete session
10. Click Play again
11. Click Use Preset
12. Verify "Last Session" shows Flow | 45 min
13. Click Last Session Start
14. Session runs with same config

Test B: Preset Flow
───────────────────
1. Click Play
2. Click Use Preset
3. Click "Coding Sprint" default preset
4. Session runs in Legend mode, 90 min
5. Complete session
6. Verify badge unlocks still work

Test C: Create New Flow
───────────────────────
1. Click Play
2. Click Create New
3. Configure: Legend, 60 min, custom apps
4. Skip mental prep
5. Save as "My Focus Time"
6. Session starts
7. Click Play after session
8. Click Use Preset
9. Verify "My Focus Time" in My Presets
10. Start it, verify config matches
```

**Checklist:**
- [ ] Entry Point appears on Play click
- [ ] Quick Start → Session works
- [ ] Preset → Session works
- [ ] Create New → Session works
- [ ] Last Session saves correctly
- [ ] User presets save correctly
- [ ] Badges still unlock
- [ ] Interventions still work
- [ ] All keyboard shortcuts work
- [ ] Back navigation works everywhere

---

## Quick Reference Card

| Checkpoint | After | Key Test |
|------------|-------|----------|
| **1** | B1 | Commands work in console |
| **2** | B3-1 | Entry Point panel renders |
| **3** | B3-2 | Quick Start creates session |
| **4** | B4-1 | Preset picker shows sections |
| **5** | B4-2 | Can edit/delete presets |
| **6** | B5 | Save as preset works |
| **7** | B6 | All 3 flows work end-to-end |

---

## If a Checkpoint Fails

| Issue | Action |
|-------|--------|
| Rust won't compile | Check B1 code, look for typos |
| Commands fail in console | Check Tauri command registration in main.rs |
| TypeScript errors | Check types match between Rust and TS |
| UI doesn't render | Check component imports and exports |
| State not updating | Check hook implementation |
| Session doesn't start | Check integration with existing session code |

---

Ready for **Output B3-2: Quick Start - Prompts**?