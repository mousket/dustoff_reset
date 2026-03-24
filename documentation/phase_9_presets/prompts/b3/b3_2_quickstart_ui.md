# Phase 9: Presets & Quick Start
## Output B3-2: Quick Start UI - Implementation Prompts

---

## Overview

This document contains step-by-step prompts for Cursor to implement the Quick Start UI - the 2-click session start flow.

**Depends on:** B3-1 (Entry Point UI) must be complete and working.

**Total Steps:** 10
**Estimated Time:** 2-3 hours

---

## Step 1: Create ModeCard Component

**Prompt for Cursor:**

```
Create a reusable mode selection card component.

Create file: src/components/presets/ModeCard.tsx

import React from 'react';
import { cn } from '@/lib/utils';
import { SessionMode, MODE_INFO } from '@/lib/presets/types';

interface ModeCardProps {
  mode: SessionMode;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const ModeCard: React.FC<ModeCardProps> = ({
  mode,
  isSelected,
  onClick,
  disabled = false,
}) => {
  const info = MODE_INFO[mode];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900',
        disabled && 'opacity-50 cursor-not-allowed',
        isSelected
          ? [
              info.borderColor,
              info.bgColor,
              'focus:ring-current',
            ]
          : [
              'border-gray-700 bg-gray-800/30',
              'hover:border-gray-600 hover:bg-gray-800/50',
              'focus:ring-gray-500',
            ]
      )}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className={cn(
          'absolute top-2 right-2 w-5 h-5 rounded-full',
          'flex items-center justify-center text-xs',
          info.color,
          info.bgColor
        )}>
          ✓
        </div>
      )}

      {/* Icon */}
      <span className="text-3xl mb-2">{info.icon}</span>

      {/* Title */}
      <h3 className={cn(
        'font-semibold text-base',
        isSelected ? info.color : 'text-gray-100'
      )}>
        {info.title}
      </h3>

      {/* Benefits */}
      <p className="text-xs text-gray-400 mt-1 text-center">
        {info.primaryBenefit}
      </p>
      <p className="text-xs text-gray-500 text-center">
        {info.keyCharacteristic}
      </p>
    </button>
  );
};
```

---

## Step 2: Create ModeSelector Component

**Prompt for Cursor:**

```
Create the mode selector component that displays all three modes.

Create file: src/components/presets/ModeSelector.tsx

import React from 'react';
import { ModeCard } from './ModeCard';
import { SessionMode } from '@/lib/presets/types';

interface ModeSelectorProps {
  selectedMode: SessionMode | null;
  onSelect: (mode: SessionMode) => void;
  disabled?: boolean;
}

const MODES: SessionMode[] = ['Zen', 'Flow', 'Legend'];

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  selectedMode,
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">
        Choose Your Mode
      </h3>
      
      <div className="grid grid-cols-3 gap-3">
        {MODES.map((mode) => (
          <ModeCard
            key={mode}
            mode={mode}
            isSelected={selectedMode === mode}
            onClick={() => onSelect(mode)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
};
```

---

## Step 3: Create DurationButton Component

**Prompt for Cursor:**

```
Create a single duration quick-select button component.

Create file: src/components/presets/DurationButton.tsx

import React from 'react';
import { cn } from '@/lib/utils';

interface DurationButtonProps {
  minutes: number;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const DurationButton: React.FC<DurationButtonProps> = ({
  minutes,
  isSelected,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-3 py-2 rounded-lg font-medium text-sm transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1 focus:ring-offset-gray-900',
        disabled && 'opacity-50 cursor-not-allowed',
        isSelected
          ? 'bg-cyan-500 text-white'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      )}
    >
      {minutes}
    </button>
  );
};
```

---

## Step 4: Create DurationSlider Component

**Prompt for Cursor:**

```
Create a duration slider component.

Create file: src/components/presets/DurationSlider.tsx

import React from 'react';
import { cn } from '@/lib/utils';

interface DurationSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export const DurationSlider: React.FC<DurationSliderProps> = ({
  value,
  onChange,
  min = 5,
  max = 120,
  step = 5,
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  // Calculate percentage for custom styling
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            'w-full h-2 rounded-full appearance-none cursor-pointer',
            'bg-gray-700',
            'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900',
            disabled && 'opacity-50 cursor-not-allowed',
            // Custom thumb styling
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-5',
            '[&::-webkit-slider-thumb]:h-5',
            '[&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:bg-cyan-500',
            '[&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-webkit-slider-thumb]:transition-transform',
            '[&::-webkit-slider-thumb]:hover:scale-110',
            // Firefox
            '[&::-moz-range-thumb]:w-5',
            '[&::-moz-range-thumb]:h-5',
            '[&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:bg-cyan-500',
            '[&::-moz-range-thumb]:border-0',
            '[&::-moz-range-thumb]:cursor-pointer',
          )}
          style={{
            background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${percentage}%, #374151 ${percentage}%, #374151 100%)`,
          }}
        />
      </div>
      
      {/* Min/Max labels */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>{min} min</span>
        <span>{max} min</span>
      </div>
    </div>
  );
};
```

---

## Step 5: Create DurationSelector Component

**Prompt for Cursor:**

```
Create the duration selector component with quick buttons and slider.

Create file: src/components/presets/DurationSelector.tsx

import React from 'react';
import { DurationButton } from './DurationButton';
import { DurationSlider } from './DurationSlider';
import { DURATION_OPTIONS } from '@/lib/presets/types';

interface DurationSelectorProps {
  duration: number;
  onChange: (minutes: number) => void;
  disabled?: boolean;
}

export const DurationSelector: React.FC<DurationSelectorProps> = ({
  duration,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">
        Set Duration
      </h3>

      {/* Quick select buttons */}
      <div className="flex flex-wrap gap-2">
        {DURATION_OPTIONS.map((minutes) => (
          <DurationButton
            key={minutes}
            minutes={minutes}
            isSelected={duration === minutes}
            onClick={() => onChange(minutes)}
            disabled={disabled}
          />
        ))}
        <span className="flex items-center text-sm text-gray-400 ml-1">
          minutes
        </span>
      </div>

      {/* Slider */}
      <DurationSlider
        value={duration}
        onChange={onChange}
        disabled={disabled}
      />

      {/* Current value display */}
      <div className="text-center">
        <span className="text-2xl font-bold text-gray-100">{duration}</span>
        <span className="text-gray-400 ml-2">minutes</span>
      </div>
    </div>
  );
};
```

---

## Step 6: Create SmartDefaultsInfo Component

**Prompt for Cursor:**

```
Create the smart defaults info footer component.

Create file: src/components/presets/SmartDefaultsInfo.tsx

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface SmartDefaultsInfoProps {
  className?: string;
}

export const SmartDefaultsInfo: React.FC<SmartDefaultsInfoProps> = ({
  className,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={cn('text-center', className)}>
      <p className="text-xs text-gray-500">
        Using smart defaults: productivity apps allowed, social media & games blocked.{' '}
        <button
          onClick={() => setShowDetails(true)}
          className="text-cyan-500 hover:text-cyan-400 underline"
        >
          Learn more
        </button>
      </p>

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">
              Smart Defaults
            </h3>
            
            <p className="text-sm text-gray-300 mb-4">
              Quick Start uses intelligent defaults so you can start working immediately.
            </p>

            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-green-400 mb-1">✅ Allowed:</h4>
                <p className="text-gray-400">
                  VS Code, Terminal, Slack, Notion, Chrome, and other productivity apps.
                  Sites like github.com, docs.google.com, notion.so.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-red-400 mb-1">❌ Blocked:</h4>
                <p className="text-gray-400">
                  Social media (Twitter, Instagram, TikTok), games (Steam, Epic Games),
                  entertainment (Netflix, Twitch).
                </p>
              </div>

              <div>
                <h4 className="font-medium text-yellow-400 mb-1">⚠️ Unknown:</h4>
                <p className="text-gray-400">
                  Apps we don't recognize will ask "Is this for work?" The system learns
                  from your choices.
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Want full control? Use "Create New" instead.
            </p>

            <button
              onClick={() => setShowDetails(false)}
              className={cn(
                'mt-4 w-full py-2 px-4 rounded-lg',
                'bg-gray-700 text-gray-200',
                'hover:bg-gray-600 transition-colors'
              )}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## Step 7: Create useQuickStart Hook

**Prompt for Cursor:**

```
Create the Quick Start logic hook.

Create file: src/hooks/useQuickStart.ts

import { useState, useMemo, useCallback } from 'react';
import { tauriBridge } from '@/lib/tauri-bridge';
import { SessionMode, QuickStartConfig, MODE_INFO } from '@/lib/presets/types';

export interface UseQuickStartReturn {
  // State
  selectedMode: SessionMode | null;
  duration: number;
  isLoading: boolean;
  error: string | null;
  
  // Computed
  canStart: boolean;
  buttonColor: string;
  buttonBgColor: string;
  
  // Actions
  setMode: (mode: SessionMode) => void;
  setDuration: (minutes: number) => void;
  startSession: () => Promise<QuickStartConfig | null>;
  clearError: () => void;
}

export function useQuickStart(): UseQuickStartReturn {
  const [selectedMode, setSelectedMode] = useState<SessionMode | null>(null);
  const [duration, setDuration] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed: Can we start a session?
  const canStart = selectedMode !== null && duration > 0 && !isLoading;

  // Computed: Button colors based on mode
  const buttonColor = useMemo(() => {
    if (!selectedMode) return 'text-gray-400';
    return MODE_INFO[selectedMode].color;
  }, [selectedMode]);

  const buttonBgColor = useMemo(() => {
    if (!selectedMode) return 'bg-gray-600';
    switch (selectedMode) {
      case 'Zen': return 'bg-blue-500 hover:bg-blue-600';
      case 'Flow': return 'bg-purple-500 hover:bg-purple-600';
      case 'Legend': return 'bg-red-500 hover:bg-red-600';
    }
  }, [selectedMode]);

  // Actions
  const setMode = useCallback((mode: SessionMode) => {
    setSelectedMode(mode);
    setError(null);
    console.log('[useQuickStart] Mode selected:', mode);
  }, []);

  const setDurationValue = useCallback((minutes: number) => {
    // Clamp between 5 and 120
    const clamped = Math.min(120, Math.max(5, minutes));
    setDuration(clamped);
    setError(null);
    console.log('[useQuickStart] Duration set:', clamped);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const startSession = useCallback(async (): Promise<QuickStartConfig | null> => {
    if (!selectedMode) {
      setError('Please select a mode');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[useQuickStart] Starting session...', { mode: selectedMode, duration });

      // 1. Get smart defaults from backend
      const config = await tauriBridge.getQuickStartConfig(selectedMode, duration);
      console.log('[useQuickStart] Got config:', {
        whitelistedApps: config.whitelistedApps.length,
        blockedDomains: config.blockedDomains.length,
      });

      // 2. Save as Last Session for next time
      await tauriBridge.saveAsLastSession(
        selectedMode,
        duration,
        config.whitelistedApps,
        config.whitelistedDomains,
        true,  // useDefaultBlocklist
        false  // includeMentalPrep (Quick Start skips this)
      );
      console.log('[useQuickStart] Saved as Last Session');

      // 3. Return the config for the caller to start the session
      return config;

    } catch (err) {
      console.error('[useQuickStart] Failed to start session:', err);
      
      const message = err instanceof Error ? err.message : 'Failed to start session';
      setError(message);
      return null;

    } finally {
      setIsLoading(false);
    }
  }, [selectedMode, duration]);

  return {
    selectedMode,
    duration,
    isLoading,
    error,
    canStart,
    buttonColor,
    buttonBgColor,
    setMode,
    setDuration: setDurationValue,
    startSession,
    clearError,
  };
}
```

---

## Step 8: Create QuickStartPanel Component

**Prompt for Cursor:**

```
Create the main Quick Start panel component.

Create file: src/components/presets/QuickStartPanel.tsx

import React, { useEffect, useCallback } from 'react';
import { ModeSelector } from './ModeSelector';
import { DurationSelector } from './DurationSelector';
import { SmartDefaultsInfo } from './SmartDefaultsInfo';
import { useQuickStart } from '@/hooks/useQuickStart';
import { cn } from '@/lib/utils';
import { SessionMode, QuickStartConfig } from '@/lib/presets/types';

interface QuickStartPanelProps {
  onBack: () => void;
  onSessionStart: (config: QuickStartConfig) => void;
}

export const QuickStartPanel: React.FC<QuickStartPanelProps> = ({
  onBack,
  onSessionStart,
}) => {
  const {
    selectedMode,
    duration,
    isLoading,
    error,
    canStart,
    buttonBgColor,
    setMode,
    setDuration,
    startSession,
    clearError,
  } = useQuickStart();

  // Handle session start
  const handleStart = async () => {
    const config = await startSession();
    if (config) {
      onSessionStart(config);
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
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
        if (canStart) {
          handleStart();
        }
        break;
    }
  }, [setMode, onBack, canStart]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-gray-400 hover:text-gray-200 transition-colors"
          aria-label="Back"
        >
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <h1 className="text-lg font-semibold">Quick Start</h1>
        </div>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4 space-y-6">
        {/* Mode Selector */}
        <ModeSelector
          selectedMode={selectedMode}
          onSelect={setMode}
          disabled={isLoading}
        />

        {/* Divider */}
        <div className="border-t border-gray-800" />

        {/* Duration Selector */}
        <DurationSelector
          duration={duration}
          onChange={setDuration}
          disabled={isLoading}
        />

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 space-y-3">
        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={!canStart}
          className={cn(
            'w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900',
            canStart
              ? [buttonBgColor, 'focus:ring-current']
              : 'bg-gray-600 cursor-not-allowed opacity-50'
          )}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              Starting...
            </span>
          ) : (
            'Start Session'
          )}
        </button>

        {/* Smart Defaults Info */}
        <SmartDefaultsInfo />

        {/* Keyboard hint */}
        <p className="text-center text-xs text-gray-500">
          Press <span className="font-mono bg-gray-800 px-1 rounded">Enter</span> to start,{' '}
          <span className="font-mono bg-gray-800 px-1 rounded">Esc</span> to go back
        </p>
      </div>
    </div>
  );
};
```

---

## Step 9: Update Presets Components Index

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
```

---

## Step 10: Test Quick Start Panel

**Testing Checkpoint 3: Quick Start Functional**

After completing steps 1-9, test the Quick Start panel:

### 10.1: Verify Build

```bash
npm run build
```

**Expected:** No TypeScript errors.

### 10.2: Visual Test

Temporarily modify App.tsx to show Quick Start panel:

```typescript
import { QuickStartPanel } from '@/components/presets';
import { QuickStartConfig } from '@/lib/presets/types';

// In your component:
const handleSessionStart = (config: QuickStartConfig) => {
  console.log('Session config:', config);
  console.log('Mode:', config.mode);
  console.log('Duration:', config.durationMinutes);
  console.log('Whitelisted Apps:', config.whitelistedApps.length);
  console.log('Blocked Domains:', config.blockedDomains.length);
};

// In your render:
<QuickStartPanel
  onBack={() => console.log('Back clicked')}
  onSessionStart={handleSessionStart}
/>
```

### 10.3: Interaction Tests

| Action | Expected Result |
|--------|-----------------|
| Click Zen card | Card highlights blue, checkmark appears |
| Click Flow card | Card highlights purple, Zen deselects |
| Click Legend card | Card highlights red, Flow deselects |
| Press "1" key | Zen selected |
| Press "2" key | Flow selected |
| Press "3" key | Legend selected |
| Click [15] button | Slider moves to 15, "15" button highlighted |
| Click [45] button | Slider moves to 45, "45" button highlighted |
| Drag slider to 37 | Duration shows 35 (rounds to step), no button highlighted |
| Drag slider to 60 | Duration shows 60, "60" button highlighted |
| Start button (no mode) | Button is disabled, gray |
| Select mode | Button enables, shows mode color |
| Click Start button | Loading state, then console logs config |
| Press Enter (mode selected) | Same as clicking Start |
| Press Escape | Console: "Back clicked" |
| Click "← Back" | Console: "Back clicked" |
| Click "Learn more" | Modal appears with smart defaults info |
| Click "Got it" in modal | Modal closes |

### 10.4: Backend Integration Test

After clicking Start with mode and duration selected:

```javascript
// In DevTools console, verify Last Session was saved
const presets = await window.__TAURI__.invoke('get_all_presets')
console.log('Last Session:', presets.lastSession)
// Expected: Object with mode/duration matching your selection
```

### 10.5: Visual Checklist

- [ ] Mode cards are in a row (3 columns)
- [ ] Mode cards show icon, title, benefits
- [ ] Selected mode has colored border and checkmark
- [ ] Duration buttons are in a row
- [ ] Selected duration button is cyan
- [ ] Slider thumb is cyan
- [ ] Slider track fills cyan from left
- [ ] Current duration displays large
- [ ] Start button color matches mode
- [ ] Start button disabled when no mode selected
- [ ] Loading spinner shows when starting
- [ ] Error message displays with dismiss button
- [ ] Smart defaults link opens modal
- [ ] Keyboard hints shown at bottom

---

## Summary: What You Built

| File | Purpose |
|------|---------|
| `src/components/presets/ModeCard.tsx` | Single mode display card |
| `src/components/presets/ModeSelector.tsx` | Row of 3 mode cards |
| `src/components/presets/DurationButton.tsx` | Single duration quick button |
| `src/components/presets/DurationSlider.tsx` | Range slider for duration |
| `src/components/presets/DurationSelector.tsx` | Buttons + slider combined |
| `src/components/presets/SmartDefaultsInfo.tsx` | Footer info + modal |
| `src/components/presets/QuickStartPanel.tsx` | Main Quick Start panel |
| `src/hooks/useQuickStart.ts` | Quick Start state and logic |

---

## Files Created/Updated in B3-1 + B3-2

| File | B3-1 | B3-2 |
|------|------|------|
| `src/lib/presets/types.ts` | ✅ Created | |
| `src/lib/presets/index.ts` | ✅ Created | |
| `src/lib/tauri-bridge.ts` | ✅ Updated | |
| `src/hooks/usePresets.ts` | ✅ Created | |
| `src/hooks/useQuickStart.ts` | | ✅ Created |
| `src/components/presets/EntryOptionCard.tsx` | ✅ Created | |
| `src/components/presets/EntryPointPanel.tsx` | ✅ Created | |
| `src/components/presets/ModeCard.tsx` | | ✅ Created |
| `src/components/presets/ModeSelector.tsx` | | ✅ Created |
| `src/components/presets/DurationButton.tsx` | | ✅ Created |
| `src/components/presets/DurationSlider.tsx` | | ✅ Created |
| `src/components/presets/DurationSelector.tsx` | | ✅ Created |
| `src/components/presets/SmartDefaultsInfo.tsx` | | ✅ Created |
| `src/components/presets/QuickStartPanel.tsx` | | ✅ Created |
| `src/components/presets/index.ts` | ✅ Created | ✅ Updated |



