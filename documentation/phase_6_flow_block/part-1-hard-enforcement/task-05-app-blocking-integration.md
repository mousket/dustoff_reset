# Task: Integrate App Blocking with Session System

## Phase: 6
## Part: 1 (Hard Enforcement)
## Task: 05
## Depends On: task-04-app-blocking-rust
## Estimated Time: 2 hours

---

## Context Files

- `src/hooks/useAppMonitor.ts` (create or update)
- `src/hooks/useEnforcement.ts` (create)
- `src/lib/tauri-bridge.ts` (update)
- `src/components/session/SessionContainer.tsx` (update - or your session wrapper)

---

## Success Criteria

- [ ] `useAppMonitor` hook polls frontmost app every 500ms during session
- [ ] `useEnforcement` hook coordinates block screen triggers
- [ ] When blocked app detected in Legend mode → block screen appears
- [ ] When blocked app detected in Flow mode → delay gate appears (existing behavior)
- [ ] When blocked app detected in Zen mode → no intervention (tracking only)
- [ ] After block screen dismissal → focus returns to last whitelisted app
- [ ] Tauri bridge has all app monitoring commands
- [ ] App monitoring stops when session ends

---

## Test Cases

- Start Legend session, switch to Twitter → expect block screen appears
- Start Flow session, switch to Twitter → expect delay gate appears (existing)
- Start Zen session, switch to Twitter → expect no intervention
- Dismiss block screen → expect focus returns to previous whitelisted app
- End session while in blocked app → expect monitoring stops, no intervention
- Block screen shown, wait for timer → expect dismiss button enables
- Multiple blocked apps in sequence → expect violation count increments

---

## Implementation Prompt

```
Create the hooks to integrate app blocking with the session system.

First, update the Tauri bridge:

Update file: src/lib/tauri-bridge.ts

Add these methods:

```typescript
// App monitoring commands
getFrontmostApp: async (): Promise<{
  name: string;
  bundleId: string;
  pid: number;
}> => {
  return invoke('get_frontmost_app');
},

minimizeApp: async (bundleId: string): Promise<void> => {
  return invoke('minimize_app', { bundleId });
},

focusApp: async (bundleId: string): Promise<void> => {
  return invoke('focus_app', { bundleId });
},

hideApp: async (bundleId: string): Promise<void> => {
  return invoke('hide_app', { bundleId });
},

isAppBlocked: async (bundleId: string, blocklist: string[]): Promise<boolean> => {
  return invoke('is_app_blocked', { bundleId, blocklist });
},

isAppWhitelisted: async (bundleId: string, whitelist: string[]): Promise<boolean> => {
  return invoke('is_app_whitelisted', { bundleId, whitelist });
},
```

Create file: src/hooks/useAppMonitor.ts

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { tauriBridge } from '@/lib/tauri-bridge';

interface AppInfo {
  name: string;
  bundleId: string;
  pid: number;
}

interface UseAppMonitorConfig {
  enabled: boolean;
  pollingInterval?: number; // ms, default 500
  whitelist: string[];
  blocklist: string[];
  onBlockedAppDetected?: (app: AppInfo) => void;
  onAppChanged?: (app: AppInfo, wasWhitelisted: boolean) => void;
}

interface UseAppMonitorReturn {
  currentApp: AppInfo | null;
  lastWhitelistedApp: AppInfo | null;
  isCurrentAppBlocked: boolean;
  isCurrentAppWhitelisted: boolean;
  isMonitoring: boolean;
  error: string | null;
}

export function useAppMonitor({
  enabled,
  pollingInterval = 500,
  whitelist,
  blocklist,
  onBlockedAppDetected,
  onAppChanged,
}: UseAppMonitorConfig): UseAppMonitorReturn {
  const [currentApp, setCurrentApp] = useState<AppInfo | null>(null);
  const [lastWhitelistedApp, setLastWhitelistedApp] = useState<AppInfo | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const previousAppRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if app is blocked
  const checkIfBlocked = useCallback((bundleId: string): boolean => {
    return blocklist.some(blocked => 
      bundleId.toLowerCase().includes(blocked.toLowerCase())
    );
  }, [blocklist]);

  // Check if app is whitelisted
  const checkIfWhitelisted = useCallback((bundleId: string): boolean => {
    return whitelist.some(allowed => 
      bundleId.toLowerCase().includes(allowed.toLowerCase())
    );
  }, [whitelist]);

  const isCurrentAppBlocked = currentApp ? checkIfBlocked(currentApp.bundleId) : false;
  const isCurrentAppWhitelisted = currentApp ? checkIfWhitelisted(currentApp.bundleId) : false;

  // Poll for frontmost app
  const pollApp = useCallback(async () => {
    try {
      const app = await tauriBridge.getFrontmostApp();
      
      // Check if app changed
      if (app.bundleId !== previousAppRef.current) {
        console.log('[useAppMonitor] App changed:', app.name);
        previousAppRef.current = app.bundleId;
        setCurrentApp(app);
        
        const wasWhitelisted = checkIfWhitelisted(app.bundleId);
        
        // Update last whitelisted app
        if (wasWhitelisted) {
          setLastWhitelistedApp(app);
        }
        
        // Notify of app change
        onAppChanged?.(app, wasWhitelisted);
        
        // Check if blocked
        if (checkIfBlocked(app.bundleId)) {
          console.log('[useAppMonitor] Blocked app detected:', app.name);
          onBlockedAppDetected?.(app);
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('[useAppMonitor] Error polling app:', err);
      setError(err instanceof Error ? err.message : 'Failed to get frontmost app');
    }
  }, [checkIfBlocked, checkIfWhitelisted, onAppChanged, onBlockedAppDetected]);

  // Start/stop monitoring based on enabled flag
  useEffect(() => {
    if (enabled) {
      console.log('[useAppMonitor] Starting monitoring');
      setIsMonitoring(true);
      
      // Initial poll
      pollApp();
      
      // Set up interval
      intervalRef.current = setInterval(pollApp, pollingInterval);
    } else {
      console.log('[useAppMonitor] Stopping monitoring');
      setIsMonitoring(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, pollingInterval, pollApp]);

  return {
    currentApp,
    lastWhitelistedApp,
    isCurrentAppBlocked,
    isCurrentAppWhitelisted,
    isMonitoring,
    error,
  };
}
```

Create file: src/hooks/useEnforcement.ts

```typescript
import { useState, useCallback } from 'react';
import { tauriBridge } from '@/lib/tauri-bridge';
import { useBlockScreen } from './useBlockScreen';
import { useAppMonitor } from './useAppMonitor';
import { SessionMode } from '@/lib/presets/types';

interface UseEnforcementConfig {
  sessionActive: boolean;
  sessionMode: SessionMode;
  whitelist: string[];
  blocklist: string[];
  onViolation?: (appName: string, violationCount: number) => void;
}

interface UseEnforcementReturn {
  // Block screen state
  blockScreenVisible: boolean;
  blockScreenState: ReturnType<typeof useBlockScreen>['blockScreen'];
  remainingTime: number;
  canDismiss: boolean;
  violationCount: number;
  
  // App monitor state
  currentApp: ReturnType<typeof useAppMonitor>['currentApp'];
  lastWhitelistedApp: ReturnType<typeof useAppMonitor>['lastWhitelistedApp'];
  
  // Actions
  dismissBlockScreen: () => Promise<void>;
  returnToLastApp: () => Promise<void>;
  
  // Reflection
  selectedReflection: ReturnType<typeof useBlockScreen>['selectedReflection'];
  setReflection: ReturnType<typeof useBlockScreen>['setReflection'];
}

export function useEnforcement({
  sessionActive,
  sessionMode,
  whitelist,
  blocklist,
  onViolation,
}: UseEnforcementConfig): UseEnforcementReturn {
  const [violationCount, setViolationCount] = useState(0);
  
  const {
    blockScreen,
    isVisible: blockScreenVisible,
    remainingTime,
    canDismiss,
    selectedReflection,
    triggerBlockScreen,
    dismissBlockScreen: dismissBlock,
    setReflection,
  } = useBlockScreen();

  // Handle blocked app detection
  const handleBlockedApp = useCallback(async (app: { name: string; bundleId: string }) => {
    // Only enforce in Legend mode
    // Flow mode uses existing delay gate (handled elsewhere)
    // Zen mode tracks but doesn't intervene
    if (sessionMode !== 'Legend') {
      console.log('[useEnforcement] Non-Legend mode, skipping hard block');
      return;
    }

    console.log('[useEnforcement] Triggering block screen for:', app.name);
    
    await triggerBlockScreen(app.name, app.bundleId, sessionMode);
    
    setViolationCount(prev => {
      const newCount = prev + 1;
      onViolation?.(app.name, newCount);
      return newCount;
    });
  }, [sessionMode, triggerBlockScreen, onViolation]);

  const {
    currentApp,
    lastWhitelistedApp,
  } = useAppMonitor({
    enabled: sessionActive && !blockScreenVisible, // Pause monitoring while block screen visible
    whitelist,
    blocklist,
    onBlockedAppDetected: handleBlockedApp,
  });

  // Dismiss and return to work
  const dismissBlockScreen = useCallback(async () => {
    await dismissBlock();
    
    // Return focus to last whitelisted app
    if (lastWhitelistedApp) {
      try {
        await tauriBridge.focusApp(lastWhitelistedApp.bundleId);
        console.log('[useEnforcement] Returned to:', lastWhitelistedApp.name);
      } catch (err) {
        console.error('[useEnforcement] Failed to return to app:', err);
      }
    }
  }, [dismissBlock, lastWhitelistedApp]);

  const returnToLastApp = useCallback(async () => {
    if (lastWhitelistedApp) {
      try {
        await tauriBridge.focusApp(lastWhitelistedApp.bundleId);
      } catch (err) {
        console.error('[useEnforcement] Failed to return to app:', err);
      }
    }
  }, [lastWhitelistedApp]);

  return {
    blockScreenVisible,
    blockScreenState: blockScreen,
    remainingTime,
    canDismiss,
    violationCount,
    currentApp,
    lastWhitelistedApp,
    dismissBlockScreen,
    returnToLastApp,
    selectedReflection,
    setReflection,
  };
}
```

Update src/hooks/index.ts to export new hooks:

```typescript
export { useAppMonitor } from './useAppMonitor';
export { useEnforcement } from './useEnforcement';
export { useBlockScreen } from './useBlockScreen';
```

Integration example in your session container:

```typescript
// In your session container component
import { useEnforcement } from '@/hooks';
import { BlockScreen } from '@/components/enforcement';

const {
  blockScreenVisible,
  blockScreenState,
  remainingTime,
  canDismiss,
  selectedReflection,
  dismissBlockScreen,
  setReflection,
} = useEnforcement({
  sessionActive: isSessionActive,
  sessionMode: currentSession.mode,
  whitelist: currentSession.whitelistedApps,
  blocklist: currentSession.blockedApps,
  onViolation: (appName, count) => {
    console.log(`Violation #${count}: ${appName}`);
  },
});

// Render block screen when visible
{blockScreenVisible && blockScreenState && (
  <BlockScreen
    blockScreen={blockScreenState}
    remainingTime={remainingTime}
    canDismiss={canDismiss}
    selectedReflection={selectedReflection}
    onDismiss={dismissBlockScreen}
    onSelectReflection={setReflection}
  />
)}
```

After creating these files:
1. Run `npm run build` to verify no TypeScript errors
2. Test with a Legend mode session
```

---

## Verification

After completing this task:

```bash
npm run build
```

Expected: No TypeScript errors.

Manual testing:

1. Start a Legend mode session
2. Switch to a blocked app (e.g., Twitter, if in blocklist)
3. Verify:
   - [ ] Block screen appears within 1 second
   - [ ] Timer shows correct duration (30s for first violation)
   - [ ] Dismiss button is disabled
   - [ ] App name shows correctly
4. Wait for timer to complete
5. Click "Return to Work"
6. Verify:
   - [ ] Block screen disappears
   - [ ] Focus returns to previous whitelisted app
7. Switch to blocked app again
8. Verify:
   - [ ] Block screen appears
   - [ ] Timer is longer (60s for second violation)
   - [ ] Message mentions "second distraction"
