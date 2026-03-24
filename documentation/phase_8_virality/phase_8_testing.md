
# Phase 8: Testing Checkpoints

## When and What to Test

---

## Part 1: Database & Rust Backend

### After Step 1.3 (Persistence Layer)

**Test:** Verify database tables are created

```bash
# Build and check for compilation errors
cd src-tauri && cargo build
```

**Expected:** No compilation errors. If you see errors about missing imports, fix them before continuing.

---

### After Step 1.5 (Tauri Commands)

**Test:** Verify commands are registered

```bash
cd src-tauri && cargo build
```

**Expected:** No compilation errors. All commands should compile.

---

### After Step 1.6 (main.rs Update)

**Test:** Run the app and check initialization

```bash
npm run tauri dev
```

**What to check:**
1. Open DevTools (Cmd+Option+I on Mac, F12 on Windows)
2. Look in Console for any Rust panics or errors
3. App should launch without crashing

**Expected in terminal:**
```
[App] Badge system initialized
```

If you don't see this yet, that's okay - we add the initialization call in Step 5.5.

---

## Part 2: Badge Definitions & Evaluator

### After Step 2.1 (Badge Definitions - Rust)

**Test:** Compile check

```bash
cd src-tauri && cargo build
```

**Expected:** No errors. All 40+ badges should compile.

---

### After Step 2.2 (Badge Evaluator)

**Test:** Full backend compilation

```bash
cd src-tauri && cargo build
```

**Expected:** Clean build with no errors.

**Optional Rust test:** Add this temporary test to verify definitions:

```rust
// In src-tauri/src/badges/definitions.rs, at the bottom:
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_badge_count() {
        let badges = get_all_badge_definitions();
        println!("Total badges defined: {}", badges.len());
        assert!(badges.len() >= 40, "Should have at least 40 badges");
    }
}
```

Run: `cd src-tauri && cargo test`

**Expected:**
```
Total badges defined: 42
test badges::definitions::tests::test_badge_count ... ok
```

---

## Part 3: TypeScript & UI Components

### After Step 3.2 (TypeScript Badge Definitions)

**Test:** TypeScript compilation

```bash
npm run build
```

**Expected:** No TypeScript errors. If you see type errors, fix them.

---

### After Step 3.4 (Tauri Bridge Update)

**Test:** Bridge methods exist

```bash
npm run tauri dev
```

Then in browser DevTools Console:

```javascript
// Test that methods exist (don't call them yet)
console.log(typeof window.__TAURI__)
```

**Expected:** Should log `object` (Tauri is available)

---

### After Step 3.5 (useBadges Hook)

**Test:** Hook loads badges

Add temporary test code to App.tsx:

```typescript
// Add at top of App component
import { useBadges } from '@/hooks/useBadges'

// Inside App component:
const { badges, streaks, isLoading, error, totalBadges, unlockedCount } = useBadges()

useEffect(() => {
  console.log('[TEST] Badges loaded:', {
    isLoading,
    error,
    totalBadges,
    unlockedCount,
    badgeCount: badges.length,
    streakCount: streaks.length,
  })
}, [isLoading, badges, streaks])
```

**Run:** `npm run tauri dev`

**Expected in Console:**
```
[TEST] Badges loaded: {
  isLoading: false,
  error: null,
  totalBadges: 42,
  unlockedCount: 0,
  badgeCount: 0,
  streakCount: 0
}
```

If you see an error, check:
- Rust commands are registered in main.rs
- init_badges is being called

---

### After Step 3.6 (BadgeCard Component)

**Test:** Render a badge card

Add temporary test to App.tsx:

```typescript
import { BadgeCard } from '@/components/badges/BadgeCard'
import { BADGE_DEFINITIONS } from '@/lib/badges/badge-definitions'

// In JSX, add temporarily:
<div className="fixed bottom-4 right-4 z-50">
  <BadgeCard 
    badge={BADGE_DEFINITIONS[0]} 
    unlocked={false} 
    size="lg"
    showDescription={true}
  />
</div>
```

**Run:** `npm run tauri dev`

**Expected:** You should see a badge card in the bottom-right corner showing "First Blood" badge (locked state, grayed out).

---

### After Step 3.7 (BadgeUnlockToast)

**Test:** Toast appears and animates

Add temporary test:

```typescript
import { BadgeUnlockToast } from '@/components/badges/BadgeUnlockToast'
import { BADGE_DEFINITIONS } from '@/lib/badges/badge-definitions'

const [showTestToast, setShowTestToast] = useState(true)

// In JSX:
{showTestToast && (
  <BadgeUnlockToast
    badge={BADGE_DEFINITIONS[0]}
    onClose={() => setShowTestToast(false)}
    onShare={() => console.log('Share clicked!')}
  />
)}
```

**Run:** `npm run tauri dev`

**Expected:** 
1. Toast slides in from right
2. Shows "Badge Unlocked!" with First Blood badge
3. Share and Dismiss buttons visible
4. Auto-closes after 5 seconds OR click Dismiss

---

### After Step 3.8 (StreakDisplay)

**Test:** Streak renders

Add temporary test:

```typescript
import { StreakDisplay, StreakBadge } from '@/components/badges/StreakDisplay'

// In JSX:
<div className="fixed bottom-4 left-4 z-50 flex flex-col gap-4">
  <StreakDisplay 
    streak={{
      id: 'test',
      streakType: 'daily',
      currentCount: 7,
      longestCount: 14,
      updatedAt: Date.now(),
    }}
    isAtRisk={false}
  />
  <StreakBadge count={7} isAtRisk={true} />
</div>
```

**Run:** `npm run tauri dev`

**Expected:**
1. StreakDisplay shows "🔥 7" with "Day Streak" label
2. Shows "Best: 14"
3. StreakBadge shows compact "🔥 7" with pulsing border (at risk)

---

### After Step 3.9 (BadgeGrid)

**Test:** Full badge grid renders

Add temporary test:

```typescript
import { BadgeGrid } from '@/components/badges/BadgeGrid'

// In JSX (maybe as a panel or fullscreen):
<div className="fixed inset-0 z-50 bg-gray-900 p-8 overflow-auto">
  <BadgeGrid
    unlockedBadgeIds={['first_blood', 'getting_started']}
    unlockedAtMap={{
      'first_blood': Date.now() - 86400000,
      'getting_started': Date.now(),
    }}
    onBadgeClick={(badge) => console.log('Clicked:', badge.name)}
  />
</div>
```

**Run:** `npm run tauri dev`

**Expected:**
1. Shows "🎖️ 2 / 42 (5%)" with progress bar
2. Category filter tabs appear
3. First Blood and Getting Started badges appear colored (unlocked)
4. Other badges appear grayed out (locked)
5. Clicking a badge logs its name

---

## Part 4: Social Sharing

### After Step 4.1 (ShareCard)

**Test:** Share card renders

Add temporary test:

```typescript
import { ShareCard } from '@/components/badges/ShareCard'
import { BADGE_DEFINITIONS } from '@/lib/badges/badge-definitions'

// Find a legendary badge for impressive visuals
const legendaryBadge = BADGE_DEFINITIONS.find(b => b.rarity === 'legendary')

// In JSX:
<div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
  <ShareCard
    badge={legendaryBadge || BADGE_DEFINITIONS[0]}
    stats={{
      streak: 30,
      totalSessions: 100,
      totalHours: 50,
    }}
  />
</div>
```

**Run:** `npm run tauri dev`

**Expected:**
1. Beautiful card with gradient background
2. Badge icon with glow effect (for legendary)
3. Stats displayed at bottom
4. "dustoffreset.com" watermark

---

### After Step 4.3 (BadgeShareModal)

**Test:** Full share flow

Add temporary test:

```typescript
import { BadgeShareModal } from '@/components/badges/BadgeShareModal'

const [showShareModal, setShowShareModal] = useState(true)

// In JSX:
{showShareModal && (
  <BadgeShareModal
    badge={BADGE_DEFINITIONS[0]}
    stats={{ streak: 7, totalSessions: 10 }}
    onClose={() => setShowShareModal(false)}
  />
)}
```

**Run:** `npm run tauri dev`

**Expected:**
1. Modal appears with preview card
2. "Share on X" button opens Twitter intent (new browser tab)
3. "Copy Text" button copies to clipboard, shows "✓ Copied!"
4. Preview text shows hashtags and link

---

## Part 5: Integration

### After Step 5.2 (Post-Session Integration)

**Test:** Complete a session and see badge unlock

1. Start a Zen mode session (easiest)
2. Let it complete (or use a short duration for testing)
3. Watch for badge unlock toast

**Expected in Console:**
```
[Badges] Unlocked: ["First Blood"]
```

**Expected in UI:**
1. Badge unlock toast appears
2. Shows "First Blood" badge
3. Share button works

---

### After Step 5.3 (Streak in HUD)

**Test:** Streak appears in HUD

1. Complete at least one session
2. Look for streak badge in HUD

**Expected:** "🔥 1" appears somewhere in the UI

---

### After Step 5.5 (App Initialization)

**Test:** Full initialization on app start

```bash
npm run tauri dev
```

**Expected in Console:**
```
[App] Badge system initialized
```

If streak is at risk (you completed a session yesterday but not today):
```
[App] Daily streak is at risk!
```

---

## End-to-End Test Checklist

After completing all parts, run through this full test:

### Test 1: First Session Badge Unlock
1. Fresh start (or clear database)
2. Start a Zen mode session
3. Complete the session
4. ✅ "First Blood" badge unlocks
5. ✅ Toast appears with share button
6. ✅ Click share → Twitter opens

### Test 2: Streak Increment
1. Complete a session today
2. ✅ Daily streak shows "🔥 1"
3. (If testing next day) Complete another session
4. ✅ Streak shows "🔥 2"

### Test 3: Performance Badge
1. Complete a session with high focus (no distractions)
2. Finish with 80+ bandwidth
3. ✅ "Flow State" badge unlocks

### Test 4: Shame Badge
1. Start a session
2. Get distracted many times (5+ blocks)
3. Complete with low bandwidth (≤20)
4. ✅ "The Fall" and/or "Doomscroller" badges unlock

### Test 5: Badge Grid View
1. Open badges panel (when implemented)
2. ✅ Shows all unlocked badges in color
3. ✅ Shows locked badges grayed out
4. ✅ Secret badges show "???" until unlocked
5. ✅ Category filter works

### Test 6: Share Flow
1. Click share on any badge
2. ✅ Share modal opens
3. ✅ Twitter share works
4. ✅ Copy to clipboard works
5. ✅ Share count increments (check with `getStat('total_shares')`)

---

## Quick Debug Commands

If something isn't working, use these in the browser Console:

```javascript
// Check if Tauri is available
console.log(window.__TAURI__)

// Test badge commands directly
await window.__TAURI__.invoke('get_badges')
await window.__TAURI__.invoke('get_streaks')
await window.__TAURI__.invoke('get_stat', { key: 'total_sessions' })

// Check badge count
await window.__TAURI__.invoke('get_badge_count')
```
