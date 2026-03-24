# Phase 9: Presets & Quick Start
## Output A6: Integration - Architecture & Design

---

# Bringing It All Together

## What We've Built

Over the previous documents, we've created:

| Component | Purpose | Status |
|-----------|---------|--------|
| **Backend (B1)** | Rust types, database, commands | ✅ Built |
| **Entry Point (B3-1)** | "How do you want to start?" screen | ✅ Built |
| **Quick Start (B3-2)** | 2-click session start | ✅ Built |
| **Preset Picker (B4-1)** | Browse and select presets | ✅ Built |
| **Preset Actions (B4-2)** | Edit, delete presets | ✅ Built |
| **Save Preset (B5)** | Save configuration as preset | ✅ Built |

**Now we need to wire everything together in App.tsx and ensure all flows work end-to-end.**

---

## The Complete Navigation Map

```
┌─────────────────────────────────────────────────────────────────┐
│                            HUD                                  │
│                                                                 │
│                        [Play Button]                            │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Entry Point Panel                         │
│                                                                 │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│   │ Quick Start │ │ Use Preset  │ │ Create New  │              │
│   └──────┬──────┘ └──────┬──────┘ └──────┬──────┘              │
│          │               │               │                      │
└──────────┼───────────────┼───────────────┼──────────────────────┘
           │               │               │
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │ Quick Start │ │   Preset    │ │  Existing   │
    │   Panel     │ │   Picker    │ │   Wizard    │
    │             │ │             │ │             │
    │ Mode+Dur    │ │ Select one  │ │ Full config │
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
           │               │               │
           │               │               ▼
           │               │        ┌─────────────┐
           │               │        │ Mental Prep │
           │               │        │ (optional)  │
           │               │        └──────┬──────┘
           │               │               │
           │               │               ▼
           │               │        ┌─────────────┐
           │               │        │ Save Preset │
           │               │        │  Prompt     │
           │               │        └──────┬──────┘
           │               │               │
           ▼               ▼               ▼
    ┌─────────────────────────────────────────────┐
    │                                             │
    │              Active Session                 │
    │                                             │
    └─────────────────────────────────────────────┘
```

---

## Panel Types

We need to define all possible panel states:

```typescript
type PanelType =
  // HUD States
  | 'hud'
  | 'hudMinimized'
  
  // Entry Flow (NEW)
  | 'entryPoint'
  | 'quickStart'
  | 'presetPicker'
  
  // Existing Wizard Flow
  | 'sessionType'      // or 'modeSelect' depending on your naming
  | 'mode'
  | 'duration'
  | 'apps'
  | 'domains'
  | 'mentalPrep1'
  | 'mentalPrep2'
  | 'savePrompt'       // NEW
  
  // Active Session
  | 'activeSession'
  | 'sessionComplete'
  
  // Interventions (existing)
  | 'delayGate'
  | 'blockScreen';
```

---

## State Management

### Session Configuration State

We need to track the session configuration as users build it:

```typescript
interface SessionConfig {
  // Core settings
  mode: SessionMode;
  durationMinutes: number;
  
  // Whitelisting
  whitelistedApps: string[];
  whitelistedDomains: string[];
  blockedApps: string[];
  blockedDomains: string[];
  
  // Behavior
  useDefaultBlocklist: boolean;
  includeMentalPrep: boolean;
  
  // Tracking
  startedFrom: 'quickStart' | 'preset' | 'createNew';
  presetId?: string;  // If started from preset
}
```

### Wizard State

For the Create New flow, we track additional state:

```typescript
interface WizardState {
  // Current position
  currentStep: WizardStep;
  
  // Configuration being built
  config: Partial<SessionConfig>;
  
  // Mental prep tracking
  skippedMentalPrep: boolean;
  intention?: string;
  
  // For going back
  stepHistory: WizardStep[];
}
```

---

## Navigation Flows

### Flow 1: Quick Start → Session

```
1. User clicks Play on HUD
2. → Entry Point Panel appears
3. User clicks "Quick Start"
4. → Quick Start Panel appears
5. User selects Mode and Duration
6. User clicks "Start Session"
7. → Backend: get_quick_start_config()
8. → Backend: save_as_last_session()
9. → Active Session begins
```

**Key Integration Points:**
- Entry Point calls `setCurrentPanel('quickStart')`
- Quick Start calls `startSessionFromConfig(config)`
- `startSessionFromConfig` saves Last Session and starts

### Flow 2: Use Preset → Session

```
1. User clicks Play on HUD
2. → Entry Point Panel appears
3. User clicks "Use Preset"
4. → Preset Picker Panel appears
5. User clicks "Start" on a preset
6. → Backend: use_preset(id) (records usage)
7. → Active Session begins with preset config
```

**Key Integration Points:**
- Entry Point calls `setCurrentPanel('presetPicker')`
- Preset Picker calls `startSessionFromPreset(preset)`
- `startSessionFromPreset` extracts config and starts

### Flow 3: Create New → Session

```
1. User clicks Play on HUD
2. → Entry Point Panel appears
3. User clicks "Create New"
4. → Existing wizard begins (Mode → Duration → Apps → etc.)
5. User reaches Mental Prep (or skips)
6. → Save Preset Prompt appears
7. User saves preset OR clicks "Just Start"
8. → Active Session begins
```

**Key Integration Points:**
- Entry Point calls `setCurrentPanel('modeSelect')` (or first wizard step)
- Wizard flows through existing steps
- Mental prep has Skip button → jumps to `savePrompt`
- Save Prompt saves if requested, then starts session

### Flow 4: Session Complete → Last Session Available

```
1. Session completes successfully
2. → Session completion screen
3. User clicks Play again later
4. → Entry Point Panel appears
5. User clicks "Use Preset"
6. → Preset Picker shows "Last Session" in Recent section
7. User clicks "Start" on Last Session
8. → Same config as previous session
```

**Key Integration Points:**
- Quick Start already saves Last Session
- Create New should also save Last Session
- Preset Picker shows Last Session when available

---

## The Main App Component

### Structure

```typescript
// App.tsx

function App() {
  // Panel navigation
  const [currentPanel, setCurrentPanel] = useState<PanelType>('hud');
  
  // Session configuration (built during wizard or from preset)
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);
  
  // Wizard state (for Create New flow)
  const [wizardState, setWizardState] = useState<WizardState | null>(null);
  
  // Active session state (existing)
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);

  // ... handlers and render logic
}
```

### Key Handlers

```typescript
// Handle Play button click
const handlePlayClick = () => {
  if (activeSession) {
    // Session already running, show session panel
    setCurrentPanel('activeSession');
  } else {
    // No session, show entry point
    setCurrentPanel('entryPoint');
  }
};

// Start session from Quick Start
const handleQuickStartSession = async (config: QuickStartConfig) => {
  const fullConfig: SessionConfig = {
    mode: config.mode,
    durationMinutes: config.durationMinutes,
    whitelistedApps: config.whitelistedApps,
    whitelistedDomains: config.whitelistedDomains,
    blockedApps: config.blockedApps,
    blockedDomains: config.blockedDomains,
    useDefaultBlocklist: true,
    includeMentalPrep: false,
    startedFrom: 'quickStart',
  };
  
  await startSession(fullConfig);
};

// Start session from Preset
const handlePresetSession = async (preset: SessionPreset) => {
  const fullConfig: SessionConfig = {
    mode: preset.mode,
    durationMinutes: preset.durationMinutes,
    whitelistedApps: preset.whitelistedApps,
    whitelistedDomains: preset.whitelistedDomains,
    blockedApps: [], // Will be filled by default blocklist
    blockedDomains: [], // Will be filled by default blocklist
    useDefaultBlocklist: preset.useDefaultBlocklist,
    includeMentalPrep: preset.includeMentalPrep,
    startedFrom: 'preset',
    presetId: preset.id,
  };
  
  // If preset includes mental prep, show it first
  if (preset.includeMentalPrep) {
    setSessionConfig(fullConfig);
    setCurrentPanel('mentalPrep1');
  } else {
    await startSession(fullConfig);
  }
};

// Start session from Create New (after save prompt)
const handleCreateNewSession = async (
  config: SessionConfig,
  saveAsPreset: boolean,
  presetName?: string,
  presetIcon?: string
) => {
  // Save as preset if requested
  if (saveAsPreset && presetName && presetIcon) {
    await tauriBridge.createUserPreset({
      name: presetName,
      icon: presetIcon,
      mode: config.mode,
      durationMinutes: config.durationMinutes,
      whitelistedApps: config.whitelistedApps,
      whitelistedDomains: config.whitelistedDomains,
      useDefaultBlocklist: config.useDefaultBlocklist,
      includeMentalPrep: config.includeMentalPrep,
    });
  }
  
  // Save as Last Session
  await tauriBridge.saveAsLastSession(
    config.mode,
    config.durationMinutes,
    config.whitelistedApps,
    config.whitelistedDomains,
    config.useDefaultBlocklist,
    config.includeMentalPrep
  );
  
  await startSession(config);
};

// Common session start logic
const startSession = async (config: SessionConfig) => {
  // Initialize session state
  const session: ActiveSession = {
    id: generateSessionId(),
    config,
    startTime: Date.now(),
    // ... other session properties
  };
  
  setActiveSession(session);
  setSessionConfig(config);
  setCurrentPanel('activeSession');
  
  // Start monitoring, timers, etc.
  // ... existing session start logic
};
```

---

## Panel Rendering

### Render Logic

```typescript
return (
  <div className="app-container">
    {/* HUD - Always visible when not in full panel */}
    {(currentPanel === 'hud' || currentPanel === 'hudMinimized') && (
      <HUD
        onPlay={handlePlayClick}
        session={activeSession}
        // ... other props
      />
    )}

    {/* Entry Point */}
    {currentPanel === 'entryPoint' && (
      <EntryPointPanel
        onSelectQuickStart={() => setCurrentPanel('quickStart')}
        onSelectPreset={() => setCurrentPanel('presetPicker')}
        onSelectCreateNew={() => {
          initializeWizard();
          setCurrentPanel('modeSelect');
        }}
        onClose={() => setCurrentPanel('hud')}
      />
    )}

    {/* Quick Start */}
    {currentPanel === 'quickStart' && (
      <QuickStartPanel
        onBack={() => setCurrentPanel('entryPoint')}
        onSessionStart={handleQuickStartSession}
      />
    )}

    {/* Preset Picker */}
    {currentPanel === 'presetPicker' && (
      <PresetPickerPanel
        onBack={() => setCurrentPanel('entryPoint')}
        onSelectPreset={handlePresetSession}
      />
    )}

    {/* Existing Wizard Panels */}
    {currentPanel === 'modeSelect' && (
      <ModeSelectPanel
        onBack={() => setCurrentPanel('entryPoint')}
        onSelect={(mode) => {
          updateWizardConfig({ mode });
          setCurrentPanel('duration');
        }}
      />
    )}

    {/* ... other wizard panels ... */}

    {/* Mental Prep with Skip */}
    {currentPanel === 'mentalPrep1' && (
      <MentalPrepPanel1
        onContinue={() => setCurrentPanel('mentalPrep2')}
        onSkip={() => {
          setWizardSkippedMentalPrep(true);
          setCurrentPanel('savePrompt');
        }}
        onBack={() => setCurrentPanel('domains')}
      />
    )}

    {currentPanel === 'mentalPrep2' && (
      <MentalPrepPanel2
        onContinue={() => setCurrentPanel('savePrompt')}
        onSkip={() => {
          setWizardSkippedMentalPrep(true);
          setCurrentPanel('savePrompt');
        }}
        onBack={() => setCurrentPanel('mentalPrep1')}
      />
    )}

    {/* Save Preset Prompt */}
    {currentPanel === 'savePrompt' && wizardState && (
      <SavePresetPrompt
        config={buildConfigFromWizard()}
        skippedMentalPrep={wizardState.skippedMentalPrep}
        onSaveAndStart={async (name, icon, includeMentalPrep) => {
          await handleCreateNewSession(
            { ...buildConfigFromWizard(), includeMentalPrep },
            true,
            name,
            icon
          );
        }}
        onJustStart={() => {
          handleCreateNewSession(buildConfigFromWizard(), false);
        }}
        onBack={() => {
          if (wizardState.skippedMentalPrep) {
            setCurrentPanel('mentalPrep1');
          } else {
            setCurrentPanel('mentalPrep2');
          }
        }}
        canSave={presetCount < 5}
        presetCount={presetCount}
      />
    )}

    {/* Active Session */}
    {currentPanel === 'activeSession' && activeSession && (
      <ActiveSessionPanel
        session={activeSession}
        // ... existing props
      />
    )}

    {/* ... interventions, completion, etc. */}
  </div>
);
```

---

## Back Button Navigation

Every panel needs proper back navigation:

| Panel | Back Destination |
|-------|------------------|
| Entry Point | HUD |
| Quick Start | Entry Point |
| Preset Picker | Entry Point |
| Mode Select | Entry Point |
| Duration | Mode Select |
| Apps | Duration |
| Domains | Apps |
| Mental Prep 1 | Domains |
| Mental Prep 2 | Mental Prep 1 |
| Save Prompt | Mental Prep 1 (if skipped) or Mental Prep 2 |

### Implementation Pattern

```typescript
const handleBack = () => {
  const backMap: Record<PanelType, PanelType> = {
    entryPoint: 'hud',
    quickStart: 'entryPoint',
    presetPicker: 'entryPoint',
    modeSelect: 'entryPoint',
    duration: 'modeSelect',
    apps: 'duration',
    domains: 'apps',
    mentalPrep1: 'domains',
    mentalPrep2: 'mentalPrep1',
    savePrompt: wizardState?.skippedMentalPrep ? 'mentalPrep1' : 'mentalPrep2',
    // ... other mappings
  };
  
  setCurrentPanel(backMap[currentPanel] || 'hud');
};
```

---

## Keyboard Shortcuts

Global keyboard shortcuts for navigation:

| Key | Context | Action |
|-----|---------|--------|
| `Escape` | Any panel (not session) | Go back one step |
| `Escape` | Entry Point | Close, return to HUD |
| `1`, `2`, `3` | Entry Point | Select Quick Start, Preset, Create New |
| `1`, `2`, `3` | Quick Start | Select Zen, Flow, Legend |
| `Enter` | Quick Start (mode selected) | Start session |
| `Enter` | Save Prompt (name filled) | Save and start |

### Global Keyboard Handler

```typescript
useEffect(() => {
  const handleGlobalKeyDown = (e: KeyboardEvent) => {
    // Don't handle if in input field
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    // Escape - go back
    if (e.key === 'Escape') {
      handleBack();
      return;
    }
    
    // Panel-specific shortcuts handled by individual panels
  };
  
  window.addEventListener('keydown', handleGlobalKeyDown);
  return () => window.removeEventListener('keydown', handleGlobalKeyDown);
}, [currentPanel, handleBack]);
```

---

## Initialization on App Start

When the app starts:

```typescript
useEffect(() => {
  const initialize = async () => {
    try {
      // 1. Initialize preset system (creates tables, inserts defaults)
      await tauriBridge.initPresets();
      
      // 2. Check if app scan is needed
      const needsScan = await tauriBridge.checkNeedsAppScan();
      if (needsScan) {
        // Show loading/scanning state
        await performAppScan();
      }
      
      // 3. Load presets for quick access
      await refreshPresets();
      
      console.log('[App] Initialization complete');
      
    } catch (error) {
      console.error('[App] Initialization failed:', error);
      // Show error state
    }
  };
  
  initialize();
}, []);
```

---

## Testing the Full Integration

### Test Scenario 1: Quick Start Flow

```
1. Launch app
2. Click Play → Entry Point appears
3. Click Quick Start → Quick Start Panel appears
4. Select Flow mode → Mode highlights
5. Select 45 minutes → Duration updates
6. Click Start Session → Session begins
7. Verify HUD shows active session (Flow, 45 min)
8. Complete session
9. Click Play → Entry Point
10. Click Use Preset → Last Session shows in Recent
11. Verify Last Session shows Flow | 45 min
```

### Test Scenario 2: Preset Flow

```
1. Launch app
2. Click Play → Entry Point
3. Click Use Preset → Preset Picker
4. Click Start on "Coding Sprint" default
5. Session begins (Legend, 90 min)
6. Verify HUD shows Legend mode
```

### Test Scenario 3: Create New with Save

```
1. Launch app
2. Click Play → Entry Point
3. Click Create New → Wizard starts
4. Select Legend mode
5. Set 60 minutes
6. Select apps (VS Code, Terminal)
7. Select domains (github.com)
8. On Mental Prep 1, click "Skip - I'm ready"
9. Save Prompt appears
10. Enter name "My Focus", select icon 🎯
11. Click "Save & Start"
12. Session begins
13. After session, check Use Preset
14. "My Focus" appears in My Presets
```

### Test Scenario 4: Create New without Save

```
1. Go through Create New wizard
2. On Save Prompt, click "Just Start"
3. Session begins
4. Preset NOT saved (only Last Session)
```

### Test Scenario 5: Back Navigation

```
1. Entry Point → Quick Start → Back → Entry Point ✓
2. Entry Point → Preset Picker → Back → Entry Point ✓
3. Entry Point → Create New → Mode → Back → Entry Point ✓
4. Mode → Duration → Back → Mode ✓
5. Mental Prep 1 → Skip → Save Prompt → Back → Mental Prep 1 ✓
6. Mental Prep 2 → Continue → Save Prompt → Back → Mental Prep 2 ✓
```

---

## Error Handling

### Backend Errors

```typescript
const startSession = async (config: SessionConfig) => {
  try {
    // ... start session logic
  } catch (error) {
    console.error('Failed to start session:', error);
    
    // Show error panel
    setErrorState({
      message: 'Could not start session',
      detail: error instanceof Error ? error.message : 'Unknown error',
      retry: () => startSession(config),
    });
    setCurrentPanel('error');
  }
};
```

### Network/Database Errors

If preset operations fail:

```typescript
// In Preset Picker
const handleStartPreset = async (preset: SessionPreset) => {
  try {
    await usePreset(preset.id);
    onSelectPreset(preset);
  } catch (error) {
    // Show toast or inline error
    setError('Could not load preset. Please try again.');
  }
};
```

---

## Performance Considerations

### Lazy Loading Panels

Don't render panels that aren't visible:

```typescript
// Good - conditional rendering
{currentPanel === 'presetPicker' && <PresetPickerPanel ... />}

// Bad - always rendering and hiding
<div style={{ display: currentPanel === 'presetPicker' ? 'block' : 'none' }}>
  <PresetPickerPanel ... />
</div>
```

### Preset Caching

Load presets once, refresh when needed:

```typescript
const { presets, refreshPresets } = usePresets();

// Refresh when entering preset picker
useEffect(() => {
  if (currentPanel === 'presetPicker') {
    refreshPresets();
  }
}, [currentPanel]);
```

---

## Summary: A6 Key Takeaways

1. **Three entry paths** converge to session start
2. **PanelType** expanded to include new panels
3. **SessionConfig** captures all configuration
4. **Common startSession()** function for all paths
5. **Back navigation** mapped for each panel
6. **Last Session saved** from all paths (Quick Start, Create New)
7. **Keyboard shortcuts** work globally and per-panel
8. **Initialization** sets up presets on app start
9. **Error handling** at each integration point

