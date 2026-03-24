# Task: Implement Flow State Machine Logic

## Phase: 6
## Part: 2 (Flow Detection)
## Task: 02
## Depends On: task-01-flow-types
## Estimated Time: 1.5 hours

---

## Context Files

- `src/lib/flow/state-machine.ts` (create)
- `src/lib/flow/index.ts` (update)

---

## Success Criteria

- [ ] `FlowStateMachine` class manages flow state transitions
- [ ] `tick()` method advances state based on elapsed time
- [ ] `onAppSwitch()` handles app focus changes
- [ ] Transitions from none→building after 5 min uninterrupted
- [ ] Transitions from building→established after 10 min
- [ ] Transitions from established→deep after 20 min
- [ ] State resets to none when grace period exceeded
- [ ] Grace period is 90 seconds
- [ ] Flow tracking only active for sessions ≥ 30 min
- [ ] Events are emitted on state changes

---

## Test Cases

- Create state machine, call tick() after 5 min → expect level 'building'
- In 'building', call tick() after 10 min total → expect level 'established'
- In 'established', call tick() after 20 min total → expect level 'deep'
- In 'deep', call onAppSwitch(blockedApp) → expect grace period starts
- Grace active, call tick() after 90 sec → expect level 'none'
- Grace active, call onAppSwitch(whitelistedApp) before 90 sec → expect grace ends, flow continues
- Session duration 20 min → expect isTracking false
- Session duration 45 min → expect isTracking true

---

## Implementation Prompt

```
Create the flow state machine logic for managing flow state transitions.

Create file: src/lib/flow/state-machine.ts

```typescript
import {
  FlowLevel,
  FlowState,
  GraceState,
  FLOW_THRESHOLDS,
  GRACE_PERIOD_DURATION,
  MIN_SESSION_FOR_FLOW,
  INITIAL_FLOW_STATE,
  getNextFlowLevel,
  getThresholdForLevel,
} from './types';

// Events emitted by the state machine
export type FlowEvent = 
  | { type: 'level_changed'; from: FlowLevel; to: FlowLevel; timestamp: number }
  | { type: 'grace_started'; app: string; timestamp: number }
  | { type: 'grace_ended'; reason: 'returned' | 'exceeded'; timestamp: number }
  | { type: 'flow_broken'; byApp: string; timestamp: number }
  | { type: 'tracking_started'; timestamp: number }
  | { type: 'tracking_stopped'; timestamp: number };

export type FlowEventListener = (event: FlowEvent) => void;

export class FlowStateMachine {
  private state: FlowState;
  private listeners: FlowEventListener[] = [];
  private lastTickTime: number;

  constructor(sessionDurationMs: number) {
    this.state = {
      ...INITIAL_FLOW_STATE,
      sessionDuration: sessionDurationMs,
      isTracking: sessionDurationMs >= MIN_SESSION_FOR_FLOW,
    };
    this.lastTickTime = Date.now();

    if (this.state.isTracking) {
      this.emit({ type: 'tracking_started', timestamp: Date.now() });
    }
  }

  // Subscribe to events
  subscribe(listener: FlowEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private emit(event: FlowEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  // Get current state (read-only copy)
  getState(): FlowState {
    return { ...this.state };
  }

  // Get time spent at current level
  getTimeAtCurrentLevel(): number {
    if (!this.state.levelStartedAt) return 0;
    return Date.now() - this.state.levelStartedAt;
  }

  // Get total uninterrupted time
  getUninterruptedTime(): number {
    if (!this.state.uninterruptedSince) return 0;
    return Date.now() - this.state.uninterruptedSince;
  }

  // Called periodically (e.g., every second) to advance state
  tick(): void {
    if (!this.state.isTracking) return;

    const now = Date.now();
    this.lastTickTime = now;

    // Handle grace period
    if (this.state.grace.active) {
      this.tickGracePeriod(now);
      return; // Don't advance flow during grace
    }

    // Advance flow state based on uninterrupted time
    this.advanceFlowState(now);
  }

  private tickGracePeriod(now: number): void {
    if (!this.state.grace.startedAt) return;

    const elapsed = now - this.state.grace.startedAt;
    const remaining = GRACE_PERIOD_DURATION - elapsed;

    if (remaining <= 0) {
      // Grace period exceeded - reset flow
      const previousLevel = this.state.level;
      const triggerApp = this.state.grace.triggerApp || 'unknown app';

      this.state.level = 'none';
      this.state.levelStartedAt = null;
      this.state.uninterruptedSince = null;
      this.state.grace = {
        active: false,
        startedAt: null,
        triggerApp: null,
        triggerAppBundleId: null,
        remainingMs: GRACE_PERIOD_DURATION,
      };

      this.emit({ type: 'grace_ended', reason: 'exceeded', timestamp: now });
      this.emit({ type: 'flow_broken', byApp: triggerApp, timestamp: now });

      if (previousLevel !== 'none') {
        this.emit({
          type: 'level_changed',
          from: previousLevel,
          to: 'none',
          timestamp: now,
        });
      }
    } else {
      // Update remaining time
      this.state.grace.remainingMs = remaining;
    }
  }

  private advanceFlowState(now: number): void {
    // Start tracking uninterrupted time if not already
    if (!this.state.uninterruptedSince) {
      this.state.uninterruptedSince = now;
      return;
    }

    const uninterruptedTime = now - this.state.uninterruptedSince;
    const currentLevel = this.state.level;
    const nextLevel = getNextFlowLevel(currentLevel);

    // Check if we should advance to next level
    if (nextLevel) {
      const threshold = getThresholdForLevel(nextLevel);
      
      if (uninterruptedTime >= threshold) {
        this.state.level = nextLevel;
        this.state.levelStartedAt = now;

        this.emit({
          type: 'level_changed',
          from: currentLevel,
          to: nextLevel,
          timestamp: now,
        });
      }
    }
  }

  // Called when user switches apps
  onAppSwitch(app: { name: string; bundleId: string; isWhitelisted: boolean; isBlocked: boolean }): void {
    if (!this.state.isTracking) return;

    const now = Date.now();

    // If switching to whitelisted app
    if (app.isWhitelisted) {
      // If grace was active, end it (user returned)
      if (this.state.grace.active) {
        this.state.grace = {
          active: false,
          startedAt: null,
          triggerApp: null,
          triggerAppBundleId: null,
          remainingMs: GRACE_PERIOD_DURATION,
        };
        this.emit({ type: 'grace_ended', reason: 'returned', timestamp: now });
      }
      // Continue flow tracking
      return;
    }

    // If switching to non-whitelisted or blocked app
    // Start grace period (if not already in one)
    if (!this.state.grace.active && this.state.level !== 'none') {
      this.state.grace = {
        active: true,
        startedAt: now,
        triggerApp: app.name,
        triggerAppBundleId: app.bundleId,
        remainingMs: GRACE_PERIOD_DURATION,
      };
      this.emit({ type: 'grace_started', app: app.name, timestamp: now });
    }
  }

  // Pause flow tracking (e.g., when session pauses)
  pause(): void {
    // Preserve state but stop advancing
    this.state.isTracking = false;
    this.emit({ type: 'tracking_stopped', timestamp: Date.now() });
  }

  // Resume flow tracking (e.g., when session resumes)
  resume(): void {
    if (this.state.sessionDuration >= MIN_SESSION_FOR_FLOW) {
      this.state.isTracking = true;
      // Reset uninterrupted time on resume
      this.state.uninterruptedSince = Date.now();
      this.emit({ type: 'tracking_started', timestamp: Date.now() });
    }
  }

  // Stop tracking and return summary data
  stop(): { maxLevel: FlowLevel; totalFlowTime: number } {
    const now = Date.now();
    const totalFlowTime = this.state.uninterruptedSince 
      ? now - this.state.uninterruptedSince 
      : 0;

    this.state.isTracking = false;
    this.emit({ type: 'tracking_stopped', timestamp: now });

    return {
      maxLevel: this.state.level,
      totalFlowTime,
    };
  }

  // Reset to initial state (for new session)
  reset(sessionDurationMs: number): void {
    const wasTracking = this.state.isTracking;
    
    this.state = {
      ...INITIAL_FLOW_STATE,
      sessionDuration: sessionDurationMs,
      isTracking: sessionDurationMs >= MIN_SESSION_FOR_FLOW,
    };
    this.lastTickTime = Date.now();

    if (wasTracking) {
      this.emit({ type: 'tracking_stopped', timestamp: Date.now() });
    }
    if (this.state.isTracking) {
      this.emit({ type: 'tracking_started', timestamp: Date.now() });
    }
  }
}

// Factory function for easier creation
export function createFlowStateMachine(sessionDurationMs: number): FlowStateMachine {
  return new FlowStateMachine(sessionDurationMs);
}
```

Update file: src/lib/flow/index.ts

```typescript
export * from './types';
export * from './state-machine';
```

After creating these files:
1. Run `npm run build` to verify no TypeScript errors
2. Write a quick test to verify state transitions
```

---

## Verification

After completing this task:

```bash
npm run build
```

Expected: No TypeScript errors.

```typescript
// Test the state machine
import { createFlowStateMachine, FlowEvent } from '@/lib/flow';

const events: FlowEvent[] = [];
const machine = createFlowStateMachine(45 * 60 * 1000); // 45 min session

machine.subscribe(event => events.push(event));

// Simulate 5 minutes passing
setTimeout(() => {
  machine.tick(); // Call this many times...
}, 5 * 60 * 1000);

// After 5 min, should see level_changed event from 'none' to 'building'

// Test grace period
machine.onAppSwitch({ 
  name: 'Twitter', 
  bundleId: 'com.twitter', 
  isWhitelisted: false, 
  isBlocked: true 
});
console.log(machine.getState().grace.active); // Should be true

// Return before grace expires
machine.onAppSwitch({ 
  name: 'VS Code', 
  bundleId: 'com.microsoft.VSCode', 
  isWhitelisted: true, 
  isBlocked: false 
});
console.log(machine.getState().grace.active); // Should be false
```
