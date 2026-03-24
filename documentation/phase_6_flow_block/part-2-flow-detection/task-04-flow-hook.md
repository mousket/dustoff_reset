# Task: Implement useFlow React Hook

## Phase: 6
## Part: 2 (Flow Detection)
## Task: 04
## Depends On: task-03-flow-rust-backend
## Estimated Time: 1.5 hours

---

## Context Files

- `src/hooks/useFlow.ts` (create)
- `src/lib/tauri-bridge.ts` (update)
- `src/hooks/index.ts` (update)

---

## Success Criteria

- [ ] `useFlow` hook connects to Rust backend
- [ ] Hook calls `tick_flow` every second during active tracking
- [ ] Hook exposes current flow state (level, grace, times)
- [ ] Hook handles app focus changes
- [ ] Hook integrates with session pause/resume
- [ ] Formatted time helpers are provided
- [ ] TypeScript compiles with no errors

---

## Test Cases

- Initialize useFlow with 45 min session → expect isTracking true
- Initialize useFlow with 20 min session → expect isTracking false
- After 5 min of ticks → expect flowLevel 'building'
- Call onAppSwitch with blocked app → expect graceActive true
- Call onAppSwitch with whitelisted app during grace → expect graceActive false
- stopTracking() → expect summary returned
- formatFlowTime(300000) → expect "5:00"

---

## Implementation Prompt

```
Create the useFlow React hook for flow detection integration.

First, update the Tauri bridge:

Update file: src/lib/tauri-bridge.ts

Add these methods:

```typescript
// Flow detection commands
startFlowTracking: async (sessionId: string, sessionDurationMs: number): Promise<FlowState> => {
  return invoke('start_flow_tracking', { sessionId, sessionDurationMs });
},

stopFlowTracking: async (): Promise<FlowSessionSummary> => {
  return invoke('stop_flow_tracking');
},

getFlowState: async (): Promise<FlowState> => {
  return invoke('get_flow_state');
},

tickFlow: async (): Promise<FlowState> => {
  return invoke('tick_flow');
},

handleAppFocus: async (app: {
  name: string;
  bundleId: string;
  isWhitelisted: boolean;
  isBlocked: boolean;
}): Promise<FlowState> => {
  return invoke('handle_app_focus', { app });
},

pauseFlowTracking: async (): Promise<void> => {
  return invoke('pause_flow_tracking');
},

resumeFlowTracking: async (): Promise<void> => {
  return invoke('resume_flow_tracking');
},

getFlowStreak: async (): Promise<FlowStreak> => {
  return invoke('get_flow_streak');
},

updateFlowStreak: async (achievedDeepFlow: boolean): Promise<FlowStreak> => {
  return invoke('update_flow_streak', { achievedDeepFlow });
},
```

Add the type imports for FlowState, FlowSessionSummary, and FlowStreak.

Create file: src/hooks/useFlow.ts

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { tauriBridge } from '@/lib/tauri-bridge';
import {
  FlowLevel,
  FlowState,
  FlowSessionSummary,
  FlowStreak,
  INITIAL_FLOW_STATE,
  FLOW_LEVEL_INFO,
  MIN_SESSION_FOR_FLOW,
} from '@/lib/flow';

interface UseFlowConfig {
  sessionId: string;
  sessionDurationMs: number;
  enabled: boolean;
  onLevelChange?: (from: FlowLevel, to: FlowLevel) => void;
  onGraceStart?: (appName: string) => void;
  onGraceEnd?: (reason: 'returned' | 'exceeded') => void;
  onFlowBroken?: (byApp: string) => void;
}

interface UseFlowReturn {
  // Current state
  flowState: FlowState;
  flowLevel: FlowLevel;
  isTracking: boolean;
  
  // Grace period
  graceActive: boolean;
  graceRemainingMs: number;
  graceRemainingFormatted: string;
  graceTriggerApp: string | null;
  
  // Time tracking
  uninterruptedTimeMs: number;
  uninterruptedTimeFormatted: string;
  timeAtLevelMs: number;
  timeAtLevelFormatted: string;
  
  // Level info
  levelInfo: typeof FLOW_LEVEL_INFO[FlowLevel];
  
  // Streak
  streak: FlowStreak | null;
  
  // Actions
  onAppSwitch: (app: { name: string; bundleId: string; isWhitelisted: boolean; isBlocked: boolean }) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stopTracking: () => Promise<FlowSessionSummary>;
}

export function useFlow({
  sessionId,
  sessionDurationMs,
  enabled,
  onLevelChange,
  onGraceStart,
  onGraceEnd,
  onFlowBroken,
}: UseFlowConfig): UseFlowReturn {
  const [flowState, setFlowState] = useState<FlowState>(INITIAL_FLOW_STATE);
  const [streak, setStreak] = useState<FlowStreak | null>(null);
  const [uninterruptedTimeMs, setUninterruptedTimeMs] = useState(0);
  const [timeAtLevelMs, setTimeAtLevelMs] = useState(0);
  
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousLevelRef = useRef<FlowLevel>('none');
  const previousGraceRef = useRef<boolean>(false);

  const isTracking = flowState.isTracking;
  const graceActive = flowState.grace.active;
  const graceRemainingMs = flowState.grace.remainingMs;
  const graceTriggerApp = flowState.grace.triggerApp;
  const flowLevel = flowState.level;
  const levelInfo = FLOW_LEVEL_INFO[flowLevel];

  // Format time helper
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Initialize flow tracking
  useEffect(() => {
    if (!enabled) return;

    const init = async () => {
      try {
        console.log('[useFlow] Starting flow tracking', { sessionId, sessionDurationMs });
        const state = await tauriBridge.startFlowTracking(sessionId, sessionDurationMs);
        setFlowState(state);
        previousLevelRef.current = state.level;

        // Load streak
        const currentStreak = await tauriBridge.getFlowStreak();
        setStreak(currentStreak);
      } catch (err) {
        console.error('[useFlow] Failed to start tracking:', err);
      }
    };

    init();

    return () => {
      // Cleanup handled by stopTracking or component unmount
    };
  }, [sessionId, sessionDurationMs, enabled]);

  // Tick interval for updating flow state
  useEffect(() => {
    if (!enabled || !isTracking) {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
      return;
    }

    const tick = async () => {
      try {
        const state = await tauriBridge.tickFlow();
        setFlowState(state);

        // Update computed times
        if (state.uninterruptedSince) {
          setUninterruptedTimeMs(Date.now() - state.uninterruptedSince);
        }
        if (state.levelStartedAt) {
          setTimeAtLevelMs(Date.now() - state.levelStartedAt);
        }

        // Check for level change
        if (state.level !== previousLevelRef.current) {
          onLevelChange?.(previousLevelRef.current, state.level);
          
          // Check if flow was broken
          if (state.level === 'none' && previousLevelRef.current !== 'none') {
            onFlowBroken?.(state.grace.triggerApp || 'unknown');
          }
          
          previousLevelRef.current = state.level;
        }

        // Check for grace period changes
        if (state.grace.active && !previousGraceRef.current) {
          onGraceStart?.(state.grace.triggerApp || 'unknown app');
        } else if (!state.grace.active && previousGraceRef.current) {
          onGraceEnd?.(state.level === 'none' ? 'exceeded' : 'returned');
        }
        previousGraceRef.current = state.grace.active;

      } catch (err) {
        console.error('[useFlow] Tick error:', err);
      }
    };

    // Initial tick
    tick();

    // Set up interval (every second)
    tickIntervalRef.current = setInterval(tick, 1000);

    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    };
  }, [enabled, isTracking, onLevelChange, onGraceStart, onGraceEnd, onFlowBroken]);

  // Handle app switch
  const onAppSwitch = useCallback(async (app: {
    name: string;
    bundleId: string;
    isWhitelisted: boolean;
    isBlocked: boolean;
  }) => {
    if (!isTracking) return;

    try {
      const state = await tauriBridge.handleAppFocus(app);
      setFlowState(state);
    } catch (err) {
      console.error('[useFlow] App switch error:', err);
    }
  }, [isTracking]);

  // Pause flow tracking
  const pause = useCallback(async () => {
    try {
      await tauriBridge.pauseFlowTracking();
      const state = await tauriBridge.getFlowState();
      setFlowState(state);
      console.log('[useFlow] Paused');
    } catch (err) {
      console.error('[useFlow] Pause error:', err);
    }
  }, []);

  // Resume flow tracking
  const resume = useCallback(async () => {
    try {
      await tauriBridge.resumeFlowTracking();
      const state = await tauriBridge.getFlowState();
      setFlowState(state);
      console.log('[useFlow] Resumed');
    } catch (err) {
      console.error('[useFlow] Resume error:', err);
    }
  }, []);

  // Stop tracking and get summary
  const stopTracking = useCallback(async (): Promise<FlowSessionSummary> => {
    try {
      // Stop tick interval
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }

      const summary = await tauriBridge.stopFlowTracking();

      // Update streak
      const updatedStreak = await tauriBridge.updateFlowStreak(summary.achievedDeepFlow);
      setStreak(updatedStreak);

      console.log('[useFlow] Stopped. Summary:', summary);
      return summary;
    } catch (err) {
      console.error('[useFlow] Stop error:', err);
      throw err;
    }
  }, []);

  return {
    flowState,
    flowLevel,
    isTracking,
    graceActive,
    graceRemainingMs,
    graceRemainingFormatted: formatTime(graceRemainingMs),
    graceTriggerApp,
    uninterruptedTimeMs,
    uninterruptedTimeFormatted: formatTime(uninterruptedTimeMs),
    timeAtLevelMs,
    timeAtLevelFormatted: formatTime(timeAtLevelMs),
    levelInfo,
    streak,
    onAppSwitch,
    pause,
    resume,
    stopTracking,
  };
}

// Export a simple helper for formatting flow time
export function formatFlowTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
```

Update file: src/hooks/index.ts

```typescript
export { useFlow, formatFlowTime } from './useFlow';
```

After creating these files:
1. Run `npm run build` to verify no TypeScript errors
2. Verify the hook can be imported
```

---

## Verification

After completing this task:

```bash
npm run build
```

Expected: No TypeScript errors.

Integration test in a component:

```typescript
import { useFlow } from '@/hooks';

function TestComponent() {
  const {
    flowLevel,
    isTracking,
    graceActive,
    uninterruptedTimeFormatted,
    levelInfo,
  } = useFlow({
    sessionId: 'test-session',
    sessionDurationMs: 45 * 60 * 1000,
    enabled: true,
    onLevelChange: (from, to) => {
      console.log(`Flow level changed: ${from} -> ${to}`);
    },
    onGraceStart: (app) => {
      console.log(`Grace started by: ${app}`);
    },
  });

  return (
    <div>
      <p>Level: {flowLevel}</p>
      <p>Tracking: {isTracking ? 'Yes' : 'No'}</p>
      <p>Grace Active: {graceActive ? 'Yes' : 'No'}</p>
      <p>Time: {uninterruptedTimeFormatted}</p>
      <p>Info: {levelInfo.emoji} {levelInfo.label}</p>
    </div>
  );
}
```

Expected behavior:
- Component renders without errors
- After 5 minutes, level changes from 'none' to 'building'
- onLevelChange callback is called on transitions
