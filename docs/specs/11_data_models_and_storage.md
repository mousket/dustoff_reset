

# **11 - Data Models and Storage Specification**

**Version:** 1.0**Last Updated:** January 12, 2026**Purpose:** Complete specification of all data models, storage mechanisms, persistence patterns, and planned migration to Tauri/SQLite for Human Capacity OS.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Storage Architecture](#2-storage-architecture)
3. [Core Data Models](#3-core-data-models)
4. [Storage Keys and Namespaces](#4-storage-keys-and-namespaces)
5. [Persistence Functions](#5-persistence-functions)
6. [Data Relationships](#6-data-relationships)
7. [Migration to Tauri/SQLite](#7-migration-to-taurisqlite)
8. [Implementation Notes](#8-implementation-notes)


---

## 1. Overview

### 1.1 Current Architecture (Phase 1)

**Storage Layer:** Browser `localStorage` (JSON-serialized)**Environment:** Next.js web application (SSR-safe)**Persistence:** Client-side only, per-browser isolation

**Key Characteristics:**

- Synchronous read/write operations
- 5-10MB storage limit per origin
- No server synchronization
- Data survives page reloads but not browser data clears


---

### 1.2 Target Architecture (Phase 2)

**Storage Layer:** SQLite database via Tauri**Environment:** Native desktop application (Rust + Tauri)**Persistence:** File-system backed, cross-session durable

**Key Improvements:**

- Unlimited storage capacity
- Relational queries and indexes
- Transactions and ACID guarantees
- Background sync capabilities
- Cross-device sync potential


---

## 2. Storage Architecture

### 2.1 Storage Keys (localStorage)

```typescript
const STORAGE_KEYS = {
  ONBOARDING: "dustoff_onboarding",
  TEMP_ONBOARDING: "dustoff_temp_onboarding",
  USER: "dustoff_user",
  SESSIONS: "dustoff_sessions",
  PARKING_LOT: "dustoff_parking_lot",
  BANDWIDTH: "dustoff_bandwidth",
  SHOCK_MIRROR: "dustoff_shock_mirror",
  AUTH: "dustoff_auth",
  USER_REGISTRY: "dustoff_user_registry",
  DAILY_CALIBRATION: "dustoff_daily_calibration",
}
```

**Alternative Keys (Newer System):**

```typescript
const ALT_STORAGE_KEYS = {
  SESSIONS: "hcos_sessions",
  REFLECTIONS: "hcos_reflections",
  RECOVERY: "hcos_session_recovery",
}
```

---

### 2.2 Data Domains

| Domain | Storage Key | Purpose | Size | Frequency
|-----|-----|-----|-----|-----
| **Onboarding** | `dustoff_onboarding` | Onboarding completion state | Small | Once
| **User Profile** | `dustoff_user` | User settings and preferences | Small | Rare
| **Authentication** | `dustoff_auth` | Auth state and progress tracking | Small | Per session
| **Calibration** | `dustoff_daily_calibration` | Daily bandwidth calibration | Small | Daily
| **Sessions** | `dustoff_sessions` / `hcos_sessions` | Session records | Large | Per session
| **Parking Lot** | `dustoff_parking_lot` | Task/thought capture | Medium | Frequent
| **Bandwidth** | `dustoff_bandwidth` | Bandwidth history | Medium | Per session
| **Shock Mirror** | `dustoff_shock_mirror` | Session analysis reports | Large | Per session
| **User Registry** | `dustoff_user_registry` | Mock user accounts | Small | Rare


---

## 3. Core Data Models

### 3.1 User & Authentication

#### **OnboardingData**

```typescript
interface OnboardingData {
  completed: boolean
  version: string           // "v1.4"
  completedAt: string | null
}
```

---

#### **UserData**

```typescript
interface UserData {
  email: string | null
  firstName: string | null
  lastName: string | null
  operatorName: string | null
  initialBandwidth: number | null
  defaultMode: Mode | null  // "ZEN" | "FLOW" | "LEGEND"
  publicCommitment: boolean
  intention: string
  dayStartTime: string | null
  workBlockDuration: number | null
  trackWeekends: "ALWAYS" | "PROMPT" | "NEVER" | null
  deepWorkProfile: Array<{
    type: string
    priority: number
  }>
}
```

---

#### **AuthData**

```typescript
interface AuthData {
  isAuthenticated: boolean
  username: string | null
  email: string | null
  registeredAt: string | null
  onboardingCompleted: boolean
  onboardingPhase1Completed: boolean
  onboardingPhase2Completed: boolean
  firstSessionCompleted: boolean
  phase2Dismissed: number
  calibrationCount: number
  lastCalibration: string | null
}
```

---

#### **RegisteredUser**

```typescript
interface RegisteredUser {
  username: string
  email: string
  password: string  // ⚠️ In production, this would be hashed
  registeredAt: string
}
```

---

#### **UserRegistry**

```typescript
interface UserRegistry {
  users: RegisteredUser[]
}

// Default registry
const DEFAULT_USER_REGISTRY: UserRegistry = {
  users: [
    {
      username: "operator",
      email: "operator@dustoff.dev",
      password: "dustoff2025",
      registeredAt: "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 3.2 Session Management

#### **Session**(Primary Model)

```typescript
interface Session {
  id: string
  mode: "ZEN" | "LEGEND" | "FLOW"
  intention: string
  durationPlanned: number
  startTime: string         // ISO 8601
  endTime: string | null    // ISO 8601
  status: "ACTIVE" | "COMPLETED" | "FAILED" | "ABANDONED"
  result: "SUCCESS" | "FAILED" | "ABANDONED" | null
  
  // App and browser tracking
  intendedApps: AppWhitelist[]
  browserTabs: BrowserTabIntent[]
  expectedDistractions: ExpectedDistraction[]
  
  // Event history
  events: SessionEvent[]
  flowSegments: FlowSegment[]
  cognitiveFrictionEvents: CognitiveFrictionEvent[]
  
  // Metrics
  bandwidthChange: number | null
  selfReportedFocus: number | null
  selfReportedDrain: number | null
  endReason: string | null
  
  // Analysis
  shockMirror: ShockMirrorReport | null
  legendState?: "ACTIVE" | "AT_RISK" | "FAILED"
}
```

---

#### **SessionRecord**(Alternative Model)

```typescript
interface SessionRecord {
  sessionId: string
  startedAt: string         // ISO 8601
  endedAt: string           // ISO 8601
  plannedDurationMinutes: number
  actualDurationMinutes: number
  mode: "Zen" | "Flow" | "Legend"
  victoryLevel: "Minimum" | "Good" | "Legend" | "Missed"
  
  // Metrics
  flowEfficiency: number              // 0-100 percentage
  longestStreakMinutes: number
  distractionAttempts: number
  interventionsUsed: number
  
  // Lifecycle
  endReason: "mission_complete" | "stopping_early" | "pulled_away"
  endSubReason?: string
  
  // Timeline
  timelineBlocks: Array<{
    start: number           // Minutes since session start
    end: number             // Minutes since session start
    state: "flow" | "working" | "distracted" | "reset"
  }>
  
  // Events
  distractionEvents: Array<{ timestamp: number; type: string }>
  interventionEvents: Array<{ timestamp: number; type: string }>
  
  // Reflection
  reflection: ReflectionObject | null
}
```

---

#### **AppWhitelist**

```typescript
interface AppWhitelist {
  appName: string
  purpose: 
    | "Primary Work"
    | "Research/Reference"
    | "Communication"
    | "Ambient Support"
    | "Learning/Tutorial"
    | "Other"
}
```

---

#### **BrowserTabIntent**

```typescript
interface BrowserTabIntent {
  url: string
  title: string
  purpose: 
    | "Primary Work"
    | "Research/Reference"
    | "Ambient Support"
    | "Learning/Tutorial"
    | "Communication"
    | "Other"
}
```

---

#### **SessionEvent**

```typescript
type EventType =
  | "SESSION_STARTED"
  | "SESSION_ENDED"
  | "FLOW_STARTED"
  | "FLOW_ENDED"
  | "DRIFT_DETECTED"
  | "DISTRACTION_DETECTED"
  | "PARKING_LOT_CAPTURE"
  | "INTERVENTION_TRIGGERED"
  | "INTERVENTION_ACCEPTED"
  | "INTERVENTION_IGNORED"
  | "BANDWIDTH_CHANGED"
  | "LEGEND_WARNING"
  | "LEGEND_FAILURE"

interface SessionEvent {
  id: string
  sessionId: string
  type: EventType
  timestamp: string         // ISO 8601
  metadata?: Record<string, any>
}
```

---

#### **FlowSegment**

```typescript
interface FlowSegment {
  id: string
  sessionId: string
  startTime: string         // ISO 8601
  endTime: string | null    // ISO 8601
  durationMinutes: number
  appName: string
  depth: 1 | 2 | 3          // Flow depth level
}
```

---

#### **CognitiveFrictionEvent**

```typescript
type FrictionType = "KEYBOARD" | "MOUSE" | "CURSOR"

interface CognitiveFrictionEvent {
  id: string
  sessionId: string
  type: FrictionType
  timestamp: string         // ISO 8601
  intensity: 1 | 2 | 3 | 4 | 5
  duration: number          // Milliseconds
  context?: string
}
```

---

#### **ReflectionObject**

```typescript
interface ReflectionObject {
  sessionId: string
  whatWentWell: string
  frictionNotes?: string
  closingEnergy: number     // 1-5 emoji scale
  skipped: boolean
  createdAt: string         // ISO 8601
}
```

---

#### **RecoveryData**(Session Recovery)

```typescript
interface RecoveryData {
  sessionId: string
  startedAt: string
  plannedDurationMinutes: number
  mode: "Zen" | "Flow" | "Legend"
  intention: string
  elapsedSeconds: number
}
```

---

### 3.3 Parking Lot

#### **ParkingLotItem**

```typescript
interface ParkingLotItem {
  id: string
  text: string
  timestamp: string         // ISO 8601
  sessionId: string | null
  status: "OPEN" | "COMPLETED" | "DELETED"
}
```

---

#### **ParkingLotItemFull**(Extended Model)

```typescript
interface ParkingLotItemFull extends ParkingLotItem {
  createdAt: string         // ISO 8601
  updatedAt: string         // ISO 8601
  itemStatus?: "new" | "in-progress" | "done"
  
  // Harvest workflow additions
  category?: "task" | "idea" | "reminder" | "distraction"
  tags?: string[]
  action?: "next-session" | "keep" | "delete"
  resolvedAt?: string       // ISO 8601
}
```

---

### 3.4 Bandwidth

#### **BandwidthData**

```typescript
interface BandwidthData {
  currentScore: number      // 0-100
  lastUpdated: string       // ISO 8601
  history: BandwidthSnapshot[]
}
```

---

#### **BandwidthSnapshot**

```typescript
type BandwidthSource =
  | "PRE_SESSION"
  | "DURING_SESSION"
  | "POST_SESSION"
  | "INTERVENTION"
  | "FLOW"
  | "DRIFT"
  | "FRICTION"

interface BandwidthSnapshot {
  timestamp: string         // ISO 8601
  score: number             // 0-100
  source: BandwidthSource
  reason?: string
}
```

---

#### **BandwidthEvent**

```typescript
interface BandwidthEvent {
  type:
    | "friction"
    | "focus-slipping"
    | "non-whitelisted-app"
    | "tab-switch"
    | "app-switch"
    | "sustained-focus"
    | "flow-celebration"
    | "breath-reset"
    | "walk-reset"
    | "dump-reset"
  timestamp: number         // Milliseconds since epoch
  details?: any
}
```

---

#### **BandwidthState**(Runtime State)

```typescript
interface BandwidthState {
  currentBandwidth: number
  lastEventTimestamp: number
  sustainedFocusMinutes: number
  lastSwitchTimestamp: number
  switchCount: number
  nonWhitelistedAppHistory: Map<string, number>
  flowState: FlowState
}
```

---

#### **FlowState**

```typescript
interface FlowState {
  isActive: boolean
  sustainedFocusMinutes: number
  flowEligible: boolean
  flowTriggered: boolean
  flowCelebrationTriggered: boolean
  flowStreakMinutes: number
  lastInterruptionTimestamp: number
  conditionsValid: boolean
}
```

---

### 3.5 Calibration

#### **DailyCalibrationStorage**

```typescript
interface DailyCalibrationStorage {
  date: string              // YYYY-MM-DD (workday-adjusted)
  calibrationScore: number  // 0-100
  calibrationData: {
    sleepHours: number
    sleepQuality: number
    emotionalResidue: number
    emotionalState: string
    distractions: string[]
  }
  timestamp: number         // Milliseconds since epoch
}
```

---

#### **CalibrationData**

```typescript
interface CalibrationData {
  sleepHours: number        // 3-12 hours
  sleepQuality: number      // 1-10 scale
  emotionalResidue: number  // 1-10 scale (inverted)
  emotionalState: 
    | "Energized"
    | "Focused"
    | "Calm"
    | "Tired"
    | "Anxious"
    | "Scattered"
  distractions: string[]    // Array of distraction types
}
```

---

#### **CalibrationScore**

```typescript
interface CalibrationScore {
  sleepScore: number        // 0-40
  emotionalScore: number    // 0-40
  distractionScore: number  // 0-20
  totalScore: number        // 0-100
  timestamp: number         // Milliseconds since epoch
}
```

---

#### **PreSessionData**

```typescript
interface PreSessionData {
  sessionType: "deep" | "parking-lot" | "administrative"
  mode?: "Zen" | "Flow" | "Legend"
  duration?: number
  preparationMinutes?: number
  preparationChecklist?: string[]
  emotionalGrounding?: number
  whitelistedApps?: string[]
  whitelistedBrowser?: string
  whitelistedTabs?: string[]
}
```

---

#### **InitialBandwidth**

```typescript
interface InitialBandwidth {
  baseCalibrationScore: number
  modeModifier: number
  prepModifier: number
  whitelistModifier: number
  totalBandwidth: number    // Clamped 40-100
  timestamp: number
}
```

---

#### **Calibration Screen Data Models**

**SleepData:**

```typescript
interface SleepData {
  bedtime: string
  wakeTime: string
  startOfDay: string
  sleepSufficient: "yes" | "no" | "notSure" | ""
  restfulness: number       // 1-10 scale
}
```

**Screen3Data (Emotional State):**

```typescript
interface Screen3Data {
  emotionalState: "CLEAR" | "FOCUSED" | "SCATTERED" | "HEAVY" | "DRAINED"
  cognitiveLoad: 1 | 2 | 3 | 4 | 5
}
```

**Screen4Data (Distractions):**

```typescript
type DistractionOption =
  | "EMAIL"
  | "SLACK_TEAMS"
  | "PHONE"
  | "PEOPLE"
  | "ERRANDS"
  | "EMOTIONAL"
  | "SOCIAL_MEDIA"
  | "THOUGHTS_TASKS"

interface Screen4Data {
  distractions: string[]
  distractionNotes: string
  obstacles: string
}
```

**Screen5Data (Intention):**

```typescript
interface Screen5Data {
  primaryIntention: string
  secondaryIntentions: string[]
  specificTasks: string[]
}
```

---

### 3.6 Shock Mirror (Session Analysis)

#### **ShockMirrorReport**

```typescript
interface ShockMirrorReport {
  sessionId: string
  
  // Minute-by-minute timeline
  timeline: Array<{
    minute: number
    state: "FOCUSED" | "DRIFTING" | "DISTRACTED" | "FLOW" | "IDLE"
    app?: string
    details?: string
  }>
  
  // Flow analysis
  flowMap: {
    totalMinutes: number
    segments: FlowSegment[]
    breakReasons: string[]
  }
  
  // Distraction analysis
  driftMap: {
    events: Array<{
      timestamp: string
      type: "APP" | "TAB" | "IDLE" | "DISTRACTION"
      details: string
    }>
  }
  
  // Friction analysis
  frictionMap: {
    events: CognitiveFrictionEvent[]
    clusters: Array<{
      startTime: string
      endTime: string
      intensity: number
    }>
  }
  
  // Bandwidth analysis
  bandwidthMap: {
    start: number
    end: number
    delta: number
    snapshots: BandwidthSnapshot[]
  }
  
  // Legend mode specific
  legendMap?: {
    warnings: number
    failures: number
    integrityScore: number
  }
  
  // Summary
  narrative: string
}
```

---

## 4. Storage Keys and Namespaces

### 4.1 Primary Storage Keys

```typescript
// Current system (Dustoff namespace)
const STORAGE_KEYS = {
  ONBOARDING: "dustoff_onboarding",
  TEMP_ONBOARDING: "dustoff_temp_onboarding",
  USER: "dustoff_user",
  SESSIONS: "dustoff_sessions",
  PARKING_LOT: "dustoff_parking_lot",
  BANDWIDTH: "dustoff_bandwidth",
  SHOCK_MIRROR: "dustoff_shock_mirror",
  AUTH: "dustoff_auth",
  USER_REGISTRY: "dustoff_user_registry",
  DAILY_CALIBRATION: "dustoff_daily_calibration",
} as const
```

---

### 4.2 Alternative Storage Keys

```typescript
// Alternative system (HCOS namespace)
const ALT_STORAGE_KEYS = {
  SESSIONS: "hcos_sessions",
  REFLECTIONS: "hcos_reflections",
  RECOVERY: "hcos_session_recovery",
} as const
```

---

### 4.3 JSON Data Files (Defaults)

```typescript
// data/bandwidth.json
{
  "currentScore": 70,
  "lastUpdated": "",
  "history": []
}

// data/parkingLot.json
{
  "items": []
}
```

---

## 5. Persistence Functions

### 5.1 Read Functions

```typescript
// Generic pattern for all read functions
export function readX(): XData {
  if (typeof window === "undefined") return DEFAULT_X
  const stored = localStorage.getItem(STORAGE_KEYS.X)
  return stored ? JSON.parse(stored) : DEFAULT_X
}
```

**Examples:**

```typescript
export function readOnboarding(): OnboardingData
export function readUser(): UserData
export function readSessions(): SessionsData
export function readParkingLot(): ParkingLotData
export function readBandwidth(): BandwidthData
export function readShockMirror(): ShockMirrorData
export function readAuth(): AuthData
export function readUserRegistry(): UserRegistry
export function loadDailyCalibration(): DailyCalibrationStorage | null
```

---

### 5.2 Write Functions

```typescript
// Merge pattern (partial updates)
export function saveX(data: Partial<XData>): void {
  if (typeof window === "undefined") return
  const current = readX()
  const updated = { ...current, ...data }
  localStorage.setItem(STORAGE_KEYS.X, JSON.stringify(updated))
}
```

**Examples:**

```typescript
export function saveOnboarding(data: Partial<OnboardingData>): void
export function saveUser(data: Partial<UserData>): void
export function saveAuth(data: Partial<AuthData>): void
export function saveDailyCalibration(data: DailyCalibrationStorage): void
```

---

### 5.3 Item-Based Write Functions

```typescript
// Upsert pattern (add or update by ID)
export function saveSession(session: Session): void {
  const current = readSessions()
  const existingIndex = current.sessions.findIndex((s) => s.id === session.id)
  
  if (existingIndex >= 0) {
    current.sessions[existingIndex] = session
  } else {
    current.sessions.push(session)
  }
  
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(current))
}
```

**Examples:**

```typescript
export function saveSession(session: Session): void
export function saveParkingLotItem(item: ParkingLotItem): void
export function saveBandwidthSnapshot(snapshot: BandwidthSnapshot): void
export function saveShockMirrorReport(report: ShockMirrorReport): void
export function saveUserRegistry(data: UserRegistry): void
```

---

### 5.4 Helper Functions

#### **Session Helpers:**

```typescript
export function getActiveSession(): Session | null
export function getRecentSessions(limit = 10): Session[]
export function getCurrentSession(): SessionRecord | undefined
export function saveSessionRecord(session: SessionRecord): void
```

#### **Parking Lot Helpers:**

```typescript
export function getAllParkingLotItems(): ParkingLotItemFull[]
export function getActiveParkingLotItems(): ParkingLotItemFull[]
export function getPendingParkingLotItems(): ParkingLotItemFull[]
export function getNextSessionItems(): ParkingLotItemFull[]
export function getKeptItems(): ParkingLotItemFull[]

export function addParkingLotItem(text: string): ParkingLotItemFull
export function updateParkingLotItem(id: string, updates: Partial<ParkingLotItemFull>): void
export function deleteParkingLotItem(id: string): void
export function completeParkingLotItem(id: string): void
export function updateParkingLotItemStatus(id: string, status: "new" | "in-progress" | "done"): void
export function updateParkingLotItemHarvestAction(
  id: string,
  category: "task" | "idea" | "reminder" | "distraction",
  tags: string[],
  action: "next-session" | "keep" | "delete"
): void
```

#### **Bandwidth Helpers:**

```typescript
export function updateBandwidth(
  score: number, 
  source: BandwidthSource, 
  reason?: string
): void
```

#### **Calibration Helpers:**

```typescript
export function hasCalibratedToday(): boolean
export function clearDailyCalibration(): void
```

#### **Authentication Helpers:**

```typescript
export function registerUser(
  username: string, 
  email: string, 
  password: string
): { success: boolean; error?: string }

export function validateLogin(
  usernameOrEmail: string, 
  password: string
): { success: boolean; user?: RegisteredUser; error?: string }

export function logout(): void
```

---

### 5.5 Utility Functions

```typescript
// Reset all data (demo mode)
export function resetAllData(): void

// Clear temp data
export function clearTempOnboardingData(): void
export function clearRecoveryData(): void

// Initialize on first load
export function initializeStorage(): void
export function initDB(): void

// Session recovery
export function saveRecoveryData(data: RecoveryData): void
export function getRecoveryData(): RecoveryData | null
```

---

## 6. Data Relationships

### 6.1 Entity Relationships

```plaintext
User (1)
  ├─> Sessions (N)
  │     ├─> SessionEvents (N)
  │     ├─> FlowSegments (N)
  │     ├─> CognitiveFrictionEvents (N)
  │     ├─> BandwidthSnapshots (N)
  │     └─> ShockMirrorReport (1)
  ├─> ParkingLotItems (N)
  ├─> DailyCalibration (1 per workday)
  └─> BandwidthData (1)
        └─> BandwidthSnapshots (N)
```

---

### 6.2 Foreign Key Patterns

**Session → SessionEvent:**

```typescript
interface SessionEvent {
  sessionId: string  // References Session.id
  // ...
}
```

**Session → ParkingLotItem:**

```typescript
interface ParkingLotItem {
  sessionId: string | null  // Optional reference to Session.id
  // ...
}
```

**Session → ShockMirrorReport:**

```typescript
interface ShockMirrorReport {
  sessionId: string  // References Session.id (unique)
  // ...
}
```

---

## 7. Migration to Tauri/SQLite

### 7.1 Planned Database Schema

**Users Table:**

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    operator_name TEXT,
    initial_bandwidth INTEGER,
    default_mode TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

**Sessions Table:**

```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    mode TEXT NOT NULL,
    intention TEXT,
    duration_planned INTEGER,
    start_time TEXT NOT NULL,
    end_time TEXT,
    status TEXT NOT NULL,
    result TEXT,
    bandwidth_start REAL,
    bandwidth_end REAL,
    victory_level TEXT,
    flow_efficiency REAL,
    longest_streak_minutes INTEGER,
    distraction_attempts INTEGER,
    interventions_used INTEGER,
    end_reason TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

**Parking Lot Table:**

```sql
CREATE TABLE parking_lot_items (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    session_id TEXT,
    text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN',
    category TEXT,
    tags TEXT,  -- JSON array
    action TEXT,
    timestamp TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);
```

---

**Calibrations Table:**

```sql
CREATE TABLE calibrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    calibration_score REAL NOT NULL,
    sleep_hours REAL NOT NULL,
    sleep_quality INTEGER NOT NULL,
    emotional_residue INTEGER NOT NULL,
    emotional_state TEXT NOT NULL,
    distractions TEXT,  -- JSON array
    timestamp INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

**Bandwidth Snapshots Table:**

```sql
CREATE TABLE bandwidth_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id TEXT,
    timestamp TEXT NOT NULL,
    score REAL NOT NULL,
    source TEXT NOT NULL,
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);
```

---

**Timeline Blocks Table:**

```sql
CREATE TABLE timeline_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    state TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);
```

---

### 7.2 Migration Strategy

**Phase 1 → Phase 2 Data Migration:**

1. **Export from localStorage:**


```typescript
function exportAllData(): {
  users: UserData[]
  sessions: Session[]
  parkingLot: ParkingLotItem[]
  bandwidth: BandwidthData
  calibrations: DailyCalibrationStorage[]
} {
  return {
    users: [readUser()],
    sessions: readSessions().sessions,
    parkingLot: readParkingLot().items,
    bandwidth: readBandwidth(),
    calibrations: [loadDailyCalibration()].filter(Boolean)
  }
}
```

2. **Import to SQLite:**


```rust
// Tauri command
#[tauri::command]
async fn import_legacy_data(data: LegacyDataExport) -> Result<(), String> {
  // Insert users
  // Insert sessions
  // Insert parking lot items
  // Insert bandwidth snapshots
  // Insert calibrations
  Ok(())
}
```

3. **Validation:**


- Verify all records migrated
- Check foreign key integrity
- Validate JSON fields
- Confirm timestamps converted correctly


---

### 7.3 Tauri Storage Commands

```typescript
// Tauri IPC commands (TypeScript bindings)
import { invoke } from '@tauri-apps/api/tauri'

// Sessions
await invoke('save_session', { session })
await invoke('get_session', { sessionId })
await invoke('get_all_sessions')

// Parking Lot
await invoke('save_parking_lot_item', { item })
await invoke('get_parking_lot_items')
await invoke('update_parking_lot_item', { id, updates })

// Calibration
await invoke('save_calibration', { calibration })
await invoke('get_calibration', { date })

// Bandwidth
await invoke('save_bandwidth_snapshot', { snapshot })
await invoke('get_bandwidth_history', { limit })
```

---

## 8. Implementation Notes

### 8.1 SSR Safety

All storage functions check for browser environment:

```typescript
if (typeof window === "undefined") return DEFAULT_VALUE
```

This prevents Next.js SSR errors when localStorage is accessed during server rendering.

---

### 8.2 Default Values

Every read function has a default fallback:

```typescript
const DEFAULT_USER: UserData = {
  email: null,
  firstName: null,
  // ... all fields initialized
}

export function readUser(): UserData {
  if (typeof window === "undefined") return DEFAULT_USER
  const stored = localStorage.getItem(STORAGE_KEYS.USER)
  return stored ? JSON.parse(stored) : DEFAULT_USER
}
```

---

### 8.3 Workday Date Logic

Calibration uses a **5am boundary** for workday calculation:

```typescript
function getWorkdayDate(): string {
  const now = new Date()
  const hours = now.getHours()
  
  // Before 5am = still previous workday
  if (hours < 5) {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toLocaleDateString("en-CA")  // YYYY-MM-DD
  }
  
  return now.toLocaleDateString("en-CA")
}
```

---

### 8.4 Error Handling

```typescript
export function loadDailyCalibration(): DailyCalibrationStorage | null {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem(CALIBRATION_KEY)
    if (!stored) return null
    return JSON.parse(stored)
  } catch (error) {
    console.error("[v0] Failed to load calibration:", error)
    return null
  }
}
```

---

### 8.5 Testing Recommendations

**Unit Tests:**

```typescript
describe('Storage Functions', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  
  it('should save and retrieve user data', () => {
    saveUser({ email: 'test@example.com' })
    const user = readUser()
    expect(user.email).toBe('test@example.com')
  })
  
  it('should handle SSR gracefully', () => {
    // Mock window as undefined
    global.window = undefined as any
    const user = readUser()
    expect(user).toEqual(DEFAULT_USER)
  })
})
```

---

### 8.6 JSON Serialization Gotchas

**Date Objects:**

```typescript
// ❌ WRONG: Date objects don't serialize well
const session = {
  startTime: new Date()
}

// ✅ CORRECT: Use ISO 8601 strings
const session = {
  startTime: new Date().toISOString()
}
```

**Map Objects:**

```typescript
// ❌ WRONG: Maps don't serialize
const state = {
  history: new Map()
}

// ✅ CORRECT: Use plain objects or arrays
const state = {
  history: {}
}
```

---

**End of Data Models and Storage Specification**

---

**You can now save this as `documentation/11_data_models_and_storage.md`**

This document provides complete specifications for all data models, storage keys, persistence functions, entity relationships, and the planned migration from localStorage to Tauri/SQLite. All models match the current implementation in version 104.