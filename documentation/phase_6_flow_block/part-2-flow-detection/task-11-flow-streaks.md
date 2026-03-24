# Task: Implement Flow Streaks

## Phase: 6
## Part: 2 (Flow Detection)
## Task: 11
## Depends On: task-10-flow-badges
## Estimated Time: 1.5 hours

---

## Context Files

- `src/lib/flow/types.ts` (update)
- `src/lib/flow/streaks.ts` (create)
- `src-tauri/src/flow/streaks.rs` (create)
- `src-tauri/src/flow/mod.rs` (update)
- `src/hooks/useFlowStreak.ts` (create)
- `src/components/flow/FlowStreakDisplay.tsx` (create)

---

## Success Criteria

- [ ] Flow streak tracks consecutive weekdays with deep flow achieved
- [ ] Weekends (Sat-Sun) don't break streak, don't extend it
- [ ] Streak persists across app restarts (stored in SQLite)
- [ ] Streak resets if weekday passes without deep flow
- [ ] Streak milestones trigger celebrations
- [ ] UI displays current streak and longest streak
- [ ] Streak info included in flow summary

---

## Test Cases

- Monday deep flow → expect streak = 1
- Tuesday deep flow (after Monday) → expect streak = 2
- Wednesday no session → expect streak = 0 (broken)
- Friday deep flow → Saturday no session → Sunday no session → Monday deep flow → expect streak = 2 (weekend ignored)
- Friday deep flow → Saturday deep flow → expect streak = 1 (weekend counts but doesn't extend)
- Friday deep flow → Saturday no session → expect streak = 1 (weekend doesn't break)
- Reach 3 day streak → expect milestone celebration
- Reach 7 day streak → expect milestone celebration + badge

---

## Implementation Prompt

```
Implement flow streak tracking with weekend handling.

Step 1: Add streak types

Update file: src/lib/flow/types.ts

Add at the end:

```typescript
// Flow streak data
export interface FlowStreak {
  currentStreak: number;
  longestStreak: number;
  lastDeepFlowDate: string | null;  // YYYY-MM-DD
  streakStartDate: string | null;    // YYYY-MM-DD
}

export const EMPTY_FLOW_STREAK: FlowStreak = {
  currentStreak: 0,
  longestStreak: 0,
  lastDeepFlowDate: null,
  streakStartDate: null,
};

// Streak milestone definitions
export interface StreakMilestone {
  days: number;
  name: string;
  emoji: string;
  badgeId: string | null;
}

export const FLOW_STREAK_MILESTONES: StreakMilestone[] = [
  { days: 2, name: 'Flow Spark', emoji: '⚡', badgeId: null },
  { days: 3, name: 'Flow Streak', emoji: '🔥', badgeId: 'flow_streak_3' },
  { days: 5, name: 'Flow Master', emoji: '🏆', badgeId: null },
  { days: 7, name: 'Flow Legend', emoji: '💎', badgeId: 'flow_streak_7' },
  { days: 14, name: 'Unstoppable', emoji: '👑', badgeId: 'flow_streak_14' },
];
```

Step 2: Create streak logic utilities

Create file: src/lib/flow/streaks.ts

```typescript
import { FlowStreak, FLOW_STREAK_MILESTONES, StreakMilestone } from './types';

// Check if a date is a weekend (Saturday or Sunday)
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

// Get date string in YYYY-MM-DD format
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Parse date from YYYY-MM-DD format
export function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

// Count weekdays between two dates (exclusive of end date)
export function countWeekdaysBetween(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  current.setDate(current.getDate() + 1); // Start from day after
  
  while (current < endDate) {
    if (!isWeekend(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

// Get the last weekday before a given date
export function getLastWeekday(date: Date): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - 1);
  
  while (isWeekend(result)) {
    result.setDate(result.getDate() - 1);
  }
  
  return result;
}

// Calculate updated streak after a session
export interface StreakUpdateResult {
  newStreak: FlowStreak;
  isNewMilestone: boolean;
  milestone: StreakMilestone | null;
  streakBroken: boolean;
}

export function calculateStreakUpdate(
  currentStreak: FlowStreak,
  achievedDeepFlow: boolean,
  sessionDate: Date = new Date()
): StreakUpdateResult {
  const today = formatDate(sessionDate);
  const todayIsWeekend = isWeekend(sessionDate);
  
  let newStreak = { ...currentStreak };
  let streakBroken = false;
  let isNewMilestone = false;
  let milestone: StreakMilestone | null = null;
  
  // If no deep flow achieved
  if (!achievedDeepFlow) {
    // Weekend: don't break streak
    if (todayIsWeekend) {
      return { newStreak, isNewMilestone: false, milestone: null, streakBroken: false };
    }
    
    // Weekday without deep flow: streak broken
    newStreak.currentStreak = 0;
    newStreak.streakStartDate = null;
    return { newStreak, isNewMilestone: false, milestone: null, streakBroken: true };
  }
  
  // Deep flow achieved
  const lastFlowDate = currentStreak.lastDeepFlowDate;
  
  if (!lastFlowDate) {
    // First ever deep flow
    if (!todayIsWeekend) {
      newStreak.currentStreak = 1;
      newStreak.streakStartDate = today;
    }
  } else {
    const lastDate = parseDate(lastFlowDate);
    
    // Same day - no change to streak count
    if (formatDate(lastDate) === today) {
      return { newStreak, isNewMilestone: false, milestone: null, streakBroken: false };
    }
    
    // Check if streak continues
    if (todayIsWeekend) {
      // Weekend session: counts toward flow but doesn't extend streak
      // Just update last flow date
    } else {
      // Weekday session
      const lastWeekday = getLastWeekday(sessionDate);
      const weekdaysMissed = countWeekdaysBetween(lastDate, sessionDate);
      
      if (weekdaysMissed === 0 || formatDate(lastWeekday) === formatDate(lastDate)) {
        // Consecutive weekday or last flow was on the previous weekday
        newStreak.currentStreak = currentStreak.currentStreak + 1;
        
        if (!newStreak.streakStartDate) {
          newStreak.streakStartDate = today;
        }
      } else {
        // Missed weekday(s) - streak broken
        streakBroken = currentStreak.currentStreak > 0;
        newStreak.currentStreak = 1;
        newStreak.streakStartDate = today;
      }
    }
  }
  
  // Update last flow date
  newStreak.lastDeepFlowDate = today;
  
  // Update longest streak
  if (newStreak.currentStreak > newStreak.longestStreak) {
    newStreak.longestStreak = newStreak.currentStreak;
  }
  
  // Check for milestone
  const previousStreak = currentStreak.currentStreak;
  for (const m of FLOW_STREAK_MILESTONES) {
    if (newStreak.currentStreak >= m.days && previousStreak < m.days) {
      isNewMilestone = true;
      milestone = m;
      break; // Only report the first new milestone
    }
  }
  
  return { newStreak, isNewMilestone, milestone, streakBroken };
}

// Get current milestone for a streak count
export function getCurrentMilestone(streakDays: number): StreakMilestone | null {
  let result: StreakMilestone | null = null;
  
  for (const m of FLOW_STREAK_MILESTONES) {
    if (streakDays >= m.days) {
      result = m;
    } else {
      break;
    }
  }
  
  return result;
}

// Get next milestone for a streak count
export function getNextMilestone(streakDays: number): StreakMilestone | null {
  for (const m of FLOW_STREAK_MILESTONES) {
    if (streakDays < m.days) {
      return m;
    }
  }
  return null;
}
```

Step 3: Create Rust backend for streak persistence

Create file: src-tauri/src/flow/streaks.rs

```rust
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::storage::Storage;
use anyhow::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlowStreak {
    pub current_streak: i32,
    pub longest_streak: i32,
    pub last_deep_flow_date: Option<String>,
    pub streak_start_date: Option<String>,
}

impl Default for FlowStreak {
    fn default() -> Self {
        Self {
            current_streak: 0,
            longest_streak: 0,
            last_deep_flow_date: None,
            streak_start_date: None,
        }
    }
}

const STREAK_KEY: &str = "flow_streak";

#[tauri::command]
pub async fn get_flow_streak(storage: State<'_, Storage>) -> Result<FlowStreak, String> {
    storage
        .get::<FlowStreak>(STREAK_KEY)
        .map_err(|e| e.to_string())
        .map(|opt| opt.unwrap_or_default())
}

#[tauri::command]
pub async fn update_flow_streak(
    storage: State<'_, Storage>,
    streak: FlowStreak,
) -> Result<(), String> {
    storage
        .set(STREAK_KEY, &streak)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn reset_flow_streak(storage: State<'_, Storage>) -> Result<(), String> {
    storage
        .set(STREAK_KEY, &FlowStreak::default())
        .map_err(|e| e.to_string())
}
```

Step 4: Create useFlowStreak hook

Create file: src/hooks/useFlowStreak.ts

```typescript
import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FlowStreak, EMPTY_FLOW_STREAK, StreakMilestone } from '@/lib/flow/types';
import { calculateStreakUpdate, getCurrentMilestone, getNextMilestone } from '@/lib/flow/streaks';

interface UseFlowStreakReturn {
  streak: FlowStreak;
  currentMilestone: StreakMilestone | null;
  nextMilestone: StreakMilestone | null;
  daysToNextMilestone: number;
  isLoading: boolean;
  error: string | null;
  
  // Methods
  recordDeepFlow: (achievedDeepFlow: boolean) => Promise<{
    isNewMilestone: boolean;
    milestone: StreakMilestone | null;
    streakBroken: boolean;
  }>;
  refresh: () => Promise<void>;
}

export function useFlowStreak(): UseFlowStreakReturn {
  const [streak, setStreak] = useState<FlowStreak>(EMPTY_FLOW_STREAK);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load streak on mount
  useEffect(() => {
    loadStreak();
  }, []);
  
  const loadStreak = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await invoke<FlowStreak>('get_flow_streak');
      setStreak(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load streak');
      setStreak(EMPTY_FLOW_STREAK);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const recordDeepFlow = useCallback(async (achievedDeepFlow: boolean) => {
    const result = calculateStreakUpdate(streak, achievedDeepFlow);
    
    try {
      await invoke('update_flow_streak', { streak: result.newStreak });
      setStreak(result.newStreak);
    } catch (err) {
      console.error('[useFlowStreak] Failed to save streak:', err);
    }
    
    return {
      isNewMilestone: result.isNewMilestone,
      milestone: result.milestone,
      streakBroken: result.streakBroken,
    };
  }, [streak]);
  
  const currentMilestone = getCurrentMilestone(streak.currentStreak);
  const nextMilestone = getNextMilestone(streak.currentStreak);
  const daysToNextMilestone = nextMilestone 
    ? nextMilestone.days - streak.currentStreak 
    : 0;
  
  return {
    streak,
    currentMilestone,
    nextMilestone,
    daysToNextMilestone,
    isLoading,
    error,
    recordDeepFlow,
    refresh: loadStreak,
  };
}
```

Step 5: Create streak display component

Create file: src/components/flow/FlowStreakDisplay.tsx

```typescript
import React from 'react';
import { cn } from '@/lib/utils';
import { FlowStreak, StreakMilestone } from '@/lib/flow/types';

interface FlowStreakDisplayProps {
  streak: FlowStreak;
  currentMilestone: StreakMilestone | null;
  nextMilestone: StreakMilestone | null;
  daysToNextMilestone: number;
  variant?: 'compact' | 'full';
  className?: string;
}

export const FlowStreakDisplay: React.FC<FlowStreakDisplayProps> = ({
  streak,
  currentMilestone,
  nextMilestone,
  daysToNextMilestone,
  variant = 'compact',
  className,
}) => {
  if (streak.currentStreak === 0) {
    return (
      <div className={cn('text-gray-500 text-sm', className)}>
        No active flow streak
      </div>
    );
  }
  
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className="text-xl">
          {currentMilestone?.emoji || '🔥'}
        </span>
        <span className="text-orange-400 font-semibold">
          {streak.currentStreak} day{streak.currentStreak !== 1 ? 's' : ''}
        </span>
      </div>
    );
  }
  
  // Full variant
  return (
    <div className={cn(
      'p-4 rounded-xl',
      'bg-gradient-to-r from-orange-500/10 to-red-500/10',
      'border border-orange-500/30',
      className
    )}>
      {/* Current streak */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">
            {currentMilestone?.emoji || '🔥'}
          </span>
          <div>
            <div className="text-xl font-bold text-white">
              {streak.currentStreak} day flow streak
            </div>
            {currentMilestone && (
              <div className="text-sm text-orange-400">
                {currentMilestone.name}
              </div>
            )}
          </div>
        </div>
        
        {/* Longest streak */}
        {streak.longestStreak > streak.currentStreak && (
          <div className="text-right text-sm">
            <div className="text-gray-400">Best</div>
            <div className="text-gray-300 font-medium">
              {streak.longestStreak} days
            </div>
          </div>
        )}
      </div>
      
      {/* Progress to next milestone */}
      {nextMilestone && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-400">
              Next: {nextMilestone.name} {nextMilestone.emoji}
            </span>
            <span className="text-gray-500">
              {daysToNextMilestone} more day{daysToNextMilestone !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all"
              style={{ 
                width: `${(streak.currentStreak / nextMilestone.days) * 100}%` 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
```

Step 6: Update flow component exports

Update file: src/components/flow/index.ts

```typescript
export { FlowIndicator, FlowIndicatorCompact } from './FlowIndicator';
export { GraceWarning, GraceWarningInline } from './GraceWarning';
export { FlowStatus } from './FlowStatus';
export { FlowCelebration, FlowCelebrationToast } from './FlowCelebration';
export { FlowProtectionModal } from './FlowProtectionModal';
export { FlowWarning } from './FlowWarning';
export { FlowTimeline } from './FlowTimeline';
export { FlowSummary } from './FlowSummary';
export { FlowStreakDisplay } from './FlowStreakDisplay';
```

After making these changes:
1. Run `npm run build` to verify no TypeScript errors
2. Test streak tracking across multiple sessions
```

---

## Verification

After completing this task:

```bash
npm run build
```

Expected: No TypeScript errors.

Manual testing - Basic streak:

1. Reset flow streak data (for testing)
2. On a weekday, complete a session with deep flow
3. Check streak display:
   - [ ] Shows "1 day flow streak"
   - [ ] Progress toward next milestone visible
4. Next weekday, complete another session with deep flow
5. Check streak:
   - [ ] Shows "2 days"
   - [ ] At 2 days: "Flow Spark ⚡" milestone reached
6. Continue to 3 days:
   - [ ] "Flow Streak 🔥" milestone
   - [ ] Badge awarded (if task-10 complete)

Manual testing - Weekend handling:

1. Achieve deep flow on Friday (streak = N)
2. Saturday: No session
3. Check streak:
   - [ ] Still shows N (not broken)
4. Sunday: Complete session with deep flow
5. Check streak:
   - [ ] Still shows N (weekend doesn't extend)
6. Monday: Complete session with deep flow
7. Check streak:
   - [ ] Shows N+1 (streak continues from Friday)

Manual testing - Streak break:

1. Achieve 3-day streak (Mon-Wed)
2. Thursday: No session with deep flow
3. Check Friday:
   - [ ] Streak reset to 0
   - [ ] "No active flow streak" message
4. Friday: Complete session with deep flow
5. Check streak:
   - [ ] Shows "1 day" (new streak started)
