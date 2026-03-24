# Task: Flow Detection Testing & Integration

## Phase: 6
## Part: 2 (Flow Detection)
## Task: 13
## Depends On: task-12-flow-data-persistence
## Estimated Time: 2 hours

---

## Context Files

- `src/lib/flow/__tests__/` (create directory)
- `src/lib/flow/__tests__/flowStateMachine.test.ts` (create)
- `src/lib/flow/__tests__/streaks.test.ts` (create)
- `src/lib/flow/__tests__/badges.test.ts` (create)
- `src-tauri/src/flow/tests.rs` (create)

---

## Success Criteria

- [ ] Unit tests for flow state machine transitions
- [ ] Unit tests for grace period logic
- [ ] Unit tests for streak calculations (including weekends)
- [ ] Unit tests for badge evaluation
- [ ] Integration test: full session with flow tracking
- [ ] Integration test: streak across multiple sessions
- [ ] All tests pass
- [ ] Test coverage > 80% for flow modules

---

## Test Cases

### State Machine Tests
- Initial state is 'none'
- Transition none → building after 5 min focus
- Transition building → established after 10 min
- Transition established → deep after 20 min
- Grace period starts on blocked app switch
- Grace period cancels on return to whitelisted app
- Flow resets to 'none' when grace exceeds 90 seconds
- No flow tracking for sessions < 30 min

### Streak Tests
- Monday flow → streak = 1
- Mon + Tue flow → streak = 2
- Fri flow → Sat skip → Sun skip → Mon flow → streak = 2
- Fri flow → Sat flow → streak = 1 (weekend doesn't extend)
- Mon flow → Wed flow (skip Tue) → streak = 1 (broken)
- Streak milestone detection at 3, 5, 7, 14 days

### Badge Tests
- First deep flow awards 'flow_first'
- 10 min deep flow awards 'flow_diver'
- 30 min deep flow awards 'deep_diver'
- 1 hour cumulative awards 'flow_1hr'
- No duplicate badge awards
- Multiple badges can be earned in one session

---

## Implementation Prompt

```
Implement comprehensive tests for the flow detection system.

Step 1: Create flow state machine tests

Create file: src/lib/flow/__tests__/flowStateMachine.test.ts

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  FlowState,
  FlowLevel,
  createInitialFlowState,
  calculateFlowTransition,
  startGracePeriod,
  checkGracePeriod,
} from '../stateMachine';

describe('Flow State Machine', () => {
  describe('Initial State', () => {
    it('should start with level none', () => {
      const state = createInitialFlowState();
      expect(state.level).toBe('none');
      expect(state.uninterruptedSince).toBeNull();
      expect(state.graceActive).toBe(false);
    });
  });

  describe('Flow Level Transitions', () => {
    it('should transition to building after 5 minutes of focus', () => {
      const state = createInitialFlowState();
      const now = Date.now();
      state.uninterruptedSince = now - 5 * 60 * 1000; // 5 min ago
      
      const newState = calculateFlowTransition(state, now);
      expect(newState.level).toBe('building');
    });

    it('should transition to established after 10 minutes', () => {
      const state = createInitialFlowState();
      state.level = 'building';
      const now = Date.now();
      state.uninterruptedSince = now - 10 * 60 * 1000;
      
      const newState = calculateFlowTransition(state, now);
      expect(newState.level).toBe('established');
    });

    it('should transition to deep after 20 minutes', () => {
      const state = createInitialFlowState();
      state.level = 'established';
      const now = Date.now();
      state.uninterruptedSince = now - 20 * 60 * 1000;
      
      const newState = calculateFlowTransition(state, now);
      expect(newState.level).toBe('deep');
    });

    it('should stay at deep level after 20+ minutes', () => {
      const state = createInitialFlowState();
      state.level = 'deep';
      const now = Date.now();
      state.uninterruptedSince = now - 60 * 60 * 1000; // 1 hour
      
      const newState = calculateFlowTransition(state, now);
      expect(newState.level).toBe('deep');
    });

    it('should not advance level if not enough time passed', () => {
      const state = createInitialFlowState();
      const now = Date.now();
      state.uninterruptedSince = now - 3 * 60 * 1000; // 3 min
      
      const newState = calculateFlowTransition(state, now);
      expect(newState.level).toBe('none');
    });
  });

  describe('Grace Period', () => {
    it('should start grace period when switching to blocked app', () => {
      const state = createInitialFlowState();
      state.level = 'building';
      
      const newState = startGracePeriod(state, 'Twitter');
      expect(newState.graceActive).toBe(true);
      expect(newState.graceTriggerApp).toBe('Twitter');
      expect(newState.graceStartedAt).toBeDefined();
    });

    it('should preserve flow level during grace period', () => {
      const state = createInitialFlowState();
      state.level = 'deep';
      
      const newState = startGracePeriod(state, 'Twitter');
      expect(newState.level).toBe('deep');
    });

    it('should cancel grace and continue flow when returning to whitelisted app', () => {
      const state = createInitialFlowState();
      state.level = 'established';
      state.graceActive = true;
      state.graceStartedAt = Date.now() - 30 * 1000; // 30 sec ago
      
      const result = checkGracePeriod(state, { returnedToFocus: true });
      expect(result.graceActive).toBe(false);
      expect(result.level).toBe('established');
    });

    it('should reset flow to none when grace exceeds 90 seconds', () => {
      const state = createInitialFlowState();
      state.level = 'deep';
      state.graceActive = true;
      state.graceStartedAt = Date.now() - 91 * 1000; // 91 sec ago
      
      const result = checkGracePeriod(state, { returnedToFocus: false });
      expect(result.level).toBe('none');
      expect(result.graceActive).toBe(false);
    });

    it('should not reset flow if grace within 90 seconds', () => {
      const state = createInitialFlowState();
      state.level = 'deep';
      state.graceActive = true;
      state.graceStartedAt = Date.now() - 45 * 1000; // 45 sec ago
      
      const result = checkGracePeriod(state, { returnedToFocus: false });
      expect(result.level).toBe('deep');
      expect(result.graceActive).toBe(true);
    });
  });

  describe('Session Duration Requirement', () => {
    it('should not track flow for sessions under 30 minutes', () => {
      const state = createInitialFlowState();
      const sessionDurationMs = 25 * 60 * 1000; // 25 min
      
      // Even with 10 min focus, should not enter flow
      state.uninterruptedSince = Date.now() - 10 * 60 * 1000;
      
      const newState = calculateFlowTransition(state, Date.now(), sessionDurationMs);
      expect(newState.level).toBe('none');
    });

    it('should track flow for sessions 30 minutes or longer', () => {
      const state = createInitialFlowState();
      const sessionDurationMs = 45 * 60 * 1000; // 45 min
      state.uninterruptedSince = Date.now() - 10 * 60 * 1000;
      
      const newState = calculateFlowTransition(state, Date.now(), sessionDurationMs);
      expect(newState.level).toBe('established');
    });
  });
});
```

Step 2: Create streak calculation tests

Create file: src/lib/flow/__tests__/streaks.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import {
  isWeekend,
  formatDate,
  parseDate,
  countWeekdaysBetween,
  getLastWeekday,
  calculateStreakUpdate,
  getCurrentMilestone,
  getNextMilestone,
} from '../streaks';
import { FlowStreak, EMPTY_FLOW_STREAK } from '../types';

describe('Streak Utilities', () => {
  describe('isWeekend', () => {
    it('should return true for Saturday', () => {
      const saturday = new Date('2026-03-14'); // Saturday
      expect(isWeekend(saturday)).toBe(true);
    });

    it('should return true for Sunday', () => {
      const sunday = new Date('2026-03-15'); // Sunday
      expect(isWeekend(sunday)).toBe(true);
    });

    it('should return false for weekdays', () => {
      const monday = new Date('2026-03-16'); // Monday
      const wednesday = new Date('2026-03-18'); // Wednesday
      expect(isWeekend(monday)).toBe(false);
      expect(isWeekend(wednesday)).toBe(false);
    });
  });

  describe('countWeekdaysBetween', () => {
    it('should count weekdays between two dates', () => {
      const monday = new Date('2026-03-16');
      const thursday = new Date('2026-03-19');
      expect(countWeekdaysBetween(monday, thursday)).toBe(2); // Tue, Wed
    });

    it('should skip weekends', () => {
      const friday = new Date('2026-03-13');
      const monday = new Date('2026-03-16');
      expect(countWeekdaysBetween(friday, monday)).toBe(0); // Only weekend between
    });
  });

  describe('getLastWeekday', () => {
    it('should return Friday for Saturday', () => {
      const saturday = new Date('2026-03-14');
      const lastWeekday = getLastWeekday(saturday);
      expect(formatDate(lastWeekday)).toBe('2026-03-13'); // Friday
    });

    it('should return Friday for Sunday', () => {
      const sunday = new Date('2026-03-15');
      const lastWeekday = getLastWeekday(sunday);
      expect(formatDate(lastWeekday)).toBe('2026-03-13'); // Friday
    });

    it('should return previous day for weekday', () => {
      const wednesday = new Date('2026-03-18');
      const lastWeekday = getLastWeekday(wednesday);
      expect(formatDate(lastWeekday)).toBe('2026-03-17'); // Tuesday
    });
  });
});

describe('Streak Calculations', () => {
  describe('First Flow', () => {
    it('should start streak at 1 on first weekday deep flow', () => {
      const result = calculateStreakUpdate(
        EMPTY_FLOW_STREAK,
        true, // achieved deep flow
        new Date('2026-03-16') // Monday
      );
      
      expect(result.newStreak.currentStreak).toBe(1);
      expect(result.newStreak.lastDeepFlowDate).toBe('2026-03-16');
      expect(result.newStreak.streakStartDate).toBe('2026-03-16');
    });

    it('should not start streak on weekend', () => {
      const result = calculateStreakUpdate(
        EMPTY_FLOW_STREAK,
        true,
        new Date('2026-03-14') // Saturday
      );
      
      expect(result.newStreak.currentStreak).toBe(0);
      expect(result.newStreak.lastDeepFlowDate).toBe('2026-03-14');
    });
  });

  describe('Consecutive Days', () => {
    it('should increment streak on consecutive weekdays', () => {
      const mondayStreak: FlowStreak = {
        currentStreak: 1,
        longestStreak: 1,
        lastDeepFlowDate: '2026-03-16', // Monday
        streakStartDate: '2026-03-16',
      };

      const result = calculateStreakUpdate(
        mondayStreak,
        true,
        new Date('2026-03-17') // Tuesday
      );

      expect(result.newStreak.currentStreak).toBe(2);
    });

    it('should break streak if weekday is missed', () => {
      const mondayStreak: FlowStreak = {
        currentStreak: 2,
        longestStreak: 2,
        lastDeepFlowDate: '2026-03-16', // Monday
        streakStartDate: '2026-03-13',
      };

      const result = calculateStreakUpdate(
        mondayStreak,
        true,
        new Date('2026-03-18') // Wednesday (skipped Tuesday)
      );

      expect(result.newStreak.currentStreak).toBe(1);
      expect(result.streakBroken).toBe(true);
    });
  });

  describe('Weekend Handling', () => {
    it('should not break streak over weekend', () => {
      const fridayStreak: FlowStreak = {
        currentStreak: 3,
        longestStreak: 3,
        lastDeepFlowDate: '2026-03-13', // Friday
        streakStartDate: '2026-03-11',
      };

      // Skip Saturday and Sunday, flow on Monday
      const result = calculateStreakUpdate(
        fridayStreak,
        true,
        new Date('2026-03-16') // Monday
      );

      expect(result.newStreak.currentStreak).toBe(4);
      expect(result.streakBroken).toBe(false);
    });

    it('should not extend streak for weekend sessions', () => {
      const fridayStreak: FlowStreak = {
        currentStreak: 3,
        longestStreak: 3,
        lastDeepFlowDate: '2026-03-13', // Friday
        streakStartDate: '2026-03-11',
      };

      // Session on Saturday
      const result = calculateStreakUpdate(
        fridayStreak,
        true,
        new Date('2026-03-14') // Saturday
      );

      expect(result.newStreak.currentStreak).toBe(3); // No change
      expect(result.newStreak.lastDeepFlowDate).toBe('2026-03-14'); // Updated
    });

    it('should not break streak when no weekend session', () => {
      const fridayStreak: FlowStreak = {
        currentStreak: 2,
        longestStreak: 2,
        lastDeepFlowDate: '2026-03-13', // Friday
        streakStartDate: '2026-03-12',
      };

      // No session Saturday, check Sunday
      const result = calculateStreakUpdate(
        fridayStreak,
        false, // no deep flow
        new Date('2026-03-15') // Sunday
      );

      expect(result.newStreak.currentStreak).toBe(2); // Preserved
      expect(result.streakBroken).toBe(false);
    });
  });

  describe('Milestones', () => {
    it('should detect 3-day milestone', () => {
      const streak: FlowStreak = {
        currentStreak: 2,
        longestStreak: 2,
        lastDeepFlowDate: '2026-03-17',
        streakStartDate: '2026-03-16',
      };

      const result = calculateStreakUpdate(
        streak,
        true,
        new Date('2026-03-18')
      );

      expect(result.isNewMilestone).toBe(true);
      expect(result.milestone?.days).toBe(3);
      expect(result.milestone?.name).toBe('Flow Streak');
    });

    it('should detect 7-day milestone', () => {
      const streak: FlowStreak = {
        currentStreak: 6,
        longestStreak: 6,
        lastDeepFlowDate: '2026-03-17',
        streakStartDate: '2026-03-10',
      };

      const result = calculateStreakUpdate(
        streak,
        true,
        new Date('2026-03-18')
      );

      expect(result.isNewMilestone).toBe(true);
      expect(result.milestone?.days).toBe(7);
      expect(result.milestone?.name).toBe('Flow Legend');
    });
  });

  describe('Longest Streak Tracking', () => {
    it('should update longest streak when current exceeds it', () => {
      const streak: FlowStreak = {
        currentStreak: 5,
        longestStreak: 5,
        lastDeepFlowDate: '2026-03-17',
        streakStartDate: '2026-03-11',
      };

      const result = calculateStreakUpdate(
        streak,
        true,
        new Date('2026-03-18')
      );

      expect(result.newStreak.currentStreak).toBe(6);
      expect(result.newStreak.longestStreak).toBe(6);
    });

    it('should preserve longest streak when current is lower', () => {
      const streak: FlowStreak = {
        currentStreak: 0,
        longestStreak: 10,
        lastDeepFlowDate: '2026-03-10',
        streakStartDate: null,
      };

      const result = calculateStreakUpdate(
        streak,
        true,
        new Date('2026-03-18')
      );

      expect(result.newStreak.currentStreak).toBe(1);
      expect(result.newStreak.longestStreak).toBe(10);
    });
  });
});

describe('Milestone Helpers', () => {
  describe('getCurrentMilestone', () => {
    it('should return null for streak < 2', () => {
      expect(getCurrentMilestone(1)).toBeNull();
    });

    it('should return Flow Spark for streak of 2', () => {
      expect(getCurrentMilestone(2)?.name).toBe('Flow Spark');
    });

    it('should return highest applicable milestone', () => {
      expect(getCurrentMilestone(8)?.name).toBe('Flow Legend');
      expect(getCurrentMilestone(15)?.name).toBe('Unstoppable');
    });
  });

  describe('getNextMilestone', () => {
    it('should return Flow Spark for streak of 0', () => {
      expect(getNextMilestone(0)?.name).toBe('Flow Spark');
    });

    it('should return next milestone', () => {
      expect(getNextMilestone(3)?.name).toBe('Flow Master');
      expect(getNextMilestone(7)?.name).toBe('Unstoppable');
    });

    it('should return null when at max milestone', () => {
      expect(getNextMilestone(14)).toBeNull();
      expect(getNextMilestone(20)).toBeNull();
    });
  });
});
```

Step 3: Create badge evaluation tests

Create file: src/lib/flow/__tests__/badges.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { evaluateFlowBadges, FlowStats, FLOW_BADGE_IDS } from '../../badges/flowBadges';
import { FlowSessionSummary, createEmptyFlowSummary } from '../types';

describe('Flow Badge Evaluation', () => {
  const baseStats: FlowStats = {
    cumulativeDeepFlowMs: 0,
    hasEverAchievedDeepFlow: false,
    currentStreak: 0,
    earnedBadgeIds: [],
  };

  const createSummary = (overrides: Partial<FlowSessionSummary> = {}): FlowSessionSummary => ({
    ...createEmptyFlowSummary('test-session', 45 * 60 * 1000),
    ...overrides,
  });

  describe('First Flow Badge', () => {
    it('should award first flow badge on first deep flow', () => {
      const summary = createSummary({
        achievedDeepFlow: true,
        deepFlowTimeMs: 5 * 60 * 1000,
      });

      const result = evaluateFlowBadges(summary, baseStats);
      expect(result.newBadges).toContain(FLOW_BADGE_IDS.FIRST_FLOW);
    });

    it('should not award first flow badge if already earned', () => {
      const summary = createSummary({
        achievedDeepFlow: true,
        deepFlowTimeMs: 5 * 60 * 1000,
      });

      const stats: FlowStats = {
        ...baseStats,
        hasEverAchievedDeepFlow: true,
        earnedBadgeIds: [FLOW_BADGE_IDS.FIRST_FLOW],
      };

      const result = evaluateFlowBadges(summary, stats);
      expect(result.newBadges).not.toContain(FLOW_BADGE_IDS.FIRST_FLOW);
    });
  });

  describe('Session Deep Flow Badges', () => {
    it('should award flow diver for 10 min deep flow', () => {
      const summary = createSummary({
        achievedDeepFlow: true,
        deepFlowTimeMs: 10 * 60 * 1000,
      });

      const result = evaluateFlowBadges(summary, baseStats);
      expect(result.newBadges).toContain(FLOW_BADGE_IDS.FLOW_DIVER);
    });

    it('should award deep diver for 30 min deep flow', () => {
      const summary = createSummary({
        achievedDeepFlow: true,
        deepFlowTimeMs: 30 * 60 * 1000,
      });

      const result = evaluateFlowBadges(summary, baseStats);
      expect(result.newBadges).toContain(FLOW_BADGE_IDS.DEEP_DIVER);
    });

    it('should award multiple session badges at once', () => {
      const summary = createSummary({
        achievedDeepFlow: true,
        deepFlowTimeMs: 45 * 60 * 1000,
      });

      const result = evaluateFlowBadges(summary, baseStats);
      expect(result.newBadges).toContain(FLOW_BADGE_IDS.FLOW_DIVER);
      expect(result.newBadges).toContain(FLOW_BADGE_IDS.DEEP_DIVER);
      expect(result.newBadges).toContain(FLOW_BADGE_IDS.FLOW_MASTER);
    });

    it('should not award duplicate badges', () => {
      const summary = createSummary({
        achievedDeepFlow: true,
        deepFlowTimeMs: 30 * 60 * 1000,
      });

      const stats: FlowStats = {
        ...baseStats,
        earnedBadgeIds: [FLOW_BADGE_IDS.FLOW_DIVER],
      };

      const result = evaluateFlowBadges(summary, stats);
      expect(result.newBadges).not.toContain(FLOW_BADGE_IDS.FLOW_DIVER);
      expect(result.newBadges).toContain(FLOW_BADGE_IDS.DEEP_DIVER);
    });
  });

  describe('Cumulative Badges', () => {
    it('should award hour of flow when crossing 1 hour threshold', () => {
      const summary = createSummary({
        achievedDeepFlow: true,
        deepFlowTimeMs: 20 * 60 * 1000, // 20 min this session
      });

      const stats: FlowStats = {
        ...baseStats,
        cumulativeDeepFlowMs: 45 * 60 * 1000, // 45 min prior
      };

      // 45 + 20 = 65 min > 60 min threshold
      const result = evaluateFlowBadges(summary, stats);
      expect(result.newBadges).toContain(FLOW_BADGE_IDS.HOUR_OF_FLOW);
    });

    it('should not award if threshold was already crossed', () => {
      const summary = createSummary({
        achievedDeepFlow: true,
        deepFlowTimeMs: 20 * 60 * 1000,
      });

      const stats: FlowStats = {
        ...baseStats,
        cumulativeDeepFlowMs: 2 * 60 * 60 * 1000, // 2 hours prior
      };

      const result = evaluateFlowBadges(summary, stats);
      expect(result.newBadges).not.toContain(FLOW_BADGE_IDS.HOUR_OF_FLOW);
    });

    it('should track progress toward cumulative badges', () => {
      const summary = createSummary({
        achievedDeepFlow: true,
        deepFlowTimeMs: 15 * 60 * 1000, // 15 min
      });

      const result = evaluateFlowBadges(summary, baseStats);
      
      const hourProgress = result.progressUpdates.find(
        p => p.badgeId === FLOW_BADGE_IDS.HOUR_OF_FLOW
      );
      expect(hourProgress).toBeDefined();
      expect(hourProgress?.current).toBe(15 * 60 * 1000);
      expect(hourProgress?.target).toBe(60 * 60 * 1000);
    });
  });

  describe('Streak Badges', () => {
    it('should award 3-day streak badge', () => {
      const summary = createSummary({
        achievedDeepFlow: true,
        deepFlowTimeMs: 5 * 60 * 1000,
      });

      const stats: FlowStats = {
        ...baseStats,
        currentStreak: 2, // Will become 3
      };

      const result = evaluateFlowBadges(summary, stats);
      expect(result.newBadges).toContain(FLOW_BADGE_IDS.FLOW_STREAK_3);
    });

    it('should award 7-day streak badge', () => {
      const summary = createSummary({
        achievedDeepFlow: true,
        deepFlowTimeMs: 5 * 60 * 1000,
      });

      const stats: FlowStats = {
        ...baseStats,
        currentStreak: 6,
      };

      const result = evaluateFlowBadges(summary, stats);
      expect(result.newBadges).toContain(FLOW_BADGE_IDS.FLOW_STREAK_7);
    });
  });

  describe('Special Badges', () => {
    it('should award unbroken flow badge for full session in flow', () => {
      const summary = createSummary({
        achievedDeepFlow: true,
        totalFlowTimeMs: 44 * 60 * 1000, // 44 min of 45 min session (98%)
        deepFlowTimeMs: 25 * 60 * 1000,
        flowBreaks: 0,
        sessionDurationMs: 45 * 60 * 1000,
      });

      const result = evaluateFlowBadges(summary, baseStats);
      expect(result.newBadges).toContain(FLOW_BADGE_IDS.FLOW_UNBROKEN);
    });

    it('should not award unbroken if flow breaks > 0', () => {
      const summary = createSummary({
        achievedDeepFlow: true,
        totalFlowTimeMs: 40 * 60 * 1000,
        deepFlowTimeMs: 25 * 60 * 1000,
        flowBreaks: 1,
        sessionDurationMs: 45 * 60 * 1000,
      });

      const result = evaluateFlowBadges(summary, baseStats);
      expect(result.newBadges).not.toContain(FLOW_BADGE_IDS.FLOW_UNBROKEN);
    });

    it('should award comeback badge for rebuilding flow 3+ times', () => {
      const summary = createSummary({
        achievedDeepFlow: true,
        deepFlowTimeMs: 10 * 60 * 1000,
        periods: [
          { id: '1', startMs: 0, endMs: 300000, level: 'building', wasInterrupted: true, interruptedByApp: null },
          { id: '2', startMs: 400000, endMs: 700000, level: 'building', wasInterrupted: true, interruptedByApp: null },
          { id: '3', startMs: 800000, endMs: 1100000, level: 'established', wasInterrupted: true, interruptedByApp: null },
          { id: '4', startMs: 1200000, endMs: 1500000, level: 'deep', wasInterrupted: false, interruptedByApp: null },
        ],
      });

      const result = evaluateFlowBadges(summary, baseStats);
      expect(result.newBadges).toContain(FLOW_BADGE_IDS.FLOW_COMEBACK);
    });
  });
});
```

Step 4: Update package.json test script

Ensure vitest is configured and test script exists:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

Step 5: Run tests

```bash
npm run test
```

After making these changes:
1. Run all tests
2. Verify coverage meets threshold
3. Fix any failing tests
```

---

## Verification

After completing this task:

```bash
# Run all flow tests
npm run test src/lib/flow

# Run with coverage
npm run test:coverage
```

Expected output:
- All tests pass
- Coverage > 80% for flow modules

Test count expectations:
- flowStateMachine.test.ts: ~15 tests
- streaks.test.ts: ~20 tests  
- badges.test.ts: ~15 tests
- Total: ~50 tests

Integration verification:

1. Run full test suite:
   ```bash
   npm run test
   ```
   - [ ] All tests pass
   - [ ] No console errors

2. Check coverage report:
   ```bash
   npm run test:coverage
   ```
   - [ ] src/lib/flow/stateMachine.ts > 80%
   - [ ] src/lib/flow/streaks.ts > 80%
   - [ ] src/lib/badges/flowBadges.ts > 80%

3. Manual integration test:
   - [ ] Start 45-minute session
   - [ ] Achieve deep flow
   - [ ] Verify celebrations appear
   - [ ] End session
   - [ ] Verify summary shows flow data
   - [ ] Verify badges awarded
   - [ ] Restart app
   - [ ] Verify streak persisted
