# Task: Implement Idle Detection UI Components

## Phase: 6
## Part: 1 (Hard Enforcement)
## Task: 07
## Depends On: task-06-idle-detection-rust
## Estimated Time: 1.5 hours

---

## Context Files

- `src/hooks/useIdleDetection.ts` (create)
- `src/components/enforcement/IdleWarning.tsx` (create)
- `src/components/enforcement/SessionPaused.tsx` (create)
- `src/components/enforcement/index.ts` (update)
- `src/lib/tauri-bridge.ts` (update)

---

## Success Criteria

- [ ] `useIdleDetection` hook polls idle time every 5 seconds during session
- [ ] `IdleWarning` component shows after 2 minutes of inactivity
- [ ] `SessionPaused` component shows after 5 minutes of inactivity
- [ ] Screen lock triggers immediate session pause
- [ ] User activity dismisses warning
- [ ] "Resume Session" button on paused screen works
- [ ] "End Session" button on paused screen works
- [ ] Tauri bridge has all idle detection commands

---

## Test Cases

- Session active, user active → expect no idle UI
- Session active, idle 2 min → expect IdleWarning appears
- IdleWarning visible, user moves mouse → expect warning dismisses
- Session active, idle 5 min → expect SessionPaused appears
- SessionPaused visible, click Resume → expect session continues
- SessionPaused visible, click End → expect session ends
- Screen lock during session → expect SessionPaused appears
- Screen unlock → expect SessionPaused shows (requires user action to resume)

---

## Implementation Prompt

```
Create the idle detection UI components and hook.

First, update the Tauri bridge:

Update file: src/lib/tauri-bridge.ts

Add these methods:

```typescript
// Idle detection commands
getSystemIdleTime: async (): Promise<number> => {
  return invoke('get_system_idle_time');
},

isScreenLocked: async (): Promise<boolean> => {
  return invoke('is_screen_locked');
},

getIdleInfo: async (): Promise<{ idleSeconds: number; screenLocked: boolean }> => {
  const result = await invoke('get_idle_info');
  return {
    idleSeconds: (result as any).idle_seconds,
    screenLocked: (result as any).screen_locked,
  };
},

checkIdleStatus: async (): Promise<{ shouldWarn: boolean; shouldPause: boolean }> => {
  const [shouldWarn, shouldPause] = await invoke('check_idle_status') as [boolean, boolean];
  return { shouldWarn, shouldPause };
},
```

Create file: src/hooks/useIdleDetection.ts

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { tauriBridge } from '@/lib/tauri-bridge';

interface UseIdleDetectionConfig {
  enabled: boolean;
  pollingInterval?: number; // ms, default 5000
  warningThreshold?: number; // seconds, default 120 (2 min)
  pauseThreshold?: number; // seconds, default 300 (5 min)
  onIdle?: () => void;
  onActive?: () => void;
  onWarning?: () => void;
  onPause?: () => void;
}

interface UseIdleDetectionReturn {
  idleSeconds: number;
  isScreenLocked: boolean;
  showWarning: boolean;
  showPaused: boolean;
  dismissWarning: () => void;
  resumeSession: () => void;
}

export function useIdleDetection({
  enabled,
  pollingInterval = 5000,
  warningThreshold = 120,
  pauseThreshold = 300,
  onIdle,
  onActive,
  onWarning,
  onPause,
}: UseIdleDetectionConfig): UseIdleDetectionReturn {
  const [idleSeconds, setIdleSeconds] = useState(0);
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showPaused, setShowPaused] = useState(false);
  
  const wasIdleRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const pollIdleStatus = useCallback(async () => {
    try {
      const info = await tauriBridge.getIdleInfo();
      setIdleSeconds(info.idleSeconds);
      setIsScreenLocked(info.screenLocked);
      
      const isCurrentlyIdle = info.idleSeconds > 10; // More than 10 seconds = idle
      
      // Detect transition from active to idle
      if (isCurrentlyIdle && !wasIdleRef.current) {
        onIdle?.();
      }
      
      // Detect transition from idle to active
      if (!isCurrentlyIdle && wasIdleRef.current) {
        onActive?.();
        setShowWarning(false);
        // Don't auto-dismiss pause - user must confirm
      }
      
      wasIdleRef.current = isCurrentlyIdle;
      
      // Check if should show warning
      if (info.idleSeconds >= warningThreshold && info.idleSeconds < pauseThreshold && !showPaused) {
        if (!showWarning) {
          console.log('[useIdleDetection] Showing warning');
          setShowWarning(true);
          onWarning?.();
        }
      }
      
      // Check if should pause
      if (info.idleSeconds >= pauseThreshold || info.screenLocked) {
        if (!showPaused) {
          console.log('[useIdleDetection] Pausing session');
          setShowWarning(false);
          setShowPaused(true);
          onPause?.();
        }
      }
    } catch (err) {
      console.error('[useIdleDetection] Error polling idle:', err);
    }
  }, [warningThreshold, pauseThreshold, showWarning, showPaused, onIdle, onActive, onWarning, onPause]);

  // Start/stop polling
  useEffect(() => {
    if (enabled && !showPaused) {
      pollIdleStatus();
      intervalRef.current = setInterval(pollIdleStatus, pollingInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, showPaused, pollingInterval, pollIdleStatus]);

  const dismissWarning = useCallback(() => {
    setShowWarning(false);
  }, []);

  const resumeSession = useCallback(() => {
    console.log('[useIdleDetection] Resuming session');
    setShowPaused(false);
    setShowWarning(false);
    wasIdleRef.current = false;
  }, []);

  return {
    idleSeconds,
    isScreenLocked,
    showWarning,
    showPaused,
    dismissWarning,
    resumeSession,
  };
}
```

Create file: src/components/enforcement/IdleWarning.tsx

```typescript
import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface IdleWarningProps {
  idleMinutes: number;
  onDismiss: () => void;
}

export const IdleWarning: React.FC<IdleWarningProps> = ({
  idleMinutes,
  onDismiss,
}) => {
  // Auto-dismiss on any activity (mouse move, key press)
  useEffect(() => {
    const handleActivity = () => {
      onDismiss();
    };

    window.addEventListener('mousemove', handleActivity, { once: true });
    window.addEventListener('keydown', handleActivity, { once: true });
    window.addEventListener('click', handleActivity, { once: true });

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [onDismiss]);

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50',
        'max-w-sm p-4 rounded-xl',
        'bg-yellow-500/10 border border-yellow-500/30',
        'backdrop-blur-sm shadow-lg',
        'animate-in slide-in-from-bottom-4 duration-300'
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">👋</div>
        <div>
          <h3 className="font-semibold text-yellow-200">Still there?</h3>
          <p className="text-sm text-yellow-300/80 mt-1">
            You've been idle for {idleMinutes} minutes.
            Move your mouse or press a key to continue.
          </p>
        </div>
      </div>
    </div>
  );
};
```

Create file: src/components/enforcement/SessionPaused.tsx

```typescript
import React from 'react';
import { cn } from '@/lib/utils';

interface SessionPausedProps {
  pauseReason: 'idle' | 'screenLock' | 'user';
  pausedMinutes: number;
  onResume: () => void;
  onEnd: () => void;
}

export const SessionPaused: React.FC<SessionPausedProps> = ({
  pauseReason,
  pausedMinutes,
  onResume,
  onEnd,
}) => {
  const getMessage = () => {
    switch (pauseReason) {
      case 'screenLock':
        return 'Your screen was locked';
      case 'idle':
        return `You've been away for ${pausedMinutes} minutes`;
      default:
        return 'Session paused';
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-gray-900/95"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="paused-title"
    >
      <div className="max-w-md w-full mx-4 text-center">
        {/* Icon */}
        <div className="text-6xl mb-6">⏸️</div>

        {/* Title */}
        <h1 id="paused-title" className="text-2xl font-bold text-gray-100 mb-2">
          Session Paused
        </h1>

        {/* Message */}
        <p className="text-gray-400 mb-8">
          {getMessage()}
        </p>

        {/* Timer stopped indicator */}
        <div className="mb-8 p-4 rounded-xl bg-gray-800/50 border border-gray-700">
          <p className="text-sm text-gray-500">
            ⏱️ Session timer has been paused
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onResume}
            className={cn(
              'w-full py-3 px-6 rounded-xl font-semibold',
              'bg-cyan-500 text-white',
              'hover:bg-cyan-600 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900'
            )}
            autoFocus
          >
            Resume Session
          </button>
          
          <button
            onClick={onEnd}
            className={cn(
              'w-full py-3 px-6 rounded-xl font-semibold',
              'bg-transparent text-gray-400',
              'hover:text-gray-300 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900'
            )}
          >
            End Session
          </button>
        </div>
      </div>
    </div>
  );
};
```

Update file: src/components/enforcement/index.ts

```typescript
export { BlockScreen } from './BlockScreen';
export { ReflectionPrompt } from './ReflectionPrompt';
export { IdleWarning } from './IdleWarning';
export { SessionPaused } from './SessionPaused';
```

After creating these files:
1. Run `npm run build` to verify no TypeScript errors
2. Test the components visually
```

---

## Verification

After completing this task:

```bash
npm run build
```

Expected: No TypeScript errors.

To test manually:

1. Add temporary test rendering in your app:

```typescript
import { IdleWarning, SessionPaused } from '@/components/enforcement';

// Test IdleWarning
<IdleWarning
  idleMinutes={2}
  onDismiss={() => console.log('Dismissed')}
/>

// Test SessionPaused
<SessionPaused
  pauseReason="idle"
  pausedMinutes={5}
  onResume={() => console.log('Resume')}
  onEnd={() => console.log('End')}
/>
```

Visual checklist for IdleWarning:
- [ ] Appears in bottom-right corner
- [ ] Yellow/amber styling
- [ ] Shows idle time
- [ ] Dismisses on mouse move
- [ ] Dismisses on key press

Visual checklist for SessionPaused:
- [ ] Covers full screen (semi-transparent)
- [ ] Pause icon visible
- [ ] "Session Paused" title
- [ ] Resume button is prominent and auto-focused
- [ ] End Session button is secondary
- [ ] Shows pause reason
