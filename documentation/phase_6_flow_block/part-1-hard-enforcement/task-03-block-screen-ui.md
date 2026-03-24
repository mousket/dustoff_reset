# Task: Implement Block Screen UI Component

## Phase: 6
## Part: 1 (Hard Enforcement)
## Task: 03
## Depends On: task-02-block-screen-rust
## Estimated Time: 2 hours

---

## Context Files

- `src/components/enforcement/BlockScreen.tsx` (create)
- `src/components/enforcement/ReflectionPrompt.tsx` (create)
- `src/components/enforcement/index.ts` (create)
- `src/hooks/useBlockScreen.ts` (create)
- `src/lib/tauri-bridge.ts` (update with enforcement commands)

---

## Success Criteria

- [ ] BlockScreen component renders full-screen overlay
- [ ] Countdown timer displays and updates every second
- [ ] "Dismiss" button is disabled until timer completes (Legend mode)
- [ ] Violation count displays correctly ("This is distraction #2")
- [ ] Escalation message changes based on violation count
- [ ] ReflectionPrompt appears for level 3+ violations
- [ ] useBlockScreen hook manages state and timer
- [ ] Tauri bridge has all enforcement commands
- [ ] Component is accessible (focus trap, aria labels)

---

## Test Cases

- Render BlockScreen with violation #1 → expect 30 second timer, no reflection
- Render BlockScreen with violation #3 → expect 90 second timer, reflection prompt visible
- Timer counts down → expect remaining time updates every second
- Timer reaches 0 → expect "Dismiss" button becomes enabled
- Click disabled Dismiss button → expect nothing happens
- Click enabled Dismiss button → expect onDismiss callback fires
- Escape key pressed → expect nothing (cannot escape in Legend mode)
- Select reflection option → expect option is recorded

---

## Implementation Prompt

```
Create the Block Screen UI component for the hard enforcement system.

First, update the Tauri bridge with enforcement commands:

Update file: src/lib/tauri-bridge.ts

Add these methods to the tauriBridge object:

```typescript
// Enforcement commands
triggerBlockScreen: async (input: {
  appName: string;
  appBundleId: string;
  sessionMode: string;
}): Promise<BlockScreenState> => {
  return invoke('trigger_block_screen', { input });
},

dismissBlockScreen: async (force: boolean = false): Promise<void> => {
  return invoke('dismiss_block_screen', { force });
},

getEnforcementState: async (): Promise<SessionEnforcementState> => {
  return invoke('get_enforcement_state');
},

resetEnforcementState: async (): Promise<void> => {
  return invoke('reset_enforcement_state');
},

updateBlockScreenTimer: async (): Promise<number | null> => {
  return invoke('update_block_screen_timer');
},
```

Add the necessary type imports at the top of the file.

Create file: src/hooks/useBlockScreen.ts

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { tauriBridge } from '@/lib/tauri-bridge';
import { BlockScreenState, ReflectionOption } from '@/lib/enforcement/types';

interface UseBlockScreenReturn {
  blockScreen: BlockScreenState | null;
  isVisible: boolean;
  remainingTime: number;
  canDismiss: boolean;
  selectedReflection: ReflectionOption | null;
  triggerBlockScreen: (appName: string, appBundleId: string, sessionMode: string) => Promise<void>;
  dismissBlockScreen: () => Promise<void>;
  setReflection: (option: ReflectionOption) => void;
}

export function useBlockScreen(): UseBlockScreenReturn {
  const [blockScreen, setBlockScreen] = useState<BlockScreenState | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [selectedReflection, setSelectedReflection] = useState<ReflectionOption | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isVisible = blockScreen?.isVisible ?? false;
  const canDismiss = blockScreen?.canDismiss ?? false;

  // Timer countdown effect
  useEffect(() => {
    if (isVisible && remainingTime > 0) {
      timerRef.current = setInterval(() => {
        setRemainingTime(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            // Enable dismiss when timer reaches 0
            setBlockScreen(current => 
              current ? { ...current, canDismiss: true, remainingTime: 0 } : null
            );
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isVisible, remainingTime]);

  const triggerBlockScreen = useCallback(async (
    appName: string,
    appBundleId: string,
    sessionMode: string
  ) => {
    try {
      const state = await tauriBridge.triggerBlockScreen({
        appName,
        appBundleId,
        sessionMode,
      });
      setBlockScreen(state);
      setRemainingTime(state.totalDuration);
      setSelectedReflection(null);
      console.log('[useBlockScreen] Block screen triggered:', state);
    } catch (error) {
      console.error('[useBlockScreen] Failed to trigger block screen:', error);
    }
  }, []);

  const dismissBlockScreen = useCallback(async () => {
    if (!canDismiss) {
      console.log('[useBlockScreen] Cannot dismiss yet');
      return;
    }

    try {
      await tauriBridge.dismissBlockScreen(false);
      setBlockScreen(null);
      setRemainingTime(0);
      console.log('[useBlockScreen] Block screen dismissed');
    } catch (error) {
      console.error('[useBlockScreen] Failed to dismiss:', error);
    }
  }, [canDismiss]);

  const setReflection = useCallback((option: ReflectionOption) => {
    setSelectedReflection(option);
    // TODO: Record reflection to backend
    console.log('[useBlockScreen] Reflection selected:', option);
  }, []);

  return {
    blockScreen,
    isVisible,
    remainingTime,
    canDismiss,
    selectedReflection,
    triggerBlockScreen,
    dismissBlockScreen,
    setReflection,
  };
}
```

Create file: src/components/enforcement/ReflectionPrompt.tsx

```typescript
import React from 'react';
import { cn } from '@/lib/utils';
import { REFLECTION_OPTIONS, ReflectionOption } from '@/lib/enforcement/types';

interface ReflectionPromptProps {
  selectedOption: ReflectionOption | null;
  onSelect: (option: ReflectionOption) => void;
}

export const ReflectionPrompt: React.FC<ReflectionPromptProps> = ({
  selectedOption,
  onSelect,
}) => {
  return (
    <div className="mt-6 p-4 rounded-xl bg-gray-800/50 border border-gray-700">
      <h3 className="text-sm font-medium text-gray-300 mb-3">
        What's making it hard to focus right now?
      </h3>
      <div className="space-y-2">
        {REFLECTION_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={cn(
              'w-full p-3 rounded-lg text-left text-sm transition-all duration-150',
              'border-2',
              selectedOption === option.id
                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-100'
                : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
```

Create file: src/components/enforcement/BlockScreen.tsx

```typescript
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { BlockScreenState } from '@/lib/enforcement/types';
import { ReflectionPrompt } from './ReflectionPrompt';
import type { ReflectionOption } from '@/lib/enforcement/types';

interface BlockScreenProps {
  blockScreen: BlockScreenState;
  remainingTime: number;
  canDismiss: boolean;
  selectedReflection: ReflectionOption | null;
  onDismiss: () => void;
  onSelectReflection: (option: ReflectionOption) => void;
}

export const BlockScreen: React.FC<BlockScreenProps> = ({
  blockScreen,
  remainingTime,
  canDismiss,
  selectedReflection,
  onDismiss,
  onSelectReflection,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus trap - keep focus within the block screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent escape from closing
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
      // Prevent tab from leaving
      if (e.key === 'Tab') {
        const focusableElements = containerRef.current?.querySelectorAll(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
          
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const showReflection = blockScreen.escalationLevel >= 3;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="block-screen-title"
    >
      <div className="max-w-md w-full mx-4 text-center">
        {/* Icon */}
        <div className="text-6xl mb-6">🛑</div>

        {/* Title */}
        <h1 id="block-screen-title" className="text-2xl font-bold text-gray-100 mb-2">
          You opened {blockScreen.appName}
        </h1>

        {/* Subtitle */}
        <p className="text-gray-400 mb-8">
          This app is blocked during your session
        </p>

        {/* Timer */}
        <div className="mb-6">
          <div
            className={cn(
              'inline-flex items-center justify-center',
              'w-24 h-24 rounded-full',
              'text-3xl font-mono font-bold',
              remainingTime > 0
                ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50'
                : 'bg-green-500/20 text-green-400 border-2 border-green-500/50'
            )}
          >
            {remainingTime > 0 ? formatTime(remainingTime) : '✓'}
          </div>
        </div>

        {/* Message */}
        <p className="text-lg text-gray-300 mb-2">
          {blockScreen.message}
        </p>

        {/* Violation count */}
        <p className="text-sm text-gray-500 mb-6">
          This is distraction #{blockScreen.violationNumber} this session
        </p>

        {/* Reflection prompt (for level 3+) */}
        {showReflection && (
          <ReflectionPrompt
            selectedOption={selectedReflection}
            onSelect={onSelectReflection}
          />
        )}

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          disabled={!canDismiss}
          className={cn(
            'mt-6 w-full py-3 px-6 rounded-xl font-semibold',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900',
            canDismiss
              ? 'bg-cyan-500 text-white hover:bg-cyan-600 focus:ring-cyan-500'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          )}
          aria-describedby={!canDismiss ? 'dismiss-hint' : undefined}
        >
          {canDismiss ? 'Return to Work' : `Wait ${formatTime(remainingTime)}`}
        </button>

        {!canDismiss && (
          <p id="dismiss-hint" className="mt-3 text-xs text-gray-600">
            The button will activate when the timer completes
          </p>
        )}
      </div>
    </div>
  );
};
```

Create file: src/components/enforcement/index.ts

```typescript
export { BlockScreen } from './BlockScreen';
export { ReflectionPrompt } from './ReflectionPrompt';
```

After creating these files:
1. Run `npm run build` to verify no TypeScript errors
2. Test the component renders correctly
```

---

## Verification

After completing this task:

```bash
npm run build
```

Expected: No TypeScript errors.

To visually test, temporarily render the BlockScreen:

```typescript
import { BlockScreen } from '@/components/enforcement';

// Test with mock data:
<BlockScreen
  blockScreen={{
    isVisible: true,
    startTime: Date.now(),
    totalDuration: 30,
    remainingTime: 30,
    canDismiss: false,
    violationNumber: 1,
    appName: 'Twitter',
    message: "Let's get back on track",
    escalationLevel: 1,
  }}
  remainingTime={25}
  canDismiss={false}
  selectedReflection={null}
  onDismiss={() => console.log('Dismissed')}
  onSelectReflection={(opt) => console.log('Reflection:', opt)}
/>
```

Visual checklist:
- [ ] Full screen dark overlay
- [ ] Stop icon visible
- [ ] App name displayed
- [ ] Timer counting down
- [ ] Button disabled and gray
- [ ] Distraction count shown
