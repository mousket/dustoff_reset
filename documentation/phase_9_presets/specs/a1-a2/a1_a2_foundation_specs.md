# Phase 9: Profiles & Quick Start
## Output 1: Foundation Specifications (A1 + A2)

---

# A1: Overview & Data Layer

## What We're Building

Phase 9 transforms how users start sessions. Instead of clicking through multiple configuration screens every time, users get three streamlined entry points:

1. **Quick Start** - 2 clicks to session (Mode + Duration, smart defaults)
2. **Use Preset** - 1 click to session (saved configurations)
3. **Create New** - Full wizard (existing flow, enhanced with preset saving)

---

## Goals

| Goal | Metric |
|------|--------|
| Reduce clicks to start | Quick Start: 2 clicks, Preset: 1 click |
| Remember user preferences | Last Session always available |
| Smart defaults | 80% of users never need to configure whitelists |
| Respect power users | Full configuration still available via Create New |

---

## New File Structure

```
src-tauri/src/
├── presets/
│   ├── mod.rs                 # Module exports
│   ├── types.rs               # Preset and CachedApp types
│   ├── persistence.rs         # Database CRUD operations
│   ├── defaults.rs            # Default presets and blocklists
│   └── app_cache.rs           # App scanning and caching logic

src/
├── lib/
│   └── presets/
│       ├── index.ts           # Module exports
│       ├── types.ts           # TypeScript types
│       ├── preset-definitions.ts  # Default presets (mirrors Rust)
│       └── default-lists.ts   # Default whitelist/blocklist
│
├── hooks/
│   ├── usePresets.ts          # Preset state management
│   ├── useQuickStart.ts       # Quick start logic
│   └── useAppCache.ts         # Cached apps access
│
├── components/
│   └── presets/
│       ├── index.ts
│       ├── EntryPointPanel.tsx    # "How do you want to start?"
│       ├── QuickStartPanel.tsx    # Mode + Duration selector
│       ├── PresetPickerPanel.tsx  # Browse and select presets
│       ├── PresetCard.tsx         # Individual preset display
│       ├── SavePresetPrompt.tsx   # "Save as preset?" dialog
│       └── PresetEditPanel.tsx    # Edit existing preset
│
├── features/
│   └── desktop/
│       └── panels/
│           └── (existing panels updated)
```

---

## Database Schema

### Table: `presets`

Stores user-created and system default presets.

```sql
CREATE TABLE IF NOT EXISTS presets (
    -- Identity
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '🎯',
    
    -- Session Configuration
    mode TEXT NOT NULL CHECK (mode IN ('Zen', 'Flow', 'Legend')),
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    
    -- Whitelisting (JSON arrays)
    whitelisted_apps TEXT NOT NULL DEFAULT '[]',      -- JSON: ["VS Code", "Terminal"]
    whitelisted_domains TEXT NOT NULL DEFAULT '[]',   -- JSON: ["github.com"]
    
    -- Behavior
    use_default_blocklist BOOLEAN NOT NULL DEFAULT TRUE,
    include_mental_prep BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Classification
    is_default BOOLEAN NOT NULL DEFAULT FALSE,        -- System preset vs user-created
    is_last_session BOOLEAN NOT NULL DEFAULT FALSE,   -- Special "Last Session" preset
    
    -- Metadata
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    last_used_at INTEGER,
    usage_count INTEGER NOT NULL DEFAULT 0,
    
    -- Constraints
    UNIQUE(name, is_default)  -- Can't have duplicate names within category
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_presets_is_default ON presets(is_default);
CREATE INDEX IF NOT EXISTS idx_presets_last_used ON presets(last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_presets_is_last_session ON presets(is_last_session);
```

### Table: `cached_apps`

Caches installed applications to avoid rescanning every session.

```sql
CREATE TABLE IF NOT EXISTS cached_apps (
    -- Identity
    id TEXT PRIMARY KEY,
    app_name TEXT NOT NULL,
    
    -- Platform-specific identifiers
    bundle_id TEXT,                    -- macOS: com.apple.Safari
    exe_path TEXT,                     -- Windows: C:\Program Files\app.exe
    
    -- Classification
    category TEXT NOT NULL DEFAULT 'unknown' 
        CHECK (category IN ('productivity', 'communication', 'browser', 
                            'entertainment', 'social', 'game', 'utility', 'unknown')),
    
    -- Flags
    is_browser BOOLEAN NOT NULL DEFAULT FALSE,
    is_default_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    is_default_whitelisted BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- User overrides (NULL = use default)
    user_classification TEXT CHECK (user_classification IN ('whitelisted', 'blocked', NULL)),
    
    -- Metadata
    first_seen_at INTEGER NOT NULL,
    last_seen_at INTEGER NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cached_apps_category ON cached_apps(category);
CREATE INDEX IF NOT EXISTS idx_cached_apps_name ON cached_apps(app_name);
```

### Table: `blocked_domains`

Default and user-configured blocked domains.

```sql
CREATE TABLE IF NOT EXISTS blocked_domains (
    id TEXT PRIMARY KEY,
    domain TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'social'
        CHECK (category IN ('social', 'entertainment', 'gaming', 'news', 'shopping', 'other')),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    added_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blocked_domains_domain ON blocked_domains(domain);
```

### Table: `app_scan_metadata`

Tracks when apps were last scanned.

```sql
CREATE TABLE IF NOT EXISTS app_scan_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Keys we'll store:
-- 'last_full_scan' - timestamp of last complete app scan
-- 'app_count' - number of apps found
-- 'scan_version' - version of scanning logic (for migrations)
```

---

## Rust Types

### `src-tauri/src/presets/types.rs`

```rust
use serde::{Deserialize, Serialize};

/// Session mode
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SessionMode {
    Zen,
    Flow,
    Legend,
}

impl SessionMode {
    pub fn as_str(&self) -> &'static str {
        match self {
            SessionMode::Zen => "Zen",
            SessionMode::Flow => "Flow",
            SessionMode::Legend => "Legend",
        }
    }
    
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "zen" => Some(SessionMode::Zen),
            "flow" => Some(SessionMode::Flow),
            "legend" => Some(SessionMode::Legend),
            _ => None,
        }
    }
}

/// A saved session preset
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionPreset {
    // Identity
    pub id: String,
    pub name: String,
    pub icon: String,
    
    // Session configuration
    pub mode: SessionMode,
    pub duration_minutes: i32,
    
    // Whitelisting
    pub whitelisted_apps: Vec<String>,
    pub whitelisted_domains: Vec<String>,
    
    // Behavior
    pub use_default_blocklist: bool,
    pub include_mental_prep: bool,
    
    // Classification
    pub is_default: bool,
    pub is_last_session: bool,
    
    // Metadata
    pub created_at: u64,
    pub updated_at: u64,
    pub last_used_at: Option<u64>,
    pub usage_count: i32,
}

impl SessionPreset {
    /// Create a new user preset
    pub fn new(name: String, icon: String, mode: SessionMode, duration_minutes: i32) -> Self {
        let now = crate::utils::now_ms();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            icon,
            mode,
            duration_minutes,
            whitelisted_apps: Vec::new(),
            whitelisted_domains: Vec::new(),
            use_default_blocklist: true,
            include_mental_prep: true,
            is_default: false,
            is_last_session: false,
            created_at: now,
            updated_at: now,
            last_used_at: None,
            usage_count: 0,
        }
    }
    
    /// Create the special "Last Session" preset
    pub fn last_session() -> Self {
        let now = crate::utils::now_ms();
        Self {
            id: "last_session".to_string(),
            name: "Last Session".to_string(),
            icon: "🔄".to_string(),
            mode: SessionMode::Zen,
            duration_minutes: 30,
            whitelisted_apps: Vec::new(),
            whitelisted_domains: Vec::new(),
            use_default_blocklist: true,
            include_mental_prep: false,
            is_default: false,
            is_last_session: true,
            created_at: now,
            updated_at: now,
            last_used_at: None,
            usage_count: 0,
        }
    }
}

/// App category for classification
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum AppCategory {
    Productivity,
    Communication,
    Browser,
    Entertainment,
    Social,
    Game,
    Utility,
    Unknown,
}

impl AppCategory {
    pub fn as_str(&self) -> &'static str {
        match self {
            AppCategory::Productivity => "productivity",
            AppCategory::Communication => "communication",
            AppCategory::Browser => "browser",
            AppCategory::Entertainment => "entertainment",
            AppCategory::Social => "social",
            AppCategory::Game => "game",
            AppCategory::Utility => "utility",
            AppCategory::Unknown => "unknown",
        }
    }
    
    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "productivity" => AppCategory::Productivity,
            "communication" => AppCategory::Communication,
            "browser" => AppCategory::Browser,
            "entertainment" => AppCategory::Entertainment,
            "social" => AppCategory::Social,
            "game" => AppCategory::Game,
            "utility" => AppCategory::Utility,
            _ => AppCategory::Unknown,
        }
    }
    
    /// Whether this category is blocked by default
    pub fn is_default_blocked(&self) -> bool {
        matches!(self, AppCategory::Social | AppCategory::Game | AppCategory::Entertainment)
    }
}

/// A cached application entry
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedApp {
    pub id: String,
    pub app_name: String,
    pub bundle_id: Option<String>,
    pub exe_path: Option<String>,
    pub category: AppCategory,
    pub is_browser: bool,
    pub is_default_blocked: bool,
    pub is_default_whitelisted: bool,
    pub user_classification: Option<String>,  // "whitelisted", "blocked", or None
    pub first_seen_at: u64,
    pub last_seen_at: u64,
}

/// Domain block entry
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlockedDomain {
    pub id: String,
    pub domain: String,
    pub category: String,
    pub is_default: bool,
    pub added_at: u64,
}

/// Input for creating a new preset
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePresetInput {
    pub name: String,
    pub icon: String,
    pub mode: String,
    pub duration_minutes: i32,
    pub whitelisted_apps: Vec<String>,
    pub whitelisted_domains: Vec<String>,
    pub use_default_blocklist: bool,
    pub include_mental_prep: bool,
}

/// Input for updating a preset
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePresetInput {
    pub id: String,
    pub name: Option<String>,
    pub icon: Option<String>,
    pub mode: Option<String>,
    pub duration_minutes: Option<i32>,
    pub whitelisted_apps: Option<Vec<String>>,
    pub whitelisted_domains: Option<Vec<String>>,
    pub use_default_blocklist: Option<bool>,
    pub include_mental_prep: Option<bool>,
}

/// Result of starting a session from Quick Start
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuickStartConfig {
    pub mode: SessionMode,
    pub duration_minutes: i32,
    pub whitelisted_apps: Vec<String>,
    pub whitelisted_domains: Vec<String>,
    pub blocked_apps: Vec<String>,
    pub blocked_domains: Vec<String>,
}
```

---

## Rust Persistence Layer

### `src-tauri/src/presets/persistence.rs`

```rust
use rusqlite::{params, Connection, Result as SqliteResult};
use crate::presets::types::*;
use crate::utils::now_ms;

/// Initialize preset tables
pub fn init_preset_tables(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "
        -- Presets table
        CREATE TABLE IF NOT EXISTS presets (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            icon TEXT NOT NULL DEFAULT '🎯',
            mode TEXT NOT NULL CHECK (mode IN ('Zen', 'Flow', 'Legend')),
            duration_minutes INTEGER NOT NULL DEFAULT 30,
            whitelisted_apps TEXT NOT NULL DEFAULT '[]',
            whitelisted_domains TEXT NOT NULL DEFAULT '[]',
            use_default_blocklist BOOLEAN NOT NULL DEFAULT TRUE,
            include_mental_prep BOOLEAN NOT NULL DEFAULT TRUE,
            is_default BOOLEAN NOT NULL DEFAULT FALSE,
            is_last_session BOOLEAN NOT NULL DEFAULT FALSE,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            last_used_at INTEGER,
            usage_count INTEGER NOT NULL DEFAULT 0
        );
        
        CREATE INDEX IF NOT EXISTS idx_presets_is_default ON presets(is_default);
        CREATE INDEX IF NOT EXISTS idx_presets_last_used ON presets(last_used_at DESC);
        CREATE INDEX IF NOT EXISTS idx_presets_is_last_session ON presets(is_last_session);
        
        -- Cached apps table
        CREATE TABLE IF NOT EXISTS cached_apps (
            id TEXT PRIMARY KEY,
            app_name TEXT NOT NULL,
            bundle_id TEXT,
            exe_path TEXT,
            category TEXT NOT NULL DEFAULT 'unknown',
            is_browser BOOLEAN NOT NULL DEFAULT FALSE,
            is_default_blocked BOOLEAN NOT NULL DEFAULT FALSE,
            is_default_whitelisted BOOLEAN NOT NULL DEFAULT FALSE,
            user_classification TEXT,
            first_seen_at INTEGER NOT NULL,
            last_seen_at INTEGER NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_cached_apps_category ON cached_apps(category);
        CREATE INDEX IF NOT EXISTS idx_cached_apps_name ON cached_apps(app_name);
        
        -- Blocked domains table
        CREATE TABLE IF NOT EXISTS blocked_domains (
            id TEXT PRIMARY KEY,
            domain TEXT NOT NULL UNIQUE,
            category TEXT NOT NULL DEFAULT 'social',
            is_default BOOLEAN NOT NULL DEFAULT FALSE,
            added_at INTEGER NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_blocked_domains_domain ON blocked_domains(domain);
        
        -- App scan metadata
        CREATE TABLE IF NOT EXISTS app_scan_metadata (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        );
        "
    ).map_err(|e| format!("Failed to create preset tables: {}", e))?;
    
    Ok(())
}

// ==================== PRESET CRUD ====================

/// Create a new preset
pub fn create_preset(conn: &Connection, input: &CreatePresetInput) -> Result<SessionPreset, String> {
    let now = now_ms();
    let id = uuid::Uuid::new_v4().to_string();
    
    let mode = SessionMode::from_str(&input.mode)
        .ok_or_else(|| format!("Invalid mode: {}", input.mode))?;
    
    let whitelisted_apps_json = serde_json::to_string(&input.whitelisted_apps)
        .map_err(|e| e.to_string())?;
    let whitelisted_domains_json = serde_json::to_string(&input.whitelisted_domains)
        .map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT INTO presets (
            id, name, icon, mode, duration_minutes,
            whitelisted_apps, whitelisted_domains,
            use_default_blocklist, include_mental_prep,
            is_default, is_last_session,
            created_at, updated_at, usage_count
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
        params![
            id,
            input.name,
            input.icon,
            mode.as_str(),
            input.duration_minutes,
            whitelisted_apps_json,
            whitelisted_domains_json,
            input.use_default_blocklist,
            input.include_mental_prep,
            false,  // is_default
            false,  // is_last_session
            now,
            now,
            0,      // usage_count
        ],
    ).map_err(|e| format!("Failed to create preset: {}", e))?;
    
    get_preset_by_id(conn, &id)
}

/// Get a preset by ID
pub fn get_preset_by_id(conn: &Connection, id: &str) -> Result<SessionPreset, String> {
    conn.query_row(
        "SELECT * FROM presets WHERE id = ?1",
        params![id],
        |row| row_to_preset(row),
    ).map_err(|e| format!("Preset not found: {}", e))
}

/// Get all user presets (non-default, non-last-session)
pub fn get_user_presets(conn: &Connection) -> Result<Vec<SessionPreset>, String> {
    let mut stmt = conn.prepare(
        "SELECT * FROM presets 
         WHERE is_default = FALSE AND is_last_session = FALSE
         ORDER BY last_used_at DESC NULLS LAST, created_at DESC"
    ).map_err(|e| e.to_string())?;
    
    let presets = stmt.query_map([], |row| row_to_preset(row))
        .map_err(|e| e.to_string())?;
    
    presets.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

/// Get all default presets
pub fn get_default_presets(conn: &Connection) -> Result<Vec<SessionPreset>, String> {
    let mut stmt = conn.prepare(
        "SELECT * FROM presets WHERE is_default = TRUE ORDER BY name"
    ).map_err(|e| e.to_string())?;
    
    let presets = stmt.query_map([], |row| row_to_preset(row))
        .map_err(|e| e.to_string())?;
    
    presets.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

/// Get the "Last Session" preset
pub fn get_last_session_preset(conn: &Connection) -> Result<Option<SessionPreset>, String> {
    let result = conn.query_row(
        "SELECT * FROM presets WHERE is_last_session = TRUE",
        [],
        |row| row_to_preset(row),
    );
    
    match result {
        Ok(preset) => Ok(Some(preset)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

/// Update or create the "Last Session" preset
pub fn save_last_session(conn: &Connection, preset: &SessionPreset) -> Result<(), String> {
    let now = now_ms();
    
    let whitelisted_apps_json = serde_json::to_string(&preset.whitelisted_apps)
        .map_err(|e| e.to_string())?;
    let whitelisted_domains_json = serde_json::to_string(&preset.whitelisted_domains)
        .map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT OR REPLACE INTO presets (
            id, name, icon, mode, duration_minutes,
            whitelisted_apps, whitelisted_domains,
            use_default_blocklist, include_mental_prep,
            is_default, is_last_session,
            created_at, updated_at, last_used_at, usage_count
        ) VALUES ('last_session', 'Last Session', '🔄', ?1, ?2, ?3, ?4, ?5, ?6, FALSE, TRUE, ?7, ?8, ?9, 0)",
        params![
            preset.mode.as_str(),
            preset.duration_minutes,
            whitelisted_apps_json,
            whitelisted_domains_json,
            preset.use_default_blocklist,
            preset.include_mental_prep,
            preset.created_at,
            now,
            now,
        ],
    ).map_err(|e| format!("Failed to save last session: {}", e))?;
    
    Ok(())
}

/// Update a preset
pub fn update_preset(conn: &Connection, input: &UpdatePresetInput) -> Result<SessionPreset, String> {
    let existing = get_preset_by_id(conn, &input.id)?;
    
    // Don't allow editing default presets
    if existing.is_default {
        return Err("Cannot edit default presets".to_string());
    }
    
    let now = now_ms();
    
    let name = input.name.as_ref().unwrap_or(&existing.name);
    let icon = input.icon.as_ref().unwrap_or(&existing.icon);
    let mode_str = input.mode.as_ref()
        .map(|s| s.as_str())
        .unwrap_or(existing.mode.as_str());
    let duration = input.duration_minutes.unwrap_or(existing.duration_minutes);
    let apps = input.whitelisted_apps.as_ref().unwrap_or(&existing.whitelisted_apps);
    let domains = input.whitelisted_domains.as_ref().unwrap_or(&existing.whitelisted_domains);
    let use_blocklist = input.use_default_blocklist.unwrap_or(existing.use_default_blocklist);
    let include_prep = input.include_mental_prep.unwrap_or(existing.include_mental_prep);
    
    let apps_json = serde_json::to_string(apps).map_err(|e| e.to_string())?;
    let domains_json = serde_json::to_string(domains).map_err(|e| e.to_string())?;
    
    conn.execute(
        "UPDATE presets SET
            name = ?1, icon = ?2, mode = ?3, duration_minutes = ?4,
            whitelisted_apps = ?5, whitelisted_domains = ?6,
            use_default_blocklist = ?7, include_mental_prep = ?8,
            updated_at = ?9
         WHERE id = ?10",
        params![
            name, icon, mode_str, duration,
            apps_json, domains_json,
            use_blocklist, include_prep,
            now, input.id
        ],
    ).map_err(|e| format!("Failed to update preset: {}", e))?;
    
    get_preset_by_id(conn, &input.id)
}

/// Delete a preset
pub fn delete_preset(conn: &Connection, id: &str) -> Result<(), String> {
    let existing = get_preset_by_id(conn, id)?;
    
    // Don't allow deleting default or last session presets
    if existing.is_default {
        return Err("Cannot delete default presets".to_string());
    }
    if existing.is_last_session {
        return Err("Cannot delete Last Session preset".to_string());
    }
    
    conn.execute("DELETE FROM presets WHERE id = ?1", params![id])
        .map_err(|e| format!("Failed to delete preset: {}", e))?;
    
    Ok(())
}

/// Record that a preset was used
pub fn record_preset_usage(conn: &Connection, id: &str) -> Result<(), String> {
    let now = now_ms();
    
    conn.execute(
        "UPDATE presets SET usage_count = usage_count + 1, last_used_at = ?1 WHERE id = ?2",
        params![now, id],
    ).map_err(|e| format!("Failed to record usage: {}", e))?;
    
    Ok(())
}

/// Count user presets (for enforcing limit)
pub fn count_user_presets(conn: &Connection) -> Result<i32, String> {
    conn.query_row(
        "SELECT COUNT(*) FROM presets WHERE is_default = FALSE AND is_last_session = FALSE",
        [],
        |row| row.get(0),
    ).map_err(|e| e.to_string())
}

/// Helper: Convert database row to SessionPreset
fn row_to_preset(row: &rusqlite::Row) -> rusqlite::Result<SessionPreset> {
    let mode_str: String = row.get("mode")?;
    let mode = SessionMode::from_str(&mode_str).unwrap_or(SessionMode::Zen);
    
    let apps_json: String = row.get("whitelisted_apps")?;
    let domains_json: String = row.get("whitelisted_domains")?;
    
    let whitelisted_apps: Vec<String> = serde_json::from_str(&apps_json).unwrap_or_default();
    let whitelisted_domains: Vec<String> = serde_json::from_str(&domains_json).unwrap_or_default();
    
    Ok(SessionPreset {
        id: row.get("id")?,
        name: row.get("name")?,
        icon: row.get("icon")?,
        mode,
        duration_minutes: row.get("duration_minutes")?,
        whitelisted_apps,
        whitelisted_domains,
        use_default_blocklist: row.get("use_default_blocklist")?,
        include_mental_prep: row.get("include_mental_prep")?,
        is_default: row.get("is_default")?,
        is_last_session: row.get("is_last_session")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        last_used_at: row.get("last_used_at")?,
        usage_count: row.get("usage_count")?,
    })
}
```

---

## Tauri Commands

### `src-tauri/src/commands/presets.rs`

```rust
use tauri::{command, State};
use crate::storage::AppState;
use crate::presets::types::*;
use crate::presets::persistence::*;
use crate::presets::defaults::*;

const MAX_USER_PRESETS: i32 = 5;

/// Initialize preset system (call on app startup)
#[command]
pub fn init_presets(state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    
    // Create tables
    init_preset_tables(&conn)?;
    
    // Insert default presets if they don't exist
    insert_default_presets(&conn)?;
    
    // Insert default blocked domains if they don't exist
    insert_default_blocked_domains(&conn)?;
    
    Ok(())
}

/// Get all presets organized by category
#[command]
pub fn get_all_presets(state: State<AppState>) -> Result<AllPresetsResponse, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    
    let last_session = get_last_session_preset(&conn)?;
    let user_presets = get_user_presets(&conn)?;
    let default_presets = get_default_presets(&conn)?;
    
    Ok(AllPresetsResponse {
        last_session,
        user_presets,
        default_presets,
    })
}

/// Create a new user preset
#[command]
pub fn create_user_preset(
    state: State<AppState>,
    input: CreatePresetInput,
) -> Result<SessionPreset, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    
    // Check limit
    let count = count_user_presets(&conn)?;
    if count >= MAX_USER_PRESETS {
        return Err(format!("Maximum of {} presets allowed. Please delete one first.", MAX_USER_PRESETS));
    }
    
    create_preset(&conn, &input)
}

/// Update an existing preset
#[command]
pub fn update_user_preset(
    state: State<AppState>,
    input: UpdatePresetInput,
) -> Result<SessionPreset, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    update_preset(&conn, &input)
}

/// Delete a preset
#[command]
pub fn delete_user_preset(state: State<AppState>, id: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    delete_preset(&conn, &id)
}

/// Save current session as "Last Session"
#[command]
pub fn save_as_last_session(
    state: State<AppState>,
    preset: SessionPreset,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    save_last_session(&conn, &preset)
}

/// Record that a preset was used (for sorting by recent)
#[command]
pub fn use_preset(state: State<AppState>, id: String) -> Result<SessionPreset, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    record_preset_usage(&conn, &id)?;
    get_preset_by_id(&conn, &id)
}

/// Get Quick Start configuration with smart defaults
#[command]
pub fn get_quick_start_config(
    state: State<AppState>,
    mode: String,
    duration_minutes: i32,
) -> Result<QuickStartConfig, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    
    let session_mode = SessionMode::from_str(&mode)
        .ok_or_else(|| format!("Invalid mode: {}", mode))?;
    
    // Get default whitelisted apps (productivity + communication)
    let whitelisted_apps = get_default_whitelisted_apps(&conn)?;
    
    // Get default whitelisted domains
    let whitelisted_domains = get_default_whitelisted_domains();
    
    // Get blocked apps
    let blocked_apps = get_default_blocked_apps(&conn)?;
    
    // Get blocked domains
    let blocked_domains = get_all_blocked_domains(&conn)?;
    
    Ok(QuickStartConfig {
        mode: session_mode,
        duration_minutes,
        whitelisted_apps,
        whitelisted_domains,
        blocked_apps,
        blocked_domains,
    })
}

/// Response type for get_all_presets
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AllPresetsResponse {
    pub last_session: Option<SessionPreset>,
    pub user_presets: Vec<SessionPreset>,
    pub default_presets: Vec<SessionPreset>,
}
```

---

# A2: Default Presets & Smart Whitelisting

## Default Presets

### `src-tauri/src/presets/defaults.rs`

```rust
use rusqlite::{params, Connection};
use crate::presets::types::*;
use crate::utils::now_ms;

/// Insert default presets if they don't exist
pub fn insert_default_presets(conn: &Connection) -> Result<(), String> {
    let defaults = get_default_preset_definitions();
    
    for preset in defaults {
        // Check if already exists
        let exists: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM presets WHERE id = ?1)",
            params![preset.id],
            |row| row.get(0),
        ).map_err(|e| e.to_string())?;
        
        if !exists {
            let apps_json = serde_json::to_string(&preset.whitelisted_apps)
                .map_err(|e| e.to_string())?;
            let domains_json = serde_json::to_string(&preset.whitelisted_domains)
                .map_err(|e| e.to_string())?;
            
            conn.execute(
                "INSERT INTO presets (
                    id, name, icon, mode, duration_minutes,
                    whitelisted_apps, whitelisted_domains,
                    use_default_blocklist, include_mental_prep,
                    is_default, is_last_session,
                    created_at, updated_at, usage_count
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, TRUE, FALSE, ?10, ?11, 0)",
                params![
                    preset.id,
                    preset.name,
                    preset.icon,
                    preset.mode.as_str(),
                    preset.duration_minutes,
                    apps_json,
                    domains_json,
                    preset.use_default_blocklist,
                    preset.include_mental_prep,
                    preset.created_at,
                    preset.updated_at,
                ],
            ).map_err(|e| format!("Failed to insert default preset: {}", e))?;
        }
    }
    
    Ok(())
}

/// Get the default preset definitions
pub fn get_default_preset_definitions() -> Vec<SessionPreset> {
    let now = now_ms();
    
    vec![
        // Quick Focus - Zen mode, short session, minimal config
        SessionPreset {
            id: "default_quick_focus".to_string(),
            name: "Quick Focus".to_string(),
            icon: "🧘".to_string(),
            mode: SessionMode::Zen,
            duration_minutes: 25,
            whitelisted_apps: vec![], // Empty = use defaults
            whitelisted_domains: vec![],
            use_default_blocklist: true,
            include_mental_prep: false,
            is_default: true,
            is_last_session: false,
            created_at: now,
            updated_at: now,
            last_used_at: None,
            usage_count: 0,
        },
        
        // Deep Work - Flow mode, longer session
        SessionPreset {
            id: "default_deep_work".to_string(),
            name: "Deep Work".to_string(),
            icon: "🌊".to_string(),
            mode: SessionMode::Flow,
            duration_minutes: 60,
            whitelisted_apps: vec![],
            whitelisted_domains: vec![
                "github.com".to_string(),
                "gitlab.com".to_string(),
                "stackoverflow.com".to_string(),
                "docs.google.com".to_string(),
            ],
            use_default_blocklist: true,
            include_mental_prep: false,
            is_default: true,
            is_last_session: false,
            created_at: now,
            updated_at: now,
            last_used_at: None,
            usage_count: 0,
        },
        
        // Coding Sprint - Legend mode, intense focus
        SessionPreset {
            id: "default_coding_sprint".to_string(),
            name: "Coding Sprint".to_string(),
            icon: "🔥".to_string(),
            mode: SessionMode::Legend,
            duration_minutes: 90,
            whitelisted_apps: vec![
                "VS Code".to_string(),
                "Visual Studio Code".to_string(),
                "Cursor".to_string(),
                "Terminal".to_string(),
                "iTerm".to_string(),
                "Warp".to_string(),
            ],
            whitelisted_domains: vec![
                "github.com".to_string(),
                "stackoverflow.com".to_string(),
                "docs.rs".to_string(),
                "crates.io".to_string(),
                "npmjs.com".to_string(),
            ],
            use_default_blocklist: true,
            include_mental_prep: false,
            is_default: true,
            is_last_session: false,
            created_at: now,
            updated_at: now,
            last_used_at: None,
            usage_count: 0,
        },
        
        // Admin & Email - Zen mode, communication focused
        SessionPreset {
            id: "default_admin_email".to_string(),
            name: "Admin & Email".to_string(),
            icon: "📧".to_string(),
            mode: SessionMode::Zen,
            duration_minutes: 30,
            whitelisted_apps: vec![
                "Mail".to_string(),
                "Microsoft Outlook".to_string(),
                "Calendar".to_string(),
                "Slack".to_string(),
                "Microsoft Teams".to_string(),
                "Notion".to_string(),
            ],
            whitelisted_domains: vec![
                "gmail.com".to_string(),
                "mail.google.com".to_string(),
                "calendar.google.com".to_string(),
                "outlook.com".to_string(),
                "outlook.office.com".to_string(),
                "notion.so".to_string(),
                "slack.com".to_string(),
            ],
            use_default_blocklist: true,
            include_mental_prep: false,
            is_default: true,
            is_last_session: false,
            created_at: now,
            updated_at: now,
            last_used_at: None,
            usage_count: 0,
        },
    ]
}

/// Insert default blocked domains
pub fn insert_default_blocked_domains(conn: &Connection) -> Result<(), String> {
    let domains = get_default_blocked_domain_list();
    let now = now_ms();
    
    for (domain, category) in domains {
        conn.execute(
            "INSERT OR IGNORE INTO blocked_domains (id, domain, category, is_default, added_at)
             VALUES (?1, ?2, ?3, TRUE, ?4)",
            params![
                uuid::Uuid::new_v4().to_string(),
                domain,
                category,
                now,
            ],
        ).map_err(|e| format!("Failed to insert blocked domain: {}", e))?;
    }
    
    Ok(())
}

/// Default blocked domains list
pub fn get_default_blocked_domain_list() -> Vec<(&'static str, &'static str)> {
    vec![
        // Social Media
        ("twitter.com", "social"),
        ("x.com", "social"),
        ("facebook.com", "social"),
        ("instagram.com", "social"),
        ("tiktok.com", "social"),
        ("snapchat.com", "social"),
        ("reddit.com", "social"),
        ("tumblr.com", "social"),
        ("pinterest.com", "social"),
        ("threads.net", "social"),
        
        // Entertainment / Streaming
        ("netflix.com", "entertainment"),
        ("hulu.com", "entertainment"),
        ("disneyplus.com", "entertainment"),
        ("hbomax.com", "entertainment"),
        ("primevideo.com", "entertainment"),
        ("twitch.tv", "entertainment"),
        ("crunchyroll.com", "entertainment"),
        
        // Gaming
        ("steampowered.com", "gaming"),
        ("store.steampowered.com", "gaming"),
        ("epicgames.com", "gaming"),
        ("gog.com", "gaming"),
        ("itch.io", "gaming"),
        ("roblox.com", "gaming"),
        
        // News (optional - can be distracting)
        ("news.ycombinator.com", "news"),
        ("buzzfeed.com", "news"),
        
        // Shopping
        ("amazon.com", "shopping"),
        ("ebay.com", "shopping"),
        ("etsy.com", "shopping"),
    ]
}

/// Get all blocked domains from database
pub fn get_all_blocked_domains(conn: &Connection) -> Result<Vec<String>, String> {
    let mut stmt = conn.prepare("SELECT domain FROM blocked_domains")
        .map_err(|e| e.to_string())?;
    
    let domains = stmt.query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    
    domains.collect::<Result<Vec<String>, _>>()
        .map_err(|e| e.to_string())
}

/// Get default whitelisted apps from cache (productivity + communication)
pub fn get_default_whitelisted_apps(conn: &Connection) -> Result<Vec<String>, String> {
    let mut stmt = conn.prepare(
        "SELECT app_name FROM cached_apps 
         WHERE (category IN ('productivity', 'communication', 'browser', 'utility') 
                OR is_default_whitelisted = TRUE)
           AND is_default_blocked = FALSE
           AND (user_classification IS NULL OR user_classification = 'whitelisted')"
    ).map_err(|e| e.to_string())?;
    
    let apps = stmt.query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    
    apps.collect::<Result<Vec<String>, _>>()
        .map_err(|e| e.to_string())
}

/// Get default blocked apps from cache (social + games + entertainment)
pub fn get_default_blocked_apps(conn: &Connection) -> Result<Vec<String>, String> {
    let mut stmt = conn.prepare(
        "SELECT app_name FROM cached_apps 
         WHERE (category IN ('social', 'game', 'entertainment') 
                OR is_default_blocked = TRUE)
           AND (user_classification IS NULL OR user_classification = 'blocked')"
    ).map_err(|e| e.to_string())?;
    
    let apps = stmt.query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    
    apps.collect::<Result<Vec<String>, _>>()
        .map_err(|e| e.to_string())
}

/// Default whitelisted domains (always allowed)
pub fn get_default_whitelisted_domains() -> Vec<String> {
    vec![
        // Development
        "github.com".to_string(),
        "gitlab.com".to_string(),
        "bitbucket.org".to_string(),
        "stackoverflow.com".to_string(),
        "stackexchange.com".to_string(),
        "developer.mozilla.org".to_string(),
        "docs.rs".to_string(),
        "crates.io".to_string(),
        "npmjs.com".to_string(),
        "pypi.org".to_string(),
        
        // Productivity
        "notion.so".to_string(),
        "linear.app".to_string(),
        "asana.com".to_string(),
        "trello.com".to_string(),
        "monday.com".to_string(),
        "clickup.com".to_string(),
        "figma.com".to_string(),
        
        // Google Workspace
        "docs.google.com".to_string(),
        "sheets.google.com".to_string(),
        "slides.google.com".to_string(),
        "drive.google.com".to_string(),
        "calendar.google.com".to_string(),
        "mail.google.com".to_string(),
        
        // Microsoft
        "outlook.office.com".to_string(),
        "office.com".to_string(),
        "sharepoint.com".to_string(),
        "teams.microsoft.com".to_string(),
        
        // Communication (work)
        "slack.com".to_string(),
        "zoom.us".to_string(),
        
        // AI Tools
        "chat.openai.com".to_string(),
        "claude.ai".to_string(),
        "anthropic.com".to_string(),
        
        // Music (background focus)
        "spotify.com".to_string(),
        "music.apple.com".to_string(),
        "soundcloud.com".to_string(),
    ]
}
```

---

## App Categorization

### `src-tauri/src/presets/app_cache.rs`

```rust
use rusqlite::{params, Connection};
use crate::presets::types::*;
use crate::utils::now_ms;

/// Known app categorizations (extend as needed)
pub fn categorize_app(app_name: &str, bundle_id: Option<&str>) -> AppCategory {
    let name_lower = app_name.to_lowercase();
    let bundle_lower = bundle_id.map(|b| b.to_lowercase()).unwrap_or_default();
    
    // Browsers
    if name_lower.contains("safari") || name_lower.contains("chrome") 
        || name_lower.contains("firefox") || name_lower.contains("edge")
        || name_lower.contains("arc") || name_lower.contains("brave")
        || bundle_lower.contains("browser") {
        return AppCategory::Browser;
    }
    
    // Code Editors / IDEs (Productivity)
    if name_lower.contains("code") || name_lower.contains("cursor")
        || name_lower.contains("sublime") || name_lower.contains("atom")
        || name_lower.contains("xcode") || name_lower.contains("android studio")
        || name_lower.contains("intellij") || name_lower.contains("webstorm")
        || name_lower.contains("pycharm") || name_lower.contains("vim")
        || name_lower.contains("emacs") || name_lower.contains("neovim") {
        return AppCategory::Productivity;
    }
    
    // Terminals (Productivity)
    if name_lower.contains("terminal") || name_lower.contains("iterm")
        || name_lower.contains("warp") || name_lower.contains("hyper")
        || name_lower.contains("kitty") || name_lower.contains("alacritty") {
        return AppCategory::Productivity;
    }
    
    // Office / Productivity Apps
    if name_lower.contains("word") || name_lower.contains("excel")
        || name_lower.contains("powerpoint") || name_lower.contains("pages")
        || name_lower.contains("numbers") || name_lower.contains("keynote")
        || name_lower.contains("notion") || name_lower.contains("obsidian")
        || name_lower.contains("evernote") || name_lower.contains("bear")
        || name_lower.contains("notes") || name_lower.contains("reminders")
        || name_lower.contains("calendar") || name_lower.contains("figma")
        || name_lower.contains("sketch") || name_lower.contains("adobe") {
        return AppCategory::Productivity;
    }
    
    // Communication (Work)
    if name_lower.contains("slack") || name_lower.contains("teams")
        || name_lower.contains("zoom") || name_lower.contains("discord")
        || name_lower.contains("mail") || name_lower.contains("outlook")
        || name_lower.contains("messages") || name_lower.contains("webex") {
        return AppCategory::Communication;
    }
    
    // Social Media
    if name_lower.contains("twitter") || name_lower.contains("facebook")
        || name_lower.contains("instagram") || name_lower.contains("tiktok")
        || name_lower.contains("snapchat") || name_lower.contains("whatsapp")
        || name_lower.contains("telegram") || name_lower.contains("signal") {
        return AppCategory::Social;
    }
    
    // Games
    if name_lower.contains("steam") || name_lower.contains("epic games")
        || name_lower.contains("minecraft") || name_lower.contains("roblox")
        || bundle_lower.contains("game") {
        return AppCategory::Game;
    }
    
    // Entertainment
    if name_lower.contains("netflix") || name_lower.contains("spotify")
        || name_lower.contains("music") || name_lower.contains("tv")
        || name_lower.contains("photos") || name_lower.contains("youtube") {
        return AppCategory::Entertainment;
    }
    
    // Utilities
    if name_lower.contains("finder") || name_lower.contains("preview")
        || name_lower.contains("calculator") || name_lower.contains("system")
        || name_lower.contains("settings") || name_lower.contains("preferences") {
        return AppCategory::Utility;
    }
    
    AppCategory::Unknown
}

/// Cache a newly discovered app
pub fn cache_app(
    conn: &Connection,
    app_name: &str,
    bundle_id: Option<&str>,
    exe_path: Option<&str>,
) -> Result<CachedApp, String> {
    let now = now_ms();
    let id = uuid::Uuid::new_v4().to_string();
    let category = categorize_app(app_name, bundle_id);
    
    let is_browser = matches!(category, AppCategory::Browser);
    let is_default_blocked = category.is_default_blocked();
    let is_default_whitelisted = matches!(
        category, 
        AppCategory::Productivity | AppCategory::Communication | AppCategory::Utility
    );
    
    conn.execute(
        "INSERT OR REPLACE INTO cached_apps (
            id, app_name, bundle_id, exe_path, category,
            is_browser, is_default_blocked, is_default_whitelisted,
            first_seen_at, last_seen_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            id,
            app_name,
            bundle_id,
            exe_path,
            category.as_str(),
            is_browser,
            is_default_blocked,
            is_default_whitelisted,
            now,
            now,
        ],
    ).map_err(|e| format!("Failed to cache app: {}", e))?;
    
    Ok(CachedApp {
        id,
        app_name: app_name.to_string(),
        bundle_id: bundle_id.map(String::from),
        exe_path: exe_path.map(String::from),
        category,
        is_browser,
        is_default_blocked,
        is_default_whitelisted,
        user_classification: None,
        first_seen_at: now,
        last_seen_at: now,
    })
}

/// Get all cached apps
pub fn get_cached_apps(conn: &Connection) -> Result<Vec<CachedApp>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, app_name, bundle_id, exe_path, category,
                is_browser, is_default_blocked, is_default_whitelisted,
                user_classification, first_seen_at, last_seen_at
         FROM cached_apps
         ORDER BY app_name"
    ).map_err(|e| e.to_string())?;
    
    let apps = stmt.query_map([], |row| {
        let category_str: String = row.get(4)?;
        Ok(CachedApp {
            id: row.get(0)?,
            app_name: row.get(1)?,
            bundle_id: row.get(2)?,
            exe_path: row.get(3)?,
            category: AppCategory::from_str(&category_str),
            is_browser: row.get(5)?,
            is_default_blocked: row.get(6)?,
            is_default_whitelisted: row.get(7)?,
            user_classification: row.get(8)?,
            first_seen_at: row.get(9)?,
            last_seen_at: row.get(10)?,
        })
    }).map_err(|e| e.to_string())?;
    
    apps.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

/// Update user classification for an app
pub fn set_app_classification(
    conn: &Connection,
    app_name: &str,
    classification: Option<&str>,  // "whitelisted", "blocked", or None to reset
) -> Result<(), String> {
    conn.execute(
        "UPDATE cached_apps SET user_classification = ?1 WHERE app_name = ?2",
        params![classification, app_name],
    ).map_err(|e| format!("Failed to update app classification: {}", e))?;
    
    Ok(())
}

/// Check if app scan is needed
pub fn needs_app_scan(conn: &Connection) -> Result<bool, String> {
    let result = conn.query_row(
        "SELECT value FROM app_scan_metadata WHERE key = 'last_full_scan'",
        [],
        |row| row.get::<_, String>(0),
    );
    
    match result {
        Ok(timestamp_str) => {
            let last_scan: u64 = timestamp_str.parse().unwrap_or(0);
            let now = now_ms();
            let one_day_ms = 24 * 60 * 60 * 1000;
            
            // Rescan if more than 24 hours old
            Ok(now - last_scan > one_day_ms)
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(true), // Never scanned
        Err(e) => Err(e.to_string()),
    }
}

/// Record that an app scan was completed
pub fn record_app_scan(conn: &Connection, app_count: i32) -> Result<(), String> {
    let now = now_ms();
    
    conn.execute(
        "INSERT OR REPLACE INTO app_scan_metadata (key, value, updated_at) 
         VALUES ('last_full_scan', ?1, ?2)",
        params![now.to_string(), now],
    ).map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT OR REPLACE INTO app_scan_metadata (key, value, updated_at) 
         VALUES ('app_count', ?1, ?2)",
        params![app_count.to_string(), now],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}
```

---

## Module Exports

### `src-tauri/src/presets/mod.rs`

```rust
pub mod types;
pub mod persistence;
pub mod defaults;
pub mod app_cache;

pub use types::*;
pub use persistence::*;
pub use defaults::*;
pub use app_cache::*;
```

---

## TypeScript Types (Frontend Mirror)

### `src/lib/presets/types.ts`

```typescript
// Session mode
export type SessionMode = 'Zen' | 'Flow' | 'Legend'

// App category
export type AppCategory = 
  | 'productivity' 
  | 'communication' 
  | 'browser' 
  | 'entertainment' 
  | 'social' 
  | 'game' 
  | 'utility' 
  | 'unknown'

// A saved session preset
export interface SessionPreset {
  id: string
  name: string
  icon: string
  
  // Session configuration
  mode: SessionMode
  durationMinutes: number
  
  // Whitelisting
  whitelistedApps: string[]
  whitelistedDomains: string[]
  
  // Behavior
  useDefaultBlocklist: boolean
  includeMentalPrep: boolean
  
  // Classification
  isDefault: boolean
  isLastSession: boolean
  
  // Metadata
  createdAt: number
  updatedAt: number
  lastUsedAt: number | null
  usageCount: number
}

// Cached app entry
export interface CachedApp {
  id: string
  appName: string
  bundleId: string | null
  exePath: string | null
  category: AppCategory
  isBrowser: boolean
  isDefaultBlocked: boolean
  isDefaultWhitelisted: boolean
  userClassification: 'whitelisted' | 'blocked' | null
  firstSeenAt: number
  lastSeenAt: number
}

// Input for creating a preset
export interface CreatePresetInput {
  name: string
  icon: string
  mode: string
  durationMinutes: number
  whitelistedApps: string[]
  whitelistedDomains: string[]
  useDefaultBlocklist: boolean
  includeMentalPrep: boolean
}

// Input for updating a preset
export interface UpdatePresetInput {
  id: string
  name?: string
  icon?: string
  mode?: string
  durationMinutes?: number
  whitelistedApps?: string[]
  whitelistedDomains?: string[]
  useDefaultBlocklist?: boolean
  includeMentalPrep?: boolean
}

// Response from get_all_presets
export interface AllPresetsResponse {
  lastSession: SessionPreset | null
  userPresets: SessionPreset[]
  defaultPresets: SessionPreset[]
}

// Quick start configuration
export interface QuickStartConfig {
  mode: SessionMode
  durationMinutes: number
  whitelistedApps: string[]
  whitelistedDomains: string[]
  blockedApps: string[]
  blockedDomains: string[]
}

// Preset icons available for selection
export const PRESET_ICONS = [
  '🎯', '🔥', '🌊', '🧘', '⚡', '🚀', 
  '💻', '📝', '📧', '🎨', '📚', '🔧',
  '💡', '🏃', '🎮', '🎵', '📊', '✨'
]

// Duration quick-select options (minutes)
export const DURATION_OPTIONS = [15, 25, 30, 45, 60, 90, 120]

// Max user presets allowed
export const MAX_USER_PRESETS = 5
```

---

## Summary: What We've Designed

### Database Tables
| Table | Purpose |
|-------|---------|
| `presets` | User and default session presets |
| `cached_apps` | Installed apps with categorization |
| `blocked_domains` | Default and user-blocked domains |
| `app_scan_metadata` | Tracks when apps were last scanned |

### Rust Modules
| Module | Purpose |
|--------|---------|
| `types.rs` | Type definitions |
| `persistence.rs` | Database CRUD operations |
| `defaults.rs` | Default presets and blocklists |
| `app_cache.rs` | App scanning and categorization |

### Key Features
| Feature | Implementation |
|---------|----------------|
| Last Session | Special preset, auto-saved after each session |
| Default Presets | 4 presets shipped with app, not editable |
| User Presets | Max 5, fully customizable |
| Smart Whitelisting | Apps categorized automatically |
| Default Blocklist | Social, games, entertainment blocked |


