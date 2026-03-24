# Task: Implement Flow Protection Features

## Phase: 6
## Part: 2 (Flow Detection)
## Task: 08
## Depends On: task-07-flow-celebrations
## Estimated Time: 1.5 hours

---

## Context Files

- `src/lib/flow/types.ts` (update)
- `src/hooks/useFlow.ts` (update)
- `src/components/flow/FlowProtectionModal.tsx` (create)
- `src/components/flow/FlowWarning.tsx` (create)
- `src-tauri/src/flow/mod.rs` (update)

---

## Success Criteria

- [ ] Auto-extend feature prompts user when in deep flow with < 5 min remaining
- [ ] Auto-extend adds 10 minutes to session if accepted
- [ ] Auto-extend is opt-in (default off in settings)
- [ ] Flow warning appears before block screen when user is in flow
- [ ] Flow warning gives user chance to reconsider (3 second delay)
- [ ] Flow warning is opt-in (default off in settings)
- [ ] Settings for flow protection stored in user preferences
- [ ] Flow protection features work in all session modes

---

## Test Cases

- Deep flow + 4:30 remaining + auto-extend ON → expect auto-extend prompt appears
- Accept auto-extend → expect session timer increases by 10 min, prompt dismisses
- Decline auto-extend → expect session continues, no prompt until < 2 min remaining
- Deep flow + 4:30 remaining + auto-extend OFF → expect no prompt
- In flow + switch to blocked app + flow warning ON → expect warning before block screen
- Flow warning countdown (3s) completes → expect block screen appears
- During flow warning, switch back to whitelisted app → expect warning cancels
- In flow + switch to blocked app + flow warning OFF → expect immediate block screen

---

## Implementation Prompt

```
Implement flow protection features: auto-extend and flow warnings.

Step 1: Add flow protection settings types

Update file: src/lib/flow/types.ts

Add at the end:

```typescript
// Flow protection settings
export interface FlowProtectionSettings {
  autoExtendEnabled: boolean;
  autoExtendMinutes: number;         // Default: 10
  autoExtendThresholdMinutes: number; // Trigger when < this remaining. Default: 5
  flowWarningEnabled: boolean;
  flowWarningDelaySeconds: number;    // Default: 3
}

export const DEFAULT_FLOW_PROTECTION: FlowProtectionSettings = {
  autoExtendEnabled: false,
  autoExtendMinutes: 10,
  autoExtendThresholdMinutes: 5,
  flowWarningEnabled: false,
  flowWarningDelaySeconds: 3,
};

export interface AutoExtendPrompt {
  visible: boolean;
  currentFlowLevel: FlowLevel;
  remainingSessionMs: number;
  extensionMinutes: number;
}

export interface FlowWarningState {
  visible: boolean;
  triggerApp: string | null;
  countdownSeconds: number;
  flowLevelAtRisk: FlowLevel;
}
```

Step 2: Create auto-extend modal

Create file: src/components/flow/FlowProtectionModal.tsx

```typescript
import React from 'react';
import { cn } from '@/lib/utils';
import { FlowLevel } from '@/lib/flow/types';

interface FlowProtectionModalProps {
  visible: boolean;
  flowLevel: FlowLevel;
  remainingMs: number;
  extensionMinutes: number;
  onAccept: () => void;
  onDecline: () => void;
}

const flowLevelEmoji: Record<FlowLevel, string> = {
  none: '',
  building: '✨',
  established: '🌊',
  deep: '🔥',
};

export const FlowProtectionModal: React.FC<FlowProtectionModalProps> = ({
  visible,
  flowLevel,
  remainingMs,
  extensionMinutes,
  onAccept,
  onDecline,
}) => {
  if (!visible) return null;

  const remainingMinutes = Math.ceil(remainingMs / 60000);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={cn(
        'max-w-md w-full mx-4 p-6 rounded-2xl',
        'bg-gradient-to-br from-gray-900 to-gray-800',
        'border border-orange-500/30',
        'shadow-2xl shadow-orange-500/20'
      )}>
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-5xl mb-4 block">
            {flowLevelEmoji[flowLevel]}
          </span>
          <h2 className="text-2xl font-bold text-white mb-2">
            You're in {flowLevel} flow!
          </h2>
          <p className="text-gray-400">
            Only {remainingMinutes} minute{remainingMinutes !== 1 ? 's' : ''} remaining
          </p>
        </div>

        {/* Message */}
        <div className="text-center mb-8">
          <p className="text-gray-300">
            Would you like to extend your session by{' '}
            <span className="text-orange-400 font-semibold">
              {extensionMinutes} minutes
            </span>{' '}
            to protect your flow?
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={onDecline}
            className={cn(
              'flex-1 py-3 px-4 rounded-lg',
              'bg-gray-700 hover:bg-gray-600',
              'text-gray-300 font-medium',
              'transition-colors'
            )}
          >
            End on time
          </button>
          <button
            onClick={onAccept}
            className={cn(
              'flex-1 py-3 px-4 rounded-lg',
              'bg-gradient-to-r from-yellow-500 to-orange-500',
              'hover:from-yellow-400 hover:to-orange-400',
              'text-white font-semibold',
              'transition-all'
            )}
          >
            Extend +{extensionMinutes}m
          </button>
        </div>
      </div>
    </div>
  );
};
```

Step 3: Create flow warning component

Create file: src/components/flow/FlowWarning.tsx

```typescript
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { FlowLevel } from '@/lib/flow/types';

interface FlowWarningProps {
  visible: boolean;
  triggerApp: string | null;
  initialCountdown: number;
  flowLevel: FlowLevel;
  onCancel: () => void;
  onCountdownComplete: () => void;
}

export const FlowWarning: React.FC<FlowWarningProps> = ({
  visible,
  triggerApp,
  initialCountdown,
  flowLevel,
  onCancel,
  onCountdownComplete,
}) => {
  const [countdown, setCountdown] = useState(initialCountdown);

  useEffect(() => {
    if (!visible) {
      setCountdown(initialCountdown);
      return;
    }

    if (countdown <= 0) {
      onCountdownComplete();
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onCountdownComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, countdown, initialCountdown, onCountdownComplete]);

  if (!visible) return null;

  const flowLevelText = {
    none: '',
    building: 'building',
    established: 'established',
    deep: 'deep',
  }[flowLevel];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={cn(
        'max-w-lg w-full mx-4 p-8 rounded-2xl',
        'bg-gradient-to-br from-gray-900 to-gray-800',
        'border-2 border-yellow-500/50',
        'shadow-2xl'
      )}>
        {/* Warning Icon */}
        <div className="text-center mb-6">
          <span className="text-6xl">⚠️</span>
        </div>

        {/* Message */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-3">
            Wait! You're in {flowLevelText} flow
          </h2>
          <p className="text-gray-300 mb-2">
            You're about to open{' '}
            <span className="text-yellow-400 font-semibold">{triggerApp}</span>
          </p>
          <p className="text-gray-400 text-sm">
            This will break your focus. Are you sure?
          </p>
        </div>

        {/* Countdown */}
        <div className="text-center mb-6">
          <div className={cn(
            'inline-flex items-center justify-center',
            'w-20 h-20 rounded-full',
            'bg-yellow-500/20 border-2 border-yellow-500',
            'text-yellow-400 text-3xl font-bold'
          )}>
            {countdown}
          </div>
          <p className="text-gray-500 text-sm mt-2">
            Continuing in {countdown}s...
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-center">
          <button
            onClick={onCancel}
            className={cn(
              'py-3 px-8 rounded-lg',
              'bg-gradient-to-r from-yellow-500 to-orange-500',
              'hover:from-yellow-400 hover:to-orange-400',
              'text-white font-semibold text-lg',
              'transition-all'
            )}
          >
            Stay focused
          </button>
        </div>
      </div>
    </div>
  );
};
```

Step 4: Update useFlow hook for protection features

Update file: src/hooks/useFlow.ts

Add protection logic:

```typescript
// Add to imports
import { 
  FlowProtectionSettings, 
  DEFAULT_FLOW_PROTECTION,
  AutoExtendPrompt,
  FlowWarningState,
} from '@/lib/flow/types';

// Add to UseFlowConfig interface:
protectionSettings?: FlowProtectionSettings;
sessionRemainingMs?: number;
onAutoExtendAccept?: () => void;
onFlowWarningComplete?: (triggerApp: string) => void;

// Add state for protection features:
const [autoExtendPrompt, setAutoExtendPrompt] = useState<AutoExtendPrompt>({
  visible: false,
  currentFlowLevel: 'none',
  remainingSessionMs: 0,
  extensionMinutes: 10,
});

const [flowWarning, setFlowWarning] = useState<FlowWarningState>({
  visible: false,
  triggerApp: null,
  countdownSeconds: 3,
  flowLevelAtRisk: 'none',
});

const [autoExtendShownThisSession, setAutoExtendShownThisSession] = useState(false);

// Add protection settings with defaults
const protection = { ...DEFAULT_FLOW_PROTECTION, ...protectionSettings };

// Auto-extend check (run in tick effect):
useEffect(() => {
  if (!protection.autoExtendEnabled) return;
  if (autoExtendShownThisSession) return;
  if (flowLevel !== 'deep') return;
  if (!sessionRemainingMs) return;
  
  const thresholdMs = protection.autoExtendThresholdMinutes * 60 * 1000;
  
  if (sessionRemainingMs <= thresholdMs && sessionRemainingMs > 0) {
    setAutoExtendPrompt({
      visible: true,
      currentFlowLevel: flowLevel,
      remainingSessionMs: sessionRemainingMs,
      extensionMinutes: protection.autoExtendMinutes,
    });
    setAutoExtendShownThisSession(true);
  }
}, [
  flowLevel, 
  sessionRemainingMs, 
  protection.autoExtendEnabled, 
  protection.autoExtendThresholdMinutes,
  protection.autoExtendMinutes,
  autoExtendShownThisSession
]);

// Handlers for auto-extend:
const handleAutoExtendAccept = useCallback(() => {
  setAutoExtendPrompt(prev => ({ ...prev, visible: false }));
  onAutoExtendAccept?.();
}, [onAutoExtendAccept]);

const handleAutoExtendDecline = useCallback(() => {
  setAutoExtendPrompt(prev => ({ ...prev, visible: false }));
}, []);

// Flow warning trigger (call this before showing block screen):
const triggerFlowWarning = useCallback((triggerApp: string): boolean => {
  if (!protection.flowWarningEnabled) return false;
  if (flowLevel === 'none') return false;
  
  setFlowWarning({
    visible: true,
    triggerApp,
    countdownSeconds: protection.flowWarningDelaySeconds,
    flowLevelAtRisk: flowLevel,
  });
  
  return true; // Indicates warning was shown
}, [protection.flowWarningEnabled, protection.flowWarningDelaySeconds, flowLevel]);

const handleFlowWarningCancel = useCallback(() => {
  setFlowWarning(prev => ({ ...prev, visible: false }));
  // Return to whitelisted app (handled by parent)
}, []);

const handleFlowWarningComplete = useCallback(() => {
  const app = flowWarning.triggerApp;
  setFlowWarning(prev => ({ ...prev, visible: false }));
  if (app) {
    onFlowWarningComplete?.(app);
  }
}, [flowWarning.triggerApp, onFlowWarningComplete]);

// Add to return object:
return {
  // ... existing returns
  
  // Protection features
  autoExtendPrompt,
  handleAutoExtendAccept,
  handleAutoExtendDecline,
  
  flowWarning,
  triggerFlowWarning,
  handleFlowWarningCancel,
  handleFlowWarningComplete,
};
```

Step 5: Update exports

Update file: src/components/flow/index.ts

```typescript
export { FlowIndicator, FlowIndicatorCompact } from './FlowIndicator';
export { GraceWarning, GraceWarningInline } from './GraceWarning';
export { FlowStatus } from './FlowStatus';
export { FlowCelebration, FlowCelebrationToast } from './FlowCelebration';
export { FlowProtectionModal } from './FlowProtectionModal';
export { FlowWarning } from './FlowWarning';
```

After making these changes:
1. Run `npm run build` to verify no TypeScript errors
2. Test both protection features manually
```

---

## Verification

After completing this task:

```bash
npm run build
```

Expected: No TypeScript errors.

Manual testing - Auto-extend:

1. Enable auto-extend in settings (or set `autoExtendEnabled: true` in code for testing)
2. Start a 25-minute session
3. Work focused until you reach deep flow (20 min)
4. At ~4:30 remaining:
   - [ ] Auto-extend modal appears
   - [ ] Shows current flow level with emoji
   - [ ] Shows remaining time
   - [ ] Offers extension option
5. Click "Extend +10m":
   - [ ] Modal dismisses
   - [ ] Session timer increases by 10 minutes
6. Repeat test and click "End on time":
   - [ ] Modal dismisses
   - [ ] Session continues normally
   - [ ] Modal doesn't reappear (already shown once)

Manual testing - Flow warning:

1. Enable flow warning in settings
2. Start a 45-minute Legend session
3. Achieve established flow (10 min focused)
4. Switch to a blocked app (e.g., Twitter):
   - [ ] Flow warning appears BEFORE block screen
   - [ ] Shows countdown (3...2...1...)
   - [ ] Shows which app triggered it
5. Click "Stay focused":
   - [ ] Warning dismisses
   - [ ] No block screen shown
   - [ ] Focus returns to previous app
6. Repeat and let countdown complete:
   - [ ] Block screen appears after countdown
   - [ ] Flow proceeds to break normally
