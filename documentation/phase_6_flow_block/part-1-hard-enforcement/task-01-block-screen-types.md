# Task: Define Block Screen & Enforcement Types

## Phase: 6
## Part: 1 (Hard Enforcement)
## Task: 01
## Depends On: Phase 9 complete
## Estimated Time: 1 hour

---

## Context Files

- `src/types/session.ts` (update)
- `src/lib/enforcement/types.ts` (create)

---

## Success Criteria

- [ ] `BlockScreenState` interface is defined
- [ ] `Violation` interface is defined
- [ ] `SessionEnforcementState` interface is defined
- [ ] `IdleState` interface is defined
- [ ] `EscalationLevel` type is defined with 4 levels
- [ ] `BlockScreenConfig` contains duration and messages per level
- [ ] All types are exported from a central index
- [ ] TypeScript compiles with no errors

---

## Test Cases

- Import all types in a test file → expect no TypeScript errors
- `ESCALATION_CONFIG[1].duration` → expect 30
- `ESCALATION_CONFIG[2].duration` → expect 60
- `ESCALATION_CONFIG[3].duration` → expect 90
- `ESCALATION_CONFIG[4].duration` → expect 120
- `BlockScreenState` has `canDismiss` property → expect boolean type

---

## Implementation Prompt

```
Create TypeScript types for the hard enforcement system.

Create file: src/lib/enforcement/types.ts

// Escalation levels (1-4)
export type EscalationLevel = 1 | 2 | 3 | 4;

// A single violation during a session
export interface Violation {
  id: string;
  timestamp: number;
  appName: string;
  appBundleId: string;
  durationShown: number; // How long block screen was displayed
  escalationLevel: EscalationLevel;
  userResponse?: 'waited' | 'dismissed'; // How user handled it
}

// Current state of the block screen
export interface BlockScreenState {
  isVisible: boolean;
  startTime: number;
  totalDuration: number; // Total time to wait
  remainingTime: number; // Updated every second
  canDismiss: boolean; // False in Legend mode until timer done
  violationNumber: number; // Which violation this is (1st, 2nd, etc.)
  appName: string; // The app that triggered it
  message: string; // Display message
  escalationLevel: EscalationLevel;
}

// Idle detection state
export interface IdleState {
  isIdle: boolean;
  idleStartTime: number | null;
  lastActivityTime: number;
  screenLocked: boolean;
}

// Session pause reasons
export type PauseReason = 'idle' | 'user' | 'screenLock' | null;

// Full enforcement state for a session
export interface SessionEnforcementState {
  // Violation tracking
  violationCount: number;
  violations: Violation[];
  
  // Block screen
  blockScreen: BlockScreenState | null;
  
  // Pause state
  isPaused: boolean;
  pausedAt: number | null;
  pauseReason: PauseReason;
  totalPausedTime: number; // Accumulated pause time in ms
  
  // Idle tracking
  idle: IdleState;
}

// Configuration for each escalation level
export interface EscalationConfig {
  level: EscalationLevel;
  duration: number; // seconds
  message: string;
  showReflection: boolean; // Show reflection prompt
}

// Escalation configuration
export const ESCALATION_CONFIG: Record<EscalationLevel, EscalationConfig> = {
  1: {
    level: 1,
    duration: 30,
    message: "Let's get back on track",
    showReflection: false,
  },
  2: {
    level: 2,
    duration: 60,
    message: "This is your second distraction",
    showReflection: false,
  },
  3: {
    level: 3,
    duration: 90,
    message: "Three distractions. Take a breath.",
    showReflection: true,
  },
  4: {
    level: 4,
    duration: 120,
    message: "Consider what you're trying to achieve",
    showReflection: true,
  },
};

// Idle detection thresholds (in milliseconds)
export const IDLE_THRESHOLDS = {
  WARNING: 2 * 60 * 1000,    // 2 minutes - show "still there?"
  PAUSE: 5 * 60 * 1000,      // 5 minutes - pause session
} as const;

// Reflection prompt options (for level 3+)
export const REFLECTION_OPTIONS = [
  { id: 'unclear', label: 'The task is unclear' },
  { id: 'tired', label: "I'm tired or fatigued" },
  { id: 'distracted', label: 'Something is on my mind' },
  { id: 'break', label: 'I need a break' },
  { id: 'blocklist', label: 'The wrong apps are blocked' },
] as const;

export type ReflectionOption = typeof REFLECTION_OPTIONS[number]['id'];

// Initial enforcement state
export const INITIAL_ENFORCEMENT_STATE: SessionEnforcementState = {
  violationCount: 0,
  violations: [],
  blockScreen: null,
  isPaused: false,
  pausedAt: null,
  pauseReason: null,
  totalPausedTime: 0,
  idle: {
    isIdle: false,
    idleStartTime: null,
    lastActivityTime: Date.now(),
    screenLocked: false,
  },
};

// Helper to get escalation level from violation count
export function getEscalationLevel(violationCount: number): EscalationLevel {
  if (violationCount <= 1) return 1;
  if (violationCount === 2) return 2;
  if (violationCount === 3) return 3;
  return 4; // 4th and beyond
}

// Helper to get escalation config
export function getEscalationConfig(violationCount: number): EscalationConfig {
  const level = getEscalationLevel(violationCount);
  return ESCALATION_CONFIG[level];
}
```

Create the index file:

Create file: src/lib/enforcement/index.ts

```typescript
export * from './types';
```

Update src/types/index.ts to include enforcement types if it exists, or create it:

```typescript
// Add to existing exports or create new file
export * from '@/lib/enforcement';
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

Expected: No TypeScript errors related to enforcement types.

```typescript
// Quick verification in any file:
import { 
  BlockScreenState, 
  Violation, 
  ESCALATION_CONFIG,
  getEscalationLevel 
} from '@/lib/enforcement';

// Should compile without errors
const level = getEscalationLevel(3); // Should be 3
const config = ESCALATION_CONFIG[level]; // Should have duration: 90
```
