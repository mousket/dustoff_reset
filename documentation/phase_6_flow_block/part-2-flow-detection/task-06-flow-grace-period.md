# Task: Implement Grace Period Integration

## Phase: 6
## Part: 2 (Flow Detection)
## Task: 06
## Depends On: task-05-flow-hud-indicators
## Estimated Time: 1 hour

---

## Context Files

- `src/hooks/useFlow.ts` (update)
- `src/hooks/useEnforcement.ts` (update)
- `src/components/flow/GraceWarning.tsx` (already created)

---

## Success Criteria

- [ ] Grace period starts when user switches to non-whitelisted app
- [ ] Grace warning UI appears when grace is active
- [ ] 90-second countdown is displayed and accurate
- [ ] Returning to whitelisted app before timeout cancels grace
- [ ] Exceeding grace period resets flow to 'none'
- [ ] Flow level is preserved during grace period
- [ ] Grace period integrates with Part 1 enforcement (block screen)
- [ ] Audio/visual cue can be triggered (placeholder for Phase 7)

---

## Test Cases

- User in 'building' flow, switches to Twitter → expect grace starts, warning appears
- During grace, switch back to VS Code → expect grace cancels, flow continues at 'building'
- During grace, wait 90 seconds → expect flow resets to 'none', warning dismisses
- During grace, block screen shows (Legend mode) → expect grace pauses while block screen active
- Grace at 30 seconds remaining → expect warning color changes (more urgent)
- Dismiss block screen before grace expires → expect grace resumes countdown

---

## Implementation Prompt

```
Integrate grace period handling with the flow system and enforcement.

The flow state machine (task-02) and Rust backend (task-03) already handle the core grace period logic. This task connects it to the UI and ensures proper integration with the block screen from Part 1.

Update file: src/hooks/useFlow.ts

Add grace period event handling to the existing hook:

```typescript
// Add to the UseFlowConfig interface:
onGraceWarningThreshold?: (remainingMs: number) => void; // Called when grace reaches 30s, 15s, 5s

// Add to the tick effect, after updating flowState:
// Check grace warning thresholds
if (state.grace.active) {
  const remaining = state.grace.remainingMs;
  
  // Warning thresholds: 30s, 15s, 5s
  if (remaining <= 30000 && remaining > 29000) {
    onGraceWarningThreshold?.(remaining);
  } else if (remaining <= 15000 && remaining > 14000) {
    onGraceWarningThreshold?.(remaining);
  } else if (remaining <= 5000 && remaining > 4000) {
    onGraceWarningThreshold?.(remaining);
  }
}
```

Update file: src/hooks/useEnforcement.ts

Integrate grace period with block screen:

```typescript
// Add to useEnforcement hook imports:
import { useFlow } from './useFlow';

// Inside useEnforcement, add flow integration:
const {
  flowLevel,
  graceActive,
  graceRemainingMs,
  graceTriggerApp,
  onAppSwitch: flowOnAppSwitch,
  pause: pauseFlow,
  resume: resumeFlow,
} = useFlow({
  sessionId: currentSessionId,
  sessionDurationMs: sessionDurationMs,
  enabled: sessionActive,
  onLevelChange: (from, to) => {
    console.log('[useEnforcement] Flow level changed:', from, '->', to);
    // Could trigger celebration here (Phase 7)
  },
  onGraceStart: (app) => {
    console.log('[useEnforcement] Grace started for:', app);
  },
  onGraceEnd: (reason) => {
    console.log('[useEnforcement] Grace ended:', reason);
  },
  onFlowBroken: (app) => {
    console.log('[useEnforcement] Flow broken by:', app);
  },
});

// Modify handleBlockedApp to coordinate with flow:
const handleBlockedApp = useCallback(async (app: { name: string; bundleId: string }) => {
  // Notify flow system of app switch
  await flowOnAppSwitch({
    name: app.name,
    bundleId: app.bundleId,
    isWhitelisted: false,
    isBlocked: true,
  });

  // Handle based on session mode
  if (sessionMode === 'Legend') {
    // Pause flow tracking while block screen is active
    await pauseFlow();
    
    await triggerBlockScreen(app.name, app.bundleId, sessionMode);
  }
  // Flow mode uses delay gate (existing behavior)
  // Zen mode: flow tracks but no intervention
}, [sessionMode, triggerBlockScreen, flowOnAppSwitch, pauseFlow]);

// When block screen is dismissed, resume flow:
const dismissBlockScreen = useCallback(async () => {
  await dismissBlock();
  
  // Resume flow tracking
  await resumeFlow();
  
  // Return focus to last whitelisted app
  if (lastWhitelistedApp) {
    await tauriBridge.focusApp(lastWhitelistedApp.bundleId);
    
    // Notify flow that we're back to whitelisted app
    await flowOnAppSwitch({
      name: lastWhitelistedApp.name,
      bundleId: lastWhitelistedApp.bundleId,
      isWhitelisted: true,
      isBlocked: false,
    });
  }
}, [dismissBlock, resumeFlow, lastWhitelistedApp, flowOnAppSwitch]);

// Add to the return object:
return {
  // ... existing returns
  
  // Flow state
  flowLevel,
  graceActive,
  graceRemainingMs,
  graceTriggerApp,
};
```

Create a combined Flow + Grace display component:

Create file: src/components/flow/FlowStatus.tsx

```typescript
import React from 'react';
import { cn } from '@/lib/utils';
import { FlowLevel } from '@/lib/flow';
import { FlowIndicator } from './FlowIndicator';
import { GraceWarning } from './GraceWarning';

interface FlowStatusProps {
  level: FlowLevel;
  uninterruptedTimeMs: number;
  isTracking: boolean;
  graceActive: boolean;
  graceRemainingMs: number;
  graceTriggerApp: string | null;
  className?: string;
}

export const FlowStatus: React.FC<FlowStatusProps> = ({
  level,
  uninterruptedTimeMs,
  isTracking,
  graceActive,
  graceRemainingMs,
  graceTriggerApp,
  className,
}) => {
  return (
    <div className={cn('relative', className)}>
      {/* Flow indicator in HUD */}
      <FlowIndicator
        level={level}
        uninterruptedTimeMs={uninterruptedTimeMs}
        isTracking={isTracking}
      />

      {/* Grace warning as toast (when active) */}
      {graceActive && (
        <GraceWarning
          remainingMs={graceRemainingMs}
          triggerApp={graceTriggerApp}
        />
      )}
    </div>
  );
};
```

Update file: src/components/flow/index.ts

```typescript
export { FlowIndicator, FlowIndicatorCompact } from './FlowIndicator';
export { GraceWarning, GraceWarningInline } from './GraceWarning';
export { FlowStatus } from './FlowStatus';
```

After making these changes:
1. Run `npm run build` to verify no TypeScript errors
2. Test grace period flow manually
```

---

## Verification

After completing this task:

```bash
npm run build
```

Expected: No TypeScript errors.

Manual testing scenario:

1. Start a 45-minute Legend mode session
2. Work in a whitelisted app (e.g., VS Code) for 6+ minutes
3. Verify: Flow indicator shows "🌊 Flow building..."
4. Switch to a blocked app (e.g., Twitter)
5. Verify:
   - [ ] Grace warning appears in bottom-right
   - [ ] Block screen appears (Legend mode)
   - [ ] Grace countdown pauses while block screen is visible
6. Wait for block screen timer, click "Return to Work"
7. Verify:
   - [ ] Returned to VS Code
   - [ ] Grace countdown resumes (if still time left)
8. Return to VS Code before grace expires
9. Verify:
   - [ ] Grace warning dismisses
   - [ ] Flow state is preserved (still 'building')
10. Repeat steps 4-5, but wait for grace to expire
11. Verify:
    - [ ] Flow level resets to 'none'
    - [ ] Grace warning dismisses
    - [ ] Flow indicator updates or hides
