# Task: Implement Flow Badges

## Phase: 6
## Part: 2 (Flow Detection)
## Task: 10
## Depends On: task-09-flow-session-summary
## Estimated Time: 1.5 hours

---

## Context Files

- `src/lib/badges/flowBadges.ts` (create)
- `src/lib/badges/index.ts` (update)
- `src-tauri/src/badges/flow_badges.rs` (create)
- `src-tauri/src/badges/mod.rs` (update)
- `src/hooks/useFlow.ts` (update)

---

## Success Criteria

- [ ] Flow badge definitions exist for all flow achievements
- [ ] Badges awarded on first deep flow
- [ ] Badges awarded for cumulative deep flow time (1hr, 5hr, 10hr, 25hr)
- [ ] Badges awarded for single session flow achievements
- [ ] Badges integrate with existing badge system (Phase 8)
- [ ] Badge award triggers notification (or hooks into existing notification system)
- [ ] Flow badges appear in badges list with correct icons
- [ ] Badge progress tracked across sessions

---

## Test Cases

- First time reaching deep flow → expect "First Flow" badge awarded
- 10 min deep flow in single session → expect "Flow Diver" badge
- 30 min deep flow in single session → expect "Deep Diver" badge
- 45 min deep flow in single session → expect "Flow Master" badge
- Cumulative 1 hour deep flow → expect "Hour of Flow" badge
- Cumulative 5 hours deep flow → expect "Flow Apprentice" badge
- Cumulative 10 hours deep flow → expect "Flow Journeyman" badge
- Cumulative 25 hours deep flow → expect "Flow Expert" badge
- Badge already earned → expect no duplicate award
- Multiple badges earned in same session → expect all awarded

---

## Implementation Prompt

```
Implement flow-related badges that integrate with the existing Phase 8 badge system.

Step 1: Create flow badge definitions

Create file: src/lib/badges/flowBadges.ts

```typescript
import { BadgeDefinition, BadgeCategory, BadgeRarity } from './types';

// Flow badge IDs
export const FLOW_BADGE_IDS = {
  // First achievements
  FIRST_FLOW: 'flow_first',
  
  // Single session achievements
  FLOW_DIVER: 'flow_diver',           // 10 min deep flow
  DEEP_DIVER: 'deep_diver',           // 30 min deep flow
  FLOW_MASTER: 'flow_master_session', // 45 min deep flow
  FLOW_MARATHON: 'flow_marathon',     // 60 min deep flow
  
  // Cumulative achievements
  HOUR_OF_FLOW: 'flow_1hr',
  FLOW_APPRENTICE: 'flow_5hr',
  FLOW_JOURNEYMAN: 'flow_10hr',
  FLOW_EXPERT: 'flow_25hr',
  FLOW_LEGEND: 'flow_50hr',
  
  // Special achievements
  FLOW_STREAK_3: 'flow_streak_3',     // 3 day flow streak
  FLOW_STREAK_7: 'flow_streak_7',     // 7 day flow streak
  FLOW_STREAK_14: 'flow_streak_14',   // 14 day flow streak
  FLOW_UNBROKEN: 'flow_unbroken',     // Entire session in flow
  FLOW_COMEBACK: 'flow_comeback',     // Rebuild flow 3 times
} as const;

export const FLOW_BADGES: BadgeDefinition[] = [
  // First achievements
  {
    id: FLOW_BADGE_IDS.FIRST_FLOW,
    name: 'First Flow',
    description: 'Achieved deep flow for the first time',
    emoji: '🌊',
    category: 'flow' as BadgeCategory,
    rarity: 'common' as BadgeRarity,
    criteria: {
      type: 'flow_first',
      threshold: 1,
    },
  },
  
  // Single session achievements
  {
    id: FLOW_BADGE_IDS.FLOW_DIVER,
    name: 'Flow Diver',
    description: '10 minutes of deep flow in one session',
    emoji: '🏊',
    category: 'flow' as BadgeCategory,
    rarity: 'common' as BadgeRarity,
    criteria: {
      type: 'flow_session_deep',
      threshold: 10 * 60 * 1000, // 10 min in ms
    },
  },
  {
    id: FLOW_BADGE_IDS.DEEP_DIVER,
    name: 'Deep Diver',
    description: '30 minutes of deep flow in one session',
    emoji: '🤿',
    category: 'flow' as BadgeCategory,
    rarity: 'uncommon' as BadgeRarity,
    criteria: {
      type: 'flow_session_deep',
      threshold: 30 * 60 * 1000,
    },
  },
  {
    id: FLOW_BADGE_IDS.FLOW_MASTER,
    name: 'Session Flow Master',
    description: '45 minutes of deep flow in one session',
    emoji: '🎯',
    category: 'flow' as BadgeCategory,
    rarity: 'rare' as BadgeRarity,
    criteria: {
      type: 'flow_session_deep',
      threshold: 45 * 60 * 1000,
    },
  },
  {
    id: FLOW_BADGE_IDS.FLOW_MARATHON,
    name: 'Flow Marathon',
    description: '60 minutes of deep flow in one session',
    emoji: '🏆',
    category: 'flow' as BadgeCategory,
    rarity: 'epic' as BadgeRarity,
    criteria: {
      type: 'flow_session_deep',
      threshold: 60 * 60 * 1000,
    },
  },
  
  // Cumulative achievements
  {
    id: FLOW_BADGE_IDS.HOUR_OF_FLOW,
    name: 'Hour of Flow',
    description: '1 hour of cumulative deep flow',
    emoji: '⏰',
    category: 'flow' as BadgeCategory,
    rarity: 'common' as BadgeRarity,
    criteria: {
      type: 'flow_cumulative_deep',
      threshold: 1 * 60 * 60 * 1000, // 1 hour
    },
  },
  {
    id: FLOW_BADGE_IDS.FLOW_APPRENTICE,
    name: 'Flow Apprentice',
    description: '5 hours of cumulative deep flow',
    emoji: '📚',
    category: 'flow' as BadgeCategory,
    rarity: 'uncommon' as BadgeRarity,
    criteria: {
      type: 'flow_cumulative_deep',
      threshold: 5 * 60 * 60 * 1000,
    },
  },
  {
    id: FLOW_BADGE_IDS.FLOW_JOURNEYMAN,
    name: 'Flow Journeyman',
    description: '10 hours of cumulative deep flow',
    emoji: '🔨',
    category: 'flow' as BadgeCategory,
    rarity: 'rare' as BadgeRarity,
    criteria: {
      type: 'flow_cumulative_deep',
      threshold: 10 * 60 * 60 * 1000,
    },
  },
  {
    id: FLOW_BADGE_IDS.FLOW_EXPERT,
    name: 'Flow Expert',
    description: '25 hours of cumulative deep flow',
    emoji: '🎓',
    category: 'flow' as BadgeCategory,
    rarity: 'epic' as BadgeRarity,
    criteria: {
      type: 'flow_cumulative_deep',
      threshold: 25 * 60 * 60 * 1000,
    },
  },
  {
    id: FLOW_BADGE_IDS.FLOW_LEGEND,
    name: 'Flow Legend',
    description: '50 hours of cumulative deep flow',
    emoji: '👑',
    category: 'flow' as BadgeCategory,
    rarity: 'legendary' as BadgeRarity,
    criteria: {
      type: 'flow_cumulative_deep',
      threshold: 50 * 60 * 60 * 1000,
    },
  },
  
  // Streak badges
  {
    id: FLOW_BADGE_IDS.FLOW_STREAK_3,
    name: 'Flow Streak',
    description: '3 day flow streak',
    emoji: '🔥',
    category: 'flow' as BadgeCategory,
    rarity: 'uncommon' as BadgeRarity,
    criteria: {
      type: 'flow_streak',
      threshold: 3,
    },
  },
  {
    id: FLOW_BADGE_IDS.FLOW_STREAK_7,
    name: 'Flow Legend Week',
    description: '7 day flow streak',
    emoji: '💎',
    category: 'flow' as BadgeCategory,
    rarity: 'rare' as BadgeRarity,
    criteria: {
      type: 'flow_streak',
      threshold: 7,
    },
  },
  {
    id: FLOW_BADGE_IDS.FLOW_STREAK_14,
    name: 'Unstoppable Flow',
    description: '14 day flow streak',
    emoji: '👑',
    category: 'flow' as BadgeCategory,
    rarity: 'legendary' as BadgeRarity,
    criteria: {
      type: 'flow_streak',
      threshold: 14,
    },
  },
  
  // Special badges
  {
    id: FLOW_BADGE_IDS.FLOW_UNBROKEN,
    name: 'Unbroken Flow',
    description: 'Entire session in flow without a single break',
    emoji: '💫',
    category: 'flow' as BadgeCategory,
    rarity: 'rare' as BadgeRarity,
    criteria: {
      type: 'flow_unbroken_session',
      threshold: 30 * 60 * 1000, // Min 30 min session
    },
  },
  {
    id: FLOW_BADGE_IDS.FLOW_COMEBACK,
    name: 'Flow Comeback',
    description: 'Rebuilt flow 3 times in a single session',
    emoji: '💪',
    category: 'flow' as BadgeCategory,
    rarity: 'uncommon' as BadgeRarity,
    criteria: {
      type: 'flow_rebuilds',
      threshold: 3,
    },
  },
];

// Export helper to get badge by ID
export function getFlowBadge(id: string): BadgeDefinition | undefined {
  return FLOW_BADGES.find(b => b.id === id);
}
```

Step 2: Create badge evaluation function

Add to file: src/lib/badges/flowBadges.ts

```typescript
import { FlowSessionSummary } from '@/lib/flow/types';

export interface FlowBadgeEvaluation {
  newBadges: string[];        // Badge IDs earned this session
  progressUpdates: {          // Progress toward badges
    badgeId: string;
    current: number;
    target: number;
  }[];
}

export interface FlowStats {
  cumulativeDeepFlowMs: number;
  hasEverAchievedDeepFlow: boolean;
  currentStreak: number;
  earnedBadgeIds: string[];
}

export function evaluateFlowBadges(
  summary: FlowSessionSummary,
  stats: FlowStats
): FlowBadgeEvaluation {
  const newBadges: string[] = [];
  const progressUpdates: FlowBadgeEvaluation['progressUpdates'] = [];
  
  const alreadyEarned = new Set(stats.earnedBadgeIds);
  
  // First flow badge
  if (
    summary.achievedDeepFlow &&
    !stats.hasEverAchievedDeepFlow &&
    !alreadyEarned.has(FLOW_BADGE_IDS.FIRST_FLOW)
  ) {
    newBadges.push(FLOW_BADGE_IDS.FIRST_FLOW);
  }
  
  // Single session deep flow badges
  const sessionDeepMs = summary.deepFlowTimeMs;
  const sessionDeepBadges = [
    { id: FLOW_BADGE_IDS.FLOW_DIVER, threshold: 10 * 60 * 1000 },
    { id: FLOW_BADGE_IDS.DEEP_DIVER, threshold: 30 * 60 * 1000 },
    { id: FLOW_BADGE_IDS.FLOW_MASTER, threshold: 45 * 60 * 1000 },
    { id: FLOW_BADGE_IDS.FLOW_MARATHON, threshold: 60 * 60 * 1000 },
  ];
  
  for (const badge of sessionDeepBadges) {
    if (sessionDeepMs >= badge.threshold && !alreadyEarned.has(badge.id)) {
      newBadges.push(badge.id);
    } else if (sessionDeepMs < badge.threshold) {
      progressUpdates.push({
        badgeId: badge.id,
        current: sessionDeepMs,
        target: badge.threshold,
      });
    }
  }
  
  // Cumulative deep flow badges
  const newCumulativeMs = stats.cumulativeDeepFlowMs + summary.deepFlowTimeMs;
  const cumulativeBadges = [
    { id: FLOW_BADGE_IDS.HOUR_OF_FLOW, threshold: 1 * 60 * 60 * 1000 },
    { id: FLOW_BADGE_IDS.FLOW_APPRENTICE, threshold: 5 * 60 * 60 * 1000 },
    { id: FLOW_BADGE_IDS.FLOW_JOURNEYMAN, threshold: 10 * 60 * 60 * 1000 },
    { id: FLOW_BADGE_IDS.FLOW_EXPERT, threshold: 25 * 60 * 60 * 1000 },
    { id: FLOW_BADGE_IDS.FLOW_LEGEND, threshold: 50 * 60 * 60 * 1000 },
  ];
  
  for (const badge of cumulativeBadges) {
    const wasBelow = stats.cumulativeDeepFlowMs < badge.threshold;
    const isNowAbove = newCumulativeMs >= badge.threshold;
    
    if (wasBelow && isNowAbove && !alreadyEarned.has(badge.id)) {
      newBadges.push(badge.id);
    } else if (!isNowAbove) {
      progressUpdates.push({
        badgeId: badge.id,
        current: newCumulativeMs,
        target: badge.threshold,
      });
    }
  }
  
  // Streak badges
  const newStreak = summary.achievedDeepFlow ? stats.currentStreak + 1 : 0;
  const streakBadges = [
    { id: FLOW_BADGE_IDS.FLOW_STREAK_3, threshold: 3 },
    { id: FLOW_BADGE_IDS.FLOW_STREAK_7, threshold: 7 },
    { id: FLOW_BADGE_IDS.FLOW_STREAK_14, threshold: 14 },
  ];
  
  for (const badge of streakBadges) {
    if (newStreak >= badge.threshold && !alreadyEarned.has(badge.id)) {
      newBadges.push(badge.id);
    }
  }
  
  // Unbroken flow badge (entire session in flow)
  if (
    summary.flowBreaks === 0 &&
    summary.totalFlowTimeMs >= summary.sessionDurationMs * 0.9 && // 90%+ in flow
    summary.sessionDurationMs >= 30 * 60 * 1000 &&
    !alreadyEarned.has(FLOW_BADGE_IDS.FLOW_UNBROKEN)
  ) {
    newBadges.push(FLOW_BADGE_IDS.FLOW_UNBROKEN);
  }
  
  // Comeback badge (rebuilt flow 3+ times)
  const flowRebuilds = summary.periods.filter(p => p.level !== 'none').length - 1;
  if (flowRebuilds >= 3 && !alreadyEarned.has(FLOW_BADGE_IDS.FLOW_COMEBACK)) {
    newBadges.push(FLOW_BADGE_IDS.FLOW_COMEBACK);
  }
  
  return { newBadges, progressUpdates };
}
```

Step 3: Update badges index to include flow badges

Update file: src/lib/badges/index.ts

```typescript
// Add to imports
import { FLOW_BADGES, getFlowBadge, evaluateFlowBadges } from './flowBadges';

// Add to ALL_BADGES array
export const ALL_BADGES = [
  ...existingBadges,
  ...FLOW_BADGES,
];

// Export flow badge utilities
export { FLOW_BADGES, getFlowBadge, evaluateFlowBadges };
export { FLOW_BADGE_IDS } from './flowBadges';
```

Step 4: Update useFlow hook to evaluate badges on session end

Update file: src/hooks/useFlow.ts

Add badge evaluation:

```typescript
// Add import
import { evaluateFlowBadges, FlowStats } from '@/lib/badges/flowBadges';

// Add to UseFlowConfig:
flowStats?: FlowStats;
onBadgesEarned?: (badgeIds: string[]) => void;

// Add to session end handler (when stop_flow_tracking is called):
const handleSessionEnd = useCallback(async () => {
  const summary = await invoke<FlowSessionSummary>('stop_flow_tracking');
  
  // Evaluate badges if stats provided
  if (flowStats) {
    const evaluation = evaluateFlowBadges(summary, flowStats);
    
    if (evaluation.newBadges.length > 0) {
      onBadgesEarned?.(evaluation.newBadges);
      
      // Award badges via Tauri command
      for (const badgeId of evaluation.newBadges) {
        await invoke('award_badge', { badgeId });
      }
    }
  }
  
  return summary;
}, [flowStats, onBadgesEarned]);
```

After making these changes:
1. Run `npm run build` to verify no TypeScript errors
2. Verify flow badges appear in badge list
3. Test badge awards during flow sessions
```

---

## Verification

After completing this task:

```bash
npm run build
```

Expected: No TypeScript errors.

Manual testing scenario:

1. Clear any existing flow badges (for testing)
2. Start a 45-minute session
3. Achieve deep flow (20+ min focused)
4. At deep flow achievement:
   - [ ] "First Flow 🌊" badge awarded (if first time)
5. Continue in deep flow for 10+ minutes:
   - [ ] "Flow Diver 🏊" badge awarded
6. Continue for 30+ minutes deep flow:
   - [ ] "Deep Diver 🤿" badge awarded
7. Complete session
8. Check badges list:
   - [ ] All awarded badges appear
   - [ ] Badges show correct emoji and description
   - [ ] Progress toward unearned badges visible (if implemented)

Cumulative badge testing:

1. Complete multiple sessions with deep flow
2. Track cumulative deep flow time
3. At 1 hour total:
   - [ ] "Hour of Flow ⏰" badge awarded
4. Check that cumulative progress persists across sessions
