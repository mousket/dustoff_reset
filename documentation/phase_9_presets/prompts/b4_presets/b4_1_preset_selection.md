# Phase 9: Presets & Quick Start
## Output B4-1: Preset Selection - Implementation Prompts

---

## Overview

This document contains step-by-step prompts for Cursor to implement the Preset Selection UI - the preset picker panel with sections.

**Depends on:** B3-1 and B3-2 (Entry Point and Quick Start) must be complete.

**Total Steps:** 8
**Estimated Time:** 2-3 hours

---

## Step 1: Update Mode Colors

**Prompt for Cursor:**

```
Update the MODE_INFO in types.ts to use the correct Flow gradient colors.

Update file: src/lib/presets/types.ts

Find the MODE_INFO constant and update the Flow entry:

// Mode display information
export const MODE_INFO: Record<SessionMode, {
  icon: string;
  title: string;
  primaryBenefit: string;
  keyCharacteristic: string;
  color: string;
  bgColor: string;
  borderColor: string;
  buttonBg: string;
}> = {
  Zen: {
    icon: '🧘',
    title: 'Zen',
    primaryBenefit: 'Gentle focus',
    keyCharacteristic: 'No penalties',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500',
    buttonBg: 'bg-blue-500 hover:bg-blue-600',
  },
  Flow: {
    icon: '🌊',
    title: 'Flow',
    primaryBenefit: 'Stay on track',
    keyCharacteristic: 'Delay gates',
    color: 'text-orange-500',
    bgColor: 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10',
    borderColor: 'border-orange-500',
    buttonBg: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600',
  },
  Legend: {
    icon: '🔥',
    title: 'Legend',
    primaryBenefit: 'No escape',
    keyCharacteristic: 'Hard blocks',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500',
    buttonBg: 'bg-red-500 hover:bg-red-600',
  },
};
```

---

## Step 2: Update useQuickStart Hook with New Button Colors

**Prompt for Cursor:**

```
Update the useQuickStart hook to use the new buttonBg from MODE_INFO.

Update file: src/hooks/useQuickStart.ts

Find the buttonBgColor useMemo and update it:

const buttonBgColor = useMemo(() => {
  if (!selectedMode) return 'bg-gray-600';
  return MODE_INFO[selectedMode].buttonBg;
}, [selectedMode]);
```

---

## Step 3: Create PresetSection Component

**Prompt for Cursor:**

```
Create a reusable section wrapper component for the preset picker.

Create file: src/components/presets/PresetSection.tsx

import React from 'react';
import { cn } from '@/lib/utils';

interface PresetSectionProps {
  title: string;
  badge?: number;
  children: React.ReactNode;
  hidden?: boolean;
  className?: string;
}

export const PresetSection: React.FC<PresetSectionProps> = ({
  title,
  badge,
  children,
  hidden = false,
  className,
}) => {
  if (hidden) return null;

  return (
    <section className={cn('space-y-3', className)}>
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {title}
        </h3>
        {badge !== undefined && badge > 0 && (
          <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-700 text-gray-300 rounded-full">
            {badge}
          </span>
        )}
      </div>

      {/* Section Content */}
      <div className="space-y-2">
        {children}
      </div>
    </section>
  );
};
```

---

## Step 4: Create PresetSkeleton Component

**Prompt for Cursor:**

```
Create a loading skeleton component for preset cards.

Create file: src/components/presets/PresetSkeleton.tsx

import React from 'react';
import { cn } from '@/lib/utils';

interface PresetSkeletonProps {
  count?: number;
}

export const PresetSkeleton: React.FC<PresetSkeletonProps> = ({ 
  count = 1 
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse flex items-center gap-4 p-4 rounded-xl bg-gray-800/50 border border-gray-700"
        >
          {/* Icon skeleton */}
          <div className="w-10 h-10 rounded-lg bg-gray-700" />

          {/* Content skeleton */}
          <div className="flex-grow space-y-2">
            {/* Name */}
            <div className="h-4 w-32 rounded bg-gray-700" />
            {/* Mode and duration */}
            <div className="h-3 w-24 rounded bg-gray-700/70" />
          </div>

          {/* Button skeleton */}
          <div className="h-8 w-16 rounded-lg bg-gray-700" />
        </div>
      ))}
    </>
  );
};
```

---

## Step 5: Create EmptyPresets Component

**Prompt for Cursor:**

```
Create an empty state component for when no user presets exist.

Create file: src/components/presets/EmptyPresets.tsx

import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyPresetsProps {
  variant: 'user' | 'all';
  className?: string;
}

export const EmptyPresets: React.FC<EmptyPresetsProps> = ({
  variant,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-6 rounded-xl border-2 border-dashed border-gray-700 text-center',
        className
      )}
    >
      {variant === 'user' ? (
        <>
          <p className="text-gray-400 mb-1">
            No saved presets yet
          </p>
          <p className="text-sm text-gray-500">
            Use "Create New" to build and save your own preset!
          </p>
        </>
      ) : (
        <>
          <p className="text-gray-400 mb-1">
            No presets available
          </p>
          <p className="text-sm text-gray-500">
            Something went wrong loading presets.
          </p>
        </>
      )}
    </div>
  );
};
```

---

## Step 6: Create Simple PresetCard Component (Temporary)

**Prompt for Cursor:**

```
Create a simplified PresetCard component. We'll enhance it in B4-2 with edit/delete actions.

Create file: src/components/presets/PresetCard.tsx

import React from 'react';
import { cn } from '@/lib/utils';
import { SessionPreset, MODE_INFO } from '@/lib/presets/types';

interface PresetCardProps {
  preset: SessionPreset;
  variant?: 'user' | 'default' | 'lastSession';
  onStart: (preset: SessionPreset) => void;
  onEdit?: (preset: SessionPreset) => void;
  onDelete?: (preset: SessionPreset) => void;
  isLoading?: boolean;
  showAppPreview?: boolean;
}

export const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  variant = 'user',
  onStart,
  onEdit,
  onDelete,
  isLoading = false,
  showAppPreview = false,
}) => {
  const modeInfo = MODE_INFO[preset.mode];
  const isLastSession = variant === 'lastSession';
  const isDefault = variant === 'default';
  const canEdit = variant === 'user' && onEdit;
  const canDelete = variant === 'user' && onDelete;

  const handleStart = () => {
    if (!isLoading) {
      onStart(preset);
    }
  };

  // Format app preview text
  const appPreview = showAppPreview && preset.whitelistedApps.length > 0
    ? preset.whitelistedApps.slice(0, 3).join(', ') + 
      (preset.whitelistedApps.length > 3 ? '...' : '')
    : null;

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border transition-all duration-150',
        'hover:border-gray-600',
        isLastSession
          ? 'bg-cyan-500/5 border-cyan-500/30 hover:border-cyan-500/50'
          : 'bg-gray-800/30 border-gray-700',
        isDefault && 'opacity-90'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl',
          isLastSession ? 'bg-cyan-500/20' : 'bg-gray-700/50'
        )}
      >
        {preset.icon}
      </div>

      {/* Content */}
      <div className="flex-grow min-w-0">
        {/* Name */}
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-100 truncate">
            {preset.name}
          </h4>
          {isLastSession && (
            <span className="px-1.5 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded">
              Recent
            </span>
          )}
        </div>

        {/* Mode and Duration */}
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={cn(
              'text-xs font-medium px-1.5 py-0.5 rounded',
              modeInfo.bgColor,
              modeInfo.color
            )}
          >
            {modeInfo.title}
          </span>
          <span className="text-xs text-gray-500">•</span>
          <span className="text-xs text-gray-400">
            {preset.durationMinutes} min
          </span>
        </div>

        {/* App Preview (for Last Session) */}
        {appPreview && (
          <p className="text-xs text-gray-500 mt-1 truncate">
            {appPreview}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* More Menu Placeholder - Will be enhanced in B4-2 */}
        {(canEdit || canDelete) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Open menu in B4-2
              console.log('More menu clicked');
            }}
            className={cn(
              'p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-700',
              'transition-colors'
            )}
            aria-label={`More options for ${preset.name}`}
          >
            •••
          </button>
        )}

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={isLoading}
          className={cn(
            'px-4 py-2 rounded-lg font-medium text-sm text-white transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900',
            isLoading
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-cyan-500 hover:bg-cyan-600 focus:ring-cyan-500'
          )}
        >
          {isLoading ? (
            <span className="flex items-center gap-1">
              <span className="animate-spin text-xs">⏳</span>
            </span>
          ) : (
            'Start'
          )}
        </button>
      </div>
    </div>
  );
};
```

---

## Step 7: Create PresetPickerPanel Component

**Prompt for Cursor:**

```
Create the main Preset Picker panel component.

Create file: src/components/presets/PresetPickerPanel.tsx

import React, { useEffect, useCallback, useState } from 'react';
import { PresetSection } from './PresetSection';
import { PresetCard } from './PresetCard';
import { PresetSkeleton } from './PresetSkeleton';
import { EmptyPresets } from './EmptyPresets';
import { usePresets } from '@/hooks/usePresets';
import { cn } from '@/lib/utils';
import { SessionPreset } from '@/lib/presets/types';

interface PresetPickerPanelProps {
  onBack: () => void;
  onSelectPreset: (preset: SessionPreset) => void;
}

export const PresetPickerPanel: React.FC<PresetPickerPanelProps> = ({
  onBack,
  onSelectPreset,
}) => {
  const {
    lastSession,
    userPresets,
    defaultPresets,
    isLoading,
    error,
    hasLastSession,
    hasUserPresets,
    refreshPresets,
    usePreset,
  } = usePresets();

  const [startingPresetId, setStartingPresetId] = useState<string | null>(null);

  // Handle starting a preset
  const handleStartPreset = async (preset: SessionPreset) => {
    try {
      setStartingPresetId(preset.id);
      
      // Record usage
      const usedPreset = await usePreset(preset.id);
      
      // Notify parent
      onSelectPreset(usedPreset);
      
    } catch (err) {
      console.error('Failed to start preset:', err);
      // TODO: Show error toast
    } finally {
      setStartingPresetId(null);
    }
  };

  // Placeholder handlers for edit/delete (implemented in B4-2)
  const handleEditPreset = (preset: SessionPreset) => {
    console.log('Edit preset:', preset.name);
    // TODO: Implement in B4-2
  };

  const handleDeletePreset = (preset: SessionPreset) => {
    console.log('Delete preset:', preset.name);
    // TODO: Implement in B4-2
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onBack();
    }
  }, [onBack]);

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
          <span className="text-lg">📁</span>
          <h1 className="text-lg font-semibold">Use Preset</h1>
        </div>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4 space-y-6">
        {/* Error State */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
            <p className="text-red-400 mb-2">Couldn't load presets</p>
            <p className="text-sm text-gray-400 mb-3">{error}</p>
            <button
              onClick={refreshPresets}
              className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !error && (
          <>
            <PresetSection title="Recent">
              <PresetSkeleton count={1} />
            </PresetSection>
            <PresetSection title="My Presets">
              <PresetSkeleton count={2} />
            </PresetSection>
            <PresetSection title="Suggested">
              <PresetSkeleton count={4} />
            </PresetSection>
          </>
        )}

        {/* Loaded State */}
        {!isLoading && !error && (
          <>
            {/* Recent Section (Last Session) */}
            <PresetSection title="Recent" hidden={!hasLastSession}>
              {lastSession && (
                <PresetCard
                  preset={lastSession}
                  variant="lastSession"
                  onStart={handleStartPreset}
                  isLoading={startingPresetId === lastSession.id}
                  showAppPreview={true}
                />
              )}
            </PresetSection>

            {/* My Presets Section */}
            <PresetSection title="My Presets" badge={userPresets.length}>
              {hasUserPresets ? (
                userPresets.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    variant="user"
                    onStart={handleStartPreset}
                    onEdit={handleEditPreset}
                    onDelete={handleDeletePreset}
                    isLoading={startingPresetId === preset.id}
                  />
                ))
              ) : (
                <EmptyPresets variant="user" />
              )}
            </PresetSection>

            {/* Suggested Section (Default Presets) */}
            <PresetSection title="Suggested">
              {defaultPresets.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  variant="default"
                  onStart={handleStartPreset}
                  isLoading={startingPresetId === preset.id}
                />
              ))}
            </PresetSection>
          </>
        )}
      </div>

      {/* Footer Hint */}
      <div className="p-4 border-t border-gray-800">
        <p className="text-center text-xs text-gray-500">
          Press <span className="font-mono bg-gray-800 px-1 rounded">Esc</span> to go back
        </p>
      </div>
    </div>
  );
};
```

---

## Step 8: Update Presets Components Index

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
export { PresetPickerPanel } from './PresetPickerPanel';
```

---

## Step 9: Test Preset Picker Panel

**Testing Checkpoint 4: Preset Picker Visible**

After completing steps 1-8, test the Preset Picker panel:

### 9.1: Verify Build

```bash
npm run build
```

**Expected:** No TypeScript errors.

### 9.2: Visual Test

Temporarily modify App.tsx to show Preset Picker panel:

```typescript
import { PresetPickerPanel } from '@/components/presets';
import { SessionPreset } from '@/lib/presets/types';

// In your component:
const handleSelectPreset = (preset: SessionPreset) => {
  console.log('Selected preset:', preset.name);
  console.log('Mode:', preset.mode);
  console.log('Duration:', preset.durationMinutes);
};

// In your render:
<PresetPickerPanel
  onBack={() => console.log('Back clicked')}
  onSelectPreset={handleSelectPreset}
/>
```

### 9.3: Create Test Data

In DevTools console, create a user preset for testing:

```javascript
// Create a user preset
await window.__TAURI__.invoke('create_user_preset', {
  input: {
    name: 'My Test Preset',
    icon: '🧪',
    mode: 'Flow',
    durationMinutes: 45,
    whitelistedApps: ['VS Code', 'Terminal'],
    whitelistedDomains: ['github.com'],
    useDefaultBlocklist: true,
    includeMentalPrep: false
  }
});

// Verify it exists
const presets = await window.__TAURI__.invoke('get_all_presets');
console.log('User presets:', presets.userPresets);
```

### 9.4: Interaction Tests

| Action | Expected Result |
|--------|-----------------|
| Panel loads | Shows loading skeletons briefly |
| After load | Shows all three sections |
| No Last Session (first time) | "Recent" section hidden |
| After Quick Start session | "Recent" shows Last Session |
| No user presets | "My Presets" shows empty state message |
| Has user presets | "My Presets" shows preset cards |
| "Suggested" section | Shows 4 default presets |
| Click Start on any preset | Console logs preset details |
| Press Escape | Console: "Back clicked" |
| Click "← Back" | Console: "Back clicked" |
| Click "•••" on user preset | Console: "More menu clicked" |

### 9.5: Section Display Logic Test

| State | Recent | My Presets | Suggested |
|-------|--------|------------|-----------|
| First launch | Hidden | Empty state | 4 presets |
| After Quick Start | 1 card | Empty state | 4 presets |
| After creating preset | 1 card | 1+ cards | 4 presets |

### 9.6: Visual Checklist

- [ ] Header shows "📁 Use Preset"
- [ ] Back button visible and works
- [ ] Section titles are uppercase and gray
- [ ] "My Presets" shows badge with count
- [ ] Preset cards show icon, name, mode badge, duration
- [ ] Mode badges have correct colors (Zen=blue, Flow=orange gradient, Legend=red)
- [ ] Last Session card has cyan tint
- [ ] Last Session shows "Recent" badge
- [ ] Default presets have no "•••" menu
- [ ] User presets have "•••" menu
- [ ] Start button is cyan
- [ ] Loading skeleton animates
- [ ] Empty state has dashed border
- [ ] Escape key hint shown at bottom

---

## Summary: What You Built

| File | Purpose |
|------|---------|
| `src/lib/presets/types.ts` | Updated MODE_INFO with correct Flow colors |
| `src/hooks/useQuickStart.ts` | Updated to use new buttonBg |
| `src/components/presets/PresetSection.tsx` | Section wrapper with title/badge |
| `src/components/presets/PresetSkeleton.tsx` | Loading skeleton |
| `src/components/presets/EmptyPresets.tsx` | Empty state message |
| `src/components/presets/PresetCard.tsx` | Individual preset card |
| `src/components/presets/PresetPickerPanel.tsx` | Main preset picker panel |

