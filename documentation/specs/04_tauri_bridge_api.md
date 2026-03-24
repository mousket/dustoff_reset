Thought for 2sI understand - I won't risk breaking version 104. Instead, I'll provide you the complete Tauri Bridge API documentation as text that you can save manually. This way there's zero risk of file corruption.

---

# **Tauri Bridge API Documentation**

Here's the complete documentation you can copy and save as `documentation/04_tauri_bridge_api.md`:

```markdown
# 04 - Tauri Bridge API Specification

**Version:** 1.0  
**Last Updated:** January 12, 2026  
**Purpose:** Complete specification of all Tauri IPC commands needed to migrate Human Capacity OS from browser-based Next.js to native Tauri desktop application.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Data Storage Commands](#2-data-storage-commands)
3. [System Integration Commands](#3-system-integration-commands)
4. [Window Management Commands](#4-window-management-commands)
5. [Notification Commands](#5-notification-commands)
6. [Data Migration Strategy](#6-data-migration-strategy)
7. [Error Handling](#7-error-handling)
8. [TypeScript Interfaces](#8-typescript-interfaces)
9. [Implementation Checklist](#9-implementation-checklist)

---

## 1. Overview

### 1.1 Purpose

This document specifies all Tauri commands required to replace browser APIs (localStorage, window methods, etc.) with native desktop functionality.

### 1.2 Architecture

```

┌─────────────────────────────────────────┐
│   React Frontend (TypeScript)          │
│   - All existing React components      │
│   - State management with useState      │
└───────────────┬─────────────────────────┘
│ invoke()
▼
┌─────────────────────────────────────────┐
│   Tauri Bridge Layer (TypeScript)       │
│   - Type-safe wrappers                  │
│   - Error handling                      │
│   - Data serialization                  │
└───────────────┬─────────────────────────┘
│ IPC
▼
┌─────────────────────────────────────────┐
│   Tauri Backend (Rust)                  │
│   - SQLite storage                      │
│   - File system operations              │
│   - System integration                  │
└─────────────────────────────────────────┘

```plaintext

### 1.3 Migration Pattern

**Current (Browser):**
```typescript
localStorage.setItem('hcos_sessions', JSON.stringify(sessions))
const sessions = JSON.parse(localStorage.getItem('hcos_sessions') || '[]')
```

**Migrated (Tauri):**

```typescript
import { invoke } from '@tauri-apps/api/core'
await invoke('save_sessions', { sessions })
const sessions = await invoke<SessionRecord[]>('get_all_sessions')
```

---

## 2. Data Storage Commands

### 2.1 Calibration Storage

#### `save_calibration`

Saves daily calibration data with workday-adjusted date (5am boundary).

**Rust Signature:**

```rust
#[tauri::command]
async fn save_calibration(data: CalibrationData) -> Result<(), String>
```

**TypeScript Invocation:**

```typescript
import { invoke } from '@tauri-apps/api/core'

interface CalibrationData {
  date: string // YYYY-MM-DD (workday adjusted)
  calibrationScore: number
  calibrationData: {
    sleepHours: number
    sleepQuality: number
    emotionalResidue: number
    emotionalState: string
    distractions: string[]
  }
  timestamp: number
}

await invoke('save_calibration', { data: calibrationData })
```

**Storage:** SQLite table `calibrations` or JSON file `calibration.json`

---

#### `load_calibration`

Loads calibration for current workday, auto-expires if date mismatch.

**Rust Signature:**

```rust
#[tauri::command]
async fn load_calibration() -> Result<Option<CalibrationData>, String>
```

**TypeScript Invocation:**

```typescript
const calibration = await invoke<CalibrationData | null>('load_calibration')
if (calibration) {
  console.log('Calibration score:', calibration.calibrationScore)
}
```

**Logic:**

- Calculate workday date (5am boundary in local timezone)
- Query database for matching date
- Return null if expired or not found
- Auto-delete expired calibrations


---

#### `clear_calibration`

Removes current calibration data (for demos/resets).

**Rust Signature:**

```rust
#[tauri::command]
async fn clear_calibration() -> Result<(), String>
```

**TypeScript Invocation:**

```typescript
await invoke('clear_calibration')
```

---

### 2.2 Session Storage

#### `save_session`

Saves or updates a session record with full timeline data.

**Rust Signature:**

```rust
#[tauri::command]
async fn save_session(session: SessionRecord) -> Result<(), String>
```

**TypeScript Invocation:**

```typescript
interface SessionRecord {
  sessionId: string
  startedAt: string
  endedAt: string
  plannedDurationMinutes: number
  actualDurationMinutes: number
  mode: 'Zen' | 'Flow' | 'Legend'
  victoryLevel: 'Minimum' | 'Good' | 'Legend' | 'Missed'
  flowEfficiency: number
  longestStreakMinutes: number
  distractionAttempts: number
  interventionsUsed: number
  endReason: 'mission_complete' | 'stopping_early' | 'pulled_away'
  endSubReason?: string
  timelineBlocks: Array<{
    start: number
    end: number
    state: 'flow' | 'working' | 'distracted' | 'reset'
  }>
  distractionEvents: Array<{ timestamp: number; type: string }>
  interventionEvents: Array<{ timestamp: number; type: string }>
  reflection: ReflectionObject | null
}

await invoke('save_session', { session: sessionRecord })
```

**Storage:** SQLite table `sessions` with JSON columns for arrays

---

#### `get_session`

Retrieves a specific session by ID.

**Rust Signature:**

```rust
#[tauri::command]
async fn get_session(session_id: String) -> Result<Option<SessionRecord>, String>
```

**TypeScript Invocation:**

```typescript
const session = await invoke<SessionRecord | null>('get_session', {
  sessionId: 'session-123'
})
```

---

#### `get_all_sessions`

Retrieves all sessions, optionally filtered by date range.

**Rust Signature:**

```rust
#[tauri::command]
async fn get_all_sessions(
  start_date: Option<String>,
  end_date: Option<String>
) -> Result<Vec<SessionRecord>, String>
```

**TypeScript Invocation:**

```typescript
const sessions = await invoke<SessionRecord[]>('get_all_sessions', {
  startDate: '2026-01-01',
  endDate: '2026-01-31'
})
```

---

#### `save_reflection`

Saves post-session reflection data.

**Rust Signature:**

```rust
#[tauri::command]
async fn save_reflection(reflection: ReflectionObject) -> Result<(), String>
```

**TypeScript Invocation:**

```typescript
interface ReflectionObject {
  sessionId: string
  whatWentWell: string
  frictionNotes?: string
  closingEnergy: number // 1-5
  skipped: boolean
  createdAt: string
}

await invoke('save_reflection', { reflection })
```

---

#### `save_recovery_data`

Saves interrupted session recovery data for crash recovery.

**Rust Signature:**

```rust
#[tauri::command]
async fn save_recovery_data(data: RecoveryData) -> Result<(), String>
```

**TypeScript Invocation:**

```typescript
interface RecoveryData {
  sessionId: string
  startedAt: string
  plannedDurationMinutes: number
  mode: 'Zen' | 'Flow' | 'Legend'
  intention: string
  elapsedSeconds: number
}

await invoke('save_recovery_data', { data: recoveryData })
```

---

#### `get_recovery_data`

Retrieves recovery data if app was interrupted.

**Rust Signature:**

```rust
#[tauri::command]
async fn get_recovery_data() -> Result<Option<RecoveryData>, String>
```

**TypeScript Invocation:**

```typescript
const recovery = await invoke<RecoveryData | null>('get_recovery_data')
if (recovery) {
  // Show interrupted session modal
}
```

---

#### `clear_recovery_data`

Clears recovery data after successful recovery or discard.

**Rust Signature:**

```rust
#[tauri::command]
async fn clear_recovery_data() -> Result<(), String>
```

---

### 2.3 Parking Lot Storage

#### `add_parking_lot_item`

Creates a new parking lot item.

**Rust Signature:**

```rust
#[tauri::command]
async fn add_parking_lot_item(text: String) -> Result<ParkingLotItem, String>
```

**TypeScript Invocation:**

```typescript
interface ParkingLotItem {
  id: string
  text: string
  timestamp: number
  status: 'OPEN' | 'COMPLETED' | 'DELETED' | 'PENDING'
  createdAt: string
  updatedAt: string
  itemStatus?: 'new' | 'in-progress' | 'done'
  category?: 'task' | 'idea' | 'reminder' | 'distraction'
  tags?: string[]
  action?: 'next-session' | 'keep' | 'delete'
  resolvedAt?: string
}

const newItem = await invoke<ParkingLotItem>('add_parking_lot_item', {
  text: 'Review PRs'
})
```

---

#### `update_parking_lot_item`

Updates an existing parking lot item.

**Rust Signature:**

```rust
#[tauri::command]
async fn update_parking_lot_item(
  id: String,
  updates: ParkingLotItemUpdate
) -> Result<(), String>
```

**TypeScript Invocation:**

```typescript
await invoke('update_parking_lot_item', {
  id: 'parking-123',
  updates: {
    text: 'Updated text',
    category: 'task',
    tags: ['urgent', 'work'],
    action: 'next-session'
  }
})
```

---

#### `delete_parking_lot_item`

Marks a parking lot item as deleted.

**Rust Signature:**

```rust
#[tauri::command]
async fn delete_parking_lot_item(id: String) -> Result<(), String>
```

**TypeScript Invocation:**

```typescript
await invoke('delete_parking_lot_item', { id: 'parking-123' })
```

---

#### `get_active_parking_lot_items`

Retrieves all non-deleted, non-completed items.

**Rust Signature:**

```rust
#[tauri::command]
async fn get_active_parking_lot_items() -> Result<Vec<ParkingLotItem>, String>
```

**TypeScript Invocation:**

```typescript
const items = await invoke<ParkingLotItem[]>('get_active_parking_lot_items')
```

---

#### `get_next_session_items`

Retrieves items marked "Add to Next Session" with PENDING status.

**Rust Signature:**

```rust
#[tauri::command]
async fn get_next_session_items() -> Result<Vec<ParkingLotItem>, String>
```

**TypeScript Invocation:**

```typescript
const pendingItems = await invoke<ParkingLotItem[]>('get_next_session_items')
```

---

### 2.4 User Data Storage

#### `save_user`

Saves user profile updates.

**Rust Signature:**

```rust
#[tauri::command]
async fn save_user(updates: UserDataUpdate) -> Result<(), String>
```

**TypeScript Invocation:**

```typescript
interface UserData {
  email: string | null
  firstName: string | null
  lastName: string | null
  operatorName: string | null
  initialBandwidth: number | null
  defaultMode: 'ZEN' | 'LEGEND' | 'FLOW' | null
  publicCommitment: boolean
  intention: string
  dayStartTime: string | null
  workBlockDuration: number | null
  trackWeekends: 'ALWAYS' | 'PROMPT' | 'NEVER' | null
}

await invoke('save_user', {
  updates: {
    operatorName: 'Captain',
    initialBandwidth: 75,
    defaultMode: 'FLOW'
  }
})
```

---

#### `read_user`

Reads user profile data.

**Rust Signature:**

```rust
#[tauri::command]
async fn read_user() -> Result<UserData, String>
```

**TypeScript Invocation:**

```typescript
const user = await invoke<UserData>('read_user')
```

---

### 2.5 Reset Commands

#### `reset_all_data`

Clears all application data (for demos/fresh starts).

**Rust Signature:**

```rust
#[tauri::command]
async fn reset_all_data() -> Result<(), String>
```

**TypeScript Invocation:**

```typescript
await invoke('reset_all_data')
```

---

## 3. System Integration Commands

### 3.1 Clipboard Operations

#### `copy_to_clipboard`

Copies text to system clipboard.

**Rust Signature:**

```rust
#[tauri::command]
async fn copy_to_clipboard(text: String) -> Result<(), String>
```

**TypeScript Invocation:**

```typescript
await invoke('copy_to_clipboard', { text: 'Exported parking lot items' })
```

**Current Usage:** `ParkingLotHarvestPanel` line 73

---

### 3.2 Date & Time Utilities

#### `get_workday_date`

Gets the current workday date (5am boundary adjusted).

**Rust Signature:**

```rust
#[tauri::command]
async fn get_workday_date() -> Result<String, String> // Returns YYYY-MM-DD
```

**TypeScript Invocation:**

```typescript
const workdayDate = await invoke<string>('get_workday_date')
console.log('Current workday:', workdayDate) // "2026-01-12"
```

---

#### `generate_uuid`

Generates a UUID for session IDs.

**Rust Signature:**

```rust
#[tauri::command]
async fn generate_uuid() -> Result<String, String>
```

**TypeScript Invocation:**

```typescript
const sessionId = await invoke<string>('generate_uuid')
```

**Current Usage:** `app/desktop/page.tsx` line 187

---

## 4. Window Management Commands

### 4.1 Window Geometry

#### `get_window_size`

Gets current window dimensions.

**Rust Signature:**

```rust
#[tauri::command]
async fn get_window_size() -> Result<WindowSize, String>
```

**TypeScript Invocation:**

```typescript
interface WindowSize {
  width: number
  height: number
}

const size = await invoke<WindowSize>('get_window_size')
```

**Replaces:** `window.innerWidth`, `window.innerHeight`

---

#### Window Resize Events

**Tauri Event:**

```rust
// Emitted automatically by Tauri
window.emit('tauri://resize', { width, height })
```

**TypeScript Listener:**

```typescript
import { listen } from '@tauri-apps/api/event'

const unlisten = await listen<WindowSize>('tauri://resize', (event) => {
  console.log('Window resized:', event.payload)
})

// Cleanup
unlisten()
```

**Current Usage:** `DraggableContainer` lines 82-89

---

### 4.2 Window State

#### `reload_window`

Reloads the application window.

**Rust Signature:**

```rust
#[tauri::command]
async fn reload_window() -> Result<(), String>
```

**TypeScript Invocation:**

```typescript
await invoke('reload_window')
```

**Current Usage:** `MidSessionIntelligenceTestPanel` line 51 (Reset Calibration button)

---

## 5. Notification Commands

### 5.1 Native Notifications

#### `show_native_notification`

Shows a native OS notification.

**Rust Signature:**

```rust
#[tauri::command]
async fn show_native_notification(
  title: String,
  body: String,
  icon: Option<String>
) -> Result<(), String>
```

**TypeScript Invocation:**

```typescript
await invoke('show_native_notification', {
  title: 'Session Complete',
  body: 'Great work! Ready for reflection.',
  icon: null
})
```

**Use Cases:**

- Overtime nudges when app is in background
- Session completion notifications
- Calibration reminders


---

## 6. Data Migration Strategy

### 6.1 Web to Desktop Migration

On first launch, Tauri app checks for existing localStorage and migrates:

#### `migrate_web_data`

Migrates data from web localStorage to Tauri storage.

**Rust Signature:**

```rust
#[tauri::command]
async fn migrate_web_data(web_data: WebDataExport) -> Result<(), String>
```

**TypeScript Invocation:**

```typescript
interface WebDataExport {
  sessions: SessionRecord[]
  parkingLot: ParkingLotItem[]
  calibration: CalibrationData | null
  user: UserData
}

// Collect web data
const webData: WebDataExport = {
  sessions: JSON.parse(localStorage.getItem('hcos_sessions') || '[]'),
  parkingLot: JSON.parse(localStorage.getItem('dustoff_parking_lot') || '{"items":[]}').items,
  calibration: JSON.parse(localStorage.getItem('hcos_calibration_data') || 'null'),
  user: JSON.parse(localStorage.getItem('dustoff_user') || '{}')
}

await invoke('migrate_web_data', { webData })
```

---

### 6.2 Data Export

#### `export_all_data`

Exports all data as JSON for backup.

**Rust Signature:**

```rust
#[tauri::command]
async fn export_all_data() -> Result<String, String> // Returns JSON string
```

**TypeScript Invocation:**

```typescript
const dataJson = await invoke<string>('export_all_data')
const blob = new Blob([dataJson], { type: 'application/json' })
// Save file via Tauri save dialog
```

---

## 7. Error Handling

### 7.1 Error Types

All commands return `Result<T, String>` where the error string contains:

```typescript
interface TauriError {
  message: string
  code?: string
}
```

**Example Error Responses:**

- `"StorageError: Failed to write to database"`
- `"ValidationError: Invalid session ID format"`
- `"NotFoundError: Session not found"`
- `"PermissionError: Cannot access file system"`


---

### 7.2 Frontend Error Handling Pattern

```typescript
try {
  await invoke('save_session', { session })
  console.log('Session saved successfully')
} catch (error) {
  console.error('Failed to save session:', error)
  toast({
    title: 'Save Failed',
    description: 'Could not save session data. Please try again.',
    variant: 'destructive'
  })
}
```

---

## 8. TypeScript Interfaces

### 8.1 Complete Bridge Wrapper

```typescript
// src/lib/tauri-bridge.ts

import { invoke } from '@tauri-apps/api/core'

export const tauriBridge = {
  // Calibration
  saveCalibration: (data: CalibrationData) => 
    invoke('save_calibration', { data }),
  loadCalibration: () => 
    invoke<CalibrationData | null>('load_calibration'),
  clearCalibration: () => 
    invoke('clear_calibration'),

  // Sessions
  saveSession: (session: SessionRecord) => 
    invoke('save_session', { session }),
  getSession: (sessionId: string) => 
    invoke<SessionRecord | null>('get_session', { sessionId }),
  getAllSessions: (startDate?: string, endDate?: string) => 
    invoke<SessionRecord[]>('get_all_sessions', { startDate, endDate }),
  saveReflection: (reflection: ReflectionObject) => 
    invoke('save_reflection', { reflection }),

  // Recovery
  saveRecoveryData: (data: RecoveryData) => 
    invoke('save_recovery_data', { data }),
  getRecoveryData: () => 
    invoke<RecoveryData | null>('get_recovery_data'),
  clearRecoveryData: () => 
    invoke('clear_recovery_data'),

  // Parking Lot
  addParkingLotItem: (text: string) => 
    invoke<ParkingLotItem>('add_parking_lot_item', { text }),
  updateParkingLotItem: (id: string, updates: Partial<ParkingLotItem>) => 
    invoke('update_parking_lot_item', { id, updates }),
  deleteParkingLotItem: (id: string) => 
    invoke('delete_parking_lot_item', { id }),
  getActiveParkingLotItems: () => 
    invoke<ParkingLotItem[]>('get_active_parking_lot_items'),
  getNextSessionItems: () => 
    invoke<ParkingLotItem[]>('get_next_session_items'),

  // User
  saveUser: (updates: Partial<UserData>) => 
    invoke('save_user', { updates }),
  readUser: () => 
    invoke<UserData>('read_user'),

  // System
  copyToClipboard: (text: string) => 
    invoke('copy_to_clipboard', { text }),
  generateUuid: () => 
    invoke<string>('generate_uuid'),
  getWorkdayDate: () => 
    invoke<string>('get_workday_date'),
  reloadWindow: () => 
    invoke('reload_window'),
  getWindowSize: () => 
    invoke<{ width: number; height: number }>('get_window_size'),
  
  // Notifications
  showNativeNotification: (title: string, body: string, icon?: string) => 
    invoke('show_native_notification', { title, body, icon }),

  // Data Management
  resetAllData: () => 
    invoke('reset_all_data'),
  exportAllData: () => 
    invoke<string>('export_all_data'),
  migrateWebData: (webData: WebDataExport) => 
    invoke('migrate_web_data', { webData })
}
```

---

## 9. Implementation Checklist

### 9.1 Critical Path (Sprint 1)

- Implement all storage commands (calibration, sessions, parking lot)
- Create SQLite schema or JSON file structure
- Build TypeScript bridge wrapper
- Implement UUID generation and workday date calculation
- Add error handling patterns


### 9.2 Core Features (Sprint 2)

- Window management commands
- System integration (clipboard, reload)
- Native notification support
- Window resize event listeners


### 9.3 Enhancement (Sprint 3)

- Data export/import functionality
- Web-to-desktop migration utility
- Comprehensive error handling
- Performance optimization


---

**End of Tauri Bridge API Specification**

```plaintext

