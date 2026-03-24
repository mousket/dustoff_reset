
# 05 - Backend Process Architecture

**Version:** 1.0  
**Last Updated:** January 12, 2026  
**Purpose:** Complete specification of the Rust/Tauri backend architecture, threading model, process management, and state synchronization for Human Capacity OS.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Process Threading Model](#2-process-threading-model)
3. [Storage Layer](#3-storage-layer)
4. [Business Logic Layer](#4-business-logic-layer)
5. [State Management](#5-state-management)
6. [Workday Date Calculation](#6-workday-date-calculation)
7. [Error Handling Strategy](#7-error-handling-strategy)
8. [Module Structure](#8-module-structure)
9. [Implementation Guidelines](#9-implementation-guidelines)

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

\`\`\`
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                       │
│  (TypeScript - Runs in WebView)                        │
│  - UI Components                                        │
│  - Client State Management                              │
│  - Event Listeners                                      │
└────────────────────┬────────────────────────────────────┘
                     │ Tauri IPC
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Tauri Command Layer (Rust)                 │
│  - Command Handlers (#[tauri::command])                │
│  - Request Validation                                   │
│  - Response Serialization                               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│            Business Logic Layer (Rust)                  │
│  - Calibration Manager                                  │
│  - Session Manager                                      │
│  - Parking Lot Manager                                  │
│  - Bandwidth Calculator                                 │
│  - Recovery Handler                                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Storage Layer (Rust)                       │
│  - SQLite Database                                      │
│  - File System Access                                   │
│  - Data Serialization/Deserialization                   │
└─────────────────────────────────────────────────────────┘
\`\`\`

### 1.2 Core Principles

**Single-Threaded Command Handlers:**
- All Tauri commands run on the main thread
- Database operations are synchronous (SQLite with WAL mode)
- No async complexity for simple CRUD operations

**Event-Driven Architecture:**
- Backend emits events to frontend via Tauri event system
- Frontend subscribes to events and updates UI reactively
- Decouples backend processes from frontend state

**Stateless Commands:**
- Each command is independent and idempotent where possible
- State is persisted in database, not in memory
- Commands read current state, transform it, and persist changes

---

## 2. Process Threading Model

### 2.1 Main Application Thread

**Responsibilities:**
- Initialize Tauri window and WebView
- Register all command handlers
- Set up database connection pool
- Handle window lifecycle events

**Initialization Flow:**
```rust
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // Calibration commands
            save_calibration,
            load_calibration,
            clear_calibration,
            
            // Session commands
            save_session,
            get_session,
            get_all_sessions,
            save_reflection,
            
            // Parking lot commands
            add_parking_lot_item,
            update_parking_lot_item,
            delete_parking_lot_item,
            get_active_parking_lot_items,
            get_next_session_items,
            
            // System commands
            copy_to_clipboard,
            generate_uuid,
            get_workday_date,
            reload_window,
            get_window_size,
        ])
        .setup(|app| {
            // Initialize database
            let db = initialize_database()?;
            app.manage(db);
            
            // Run migrations if needed
            run_migrations(&db)?;
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 2.2 Background Threads (Future Enhancement)

**NOT IMPLEMENTED IN PHASE 1** - All bandwidth calculations happen in frontend via JavaScript timers.

In future versions, consider background threads for:

- Continuous bandwidth decay monitoring
- Telemetry collection (input monitoring, app tracking)
- Intervention detection
- Auto-save mechanisms


---

## 3. Storage Layer

### 3.1 Database Schema (SQLite)

#### **calibrations**Table

```sql
CREATE TABLE calibrations (
id INTEGER PRIMARY KEY AUTOINCREMENT,
date TEXT NOT NULL UNIQUE,  -- YYYY-MM-DD (workday adjusted)
calibration_score REAL NOT NULL,
sleep_hours REAL NOT NULL,
sleep_quality INTEGER NOT NULL,
emotional_residue INTEGER NOT NULL,
emotional_state TEXT NOT NULL,
distractions TEXT,  -- JSON array
timestamp INTEGER NOT NULL,
created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_calibrations_date ON calibrations(date);

```plaintext

#### **sessions** Table
\`\`\`sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,  -- UUID
    started_at TEXT NOT NULL,
    ended_at TEXT NOT NULL,
    planned_duration_minutes INTEGER NOT NULL,
    actual_duration_minutes INTEGER NOT NULL,
    mode TEXT NOT NULL,  -- 'Zen', 'Flow', 'Legend'
    victory_level TEXT NOT NULL,  -- 'Minimum', 'Good', 'Legend', 'Missed'
    flow_efficiency REAL NOT NULL,
    longest_streak_minutes INTEGER NOT NULL,
    distraction_attempts INTEGER NOT NULL,
    interventions_used INTEGER NOT NULL,
    end_reason TEXT NOT NULL,
    end_sub_reason TEXT,
    timeline_blocks TEXT NOT NULL,  -- JSON array
    distraction_events TEXT NOT NULL,  -- JSON array
    intervention_events TEXT NOT NULL,  -- JSON array
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_started_at ON sessions(started_at);
CREATE INDEX idx_sessions_mode ON sessions(mode);
```

#### **reflections**Table

```sql
CREATE TABLE reflections (
id INTEGER PRIMARY KEY AUTOINCREMENT,
session_id TEXT NOT NULL UNIQUE,
what_went_well TEXT NOT NULL,
friction_notes TEXT,
closing_energy INTEGER NOT NULL,  -- 1-5
skipped INTEGER NOT NULL DEFAULT 0,  -- boolean
created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE INDEX idx_reflections_session_id ON reflections(session_id);

```plaintext

#### **parking_lot_items** Table
\`\`\`sql
CREATE TABLE parking_lot_items (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    status TEXT NOT NULL,  -- 'OPEN', 'COMPLETED', 'DELETED', 'PENDING'
    item_status TEXT,  -- 'new', 'in-progress', 'done'
    category TEXT,  -- 'task', 'idea', 'reminder', 'distraction'
    tags TEXT,  -- JSON array
    action TEXT,  -- 'next-session', 'keep', 'delete'
    resolved_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parking_lot_status ON parking_lot_items(status);
CREATE INDEX idx_parking_lot_action ON parking_lot_items(action);
```

#### **recovery_data**Table (Single Row)

```sql
CREATE TABLE recovery_data (
id INTEGER PRIMARY KEY CHECK (id = 1),  -- Only one row allowed
session_id TEXT NOT NULL,
started_at TEXT NOT NULL,
planned_duration_minutes INTEGER NOT NULL,
mode TEXT NOT NULL,
intention TEXT NOT NULL,
elapsed_seconds INTEGER NOT NULL,
created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

```plaintext

#### **user_data** Table (Single Row)
\`\`\`sql
CREATE TABLE user_data (
    id INTEGER PRIMARY KEY CHECK (id = 1),  -- Only one row allowed
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    operator_name TEXT,
    initial_bandwidth INTEGER,
    default_mode TEXT,
    public_commitment INTEGER DEFAULT 0,
    intention TEXT,
    day_start_time TEXT,
    work_block_duration INTEGER,
    track_weekends TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 File-Based Storage Alternative

For simpler deployments, use JSON files instead of SQLite:

```plaintext
~/Library/Application Support/com.dustoff.reset/  (macOS)
├── calibration.json
├── sessions.json
├── reflections.json
├── parking_lot.json
├── recovery.json
└── user.json
```

**Pros:**

- Simpler implementation
- Easier debugging (human-readable)
- No database migration complexity


**Cons:**

- Slower query performance
- No ACID guarantees
- Manual index management


**Recommended:** Start with JSON files for Phase 1, migrate to SQLite in Phase 2 if performance issues arise.

---

## 4. Business Logic Layer

### 4.1 Calibration Manager

**Module:** `src-tauri/src/managers/calibration.rs`

**Responsibilities:**

- Calculate workday date (5am boundary)
- Validate calibration data
- Compute initial bandwidth score from calibration inputs
- Handle calibration persistence


**Key Functions:**

```rust
pub struct CalibrationManager {
    storage: Arc<Mutex<Storage>>,
}

impl CalibrationManager {
    pub fn save(&self, data: CalibrationData) -> Result<(), String> {
        // Validate data
        self.validate_calibration(&data)?;
        
        // Calculate workday date
        let workday_date = calculate_workday_date();
        
        // Persist to storage
        self.storage.lock().unwrap().save_calibration(workday_date, data)
    }
    
    pub fn load(&self) -> Result<Option<CalibrationData>, String> {
        let today = calculate_workday_date();
        let stored = self.storage.lock().unwrap().load_calibration()?;
        
        // Check if calibration is for today
        match stored {
            Some(cal) if cal.date == today => Ok(Some(cal)),
            _ => Ok(None),  // Expired or missing
        }
    }
    
    pub fn clear(&self) -> Result<(), String> {
        self.storage.lock().unwrap().clear_calibration()
    }
    
    fn validate_calibration(&self, data: &CalibrationData) -> Result<(), String> {
        if data.calibration_data.sleep_hours < 0.0 || data.calibration_data.sleep_hours > 24.0 {
            return Err("Invalid sleep hours".to_string());
        }
        if data.calibration_data.sleep_quality < 1 || data.calibration_data.sleep_quality > 5 {
            return Err("Invalid sleep quality".to_string());
        }
        Ok(())
    }
}
```

### 4.2 Session Manager

**Module:** `src-tauri/src/managers/session.rs`

**Responsibilities:**

- Manage session lifecycle (create, update, complete)
- Calculate session metrics (flow efficiency, longest streak)
- Handle session recovery data
- Query historical sessions


**Key Functions:**

```rust
pub struct SessionManager {
    storage: Arc<Mutex<Storage>>,
}

impl SessionManager {
    pub fn save_session(&self, session: SessionRecord) -> Result<(), String> {
        // Validate session data
        self.validate_session(&session)?;
        
        // Persist to storage
        self.storage.lock().unwrap().save_session(session)
    }
    
    pub fn get_session(&self, session_id: &str) -> Result<Option<SessionRecord>, String> {
        self.storage.lock().unwrap().get_session(session_id)
    }
    
    pub fn get_all_sessions(&self, start_date: Option<String>, end_date: Option<String>) 
        -> Result<Vec<SessionRecord>, String> {
        self.storage.lock().unwrap().get_all_sessions(start_date, end_date)
    }
    
    pub fn save_reflection(&self, reflection: ReflectionObject) -> Result<(), String> {
        self.storage.lock().unwrap().save_reflection(reflection)
    }
    
    pub fn save_recovery_data(&self, data: RecoveryData) -> Result<(), String> {
        self.storage.lock().unwrap().save_recovery_data(data)
    }
    
    pub fn get_recovery_data(&self) -> Result<Option<RecoveryData>, String> {
        self.storage.lock().unwrap().get_recovery_data()
    }
    
    pub fn clear_recovery_data(&self) -> Result<(), String> {
        self.storage.lock().unwrap().clear_recovery_data()
    }
    
    fn validate_session(&self, session: &SessionRecord) -> Result<(), String> {
        if session.session_id.is_empty() {
            return Err("Session ID required".to_string());
        }
        if session.planned_duration_minutes <= 0 {
            return Err("Invalid duration".to_string());
        }
        Ok(())
    }
}
```

### 4.3 Parking Lot Manager

**Module:** `src-tauri/src/managers/parking_lot.rs`

**Responsibilities:**

- CRUD operations for parking lot items
- Filter items by status (OPEN, PENDING, DELETED)
- Manage harvest actions (next-session, keep, delete)
- Handle item categorization and tagging


**Key Functions:**

```rust
pub struct ParkingLotManager {
    storage: Arc<Mutex<Storage>>,
}

impl ParkingLotManager {
    pub fn add_item(&self, text: String) -> Result<ParkingLotItem, String> {
        let id = generate_uuid();
        let now = chrono::Utc::now().to_rfc3339();
        
        let item = ParkingLotItem {
            id: id.clone(),
            text,
            timestamp: chrono::Utc::now().timestamp(),
            status: "OPEN".to_string(),
            created_at: now.clone(),
            updated_at: now,
            item_status: None,
            category: None,
            tags: None,
            action: None,
            resolved_at: None,
        };
        
        self.storage.lock().unwrap().save_parking_lot_item(&item)?;
        Ok(item)
    }
    
    pub fn update_item(&self, id: String, updates: ParkingLotItemUpdate) 
        -> Result<(), String> {
        let mut storage = self.storage.lock().unwrap();
        let mut item = storage.get_parking_lot_item(&id)?
            .ok_or("Item not found")?;
        
        // Apply updates
        if let Some(text) = updates.text {
            item.text = text;
        }
        if let Some(category) = updates.category {
            item.category = Some(category);
        }
        if let Some(tags) = updates.tags {
            item.tags = Some(tags);
        }
        if let Some(action) = updates.action {
            item.action = Some(action.clone());
            // Update status based on action
            item.status = match action.as_str() {
                "next-session" => "PENDING".to_string(),
                "delete" => "DELETED".to_string(),
                "keep" => "OPEN".to_string(),
                _ => item.status,
            };
        }
        
        item.updated_at = chrono::Utc::now().to_rfc3339();
        storage.save_parking_lot_item(&item)
    }
    
    pub fn delete_item(&self, id: String) -> Result<(), String> {
        self.update_item(id, ParkingLotItemUpdate {
            status: Some("DELETED".to_string()),
            ..Default::default()
        })
    }
    
    pub fn get_active_items(&self) -> Result<Vec<ParkingLotItem>, String> {
        let all_items = self.storage.lock().unwrap().get_all_parking_lot_items()?;
        Ok(all_items.into_iter()
            .filter(|item| item.status != "DELETED" && item.status != "COMPLETED")
            .collect())
    }
    
    pub fn get_next_session_items(&self) -> Result<Vec<ParkingLotItem>, String> {
        let all_items = self.storage.lock().unwrap().get_all_parking_lot_items()?;
        Ok(all_items.into_iter()
            .filter(|item| item.action == Some("next-session".to_string()) 
                        && item.status == "PENDING")
            .collect())
    }
}
```

---

## 5. State Management

### 5.1 Shared State Pattern

**No In-Memory State:**

- All state lives in the database/files
- Commands read, transform, and persist atomically
- No race conditions from concurrent access


**Example Command Pattern:**

```rust
#[tauri::command]
async fn update_parking_lot_item(
    id: String,
    updates: ParkingLotItemUpdate,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    state.parking_lot_manager.update_item(id, updates)
}
```

### 5.2 AppState Structure

```rust
pub struct AppState {
    pub calibration_manager: Arc<CalibrationManager>,
    pub session_manager: Arc<SessionManager>,
    pub parking_lot_manager: Arc<ParkingLotManager>,
    pub storage: Arc<Mutex<Storage>>,
}

impl AppState {
    pub fn new() -> Result<Self, String> {
        let storage = Arc::new(Mutex::new(Storage::new()?));
        
        Ok(Self {
            calibration_manager: Arc::new(CalibrationManager {
                storage: storage.clone(),
            }),
            session_manager: Arc::new(SessionManager {
                storage: storage.clone(),
            }),
            parking_lot_manager: Arc::new(ParkingLotManager {
                storage: storage.clone(),
            }),
            storage,
        })
    }
}
```

---

## 6. Workday Date Calculation

### 6.1 5am Boundary Logic

**Rule:** The workday starts at 5am local time, not midnight.

**Rationale:**

- Late-night work sessions (2am-4am) belong to the previous workday
- Calibration remains valid until 5am, then expires
- Prevents awkward recalibration prompts at 2am


**Implementation:**

```rust
use chrono::{Local, NaiveDate};

pub fn calculate_workday_date() -> String {
    let now = Local::now();
    let hour = now.hour();
    
    // If before 5am, use yesterday's date
    let date = if hour < 5 {
        (now - chrono::Duration::days(1)).date_naive()
    } else {
        now.date_naive()
    };
    
    date.format("%Y-%m-%d").to_string()
}

#[tauri::command]
async fn get_workday_date() -> Result<String, String> {
    Ok(calculate_workday_date())
}
```

### 6.2 Timezone Handling

**Local Timezone Always:**

- Use `chrono::Local` for all date/time operations
- Never use UTC for workday calculations
- User's local 5am is the boundary, regardless of location


---

## 7. Error Handling Strategy

### 7.1 Error Types

```rust
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Storage error: {0}")]
    Storage(String),
    
    #[error("Validation error: {0}")]
    Validation(String),
    
    #[error("Not found: {0}")]
    NotFound(String),
    
    #[error("Serialization error: {0}")]
    Serialization(String),
}

impl From<AppError> for String {
    fn from(err: AppError) -> Self {
        err.to_string()
    }
}
```

### 7.2 Command Error Handling

```rust
#[tauri::command]
async fn save_session(
    session: SessionRecord,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    state.session_manager.save_session(session)
        .map_err(|e| format!("Failed to save session: {}", e))
}
```

### 7.3 Frontend Error Display

```typescript
try {
await invoke('save_session', { session })
} catch (error) {
console.error('[v0] Save failed:', error)
toast({
title: 'Save Failed',
description: String(error),
variant: 'destructive'
})
}

```plaintext

---

## 8. Module Structure

### 8.1 Recommended File Structure

```

src-tauri/
├── src/
│   ├── main.rs                    # Entry point
│   ├── commands/                  # Tauri command handlers
│   │   ├── mod.rs
│   │   ├── calibration.rs         # Calibration commands
│   │   ├── session.rs             # Session commands
│   │   ├── parking_lot.rs         # Parking lot commands
│   │   ├── system.rs              # System utility commands
│   │   └── window.rs              # Window management commands
│   ├── managers/                  # Business logic
│   │   ├── mod.rs
│   │   ├── calibration.rs
│   │   ├── session.rs
│   │   └── parking_lot.rs
│   ├── storage/                   # Storage layer
│   │   ├── mod.rs
│   │   ├── json_storage.rs        # JSON file storage (Phase 1)
│   │   └── sqlite_storage.rs      # SQLite storage (Phase 2)
│   ├── models/                    # Data structures
│   │   ├── mod.rs
│   │   ├── calibration.rs
│   │   ├── session.rs
│   │   └── parking_lot.rs
│   └── utils/                     # Utilities
│       ├── mod.rs
│       ├── date.rs                # Workday date calculation
│       └── uuid.rs                # UUID generation
├── Cargo.toml
└── tauri.conf.json

```plaintext

### 8.2 Dependencies (Cargo.toml)

\`\`\`toml
[dependencies]
tauri = { version = "1.5", features = ["shell-open"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
chrono = "0.4"
uuid = { version = "1.0", features = ["v4"] }
thiserror = "1.0"

# Optional: For SQLite storage (Phase 2)
rusqlite = { version = "0.30", features = ["bundled"], optional = true }
```

---

## 9. Implementation Guidelines

### 9.1 Phase 1 Priorities

1. **Set up basic Tauri project structure**
2. **Implement JSON file storage** (simpler than SQLite)
3. **Create all data models** (structs matching TypeScript interfaces)
4. **Implement calibration manager** (with workday date logic)
5. **Implement session manager** (CRUD operations)
6. **Implement parking lot manager** (full harvest workflow)
7. **Create all command handlers** (expose managers to frontend)
8. **Test each command** (manual testing via frontend)


### 9.2 Testing Strategy

**Manual Testing:**

- Use frontend to invoke each command
- Verify data persistence across app restarts
- Test workday boundary (set system time to 4:50am, verify calibration persists, advance to 5:05am, verify expiration)


**Unit Testing (Phase 2):**

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_workday_date_before_5am() {
        // Mock time to 3:30am
        // Assert workday date is yesterday
    }
    
    #[test]
    fn test_workday_date_after_5am() {
        // Mock time to 10:00am
        // Assert workday date is today
    }
}
```

### 9.3 Performance Considerations

**File I/O Optimization:**

- Read entire JSON file into memory
- Perform operations
- Write back atomically (use temp file + rename)


**Example:**

```rust
impl JsonStorage {
    fn save_parking_lot_item(&mut self, item: &ParkingLotItem) -> Result<(), String> {
        let mut items = self.read_parking_lot_items()?;
        
        // Update or insert
        if let Some(existing) = items.iter_mut().find(|i| i.id == item.id) {
            *existing = item.clone();
        } else {
            items.push(item.clone());
        }
        
        // Atomic write
        let temp_path = self.parking_lot_path.with_extension("tmp");
        std::fs::write(&temp_path, serde_json::to_string_pretty(&items)?)?;
        std::fs::rename(&temp_path, &self.parking_lot_path)?;
        
        Ok(())
    }
}

---

## Next Steps

1. Initialize Tauri project with `npm create tauri-app`
2. Set up folder structure as outlined in Section 8.1
3. Implement JSON storage layer first (simpler than SQLite)
4. Create all data models matching TypeScript interfaces
5. Implement managers one at a time (calibration → session → parking lot)
6. Expose commands and test via frontend
7. Iterate on error handling and edge cases


---

