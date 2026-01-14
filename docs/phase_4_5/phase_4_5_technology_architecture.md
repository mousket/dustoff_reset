# Phase 4.5: Technical Architecture

## Telemetry & Basic Enforcement

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         DUSTOFF RESET ARCHITECTURE                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         macOS LAYER                                 │    │
│  │                                                                     │    │
│  │   NSWorkspace ──── Active App                                       │    │
│  │   Accessibility ── Window Title                                     │    │
│  │   CGEventSource ── Idle Time                                        │    │
│  │                                                                     │    │
│  └───────────────────────────────┬─────────────────────────────────────┘    │
│                                  │                                          │
│                                  ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         RUST LAYER                                  │    │
│  │                                                                     │    │
│  │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │    │
│  │   │   App       │    │   Monitor   │    │   Event     │            │    │
│  │   │   Monitor   │───▶│   Loop      │───▶│   Emitter   │            │    │
│  │   └─────────────┘    └─────────────┘    └──────┬──────┘            │    │
│  │                                                │                    │    │
│  │   ┌─────────────┐    ┌─────────────┐          │                    │    │
│  │   │   Blocker   │    │   Storage   │◀─────────┤                    │    │
│  │   │   (Legend)  │    │   (SQLite)  │          │                    │    │
│  │   └─────────────┘    └─────────────┘          │                    │    │
│  │                                                │                    │    │
│  └────────────────────────────────────────────────┼────────────────────┘    │
│                                                   │                         │
│                              Tauri Events         │                         │
│                                                   ▼                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         TYPESCRIPT LAYER                            │    │
│  │                                                                     │    │
│  │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │    │
│  │   │   Event     │    │   Penalty   │    │   State     │            │    │
│  │   │   Listener  │───▶│   Calculator│───▶│   Manager   │            │    │
│  │   └─────────────┘    └─────────────┘    └──────┬──────┘            │    │
│  │                                                │                    │    │
│  │                                                ▼                    │    │
│  │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │    │
│  │   │   Bandwidth │◀───│   Session   │◀───│   React     │            │    │
│  │   │   Engine    │    │   Manager   │    │   UI        │            │    │
│  │   └─────────────┘    └─────────────┘    └─────────────┘            │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Flow 1: App Switch Detection → Penalty

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   USER SWITCHES FROM VS CODE TO TWITTER                                  │
│                                                                          │
│   1. macOS reports frontmost app changed                                 │
│      │                                                                   │
│      ▼                                                                   │
│   2. Rust AppMonitor detects change (polling every 2 sec)                │
│      │                                                                   │
│      ├──▶ Creates AppChangeEvent { from: "Code", to: "Twitter" }         │
│      │                                                                   │
│      ▼                                                                   │
│   3. Rust EventEmitter emits "telemetry:app_changed" via Tauri           │
│      │                                                                   │
│      ▼                                                                   │
│   4. TypeScript TelemetryListener receives event                         │
│      │                                                                   │
│      ├──▶ Looks up "Twitter" → category: "social_media"                  │
│      │                                                                   │
│      ▼                                                                   │
│   5. PenaltyCalculator computes penalty                                  │
│      │                                                                   │
│      ├──▶ base_penalty = -8 (social media)                               │
│      ├──▶ mode_weight = 1.25 (Flow mode)                                 │
│      ├──▶ escalation = 1.0 (first offense)                               │
│      ├──▶ final_penalty = -8 × 1.25 × 1.0 = -10                          │
│      │                                                                   │
│      ▼                                                                   │
│   6. StateManager updates                                                │
│      │                                                                   │
│      ├──▶ bandwidth = bandwidth + penalty (80 → 70)                      │
│      ├──▶ offenseCount++                                                 │
│      ├──▶ triggerIntervention = true (if mode requires)                  │
│      │                                                                   │
│      ▼                                                                   │
│   7. React UI responds                                                   │
│      │                                                                   │
│      ├──▶ BandwidthDisplay updates (80 → 70)                             │
│      ├──▶ DelayGate or BlockScreen appears                               │
│      │                                                                   │
│      ▼                                                                   │
│   8. Rust Storage persists event                                         │
│      │                                                                   │
│      └──▶ INSERT INTO telemetry_events (...)                             │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Flow 2: Delay Gate (Flow Mode)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   DELAY GATE FLOW (FLOW MODE)                                            │
│                                                                          │
│   1. App switch to distraction detected                                  │
│      │                                                                   │
│      ▼                                                                   │
│   2. Check mode: mode === 'Flow'                                         │
│      │                                                                   │
│      ▼                                                                   │
│   3. Calculate delay time                                                │
│      │                                                                   │
│      ├──▶ offenseCount = 1 → 10 seconds                                  │
│      ├──▶ offenseCount = 2 → 15 seconds                                  │
│      ├──▶ offenseCount = 3 → 20 seconds                                  │
│      ├──▶ offenseCount ≥ 4 → 30 seconds                                  │
│      │                                                                   │
│      ▼                                                                   │
│   4. Show DelayGate overlay                                              │
│      │                                                                   │
│      ├──▶ Window resizes to accommodate                                  │
│      ├──▶ Countdown timer starts                                         │
│      │                                                                   │
│      ▼                                                                   │
│   5. User decision                                                       │
│      │                                                                   │
│      ├──▶ OPTION A: Click "Return to Work"                               │
│      │       │                                                           │
│      │       ├──▶ Apply bonus (+5 × 1.0 = +5)                            │
│      │       ├──▶ Record: { response: 'returned', time_ms: 3420 }        │
│      │       ├──▶ Dismiss overlay                                        │
│      │       └──▶ (Optionally) Focus previous app                        │
│      │                                                                   │
│      └──▶ OPTION B: Wait through countdown                               │
│              │                                                           │
│              ├──▶ Apply penalty (-10)                                    │
│              ├──▶ Record: { response: 'waited_through', time_ms: 10000 } │
│              ├──▶ Dismiss overlay                                        │
│              └──▶ Distraction app is now in foreground                   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Flow 3: Block Screen (Legend Mode)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   BLOCK SCREEN FLOW (LEGEND MODE)                                        │
│                                                                          │
│   1. App switch to distraction detected                                  │
│      │                                                                   │
│      ▼                                                                   │
│   2. Check mode: mode === 'Legend'                                       │
│      │                                                                   │
│      ▼                                                                   │
│   3. Check app category                                                  │
│      │                                                                   │
│      ├──▶ social_media / entertainment / gaming → BLOCK                  │
│      ├──▶ communication (1st time) → WARNING with timer                  │
│      └──▶ communication (2nd+ time) → BLOCK                              │
│      │                                                                   │
│      ▼                                                                   │
│   4. Apply immediate penalty                                             │
│      │                                                                   │
│      ├──▶ base_penalty = -8                                              │
│      ├──▶ mode_weight = 1.5                                              │
│      ├──▶ escalation = varies (1.0 to 2.0)                               │
│      ├──▶ final_penalty = -8 × 1.5 × escalation                          │
│      │                                                                   │
│      ▼                                                                   │
│   5. Attempt to prevent app from opening                                 │
│      │                                                                   │
│      ├──▶ SUCCESS: App never gains focus                                 │
│      └──▶ FALLBACK: App opens but overlay covers it                      │
│      │                                                                   │
│      ▼                                                                   │
│   6. Show BlockScreen overlay (full screen)                              │
│      │                                                                   │
│      ├──▶ No countdown (cannot wait through)                             │
│      ├──▶ Shows intention reminder                                       │
│      ├──▶ Shows penalty applied                                          │
│      ├──▶ Shows escalation level                                         │
│      │                                                                   │
│      ▼                                                                   │
│   7. Check for session extension (3rd, 6th offense)                      │
│      │                                                                   │
│      ├──▶ IF offenseCount === 3: extend session +5 min                   │
│      ├──▶ IF offenseCount === 6: extend session +5 min                   │
│      │                                                                   │
│      ▼                                                                   │
│   8. User clicks "Return to Work"                                        │
│      │                                                                   │
│      ├──▶ Record: { response: 'returned', block_number: N }              │
│      ├──▶ Dismiss overlay                                                │
│      └──▶ Focus returns to whitelisted app                               │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Event Architecture

### Event Types (Rust → TypeScript)

| Event Name | Payload | Emitted When | Frequency |
|------------|---------|--------------|-----------|
| `telemetry:app_changed` | `AppChangeEvent` | Foreground app changes | On change |
| `telemetry:idle_start` | `IdleEvent` | No input for threshold | Once per idle period |
| `telemetry:idle_end` | `IdleEvent` | Activity resumes | Once per idle period |
| `telemetry:monitor_error` | `ErrorEvent` | Monitor encounters error | On error |

### Event Payloads

```typescript
// App Change Event
interface AppChangeEvent {
  from_app: AppInfo
  to_app: AppInfo
  timestamp: number        // Unix ms
  session_id: string | null
}

interface AppInfo {
  name: string             // "Twitter"
  bundle_id: string        // "com.twitter.Twitter"
  path: string             // "/Applications/Twitter.app"
}

// Idle Event
interface IdleEvent {
  duration_seconds: number
  last_activity_type: 'keyboard' | 'mouse' | 'unknown'
  timestamp: number
  session_id: string | null
}

// Error Event
interface ErrorEvent {
  code: string
  message: string
  context: string
  timestamp: number
}
```

### Events (TypeScript Internal)

| Event | Payload | Triggered By |
|-------|---------|--------------|
| `penalty:applied` | `PenaltyEvent` | Penalty calculator |
| `bonus:applied` | `BonusEvent` | Bonus calculator |
| `intervention:show` | `InterventionEvent` | State manager |
| `intervention:dismiss` | `InterventionResponse` | User action |
| `session:extended` | `ExtensionEvent` | Escalation logic |

```typescript
// Penalty Event
interface PenaltyEvent {
  type: PenaltyType
  base_value: number
  mode_weight: number
  escalation_multiplier: number
  final_value: number
  offense_number: number
  timestamp: number
  session_id: string
  context: {
    app_name?: string
    app_category?: AppCategory
    from_app?: string
    to_app?: string
  }
}

type PenaltyType = 
  | 'app_switch_neutral'
  | 'app_switch_communication'
  | 'app_switch_social'
  | 'app_switch_entertainment'
  | 'app_switch_gaming'
  | 'app_switch_non_whitelist'
  | 'block_attempt'
  | 'repeated_block'

// Bonus Event
interface BonusEvent {
  type: BonusType
  base_value: number
  mode_weight: number
  final_value: number
  timestamp: number
  session_id: string
  context: {
    intervention_type?: string
    response_time_ms?: number
  }
}

type BonusType = 
  | 'delay_gate_returned'
  | 'block_accepted'
  | 'quick_return'

// Intervention Event
interface InterventionEvent {
  type: 'delay_gate' | 'block_screen' | 'communication_warning'
  trigger_app: string
  trigger_category: AppCategory
  offense_number: number
  delay_seconds?: number  // For delay gate
  timestamp: number
  session_id: string
}

// Intervention Response
interface InterventionResponse {
  intervention_id: string
  type: 'delay_gate' | 'block_screen' | 'communication_warning'
  response: 'returned' | 'waited_through' | 'dismissed'
  time_on_screen_ms: number
  timestamp: number
}

// Extension Event
interface ExtensionEvent {
  reason: 'repeated_offense' | 'meltdown' | 'bypass_attempt'
  offense_number: number
  extension_minutes: number
  new_total_minutes: number
  timestamp: number
  session_id: string
}
```

---

## State Management

### Telemetry State

```typescript
interface TelemetryState {
  // Monitor state
  isMonitoring: boolean
  lastAppInfo: AppInfo | null
  monitorError: string | null
  
  // Session offense tracking
  offenseCount: number
  offensesByCategory: Record<AppCategory, number>
  offensesByApp: Record<string, number>
  
  // Intervention state
  currentIntervention: InterventionEvent | null
  interventionStartTime: number | null
  
  // Communication allowance (Legend mode)
  communicationUsed: boolean
  communicationTimeRemaining: number | null
  
  // Extension tracking (Legend mode)
  extensionMinutes: number
  extensionReasons: string[]
}
```

### State Location

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   STATE OWNERSHIP                                               │
│                                                                 │
│   RUST (Persistent)                                             │
│   ├── Current app info (in monitor loop)                        │
│   ├── Telemetry events (SQLite)                                 │
│   └── Session telemetry metrics (SQLite)                        │
│                                                                 │
│   REACT (In-Memory, Session Lifetime)                           │
│   ├── TelemetryState (via useTelemetry hook)                    │
│   ├── BandwidthState (via useBandwidthEngine hook)              │
│   ├── SessionState (via useSessionManager hook)                 │
│   └── InterventionState (via App.tsx)                           │
│                                                                 │
│   CONTEXT (Shared Across Components)                            │
│   └── TelemetryContext                                          │
│       ├── offenseCount                                          │
│       ├── currentIntervention                                   │
│       └── applyPenalty / applyBonus functions                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### State Updates

```typescript
// TelemetryContext provides these actions
interface TelemetryActions {
  // Called when app change detected
  handleAppChange: (event: AppChangeEvent) => void
  
  // Called when intervention response received
  handleInterventionResponse: (response: InterventionResponse) => void
  
  // Called to manually apply penalty/bonus
  applyPenalty: (penalty: PenaltyEvent) => void
  applyBonus: (bonus: BonusEvent) => void
  
  // Called to reset offense tracking (new session)
  resetOffenseTracking: () => void
  
  // Called to extend session (Legend mode)
  extendSession: (minutes: number, reason: string) => void
}
```

---

## Module Boundaries

### Rust Modules

```
src-tauri/src/telemetry/
│
├── mod.rs                 # Module exports
│   └── pub use types::*;
│   └── pub use app_monitor::*;
│   └── pub use monitor_loop::*;
│   └── pub use events::*;
│   └── pub use persistence::*;
│
├── types.rs               # Data structures
│   └── AppInfo
│   └── AppChangeEvent
│   └── IdleEvent
│   └── TelemetryEvent (for storage)
│
├── app_monitor.rs         # macOS API interaction
│   └── get_frontmost_app() -> Result<AppInfo>
│   └── get_idle_time() -> Result<u64>
│
├── monitor_loop.rs        # Polling loop
│   └── start_monitor(app_handle: AppHandle)
│   └── stop_monitor()
│   └── MonitorState (internal)
│
├── events.rs              # Tauri event emission
│   └── emit_app_changed(app_handle, event)
│   └── emit_idle_start(app_handle, event)
│   └── emit_idle_end(app_handle, event)
│
├── blocker.rs             # App blocking (Legend mode)
│   └── block_app(bundle_id: &str) -> Result<()>
│   └── unblock_app(bundle_id: &str) -> Result<()>
│   └── is_blocked(bundle_id: &str) -> bool
│
└── persistence.rs         # SQLite storage
    └── save_telemetry_event(conn, event)
    └── get_session_telemetry(conn, session_id)
    └── get_offense_count(conn, session_id)
```

### TypeScript Modules

```
src/lib/telemetry/
│
├── index.ts               # Exports
│   └── export * from './types'
│   └── export * from './app-categories'
│   └── export * from './mode-weights'
│   └── export * from './penalties'
│   └── export * from './penalty-calculator'
│   └── export * from './telemetry-listener'
│
├── types.ts               # TypeScript interfaces
│   └── AppInfo
│   └── AppChangeEvent
│   └── PenaltyEvent
│   └── BonusEvent
│   └── InterventionEvent
│   └── TelemetryState
│
├── app-categories.ts      # App classification
│   └── AppCategory enum
│   └── APP_CATEGORY_MAP: Record<string, AppCategory>
│   └── getAppCategory(appName: string): AppCategory
│   └── isDistraction(category: AppCategory): boolean
│
├── mode-weights.ts        # Mode multipliers
│   └── ModeWeights interface
│   └── MODE_WEIGHTS: Record<Mode, ModeWeights>
│   └── getModeWeights(mode: Mode): ModeWeights
│
├── penalties.ts           # Base penalty values
│   └── BASE_PENALTIES: Record<PenaltyType, number>
│   └── getBasePenalty(type: PenaltyType): number
│
├── penalty-calculator.ts  # Calculate final penalty
│   └── calculatePenalty(type, mode, offenseCount): number
│   └── calculateBonus(type, mode): number
│   └── getEscalationMultiplier(offenseCount): number
│   └── getDelayGateSeconds(offenseCount): number
│
└── telemetry-listener.ts  # Listen for Rust events
    └── setupTelemetryListener(handlers): () => void
    └── TelemetryHandlers interface
```

---

## API Contracts

### Rust → TypeScript (Tauri Events)

```rust
// Event names (constants)
pub const EVENT_APP_CHANGED: &str = "telemetry:app_changed";
pub const EVENT_IDLE_START: &str = "telemetry:idle_start";
pub const EVENT_IDLE_END: &str = "telemetry:idle_end";
pub const EVENT_MONITOR_ERROR: &str = "telemetry:monitor_error";

// Payload structures (must match TypeScript)
#[derive(Serialize, Clone)]
pub struct AppInfo {
    pub name: String,
    pub bundle_id: String,
    pub path: String,
}

#[derive(Serialize, Clone)]
pub struct AppChangeEvent {
    pub from_app: AppInfo,
    pub to_app: AppInfo,
    pub timestamp: u64,
    pub session_id: Option<String>,
}
```

### TypeScript → Rust (Tauri Commands)

```rust
// Commands for telemetry control
#[tauri::command]
pub fn start_telemetry_monitor(
    state: State<AppState>,
    session_id: String,
) -> Result<(), String>

#[tauri::command]
pub fn stop_telemetry_monitor(
    state: State<AppState>,
) -> Result<(), String>

#[tauri::command]
pub fn get_session_telemetry(
    state: State<AppState>,
    session_id: String,
) -> Result<SessionTelemetryData, String>

#[tauri::command]
pub fn save_telemetry_event(
    state: State<AppState>,
    event: TelemetryEventInput,
) -> Result<(), String>

// Commands for app blocking (Legend mode)
#[tauri::command]
pub fn block_app(
    bundle_id: String,
) -> Result<(), String>

#[tauri::command]
pub fn unblock_app(
    bundle_id: String,
) -> Result<(), String>

#[tauri::command]
pub fn get_blocked_apps() -> Result<Vec<String>, String>
```

### TypeScript Bridge

```typescript
// src/lib/tauri-bridge.ts additions

export const tauriBridge = {
  // ... existing methods ...
  
  // Telemetry control
  startTelemetryMonitor: (sessionId: string): Promise<void> => 
    invoke('start_telemetry_monitor', { sessionId }),
    
  stopTelemetryMonitor: (): Promise<void> => 
    invoke('stop_telemetry_monitor'),
    
  getSessionTelemetry: (sessionId: string): Promise<SessionTelemetryData> => 
    invoke('get_session_telemetry', { sessionId }),
    
  saveTelemetryEvent: (event: TelemetryEventInput): Promise<void> => 
    invoke('save_telemetry_event', { event }),
    
  // App blocking
  blockApp: (bundleId: string): Promise<void> => 
    invoke('block_app', { bundleId }),
    
  unblockApp: (bundleId: string): Promise<void> => 
    invoke('unblock_app', { bundleId }),
    
  getBlockedApps: (): Promise<string[]> => 
    invoke('get_blocked_apps'),
}
```

---

## Database Schema (Telemetry)

### New Tables

```sql
-- Telemetry events (all raw events)
CREATE TABLE telemetry_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,        -- 'app_change', 'idle_start', 'idle_end', etc.
  timestamp INTEGER NOT NULL,
  
  -- App change specific
  from_app_name TEXT,
  from_app_bundle_id TEXT,
  to_app_name TEXT,
  to_app_bundle_id TEXT,
  to_app_category TEXT,
  
  -- Penalty/bonus applied
  penalty_applied REAL,
  bonus_applied REAL,
  bandwidth_before REAL,
  bandwidth_after REAL,
  
  -- Intervention
  intervention_triggered TEXT,      -- 'delay_gate', 'block_screen', null
  intervention_response TEXT,       -- 'returned', 'waited_through', null
  intervention_time_ms INTEGER,
  
  -- Escalation
  offense_number INTEGER,
  escalation_multiplier REAL,
  
  -- Context (JSON)
  context TEXT,
  
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

CREATE INDEX idx_telemetry_session ON telemetry_events(session_id);
CREATE INDEX idx_telemetry_timestamp ON telemetry_events(timestamp);
CREATE INDEX idx_telemetry_type ON telemetry_events(event_type);

-- Session telemetry aggregates
CREATE TABLE session_telemetry_summary (
  session_id TEXT PRIMARY KEY,
  
  -- App switches
  total_app_switches INTEGER DEFAULT 0,
  distraction_switches INTEGER DEFAULT 0,
  apps_visited TEXT,                -- JSON array
  
  -- Interventions
  delay_gates_shown INTEGER DEFAULT 0,
  delay_gates_returned INTEGER DEFAULT 0,
  delay_gates_waited INTEGER DEFAULT 0,
  blocks_shown INTEGER DEFAULT 0,
  
  -- Penalties & Bonuses
  total_penalties REAL DEFAULT 0,
  total_bonuses REAL DEFAULT 0,
  penalty_breakdown TEXT,           -- JSON object
  bonus_breakdown TEXT,             -- JSON object
  
  -- Escalation
  max_offense_number INTEGER DEFAULT 0,
  max_escalation_multiplier REAL DEFAULT 1.0,
  
  -- Extensions (Legend)
  extension_minutes INTEGER DEFAULT 0,
  extension_count INTEGER DEFAULT 0,
  
  -- Computed
  distraction_time_seconds INTEGER DEFAULT 0,
  focused_time_seconds INTEGER DEFAULT 0,
  
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);
```

### Rust Storage Structures

```rust
#[derive(Serialize, Deserialize)]
pub struct TelemetryEventRecord {
    pub id: String,
    pub session_id: String,
    pub event_type: String,
    pub timestamp: u64,
    
    pub from_app_name: Option<String>,
    pub from_app_bundle_id: Option<String>,
    pub to_app_name: Option<String>,
    pub to_app_bundle_id: Option<String>,
    pub to_app_category: Option<String>,
    
    pub penalty_applied: Option<f64>,
    pub bonus_applied: Option<f64>,
    pub bandwidth_before: Option<f64>,
    pub bandwidth_after: Option<f64>,
    
    pub intervention_triggered: Option<String>,
    pub intervention_response: Option<String>,
    pub intervention_time_ms: Option<u64>,
    
    pub offense_number: Option<i32>,
    pub escalation_multiplier: Option<f64>,
    
    pub context: Option<String>,  // JSON string
}

#[derive(Serialize, Deserialize)]
pub struct SessionTelemetrySummary {
    pub session_id: String,
    pub total_app_switches: i32,
    pub distraction_switches: i32,
    pub apps_visited: Vec<String>,
    pub delay_gates_shown: i32,
    pub delay_gates_returned: i32,
    pub delay_gates_waited: i32,
    pub blocks_shown: i32,
    pub total_penalties: f64,
    pub total_bonuses: f64,
    pub max_offense_number: i32,
    pub extension_minutes: i32,
}
```

---

## Threading Model

### Rust Monitor Loop

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   MONITOR THREAD ARCHITECTURE                                   │
│                                                                 │
│   Main Thread (Tauri)                                           │
│   ├── Handles Tauri commands                                    │
│   ├── Manages window                                            │
│   └── Spawns monitor thread                                     │
│                                                                 │
│   Monitor Thread (Background)                                   │
│   ├── Polls macOS APIs every 2 seconds                          │
│   ├── Compares current app to previous                          │
│   ├── Emits events via AppHandle                                │
│   └── Runs until stop signal received                           │
│                                                                 │
│   Communication:                                                │
│   ├── start_telemetry_monitor() → spawns thread                 │
│   ├── stop_telemetry_monitor() → sends stop signal              │
│   └── Events emitted via app_handle.emit_all()                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Pattern

```rust
use std::sync::{Arc, atomic::{AtomicBool, Ordering}};
use std::thread;
use std::time::Duration;

pub struct MonitorState {
    is_running: Arc<AtomicBool>,
    session_id: Arc<Mutex<Option<String>>>,
    last_app: Arc<Mutex<Option<AppInfo>>>,
}

impl MonitorState {
    pub fn new() -> Self {
        Self {
            is_running: Arc::new(AtomicBool::new(false)),
            session_id: Arc::new(Mutex::new(None)),
            last_app: Arc::new(Mutex::new(None)),
        }
    }
    
    pub fn start(&self, app_handle: AppHandle, session_id: String) {
        // Set session ID
        *self.session_id.lock().unwrap() = Some(session_id);
        
        // Mark as running
        self.is_running.store(true, Ordering::SeqCst);
        
        // Clone for thread
        let is_running = self.is_running.clone();
        let last_app = self.last_app.clone();
        let session_id = self.session_id.clone();
        
        // Spawn monitor thread
        thread::spawn(move || {
            while is_running.load(Ordering::SeqCst) {
                // Get current app
                if let Ok(current_app) = get_frontmost_app() {
                    let mut last = last_app.lock().unwrap();
                    
                    // Check if changed
                    if let Some(ref prev) = *last {
                        if prev.bundle_id != current_app.bundle_id {
                            // Emit event
                            let event = AppChangeEvent {
                                from_app: prev.clone(),
                                to_app: current_app.clone(),
                                timestamp: now_ms(),
                                session_id: session_id.lock().unwrap().clone(),
                            };
                            
                            let _ = app_handle.emit_all(EVENT_APP_CHANGED, event);
                        }
                    }
                    
                    // Update last app
                    *last = Some(current_app);
                }
                
                // Sleep before next poll
                thread::sleep(Duration::from_secs(2));
            }
        });
    }
    
    pub fn stop(&self) {
        self.is_running.store(false, Ordering::SeqCst);
        *self.session_id.lock().unwrap() = None;
    }
}
```

---

## Error Handling

### Error Types

```rust
#[derive(Debug, Serialize)]
pub enum TelemetryError {
    // macOS API errors
    AccessibilityPermissionDenied,
    AppInfoUnavailable,
    
    // Monitor errors
    MonitorAlreadyRunning,
    MonitorNotRunning,
    
    // Storage errors
    DatabaseError(String),
    SerializationError(String),
    
    // Blocking errors
    BlockingNotSupported,
    BlockingFailed(String),
}

impl std::fmt::Display for TelemetryError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::AccessibilityPermissionDenied => 
                write!(f, "Accessibility permission required for app monitoring"),
            Self::AppInfoUnavailable => 
                write!(f, "Could not get current app information"),
            Self::MonitorAlreadyRunning => 
                write!(f, "Telemetry monitor is already running"),
            Self::MonitorNotRunning => 
                write!(f, "Telemetry monitor is not running"),
            Self::DatabaseError(e) => 
                write!(f, "Database error: {}", e),
            Self::SerializationError(e) => 
                write!(f, "Serialization error: {}", e),
            Self::BlockingNotSupported => 
                write!(f, "App blocking not supported on this platform"),
            Self::BlockingFailed(e) => 
                write!(f, "Failed to block app: {}", e),
        }
    }
}
```

### Error Propagation

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ERROR PROPAGATION                                             │
│                                                                 │
│   Rust Layer                                                    │
│   ├── macOS API error → TelemetryError                          │
│   ├── Emit error event: "telemetry:monitor_error"               │
│   └── Return Err from Tauri command                             │
│                                                                 │
│   TypeScript Layer                                              │
│   ├── Listen for error events                                   │
│   ├── Handle invoke errors                                      │
│   ├── Update TelemetryState.monitorError                        │
│   └── Show user-friendly error message                          │
│                                                                 │
│   UI Layer                                                      │
│   ├── Show error toast/modal if critical                        │
│   └── Degrade gracefully (continue without telemetry)           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Graceful Degradation

```typescript
// If telemetry fails, app still works

async function handleTelemetrySetup(sessionId: string) {
  try {
    await tauriBridge.startTelemetryMonitor(sessionId)
    setTelemetryEnabled(true)
  } catch (error) {
    console.error('Telemetry failed to start:', error)
    setTelemetryEnabled(false)
    
    // Show non-blocking warning
    toast({
      title: 'Limited functionality',
      description: 'App monitoring unavailable. Session will continue without automatic detection.',
      variant: 'warning',
    })
    
    // Continue session anyway
    // Bandwidth will only respond to time-based decay
  }
}
```

---

## Configuration

### App Categories

```typescript
// src/lib/telemetry/app-categories.ts

export enum AppCategory {
  PRODUCTIVE = 'productive',
  NEUTRAL = 'neutral',
  COMMUNICATION = 'communication',
  SOCIAL_MEDIA = 'social_media',
  ENTERTAINMENT = 'entertainment',
  GAMING = 'gaming',
  UNKNOWN = 'unknown',
}

// Map of bundle IDs to categories
export const BUNDLE_ID_CATEGORIES: Record<string, AppCategory> = {
  // Productive
  'com.microsoft.VSCode': AppCategory.PRODUCTIVE,
  'com.apple.dt.Xcode': AppCategory.PRODUCTIVE,
  'com.googlecode.iterm2': AppCategory.PRODUCTIVE,
  'com.apple.Terminal': AppCategory.PRODUCTIVE,
  'com.figma.Desktop': AppCategory.PRODUCTIVE,
  'notion.id': AppCategory.PRODUCTIVE,
  'md.obsidian': AppCategory.PRODUCTIVE,
  'com.linear': AppCategory.PRODUCTIVE,
  
  // Neutral
  'com.apple.finder': AppCategory.NEUTRAL,
  'com.apple.Preview': AppCategory.NEUTRAL,
  'com.apple.calculator': AppCategory.NEUTRAL,
  'com.apple.iCal': AppCategory.NEUTRAL,
  
  // Communication
  'com.tinyspeck.slackmacgap': AppCategory.COMMUNICATION,
  'com.hnc.Discord': AppCategory.COMMUNICATION,
  'com.apple.MobileSMS': AppCategory.COMMUNICATION,
  'com.apple.mail': AppCategory.COMMUNICATION,
  'us.zoom.xos': AppCategory.COMMUNICATION,
  'com.microsoft.teams': AppCategory.COMMUNICATION,
  
  // Social Media
  'com.twitter.twitter-mac': AppCategory.SOCIAL_MEDIA,
  'com.facebook.Facebook': AppCategory.SOCIAL_MEDIA,
  'com.burbn.instagram': AppCategory.SOCIAL_MEDIA,
  'com.zhiliaoapp.musically': AppCategory.SOCIAL_MEDIA,  // TikTok
  'com.linkedin.LinkedIn': AppCategory.SOCIAL_MEDIA,
  
  // Entertainment
  'com.google.Chrome': AppCategory.NEUTRAL,  // Browser - checked by URL
  'com.apple.Safari': AppCategory.NEUTRAL,   // Browser - checked by URL
  'com.spotify.client': AppCategory.ENTERTAINMENT,
  'com.netflix.Netflix': AppCategory.ENTERTAINMENT,
  'tv.twitch.TwitchApp': AppCategory.ENTERTAINMENT,
  'com.reddit.Reddit': AppCategory.ENTERTAINMENT,
  
  // Gaming
  'com.valvesoftware.steam': AppCategory.GAMING,
}

// Fallback: check app name if bundle ID not found
export const APP_NAME_CATEGORIES: Record<string, AppCategory> = {
  'twitter': AppCategory.SOCIAL_MEDIA,
  'facebook': AppCategory.SOCIAL_MEDIA,
  'instagram': AppCategory.SOCIAL_MEDIA,
  'tiktok': AppCategory.SOCIAL_MEDIA,
  'youtube': AppCategory.ENTERTAINMENT,
  'netflix': AppCategory.ENTERTAINMENT,
  'spotify': AppCategory.ENTERTAINMENT,
  'slack': AppCategory.COMMUNICATION,
  'discord': AppCategory.COMMUNICATION,
  'code': AppCategory.PRODUCTIVE,
  'xcode': AppCategory.PRODUCTIVE,
  'terminal': AppCategory.PRODUCTIVE,
  'iterm': AppCategory.PRODUCTIVE,
}

export function getAppCategory(appInfo: AppInfo): AppCategory {
  // First try bundle ID
  if (BUNDLE_ID_CATEGORIES[appInfo.bundle_id]) {
    return BUNDLE_ID_CATEGORIES[appInfo.bundle_id]
  }
  
  // Then try app name (lowercase)
  const nameLower = appInfo.name.toLowerCase()
  for (const [key, category] of Object.entries(APP_NAME_CATEGORIES)) {
    if (nameLower.includes(key)) {
      return category
    }
  }
  
  // Default to unknown
  return AppCategory.UNKNOWN
}

export function isDistraction(category: AppCategory): boolean {
  return [
    AppCategory.SOCIAL_MEDIA,
    AppCategory.ENTERTAINMENT,
    AppCategory.GAMING,
  ].includes(category)
}

export function requiresIntervention(category: AppCategory, mode: Mode): boolean {
  if (mode === 'Zen') return false
  if (mode === 'Flow') return isDistraction(category)
  if (mode === 'Legend') return isDistraction(category) || category === AppCategory.COMMUNICATION
  return false
}
```

### Mode Weights

```typescript
// src/lib/telemetry/mode-weights.ts

export interface ModeWeights {
  drainWeight: number
  penaltyWeight: number
  bonusWeight: number
}

export const MODE_WEIGHTS: Record<Mode, ModeWeights> = {
  Zen: {
    drainWeight: 1.0,
    penaltyWeight: 1.0,
    bonusWeight: 1.25,
  },
  Flow: {
    drainWeight: 1.0,
    penaltyWeight: 1.25,
    bonusWeight: 1.0,
  },
  Legend: {
    drainWeight: 1.25,
    penaltyWeight: 1.5,
    bonusWeight: 0.75,
  },
}

export function getModeWeights(mode: Mode): ModeWeights {
  return MODE_WEIGHTS[mode]
}
```

### Base Penalties

```typescript
// src/lib/telemetry/penalties.ts

export const BASE_PENALTIES: Record<string, number> = {
  // App switches
  'app_switch_neutral': -2,
  'app_switch_communication': -4,
  'app_switch_social': -8,
  'app_switch_entertainment': -10,
  'app_switch_gaming': -12,
  'app_switch_non_whitelist': -5,
  
  // Block attempts (Legend)
  'block_attempt': -10,
  'repeated_block': -15,
  'bypass_attempt': -20,
}

export const BASE_BONUSES: Record<string, number> = {
  'delay_gate_returned': 5,
  'block_accepted': 3,
  'quick_return': 2,
  'temptation_resisted': 4,
}

export const ESCALATION_MULTIPLIERS: number[] = [
  1.0,    // 1st offense
  1.15,   // 2nd offense
  1.3,    // 3rd offense
  1.4,    // 4th offense
  1.5,    // 5th offense
  1.5,    // 6th+ offense (capped)
]

export const DELAY_GATE_SECONDS: number[] = [
  10,     // 1st offense
  15,     // 2nd offense
  20,     // 3rd offense
  30,     // 4th+ offense (capped)
]

export function getEscalationMultiplier(offenseNumber: number): number {
  const index = Math.min(offenseNumber - 1, ESCALATION_MULTIPLIERS.length - 1)
  return ESCALATION_MULTIPLIERS[Math.max(0, index)]
}

export function getDelayGateSeconds(offenseNumber: number): number {
  const index = Math.min(offenseNumber - 1, DELAY_GATE_SECONDS.length - 1)
  return DELAY_GATE_SECONDS[Math.max(0, index)]
}
```

### Penalty Calculator

```typescript
// src/lib/telemetry/penalty-calculator.ts

import { AppCategory, isDistraction } from './app-categories'
import { getModeWeights, ModeWeights } from './mode-weights'
import { 
  BASE_PENALTIES, 
  BASE_BONUSES, 
  getEscalationMultiplier,
  getDelayGateSeconds 
} from './penalties'

export interface PenaltyResult {
  basePenalty: number
  modeWeight: number
  escalationMultiplier: number
  finalPenalty: number
}

export function calculateAppSwitchPenalty(
  toCategory: AppCategory,
  mode: Mode,
  offenseNumber: number,
  isWhitelisted: boolean
): PenaltyResult {
  // Determine base penalty
  let basePenalty = 0
  
  if (isWhitelisted) {
    basePenalty = 0  // No penalty for whitelisted apps
  } else {
    switch (toCategory) {
      case AppCategory.PRODUCTIVE:
        basePenalty = 0
        break
      case AppCategory.NEUTRAL:
        basePenalty = BASE_PENALTIES['app_switch_neutral']
        break
      case AppCategory.COMMUNICATION:
        basePenalty = BASE_PENALTIES['app_switch_communication']
        break
      case AppCategory.SOCIAL_MEDIA:
        basePenalty = BASE_PENALTIES['app_switch_social']
        break
      case AppCategory.ENTERTAINMENT:
        basePenalty = BASE_PENALTIES['app_switch_entertainment']
        break
      case AppCategory.GAMING:
        basePenalty = BASE_PENALTIES['app_switch_gaming']
        break
      default:
        basePenalty = BASE_PENALTIES['app_switch_non_whitelist']
    }
  }
  
  // Get mode weight
  const modeWeight = getModeWeights(mode).penaltyWeight
  
  // Get escalation (only for distractions)
  const escalationMultiplier = isDistraction(toCategory) 
    ? getEscalationMultiplier(offenseNumber)
    : 1.0
  
  // Calculate final
  const finalPenalty = Math.round(basePenalty * modeWeight * escalationMultiplier * 10) / 10
  
  return {
    basePenalty,
    modeWeight,
    escalationMultiplier,
    finalPenalty,
  }
}

export function calculateBonus(
  bonusType: string,
  mode: Mode
): number {
  const baseBonus = BASE_BONUSES[bonusType] || 0
  const modeWeight = getModeWeights(mode).bonusWeight
  return Math.round(baseBonus * modeWeight * 10) / 10
}

export function getInterventionConfig(
  category: AppCategory,
  mode: Mode,
  offenseNumber: number
): InterventionConfig | null {
  // Zen mode: no interventions
  if (mode === 'Zen') return null
  
  // Not a distraction: no intervention
  if (!isDistraction(category) && category !== AppCategory.COMMUNICATION) {
    return null
  }
  
  // Flow mode: delay gate for distractions
  if (mode === 'Flow' && isDistraction(category)) {
    return {
      type: 'delay_gate',
      delaySeconds: getDelayGateSeconds(offenseNumber),
      canWaitThrough: true,
    }
  }
  
  // Legend mode: communication gets warning first time
  if (mode === 'Legend' && category === AppCategory.COMMUNICATION) {
    if (offenseNumber === 1) {
      return {
        type: 'communication_warning',
        delaySeconds: 30,
        canWaitThrough: true,  // But subsequent times blocked
      }
    } else {
      return {
        type: 'block_screen',
        canWaitThrough: false,
      }
    }
  }
  
  // Legend mode: distractions always blocked
  if (mode === 'Legend' && isDistraction(category)) {
    return {
      type: 'block_screen',
      canWaitThrough: false,
      triggerExtension: offenseNumber === 3 || offenseNumber === 6,
      extensionMinutes: 5,
    }
  }
  
  return null
}

interface InterventionConfig {
  type: 'delay_gate' | 'block_screen' | 'communication_warning'
  delaySeconds?: number
  canWaitThrough: boolean
  triggerExtension?: boolean
  extensionMinutes?: number
}
```

---

## Component Integration

### Hook: useTelemetry

```typescript
// src/hooks/useTelemetry.ts

import { useState, useEffect, useCallback, useRef } from 'react'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { tauriBridge } from '@/lib/tauri-bridge'
import { 
  AppChangeEvent, 
  TelemetryState, 
  InterventionConfig 
} from '@/lib/telemetry/types'
import { getAppCategory, isDistraction } from '@/lib/telemetry/app-categories'
import { calculateAppSwitchPenalty, getInterventionConfig } from '@/lib/telemetry/penalty-calculator'

interface UseTelemetryProps {
  sessionId: string | null
  mode: Mode
  isSessionActive: boolean
  onPenalty: (amount: number) => void
  onBonus: (amount: number) => void
  onIntervention: (config: InterventionConfig, appName: string) => void
}

export function useTelemetry({
  sessionId,
  mode,
  isSessionActive,
  onPenalty,
  onBonus,
  onIntervention,
}: UseTelemetryProps) {
  const [state, setState] = useState<TelemetryState>({
    isMonitoring: false,
    lastAppInfo: null,
    monitorError: null,
    offenseCount: 0,
    offensesByCategory: {},
    offensesByApp: {},
    currentIntervention: null,
    interventionStartTime: null,
    communicationUsed: false,
    communicationTimeRemaining: null,
    extensionMinutes: 0,
    extensionReasons: [],
  })
  
  const unlistenRef = useRef<UnlistenFn | null>(null)
  
  // Start monitoring when session starts
  useEffect(() => {
    if (isSessionActive && sessionId) {
      startMonitoring()
    } else {
      stopMonitoring()
    }
    
    return () => {
      stopMonitoring()
    }
  }, [isSessionActive, sessionId])
  
  const startMonitoring = async () => {
    if (!sessionId) return
    
    try {
      // Start Rust monitor
      await tauriBridge.startTelemetryMonitor(sessionId)
      
      // Listen for events
      unlistenRef.current = await listen<AppChangeEvent>(
        'telemetry:app_changed',
        (event) => handleAppChange(event.payload)
      )
      
      setState(prev => ({ 
        ...prev, 
        isMonitoring: true, 
        monitorError: null,
        // Reset offense tracking for new session
        offenseCount: 0,
        offensesByCategory: {},
        offensesByApp: {},
      }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isMonitoring: false, 
        monitorError: String(error) 
      }))
    }
  }
  
  const stopMonitoring = async () => {
    if (unlistenRef.current) {
      unlistenRef.current()
      unlistenRef.current = null
    }
    
    try {
      await tauriBridge.stopTelemetryMonitor()
    } catch (error) {
      // Ignore errors on stop
    }
    
    setState(prev => ({ ...prev, isMonitoring: false }))
  }
  
  const handleAppChange = useCallback((event: AppChangeEvent) => {
    const toCategory = getAppCategory(event.to_app)
    
    // Check if this is a distraction
    if (!isDistraction(toCategory) && toCategory !== AppCategory.COMMUNICATION) {
      // Update last app, no penalty
      setState(prev => ({ ...prev, lastAppInfo: event.to_app }))
      return
    }
    
    // Increment offense count
    setState(prev => {
      const newOffenseCount = prev.offenseCount + 1
      const newOffensesByCategory = {
        ...prev.offensesByCategory,
        [toCategory]: (prev.offensesByCategory[toCategory] || 0) + 1,
      }
      const newOffensesByApp = {
        ...prev.offensesByApp,
        [event.to_app.name]: (prev.offensesByApp[event.to_app.name] || 0) + 1,
      }
      
      // Calculate penalty
      const penaltyResult = calculateAppSwitchPenalty(
        toCategory,
        mode,
        newOffenseCount,
        false // TODO: check whitelist
      )
      
      // Apply penalty
      if (penaltyResult.finalPenalty !== 0) {
        onPenalty(penaltyResult.finalPenalty)
      }
      
      // Check for intervention
      const interventionConfig = getInterventionConfig(
        toCategory,
        mode,
        newOffenseCount
      )
      
      if (interventionConfig) {
        onIntervention(interventionConfig, event.to_app.name)
      }
      
      return {
        ...prev,
        lastAppInfo: event.to_app,
        offenseCount: newOffenseCount,
        offensesByCategory: newOffensesByCategory,
        offensesByApp: newOffensesByApp,
      }
    })
  }, [mode, onPenalty, onIntervention])
  
  const handleInterventionResponse = useCallback((
    response: 'returned' | 'waited_through'
  ) => {
    if (response === 'returned') {
      // Apply bonus
      const bonus = calculateBonus('delay_gate_returned', mode)
      onBonus(bonus)
    }
    
    setState(prev => ({
      ...prev,
      currentIntervention: null,
      interventionStartTime: null,
    }))
  }, [mode, onBonus])
  
  return {
    state,
    handleInterventionResponse,
  }
}
```

### Integration with App.tsx

```typescript
// In App.tsx, add telemetry integration

const [interventionConfig, setInterventionConfig] = useState<InterventionConfig | null>(null)
const [interventionApp, setInterventionApp] = useState<string | null>(null)

const { state: telemetryState, handleInterventionResponse } = useTelemetry({
  sessionId: sessionManager.currentSession?.sessionId ?? null,
  mode: sessionManager.currentSession?.mode ?? 'Flow',
  isSessionActive: mode === 'session',
  onPenalty: (amount) => {
    // This is called by useTelemetry when penalty should be applied
    // useBandwidthEngine should expose a method to apply external penalties
    bandwidthEngine.applyPenalty(amount)
  },
  onBonus: (amount) => {
    bandwidthEngine.applyBonus(amount)
  },
  onIntervention: (config, appName) => {
    setInterventionConfig(config)
    setInterventionApp(appName)
  },
})

// Render intervention
{interventionConfig?.type === 'delay_gate' && (
  <DelayGate
    appName={interventionApp!}
    delaySeconds={interventionConfig.delaySeconds!}
    intention={sessionManager.currentSession?.intention}
    bandwidth={bandwidthState.current}
    onReturn={() => {
      handleInterventionResponse('returned')
      setInterventionConfig(null)
    }}
    onWaitThrough={() => {
      handleInterventionResponse('waited_through')
      setInterventionConfig(null)
    }}
  />
)}

{interventionConfig?.type === 'block_screen' && (
  <BlockScreen
    appName={interventionApp!}
    intention={sessionManager.currentSession?.intention}
    bandwidth={bandwidthState.current}
    offenseNumber={telemetryState.offenseCount}
    onReturn={() => {
      handleInterventionResponse('returned')
      setInterventionConfig(null)
    }}
  />
)}
```

---

## Summary

### What This Architecture Provides

| Layer | Responsibility |
|-------|----------------|
| **macOS APIs** | Raw system data (active app, idle time) |
| **Rust Monitor** | Polling, change detection, event emission |
| **Rust Storage** | Persist telemetry events to SQLite |
| **Tauri Events** | Bridge between Rust and TypeScript |
| **TypeScript Listener** | Receive events, route to handlers |
| **Penalty Calculator** | Compute penalties with mode weights |
| **State Manager** | Track offenses, escalation, interventions |
| **React UI** | Display interventions, update bandwidth |

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Polling (not hooks)** | macOS doesn't provide reliable app change events |
| **2-second poll interval** | Balance between responsiveness and CPU usage |
| **Events over commands** | Rust pushes updates, TypeScript doesn't poll |
| **Offense tracking in TypeScript** | Easier state management, React-friendly |
| **Penalties in TypeScript** | Mode weights and escalation logic stays with UI |
| **Persistence in Rust** | SQLite operations stay fast, off main thread |

### Files to Create

| File | Purpose |
|------|---------|
| `src-tauri/src/telemetry/mod.rs` | Module exports |
| `src-tauri/src/telemetry/types.rs` | Rust structs |
| `src-tauri/src/telemetry/app_monitor.rs` | macOS detection |
| `src-tauri/src/telemetry/monitor_loop.rs` | Polling loop |
| `src-tauri/src/telemetry/events.rs` | Tauri events |
| `src-tauri/src/telemetry/persistence.rs` | SQLite storage |
| `src/lib/telemetry/types.ts` | TypeScript interfaces |
| `src/lib/telemetry/app-categories.ts` | App classification |
| `src/lib/telemetry/mode-weights.ts` | Mode multipliers |
| `src/lib/telemetry/penalties.ts` | Base values |
| `src/lib/telemetry/penalty-calculator.ts` | Calculation logic |
| `src/lib/telemetry/telemetry-listener.ts` | Event listener |
| `src/hooks/useTelemetry.ts` | React hook |
| `src/components/interventions/DelayGate.tsx` | Flow mode UI |
| `src/components/interventions/BlockScreen.tsx` | Legend mode UI |

---