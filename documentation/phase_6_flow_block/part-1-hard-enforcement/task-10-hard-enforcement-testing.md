# Task: Hard Enforcement Integration Testing

## Phase: 6
## Part: 1 (Hard Enforcement)
## Task: 10
## Depends On: task-09-escalating-consequences
## Estimated Time: 2 hours

---

## Context Files

- All files created in tasks 01-09
- Test scenarios documented below

---

## Success Criteria

- [ ] All unit tests pass (Rust)
- [ ] All TypeScript compiles without errors
- [ ] All test scenarios pass manual verification
- [ ] No console errors during normal operation
- [ ] Performance: app monitoring doesn't impact system performance
- [ ] Edge cases handled gracefully

---

## Test Scenarios

### Scenario 1: Legend Mode Full Flow

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start Legend mode session (45 min) | Session begins, monitoring starts |
| 2 | Work in VS Code for 5 min | No interventions |
| 3 | Switch to Twitter | Block screen appears within 1 sec |
| 4 | Verify block screen | Shows "Twitter", 30s timer, dismiss disabled |
| 5 | Wait 30 seconds | Dismiss button enables |
| 6 | Click "Return to Work" | Block screen closes, focus returns to VS Code |
| 7 | Switch to Twitter again | Block screen appears, 60s timer (level 2) |
| 8 | Wait 60 seconds, dismiss | Block screen closes |
| 9 | Switch to Twitter third time | Block screen appears, 90s timer, reflection prompt |
| 10 | Select "I'm tired" reflection | Option highlights |
| 11 | Wait 90 seconds, dismiss | Block screen closes |
| 12 | End session | Session summary shows 3 violations |

### Scenario 2: Flow Mode (Existing Behavior)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start Flow mode session | Session begins |
| 2 | Switch to blocked app | Delay Gate appears (not Block Screen) |
| 3 | Verify existing behavior works | No regression |

### Scenario 3: Zen Mode (No Intervention)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start Zen mode session | Session begins |
| 2 | Switch to any app | No intervention |
| 3 | Session tracks time | Time recorded but no penalties |

### Scenario 4: Idle Detection

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start any session | Session begins |
| 2 | Don't touch keyboard/mouse for 2 min | Idle warning appears |
| 3 | Move mouse | Warning dismisses |
| 4 | Don't touch for 5 min | Session paused overlay appears |
| 5 | Click "Resume Session" | Session continues, timer correct |
| 6 | Complete session | Summary shows pause duration |

### Scenario 5: Screen Lock

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start session | Session begins |
| 2 | Lock screen (Cmd+Ctrl+Q) | - |
| 3 | Unlock screen | Session paused overlay appears |
| 4 | Click "Resume Session" | Session continues |

### Scenario 6: Block Screen During Pause

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start Legend session | Session begins |
| 2 | Trigger idle pause | Session paused |
| 3 | Resume session | Session continues |
| 4 | Switch to blocked app | Block screen appears (pause didn't reset violations) |

### Scenario 7: App Switching Between Whitelisted Apps

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start session with VS Code, Chrome whitelisted | Session begins |
| 2 | Switch from VS Code to Chrome | No intervention |
| 3 | Switch from Chrome to Terminal | No intervention (if whitelisted) |
| 4 | Switch from Chrome to Twitter | Block screen appears |

### Scenario 8: Rapid App Switching

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start Legend session | Session begins |
| 2 | Rapidly switch apps (stress test) | No crashes, block screen appears for blocked apps |
| 3 | Check console | No excessive errors |

### Scenario 9: Session End During Block Screen

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start Legend session (5 min for testing) | Session begins |
| 2 | Trigger block screen at 4:30 | Block screen appears |
| 3 | Let session timer reach 0 | Session ends gracefully, block screen closes |

### Scenario 10: Multiple Pauses

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start 30 min session | Session begins |
| 2 | Trigger idle pause at 5 min | Paused |
| 3 | Resume after 2 min | 25 min remaining (not 23) |
| 4 | Trigger pause at 15 min | Paused |
| 5 | Resume after 3 min | 15 min remaining |
| 6 | Complete session | Summary shows total 5 min paused |

---

## Performance Tests

### Test A: CPU Usage

1. Start session with monitoring active
2. Open Activity Monitor / Task Manager
3. Monitor Dustoff Reset CPU usage
4. Expected: < 5% CPU during normal operation

### Test B: Memory Usage

1. Start session
2. Run for 30+ minutes with app monitoring
3. Check memory usage
4. Expected: No memory leaks, stable memory usage

### Test C: Polling Efficiency

1. Add console.log to polling functions
2. Verify polling interval is respected (500ms for apps, 5s for idle)
3. No duplicate or excessive polls

---

## Edge Case Tests

### Edge 1: Dustoff Reset Itself

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start session | Session begins |
| 2 | Focus Dustoff Reset window | No block screen (it should whitelist itself) |

### Edge 2: System Apps

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start session | Session begins |
| 2 | Open Finder | Behavior depends on whitelist |
| 3 | Open System Settings | Behavior depends on whitelist |

### Edge 3: App Crash/Force Quit

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start session | Session begins |
| 2 | Force quit a whitelisted app | Monitoring continues |
| 3 | Reopen the app | App detected normally |

### Edge 4: No Frontmost App

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Start session | Session begins |
| 2 | Click on desktop (no app focused) | No crash, graceful handling |

---

## Implementation Prompt

```
Create a testing checklist document and run all verification tests.

Create file: src/tests/enforcement-checklist.md

# Hard Enforcement Testing Checklist

## Pre-Test Setup
- [ ] Clean build: `npm run build` and `cargo build`
- [ ] No TypeScript errors
- [ ] No Rust compilation errors
- [ ] App launches successfully

## Scenario Tests

### Scenario 1: Legend Mode Full Flow
- [ ] Step 1: Session starts ✓/✗
- [ ] Step 2: No interventions during focus ✓/✗
- [ ] Step 3: Block screen appears for Twitter ✓/✗
- [ ] Step 4: Block screen content correct ✓/✗
- [ ] Step 5: Dismiss enables after timer ✓/✗
- [ ] Step 6: Focus returns to VS Code ✓/✗
- [ ] Step 7: Level 2 escalation (60s) ✓/✗
- [ ] Step 8: Dismiss works ✓/✗
- [ ] Step 9: Level 3 with reflection ✓/✗
- [ ] Step 10: Reflection selection works ✓/✗
- [ ] Step 11: Dismiss works ✓/✗
- [ ] Step 12: Summary shows violations ✓/✗

### Scenario 2: Flow Mode
- [ ] Delay Gate appears (not Block Screen) ✓/✗
- [ ] No regression from existing behavior ✓/✗

### Scenario 3: Zen Mode
- [ ] No interventions ✓/✗
- [ ] Time still tracked ✓/✗

### Scenario 4: Idle Detection
- [ ] 2 min warning appears ✓/✗
- [ ] Activity dismisses warning ✓/✗
- [ ] 5 min pause appears ✓/✗
- [ ] Resume works ✓/✗
- [ ] Timer correct after resume ✓/✗

### Scenario 5: Screen Lock
- [ ] Pause appears on unlock ✓/✗
- [ ] Resume works ✓/✗

## Performance Tests
- [ ] CPU < 5% during operation ✓/✗
- [ ] Memory stable over 30 min ✓/✗
- [ ] Polling intervals correct ✓/✗

## Edge Cases
- [ ] Dustoff Reset itself not blocked ✓/✗
- [ ] System apps handled correctly ✓/✗
- [ ] App crash doesn't break monitoring ✓/✗
- [ ] No crash when no app focused ✓/✗

## Final Verification
- [ ] All scenarios pass
- [ ] No console errors
- [ ] App feels responsive
- [ ] Ready for Part 2 (Flow Detection)

## Notes
(Record any issues found and their resolutions)
```

After running all tests:
1. Document any failures
2. Fix issues found
3. Re-test failed scenarios
4. Mark Part 1 as complete when all pass
```

---

## Verification

After completing this task:

1. All manual test scenarios pass
2. No TypeScript or Rust compilation errors
3. No console errors during normal operation
4. Performance is acceptable

### Sign-off Checklist

- [ ] Scenario 1: Legend Mode Full Flow - PASS
- [ ] Scenario 2: Flow Mode - PASS
- [ ] Scenario 3: Zen Mode - PASS
- [ ] Scenario 4: Idle Detection - PASS
- [ ] Scenario 5: Screen Lock - PASS
- [ ] Scenario 6: Block Screen During Pause - PASS
- [ ] Scenario 7: Whitelisted App Switching - PASS
- [ ] Scenario 8: Rapid App Switching - PASS
- [ ] Scenario 9: Session End During Block Screen - PASS
- [ ] Scenario 10: Multiple Pauses - PASS
- [ ] Performance Tests - PASS
- [ ] Edge Cases - PASS

## Part 1 Complete

When all tests pass, Part 1 (Hard Enforcement) is complete.

Proceed to Part 2 (Flow Detection).
