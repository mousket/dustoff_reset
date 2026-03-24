use rusqlite::{params, Connection};
use crate::presets::types::*;

/// Initialize preset tables
pub fn init_preset_tables(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "
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
        
        CREATE TABLE IF NOT EXISTS blocked_domains (
            id TEXT PRIMARY KEY,
            domain TEXT NOT NULL UNIQUE,
            category TEXT NOT NULL DEFAULT 'social',
            is_default BOOLEAN NOT NULL DEFAULT FALSE,
            added_at INTEGER NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_blocked_domains_domain ON blocked_domains(domain);
        
        CREATE TABLE IF NOT EXISTS app_scan_metadata (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        );
        "
    ).map_err(|e| format!("Failed to create preset tables: {}", e))?;
    
    Ok(())
}

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
            false,
            false,
            now,
            now,
            0,
        ],
    ).map_err(|e| format!("Failed to create preset: {}", e))?;
    
    get_preset_by_id(conn, &id)
}

/// Get a preset by ID
pub fn get_preset_by_id(conn: &Connection, id: &str) -> Result<SessionPreset, String> {
    conn.query_row(
        "SELECT id, name, icon, mode, duration_minutes, whitelisted_apps, whitelisted_domains,
                use_default_blocklist, include_mental_prep, is_default, is_last_session,
                created_at, updated_at, last_used_at, usage_count
         FROM presets WHERE id = ?1",
        params![id],
        |row| row_to_preset(row),
    ).map_err(|e| format!("Preset not found: {}", e))
}

/// Get all user presets (non-default, non-last-session)
pub fn get_user_presets(conn: &Connection) -> Result<Vec<SessionPreset>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, name, icon, mode, duration_minutes, whitelisted_apps, whitelisted_domains,
                use_default_blocklist, include_mental_prep, is_default, is_last_session,
                created_at, updated_at, last_used_at, usage_count
         FROM presets 
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
        "SELECT id, name, icon, mode, duration_minutes, whitelisted_apps, whitelisted_domains,
                use_default_blocklist, include_mental_prep, is_default, is_last_session,
                created_at, updated_at, last_used_at, usage_count
         FROM presets WHERE is_default = TRUE ORDER BY name"
    ).map_err(|e| e.to_string())?;
    
    let presets = stmt.query_map([], |row| row_to_preset(row))
        .map_err(|e| e.to_string())?;
    
    presets.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

/// Get the "Last Session" preset
pub fn get_last_session_preset(conn: &Connection) -> Result<Option<SessionPreset>, String> {
    let result = conn.query_row(
        "SELECT id, name, icon, mode, duration_minutes, whitelisted_apps, whitelisted_domains,
                use_default_blocklist, include_mental_prep, is_default, is_last_session,
                created_at, updated_at, last_used_at, usage_count
         FROM presets WHERE is_last_session = TRUE",
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
    let mode_str: String = row.get(3)?;
    let mode = SessionMode::from_str(&mode_str).unwrap_or(SessionMode::Zen);
    
    let apps_json: String = row.get(5)?;
    let domains_json: String = row.get(6)?;
    
    let whitelisted_apps: Vec<String> = serde_json::from_str(&apps_json).unwrap_or_default();
    let whitelisted_domains: Vec<String> = serde_json::from_str(&domains_json).unwrap_or_default();
    
    Ok(SessionPreset {
        id: row.get(0)?,
        name: row.get(1)?,
        icon: row.get(2)?,
        mode,
        duration_minutes: row.get(4)?,
        whitelisted_apps,
        whitelisted_domains,
        use_default_blocklist: row.get(7)?,
        include_mental_prep: row.get(8)?,
        is_default: row.get(9)?,
        is_last_session: row.get(10)?,
        created_at: row.get(11)?,
        updated_at: row.get(12)?,
        last_used_at: row.get(13)?,
        usage_count: row.get(14)?,
    })
}
