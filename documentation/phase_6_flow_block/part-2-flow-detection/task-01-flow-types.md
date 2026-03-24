# Task: Define Flow Detection Types

## Phase: 6
## Part: 2 (Flow Detection)
## Task: 01
## Depends On: Part 1 complete
## Estimated Time: 1 hour

---

## Context Files

- `src/lib/flow/types.ts` (create)
- `src/lib/flow/index.ts` (create)

---

## Success Criteria

- [ ] `FlowLevel` type is defined with 4 levels: none, building, established, deep
- [ ] `FlowState` interface is defined with all required properties
- [ ] `FlowPeriod` interface is defined for history tracking
- [ ] `FlowSessionSummary` interface is defined
- [ ] `FlowStreak` interface is defined
- [ ] `GraceState` interface is defined
- [ ] Flow constants are defined (thresholds, grace period duration)
- [ ] All types are exported from index
- [ ] TypeScript compiles with no errors

---

## Test Cases

- Import FlowLevel → expect 'none' | 'building' | 'established' | 'deep'
- `FLOW_THRESHOLDS.BUILDING` → expect 5 * 60 * 1000 (5 min in ms)
- `FLOW_THRESHOLDS.ESTABLISHED` → expect 10 * 60 * 1000
- `FLOW_THRESHOLDS.DEEP` → expect 20 * 60 * 1000
- `GRACE_PERIOD_DURATION` → expect 90 * 1000 (90 sec in ms)
- `MIN_SESSION_FOR_FLOW` → expect 30 * 60 * 1000 (30 min in ms)
- FlowState has `graceActive` property → expect boolean type

---

## Implementation Prompt

```
Create TypeScript types for the flow detection system.

Create file: src/lib/flow/types.ts

```typescript
// Flow levels from none to deep
export type FlowLevel = 'none' | 'building' | 'established' | 'deep';

// Flow level display info
export interface FlowLevelInfo {
  level: FlowLevel;
  label: string;
  emoji: string;
  description: string;
}

// Display info for each flow level
export const FLOW_LEVEL_INFO: Record<FlowLevel, FlowLevelInfo> = {
  none: {
    level: 'none',
    label: 'Not in flow',
    emoji: '',
    description: 'Focus to enter flow state',
  },
  building: {
    level: 'building',
    label: 'Flow building',
    emoji: '🌊',
    description: 'Keep focusing...',
  },
  established: {
    level: 'established',
    label: 'In flow',
    emoji: '🌊',
    description: 'Nice! Flow established',
  },
  deep: {
    level: 'deep',
    label: 'Deep flow',
    emoji: '🔥',
    description: 'Optimal focus achieved!',
  },
};

// Flow thresholds (in milliseconds)
export const FLOW_THRESHOLDS = {
  BUILDING: 5 * 60 * 1000,      // 5 minutes
  ESTABLISHED: 10 * 60 * 1000,  // 10 minutes
  DEEP: 20 * 60 * 1000,         // 20 minutes
} as const;

// Grace period duration (in milliseconds)
export const GRACE_PERIOD_DURATION = 90 * 1000; // 90 seconds

// Minimum session duration for flow tracking (in milliseconds)
export const MIN_SESSION_FOR_FLOW = 30 * 60 * 1000; // 30 minutes

// Grace period state
export interface GraceState {
  active: boolean;
  startedAt: number | null;
  triggerApp: string | null;
  triggerAppBundleId: string | null;
  remainingMs: number;
}

// Current flow state
export interface FlowState {
  level: FlowLevel;
  levelStartedAt: number | null;     // When current level started
  uninterruptedSince: number | null; // When continuous focus began
  grace: GraceState;
  isTracking: boolean;               // Is flow tracking active?
  sessionDuration: number;           // Total session duration (to check >= 30 min)
}

// A single flow period (for history/timeline)
export interface FlowPeriod {
  id: string;
  sessionId: string;
  startedAt: number;
  endedAt: number | null;
  maxLevelReached: FlowLevel;
  wasInterrupted: boolean;
  interruptedByApp: string | null;
  durationMs: number;
}

// Session flow summary
export interface FlowSessionSummary {
  sessionId: string;
  totalFlowTimeMs: number;           // Time spent in any flow state
  deepFlowTimeMs: number;            // Time spent in deep flow
  flowPeriods: FlowPeriod[];         // All flow periods
  maxLevelReached: FlowLevel;
  longestFlowPeriodMs: number;       // Duration of longest unbroken flow
  flowBreaks: number;                // How many times flow was broken
  achievedDeepFlow: boolean;         // Did user reach deep flow?
}

// Flow streak data
export interface FlowStreak {
  currentStreak: number;             // Days
  longestStreak: number;             // All-time longest
  lastDeepFlowDate: string | null;   // YYYY-MM-DD
  streakStartDate: string | null;    // YYYY-MM-DD
}

// Flow streak milestones
export const FLOW_STREAK_MILESTONES = [
  { days: 2, name: 'Flow Spark', badge: 'flow_spark', emoji: '⚡' },
  { days: 3, name: 'Flow Streak', badge: 'flow_streak', emoji: '🔥' },
  { days: 5, name: 'Flow Master', badge: 'flow_master', emoji: '🏆' },
  { days: 7, name: 'Flow Legend', badge: 'flow_legend', emoji: '💎' },
  { days: 14, name: 'Unstoppable', badge: 'flow_unstoppable', emoji: '👑' },
] as const;

// Flow protection settings (opt-in features)
export interface FlowProtectionSettings {
  autoExtendEnabled: boolean;        // Extend session if in deep flow
  autoExtendMinutes: number;         // How many minutes to extend
  flowWarningsEnabled: boolean;      // Warn before breaking flow
  suppressNotifications: boolean;    // Suppress non-critical notifications
}

// Default flow protection settings
export const DEFAULT_FLOW_PROTECTION: FlowProtectionSettings = {
  autoExtendEnabled: false,
  autoExtendMinutes: 10,
  flowWarningsEnabled: false,
  suppressNotifications: false,
};

// Initial flow state
export const INITIAL_FLOW_STATE: FlowState = {
  level: 'none',
  levelStartedAt: null,
  uninterruptedSince: null,
  grace: {
    active: false,
    startedAt: null,
    triggerApp: null,
    triggerAppBundleId: null,
    remainingMs: GRACE_PERIOD_DURATION,
  },
  isTracking: false,
  sessionDuration: 0,
};

// Initial flow summary
export const INITIAL_FLOW_SUMMARY: FlowSessionSummary = {
  sessionId: '',
  totalFlowTimeMs: 0,
  deepFlowTimeMs: 0,
  flowPeriods: [],
  maxLevelReached: 'none',
  longestFlowPeriodMs: 0,
  flowBreaks: 0,
  achievedDeepFlow: false,
};

// Helper: Get next flow level
export function getNextFlowLevel(current: FlowLevel): FlowLevel | null {
  switch (current) {
    case 'none': return 'building';
    case 'building': return 'established';
    case 'established': return 'deep';
    case 'deep': return null; // Already at max
  }
}

// Helper: Get threshold for next level
export function getThresholdForLevel(level: FlowLevel): number {
  switch (level) {
    case 'none': return 0;
    case 'building': return FLOW_THRESHOLDS.BUILDING;
    case 'established': return FLOW_THRESHOLDS.ESTABLISHED;
    case 'deep': return FLOW_THRESHOLDS.DEEP;
  }
}

// Helper: Check if session is long enough for flow
export function isSessionLongEnoughForFlow(durationMs: number): boolean {
  return durationMs >= MIN_SESSION_FOR_FLOW;
}
```

Create the index file:

Create file: src/lib/flow/index.ts

```typescript
export * from './types';
```

After creating these files:
1. Run `npm run build` to verify no TypeScript errors
2. Verify all types are importable
```

---

## Verification

After completing this task:

```bash
npm run build
```

Expected: No TypeScript errors related to flow types.

```typescript
// Quick verification in any file:
import { 
  FlowLevel,
  FlowState,
  FLOW_THRESHOLDS,
  GRACE_PERIOD_DURATION,
  MIN_SESSION_FOR_FLOW,
  getNextFlowLevel,
} from '@/lib/flow';

// Should compile without errors
const level: FlowLevel = 'building';
const next = getNextFlowLevel(level); // Should be 'established'
console.log(FLOW_THRESHOLDS.DEEP); // Should be 1200000 (20 min in ms)
console.log(GRACE_PERIOD_DURATION); // Should be 90000 (90 sec in ms)
```
