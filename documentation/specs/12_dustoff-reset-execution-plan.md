# Dustoff Reset: 3-Day Execution Plan & Cursor Strategy (SQLite Edition)

**Created:** January 12, 2026  
**For:** CTO/Software Architect  
**Goal:** Scaffold Tauri desktop app from Lovable/v0 React components in 3 days  
**Storage:** SQLite (production-ready from Day 1)


## Day 1: The Skeleton + Database (9-11 hours)

### Morning: Project Initialization (3-4 hours)

#### Cursor Prompt #1: Initialize Tauri Project with SQLite
```
Create a new Tauri v2 project with React + TypeScript + SQLite.

Project name: dustoff-reset

Structure needed:
```
dustoff-reset/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs              # Entry point with DB setup
│   │   ├── lib.rs               # Library exports
│   │   ├── commands/            # Tauri command handlers
│   │   │   ├── mod.rs
│   │   │   ├── calibration.rs
│   │   │   ├── session.rs
│   │   │   ├── parking_lot.rs
│   │   │   ├── recovery.rs
│   │   │   └── utils.rs
│   │   ├── models/              # Rust data structures
│   │   │   ├── mod.rs
│   │   │   ├── calibration.rs
│   │   │   ├── session.rs
│   │   │   ├── parking_lot.rs
│   │   │   ├── recovery.rs
│   │   │   └── reflection.rs
│   │   └── storage/             # SQLite layer
│   │       ├── mod.rs
│   │       ├── database.rs      # Init + migrations
│   │       ├── calibration.rs   # Calibration CRUD
│   │       ├── session.rs       # Session CRUD
│   │       ├── parking_lot.rs   # Parking lot CRUD
│   │       └── recovery.rs      # Recovery CRUD
│   ├── Cargo.toml
│   └── tauri.conf.json
└── src/                         # React frontend
    ├── components/
    ├── features/
    ├── lib/
    ├── App.tsx
    └── main.tsx
```

Cargo.toml dependencies:
```toml
[dependencies]
tauri = { version = "2", features = ["devtools"] }
tauri-plugin-shell = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1", features = ["v4"] }
thiserror = "1"
rusqlite = { version = "0.31", features = ["bundled"] }
```

tauri.conf.json:
```json
{
  "productName": "Dustoff Reset",
  "version": "0.1.0",
  "identifier": "com.dustoff.reset",
  "build": {
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "Dustoff Reset",
        "width": 1200,
        "height": 800,
        "resizable": true,
        "fullscreen": false,
        "decorations": true,
        "transparent": false
      }
    ],
    "security": {
      "csp": null
    }
  }
}
```

Initialize with: `npm create tauri-app@latest` then modify as above.
```

#### Cursor Prompt #2: Create SQLite Database Schema
```
Create the complete SQLite database initialization in src-tauri/src/storage/database.rs.

Use the schema from our documentation. This must handle:
1. First-time setup (create tables)
2. Future migrations (version tracking)
3. Connection management

```rust
// src-tauri/src/storage/database.rs
use rusqlite::{Connection, Result as SqliteResult};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

const CURRENT_DB_VERSION: i32 = 1;

pub fn get_db_path(app: &AppHandle) -> PathBuf {
    let data_dir = app.path().app_data_dir()
        .expect("Failed to resolve app data directory");
    
    // Ensure directory exists
    if !data_dir.exists() {
        std::fs::create_dir_all(&data_dir)
            .expect("Failed to create app data directory");
    }
    
    data_dir.join("dustoff.db")
}

pub fn init_database(app: &AppHandle) -> SqliteResult<Connection> {
    let db_path = get_db_path(app);
    let conn = Connection::open(db_path)?;
    
    // Enable foreign keys
    conn.execute_batch("PRAGMA foreign_keys = ON;")?;
    
    // Check and run migrations
    run_migrations(&conn)?;
    
    Ok(conn)
}

fn run_migrations(conn: &Connection) -> SqliteResult<()> {
    // Create version table if not exists
    conn.execute(
        "CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER PRIMARY KEY
        )",
        [],
    )?;
    
    // Get current version
    let current_version: i32 = conn
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM schema_version",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);
    
    // Run migrations
    if current_version < 1 {
        migrate_v1(conn)?;
    }
    
    Ok(())
}

fn migrate_v1(conn: &Connection) -> SqliteResult<()> {
    conn.execute_batch(r#"
        -- Calibrations table (daily cognitive state)
        CREATE TABLE IF NOT EXISTS calibrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL UNIQUE,
            calibration_score REAL NOT NULL,
            sleep_hours REAL NOT NULL,
            sleep_quality INTEGER NOT NULL,
            emotional_residue INTEGER NOT NULL,
            emotional_state TEXT NOT NULL,
            distractions TEXT NOT NULL DEFAULT '[]',
            timestamp INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_calibrations_date ON calibrations(date);

        -- Sessions table (work sessions)
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            started_at TEXT NOT NULL,
            ended_at TEXT,
            planned_duration_minutes INTEGER NOT NULL,
            actual_duration_minutes INTEGER,
            mode TEXT NOT NULL CHECK (mode IN ('Zen', 'Flow', 'Legend')),
            intention TEXT,
            victory_level TEXT CHECK (victory_level IN ('Legend', 'Good', 'Minimum', 'Missed')),
            flow_efficiency REAL,
            longest_streak_minutes INTEGER DEFAULT 0,
            distraction_attempts INTEGER DEFAULT 0,
            interventions_used INTEGER DEFAULT 0,
            end_reason TEXT CHECK (end_reason IN ('mission_complete', 'stopping_early', 'pulled_away')),
            end_sub_reason TEXT,
            timeline_blocks TEXT NOT NULL DEFAULT '[]',
            distraction_events TEXT NOT NULL DEFAULT '[]',
            intervention_events TEXT NOT NULL DEFAULT '[]',
            whitelisted_apps TEXT DEFAULT '[]',
            whitelisted_tabs TEXT DEFAULT '[]',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
        CREATE INDEX IF NOT EXISTS idx_sessions_mode ON sessions(mode);

        -- Reflections table (post-session reflections)
        CREATE TABLE IF NOT EXISTS reflections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL UNIQUE,
            what_went_well TEXT NOT NULL,
            friction_notes TEXT,
            closing_energy INTEGER NOT NULL CHECK (closing_energy BETWEEN 1 AND 5),
            skipped INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_reflections_session_id ON reflections(session_id);

        -- Parking lot items table (captured thoughts)
        CREATE TABLE IF NOT EXISTS parking_lot_items (
            id TEXT PRIMARY KEY,
            text TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'COMPLETED', 'DELETED', 'PENDING')),
            item_status TEXT DEFAULT 'new' CHECK (item_status IN ('new', 'in-progress', 'done')),
            category TEXT CHECK (category IN ('task', 'idea', 'reminder', 'distraction')),
            tags TEXT DEFAULT '[]',
            action TEXT CHECK (action IN ('next-session', 'keep', 'delete')),
            session_id TEXT,
            resolved_at TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
        );
        CREATE INDEX IF NOT EXISTS idx_parking_lot_status ON parking_lot_items(status);
        CREATE INDEX IF NOT EXISTS idx_parking_lot_action ON parking_lot_items(action);

        -- Recovery data table (crash recovery, single row)
        CREATE TABLE IF NOT EXISTS recovery_data (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            session_id TEXT NOT NULL,
            started_at TEXT NOT NULL,
            planned_duration_minutes INTEGER NOT NULL,
            mode TEXT NOT NULL,
            intention TEXT NOT NULL,
            elapsed_seconds INTEGER NOT NULL,
            bandwidth_at_pause REAL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- User preferences table (single row)
        CREATE TABLE IF NOT EXISTS user_data (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            email TEXT,
            first_name TEXT,
            last_name TEXT,
            operator_name TEXT,
            initial_bandwidth INTEGER DEFAULT 70,
            default_mode TEXT DEFAULT 'Flow',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- Bandwidth snapshots for history (optional, for analytics)
        CREATE TABLE IF NOT EXISTS bandwidth_snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            timestamp INTEGER NOT NULL,
            score REAL NOT NULL,
            source TEXT NOT NULL,
            reason TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_bandwidth_session ON bandwidth_snapshots(session_id);

        -- Record migration version
        INSERT INTO schema_version (version) VALUES (1);
    "#)?;
    
    println!("[Dustoff] Database migration v1 complete");
    Ok(())
}
```
```

#### Cursor Prompt #3: Create Rust Data Models
```
Create all Rust data models in src-tauri/src/models/ that match our TypeScript interfaces.

CRITICAL: 
- Use serde for serialization with camelCase for JSON
- All fields must match TypeScript exactly
- Use Option<T> for nullable fields

Create these files:

1. src-tauri/src/models/mod.rs:
```rust
pub mod calibration;
pub mod session;
pub mod parking_lot;
pub mod recovery;
pub mod reflection;

pub use calibration::*;
pub use session::*;
pub use parking_lot::*;
pub use recovery::*;
pub use reflection::*;
```

2. src-tauri/src/models/calibration.rs:
```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalibrationData {
    pub date: String,                    // YYYY-MM-DD (workday adjusted)
    pub calibration_score: f64,          // 0-100
    pub sleep_hours: f64,                // 0-12
    pub sleep_quality: i32,              // 1-10
    pub emotional_residue: i32,          // 1-10
    pub emotional_state: String,         // Energized|Focused|Calm|Tired|Anxious|Scattered
    pub distractions: Vec<String>,       // Array of distraction types
    pub timestamp: i64,                  // Unix timestamp in milliseconds
}

impl CalibrationData {
    pub fn calculate_score(
        sleep_hours: f64,
        sleep_quality: i32,
        emotional_residue: i32,
        emotional_state: &str,
        distractions: &[String],
    ) -> f64 {
        let sleep_score = Self::calculate_sleep_score(sleep_hours, sleep_quality);
        let emotional_score = Self::calculate_emotional_score(emotional_residue, emotional_state);
        let distraction_score = Self::calculate_distraction_score(distractions);
        
        (sleep_score + emotional_score + distraction_score).clamp(0.0, 100.0)
    }
    
    fn calculate_sleep_score(hours: f64, quality: i32) -> f64 {
        // Hours score (0-25)
        let hours_score = if hours >= 7.0 && hours <= 9.0 {
            25.0
        } else if hours == 6.0 || hours == 10.0 {
            20.0
        } else if hours == 5.0 || hours == 11.0 {
            12.0
        } else {
            5.0
        };
        
        // Quality score (0-15)
        let quality_score = if quality >= 8 {
            15.0
        } else if quality >= 6 {
            10.0
        } else if quality >= 4 {
            5.0
        } else {
            2.0
        };
        
        hours_score + quality_score
    }
    
    fn calculate_emotional_score(residue: i32, state: &str) -> f64 {
        // Residue score (0-20) - inverted: lower residue = higher score
        let residue_score = if residue <= 3 {
            20.0
        } else if residue <= 5 {
            15.0
        } else if residue <= 7 {
            8.0
        } else {
            3.0
        };
        
        // State score (0-20)
        let state_score = match state {
            "Energized" => 20.0,
            "Focused" => 18.0,
            "Calm" => 15.0,
            "Tired" => 8.0,
            "Anxious" => 5.0,
            "Scattered" => 3.0,
            _ => 10.0,
        };
        
        residue_score + state_score
    }
    
    fn calculate_distraction_score(distractions: &[String]) -> f64 {
        match distractions.len() {
            0 => 20.0,
            1 => 16.0,
            2 => 12.0,
            3 => 8.0,
            4 => 5.0,
            _ => 2.0,
        }
    }
}
```

3. src-tauri/src/models/session.rs:
```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionRecord {
    pub session_id: String,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub planned_duration_minutes: i32,
    pub actual_duration_minutes: Option<i32>,
    pub mode: String,                    // "Zen" | "Flow" | "Legend"
    pub intention: Option<String>,
    pub victory_level: Option<String>,   // "Legend" | "Good" | "Minimum" | "Missed"
    pub flow_efficiency: Option<f64>,    // 0-100
    pub longest_streak_minutes: i32,
    pub distraction_attempts: i32,
    pub interventions_used: i32,
    pub end_reason: Option<String>,      // "mission_complete" | "stopping_early" | "pulled_away"
    pub end_sub_reason: Option<String>,
    pub timeline_blocks: Vec<TimelineBlock>,
    pub distraction_events: Vec<DistractionEvent>,
    pub intervention_events: Vec<InterventionEvent>,
    pub whitelisted_apps: Vec<String>,
    pub whitelisted_tabs: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimelineBlock {
    pub start: i32,                      // minutes from session start
    pub end: i32,
    pub state: String,                   // "flow" | "working" | "distracted" | "reset"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DistractionEvent {
    pub timestamp: i64,
    pub r#type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InterventionEvent {
    pub timestamp: i64,
    pub r#type: String,
}

impl SessionRecord {
    pub fn calculate_victory_level(
        planned_minutes: i32,
        actual_minutes: i32,
        end_reason: &str,
    ) -> String {
        if end_reason == "pulled_away" {
            return "Missed".to_string();
        }
        
        let percentage = (actual_minutes as f64 / planned_minutes as f64) * 100.0;
        
        if percentage >= 100.0 {
            "Legend".to_string()
        } else if percentage >= 80.0 {
            "Good".to_string()
        } else if percentage >= 60.0 {
            "Minimum".to_string()
        } else {
            "Missed".to_string()
        }
    }
}
```

4. src-tauri/src/models/parking_lot.rs:
```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParkingLotItem {
    pub id: String,
    pub text: String,
    pub timestamp: i64,
    pub status: String,                  // "OPEN" | "COMPLETED" | "DELETED" | "PENDING"
    pub item_status: Option<String>,     // "new" | "in-progress" | "done"
    pub category: Option<String>,        // "task" | "idea" | "reminder" | "distraction"
    pub tags: Option<Vec<String>>,
    pub action: Option<String>,          // "next-session" | "keep" | "delete"
    pub session_id: Option<String>,
    pub resolved_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ParkingLotItemUpdate {
    pub text: Option<String>,
    pub status: Option<String>,
    pub item_status: Option<String>,
    pub category: Option<String>,
    pub tags: Option<Vec<String>>,
    pub action: Option<String>,
    pub resolved_at: Option<String>,
}
```

5. src-tauri/src/models/recovery.rs:
```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryData {
    pub session_id: String,
    pub started_at: String,
    pub planned_duration_minutes: i32,
    pub mode: String,
    pub intention: String,
    pub elapsed_seconds: i32,
    pub bandwidth_at_pause: Option<f64>,
}
```

6. src-tauri/src/models/reflection.rs:
```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReflectionObject {
    pub session_id: String,
    pub what_went_well: String,
    pub friction_notes: Option<String>,
    pub closing_energy: i32,             // 1-5
    pub skipped: bool,
    pub created_at: String,
}
```
```

### Afternoon: SQLite Storage Layer (3-4 hours)

#### Cursor Prompt #4: Implement Calibration Storage
```
Create src-tauri/src/storage/calibration.rs with all calibration CRUD operations.

```rust
use rusqlite::{params, Connection, OptionalExtension};
use crate::models::CalibrationData;

pub fn save_calibration(conn: &Connection, data: &CalibrationData) -> Result<(), String> {
    let distractions_json = serde_json::to_string(&data.distractions)
        .map_err(|e| e.to_string())?;
    
    conn.execute(
        r#"INSERT INTO calibrations 
           (date, calibration_score, sleep_hours, sleep_quality, 
            emotional_residue, emotional_state, distractions, timestamp)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
           ON CONFLICT(date) DO UPDATE SET
            calibration_score = excluded.calibration_score,
            sleep_hours = excluded.sleep_hours,
            sleep_quality = excluded.sleep_quality,
            emotional_residue = excluded.emotional_residue,
            emotional_state = excluded.emotional_state,
            distractions = excluded.distractions,
            timestamp = excluded.timestamp"#,
        params![
            data.date,
            data.calibration_score,
            data.sleep_hours,
            data.sleep_quality,
            data.emotional_residue,
            data.emotional_state,
            distractions_json,
            data.timestamp,
        ],
    ).map_err(|e| format!("Failed to save calibration: {}", e))?;
    
    Ok(())
}

pub fn load_calibration(conn: &Connection, date: &str) -> Result<Option<CalibrationData>, String> {
    let result = conn.query_row(
        r#"SELECT date, calibration_score, sleep_hours, sleep_quality,
                  emotional_residue, emotional_state, distractions, timestamp
           FROM calibrations WHERE date = ?1"#,
        params![date],
        |row| {
            let distractions_json: String = row.get(6)?;
            let distractions: Vec<String> = serde_json::from_str(&distractions_json)
                .unwrap_or_default();
            
            Ok(CalibrationData {
                date: row.get(0)?,
                calibration_score: row.get(1)?,
                sleep_hours: row.get(2)?,
                sleep_quality: row.get(3)?,
                emotional_residue: row.get(4)?,
                emotional_state: row.get(5)?,
                distractions,
                timestamp: row.get(7)?,
            })
        },
    ).optional().map_err(|e| format!("Failed to load calibration: {}", e))?;
    
    Ok(result)
}

pub fn load_latest_calibration(conn: &Connection) -> Result<Option<CalibrationData>, String> {
    let result = conn.query_row(
        r#"SELECT date, calibration_score, sleep_hours, sleep_quality,
                  emotional_residue, emotional_state, distractions, timestamp
           FROM calibrations ORDER BY timestamp DESC LIMIT 1"#,
        [],
        |row| {
            let distractions_json: String = row.get(6)?;
            let distractions: Vec<String> = serde_json::from_str(&distractions_json)
                .unwrap_or_default();
            
            Ok(CalibrationData {
                date: row.get(0)?,
                calibration_score: row.get(1)?,
                sleep_hours: row.get(2)?,
                sleep_quality: row.get(3)?,
                emotional_residue: row.get(4)?,
                emotional_state: row.get(5)?,
                distractions,
                timestamp: row.get(7)?,
            })
        },
    ).optional().map_err(|e| format!("Failed to load latest calibration: {}", e))?;
    
    Ok(result)
}

pub fn clear_calibration(conn: &Connection, date: &str) -> Result<(), String> {
    conn.execute("DELETE FROM calibrations WHERE date = ?1", params![date])
        .map_err(|e| format!("Failed to clear calibration: {}", e))?;
    Ok(())
}

pub fn clear_all_calibrations(conn: &Connection) -> Result<(), String> {
    conn.execute("DELETE FROM calibrations", [])
        .map_err(|e| format!("Failed to clear all calibrations: {}", e))?;
    Ok(())
}
```
```

#### Cursor Prompt #5: Implement Session Storage
```
Create src-tauri/src/storage/session.rs with all session CRUD operations.

```rust
use rusqlite::{params, Connection, OptionalExtension};
use crate::models::{SessionRecord, TimelineBlock, DistractionEvent, InterventionEvent};

pub fn save_session(conn: &Connection, session: &SessionRecord) -> Result<(), String> {
    let timeline_json = serde_json::to_string(&session.timeline_blocks)
        .map_err(|e| e.to_string())?;
    let distraction_events_json = serde_json::to_string(&session.distraction_events)
        .map_err(|e| e.to_string())?;
    let intervention_events_json = serde_json::to_string(&session.intervention_events)
        .map_err(|e| e.to_string())?;
    let whitelisted_apps_json = serde_json::to_string(&session.whitelisted_apps)
        .map_err(|e| e.to_string())?;
    let whitelisted_tabs_json = serde_json::to_string(&session.whitelisted_tabs)
        .map_err(|e| e.to_string())?;
    
    conn.execute(
        r#"INSERT INTO sessions 
           (id, started_at, ended_at, planned_duration_minutes, actual_duration_minutes,
            mode, intention, victory_level, flow_efficiency, longest_streak_minutes,
            distraction_attempts, interventions_used, end_reason, end_sub_reason,
            timeline_blocks, distraction_events, intervention_events,
            whitelisted_apps, whitelisted_tabs)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)
           ON CONFLICT(id) DO UPDATE SET
            ended_at = excluded.ended_at,
            actual_duration_minutes = excluded.actual_duration_minutes,
            victory_level = excluded.victory_level,
            flow_efficiency = excluded.flow_efficiency,
            longest_streak_minutes = excluded.longest_streak_minutes,
            distraction_attempts = excluded.distraction_attempts,
            interventions_used = excluded.interventions_used,
            end_reason = excluded.end_reason,
            end_sub_reason = excluded.end_sub_reason,
            timeline_blocks = excluded.timeline_blocks,
            distraction_events = excluded.distraction_events,
            intervention_events = excluded.intervention_events"#,
        params![
            session.session_id,
            session.started_at,
            session.ended_at,
            session.planned_duration_minutes,
            session.actual_duration_minutes,
            session.mode,
            session.intention,
            session.victory_level,
            session.flow_efficiency,
            session.longest_streak_minutes,
            session.distraction_attempts,
            session.interventions_used,
            session.end_reason,
            session.end_sub_reason,
            timeline_json,
            distraction_events_json,
            intervention_events_json,
            whitelisted_apps_json,
            whitelisted_tabs_json,
        ],
    ).map_err(|e| format!("Failed to save session: {}", e))?;
    
    Ok(())
}

pub fn get_session(conn: &Connection, session_id: &str) -> Result<Option<SessionRecord>, String> {
    let result = conn.query_row(
        r#"SELECT id, started_at, ended_at, planned_duration_minutes, actual_duration_minutes,
                  mode, intention, victory_level, flow_efficiency, longest_streak_minutes,
                  distraction_attempts, interventions_used, end_reason, end_sub_reason,
                  timeline_blocks, distraction_events, intervention_events,
                  whitelisted_apps, whitelisted_tabs
           FROM sessions WHERE id = ?1"#,
        params![session_id],
        |row| Ok(parse_session_row(row)),
    ).optional().map_err(|e| format!("Failed to get session: {}", e))?;
    
    match result {
        Some(session) => Ok(Some(session)),
        None => Ok(None),
    }
}

pub fn get_all_sessions(
    conn: &Connection,
    start_date: Option<&str>,
    end_date: Option<&str>,
) -> Result<Vec<SessionRecord>, String> {
    let query = match (start_date, end_date) {
        (Some(start), Some(end)) => {
            format!(
                r#"SELECT id, started_at, ended_at, planned_duration_minutes, actual_duration_minutes,
                          mode, intention, victory_level, flow_efficiency, longest_streak_minutes,
                          distraction_attempts, interventions_used, end_reason, end_sub_reason,
                          timeline_blocks, distraction_events, intervention_events,
                          whitelisted_apps, whitelisted_tabs
                   FROM sessions 
                   WHERE date(started_at) >= '{}' AND date(started_at) <= '{}'
                   ORDER BY started_at DESC"#,
                start, end
            )
        }
        _ => {
            r#"SELECT id, started_at, ended_at, planned_duration_minutes, actual_duration_minutes,
                      mode, intention, victory_level, flow_efficiency, longest_streak_minutes,
                      distraction_attempts, interventions_used, end_reason, end_sub_reason,
                      timeline_blocks, distraction_events, intervention_events,
                      whitelisted_apps, whitelisted_tabs
               FROM sessions ORDER BY started_at DESC"#.to_string()
        }
    };
    
    let mut stmt = conn.prepare(&query)
        .map_err(|e| format!("Failed to prepare query: {}", e))?;
    
    let sessions = stmt.query_map([], |row| Ok(parse_session_row(row)))
        .map_err(|e| format!("Failed to query sessions: {}", e))?
        .filter_map(|r| r.ok())
        .collect();
    
    Ok(sessions)
}

fn parse_session_row(row: &rusqlite::Row) -> SessionRecord {
    let timeline_json: String = row.get(14).unwrap_or_default();
    let distraction_json: String = row.get(15).unwrap_or_default();
    let intervention_json: String = row.get(16).unwrap_or_default();
    let apps_json: String = row.get(17).unwrap_or_default();
    let tabs_json: String = row.get(18).unwrap_or_default();
    
    SessionRecord {
        session_id: row.get(0).unwrap_or_default(),
        started_at: row.get(1).unwrap_or_default(),
        ended_at: row.get(2).ok(),
        planned_duration_minutes: row.get(3).unwrap_or(0),
        actual_duration_minutes: row.get(4).ok(),
        mode: row.get(5).unwrap_or_default(),
        intention: row.get(6).ok(),
        victory_level: row.get(7).ok(),
        flow_efficiency: row.get(8).ok(),
        longest_streak_minutes: row.get(9).unwrap_or(0),
        distraction_attempts: row.get(10).unwrap_or(0),
        interventions_used: row.get(11).unwrap_or(0),
        end_reason: row.get(12).ok(),
        end_sub_reason: row.get(13).ok(),
        timeline_blocks: serde_json::from_str(&timeline_json).unwrap_or_default(),
        distraction_events: serde_json::from_str(&distraction_json).unwrap_or_default(),
        intervention_events: serde_json::from_str(&intervention_json).unwrap_or_default(),
        whitelisted_apps: serde_json::from_str(&apps_json).unwrap_or_default(),
        whitelisted_tabs: serde_json::from_str(&tabs_json).unwrap_or_default(),
    }
}
```
```

#### Cursor Prompt #6: Implement Parking Lot & Recovery Storage
```
Create src-tauri/src/storage/parking_lot.rs and src-tauri/src/storage/recovery.rs.

parking_lot.rs:
```rust
use rusqlite::{params, Connection, OptionalExtension};
use crate::models::{ParkingLotItem, ParkingLotItemUpdate};

pub fn add_item(conn: &Connection, item: &ParkingLotItem) -> Result<(), String> {
    let tags_json = serde_json::to_string(&item.tags.clone().unwrap_or_default())
        .map_err(|e| e.to_string())?;
    
    conn.execute(
        r#"INSERT INTO parking_lot_items 
           (id, text, timestamp, status, item_status, category, tags, action, session_id, resolved_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)"#,
        params![
            item.id,
            item.text,
            item.timestamp,
            item.status,
            item.item_status,
            item.category,
            tags_json,
            item.action,
            item.session_id,
            item.resolved_at,
        ],
    ).map_err(|e| format!("Failed to add parking lot item: {}", e))?;
    
    Ok(())
}

pub fn get_item(conn: &Connection, id: &str) -> Result<Option<ParkingLotItem>, String> {
    let result = conn.query_row(
        r#"SELECT id, text, timestamp, status, item_status, category, tags, action, session_id, resolved_at
           FROM parking_lot_items WHERE id = ?1"#,
        params![id],
        |row| Ok(parse_parking_lot_row(row)),
    ).optional().map_err(|e| format!("Failed to get item: {}", e))?;
    
    Ok(result)
}

pub fn get_active_items(conn: &Connection) -> Result<Vec<ParkingLotItem>, String> {
    let mut stmt = conn.prepare(
        r#"SELECT id, text, timestamp, status, item_status, category, tags, action, session_id, resolved_at
           FROM parking_lot_items 
           WHERE status != 'DELETED'
           ORDER BY timestamp DESC"#
    ).map_err(|e| format!("Failed to prepare query: {}", e))?;
    
    let items = stmt.query_map([], |row| Ok(parse_parking_lot_row(row)))
        .map_err(|e| format!("Failed to query items: {}", e))?
        .filter_map(|r| r.ok())
        .collect();
    
    Ok(items)
}

pub fn get_pending_items(conn: &Connection) -> Result<Vec<ParkingLotItem>, String> {
    let mut stmt = conn.prepare(
        r#"SELECT id, text, timestamp, status, item_status, category, tags, action, session_id, resolved_at
           FROM parking_lot_items 
           WHERE status = 'PENDING' OR action = 'next-session'
           ORDER BY timestamp DESC"#
    ).map_err(|e| format!("Failed to prepare query: {}", e))?;
    
    let items = stmt.query_map([], |row| Ok(parse_parking_lot_row(row)))
        .map_err(|e| format!("Failed to query items: {}", e))?
        .filter_map(|r| r.ok())
        .collect();
    
    Ok(items)
}

pub fn update_item(conn: &Connection, id: &str, updates: &ParkingLotItemUpdate) -> Result<(), String> {
    let mut sql_parts = Vec::new();
    let mut param_values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    
    if let Some(ref text) = updates.text {
        sql_parts.push("text = ?");
        param_values.push(Box::new(text.clone()));
    }
    if let Some(ref status) = updates.status {
        sql_parts.push("status = ?");
        param_values.push(Box::new(status.clone()));
    }
    if let Some(ref item_status) = updates.item_status {
        sql_parts.push("item_status = ?");
        param_values.push(Box::new(item_status.clone()));
    }
    if let Some(ref category) = updates.category {
        sql_parts.push("category = ?");
        param_values.push(Box::new(category.clone()));
    }
    if let Some(ref tags) = updates.tags {
        let tags_json = serde_json::to_string(tags).map_err(|e| e.to_string())?;
        sql_parts.push("tags = ?");
        param_values.push(Box::new(tags_json));
    }
    if let Some(ref action) = updates.action {
        sql_parts.push("action = ?");
        param_values.push(Box::new(action.clone()));
    }
    if let Some(ref resolved_at) = updates.resolved_at {
        sql_parts.push("resolved_at = ?");
        param_values.push(Box::new(resolved_at.clone()));
    }
    
    if sql_parts.is_empty() {
        return Ok(()); // Nothing to update
    }
    
    sql_parts.push("updated_at = datetime('now')");
    
    let sql = format!(
        "UPDATE parking_lot_items SET {} WHERE id = ?",
        sql_parts.join(", ")
    );
    
    param_values.push(Box::new(id.to_string()));
    
    let params: Vec<&dyn rusqlite::ToSql> = param_values.iter()
        .map(|p| p.as_ref() as &dyn rusqlite::ToSql)
        .collect();
    
    conn.execute(&sql, params.as_slice())
        .map_err(|e| format!("Failed to update item: {}", e))?;
    
    Ok(())
}

pub fn delete_item(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute(
        "UPDATE parking_lot_items SET status = 'DELETED', updated_at = datetime('now') WHERE id = ?1",
        params![id],
    ).map_err(|e| format!("Failed to delete item: {}", e))?;
    
    Ok(())
}

fn parse_parking_lot_row(row: &rusqlite::Row) -> ParkingLotItem {
    let tags_json: String = row.get(6).unwrap_or_default();
    
    ParkingLotItem {
        id: row.get(0).unwrap_or_default(),
        text: row.get(1).unwrap_or_default(),
        timestamp: row.get(2).unwrap_or(0),
        status: row.get(3).unwrap_or_else(|_| "OPEN".to_string()),
        item_status: row.get(4).ok(),
        category: row.get(5).ok(),
        tags: serde_json::from_str(&tags_json).ok(),
        action: row.get(7).ok(),
        session_id: row.get(8).ok(),
        resolved_at: row.get(9).ok(),
    }
}
```

recovery.rs:
```rust
use rusqlite::{params, Connection, OptionalExtension};
use crate::models::RecoveryData;

pub fn save_recovery(conn: &Connection, data: &RecoveryData) -> Result<(), String> {
    // Delete existing recovery data first (only one row allowed)
    conn.execute("DELETE FROM recovery_data", [])
        .map_err(|e| format!("Failed to clear recovery data: {}", e))?;
    
    conn.execute(
        r#"INSERT INTO recovery_data 
           (id, session_id, started_at, planned_duration_minutes, mode, intention, elapsed_seconds, bandwidth_at_pause)
           VALUES (1, ?1, ?2, ?3, ?4, ?5, ?6, ?7)"#,
        params![
            data.session_id,
            data.started_at,
            data.planned_duration_minutes,
            data.mode,
            data.intention,
            data.elapsed_seconds,
            data.bandwidth_at_pause,
        ],
    ).map_err(|e| format!("Failed to save recovery data: {}", e))?;
    
    Ok(())
}

pub fn get_recovery(conn: &Connection) -> Result<Option<RecoveryData>, String> {
    let result = conn.query_row(
        r#"SELECT session_id, started_at, planned_duration_minutes, mode, intention, elapsed_seconds, bandwidth_at_pause
           FROM recovery_data WHERE id = 1"#,
        [],
        |row| Ok(RecoveryData {
            session_id: row.get(0)?,
            started_at: row.get(1)?,
            planned_duration_minutes: row.get(2)?,
            mode: row.get(3)?,
            intention: row.get(4)?,
            elapsed_seconds: row.get(5)?,
            bandwidth_at_pause: row.get(6).ok(),
        }),
    ).optional().map_err(|e| format!("Failed to get recovery data: {}", e))?;
    
    Ok(result)
}

pub fn clear_recovery(conn: &Connection) -> Result<(), String> {
    conn.execute("DELETE FROM recovery_data", [])
        .map_err(|e| format!("Failed to clear recovery data: {}", e))?;
    Ok(())
}
```
```

### Evening: Component Migration (2-3 hours)

#### Cursor Prompt #7: Migrate React Components
```
I'm migrating a React app from Next.js to Tauri. Copy these components from my Lovable/v0 exports to the Tauri project's src/ folder.

Key changes needed:
1. Change all `@/` imports to relative paths or configure path alias in vite.config.ts
2. Remove any Next.js specific imports (next/image, next/link, next/router)
3. Replace next/image with regular <img> tags
4. Keep all Tailwind CSS classes exactly as they are
5. Keep all shadcn/ui component imports

Folder structure to create:
```
src/
├── components/ui/        # 40+ shadcn components (copy all)
├── features/
│   ├── desktop/
│   │   ├── hud/          # FloatingHUD, DraggableContainer
│   │   ├── panels/       # PreSession, PostSession, Reset, Calibration, ParkingLot
│   │   ├── overlays/     # Intervention, FlowCelebration
│   │   ├── modals/       # InterruptedSession, EndSession, OvertimeNudge
│   │   └── bandwidth-engine/
│   └── calibration/      # 7 calibration ceremony screens
├── lib/
│   ├── types.ts          # Copy existing types
│   ├── utils.ts          # Copy cn() helper etc.
│   └── tauri-bridge.ts   # NEW - create tomorrow
├── App.tsx               # Main app component
├── main.tsx              # Entry point
└── index.css             # Tailwind styles
```

Also configure:
1. vite.config.ts with path alias:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  clearScreen: false,
  server: {
    strictPort: true,
  },
})
```

2. tsconfig.json:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Run `npm run tauri dev` after migration to verify compilation.
```

---

## Day 2: Spine + Nerves (9-11 hours)

### Morning: Tauri Commands (4-5 hours)

#### Cursor Prompt #8: Create All Tauri Commands
```
Create src-tauri/src/commands/ with all command handlers.

First, create the storage mod.rs that exports everything:
```rust
// src-tauri/src/storage/mod.rs
pub mod database;
pub mod calibration;
pub mod session;
pub mod parking_lot;
pub mod recovery;

pub use database::*;
pub use calibration::*;
pub use session::*;
pub use parking_lot::*;
pub use recovery::*;
```

Now create src-tauri/src/commands/mod.rs:
```rust
pub mod calibration;
pub mod session;
pub mod parking_lot;
pub mod recovery;
pub mod utils;

pub use calibration::*;
pub use session::*;
pub use parking_lot::*;
pub use recovery::*;
pub use utils::*;
```

Create src-tauri/src/commands/calibration.rs:
```rust
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::State;
use crate::models::CalibrationData;
use crate::storage;

pub struct AppState {
    pub db: Mutex<Connection>,
}

#[tauri::command]
pub fn save_calibration(
    state: State<'_, AppState>,
    data: CalibrationData,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    storage::calibration::save_calibration(&conn, &data)
}

#[tauri::command]
pub fn load_calibration(
    state: State<'_, AppState>,
    date: String,
) -> Result<Option<CalibrationData>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    storage::calibration::load_calibration(&conn, &date)
}

#[tauri::command]
pub fn load_todays_calibration(
    state: State<'_, AppState>,
) -> Result<Option<CalibrationData>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let today = get_workday_date_internal();
    storage::calibration::load_calibration(&conn, &today)
}

#[tauri::command]
pub fn clear_calibration(
    state: State<'_, AppState>,
    date: String,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    storage::calibration::clear_calibration(&conn, &date)
}

#[tauri::command]
pub fn calculate_calibration_score(
    sleep_hours: f64,
    sleep_quality: i32,
    emotional_residue: i32,
    emotional_state: String,
    distractions: Vec<String>,
) -> Result<f64, String> {
    Ok(CalibrationData::calculate_score(
        sleep_hours,
        sleep_quality,
        emotional_residue,
        &emotional_state,
        &distractions,
    ))
}

fn get_workday_date_internal() -> String {
    let now = chrono::Local::now();
    let hour = now.hour();
    
    let date = if hour < 5 {
        now - chrono::Duration::days(1)
    } else {
        now
    };
    
    date.format("%Y-%m-%d").to_string()
}

use chrono::Timelike;
```

Create src-tauri/src/commands/session.rs:
```rust
use tauri::State;
use crate::models::SessionRecord;
use crate::storage;
use crate::commands::calibration::AppState;

#[tauri::command]
pub fn save_session(
    state: State<'_, AppState>,
    session: SessionRecord,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    storage::session::save_session(&conn, &session)
}

#[tauri::command]
pub fn get_session(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<Option<SessionRecord>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    storage::session::get_session(&conn, &session_id)
}

#[tauri::command]
pub fn get_all_sessions(
    state: State<'_, AppState>,
    start_date: Option<String>,
    end_date: Option<String>,
) -> Result<Vec<SessionRecord>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    storage::session::get_all_sessions(
        &conn,
        start_date.as_deref(),
        end_date.as_deref(),
    )
}

#[tauri::command]
pub fn calculate_victory_level(
    planned_minutes: i32,
    actual_minutes: i32,
    end_reason: String,
) -> Result<String, String> {
    Ok(SessionRecord::calculate_victory_level(
        planned_minutes,
        actual_minutes,
        &end_reason,
    ))
}
```

Create src-tauri/src/commands/parking_lot.rs:
```rust
use tauri::State;
use crate::models::{ParkingLotItem, ParkingLotItemUpdate};
use crate::storage;
use crate::commands::calibration::AppState;

#[tauri::command]
pub fn add_parking_lot_item(
    state: State<'_, AppState>,
    text: String,
) -> Result<ParkingLotItem, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    
    let item = ParkingLotItem {
        id: uuid::Uuid::new_v4().to_string(),
        text,
        timestamp: chrono::Utc::now().timestamp_millis(),
        status: "OPEN".to_string(),
        item_status: Some("new".to_string()),
        category: None,
        tags: None,
        action: None,
        session_id: None,
        resolved_at: None,
    };
    
    storage::parking_lot::add_item(&conn, &item)?;
    Ok(item)
}

#[tauri::command]
pub fn get_parking_lot_item(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<ParkingLotItem>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    storage::parking_lot::get_item(&conn, &id)
}

#[tauri::command]
pub fn get_active_parking_lot_items(
    state: State<'_, AppState>,
) -> Result<Vec<ParkingLotItem>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    storage::parking_lot::get_active_items(&conn)
}

#[tauri::command]
pub fn get_pending_parking_lot_items(
    state: State<'_, AppState>,
) -> Result<Vec<ParkingLotItem>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    storage::parking_lot::get_pending_items(&conn)
}

#[tauri::command]
pub fn update_parking_lot_item(
    state: State<'_, AppState>,
    id: String,
    updates: ParkingLotItemUpdate,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    storage::parking_lot::update_item(&conn, &id, &updates)
}

#[tauri::command]
pub fn delete_parking_lot_item(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    storage::parking_lot::delete_item(&conn, &id)
}
```

Create src-tauri/src/commands/recovery.rs:
```rust
use tauri::State;
use crate::models::RecoveryData;
use crate::storage;
use crate::commands::calibration::AppState;

#[tauri::command]
pub fn save_recovery_data(
    state: State<'_, AppState>,
    data: RecoveryData,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    storage::recovery::save_recovery(&conn, &data)
}

#[tauri::command]
pub fn get_recovery_data(
    state: State<'_, AppState>,
) -> Result<Option<RecoveryData>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    storage::recovery::get_recovery(&conn)
}

#[tauri::command]
pub fn clear_recovery_data(
    state: State<'_, AppState>,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    storage::recovery::clear_recovery(&conn)
}
```

Create src-tauri/src/commands/utils.rs:
```rust
use chrono::Timelike;

#[tauri::command]
pub fn generate_uuid() -> String {
    uuid::Uuid::new_v4().to_string()
}

#[tauri::command]
pub fn get_workday_date() -> String {
    let now = chrono::Local::now();
    let hour = now.hour();
    
    let date = if hour < 5 {
        now - chrono::Duration::days(1)
    } else {
        now
    };
    
    date.format("%Y-%m-%d").to_string()
}

#[tauri::command]
pub fn get_current_timestamp() -> i64 {
    chrono::Utc::now().timestamp_millis()
}
```
```

#### Cursor Prompt #9: Wire Up main.rs
```
Create the main.rs that initializes the database and registers all commands:

```rust
// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod models;
mod storage;

use commands::calibration::AppState;
use std::sync::Mutex;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Initialize database
            let conn = storage::database::init_database(&app.handle())
                .expect("Failed to initialize database");
            
            // Store in app state
            app.manage(AppState {
                db: Mutex::new(conn),
            });
            
            println!("[Dustoff] Database initialized successfully");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Calibration commands
            commands::save_calibration,
            commands::load_calibration,
            commands::load_todays_calibration,
            commands::clear_calibration,
            commands::calculate_calibration_score,
            
            // Session commands
            commands::save_session,
            commands::get_session,
            commands::get_all_sessions,
            commands::calculate_victory_level,
            
            // Parking lot commands
            commands::add_parking_lot_item,
            commands::get_parking_lot_item,
            commands::get_active_parking_lot_items,
            commands::get_pending_parking_lot_items,
            commands::update_parking_lot_item,
            commands::delete_parking_lot_item,
            
            // Recovery commands
            commands::save_recovery_data,
            commands::get_recovery_data,
            commands::clear_recovery_data,
            
            // Utility commands
            commands::generate_uuid,
            commands::get_workday_date,
            commands::get_current_timestamp,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Also create src-tauri/src/lib.rs:
```rust
pub mod commands;
pub mod models;
pub mod storage;
```

Run `cargo build` in src-tauri/ to verify compilation.
```

### Afternoon: TypeScript Bridge (2-3 hours)

#### Cursor Prompt #10: Create TypeScript Bridge
```
Create src/lib/tauri-bridge.ts that wraps all Tauri commands with proper TypeScript types:

```typescript
import { invoke } from '@tauri-apps/api/core'

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface CalibrationData {
  date: string
  calibrationScore: number
  sleepHours: number
  sleepQuality: number
  emotionalResidue: number
  emotionalState: 'Energized' | 'Focused' | 'Calm' | 'Tired' | 'Anxious' | 'Scattered'
  distractions: string[]
  timestamp: number
}

export interface SessionRecord {
  sessionId: string
  startedAt: string
  endedAt: string | null
  plannedDurationMinutes: number
  actualDurationMinutes: number | null
  mode: 'Zen' | 'Flow' | 'Legend'
  intention: string | null
  victoryLevel: 'Legend' | 'Good' | 'Minimum' | 'Missed' | null
  flowEfficiency: number | null
  longestStreakMinutes: number
  distractionAttempts: number
  interventionsUsed: number
  endReason: 'mission_complete' | 'stopping_early' | 'pulled_away' | null
  endSubReason: string | null
  timelineBlocks: TimelineBlock[]
  distractionEvents: DistractionEvent[]
  interventionEvents: InterventionEvent[]
  whitelistedApps: string[]
  whitelistedTabs: string[]
}

export interface TimelineBlock {
  start: number
  end: number
  state: 'flow' | 'working' | 'distracted' | 'reset'
}

export interface DistractionEvent {
  timestamp: number
  type: string
}

export interface InterventionEvent {
  timestamp: number
  type: string
}

export interface ParkingLotItem {
  id: string
  text: string
  timestamp: number
  status: 'OPEN' | 'COMPLETED' | 'DELETED' | 'PENDING'
  itemStatus?: 'new' | 'in-progress' | 'done'
  category?: 'task' | 'idea' | 'reminder' | 'distraction'
  tags?: string[]
  action?: 'next-session' | 'keep' | 'delete'
  sessionId?: string
  resolvedAt?: string
}

export interface ParkingLotItemUpdate {
  text?: string
  status?: string
  itemStatus?: string
  category?: string
  tags?: string[]
  action?: string
  resolvedAt?: string
}

export interface RecoveryData {
  sessionId: string
  startedAt: string
  plannedDurationMinutes: number
  mode: string
  intention: string
  elapsedSeconds: number
  bandwidthAtPause?: number
}

export interface ReflectionObject {
  sessionId: string
  whatWentWell: string
  frictionNotes?: string
  closingEnergy: number
  skipped: boolean
  createdAt: string
}

// ============================================
// TAURI BRIDGE
// ============================================

export const tauriBridge = {
  // ----------------------
  // CALIBRATION
  // ----------------------
  saveCalibration: (data: CalibrationData): Promise<void> =>
    invoke('save_calibration', { data }),

  loadCalibration: (date: string): Promise<CalibrationData | null> =>
    invoke('load_calibration', { date }),

  loadTodaysCalibration: (): Promise<CalibrationData | null> =>
    invoke('load_todays_calibration'),

  clearCalibration: (date: string): Promise<void> =>
    invoke('clear_calibration', { date }),

  calculateCalibrationScore: (
    sleepHours: number,
    sleepQuality: number,
    emotionalResidue: number,
    emotionalState: string,
    distractions: string[]
  ): Promise<number> =>
    invoke('calculate_calibration_score', {
      sleepHours,
      sleepQuality,
      emotionalResidue,
      emotionalState,
      distractions,
    }),

  // ----------------------
  // SESSIONS
  // ----------------------
  saveSession: (session: SessionRecord): Promise<void> =>
    invoke('save_session', { session }),

  getSession: (sessionId: string): Promise<SessionRecord | null> =>
    invoke('get_session', { sessionId }),

  getAllSessions: (startDate?: string, endDate?: string): Promise<SessionRecord[]> =>
    invoke('get_all_sessions', { startDate, endDate }),

  calculateVictoryLevel: (
    plannedMinutes: number,
    actualMinutes: number,
    endReason: string
  ): Promise<string> =>
    invoke('calculate_victory_level', {
      plannedMinutes,
      actualMinutes,
      endReason,
    }),

  // ----------------------
  // PARKING LOT
  // ----------------------
  addParkingLotItem: (text: string): Promise<ParkingLotItem> =>
    invoke('add_parking_lot_item', { text }),

  getParkingLotItem: (id: string): Promise<ParkingLotItem | null> =>
    invoke('get_parking_lot_item', { id }),

  getActiveParkingLotItems: (): Promise<ParkingLotItem[]> =>
    invoke('get_active_parking_lot_items'),

  getPendingParkingLotItems: (): Promise<ParkingLotItem[]> =>
    invoke('get_pending_parking_lot_items'),

  updateParkingLotItem: (id: string, updates: ParkingLotItemUpdate): Promise<void> =>
    invoke('update_parking_lot_item', { id, updates }),

  deleteParkingLotItem: (id: string): Promise<void> =>
    invoke('delete_parking_lot_item', { id }),

  // ----------------------
  // RECOVERY
  // ----------------------
  saveRecoveryData: (data: RecoveryData): Promise<void> =>
    invoke('save_recovery_data', { data }),

  getRecoveryData: (): Promise<RecoveryData | null> =>
    invoke('get_recovery_data'),

  clearRecoveryData: (): Promise<void> =>
    invoke('clear_recovery_data'),

  // ----------------------
  // UTILITIES
  // ----------------------
  generateUuid: (): Promise<string> =>
    invoke('generate_uuid'),

  getWorkdayDate: (): Promise<string> =>
    invoke('get_workday_date'),

  getCurrentTimestamp: (): Promise<number> =>
    invoke('get_current_timestamp'),
}

// ============================================
// HELPER HOOKS (Optional)
// ============================================

// You can add React hooks here for common patterns
// Example:
// export function useCalibration() {
//   const [calibration, setCalibration] = useState<CalibrationData | null>(null)
//   const [loading, setLoading] = useState(true)
//   
//   useEffect(() => {
//     tauriBridge.loadTodaysCalibration()
//       .then(setCalibration)
//       .finally(() => setLoading(false))
//   }, [])
//   
//   return { calibration, loading }
// }
```
```

#### Cursor Prompt #11: Replace localStorage Calls
```
Search for ALL localStorage calls in src/ and replace with tauriBridge calls.

IMPORTANT: These are now ASYNC operations. You need to handle them properly.

Common patterns to replace:

BEFORE (synchronous):
```typescript
// Reading
const stored = localStorage.getItem('hcos_calibration_data')
const calibration = stored ? JSON.parse(stored) : null

// Writing
localStorage.setItem('hcos_calibration_data', JSON.stringify(data))
```

AFTER (asynchronous):
```typescript
import { tauriBridge } from '@/lib/tauri-bridge'

// Reading (in useEffect or async function)
const calibration = await tauriBridge.loadTodaysCalibration()

// Writing
await tauriBridge.saveCalibration(data)
```

Files to update (search for "localStorage"):
1. lib/storage.ts → Delete or refactor entirely
2. lib/session-storage.ts → Replace with tauriBridge.saveSession/getSession
3. lib/parking-lot-storage.ts → Replace with tauriBridge parking lot methods
4. features/desktop/bandwidth-engine/storage.ts → Replace with tauriBridge calibration methods
5. Any component that directly accesses localStorage

For each component using localStorage:
1. Import tauriBridge
2. Add loading state if needed
3. Convert to async/await in useEffect
4. Handle errors with try/catch

Example component update:
```typescript
// BEFORE
useEffect(() => {
  const stored = localStorage.getItem('hcos_sessions')
  if (stored) {
    setSessions(JSON.parse(stored))
  }
}, [])

// AFTER
useEffect(() => {
  const loadSessions = async () => {
    try {
      setLoading(true)
      const sessions = await tauriBridge.getAllSessions()
      setSessions(sessions)
    } catch (error) {
      console.error('Failed to load sessions:', error)
    } finally {
      setLoading(false)
    }
  }
  loadSessions()
}, [])
```

Also remove any SSR checks like:
```typescript
if (typeof window === 'undefined') return // DELETE THIS - Tauri is always client-side
```
```

### Evening: Verify Build (2-3 hours)

#### Cursor Prompt #12: Debug and Test
```
Run `npm run tauri dev` and fix any compilation errors.

Common issues to check:

1. Rust compilation errors:
   - Missing use statements
   - Type mismatches between commands and storage
   - Mutex lock errors

2. TypeScript errors:
   - Import path issues (@/ alias)
   - Type mismatches with tauriBridge
   - Missing async/await

3. Runtime errors (check browser console):
   - "invoke is not a function" → Check Tauri API import
   - "command not found" → Check command registration in main.rs
   - Serialization errors → Check camelCase/snake_case

Test each command manually:
1. Open browser DevTools (F12)
2. In Console, test commands:
```javascript
// Test calibration
await window.__TAURI__.invoke('get_workday_date')
await window.__TAURI__.invoke('load_todays_calibration')

// Test parking lot
await window.__TAURI__.invoke('add_parking_lot_item', { text: 'Test item' })
await window.__TAURI__.invoke('get_active_parking_lot_items')
```

If errors occur, check:
1. src-tauri/src/main.rs for command registration
2. Cargo.toml for dependencies
3. Command function signatures match invoke calls
```

---

## Day 3: Integration + Polish (7-9 hours)

### Morning: Event System (2-3 hours)

#### Cursor Prompt #13: Implement Tauri Events
```
Add event emission from Rust backend to React frontend.

Create src-tauri/src/events.rs:
```rust
use tauri::{AppHandle, Emitter};

pub fn emit_bandwidth_changed(app: &AppHandle, bandwidth: f64) -> Result<(), String> {
    app.emit("bandwidth-changed", bandwidth)
        .map_err(|e| e.to_string())
}

pub fn emit_intervention_triggered(app: &AppHandle, intervention_type: &str) -> Result<(), String> {
    app.emit("intervention-triggered", intervention_type)
        .map_err(|e| e.to_string())
}

pub fn emit_flow_state_changed(app: &AppHandle, is_active: bool) -> Result<(), String> {
    app.emit("flow-state-changed", is_active)
        .map_err(|e| e.to_string())
}

pub fn emit_session_tick(app: &AppHandle, elapsed_seconds: i32) -> Result<(), String> {
    app.emit("session-tick", elapsed_seconds)
        .map_err(|e| e.to_string())
}

pub fn emit_calibration_expired(app: &AppHandle) -> Result<(), String> {
    app.emit("calibration-expired", ())
        .map_err(|e| e.to_string())
}
```

Add to lib.rs:
```rust
pub mod events;
```

Create src/lib/tauri-events.ts:
```typescript
import { listen, UnlistenFn } from '@tauri-apps/api/event'

export interface EventCallbacks {
  onBandwidthChanged?: (bandwidth: number) => void
  onInterventionTriggered?: (type: string) => void
  onFlowStateChanged?: (isActive: boolean) => void
  onSessionTick?: (elapsedSeconds: number) => void
  onCalibrationExpired?: () => void
}

export async function setupEventListeners(
  callbacks: EventCallbacks
): Promise<UnlistenFn[]> {
  const unlisteners: UnlistenFn[] = []

  if (callbacks.onBandwidthChanged) {
    const unlisten = await listen<number>('bandwidth-changed', (event) => {
      callbacks.onBandwidthChanged!(event.payload)
    })
    unlisteners.push(unlisten)
  }

  if (callbacks.onInterventionTriggered) {
    const unlisten = await listen<string>('intervention-triggered', (event) => {
      callbacks.onInterventionTriggered!(event.payload)
    })
    unlisteners.push(unlisten)
  }

  if (callbacks.onFlowStateChanged) {
    const unlisten = await listen<boolean>('flow-state-changed', (event) => {
      callbacks.onFlowStateChanged!(event.payload)
    })
    unlisteners.push(unlisten)
  }

  if (callbacks.onSessionTick) {
    const unlisten = await listen<number>('session-tick', (event) => {
      callbacks.onSessionTick!(event.payload)
    })
    unlisteners.push(unlisten)
  }

  if (callbacks.onCalibrationExpired) {
    const unlisten = await listen('calibration-expired', () => {
      callbacks.onCalibrationExpired!()
    })
    unlisteners.push(unlisten)
  }

  return unlisteners
}

export function cleanupEventListeners(unlisteners: UnlistenFn[]): void {
  unlisteners.forEach((unlisten) => unlisten())
}
```

Example usage in your main desktop component:
```typescript
import { useEffect, useRef } from 'react'
import { setupEventListeners, cleanupEventListeners } from '@/lib/tauri-events'
import type { UnlistenFn } from '@tauri-apps/api/event'

export function DesktopPage() {
  const unlistenersRef = useRef<UnlistenFn[]>([])

  useEffect(() => {
    setupEventListeners({
      onBandwidthChanged: (bandwidth) => {
        console.log('[Event] Bandwidth changed:', bandwidth)
        setBandwidth(bandwidth)
      },
      onInterventionTriggered: (type) => {
        console.log('[Event] Intervention triggered:', type)
        setInterventionType(type)
        setShowIntervention(true)
      },
      onFlowStateChanged: (isActive) => {
        console.log('[Event] Flow state changed:', isActive)
        setIsInFlow(isActive)
      },
      onCalibrationExpired: () => {
        console.log('[Event] Calibration expired')
        setMode('not-calibrated')
      },
    }).then((unlisteners) => {
      unlistenersRef.current = unlisteners
    })

    return () => {
      cleanupEventListeners(unlistenersRef.current)
    }
  }, [])

  // ... rest of component
}
```
```

### Midday: Integration Testing (3-4 hours)

#### Cursor Prompt #14: Full Session Flow Test
```
Create a testing checklist and help me verify the complete flow works:

## Testing Checklist

### 1. App Launch
- [ ] App opens without errors
- [ ] Check console for "Database initialized successfully"
- [ ] HUD appears in correct position

### 2. Recovery Check (on launch)
- [ ] If recovery data exists → InterruptedSessionModal appears
- [ ] "Resume" loads previous session state
- [ ] "Discard" clears recovery and shows idle state

### 3. Calibration Check
- [ ] If not calibrated today → HUD shows "Not Calibrated" state
- [ ] Click calibrate → DailyCalibrationPanel opens
- [ ] Complete all 4 questions:
  - Sleep hours (slider)
  - Sleep quality (1-10)
  - Emotional state (emoji picker)
  - Distractions (multi-select)
- [ ] Submit → Bandwidth score appears in HUD
- [ ] Verify score persists after app restart

### 4. Pre-Session Flow
- [ ] Click "Start Session" → PreSessionPanel opens
- [ ] Step 1: Select session type (Deep Work / Parking Lot / Administrative)
- [ ] Step 2: Set intention (text input)
- [ ] Step 3: Select mode (Zen / Flow / Legend)
- [ ] Step 4: Select duration (15 / 30 / 50 / 90 min)
- [ ] Step 5: App whitelist (optional)
- [ ] Step 6: Preparation checklist
- [ ] Click "Begin" → Session starts

### 5. Active Session
- [ ] Timer counts down correctly
- [ ] HUD shows session mode color
- [ ] Click "Friction" → -5 bandwidth, intervention overlay appears
- [ ] Click "Focus-Slipping" → -10 bandwidth, intervention overlay appears
- [ ] Click "Pause" → ResetPanel appears
- [ ] Select ritual → Countdown timer works
- [ ] Complete ritual → Bandwidth restored, session resumes

### 6. Parking Lot (Mid-Session)
- [ ] Click parking lot icon → Panel opens
- [ ] Add new item → Item appears in list
- [ ] Item saves to database (check with get_active_parking_lot_items)

### 7. Session End
- [ ] Timer reaches 0 OR click "End Session"
- [ ] Select end reason (Mission Complete / Stopping Early)
- [ ] PostSessionSummaryPanel appears with:
  - Timeline visualization
  - Flow efficiency %
  - Longest streak
  - Distraction count
  - Victory level badge

### 8. Reflection
- [ ] Click "Continue" → SessionReflectionPanel
- [ ] Enter "What went well"
- [ ] Enter friction notes (optional)
- [ ] Select closing energy (1-5)
- [ ] Submit OR Skip

### 9. Parking Lot Harvest
- [ ] If parking lot items exist → HarvestPanel appears
- [ ] For each item:
  - Select category
  - Add tags (optional)
  - Choose action (Next Session / Keep / Delete)
- [ ] Complete harvest → Return to idle

### 10. Persistence Verification
- [ ] Close app completely
- [ ] Reopen app
- [ ] Calibration still valid (same workday)
- [ ] Session history contains completed session
- [ ] Parking lot items persist with correct status

### 11. Database Verification
Open the SQLite database directly:
```bash
# Find the database file
# macOS: ~/Library/Application Support/com.dustoff.reset/dustoff.db
# Windows: %APPDATA%/com.dustoff.reset/dustoff.db
# Linux: ~/.local/share/com.dustoff.reset/dustoff.db

sqlite3 dustoff.db
.tables
SELECT * FROM calibrations;
SELECT * FROM sessions;
SELECT * FROM parking_lot_items;
```

Run through each section and mark items as you verify them.
```

### Afternoon: Bug Fixes (2-3 hours)

#### Cursor Prompt #15: Common Bug Fixes
```
Here are the issues I found during testing: [PASTE YOUR ISSUES]

Common issues and fixes:

1. **"invoke is not a function"**
   - Check import: `import { invoke } from '@tauri-apps/api/core'`
   - NOT from '@tauri-apps/api/tauri' (old API)

2. **Command returns undefined/null unexpectedly**
   - Check Rust function returns correct type
   - Check serde serialization (camelCase)
   - Add logging: `println!("[DEBUG] {:?}", result);`

3. **Type errors between Rust and TypeScript**
   - Verify field names match exactly (camelCase in TS, snake_case in Rust with rename)
   - Check Option<T> maps to T | null
   - Check Vec<T> maps to T[]

4. **Database errors**
   - Check if database file exists
   - Check permissions on app data directory
   - Run migrations manually if needed

5. **State not updating after Tauri call**
   - Remember calls are async - use await
   - Update React state after successful call
   - Add error handling with try/catch

6. **Events not received**
   - Check event name matches exactly
   - Verify event listener is set up before events fire
   - Check cleanup doesn't happen too early

7. **App crashes on startup**
   - Check console for specific error
   - Verify database path is writable
   - Check all required dependencies in Cargo.toml

For each bug:
1. Identify the error message
2. Locate the source (Rust or TypeScript)
3. Add logging to trace the issue
4. Fix and verify
```

---

## Day 3 Completion Checklist

By end of Day 3, verify:

- [ ] `npm run tauri dev` runs without errors
- [ ] App launches and shows HUD
- [ ] Daily calibration saves to SQLite
- [ ] Pre-session flow completes
- [ ] Session timer works with pause/resume
- [ ] Manual interventions update bandwidth
- [ ] Reset rituals complete with countdown
- [ ] Parking lot CRUD operations work
- [ ] Post-session summary displays
- [ ] Reflection saves to database
- [ ] Parking lot harvest works
- [ ] All data persists across app restarts
- [ ] Database contains expected records

---

## Cursor Best Practices

### Reference Your Docs
```
According to documentation 05_biological_core_math.md, the friction penalty is -5 points.
Verify my implementation matches this spec.
```

### Be Specific About Files
```
In src-tauri/src/storage/calibration.rs, the save_calibration function 
is returning an error. Here's the error: [ERROR]
```

### Include Context
```
Building on the Rust models from Prompt #3 and the storage layer from Prompt #4,
now implement the Tauri commands that connect them.
```

### Debug Systematically
```
The save_calibration command is failing. I've verified:
1. ✅ Rust compiles without errors
2. ✅ Command is registered in main.rs
3. ❌ Frontend invoke returns error: [ERROR MESSAGE]

Here's my command code: [CODE]
Here's my frontend call: [CODE]

What's wrong?
```

---

## Post-Day 3: What's Next

After Day 3, you have a **production-ready desktop app** with SQLite persistence.

### Week 2 Priorities (Days 4-7)
1. **Entropy decay engine** — Background thread, 5%/hour decay
2. **Sustained focus gains** — +1/minute reward
3. **Flow state detection** — 4-condition check
4. **Auto intervention triggers** — Bandwidth threshold monitoring

### Week 3 Priorities (Days 8-10)
1. **OS window monitoring** — macOS first (NSWorkspace)
2. **Telemetry penalties** — Auto-detect app/tab switches
3. **Legend mode blocking** — Force return to whitelisted apps

---

**You've got this! Your documentation is exceptional, and SQLite gives you a solid foundation. Let's build something amazing. 🚀**
