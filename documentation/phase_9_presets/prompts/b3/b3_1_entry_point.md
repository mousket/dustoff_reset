# Phase 9: Presets & Quick Start
## Output B3-1: Entry Point UI - Implementation Prompts

---

## Overview

This document contains step-by-step prompts for Cursor to implement the Entry Point UI - the "How do you want to start?" screen.

**Depends on:** B1 (Backend) must be complete and working.

**Total Steps:** 8
**Estimated Time:** 2-3 hours

---

## Step 1: Create TypeScript Types for Presets

**Prompt for Cursor:**

```
Create TypeScript types for the preset system that mirror the Rust types.

Create file: src/lib/presets/types.ts

// Session mode type
export type SessionMode = 'Zen' | 'Flow' | 'Legend';

// App category type
export type AppCategory = 
  | 'productivity' 
  | 'communication' 
  | 'browser' 
  | 'entertainment' 
  | 'social' 
  | 'game' 
  | 'utility' 
  | 'unknown';

// A saved session preset
export interface SessionPreset {
  id: string;
  name: string;
  icon: string;
  mode: SessionMode;
  durationMinutes: number;
  whitelistedApps: string[];
  whitelistedDomains: string[];
  useDefaultBlocklist: boolean;
  includeMentalPrep: boolean;
  isDefault: boolean;
  isLastSession: boolean;
  createdAt: number;
  updatedAt: number;
  lastUsedAt: number | null;
  usageCount: number;
}

// Response from get_all_presets
export interface AllPresetsResponse {
  lastSession: SessionPreset | null;
  userPresets: SessionPreset[];
  defaultPresets: SessionPreset[];
}

// Input for creating a preset
export interface CreatePresetInput {
  name: string;
  icon: string;
  mode: string;
  durationMinutes: number;
  whitelistedApps: string[];
  whitelistedDomains: string[];
  useDefaultBlocklist: boolean;
  includeMentalPrep: boolean;
}

// Quick start configuration from backend
export interface QuickStartConfig {
  mode: SessionMode;
  durationMinutes: number;
  whitelistedApps: string[];
  whitelistedDomains: string[];
  blockedApps: string[];
  blockedDomains: string[];
}

// Preset icons available for selection
export const PRESET_ICONS = [
  '🎯', '🔥', '🌊', '🧘', '⚡', '🚀', 
  '💻', '📝', '📧', '🎨', '📚', '🔧',
  '💡', '🏃', '🎮', '🎵', '📊', '✨'
] as const;

// Duration quick-select options (minutes)
export const DURATION_OPTIONS = [15, 25, 30, 45, 60, 90] as const;

// Max user presets allowed
export const MAX_USER_PRESETS = 5;

// Mode display information
export const MODE_INFO: Record<SessionMode, {
  icon: string;
  title: string;
  primaryBenefit: string;
  keyCharacteristic: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  Zen: {
    icon: '🧘',
    title: 'Zen',
    primaryBenefit: 'Gentle focus',
    keyCharacteristic: 'No penalties',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500',
  },
  Flow: {
    icon: '🌊',
    title: 'Flow',
    primaryBenefit: 'Stay on track',
    keyCharacteristic: 'Delay gates',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500',
  },
  Legend: {
    icon: '🔥',
    title: 'Legend',
    primaryBenefit: 'No escape',
    keyCharacteristic: 'Hard blocks',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500',
  },
};
```

---

## Step 2: Create Presets Module Index

**Prompt for Cursor:**

```
Create the presets module index file.

Create file: src/lib/presets/index.ts

export * from './types';
```

---

## Step 3: Update Tauri Bridge with Preset Commands

**Prompt for Cursor:**

```
Add preset commands to the Tauri bridge.

Update file: src/lib/tauri-bridge.ts

Add these imports at the top:
import type { 
  AllPresetsResponse, 
  SessionPreset, 
  CreatePresetInput,
  QuickStartConfig 
} from '@/lib/presets/types';

Add these methods to the tauriBridge object:

// Preset commands
initPresets: async (): Promise<void> => {
  return invoke('init_presets');
},

getAllPresets: async (): Promise<AllPresetsResponse> => {
  return invoke('get_all_presets');
},

getPreset: async (id: string): Promise<SessionPreset> => {
  return invoke('get_preset', { id });
},

createUserPreset: async (input: CreatePresetInput): Promise<SessionPreset> => {
  return invoke('create_user_preset', { input });
},

updateUserPreset: async (input: { 
  id: string; 
  name?: string; 
  icon?: string;
  mode?: string;
  durationMinutes?: number;
  whitelistedApps?: string[];
  whitelistedDomains?: string[];
  useDefaultBlocklist?: boolean;
  includeMentalPrep?: boolean;
}): Promise<SessionPreset> => {
  return invoke('update_user_preset', { input });
},

deleteUserPreset: async (id: string): Promise<void> => {
  return invoke('delete_user_preset', { id });
},

saveAsLastSession: async (
  mode: string,
  durationMinutes: number,
  whitelistedApps: string[],
  whitelistedDomains: string[],
  useDefaultBlocklist: boolean,
  includeMentalPrep: boolean
): Promise<void> => {
  return invoke('save_as_last_session', {
    mode,
    durationMinutes,
    whitelistedApps,
    whitelistedDomains,
    useDefaultBlocklist,
    includeMentalPrep,
  });
},

usePreset: async (id: string): Promise<SessionPreset> => {
  return invoke('use_preset', { id });
},

getQuickStartConfig: async (
  mode: string, 
  durationMinutes: number
): Promise<QuickStartConfig> => {
  return invoke('get_quick_start_config', { mode, durationMinutes });
},

getUserPresetCount: async (): Promise<number> => {
  return invoke('get_user_preset_count');
},

getBlockedDomains: async (): Promise<string[]> => {
  return invoke('get_blocked_domains');
},

getWhitelistedDomains: async (): Promise<string[]> => {
  return invoke('get_whitelisted_domains');
},
```

---

## Step 4: Create usePresets Hook

**Prompt for Cursor:**

```
Create a hook for managing preset state.

Create file: src/hooks/usePresets.ts

import { useState, useEffect, useCallback } from 'react';
import { tauriBridge } from '@/lib/tauri-bridge';
import type { 
  SessionPreset, 
  AllPresetsResponse,
  CreatePresetInput 
} from '@/lib/presets/types';

export interface UsePresetsReturn {
  // State
  lastSession: SessionPreset | null;
  userPresets: SessionPreset[];
  defaultPresets: SessionPreset[];
  isLoading: boolean;
  error: string | null;
  
  // Computed
  hasLastSession: boolean;
  hasUserPresets: boolean;
  userPresetCount: number;
  canCreatePreset: boolean;
  
  // Actions
  refreshPresets: () => Promise<void>;
  createPreset: (input: CreatePresetInput) => Promise<SessionPreset>;
  deletePreset: (id: string) => Promise<void>;
  usePreset: (id: string) => Promise<SessionPreset>;
}

export function usePresets(): UsePresetsReturn {
  const [lastSession, setLastSession] = useState<SessionPreset | null>(null);
  const [userPresets, setUserPresets] = useState<SessionPreset[]>([]);
  const [defaultPresets, setDefaultPresets] = useState<SessionPreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all presets
  const refreshPresets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response: AllPresetsResponse = await tauriBridge.getAllPresets();
      
      setLastSession(response.lastSession);
      setUserPresets(response.userPresets);
      setDefaultPresets(response.defaultPresets);
      
      console.log('[usePresets] Loaded presets:', {
        lastSession: response.lastSession?.name || 'None',
        userPresets: response.userPresets.length,
        defaultPresets: response.defaultPresets.length,
      });
    } catch (err) {
      console.error('[usePresets] Failed to load presets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load presets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new preset
  const createPreset = useCallback(async (input: CreatePresetInput): Promise<SessionPreset> => {
    try {
      const preset = await tauriBridge.createUserPreset(input);
      await refreshPresets(); // Refresh list
      console.log('[usePresets] Created preset:', preset.name);
      return preset;
    } catch (err) {
      console.error('[usePresets] Failed to create preset:', err);
      throw err;
    }
  }, [refreshPresets]);

  // Delete a preset
  const deletePreset = useCallback(async (id: string): Promise<void> => {
    try {
      await tauriBridge.deleteUserPreset(id);
      await refreshPresets(); // Refresh list
      console.log('[usePresets] Deleted preset:', id);
    } catch (err) {
      console.error('[usePresets] Failed to delete preset:', err);
      throw err;
    }
  }, [refreshPresets]);

  // Use a preset (records usage)
  const usePresetAction = useCallback(async (id: string): Promise<SessionPreset> => {
    try {
      const preset = await tauriBridge.usePreset(id);
      console.log('[usePresets] Using preset:', preset.name);
      return preset;
    } catch (err) {
      console.error('[usePresets] Failed to use preset:', err);
      throw err;
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshPresets();
  }, [refreshPresets]);

  // Computed values
  const hasLastSession = lastSession !== null;
  const hasUserPresets = userPresets.length > 0;
  const userPresetCount = userPresets.length;
  const canCreatePreset = userPresetCount < 5;

  return {
    lastSession,
    userPresets,
    defaultPresets,
    isLoading,
    error,
    hasLastSession,
    hasUserPresets,
    userPresetCount,
    canCreatePreset,
    refreshPresets,
    createPreset,
    deletePreset,
    usePreset: usePresetAction,
  };
}
```

---

## Step 5: Create EntryOptionCard Component

**Prompt for Cursor:**

```
Create a reusable option card component for the Entry Point panel.

Create file: src/components/presets/EntryOptionCard.tsx

import React from 'react';
import { cn } from '@/lib/utils';

interface EntryOptionCardProps {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
  shortcutKey?: string;
  disabled?: boolean;
  className?: string;
}

export const EntryOptionCard: React.FC<EntryOptionCardProps> = ({
  icon,
  title,
  description,
  onClick,
  shortcutKey,
  disabled = false,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full p-4 rounded-xl border-2 transition-all duration-200',
        'flex items-center gap-4 text-left',
        'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900',
        disabled
          ? 'border-gray-700 bg-gray-800/50 cursor-not-allowed opacity-50'
          : [
              'border-gray-700 bg-gray-800/30',
              'hover:border-cyan-500/50 hover:bg-cyan-500/5',
              'active:border-cyan-500 active:bg-cyan-500/10',
            ],
        className
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-14 h-14 rounded-xl',
          'flex items-center justify-center',
          'text-3xl',
          disabled ? 'bg-gray-700' : 'bg-gray-700/50'
        )}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={cn(
            'font-semibold text-lg',
            disabled ? 'text-gray-500' : 'text-gray-100'
          )}>
            {title}
          </h3>
          {shortcutKey && !disabled && (
            <span className="px-1.5 py-0.5 text-xs font-mono bg-gray-700 text-gray-400 rounded">
              {shortcutKey}
            </span>
          )}
        </div>
        <p className={cn(
          'text-sm mt-0.5',
          disabled ? 'text-gray-600' : 'text-gray-400'
        )}>
          {description}
        </p>
      </div>

      {/* Arrow */}
      <div className={cn(
        'flex-shrink-0 text-xl',
        disabled ? 'text-gray-600' : 'text-gray-500'
      )}>
        →
      </div>
    </button>
  );
};
```

---

## Step 6: Create EntryPointPanel Component

**Prompt for Cursor:**

```
Create the main Entry Point panel - the "How do you want to start?" screen.

Create file: src/components/presets/EntryPointPanel.tsx

import React, { useEffect, useCallback } from 'react';
import { EntryOptionCard } from './EntryOptionCard';
import { cn } from '@/lib/utils';

interface EntryPointPanelProps {
  onSelectQuickStart: () => void;
  onSelectPreset: () => void;
  onSelectCreateNew: () => void;
  onClose: () => void;
}

export const EntryPointPanel: React.FC<EntryPointPanelProps> = ({
  onSelectQuickStart,
  onSelectPreset,
  onSelectCreateNew,
  onClose,
}) => {
  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case '1':
        onSelectQuickStart();
        break;
      case '2':
        onSelectPreset();
        break;
      case '3':
        onSelectCreateNew();
        break;
      case 'Escape':
        onClose();
        break;
    }
  }, [onSelectQuickStart, onSelectPreset, onSelectCreateNew, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button
          onClick={onClose}
          className="p-2 -ml-2 text-gray-400 hover:text-gray-200 transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
        <h1 className="text-lg font-semibold">Start Session</h1>
        <div className="w-8" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4">
        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-100">
            How do you want to start?
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Choose the option that fits your needs
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <EntryOptionCard
            icon="⚡"
            title="Quick Start"
            description="Smart defaults, 2 clicks to focus"
            onClick={onSelectQuickStart}
            shortcutKey="1"
          />

          <EntryOptionCard
            icon="📁"
            title="Use Preset"
            description="Start from a saved configuration"
            onClick={onSelectPreset}
            shortcutKey="2"
          />

          <EntryOptionCard
            icon="✨"
            title="Create New"
            description="Full configuration wizard"
            onClick={onSelectCreateNew}
            shortcutKey="3"
          />
        </div>

        {/* Keyboard hint */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Press <span className="font-mono bg-gray-800 px-1 rounded">1</span>,{' '}
          <span className="font-mono bg-gray-800 px-1 rounded">2</span>, or{' '}
          <span className="font-mono bg-gray-800 px-1 rounded">3</span> to quick select
        </p>
      </div>
    </div>
  );
};
```

---

## Step 7: Create Presets Components Index

**Prompt for Cursor:**

```
Create the presets components index file.

Create file: src/components/presets/index.ts

export { EntryOptionCard } from './EntryOptionCard';
export { EntryPointPanel } from './EntryPointPanel';
```

---

## Step 8: Test Entry Point Panel

**Testing Checkpoint:**

After completing steps 1-7, test the Entry Point panel:

### 8.1: Verify Build

```bash
npm run build
```

**Expected:** No TypeScript errors.

### 8.2: Verify Tauri Bridge

Open the app and test in DevTools console:

```javascript
// Test preset commands exist
await window.__TAURI__.invoke('get_all_presets')

// Expected: { lastSession: null, userPresets: [], defaultPresets: [...] }
```

### 8.3: Render Entry Point Panel

Temporarily add to App.tsx to test the panel visually:

```typescript
// In App.tsx, add import:
import { EntryPointPanel } from '@/components/presets';

// Temporarily render it:
return (
  <EntryPointPanel
    onSelectQuickStart={() => console.log('Quick Start selected')}
    onSelectPreset={() => console.log('Preset selected')}
    onSelectCreateNew={() => console.log('Create New selected')}
    onClose={() => console.log('Close')}
  />
);
```

### 8.4: Test Interactions

| Action | Expected Result |
|--------|-----------------|
| Click Quick Start card | Console: "Quick Start selected" |
| Click Use Preset card | Console: "Preset selected" |
| Click Create New card | Console: "Create New selected" |
| Click X button | Console: "Close" |
| Press "1" key | Console: "Quick Start selected" |
| Press "2" key | Console: "Preset selected" |
| Press "3" key | Console: "Create New selected" |
| Press Escape key | Console: "Close" |
| Tab through options | Focus ring visible on each card |

### 8.5: Visual Check

Verify:
- [ ] Cards are vertically stacked
- [ ] Icons display correctly (⚡, 📁, ✨)
- [ ] Hover states work (border color changes)
- [ ] Keyboard shortcuts display (1, 2, 3)
- [ ] Header shows "Start Session"
- [ ] Close button (X) is visible

---

## Summary: What You Built

| File | Purpose |
|------|---------|
| `src/lib/presets/types.ts` | TypeScript types for presets |
| `src/lib/presets/index.ts` | Module exports |
| `src/lib/tauri-bridge.ts` | Updated with preset commands |
| `src/hooks/usePresets.ts` | Preset state management hook |
| `src/components/presets/EntryOptionCard.tsx` | Reusable option card |
| `src/components/presets/EntryPointPanel.tsx` | Entry Point panel |
| `src/components/presets/index.ts` | Component exports |

