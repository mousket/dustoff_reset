# Task: Implement Flow Data Persistence

## Phase: 6
## Part: 2 (Flow Detection)
## Task: 12
## Depends On: task-11-flow-streaks
## Estimated Time: 1.5 hours

---

## Context Files

- `src-tauri/src/db/schema.sql` (update)
- `src-tauri/src/db/migrations/` (create migration)
- `src-tauri/src/flow/persistence.rs` (create)
- `src-tauri/src/flow/mod.rs` (update)
- `src/lib/flow/types.ts` (verify)

---

## Success Criteria

- [ ] Flow periods table exists in SQLite schema
- [ ] Flow stats table exists for cumulative tracking
- [ ] Flow data persists across app restarts
- [ ] Session flow summary saved on session end
- [ ] Cumulative stats (total deep flow time) tracked
- [ ] Historical flow data queryable for analytics
- [ ] Migration runs cleanly on existing databases
- [ ] Data integrity maintained (no orphaned records)

---

## Test Cases

- Complete session with flow → restart app → expect flow stats preserved
- Query cumulative deep flow time → expect accurate sum of all sessions
- Query flow periods for specific session → expect all periods returned
- Delete session → expect associated flow periods deleted (cascade)
- First app launch → expect tables created with migration
- Existing database → expect migration adds new tables without data loss

---

## Implementation Prompt

```
Implement SQLite persistence for flow data.

Step 1: Create database migration

Create file: src-tauri/src/db/migrations/004_flow_tables.sql

```sql
-- Flow periods table: stores each flow period within a session
CREATE TABLE IF NOT EXISTS flow_periods (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    started_at INTEGER NOT NULL,        -- Unix timestamp ms
    ended_at INTEGER,                    -- Unix timestamp ms (null if ongoing)
    level TEXT NOT NULL,                 -- 'none', 'building', 'established', 'deep'
    max_level_reached TEXT NOT NULL,     -- Highest level in this period
    was_interrupted INTEGER NOT NULL DEFAULT 0,
    interrupted_by_app TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Flow session summaries: aggregate stats per session
CREATE TABLE IF NOT EXISTS flow_session_summaries (
    session_id TEXT PRIMARY KEY,
    total_flow_time_ms INTEGER NOT NULL DEFAULT 0,
    building_time_ms INTEGER NOT NULL DEFAULT 0,
    established_time_ms INTEGER NOT NULL DEFAULT 0,
    deep_flow_time_ms INTEGER NOT NULL DEFAULT 0,
    max_level_reached TEXT NOT NULL DEFAULT 'none',
    achieved_deep_flow INTEGER NOT NULL DEFAULT 0,
    longest_flow_period_ms INTEGER NOT NULL DEFAULT 0,
    flow_breaks INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Flow stats: cumulative user stats
CREATE TABLE IF NOT EXISTS flow_stats (
    id INTEGER PRIMARY KEY CHECK (id = 1),  -- Singleton row
    total_deep_flow_ms INTEGER NOT NULL DEFAULT 0,
    total_flow_sessions INTEGER NOT NULL DEFAULT 0,
    sessions_with_deep_flow INTEGER NOT NULL DEFAULT 0,
    first_deep_flow_at INTEGER,              -- Unix timestamp ms
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Initialize flow stats singleton
INSERT OR IGNORE INTO flow_stats (id) VALUES (1);

-- Flow streak: persisted streak data
CREATE TABLE IF NOT EXISTS flow_streak (
    id INTEGER PRIMARY KEY CHECK (id = 1),  -- Singleton row
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_deep_flow_date TEXT,               -- YYYY-MM-DD
    streak_start_date TEXT,                 -- YYYY-MM-DD
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Initialize flow streak singleton
INSERT OR IGNORE INTO flow_streak (id) VALUES (1);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_flow_periods_session ON flow_periods(session_id);
CREATE INDEX IF NOT EXISTS idx_flow_periods_level ON flow_periods(level);
CREATE INDEX IF NOT EXISTS idx_flow_summaries_deep ON flow_session_summaries(achieved_deep_flow);
```

Step 2: Create persistence module

Create file: src-tauri/src/flow/persistence.rs

```rust
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use anyhow::Result;
use uuid::Uuid;

// Flow period record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlowPeriodRecord {
    pub id: String,
    pub session_id: String,
    pub started_at: i64,
    pub ended_at: Option<i64>,
    pub level: String,
    pub max_level_reached: String,
    pub was_interrupted: bool,
    pub interrupted_by_app: Option<String>,
}

// Flow session summary
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlowSessionSummaryRecord {
    pub session_id: String,
    pub total_flow_time_ms: i64,
    pub building_time_ms: i64,
    pub established_time_ms: i64,
    pub deep_flow_time_ms: i64,
    pub max_level_reached: String,
    pub achieved_deep_flow: bool,
    pub longest_flow_period_ms: i64,
    pub flow_breaks: i32,
}

// Cumulative flow stats
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlowStats {
    pub total_deep_flow_ms: i64,
    pub total_flow_sessions: i32,
    pub sessions_with_deep_flow: i32,
    pub first_deep_flow_at: Option<i64>,
}

impl Default for FlowStats {
    fn default() -> Self {
        Self {
            total_deep_flow_ms: 0,
            total_flow_sessions: 0,
            sessions_with_deep_flow: 0,
            first_deep_flow_at: None,
        }
    }
}

// Flow streak (matches TypeScript)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlowStreak {
    pub current_streak: i32,
    pub longest_streak: i32,
    pub last_deep_flow_date: Option<String>,
    pub streak_start_date: Option<String>,
}

impl Default for FlowStreak {
    fn default() -> Self {
        Self {
            current_streak: 0,
            longest_streak: 0,
            last_deep_flow_date: None,
            streak_start_date: None,
        }
    }
}

// === CRUD Operations ===

// Flow Periods
pub fn insert_flow_period(conn: &Connection, period: &FlowPeriodRecord) -> Result<()> {
    conn.execute(
        "INSERT INTO flow_periods (id, session_id, started_at, ended_at, level, max_level_reached, was_interrupted, interrupted_by_app)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            period.id,
            period.session_id,
            period.started_at,
            period.ended_at,
            period.level,
            period.max_level_reached,
            period.was_interrupted as i32,
            period.interrupted_by_app,
        ],
    )?;
    Ok(())
}

pub fn update_flow_period_end(conn: &Connection, period_id: &str, ended_at: i64, was_interrupted: bool, interrupted_by_app: Option<&str>) -> Result<()> {
    conn.execute(
        "UPDATE flow_periods SET ended_at = ?1, was_interrupted = ?2, interrupted_by_app = ?3 WHERE id = ?4",
        params![ended_at, was_interrupted as i32, interrupted_by_app, period_id],
    )?;
    Ok(())
}

pub fn get_flow_periods_for_session(conn: &Connection, session_id: &str) -> Result<Vec<FlowPeriodRecord>> {
    let mut stmt = conn.prepare(
        "SELECT id, session_id, started_at, ended_at, level, max_level_reached, was_interrupted, interrupted_by_app
         FROM flow_periods WHERE session_id = ?1 ORDER BY started_at ASC"
    )?;
    
    let periods = stmt.query_map(params![session_id], |row| {
        Ok(FlowPeriodRecord {
            id: row.get(0)?,
            session_id: row.get(1)?,
            started_at: row.get(2)?,
            ended_at: row.get(3)?,
            level: row.get(4)?,
            max_level_reached: row.get(5)?,
            was_interrupted: row.get::<_, i32>(6)? != 0,
            interrupted_by_app: row.get(7)?,
        })
    })?.collect::<Result<Vec<_>, _>>()?;
    
    Ok(periods)
}

// Flow Session Summary
pub fn save_flow_session_summary(conn: &Connection, summary: &FlowSessionSummaryRecord) -> Result<()> {
    conn.execute(
        "INSERT OR REPLACE INTO flow_session_summaries 
         (session_id, total_flow_time_ms, building_time_ms, established_time_ms, deep_flow_time_ms, 
          max_level_reached, achieved_deep_flow, longest_flow_period_ms, flow_breaks)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            summary.session_id,
            summary.total_flow_time_ms,
            summary.building_time_ms,
            summary.established_time_ms,
            summary.deep_flow_time_ms,
            summary.max_level_reached,
            summary.achieved_deep_flow as i32,
            summary.longest_flow_period_ms,
            summary.flow_breaks,
        ],
    )?;
    Ok(())
}

pub fn get_flow_session_summary(conn: &Connection, session_id: &str) -> Result<Option<FlowSessionSummaryRecord>> {
    let result = conn.query_row(
        "SELECT session_id, total_flow_time_ms, building_time_ms, established_time_ms, deep_flow_time_ms,
                max_level_reached, achieved_deep_flow, longest_flow_period_ms, flow_breaks
         FROM flow_session_summaries WHERE session_id = ?1",
        params![session_id],
        |row| {
            Ok(FlowSessionSummaryRecord {
                session_id: row.get(0)?,
                total_flow_time_ms: row.get(1)?,
                building_time_ms: row.get(2)?,
                established_time_ms: row.get(3)?,
                deep_flow_time_ms: row.get(4)?,
                max_level_reached: row.get(5)?,
                achieved_deep_flow: row.get::<_, i32>(6)? != 0,
                longest_flow_period_ms: row.get(7)?,
                flow_breaks: row.get(8)?,
            })
        }
    ).optional()?;
    
    Ok(result)
}

// Flow Stats (cumulative)
pub fn get_flow_stats(conn: &Connection) -> Result<FlowStats> {
    let result = conn.query_row(
        "SELECT total_deep_flow_ms, total_flow_sessions, sessions_with_deep_flow, first_deep_flow_at
         FROM flow_stats WHERE id = 1",
        [],
        |row| {
            Ok(FlowStats {
                total_deep_flow_ms: row.get(0)?,
                total_flow_sessions: row.get(1)?,
                sessions_with_deep_flow: row.get(2)?,
                first_deep_flow_at: row.get(3)?,
            })
        }
    ).optional()?.unwrap_or_default();
    
    Ok(result)
}

pub fn update_flow_stats(conn: &Connection, summary: &FlowSessionSummaryRecord) -> Result<FlowStats> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as i64;
    
    // Update cumulative stats
    conn.execute(
        "UPDATE flow_stats SET
            total_deep_flow_ms = total_deep_flow_ms + ?1,
            total_flow_sessions = total_flow_sessions + 1,
            sessions_with_deep_flow = sessions_with_deep_flow + ?2,
            first_deep_flow_at = COALESCE(first_deep_flow_at, CASE WHEN ?3 = 1 THEN ?4 ELSE NULL END),
            updated_at = ?4
         WHERE id = 1",
        params![
            summary.deep_flow_time_ms,
            summary.achieved_deep_flow as i32,
            summary.achieved_deep_flow as i32,
            now,
        ],
    )?;
    
    get_flow_stats(conn)
}

// Flow Streak
pub fn get_flow_streak(conn: &Connection) -> Result<FlowStreak> {
    let result = conn.query_row(
        "SELECT current_streak, longest_streak, last_deep_flow_date, streak_start_date
         FROM flow_streak WHERE id = 1",
        [],
        |row| {
            Ok(FlowStreak {
                current_streak: row.get(0)?,
                longest_streak: row.get(1)?,
                last_deep_flow_date: row.get(2)?,
                streak_start_date: row.get(3)?,
            })
        }
    ).optional()?.unwrap_or_default();
    
    Ok(result)
}

pub fn save_flow_streak(conn: &Connection, streak: &FlowStreak) -> Result<()> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as i64;
    
    conn.execute(
        "UPDATE flow_streak SET
            current_streak = ?1,
            longest_streak = ?2,
            last_deep_flow_date = ?3,
            streak_start_date = ?4,
            updated_at = ?5
         WHERE id = 1",
        params![
            streak.current_streak,
            streak.longest_streak,
            streak.last_deep_flow_date,
            streak.streak_start_date,
            now,
        ],
    )?;
    Ok(())
}

// Helper: Generate unique ID
pub fn generate_id() -> String {
    Uuid::new_v4().to_string()
}
```

Step 3: Create Tauri commands

Update file: src-tauri/src/flow/mod.rs

Add persistence commands:

```rust
pub mod persistence;

use tauri::State;
use crate::db::Database;
use persistence::*;

#[tauri::command]
pub async fn get_flow_stats_cmd(db: State<'_, Database>) -> Result<FlowStats, String> {
    let conn = db.connection.lock().map_err(|e| e.to_string())?;
    get_flow_stats(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_flow_streak_cmd(db: State<'_, Database>) -> Result<FlowStreak, String> {
    let conn = db.connection.lock().map_err(|e| e.to_string())?;
    get_flow_streak(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_flow_streak_cmd(
    db: State<'_, Database>,
    streak: FlowStreak,
) -> Result<(), String> {
    let conn = db.connection.lock().map_err(|e| e.to_string())?;
    save_flow_streak(&conn, &streak).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_flow_session_summary_cmd(
    db: State<'_, Database>,
    summary: FlowSessionSummaryRecord,
) -> Result<FlowStats, String> {
    let conn = db.connection.lock().map_err(|e| e.to_string())?;
    
    // Save summary
    save_flow_session_summary(&conn, &summary).map_err(|e| e.to_string())?;
    
    // Update cumulative stats and return new totals
    update_flow_stats(&conn, &summary).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_flow_session_summary_cmd(
    db: State<'_, Database>,
    session_id: String,
) -> Result<Option<FlowSessionSummaryRecord>, String> {
    let conn = db.connection.lock().map_err(|e| e.to_string())?;
    get_flow_session_summary(&conn, &session_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_flow_periods_cmd(
    db: State<'_, Database>,
    session_id: String,
) -> Result<Vec<FlowPeriodRecord>, String> {
    let conn = db.connection.lock().map_err(|e| e.to_string())?;
    get_flow_periods_for_session(&conn, &session_id).map_err(|e| e.to_string())
}
```

Step 4: Register commands in main.rs

Update file: src-tauri/src/main.rs

Add to invoke_handler:

```rust
.invoke_handler(tauri::generate_handler![
    // ... existing commands
    flow::get_flow_stats_cmd,
    flow::get_flow_streak_cmd,
    flow::save_flow_streak_cmd,
    flow::save_flow_session_summary_cmd,
    flow::get_flow_session_summary_cmd,
    flow::get_flow_periods_cmd,
])
```

After making these changes:
1. Run database migration
2. Run `cargo build` to verify Rust compiles
3. Run `npm run build` to verify TypeScript compiles
4. Test data persistence across app restarts
```

---

## Verification

After completing this task:

```bash
# Build Rust backend
cd src-tauri && cargo build

# Build frontend
npm run build
```

Expected: No compilation errors.

Database verification:

```bash
# Open SQLite database
sqlite3 ~/.dustoff-reset/dustoff.db

# Check tables exist
.tables
# Expected: flow_periods, flow_session_summaries, flow_stats, flow_streak

# Check flow_stats initialized
SELECT * FROM flow_stats;
# Expected: 1 row with id=1, all values at 0/null

# Check flow_streak initialized  
SELECT * FROM flow_streak;
# Expected: 1 row with id=1, streak values at 0/null
```

Manual testing:

1. Start app fresh (or clear database)
2. Complete a session with deep flow
3. Close app completely
4. Reopen app
5. Check:
   - [ ] Flow stats show cumulative deep flow time
   - [ ] Flow streak shows correct value
   - [ ] Session summary retrievable for previous session
6. Complete another session
7. Check:
   - [ ] Cumulative stats increased
   - [ ] Streak updated appropriately
