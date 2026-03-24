
# Phase 9: Presets & Quick Start
## Output B5: Create New Updates - Implementation Prompts

---

## Overview

This document contains step-by-step prompts for Cursor to implement the Create New wizard enhancements - Skip Mental Prep and Save as Preset features.

**Depends on:** B4-2 (Preset Cards & Actions) must be complete.

**Total Steps:** 8
**Estimated Time:** 2-3 hours

**Note:** This document assumes certain existing wizard components. You may need to adapt the integration steps based on your actual component structure.

---

## Step 1: Create SkipPrepButton Component

**Prompt for Cursor:**

```
Create a subtle skip button component for mental preparation screens.

Create file: src/components/presets/SkipPrepButton.tsx

import React from 'react';
import { cn } from '@/lib/utils';

interface SkipPrepButtonProps {
  onSkip: () => void;
  disabled?: boolean;
  className?: string;
}

export const SkipPrepButton: React.FC<SkipPrepButtonProps> = ({
  onSkip,
  disabled = false,
  className,
}) => {
  return (
    <div className={cn('pt-4 border-t border-gray-800', className)}>
      <button
        onClick={onSkip}
        disabled={disabled}
        className={cn(
          'w-full py-2 text-sm text-gray-500',
          'transition-colors duration-150',
          'hover:text-gray-300',
          'focus:outline-none focus:text-gray-300',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        Skip – I'm ready to start
      </button>
    </div>
  );
};
```

---

## Step 2: Create ConfigurationSummary Component

**Prompt for Cursor:**

```
Create a component that displays a summary of the session configuration.

Create file: src/components/presets/ConfigurationSummary.tsx

import React from 'react';
import { cn } from '@/lib/utils';
import { SessionMode, MODE_INFO } from '@/lib/presets/types';

interface ConfigurationSummaryProps {
  mode: SessionMode;
  durationMinutes: number;
  whitelistedApps: string[];
  whitelistedDomains: string[];
  className?: string;
}

export const ConfigurationSummary: React.FC<ConfigurationSummaryProps> = ({
  mode,
  durationMinutes,
  whitelistedApps,
  whitelistedDomains,
  className,
}) => {
  const modeInfo = MODE_INFO[mode];

  // Format list with "and X more"
  const formatList = (items: string[], max: number = 3): string => {
    if (items.length === 0) return 'None selected';
    if (items.length <= max) return items.join(', ');
    const shown = items.slice(0, max).join(', ');
    const remaining = items.length - max;
    return `${shown}, and ${remaining} more`;
  };

  return (
    <div className={cn('space-y-2 text-sm', className)}>
      {/* Mode */}
      <div className="flex items-center gap-2">
        <span className="text-gray-500">Mode:</span>
        <span
          className={cn(
            'px-1.5 py-0.5 rounded text-xs font-medium',
            modeInfo.bgColor,
            modeInfo.color
          )}
        >
          {modeInfo.title}
        </span>
      </div>

      {/* Duration */}
      <div className="flex items-center gap-2">
        <span className="text-gray-500">Duration:</span>
        <span className="text-gray-200">{durationMinutes} min</span>
      </div>

      {/* Apps */}
      <div className="flex items-start gap-2">
        <span className="text-gray-500 flex-shrink-0">Apps:</span>
        <span className="text-gray-200">{formatList(whitelistedApps)}</span>
      </div>

      {/* Domains */}
      <div className="flex items-start gap-2">
        <span className="text-gray-500 flex-shrink-0">Sites:</span>
        <span className="text-gray-200">{formatList(whitelistedDomains)}</span>
      </div>
    </div>
  );
};
```

---

## Step 3: Create SavePresetPrompt Component

**Prompt for Cursor:**

```
Create the Save as Preset prompt screen component.

Create file: src/components/presets/SavePresetPrompt.tsx

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { SessionMode, PRESET_ICONS, MAX_USER_PRESETS } from '@/lib/presets/types';
import { IconPicker } from './IconPicker';
import { ConfigurationSummary } from './ConfigurationSummary';

interface SessionConfig {
  mode: SessionMode;
  durationMinutes: number;
  whitelistedApps: string[];
  whitelistedDomains: string[];
  useDefaultBlocklist: boolean;
}

interface SavePresetPromptProps {
  config: SessionConfig;
  skippedMentalPrep: boolean;
  onSaveAndStart: (name: string, icon: string, includeMentalPrep: boolean) => Promise<void>;
  onJustStart: () => void;
  onBack: () => void;
  canSave: boolean;
  presetCount: number;
  isSaving?: boolean;
}

export const SavePresetPrompt: React.FC<SavePresetPromptProps> = ({
  config,
  skippedMentalPrep,
  onSaveAndStart,
  onJustStart,
  onBack,
  canSave,
  presetCount,
  isSaving = false,
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Focus name input on mount
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  // Clear error when name changes
  useEffect(() => {
    if (error) setError(null);
  }, [name]);

  // Handle save and start
  const handleSaveAndStart = async () => {
    // Validate
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError('Please enter a name for your preset');
      nameInputRef.current?.focus();
      return;
    }

    if (trimmedName.length > 50) {
      setError('Name is too long (max 50 characters)');
      return;
    }

    try {
      // includeMentalPrep is false if user skipped, true if they completed
      await onSaveAndStart(trimmedName, icon, !skippedMentalPrep);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preset');
    }
  };

  // Handle keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSaving && canSave && name.trim()) {
      handleSaveAndStart();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button
          onClick={onBack}
          disabled={isSaving}
          className={cn(
            'p-2 -ml-2 text-gray-400 hover:text-gray-200 transition-colors',
            isSaving && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Back"
        >
          ← Back
        </button>
        <h1 className="text-lg font-semibold">Save Preset</h1>
        <div className="w-16" />
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4">
        {/* Icon and Title */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">✨</div>
          <h2 className="text-xl font-bold text-gray-100">
            Save these settings for next time?
          </h2>
        </div>

        {/* Configuration Summary */}
        <div className="mb-6 p-4 rounded-xl bg-gray-800/50 border border-gray-700">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Your Configuration
          </h3>
          <ConfigurationSummary
            mode={config.mode}
            durationMinutes={config.durationMinutes}
            whitelistedApps={config.whitelistedApps}
            whitelistedDomains={config.whitelistedDomains}
          />
        </div>

        {/* Can Save Form */}
        {canSave ? (
          <div className="space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
              <label 
                htmlFor="preset-name" 
                className="block text-sm font-medium text-gray-300"
              >
                Name Your Preset
              </label>
              <input
                ref={nameInputRef}
                id="preset-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSaving}
                placeholder="e.g., Deep Coding, Morning Focus"
                maxLength={50}
                className={cn(
                  'w-full px-4 py-3 rounded-xl',
                  'bg-gray-800 border-2',
                  'text-gray-100 placeholder-gray-500',
                  'transition-colors duration-150',
                  'focus:outline-none focus:ring-0',
                  error
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-700 focus:border-cyan-500',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                aria-describedby={error ? 'name-error' : undefined}
              />
              {error && (
                <p id="name-error" className="text-sm text-red-400">
                  {error}
                </p>
              )}
            </div>

            {/* Icon Picker */}
            <IconPicker selectedIcon={icon} onSelect={setIcon} />
          </div>
        ) : (
          /* At Preset Limit */
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-yellow-400 font-medium">
                  You've reached the preset limit ({MAX_USER_PRESETS})
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  To save this configuration, delete an existing preset first.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        {/* Save & Start Button (only if can save) */}
        {canSave && (
          <button
            onClick={handleSaveAndStart}
            disabled={isSaving || !name.trim()}
            className={cn(
              'w-full py-3 px-4 rounded-xl font-semibold text-white',
              'transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900',
              isSaving || !name.trim()
                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                : 'bg-cyan-500 hover:bg-cyan-600'
            )}
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Saving...
              </span>
            ) : (
              'Save & Start'
            )}
          </button>
        )}

        {/* Just Start Button */}
        <button
          onClick={onJustStart}
          disabled={isSaving}
          className={cn(
            'w-full py-3 px-4 rounded-xl font-medium',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900',
            canSave
              ? 'text-gray-400 hover:text-gray-200'
              : 'bg-cyan-500 hover:bg-cyan-600 text-white',
            isSaving && 'opacity-50 cursor-not-allowed'
          )}
        >
          {canSave ? 'Just Start' : 'Start Without Saving'}
        </button>
      </div>
    </div>
  );
};
```

---

## Step 4: Create useSavePreset Hook

**Prompt for Cursor:**

```
Create a hook to manage the save preset logic.

Create file: src/hooks/useSavePreset.ts

import { useState, useCallback } from 'react';
import { tauriBridge } from '@/lib/tauri-bridge';
import { SessionMode, CreatePresetInput } from '@/lib/presets/types';

interface SessionConfig {
  mode: SessionMode;
  durationMinutes: number;
  whitelistedApps: string[];
  whitelistedDomains: string[];
  useDefaultBlocklist: boolean;
}

interface UseSavePresetReturn {
  isSaving: boolean;
  error: string | null;
  canSave: boolean;
  presetCount: number;
  checkCanSave: () => Promise<void>;
  savePreset: (
    name: string,
    icon: string,
    config: SessionConfig,
    includeMentalPrep: boolean
  ) => Promise<boolean>;
  clearError: () => void;
}

export function useSavePreset(): UseSavePresetReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canSave, setCanSave] = useState(true);
  const [presetCount, setPresetCount] = useState(0);

  // Check if user can save (under limit)
  const checkCanSave = useCallback(async () => {
    try {
      const count = await tauriBridge.getUserPresetCount();
      setPresetCount(count);
      setCanSave(count < 5);
    } catch (err) {
      console.error('[useSavePreset] Failed to check preset count:', err);
      // Assume they can save if we can't check
      setCanSave(true);
    }
  }, []);

  // Save a new preset
  const savePreset = useCallback(async (
    name: string,
    icon: string,
    config: SessionConfig,
    includeMentalPrep: boolean
  ): Promise<boolean> => {
    setIsSaving(true);
    setError(null);

    try {
      const input: CreatePresetInput = {
        name,
        icon,
        mode: config.mode,
        durationMinutes: config.durationMinutes,
        whitelistedApps: config.whitelistedApps,
        whitelistedDomains: config.whitelistedDomains,
        useDefaultBlocklist: config.useDefaultBlocklist,
        includeMentalPrep,
      };

      await tauriBridge.createUserPreset(input);
      console.log('[useSavePreset] Preset saved:', name);
      return true;

    } catch (err) {
      console.error('[useSavePreset] Failed to save preset:', err);
      const message = err instanceof Error ? err.message : 'Failed to save preset';
      setError(message);
      return false;

    } finally {
      setIsSaving(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isSaving,
    error,
    canSave,
    presetCount,
    checkCanSave,
    savePreset,
    clearError,
  };
}
```

---

## Step 5: Update Presets Components Index

**Prompt for Cursor:**

```
Update the presets components index to export all new components.

Update file: src/components/presets/index.ts

// Entry Point components
export { EntryOptionCard } from './EntryOptionCard';
export { EntryPointPanel } from './EntryPointPanel';

// Quick Start components
export { ModeCard } from './ModeCard';
export { ModeSelector } from './ModeSelector';
export { DurationButton } from './DurationButton';
export { DurationSlider } from './DurationSlider';
export { DurationSelector } from './DurationSelector';
export { SmartDefaultsInfo } from './SmartDefaultsInfo';
export { QuickStartPanel } from './QuickStartPanel';

// Preset Picker components
export { PresetSection } from './PresetSection';
export { PresetSkeleton } from './PresetSkeleton';
export { EmptyPresets } from './EmptyPresets';
export { PresetCard } from './PresetCard';
export { PresetCardMenu } from './PresetCardMenu';
export { PresetPickerPanel } from './PresetPickerPanel';

// Preset Actions components
export { IconPicker } from './IconPicker';
export { PresetEditPanel } from './PresetEditPanel';
export { DeleteConfirmDialog } from './DeleteConfirmDialog';

// Create New / Save Preset components
export { SkipPrepButton } from './SkipPrepButton';
export { ConfigurationSummary } from './ConfigurationSummary';
export { SavePresetPrompt } from './SavePresetPrompt';
```

---

## Step 6: Update Hooks Index

**Prompt for Cursor:**

```
Create or update the hooks index to export all preset-related hooks.

Create/Update file: src/hooks/index.ts

export { usePresets } from './usePresets';
export { useQuickStart } from './useQuickStart';
export { useSavePreset } from './useSavePreset';
```

---

## Step 7: Example Integration with Wizard

**Prompt for Cursor:**

```
This step shows how to integrate the new components with your existing wizard.
Adapt this based on your actual wizard structure.

Example integration pattern:

// In your wizard state management (e.g., App.tsx or a wizard context)

import { useState } from 'react';
import { SavePresetPrompt, SkipPrepButton } from '@/components/presets';
import { useSavePreset } from '@/hooks/useSavePreset';
import { SessionMode } from '@/lib/presets/types';

// Wizard steps now include 'savePrompt'
type WizardStep = 
  | 'entryPoint'
  | 'quickStart'
  | 'presetPicker'
  | 'modeSelect'
  | 'duration'
  | 'apps'
  | 'domains'
  | 'mentalPrep1'
  | 'mentalPrep2'
  | 'savePrompt'  // NEW
  | 'activeSession';

// In your wizard component:
function Wizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('entryPoint');
  const [skippedMentalPrep, setSkippedMentalPrep] = useState(false);
  
  // Wizard configuration state
  const [wizardConfig, setWizardConfig] = useState({
    mode: 'Zen' as SessionMode,
    durationMinutes: 30,
    whitelistedApps: [] as string[],
    whitelistedDomains: [] as string[],
    useDefaultBlocklist: true,
  });

  const { 
    isSaving, 
    canSave, 
    presetCount, 
    checkCanSave, 
    savePreset 
  } = useSavePreset();

  // Handle skip mental prep
  const handleSkipMentalPrep = async () => {
    setSkippedMentalPrep(true);
    await checkCanSave(); // Check if user can save a preset
    setCurrentStep('savePrompt');
  };

  // Handle continue through mental prep
  const handleContinueMentalPrep = async () => {
    if (currentStep === 'mentalPrep1') {
      setCurrentStep('mentalPrep2');
    } else if (currentStep === 'mentalPrep2') {
      await checkCanSave();
      setCurrentStep('savePrompt');
    }
  };

  // Handle save and start
  const handleSaveAndStart = async (name: string, icon: string, includeMentalPrep: boolean) => {
    const success = await savePreset(name, icon, wizardConfig, includeMentalPrep);
    if (success) {
      startSession(wizardConfig);
    }
  };

  // Handle just start (no save)
  const handleJustStart = () => {
    startSession(wizardConfig);
  };

  // Handle back from save prompt
  const handleBackFromSave = () => {
    if (skippedMentalPrep) {
      setCurrentStep('mentalPrep1');
    } else {
      setCurrentStep('mentalPrep2');
    }
  };

  // Start the session
  const startSession = (config: typeof wizardConfig) => {
    // Your existing session start logic
    setCurrentStep('activeSession');
  };

  // Render based on current step
  return (
    <>
      {/* ... other steps ... */}

      {currentStep === 'mentalPrep1' && (
        <MentalPrepPanel1>
          {/* Your existing mental prep content */}
          <ContinueButton onClick={handleContinueMentalPrep} />
          <SkipPrepButton onSkip={handleSkipMentalPrep} />
        </MentalPrepPanel1>
      )}

      {currentStep === 'mentalPrep2' && (
        <MentalPrepPanel2>
          {/* Your existing mental prep content */}
          <ContinueButton onClick={handleContinueMentalPrep} />
          <SkipPrepButton onSkip={handleSkipMentalPrep} />
        </MentalPrepPanel2>
      )}

      {currentStep === 'savePrompt' && (
        <SavePresetPrompt
          config={wizardConfig}
          skippedMentalPrep={skippedMentalPrep}
          onSaveAndStart={handleSaveAndStart}
          onJustStart={handleJustStart}
          onBack={handleBackFromSave}
          canSave={canSave}
          presetCount={presetCount}
          isSaving={isSaving}
        />
      )}

      {/* ... active session ... */}
    </>
  );
}
```

---

## Step 8: Test Save Preset Flow

**Testing Checkpoint 6: Save as Preset Works**

After completing steps 1-7, test the save preset functionality:

### 8.1: Verify Build

```bash
npm run build
```

**Expected:** No TypeScript errors.

### 8.2: Test Components in Isolation

Temporarily render SavePresetPrompt directly:

```typescript
import { SavePresetPrompt } from '@/components/presets';

// Test render:
<SavePresetPrompt
  config={{
    mode: 'Legend',
    durationMinutes: 90,
    whitelistedApps: ['VS Code', 'Terminal', 'Chrome'],
    whitelistedDomains: ['github.com', 'stackoverflow.com'],
    useDefaultBlocklist: true,
  }}
  skippedMentalPrep={false}
  onSaveAndStart={async (name, icon, includeMentalPrep) => {
    console.log('Save and start:', { name, icon, includeMentalPrep });
  }}
  onJustStart={() => console.log('Just start')}
  onBack={() => console.log('Back')}
  canSave={true}
  presetCount={2}
  isSaving={false}
/>
```

### 8.3: Component Tests

| Action | Expected Result |
|--------|-----------------|
| Panel renders | Shows config summary, name input, icon picker |
| Name input focused | Cursor in name field on mount |
| Type name | Text appears, error clears |
| Clear name | Error appears on save attempt |
| Select icon | Icon highlights with cyan border |
| Click "Save & Start" (no name) | Error: "Please enter a name" |
| Click "Save & Start" (with name) | Console logs save data |
| Click "Just Start" | Console logs "Just start" |
| Click Back | Console logs "Back" |
| Press Enter (with name) | Same as clicking Save & Start |

### 8.4: Test SkipPrepButton

```typescript
import { SkipPrepButton } from '@/components/presets';

<SkipPrepButton onSkip={() => console.log('Skip clicked')} />
```

| Action | Expected Result |
|--------|-----------------|
| Button renders | Subtle gray text below divider |
| Hover | Text lightens |
| Click | Console logs "Skip clicked" |

### 8.5: Test ConfigurationSummary

```typescript
import { ConfigurationSummary } from '@/components/presets';

<ConfigurationSummary
  mode="Legend"
  durationMinutes={90}
  whitelistedApps={['VS Code', 'Terminal', 'Chrome', 'Slack', 'Notion']}
  whitelistedDomains={['github.com', 'stackoverflow.com']}
/>
```

| Element | Expected Display |
|---------|------------------|
| Mode | "Legend" with red badge |
| Duration | "90 min" |
| Apps | "VS Code, Terminal, Chrome, and 2 more" |
| Sites | "github.com, stackoverflow.com" |

### 8.6: Test Preset Limit State

```typescript
<SavePresetPrompt
  config={...}
  canSave={false}  // At limit
  presetCount={5}
  // ... other props
/>
```

| Element | Expected |
|---------|----------|
| Warning shown | "You've reached the preset limit (5)" |
| Name input | Hidden |
| Icon picker | Hidden |
| Save & Start button | Hidden |
| Just Start button | Shows as primary button |

### 8.7: Backend Integration Test

After clicking "Save & Start" with a real implementation:

```javascript
// In DevTools console
const presets = await window.__TAURI__.invoke('get_all_presets');
console.log('User presets:', presets.userPresets.map(p => ({
  name: p.name,
  icon: p.icon,
  mode: p.mode,
  duration: p.durationMinutes,
  includeMentalPrep: p.includeMentalPrep
})));
```

### 8.8: Visual Checklist

- [ ] Config summary shows all fields
- [ ] Mode badge has correct color
- [ ] Name input has focus ring
- [ ] Error message is red
- [ ] Icon picker shows grid of emojis
- [ ] Selected icon has cyan border
- [ ] Save & Start button is cyan when enabled
- [ ] Save & Start button is gray when disabled
- [ ] Just Start is subtle text when Save available
- [ ] Just Start is primary button when at limit
- [ ] Preset limit warning has yellow styling
- [ ] Skip button is subtle gray text
- [ ] Skip button has divider above it

---

## Summary: What You Built

| File | Purpose |
|------|---------|
| `src/components/presets/SkipPrepButton.tsx` | Subtle skip link for mental prep |
| `src/components/presets/ConfigurationSummary.tsx` | Shows current config details |
| `src/components/presets/SavePresetPrompt.tsx` | Full save preset screen |
| `src/hooks/useSavePreset.ts` | Save preset logic and state |
| `src/components/presets/index.ts` | Updated exports |
| `src/hooks/index.ts` | Created/updated exports |

---

## Integration Notes

The components are built and ready. You'll need to integrate them with your existing wizard flow:

1. **Add SkipPrepButton** to each mental prep screen
2. **Add 'savePrompt' step** to your wizard state
3. **Track skippedMentalPrep** boolean
4. **Call checkCanSave()** before showing SavePresetPrompt
5. **Wire up the handlers** for save/start/back

The example in Step 7 shows the pattern, but adapt it to your actual code structure.

---

## Current Progress

```
[✅] A1: Data Layer Architecture
[✅] A2: Smart Whitelisting Architecture  
[✅] B1: Backend Prompts
[✅] A3-1: Entry Point Architecture
[✅] A3-2: Quick Start Architecture
[✅] B3-1: Entry Point Prompts
[✅] B3-2: Quick Start Prompts
[✅] A4-1: Preset Selection Architecture
[✅] A4-2: Preset Cards & Actions Architecture
[✅] B4-1: Preset Selection Prompts
[✅] B4-2: Preset Cards & Actions Prompts
[✅] A5: Create New Updates Architecture
[✅] B5: Create New Updates Prompts          

[  ] A6: Integration Architecture
[  ] B6: Integration Prompts
```

---

Ready for **Output A6: Integration - Architecture & Design**?
