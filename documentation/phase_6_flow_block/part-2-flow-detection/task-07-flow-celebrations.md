# Task: Implement Flow Celebrations

## Phase: 6
## Part: 2 (Flow Detection)
## Task: 07
## Depends On: task-06-flow-grace-period
## Estimated Time: 1.5 hours

---

## Context Files

- `src/lib/flow/types.ts` (update)
- `src/hooks/useFlow.ts` (update)
- `src/components/flow/FlowCelebration.tsx` (create)
- `src/components/flow/index.ts` (update)
- `src-tauri/src/flow/celebrations.rs` (create)

---

## Success Criteria

- [ ] Celebration triggers on each flow level transition (none→building, building→established, established→deep)
- [ ] Each level has unique visual celebration component
- [ ] Celebration auto-dismisses after 3 seconds
- [ ] Celebration messages match mode (Achilles vs Hector - placeholder for future)
- [ ] Rust backend emits `flow_celebration` event on level change
- [ ] TypeScript receives and displays celebration
- [ ] Celebration does not block user interaction
- [ ] Audio trigger hook exists (actual sounds in Phase 7)

---

## Test Cases

- 5 min uninterrupted focus → expect "Flow building..." celebration, soft pulse animation
- 10 min uninterrupted → expect "🌊 In flow" celebration, warm glow animation
- 20 min uninterrupted → expect "🔥 Deep flow!" celebration, rich animation
- Flow breaks then rebuilds → expect new "Flow building..." celebration on rebuild
- Multiple celebrations don't stack → expect only latest celebration visible
- Celebration during block screen → expect celebration queued until block screen dismissed

---

## Implementation Prompt

```
Implement flow celebration system that triggers visual feedback when users achieve flow states.

Step 1: Define celebration types

Update file: src/lib/flow/types.ts

Add celebration types at the end of the file:

```typescript
// Celebration types
export type FlowCelebrationType = 'building' | 'established' | 'deep' | 'broken';

export interface FlowCelebration {
  type: FlowCelebrationType;
  message: string;
  emoji: string;
  durationMs: number;
  timestamp: number;
}

export const FLOW_CELEBRATIONS: Record<FlowCelebrationType, Omit<FlowCelebration, 'timestamp'>> = {
  building: {
    type: 'building',
    message: 'Flow building...',
    emoji: '✨',
    durationMs: 3000,
  },
  established: {
    type: 'established',
    message: 'In flow',
    emoji: '🌊',
    durationMs: 3000,
  },
  deep: {
    type: 'deep',
    message: 'Deep flow!',
    emoji: '🔥',
    durationMs: 4000,
  },
  broken: {
    type: 'broken',
    message: 'Flow broken',
    emoji: '💨',
    durationMs: 2000,
  },
};
```

Step 2: Create celebration component

Create file: src/components/flow/FlowCelebration.tsx

```typescript
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { FlowCelebration as FlowCelebrationType, FlowCelebrationType as CelebType } from '@/lib/flow/types';

interface FlowCelebrationProps {
  celebration: FlowCelebrationType | null;
  onComplete?: () => void;
  className?: string;
}

const celebrationStyles: Record<CelebType, {
  bg: string;
  text: string;
  border: string;
  animation: string;
}> = {
  building: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    animation: 'animate-pulse',
  },
  established: {
    bg: 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    animation: 'animate-flow-glow',
  },
  deep: {
    bg: 'bg-gradient-to-r from-orange-500/20 to-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/40',
    animation: 'animate-flow-deep',
  },
  broken: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-400',
    border: 'border-gray-500/30',
    animation: 'animate-fade-out',
  },
};

export const FlowCelebration: React.FC<FlowCelebrationProps> = ({
  celebration,
  onComplete,
  className,
}) => {
  const [visible, setVisible] = useState(false);
  const [currentCelebration, setCurrentCelebration] = useState<FlowCelebrationType | null>(null);

  useEffect(() => {
    if (celebration) {
      setCurrentCelebration(celebration);
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          setCurrentCelebration(null);
          onComplete?.();
        }, 300); // Wait for fade out animation
      }, celebration.durationMs);

      return () => clearTimeout(timer);
    }
  }, [celebration, onComplete]);

  if (!currentCelebration || !visible) {
    return null;
  }

  const style = celebrationStyles[currentCelebration.type];

  return (
    <div
      className={cn(
        'fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'px-8 py-4 rounded-2xl border',
        'backdrop-blur-md shadow-2xl',
        'transition-all duration-300',
        'pointer-events-none z-50',
        style.bg,
        style.border,
        style.animation,
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <span className="text-4xl">{currentCelebration.emoji}</span>
        <span className={cn('text-2xl font-semibold', style.text)}>
          {currentCelebration.message}
        </span>
      </div>
    </div>
  );
};

// Compact version for HUD integration
export const FlowCelebrationToast: React.FC<FlowCelebrationProps> = ({
  celebration,
  onComplete,
  className,
}) => {
  const [visible, setVisible] = useState(false);
  const [currentCelebration, setCurrentCelebration] = useState<FlowCelebrationType | null>(null);

  useEffect(() => {
    if (celebration) {
      setCurrentCelebration(celebration);
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          setCurrentCelebration(null);
          onComplete?.();
        }, 300);
      }, celebration.durationMs);

      return () => clearTimeout(timer);
    }
  }, [celebration, onComplete]);

  if (!currentCelebration || !visible) {
    return null;
  }

  const style = celebrationStyles[currentCelebration.type];

  return (
    <div
      className={cn(
        'fixed bottom-24 right-4',
        'px-4 py-2 rounded-lg border',
        'backdrop-blur-sm shadow-lg',
        'transition-all duration-300',
        'pointer-events-none',
        style.bg,
        style.border,
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{currentCelebration.emoji}</span>
        <span className={cn('text-sm font-medium', style.text)}>
          {currentCelebration.message}
        </span>
      </div>
    </div>
  );
};
```

Step 3: Add CSS animations to tailwind config

Update file: tailwind.config.js

Add to the `extend.animation` section:

```javascript
animation: {
  // ... existing animations
  'flow-glow': 'flow-glow 2s ease-in-out infinite',
  'flow-deep': 'flow-deep 1.5s ease-in-out infinite',
  'fade-out': 'fade-out 2s ease-out forwards',
},
keyframes: {
  // ... existing keyframes
  'flow-glow': {
    '0%, 100%': { 
      boxShadow: '0 0 20px rgba(249, 115, 22, 0.3)',
      transform: 'scale(1)',
    },
    '50%': { 
      boxShadow: '0 0 40px rgba(249, 115, 22, 0.5)',
      transform: 'scale(1.02)',
    },
  },
  'flow-deep': {
    '0%, 100%': { 
      boxShadow: '0 0 30px rgba(239, 68, 68, 0.4)',
      transform: 'scale(1)',
    },
    '50%': { 
      boxShadow: '0 0 60px rgba(239, 68, 68, 0.6)',
      transform: 'scale(1.03)',
    },
  },
  'fade-out': {
    '0%': { opacity: '1' },
    '100%': { opacity: '0' },
  },
},
```

Step 4: Update useFlow hook to trigger celebrations

Update file: src/hooks/useFlow.ts

Add celebration state and handler:

```typescript
// Add import
import { FlowCelebration, FLOW_CELEBRATIONS, FlowLevel } from '@/lib/flow/types';

// Add to UseFlowConfig interface:
onCelebration?: (celebration: FlowCelebration) => void;

// Add to hook state:
const [currentCelebration, setCurrentCelebration] = useState<FlowCelebration | null>(null);

// Update the onLevelChange handler to trigger celebrations:
const handleLevelChange = useCallback((from: FlowLevel, to: FlowLevel) => {
  // Trigger celebration for level increases
  if (to !== 'none' && getLevelPriority(to) > getLevelPriority(from)) {
    const celebrationConfig = FLOW_CELEBRATIONS[to as keyof typeof FLOW_CELEBRATIONS];
    if (celebrationConfig) {
      const celebration: FlowCelebration = {
        ...celebrationConfig,
        timestamp: Date.now(),
      };
      setCurrentCelebration(celebration);
      onCelebration?.(celebration);
      
      // Placeholder for audio trigger (Phase 7)
      console.log('[Flow] Audio trigger:', to);
    }
  }
  
  // Trigger "broken" celebration when flow is lost (optional)
  if (from !== 'none' && to === 'none') {
    const brokenCelebration: FlowCelebration = {
      ...FLOW_CELEBRATIONS.broken,
      timestamp: Date.now(),
    };
    setCurrentCelebration(brokenCelebration);
    onCelebration?.(brokenCelebration);
  }
  
  // Call original callback
  onLevelChange?.(from, to);
}, [onLevelChange, onCelebration]);

// Helper function for level comparison:
function getLevelPriority(level: FlowLevel): number {
  switch (level) {
    case 'none': return 0;
    case 'building': return 1;
    case 'established': return 2;
    case 'deep': return 3;
    default: return 0;
  }
}

// Add to return object:
return {
  // ... existing returns
  currentCelebration,
  clearCelebration: () => setCurrentCelebration(null),
};
```

Step 5: Update exports

Update file: src/components/flow/index.ts

```typescript
export { FlowIndicator, FlowIndicatorCompact } from './FlowIndicator';
export { GraceWarning, GraceWarningInline } from './GraceWarning';
export { FlowStatus } from './FlowStatus';
export { FlowCelebration, FlowCelebrationToast } from './FlowCelebration';
```

After making these changes:
1. Run `npm run build` to verify no TypeScript errors
2. Test flow celebrations manually in a session
```

---

## Verification

After completing this task:

```bash
npm run build
```

Expected: No TypeScript errors.

Manual testing scenario:

1. Start a 45-minute session (any mode)
2. Work in a whitelisted app without switching
3. At 5 minutes:
   - [ ] "✨ Flow building..." celebration appears
   - [ ] Celebration has pulse animation
   - [ ] Celebration auto-dismisses after 3 seconds
4. At 10 minutes:
   - [ ] "🌊 In flow" celebration appears
   - [ ] Celebration has warm glow animation
5. At 20 minutes:
   - [ ] "🔥 Deep flow!" celebration appears
   - [ ] Celebration has rich/intense animation
6. Switch to blocked app and let flow break:
   - [ ] "💨 Flow broken" celebration appears (subtle)
7. Return and rebuild flow:
   - [ ] "✨ Flow building..." celebration appears again at 5 min mark
