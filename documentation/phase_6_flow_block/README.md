# Phase 6: Hard Enforcement & Flow Detection

## Overview

Phase 6 adds two major capabilities to Dustoff Reset:

1. **Hard Enforcement** - Actually block distracting apps (not just warn)
2. **Flow Detection** - Track and celebrate focus states

## Dependencies

- Phase 9 (Presets & Quick Start) must be complete
- All existing session monitoring must be working

## Parts

| Part | Focus | Tasks |
|------|-------|-------|
| Part 1 | Hard Enforcement | 10 tasks |
| Part 2 | Flow Detection | 13 tasks |

## Estimated Total Time

- Part 1: 12-16 hours
- Part 2: 14-18 hours
- **Total: 26-34 hours**

## Execution Order

```
Part 1: Hard Enforcement
  task-01 → task-02 → task-03 → task-04 → task-05 →
  task-06 → task-07 → task-08 → task-09 → task-10

Part 2: Flow Detection (can start after Part 1 task-05)
  task-01 → task-02 → task-03 → task-04 → task-05 →
  task-06 → task-07 → task-08 → task-09 → task-10 →
  task-11 → task-12 → task-13
```

## Success Criteria for Phase 6

- [ ] Legend mode actually blocks distracting apps
- [ ] Block screen cannot be easily dismissed
- [ ] Session pauses when user locks screen/walks away
- [ ] Flow state is tracked during sessions ≥ 30 min
- [ ] Flow indicators appear in HUD
- [ ] Flow streaks are tracked across days
- [ ] Post-session summary shows flow timeline
- [ ] Flow badges are awarded correctly

## Key Decisions

| Decision | Value |
|----------|-------|
| Flow minimum session | 30 minutes |
| Flow building threshold | 5 minutes |
| Flow established threshold | 10 minutes |
| Flow deep threshold | 20 minutes |
| Grace period for app switches | 90 seconds |
| Weekend streak behavior | Optional (don't break, don't extend) |
| Auto-extend | Opt-in (default off) |
