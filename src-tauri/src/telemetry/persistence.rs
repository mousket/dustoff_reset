// src-tauri/src/telemetry/persistence.rs
// SQLite persistence for telemetry events

use super::types::{SessionTelemetryStats, TelemetryEvent, TelemetryEventType};
use rusqlite::{params, Connection, OptionalExtension};

/// Initialize telemetry tables in the database
pub fn init_telemetry_tables(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        r#"
        -- Telemetry events table
        CREATE TABLE IF NOT EXISTS telemetry_events (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            app_name TEXT,
            bundle_id TEXT,
            window_title TEXT,
            browser TEXT,
            tab_url TEXT,
            tab_title TEXT,
            domain TEXT,
            metadata TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        );

        -- Session telemetry stats table
        CREATE TABLE IF NOT EXISTS session_telemetry_stats (
            session_id TEXT PRIMARY KEY,
            app_switches INTEGER DEFAULT 0,
            non_whitelisted_switches INTEGER DEFAULT 0,
            tab_switches INTEGER DEFAULT 0,
            non_whitelisted_domains INTEGER DEFAULT 0,
            time_in_whitelisted INTEGER DEFAULT 0,
            time_in_non_whitelisted INTEGER DEFAULT 0,
            app_usage TEXT DEFAULT '{}',
            domain_visits TEXT DEFAULT '{}',
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        );

        -- Index for faster queries
        CREATE INDEX IF NOT EXISTS idx_telemetry_events_session 
            ON telemetry_events(session_id);
        CREATE INDEX IF NOT EXISTS idx_telemetry_events_timestamp 
            ON telemetry_events(timestamp);
        CREATE INDEX IF NOT EXISTS idx_telemetry_events_type 
            ON telemetry_events(event_type);
        "#,
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// Save a telemetry event to the database
pub fn save_telemetry_event(conn: &Connection, event: &TelemetryEvent) -> Result<(), String> {
    let event_type_str = serde_json::to_string(&event.event_type)
        .map_err(|e| e.to_string())?
        .trim_matches('"')
        .to_string();

    conn.execute(
        r#"
        INSERT INTO telemetry_events (
            id, session_id, event_type, timestamp,
            app_name, bundle_id, window_title,
            browser, tab_url, tab_title, domain, metadata
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
        "#,
        params![
            event.id,
            event.session_id,
            event_type_str,
            event.timestamp,
            event.app_info.as_ref().map(|a| &a.app_name),
            event.app_info.as_ref().and_then(|a| a.bundle_id.as_ref()),
            event.app_info.as_ref().and_then(|a| a.window_title.as_ref()),
            event.browser_tab.as_ref().map(|b| &b.browser),
            event.browser_tab.as_ref().and_then(|b| b.url.as_ref()),
            event.browser_tab.as_ref().and_then(|b| b.title.as_ref()),
            event.browser_tab.as_ref().and_then(|b| b.domain.as_ref()),
            event.metadata,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// Get telemetry events for a session
pub fn get_session_events(
    conn: &Connection,
    session_id: &str,
) -> Result<Vec<TelemetryEvent>, String> {
    let mut stmt = conn
        .prepare(
            r#"
            SELECT id, session_id, event_type, timestamp,
                   app_name, bundle_id, window_title,
                   browser, tab_url, tab_title, domain, metadata
            FROM telemetry_events
            WHERE session_id = ?1
            ORDER BY timestamp ASC
            "#,
        )
        .map_err(|e| e.to_string())?;

    let events = stmt
        .query_map(params![session_id], |row| {
            let event_type_str: String = row.get(2)?;
            let event_type: TelemetryEventType =
                serde_json::from_str(&format!("\"{}\"", event_type_str))
                    .unwrap_or(TelemetryEventType::AppSwitch);

            let app_name: Option<String> = row.get(4)?;
            let bundle_id: Option<String> = row.get(5)?;
            let window_title: Option<String> = row.get(6)?;

            let browser: Option<String> = row.get(7)?;
            let tab_url: Option<String> = row.get(8)?;
            let tab_title: Option<String> = row.get(9)?;
            let domain: Option<String> = row.get(10)?;

            let app_info = app_name.map(|name| super::types::ActiveAppInfo {
                app_name: name,
                bundle_id,
                window_title,
                active_since: row.get(3).unwrap_or(0),
            });

            let browser_tab = browser.map(|b| super::types::BrowserTabInfo {
                browser: b,
                url: tab_url,
                title: tab_title,
                domain,
            });

            Ok(TelemetryEvent {
                id: row.get(0)?,
                session_id: row.get(1)?,
                event_type,
                timestamp: row.get(3)?,
                app_info,
                browser_tab,
                metadata: row.get(11)?,
            })
        })
        .map_err(|e| e.to_string())?;

    events.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

/// Save or update session telemetry stats
pub fn save_session_stats(
    conn: &Connection,
    session_id: &str,
    stats: &SessionTelemetryStats,
) -> Result<(), String> {
    let app_usage_json = serde_json::to_string(&stats.app_usage).map_err(|e| e.to_string())?;
    let domain_visits_json =
        serde_json::to_string(&stats.domain_visits).map_err(|e| e.to_string())?;

    conn.execute(
        r#"
        INSERT OR REPLACE INTO session_telemetry_stats (
            session_id, app_switches, non_whitelisted_switches,
            tab_switches, non_whitelisted_domains,
            time_in_whitelisted, time_in_non_whitelisted,
            app_usage, domain_visits, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, CURRENT_TIMESTAMP)
        "#,
        params![
            session_id,
            stats.app_switches,
            stats.non_whitelisted_switches,
            stats.tab_switches,
            stats.non_whitelisted_domains,
            stats.time_in_whitelisted,
            stats.time_in_non_whitelisted,
            app_usage_json,
            domain_visits_json,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// Get session telemetry stats
pub fn get_session_stats(
    conn: &Connection,
    session_id: &str,
) -> Result<Option<SessionTelemetryStats>, String> {
    let mut stmt = conn
        .prepare(
            r#"
            SELECT app_switches, non_whitelisted_switches,
                   tab_switches, non_whitelisted_domains,
                   time_in_whitelisted, time_in_non_whitelisted,
                   app_usage, domain_visits
            FROM session_telemetry_stats
            WHERE session_id = ?1
            "#,
        )
        .map_err(|e| e.to_string())?;

    let result = stmt
        .query_row(params![session_id], |row| {
            let app_usage_json: String = row.get(6)?;
            let domain_visits_json: String = row.get(7)?;

            let app_usage = serde_json::from_str(&app_usage_json).unwrap_or_default();
            let domain_visits = serde_json::from_str(&domain_visits_json).unwrap_or_default();

            Ok(SessionTelemetryStats {
                app_switches: row.get(0)?,
                non_whitelisted_switches: row.get(1)?,
                tab_switches: row.get(2)?,
                non_whitelisted_domains: row.get(3)?,
                time_in_whitelisted: row.get(4)?,
                time_in_non_whitelisted: row.get(5)?,
                app_usage,
                domain_visits,
            })
        })
        .optional()
        .map_err(|e| e.to_string())?;

    Ok(result)
}

/// Delete telemetry data for a session
pub fn delete_session_telemetry(conn: &Connection, session_id: &str) -> Result<(), String> {
    conn.execute(
        "DELETE FROM telemetry_events WHERE session_id = ?1",
        params![session_id],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "DELETE FROM session_telemetry_stats WHERE session_id = ?1",
        params![session_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// Get event counts by type for a session
pub fn get_event_counts(
    conn: &Connection,
    session_id: &str,
) -> Result<std::collections::HashMap<String, i32>, String> {
    let mut stmt = conn
        .prepare(
            r#"
            SELECT event_type, COUNT(*) as count
            FROM telemetry_events
            WHERE session_id = ?1
            GROUP BY event_type
            "#,
        )
        .map_err(|e| e.to_string())?;

    let counts = stmt
        .query_map(params![session_id], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i32>(1)?))
        })
        .map_err(|e| e.to_string())?;

    counts
        .collect::<Result<std::collections::HashMap<_, _>, _>>()
        .map_err(|e| e.to_string())
}
