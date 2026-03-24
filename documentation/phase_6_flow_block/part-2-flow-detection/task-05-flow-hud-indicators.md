# Task: Implement Flow HUD Indicators

## Phase: 6
## Part: 2 (Flow Detection)
## Task: 05
## Depends On: task-04-flow-hook
## Estimated Time: 1.5 hours

---

## Context Files

- `src/components/flow/FlowIndicator.tsx` (create)
- `src/components/flow/GraceWarning.tsx` (create)
- `src/components/flow/index.ts` (create)

---

## Success Criteria

- [ ] `FlowIndicator` component displays current flow level
- [ ] Indicator shows emoji and label for each level
- [ ] Indicator shows uninterrupted time
- [ ] Different visual styles for each level (none, building, established, deep)
- [ ] Subtle animation for building state (pulse)
- [ ] Glow effect for established and deep states
- [ ] `GraceWarning` component shows countdown when grace active
- [ ] Grace warning includes progress bar
- [ ] Components are accessible (aria labels)
- [ ] Hidden when session < 30 min or level is 'none'

---

## Test Cases

- Render FlowIndicator with level 'none' → expect hidden or minimal display
- Render FlowIndicator with level 'building' → expect "🌊 Flow building..." with pulse
- Render FlowIndicator with level 'established' → expect "🌊 In flow" with glow
- Render FlowIndicator with level 'deep' → expect "🔥 Deep flow!" with rich glow
- Render FlowIndicator with uninterruptedTime 300000 → expect "5:00" displayed
- Render GraceWarning with remainingMs 60000 → expect "1:00" countdown
- Render GraceWarning with remainingMs 45000 → expect progress bar at 50%

---

## Implementation Prompt

```
Create the Flow HUD indicator components.

Create file: src/components/flow/FlowIndicator.tsx

```typescript
import React from 'react';
import { cn } from '@/lib/utils';
import { FlowLevel, FLOW_LEVEL_INFO } from '@/lib/flow';

interface FlowIndicatorProps {
  level: FlowLevel;
  uninterruptedTimeMs: number;
  isTracking: boolean;
  className?: string;
}

export const FlowIndicator: React.FC<FlowIndicatorProps> = ({
  level,
  uninterruptedTimeMs,
  isTracking,
  className,
}) => {
  // Don't show if not tracking or level is none
  if (!isTracking || level === 'none') {
    return null;
  }

  const levelInfo = FLOW_LEVEL_INFO[level];

  // Format time
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Style variants based on level
  const levelStyles: Record<FlowLevel, string> = {
    none: '',
    building: cn(
      'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
      'animate-pulse'
    ),
    established: cn(
      'bg-cyan-500/20 border-cyan-500/50 text-cyan-300',
      'shadow-[0_0_15px_rgba(34,211,238,0.3)]'
    ),
    deep: cn(
      'bg-gradient-to-r from-orange-500/20 to-red-500/20',
      'border-orange-500/50 text-orange-300',
      'shadow-[0_0_20px_rgba(249,115,22,0.4)]'
    ),
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-lg',
        'border backdrop-blur-sm',
        'transition-all duration-500',
        levelStyles[level],
        className
      )}
      role="status"
      aria-label={`Flow state: ${levelInfo.label}, ${formatTime(uninterruptedTimeMs)} uninterrupted`}
    >
      {/* Emoji */}
      <span className="text-lg">{levelInfo.emoji}</span>

      {/* Label and time */}
      <div className="flex flex-col">
        <span className="text-sm font-medium">{levelInfo.label}</span>
        <span className="text-xs opacity-70">
          {formatTime(uninterruptedTimeMs)} uninterrupted
        </span>
      </div>
    </div>
  );
};

// Compact version for smaller spaces
export const FlowIndicatorCompact: React.FC<FlowIndicatorProps> = ({
  level,
  uninterruptedTimeMs,
  isTracking,
  className,
}) => {
  if (!isTracking || level === 'none') {
    return null;
  }

  const levelInfo = FLOW_LEVEL_INFO[level];

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const dotColor: Record<FlowLevel, string> = {
    none: 'bg-gray-500',
    building: 'bg-cyan-400 animate-pulse',
    established: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]',
    deep: 'bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.6)]',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md',
        'bg-gray-800/50 border border-gray-700/50',
        className
      )}
      role="status"
      aria-label={`${levelInfo.label}, ${formatTime(uninterruptedTimeMs)}`}
    >
      <div className={cn('w-2 h-2 rounded-full', dotColor[level])} />
      <span className="text-xs text-gray-300">{formatTime(uninterruptedTimeMs)}</span>
    </div>
  );
};
```

Create file: src/components/flow/GraceWarning.tsx

```typescript
import React from 'react';
import { cn } from '@/lib/utils';
import { GRACE_PERIOD_DURATION } from '@/lib/flow';

interface GraceWarningProps {
  remainingMs: number;
  triggerApp: string | null;
  className?: string;
}

export const GraceWarning: React.FC<GraceWarningProps> = ({
  remainingMs,
  triggerApp,
  className,
}) => {
  // Format time
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress (0 to 1, where 1 is full time remaining)
  const progress = Math.max(0, remainingMs / GRACE_PERIOD_DURATION);

  // Color changes as time runs out
  const getProgressColor = (): string => {
    if (progress > 0.5) return 'bg-yellow-500';
    if (progress > 0.25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50',
        'max-w-sm p-4 rounded-xl',
        'bg-yellow-500/10 border border-yellow-500/30',
        'backdrop-blur-sm shadow-lg',
        'animate-in slide-in-from-bottom-4 duration-300',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">⚠️</div>
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-200">Flow at risk</h3>
          <p className="text-sm text-yellow-300/80 mt-1">
            Return to focus in{' '}
            <span className="font-mono font-bold">{formatTime(remainingMs)}</span>
            {' '}to maintain your flow
          </p>
          {triggerApp && (
            <p className="text-xs text-yellow-400/60 mt-1">
              Triggered by: {triggerApp}
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000',
            getProgressColor()
          )}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
};

// Inline version for HUD integration
export const GraceWarningInline: React.FC<GraceWarningProps> = ({
  remainingMs,
  triggerApp,
  className,
}) => {
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    return `${totalSeconds}s`;
  };

  const progress = Math.max(0, remainingMs / GRACE_PERIOD_DURATION);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg',
        'bg-yellow-500/20 border border-yellow-500/40',
        className
      )}
      role="alert"
    >
      <span className="text-yellow-400">⚠️</span>
      <span className="text-sm text-yellow-300">
        Flow at risk: {formatTime(remainingMs)}
      </span>
      <div className="w-16 h-1 bg-gray-700/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-500 rounded-full transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
};
```

Create file: src/components/flow/index.ts

```typescript
export { FlowIndicator, FlowIndicatorCompact } from './FlowIndicator';
export { GraceWarning, GraceWarningInline } from './GraceWarning';
```

After creating these files:
1. Run `npm run build` to verify no TypeScript errors
2. Visually test the components
```

---

## Verification

After completing this task:

```bash
npm run build
```

Expected: No TypeScript errors.

Visual testing:

```typescript
import { FlowIndicator, GraceWarning } from '@/components/flow';

// Test FlowIndicator at each level
<FlowIndicator level="none" uninterruptedTimeMs={0} isTracking={true} />
// Expected: Nothing rendered (or minimal)

<FlowIndicator level="building" uninterruptedTimeMs={300000} isTracking={true} />
// Expected: "🌊 Flow building..." with pulse animation, "5:00 uninterrupted"

<FlowIndicator level="established" uninterruptedTimeMs={600000} isTracking={true} />
// Expected: "🌊 In flow" with cyan glow, "10:00 uninterrupted"

<FlowIndicator level="deep" uninterruptedTimeMs={1200000} isTracking={true} />
// Expected: "🔥 Deep flow!" with orange glow, "20:00 uninterrupted"

// Test GraceWarning
<GraceWarning remainingMs={60000} triggerApp="Twitter" />
// Expected: "Flow at risk", "1:00" countdown, progress bar at 66%

<GraceWarning remainingMs={30000} triggerApp="Twitter" />
// Expected: Progress bar at 33%, orange color

<GraceWarning remainingMs={10000} triggerApp="Twitter" />
// Expected: Progress bar at 11%, red color
```
