
## 🎯 Day 3 MVP: What You'll Ship

### Core Features (Fully Working)

| Feature | Status | What It Does |
|---------|--------|--------------|
| **Daily Calibration** | ✅ Complete | Sleep + Emotional + Distractions → Bandwidth Score (0-100) |
| **Pre-Session Airlock** | ✅ Complete | 6-step flow: Type → Intention → Mode → Whitelist → Checklist → Countdown |
| **Session Timer** | ✅ Complete | Countdown timer with pause/resume |
| **Manual Interventions** | ✅ Complete | Friction (-5) and Focus-Slipping (-10) buttons |
| **Reset Rituals** | ✅ Complete | Breath (2min/+5) · Walk (5min/+7.5) · Dump (3min/+6) · Personal (4min/0) |
| **Parking Lot** | ✅ Complete | Capture thoughts → Harvest post-session → Queue for next session |
| **Post-Session Debrief** | ✅ Complete | Game Tape summary → Reflection → Victory Level |
| **Session Recovery** | ✅ Complete | Crash recovery on app restart |
| **Persistent Storage** | ✅ Complete | All data survives app restarts (JSON files) |

### User Flow (Day 3 MVP)

```
┌─────────────────────────────────────────────────────────────────┐
│                        APP LAUNCH                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Recovery Data?  │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
    ┌─────────────────┐           ┌─────────────────┐
    │ Resume Session  │           │ Check Calibration│
    │ Modal           │           └────────┬────────┘
    └─────────────────┘                    │
                                ┌──────────┴──────────┐
                                │                     │
                                ▼                     ▼
                      ┌─────────────────┐   ┌─────────────────┐
                      │ CALIBRATION     │   │ HUD (Idle)      │
                      │ (if not today)  │   │ Ready to Start  │
                      └────────┬────────┘   └────────┬────────┘
                               │                     │
                               └──────────┬──────────┘
                                          ▼
                              ┌─────────────────────┐
                              │ PRE-SESSION AIRLOCK │
                              │ 6-step preparation  │
                              └──────────┬──────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │   ACTIVE SESSION    │
                              │                     │
                              │ • Timer counting    │
                              │ • Manual triggers   │
                              │ • Pause → Rituals   │
                              │ • Parking lot dumps │
                              └──────────┬──────────┘
                                         │
                              ┌──────────┴──────────┐
                              │                     │
                              ▼                     ▼
                    ┌─────────────────┐   ┌─────────────────┐
                    │ Mission Complete│   │ Stopping Early  │
                    └────────┬────────┘   └────────┬────────┘
                             │                     │
                             └──────────┬──────────┘
                                        ▼
                              ┌─────────────────────┐
                              │ POST-SESSION FLOW   │
                              │                     │
                              │ 1. Game Tape Summary│
                              │ 2. Reflection       │
                              │ 3. Parking Lot      │
                              │    Harvest          │
                              └──────────┬──────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │ BACK TO IDLE        │
                              │ Ready for next      │
                              └─────────────────────┘
```

### UI Components (All Working)

**Always Visible:**
- FloatingHUD with bandwidth score (color-coded)
- Session timer (MM:SS countdown)
- Mode indicator (Zen/Flow/Legend colors)
- Quick action buttons (Calibrate, Start, Pause, Parking Lot)

**Conditional Panels:**
- DailyCalibrationPanel (4 questions)
- PreSessionPanel (6 steps)
- ResetPanel (4 ritual options + countdown)
- PostSessionSummaryPanel (timeline + metrics)
- SessionReflectionPanel (what went well + friction notes)
- ParkingLotHarvestPanel (categorize + action)
- ParkingLotManagementPanel (view all items)

**Overlays:**
- InterventionOverlay (mode-specific messaging)
- FlowCelebrationOverlay (celebration animation)
- OvertimeNudgeToast (extend or end)

**Modals:**
- InterruptedSessionModal (resume or discard)
- EndSessionModal (reason selection)

### What Users CAN Do (Day 3)

✅ Calibrate their cognitive state each morning
✅ Plan and start focused work sessions (15/30/50/90 min)
✅ Choose intensity mode (Zen/Flow/Legend)
✅ Manually report friction or focus-slipping
✅ Take reset rituals to restore bandwidth
✅ Capture intrusive thoughts in parking lot
✅ Review session performance (Game Tape)
✅ Reflect on what went well
✅ Harvest and organize parking lot items
✅ See their data persist across app restarts

### What Users CANNOT Do (Day 3)

❌ Have bandwidth decay automatically over time
❌ Get automatic interventions from app switching
❌ Have the app detect when they open distracting apps
❌ Get blocked from non-whitelisted apps (Legend mode)
❌ Enter flow state automatically (no detection)
❌ See real telemetry data (input patterns, window tracking)

---

## 🔮 Post-MVP: What Comes Next

### Week 2: The Brain (Days 4-7)

**Entropy Decay Engine**
```
What it does:
- Bandwidth passively decays 5% per hour
- Background thread ticks every 60 seconds
- Emits "bandwidth-changed" events to frontend

Why it matters:
- Currently bandwidth only changes when user clicks buttons
- Real cognitive capacity depletes over time even without distractions
- Creates urgency and realistic capacity modeling

Implementation:
- Rust background thread with Arc<Mutex<EntropyEngine>>
- 60-second interval timer
- Event emission to frontend
- Integration with calibration (starting bandwidth)
```

**Sustained Focus Gains**
```
What it does:
- +1 bandwidth per minute of uninterrupted focus
- Caps at 95 (can't game to 100)
- Resets on any distraction event

Why it matters:
- Rewards genuine focus behavior
- Counterbalances entropy decay
- Creates positive feedback loop
```

**Flow State Detection**
```
What it does:
- Detects when 4 conditions are met:
  1. ≥12 minutes sustained focus
  2. Bandwidth ≥60
  3. No intervention in last 5 minutes
  4. No context switch in last 2 minutes
- Triggers FlowCelebrationOverlay
- +5 bandwidth bonus (one-time)
- Persistent flow indicator on HUD

Why it matters:
- Flow is the "holy grail" of deep work
- Celebration reinforces positive behavior
- Visual indicator motivates maintaining state
```

**Automatic Intervention Triggers**
```
What it does:
- Backend monitors bandwidth thresholds
- < 60 bandwidth → Emit "friction" intervention
- < 50 bandwidth → Emit "focus-slipping" intervention
- Frontend shows InterventionOverlay automatically

Why it matters:
- Currently user must self-report
- Automatic triggers catch capacity drops user might miss
- Proactive rather than reactive
```

### Week 3: The Muscles (Days 8-10+)

**OS-Level Window Monitoring**
```
What it does:
- Background thread polls active window every 500ms
- Detects app switches and records timestamps
- Compares against pre-session whitelist
- Tracks switch frequency for burst detection

Platform-specific:
- macOS: NSWorkspace API (cocoa crate)
- Windows: GetForegroundWindow (winapi crate)
- Linux: X11/Wayland APIs

Why it matters:
- Currently whitelist is honor system only
- Real monitoring provides objective feedback
- Enables automatic penalty application
```

**Telemetry-Based Penalties**
```
What it does:
- Non-whitelisted app opened → -12 bandwidth (first), -6 (repeat)
- Tab switch → -2 bandwidth (normal), -5 (burst >5 in 60s)
- App switch → -4 bandwidth (normal), -6 (burst >3 in 60s)
- All penalties applied automatically

Why it matters:
- Removes self-reporting burden
- Objective measurement of distraction behavior
- Real consequences for context switching
```

**App Blocking (Legend Mode)**
```
What it does:
- When user opens non-whitelisted app in Legend mode:
  1. Intervention overlay appears immediately
  2. App is brought back to focus (or blocked)
  3. Heavy penalty applied (-12)
  4. No dismiss option (must take action)

Implementation complexity:
- Requires accessibility permissions on macOS
- May need to launch/focus Tauri window
- Platform-specific blocking mechanisms

Why it matters:
- Legend mode is "zero tolerance"
- Users who want hard boundaries get them
- Most aggressive intervention tier
```

**Input Pattern Monitoring (Future)**
```
What it does:
- Monitors keyboard/mouse activity patterns
- Detects "jitter" (cognitive friction indicator)
- Detects idle periods (potential distraction)
- Feeds into bandwidth calculations

Why it's deferred:
- Requires careful privacy considerations
- Platform-specific input hooks
- Need to define "friction" patterns precisely
- Lower priority than window monitoring
```

---

## 📊 MVP vs Full Product Comparison

| Capability | Day 3 MVP | Full Product |
|------------|-----------|--------------|
| **Bandwidth Source** | Calibration only | Calibration + entropy + telemetry |
| **Bandwidth Changes** | Manual buttons only | Automatic from behavior |
| **Distraction Detection** | User self-reports | OS detects automatically |
| **Flow State** | Manual celebration trigger | Automatic detection |
| **App Whitelist** | Honor system | Enforced with monitoring |
| **Legend Mode Blocking** | UI only (no enforcement) | Actually blocks apps |
| **Intervention Triggers** | Manual only | Automatic thresholds |
| **Data Persistence** | JSON files | JSON → SQLite upgrade path |
| **Background Processing** | None | Entropy ticker + monitor threads |

---

## 🎯 MVP Value Proposition

Even without the advanced features, Day 3 MVP delivers:

**For Users:**
- Structured daily calibration ritual
- Intentional session planning
- Manual capacity tracking
- Reset ritual framework
- Thought capture system
- Session reflection practice

**The Core Insight:**
> The MVP is a **"training wheels" version** that teaches users the Dustoff Reset methodology. They manually track what the full product will automate. This actually has value — users build awareness and habits before automation takes over.

**Pitch for MVP:**
> "Start with honest self-assessment. Track your own focus patterns. Build the muscle memory. Then let the app take over the monitoring while you focus on what matters."

---

## 🚀 Recommended Post-MVP Priority

Based on user value and implementation complexity:

| Priority | Feature | Days | Impact |
|----------|---------|------|--------|
| **1** | Entropy decay | 1-2 | High (realistic capacity model) |
| **2** | Sustained focus gains | 0.5 | High (positive reinforcement) |
| **3** | Auto intervention triggers | 0.5 | High (proactive warnings) |
| **4** | Flow state detection | 1 | Medium (celebration/motivation) |
| **5** | Window monitoring (macOS) | 2-3 | Very High (core differentiator) |
| **6** | Telemetry penalties | 1 | High (automatic tracking) |
| **7** | Legend mode blocking | 2 | Medium (power user feature) |
| **8** | Windows support | 2-3 | Expands market |

**My recommendation:** After Day 3, spend Days 4-5 on items 1-4 (The Brain). This gets you to a **"smart" app** that feels alive. Then Days 6-10 on items 5-7 (The Muscles) for the true differentiator.

