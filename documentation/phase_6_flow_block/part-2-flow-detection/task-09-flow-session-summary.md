# Task: Implement Post-Session Flow Summary

## Phase: 6
## Part: 2 (Flow Detection)
## Task: 09
## Depends On: task-08-flow-protection
## Estimated Time: 2 hours

---

## Context Files

- `src/lib/flow/types.ts` (update)
- `src/hooks/useFlow.ts` (update)
- `src/components/flow/FlowSummary.tsx` (create)
- `src/components/flow/FlowTimeline.tsx` (create)
- `src/components/session/SessionComplete.tsx` (update)

---

## Success Criteria

- [ ] Flow summary calculates total flow time, deep flow time, and flow breaks
- [ ] Flow timeline visualizes flow states across session duration
- [ ] Timeline shows distinct colors for none/building/established/deep
- [ ] Flow summary integrates into session complete screen
- [ ] Summary shows max flow level reached
- [ ] Summary shows longest unbroken flow period
- [ ] Summary includes flow streak info if applicable
- [ ] Empty state handles sessions with no flow (< 30 min or no focus)

---

## Test Cases

- 45 min session with deep flow achieved → expect timeline shows progression, deep flow time displayed
- 45 min session with flow broken twice → expect timeline shows breaks, "2 flow breaks" displayed
- 30 min session, never achieved flow → expect "No flow achieved" message, empty timeline
- 25 min session (< 30 min) → expect "Session too short for flow tracking" message
- Session with 15 min deep flow out of 45 min → expect "15 min in deep flow" and 33% calculation
- Flow streak active → expect "🔥 Flow streak: X days" displayed

---

## Implementation Prompt

```
Implement post-session flow summary with visual timeline.

Step 1: Add summary types

Update file: src/lib/flow/types.ts

Add at the end:

```typescript
// Flow period for timeline visualization
export interface FlowPeriodRecord {
  id: string;
  startMs: number;        // Ms from session start
  endMs: number;          // Ms from session start
  level: FlowLevel;
  wasInterrupted: boolean;
  interruptedByApp: string | null;
}

// Complete flow summary for a session
export interface FlowSessionSummary {
  sessionId: string;
  sessionDurationMs: number;
  
  // Time metrics
  totalFlowTimeMs: number;        // Time in any flow state
  buildingTimeMs: number;
  establishedTimeMs: number;
  deepFlowTimeMs: number;
  
  // Achievement metrics
  maxLevelReached: FlowLevel;
  achievedDeepFlow: boolean;
  longestFlowPeriodMs: number;
  flowBreaks: number;
  
  // Timeline data
  periods: FlowPeriodRecord[];
  
  // Streak info (if applicable)
  flowStreakDays: number;
  newStreakMilestone: string | null;  // e.g., "flow_master"
}

// Helper to create empty summary
export function createEmptyFlowSummary(sessionId: string, durationMs: number): FlowSessionSummary {
  return {
    sessionId,
    sessionDurationMs: durationMs,
    totalFlowTimeMs: 0,
    buildingTimeMs: 0,
    establishedTimeMs: 0,
    deepFlowTimeMs: 0,
    maxLevelReached: 'none',
    achievedDeepFlow: false,
    longestFlowPeriodMs: 0,
    flowBreaks: 0,
    periods: [],
    flowStreakDays: 0,
    newStreakMilestone: null,
  };
}
```

Step 2: Create flow timeline component

Create file: src/components/flow/FlowTimeline.tsx

```typescript
import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { FlowLevel, FlowPeriodRecord } from '@/lib/flow/types';

interface FlowTimelineProps {
  periods: FlowPeriodRecord[];
  sessionDurationMs: number;
  className?: string;
}

const levelColors: Record<FlowLevel, string> = {
  none: 'bg-gray-700',
  building: 'bg-blue-500',
  established: 'bg-gradient-to-r from-yellow-500 to-orange-500',
  deep: 'bg-gradient-to-r from-orange-500 to-red-500',
};

const levelLabels: Record<FlowLevel, string> = {
  none: 'No flow',
  building: 'Building',
  established: 'Established',
  deep: 'Deep',
};

export const FlowTimeline: React.FC<FlowTimelineProps> = ({
  periods,
  sessionDurationMs,
  className,
}) => {
  // Generate timeline segments
  const segments = useMemo(() => {
    if (periods.length === 0 || sessionDurationMs === 0) {
      return [{ level: 'none' as FlowLevel, widthPercent: 100 }];
    }

    const result: { level: FlowLevel; widthPercent: number; startPercent: number }[] = [];
    
    // Sort periods by start time
    const sortedPeriods = [...periods].sort((a, b) => a.startMs - b.startMs);
    
    let currentMs = 0;
    
    for (const period of sortedPeriods) {
      // Gap before this period (no flow)
      if (period.startMs > currentMs) {
        result.push({
          level: 'none',
          startPercent: (currentMs / sessionDurationMs) * 100,
          widthPercent: ((period.startMs - currentMs) / sessionDurationMs) * 100,
        });
      }
      
      // This period
      result.push({
        level: period.level,
        startPercent: (period.startMs / sessionDurationMs) * 100,
        widthPercent: ((period.endMs - period.startMs) / sessionDurationMs) * 100,
      });
      
      currentMs = period.endMs;
    }
    
    // Gap after last period
    if (currentMs < sessionDurationMs) {
      result.push({
        level: 'none',
        startPercent: (currentMs / sessionDurationMs) * 100,
        widthPercent: ((sessionDurationMs - currentMs) / sessionDurationMs) * 100,
      });
    }
    
    return result;
  }, [periods, sessionDurationMs]);

  // Time markers
  const markers = useMemo(() => {
    const durationMin = Math.floor(sessionDurationMs / 60000);
    const markerCount = Math.min(5, Math.ceil(durationMin / 15));
    const interval = Math.ceil(durationMin / markerCount);
    
    return Array.from({ length: markerCount + 1 }, (_, i) => {
      const min = i * interval;
      return {
        position: (min / durationMin) * 100,
        label: `${min}m`,
      };
    });
  }, [sessionDurationMs]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Timeline bar */}
      <div className="relative h-8 bg-gray-800 rounded-lg overflow-hidden">
        {segments.map((segment, i) => (
          <div
            key={i}
            className={cn(
              'absolute top-0 h-full',
              levelColors[segment.level]
            )}
            style={{
              left: `${segment.startPercent}%`,
              width: `${segment.widthPercent}%`,
            }}
          />
        ))}
      </div>

      {/* Time markers */}
      <div className="relative h-4">
        {markers.map((marker, i) => (
          <span
            key={i}
            className="absolute text-xs text-gray-500 transform -translate-x-1/2"
            style={{ left: `${marker.position}%` }}
          >
            {marker.label}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center text-sm">
        {(['none', 'building', 'established', 'deep'] as FlowLevel[]).map(level => (
          <div key={level} className="flex items-center gap-2">
            <div className={cn('w-4 h-4 rounded', levelColors[level])} />
            <span className="text-gray-400">{levelLabels[level]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

Step 3: Create flow summary component

Create file: src/components/flow/FlowSummary.tsx

```typescript
import React from 'react';
import { cn } from '@/lib/utils';
import { FlowSessionSummary, FlowLevel } from '@/lib/flow/types';
import { FlowTimeline } from './FlowTimeline';

interface FlowSummaryProps {
  summary: FlowSessionSummary;
  className?: string;
}

const levelEmoji: Record<FlowLevel, string> = {
  none: '😶',
  building: '✨',
  established: '🌊',
  deep: '🔥',
};

const levelNames: Record<FlowLevel, string> = {
  none: 'No flow',
  building: 'Flow building',
  established: 'Established flow',
  deep: 'Deep flow',
};

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export const FlowSummary: React.FC<FlowSummaryProps> = ({
  summary,
  className,
}) => {
  const {
    sessionDurationMs,
    totalFlowTimeMs,
    deepFlowTimeMs,
    maxLevelReached,
    achievedDeepFlow,
    longestFlowPeriodMs,
    flowBreaks,
    periods,
    flowStreakDays,
    newStreakMilestone,
  } = summary;

  // Session too short for flow tracking
  if (sessionDurationMs < 30 * 60 * 1000) {
    return (
      <div className={cn('p-6 rounded-xl bg-gray-800/50', className)}>
        <div className="text-center">
          <span className="text-4xl mb-4 block">⏱️</span>
          <h3 className="text-lg font-semibold text-gray-300 mb-2">
            Session too short for flow tracking
          </h3>
          <p className="text-gray-500 text-sm">
            Flow is tracked in sessions of 30 minutes or longer.
          </p>
        </div>
      </div>
    );
  }

  // No flow achieved
  if (maxLevelReached === 'none') {
    return (
      <div className={cn('p-6 rounded-xl bg-gray-800/50', className)}>
        <div className="text-center">
          <span className="text-4xl mb-4 block">🎯</span>
          <h3 className="text-lg font-semibold text-gray-300 mb-2">
            No flow achieved this session
          </h3>
          <p className="text-gray-500 text-sm">
            Try to maintain focus on whitelisted apps for 5+ minutes to enter flow.
          </p>
        </div>
      </div>
    );
  }

  const flowPercentage = Math.round((totalFlowTimeMs / sessionDurationMs) * 100);
  const deepFlowPercentage = Math.round((deepFlowTimeMs / sessionDurationMs) * 100);

  return (
    <div className={cn('p-6 rounded-xl bg-gray-800/50', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Flow Summary</h3>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{levelEmoji[maxLevelReached]}</span>
          <span className="text-gray-300">
            Max: {levelNames[maxLevelReached]}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-6">
        <FlowTimeline
          periods={periods}
          sessionDurationMs={sessionDurationMs}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total Flow Time */}
        <div className="text-center p-3 rounded-lg bg-gray-700/50">
          <div className="text-2xl font-bold text-blue-400">
            {formatDuration(totalFlowTimeMs)}
          </div>
          <div className="text-xs text-gray-400">Total flow time</div>
          <div className="text-xs text-gray-500">{flowPercentage}% of session</div>
        </div>

        {/* Deep Flow Time */}
        {achievedDeepFlow && (
          <div className="text-center p-3 rounded-lg bg-gray-700/50">
            <div className="text-2xl font-bold text-red-400">
              {formatDuration(deepFlowTimeMs)}
            </div>
            <div className="text-xs text-gray-400">Deep flow</div>
            <div className="text-xs text-gray-500">{deepFlowPercentage}% of session</div>
          </div>
        )}

        {/* Longest Period */}
        <div className="text-center p-3 rounded-lg bg-gray-700/50">
          <div className="text-2xl font-bold text-orange-400">
            {formatDuration(longestFlowPeriodMs)}
          </div>
          <div className="text-xs text-gray-400">Longest flow</div>
        </div>

        {/* Flow Breaks */}
        <div className="text-center p-3 rounded-lg bg-gray-700/50">
          <div className="text-2xl font-bold text-gray-300">
            {flowBreaks}
          </div>
          <div className="text-xs text-gray-400">
            Flow break{flowBreaks !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Streak Info */}
      {flowStreakDays > 0 && (
        <div className={cn(
          'p-4 rounded-lg text-center',
          'bg-gradient-to-r from-orange-500/20 to-red-500/20',
          'border border-orange-500/30'
        )}>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">🔥</span>
            <span className="text-lg font-semibold text-orange-400">
              Flow streak: {flowStreakDays} day{flowStreakDays !== 1 ? 's' : ''}
            </span>
          </div>
          {newStreakMilestone && (
            <div className="mt-2 text-sm text-yellow-400">
              🏆 New milestone: {newStreakMilestone.replace('_', ' ')}!
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

Step 4: Update exports

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
```

Step 5: Integrate with session complete screen

Update file: src/components/session/SessionComplete.tsx

Add flow summary section:

```typescript
// Add import
import { FlowSummary } from '@/components/flow';
import { FlowSessionSummary } from '@/lib/flow/types';

// Add prop to SessionCompleteProps:
interface SessionCompleteProps {
  // ... existing props
  flowSummary?: FlowSessionSummary;
}

// Add to the component JSX, after existing stats and before action buttons:
{flowSummary && (
  <div className="mt-6">
    <FlowSummary summary={flowSummary} />
  </div>
)}
```

After making these changes:
1. Run `npm run build` to verify no TypeScript errors
2. Test flow summary display in session complete screen
```

---

## Verification

After completing this task:

```bash
npm run build
```

Expected: No TypeScript errors.

Manual testing scenario 1 - Full flow session:

1. Start a 45-minute session
2. Stay focused in whitelisted apps throughout
3. Achieve deep flow (20+ min)
4. Complete or end session
5. On session complete screen:
   - [ ] Flow Summary section appears
   - [ ] Timeline shows progression (gray → blue → orange → red)
   - [ ] "Max: Deep flow 🔥" displayed
   - [ ] Total flow time shown with percentage
   - [ ] Deep flow time shown with percentage
   - [ ] Longest flow period shown
   - [ ] Flow breaks count shown (should be 0)

Manual testing scenario 2 - Interrupted session:

1. Start a 45-minute session
2. Achieve building flow (5+ min)
3. Switch to blocked app, let flow break
4. Return and rebuild flow
5. Complete session
6. On session complete screen:
   - [ ] Timeline shows gaps (gray sections)
   - [ ] Flow breaks count > 0
   - [ ] Max level reflects highest achieved

Manual testing scenario 3 - Short session:

1. Start a 20-minute session
2. Complete session
3. On session complete screen:
   - [ ] "Session too short for flow tracking" message
   - [ ] No timeline displayed

Manual testing scenario 4 - No flow:

1. Start a 45-minute session
2. Frequently switch between blocked and whitelisted apps
3. Never achieve 5 min continuous focus
4. Complete session
5. On session complete screen:
   - [ ] "No flow achieved this session" message
   - [ ] Helpful tip about maintaining focus
