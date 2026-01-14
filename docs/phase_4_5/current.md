# Dustoff Reset - Complete Project Context

## What This App Is

**Dustoff Reset** is a **desktop productivity coaching app** built with **Tauri 2.x** (Rust backend + React/TypeScript frontend). It's a floating overlay that helps knowledge workers maintain focus during work sessions by:

1. **Daily Calibration** - Morning check-in measuring sleep, emotional state, and distractions
2. **Bandwidth Tracking** - A 0-100 score representing cognitive capacity that decays over time
3. **Session Management** - Timed focus sessions with configurable modes (Zen/Flow/Legend)
4. **Reset Rituals** - Structured breaks (breathing, walking, etc.) to restore bandwidth
5. **Parking Lot** - Capture distracting thoughts without acting on them
6. **Telemetry** - Track which apps/tabs the user visits (interventions for non-whitelisted apps)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop Framework | Tauri 2.x |
| Backend | Rust |
| Database | SQLite (rusqlite) |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS v4 |
| Build | Vite |
| UI Components | shadcn/ui (Radix primitives) |

---

## Project Structure

```
dustoff_reset/
├── src/                          # Frontend (React/TypeScript)
│   ├── App.tsx                   # Main orchestrator (600 lines)
│   ├── index.css                 # Tailwind + custom styles
│   ├── hooks/                    # React hooks
│   │   ├── useBandwidthEngine.ts # Entropy decay, flow detection
│   │   ├── useSessionManager.ts  # Session lifecycle
│   │   ├── useSessionTimer.ts    # Countdown, recovery saves
│   │   └── useTauriWindow.ts     # Window control bridge
│   ├── lib/                      # Utilities
│   │   ├── tauri-types.ts        # TS types matching Rust
│   │   ├── tauri-bridge.ts       # Tauri command wrappers
│   │   ├── parking-lot-storage.ts
│   │   └── session-storage.ts
│   ├── components/               # Adapters & UI
│   │   ├── HUDAdapter.tsx        # HUD state adapter
│   │   ├── PanelContainer.tsx    # Panel wrapper
│   │   ├── panels/               # Panel adapters (7 files)
│   │   ├── modals/               # Modal adapters (2 files)
│   │   ├── overlays/             # Overlay adapters
│   │   └── animations/           # TimerHalo, etc.
│   └── features/                 # Feature modules
│       ├── calibration/          # Calibration ceremony (6 screens)
│       └── desktop/              # HUD, panels, modals, overlays
│
├── src-tauri/                    # Backend (Rust)
│   ├── Cargo.toml                # Dependencies
│   ├── tauri.conf.json           # Window config
│   └── src/
│       ├── main.rs               # Entry point, command registration
│       ├── lib.rs                # AppState, module exports
│       ├── commands/             # Tauri commands
│       │   ├── windows.rs        # resize, drag, position
│       │   └── data.rs           # CRUD for all data
│       ├── models/               # Rust data structures
│       │   ├── calibration.rs    # CalibrationData
│       │   ├── session.rs        # SessionRecord, TimelineBlock, etc.
│       │   ├── parking_lot.rs    # ParkingLotItem
│       │   ├── recovery.rs       # RecoveryData
│       │   └── reflection.rs     # ReflectionObject
│       ├── storage/              # SQLite operations
│       │   ├── database.rs       # Init, schema, migrations
│       │   ├── calibration.rs    # Calibration CRUD
│       │   ├── session.rs        # Session CRUD
│       │   ├── parking_lot.rs    # Parking lot CRUD
│       │   ├── recovery.rs       # Recovery CRUD
│       │   ├── reflection.rs     # Reflection CRUD
│       │   └── user.rs           # User preferences
│       └── telemetry/            # App monitoring (NEW)
│           ├── types.rs          # Event types, config
│           ├── app_monitor.rs    # macOS active app detection
│           ├── monitor_loop.rs   # 2-second polling loop
│           ├── events.rs         # Tauri event emission
│           └── persistence.rs    # SQLite storage
```

---

## Database Schema

```sql
-- CALIBRATIONS: Daily check-in data
calibrations (id, date, calibration_score, sleep_hours, sleep_quality, 
              emotional_residue, emotional_state, distractions, timestamp)

-- SESSIONS: Work session records
sessions (id, started_at, ended_at, planned_duration_minutes, actual_duration_minutes,
          mode, intention, victory_level, flow_efficiency, longest_streak_minutes,
          distraction_attempts, interventions_used, end_reason, end_sub_reason,
          timeline_blocks, distraction_events, intervention_events,
          whitelisted_apps, whitelisted_tabs)

-- REFLECTIONS: Post-session reflections
reflections (id, session_id, what_went_well, friction_notes, closing_energy, skipped)

-- PARKING_LOT_ITEMS: Captured distracting thoughts
parking_lot_items (id, text, timestamp, status, item_status, category, tags,
                   action, session_id, resolved_at)

-- RECOVERY_DATA: Crash recovery (single row)
recovery_data (id, session_id, started_at, planned_duration_minutes, mode,
               intention, elapsed_seconds, bandwidth_at_pause)

-- USER_DATA: User preferences (single row)
user_data (id, email, first_name, operator_name, default_mode)

-- TELEMETRY_EVENTS: App usage tracking
telemetry_events (id, session_id, event_type, timestamp, app_name, bundle_id,
                  window_title, browser, tab_url, tab_title, domain, metadata)

-- SESSION_TELEMETRY_STATS: Aggregated session stats
session_telemetry_stats (session_id, app_switches, non_whitelisted_switches,
                         tab_switches, non_whitelisted_domains, 
                         time_in_whitelisted, time_in_non_whitelisted,
                         app_usage, domain_visits)
```

---

## Core Application Flow

```
App Launch
    │
    ├─→ Check Recovery Data → [Yes] → Show InterruptedSessionModal
    │                                    ├─→ Resume → Continue session
    │                                    └─→ Discard → Clear data
    │
    └─→ Check Calibration → [No] → Show CalibrationPanel (6 screens)
                                    └─→ Calculate bandwidth score (0-100)
    │
    └─→ [Has Calibration] → Show HUD (idle state)
                             │
                             └─→ Click ▶ → PreSessionPanel
                                           ├─→ Choose mode (Zen/Flow/Legend)
                                           ├─→ Set duration
                                           ├─→ Set intention
                                           ├─→ Whitelist apps/tabs
                                           └─→ Get Grounded → Start Session
    │
    └─→ [Session Active] → HUD shows timer, bandwidth
                          │
                          ├─→ Bandwidth decays (entropy)
                          │   └─→ < 60: Friction intervention
                          │   └─→ < 50: Focus-slipping intervention
                          │   └─→ > 70 sustained: Flow state celebration
                          │
                          ├─→ Click ⏸ → Pause + ResetPanel (rituals)
                          │
                          ├─→ Click ☰ → ParkingLotPanel (capture thoughts)
                          │
                          └─→ Click ⏹ → EndSessionModal
                                        ├─→ Completed
                                        ├─→ Stopping early (sub-reasons)
                                        └─→ Pulled away (sub-reasons)
    │
    └─→ [Session Ended] → PostSessionSummaryPanel
                          └─→ SessionReflectionPanel
                              └─→ ParkingLotHarvestPanel
                                  └─→ Back to idle
```

---

## Feature Completion Status

### ✅ COMPLETE (32 features)

**Calibration:**
- Daily calibration panel (6 screens)
- Score calculation (biological core math)
- Calibration persistence (SQLite)
- Workday boundary (5am cutoff)

**Session Lifecycle:**
- Pre-session configuration
- Session timer (countdown)
- Pause/Resume (combined with reset ritual)
- End session flow with reasons
- Victory level calculation
- Session persistence

**Bandwidth Engine:**
- Initial bandwidth from calibration
- Entropy decay per second
- Mode-specific decay rates (Zen: 0.15, Flow: 0.25, Legend: 0.40)
- Intervention triggers (< 60 and < 50)
- Flow state detection (> 70 sustained)

**Data Persistence:**
- All CRUD operations for all entities
- Recovery data (auto-save every 30s)

**Window Management:**
- Dynamic resize for panels
- Always on top
- Draggable HUD and modals

**Crash Recovery:**
- Auto-save during session
- Recovery modal on launch
- Resume/Discard flow

### ⚠️ IMPLEMENTED BUT UNTESTED (7 features)

- ParkingLotManagementPanel
- ParkingLotHarvestPanel
- PostSessionSummaryPanel
- SessionReflectionPanel
- InterventionOverlay
- FlowCelebrationOverlay
- Telemetry module (just created)

### 🔧 PARTIAL (2 features)

- User preferences (schema exists, not wired to UI)
- Transparent background (CSS works, macOS may show faint glass)

### ❌ NOT IMPLEMENTED (1 feature)

- Position persistence (window position resets on restart)

---

## Key Hooks (Frontend)

### `useBandwidthEngine.ts`
```typescript
// Manages bandwidth decay and interventions
const bandwidthEngine = useBandwidthEngine({
  initialBandwidth: calibration.calibrationScore,
  isSessionActive: mode === 'session',
  isPaused: mode === 'paused',
  mode: 'Flow', // Zen/Flow/Legend
  onFrictionTrigger: () => {},      // bandwidth < 60
  onFocusSlippingTrigger: () => {}, // bandwidth < 50
  onFlowAchieved: () => {},         // sustained focus 12+ min
})
// Returns: { current, trend, isInFlow, flowDurationMinutes, applyResetBonus }
```

### `useSessionManager.ts`
```typescript
// Orchestrates session lifecycle
const sessionManager = useSessionManager()
// Actions: startSession, pauseSession, resumeSession, endSession
// State: currentSession, isSessionActive, isSessionPaused
// Tracking: addTimelineBlock, recordDistraction, recordIntervention
```

### `useSessionTimer.ts`
```typescript
// Manages countdown and recovery saves
const timer = useSessionTimer({
  isActive, isPaused, plannedDurationMinutes, sessionId, mode, intention,
  currentBandwidth, onTimeUp, onOvertime
})
// Returns: { elapsedSeconds, timeRemaining, isOvertime }
```

---

## Key Tauri Commands (Backend)

```rust
// Calibration
save_calibration, load_calibration, clear_calibration

// Session
save_session, get_session, get_all_sessions

// Reflection
save_reflection, get_reflection

// Recovery
save_recovery_data, get_recovery_data, clear_recovery_data

// Parking Lot
add_parking_lot_item, update_parking_lot_item, 
get_active_parking_lot_items, get_next_session_items, delete_parking_lot_item

// User
save_user, get_user

// Utilities
get_workday_date, generate_uuid, reset_all_data

// Window
resize_window, get_window_size, start_dragging, 
set_window_position, get_window_position
```

---

## Telemetry Module (Just Created)

The telemetry module monitors which apps/tabs the user visits during sessions:

```rust
// Types
ActiveAppInfo, BrowserTabInfo, TelemetryEvent, TelemetryEventType

// App Monitor (macOS)
get_active_app()     // Uses AppleScript
get_browser_tab()    // Chrome, Safari support

// Monitor Loop
TelemetryMonitor::start_session(session_id, config)
TelemetryMonitor::stop_session()
// Polls every 2 seconds, emits events

// Events emitted to frontend
telemetry:app-switch
telemetry:non-whitelisted-app
telemetry:tab-switch
telemetry:non-whitelisted-domain
telemetry:return-to-whitelisted
```

**Still needed for telemetry:**
1. Initialize telemetry tables in `database.rs`
2. Create Tauri commands in `commands/telemetry.rs`
3. Wire monitor to session start/stop
4. Frontend hook to listen to events and update bandwidth

---

## Window Configuration

```json
{
  "width": 320, "height": 80,  // HUD size
  "decorations": false,
  "transparent": true,
  "alwaysOnTop": true,
  "skipTaskbar": true,
  "x": 1400, "y": 80  // Top-right position
}
```

Panel sizes (in `useTauriWindow.ts`):
- HUD only: 320×80
- Calibration: 420×720
- PreSession: 420×700
- Reset: 520×520
- ParkingLot: 540×640
- PostSessionSummary: 600×640
- SessionReflection: 560×580
- EndSession: 560×680
- Recovery: 520×300

---

## Dev Commands

```bash
# Start development
npm run tauri dev

# Build for production
npm run tauri build

# Check TypeScript
npx tsc --noEmit

# Check Rust
cd src-tauri && cargo check

# Clear database (fresh start)
rm ~/Library/Application\ Support/com.gerardbeaubrun.dustoff_reset/dustoff.db

# Force calibration screen (in browser console)
await devUtils.clearTodayCalibration()
```

---

## What Needs to Be Done Next

### Priority 1: Wire Telemetry to Sessions
1. Add `init_telemetry_tables()` call in `database.rs`
2. Create `commands/telemetry.rs` with start/stop commands
3. Register commands in `main.rs`
4. Call telemetry start when session starts
5. Create frontend hook to listen to telemetry events
6. Use non-whitelisted events to trigger interventions

### Priority 2: Test Untested Features
1. Run through full session with parking lot
2. Verify post-session summary displays correctly
3. Test session reflection saves
4. Let bandwidth drop to trigger interventions
5. Maintain flow for 12+ minutes for celebration

### Priority 3: Polish
1. User preferences panel (default mode, operator name)
2. Position persistence across restarts
3. Fix macOS background transparency completely
4. Settings panel access from HUD

### Priority 4: Future Features (not yet designed)
- Analytics dashboard
- Historical session view
- Export data
- Keyboard shortcuts
- Menu bar integration

---

## Dependencies

**Rust (Cargo.toml):**
```toml
tauri = { version = "2", features = ["macos-private-api"] }
tauri-plugin-opener = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1", features = ["v4"] }
thiserror = "1"
rusqlite = { version = "0.31", features = ["bundled"] }
tokio = { version = "1", features = ["sync", "time", "rt"] }
```

**Frontend (package.json key deps):**
```json
"@tauri-apps/api": "^2.0.0",
"react": "^18.x",
"tailwindcss": "^4.x",
"lucide-react": for icons,
"@radix-ui/*": for UI primitives
```

---

This document provides complete context for continuing development in a new conversation.