use rusqlite::{params, Connection, Row};

use crate::models::{EndReason, SessionMode, SessionRecord, VictoryLevel};
use crate::storage::calibration::get_workday_date;

/// Helper to serialize SessionMode to string for database storage
fn mode_to_string(mode: &SessionMode) -> &'static str {
    match mode {
        SessionMode::Zen => "Zen",
        SessionMode::Flow => "Flow",
        SessionMode::Legend => "Legend",
    }
}

/// Helper to deserialize SessionMode from database string
fn mode_from_string(s: &str) -> SessionMode {
    match s {
        "Zen" => SessionMode::Zen,
        "Legend" => SessionMode::Legend,
        _ => SessionMode::Flow, // Default to Flow
    }
}

/// Helper to serialize VictoryLevel to string
fn victory_level_to_string(level: &VictoryLevel) -> &'static str {
    match level {
        VictoryLevel::Minimum => "Minimum",
        VictoryLevel::Good => "Good",
        VictoryLevel::Legend => "Legend",
        VictoryLevel::Missed => "Missed",
    }
}

/// Helper to deserialize VictoryLevel from database string
fn victory_level_from_string(s: &str) -> VictoryLevel {
    match s {
        "Minimum" => VictoryLevel::Minimum,
        "Good" => VictoryLevel::Good,
        "Legend" => VictoryLevel::Legend,
        _ => VictoryLevel::Missed,
    }
}

/// Helper to serialize EndReason to string
fn end_reason_to_string(reason: &EndReason) -> &'static str {
    match reason {
        EndReason::MissionComplete => "mission_complete",
        EndReason::StoppingEarly => "stopping_early",
        EndReason::PulledAway => "pulled_away",
    }
}

/// Helper to deserialize EndReason from database string
fn end_reason_from_string(s: &str) -> EndReason {
    match s {
        "mission_complete" => EndReason::MissionComplete,
        "stopping_early" => EndReason::StoppingEarly,
        "pulled_away" => EndReason::PulledAway,
        _ => EndReason::StoppingEarly,
    }
}

/// Helper to build a SessionRecord from a database row
fn session_from_row(row: &Row) -> Result<SessionRecord, rusqlite::Error> {
    // Get all columns
    let session_id: String = row.get(0)?;
    let started_at: String = row.get(1)?;
    let ended_at: Option<String> = row.get(2)?;
    let planned_duration_minutes: i32 = row.get(3)?;
    let actual_duration_minutes: Option<i32> = row.get(4)?;
    let mode_str: String = row.get(5)?;
    let intention: Option<String> = row.get(6)?;
    let victory_level_str: Option<String> = row.get(7)?;
    let flow_efficiency: Option<f64> = row.get(8)?;
    let longest_streak_minutes: i32 = row.get(9)?;
    let distraction_attempts: i32 = row.get(10)?;
    let interventions_used: i32 = row.get(11)?;
    let end_reason_str: Option<String> = row.get(12)?;
    let end_sub_reason: Option<String> = row.get(13)?;
    let timeline_blocks_json: String = row.get(14)?;
    let distraction_events_json: String = row.get(15)?;
    let intervention_events_json: String = row.get(16)?;
    let whitelisted_apps_json: String = row.get(17)?;
    let whitelisted_tabs_json: String = row.get(18)?;

    Ok(SessionRecord {
        session_id,
        started_at,
        ended_at,
        planned_duration_minutes,
        actual_duration_minutes,
        mode: mode_from_string(&mode_str),
        intention,
        victory_level: victory_level_str.map(|s| victory_level_from_string(&s)),
        flow_efficiency,
        longest_streak_minutes,
        distraction_attempts,
        interventions_used,
        end_reason: end_reason_str.map(|s| end_reason_from_string(&s)),
        end_sub_reason,
        timeline_blocks: serde_json::from_str(&timeline_blocks_json).unwrap_or_default(),
        distraction_events: serde_json::from_str(&distraction_events_json).unwrap_or_default(),
        intervention_events: serde_json::from_str(&intervention_events_json).unwrap_or_default(),
        whitelisted_apps: serde_json::from_str(&whitelisted_apps_json).unwrap_or_default(),
        whitelisted_tabs: serde_json::from_str(&whitelisted_tabs_json).unwrap_or_default(),
    })
}

/// Save or update a session record.
/// Uses INSERT OR REPLACE to handle both new and existing sessions.
pub fn save_session(conn: &Connection, session: &SessionRecord) -> Result<(), String> {
    // Serialize JSON fields
    let timeline_blocks_json =
        serde_json::to_string(&session.timeline_blocks).map_err(|e| e.to_string())?;
    let distraction_events_json =
        serde_json::to_string(&session.distraction_events).map_err(|e| e.to_string())?;
    let intervention_events_json =
        serde_json::to_string(&session.intervention_events).map_err(|e| e.to_string())?;
    let whitelisted_apps_json =
        serde_json::to_string(&session.whitelisted_apps).map_err(|e| e.to_string())?;
    let whitelisted_tabs_json =
        serde_json::to_string(&session.whitelisted_tabs).map_err(|e| e.to_string())?;

    // Convert enums to strings
    let mode_str = mode_to_string(&session.mode);
    let victory_level_str = session.victory_level.as_ref().map(victory_level_to_string);
    let end_reason_str = session.end_reason.as_ref().map(end_reason_to_string);

    conn.execute(
        r#"
        INSERT OR REPLACE INTO sessions 
        (id, started_at, ended_at, planned_duration_minutes, actual_duration_minutes,
         mode, intention, victory_level, flow_efficiency, longest_streak_minutes,
         distraction_attempts, interventions_used, end_reason, end_sub_reason,
         timeline_blocks, distraction_events, intervention_events,
         whitelisted_apps, whitelisted_tabs)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)
        "#,
        params![
            session.session_id,
            session.started_at,
            session.ended_at,
            session.planned_duration_minutes,
            session.actual_duration_minutes,
            mode_str,
            session.intention,
            victory_level_str,
            session.flow_efficiency,
            session.longest_streak_minutes,
            session.distraction_attempts,
            session.interventions_used,
            end_reason_str,
            session.end_sub_reason,
            timeline_blocks_json,
            distraction_events_json,
            intervention_events_json,
            whitelisted_apps_json,
            whitelisted_tabs_json,
        ],
    )
    .map_err(|e| format!("Failed to save session: {}", e))?;

    Ok(())
}

/// Get a session by its ID.
/// Returns None if the session doesn't exist.
pub fn get_session(conn: &Connection, session_id: &str) -> Result<Option<SessionRecord>, String> {
    let result = conn.query_row(
        r#"
        SELECT id, started_at, ended_at, planned_duration_minutes, actual_duration_minutes,
               mode, intention, victory_level, flow_efficiency, longest_streak_minutes,
               distraction_attempts, interventions_used, end_reason, end_sub_reason,
               timeline_blocks, distraction_events, intervention_events,
               whitelisted_apps, whitelisted_tabs
        FROM sessions 
        WHERE id = ?1
        "#,
        params![session_id],
        session_from_row,
    );

    match result {
        Ok(session) => Ok(Some(session)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Failed to get session: {}", e)),
    }
}

/// Get all sessions ordered by started_at DESC.
pub fn get_all_sessions(conn: &Connection) -> Result<Vec<SessionRecord>, String> {
    let mut stmt = conn
        .prepare(
            r#"
        SELECT id, started_at, ended_at, planned_duration_minutes, actual_duration_minutes,
               mode, intention, victory_level, flow_efficiency, longest_streak_minutes,
               distraction_attempts, interventions_used, end_reason, end_sub_reason,
               timeline_blocks, distraction_events, intervention_events,
               whitelisted_apps, whitelisted_tabs
        FROM sessions 
        ORDER BY started_at DESC
        "#,
        )
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let sessions = stmt
        .query_map([], session_from_row)
        .map_err(|e| format!("Failed to query sessions: {}", e))?;

    let mut results = Vec::new();
    for session in sessions {
        results.push(session.map_err(|e| format!("Failed to read session row: {}", e))?);
    }

    Ok(results)
}

/// Get sessions in a date range.
/// Dates should be in YYYY-MM-DD format.
/// Matches sessions where started_at is between start_date and end_date (inclusive).
pub fn get_sessions_in_range(
    conn: &Connection,
    start_date: &str,
    end_date: &str,
) -> Result<Vec<SessionRecord>, String> {
    let mut stmt = conn
        .prepare(
            r#"
        SELECT id, started_at, ended_at, planned_duration_minutes, actual_duration_minutes,
               mode, intention, victory_level, flow_efficiency, longest_streak_minutes,
               distraction_attempts, interventions_used, end_reason, end_sub_reason,
               timeline_blocks, distraction_events, intervention_events,
               whitelisted_apps, whitelisted_tabs
        FROM sessions 
        WHERE date(started_at) >= ?1 AND date(started_at) <= ?2
        ORDER BY started_at DESC
        "#,
        )
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let sessions = stmt
        .query_map(params![start_date, end_date], session_from_row)
        .map_err(|e| format!("Failed to query sessions: {}", e))?;

    let mut results = Vec::new();
    for session in sessions {
        results.push(session.map_err(|e| format!("Failed to read session row: {}", e))?);
    }

    Ok(results)
}

/// Get sessions for the current workday (using 5am boundary).
pub fn get_sessions_for_today(conn: &Connection) -> Result<Vec<SessionRecord>, String> {
    let today = get_workday_date();
    get_sessions_in_range(conn, &today, &today)
}

/// Get the most recent session (active or completed).
pub fn get_latest_session(conn: &Connection) -> Result<Option<SessionRecord>, String> {
    let result = conn.query_row(
        r#"
        SELECT id, started_at, ended_at, planned_duration_minutes, actual_duration_minutes,
               mode, intention, victory_level, flow_efficiency, longest_streak_minutes,
               distraction_attempts, interventions_used, end_reason, end_sub_reason,
               timeline_blocks, distraction_events, intervention_events,
               whitelisted_apps, whitelisted_tabs
        FROM sessions 
        ORDER BY started_at DESC
        LIMIT 1
        "#,
        [],
        session_from_row,
    );

    match result {
        Ok(session) => Ok(Some(session)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Failed to get latest session: {}", e)),
    }
}

/// Get the active session (started but not ended).
pub fn get_active_session(conn: &Connection) -> Result<Option<SessionRecord>, String> {
    let result = conn.query_row(
        r#"
        SELECT id, started_at, ended_at, planned_duration_minutes, actual_duration_minutes,
               mode, intention, victory_level, flow_efficiency, longest_streak_minutes,
               distraction_attempts, interventions_used, end_reason, end_sub_reason,
               timeline_blocks, distraction_events, intervention_events,
               whitelisted_apps, whitelisted_tabs
        FROM sessions 
        WHERE ended_at IS NULL
        ORDER BY started_at DESC
        LIMIT 1
        "#,
        [],
        session_from_row,
    );

    match result {
        Ok(session) => Ok(Some(session)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Failed to get active session: {}", e)),
    }
}

/// Delete a session by its ID.
pub fn delete_session(conn: &Connection, session_id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM sessions WHERE id = ?1", params![session_id])
        .map_err(|e| format!("Failed to delete session: {}", e))?;

    Ok(())
}

/// Delete all sessions (for reset/demo purposes).
pub fn delete_all_sessions(conn: &Connection) -> Result<(), String> {
    conn.execute("DELETE FROM sessions", [])
        .map_err(|e| format!("Failed to delete all sessions: {}", e))?;

    Ok(())
}

/// Count total sessions.
pub fn count_sessions(conn: &Connection) -> Result<i32, String> {
    let count: i32 = conn
        .query_row("SELECT COUNT(*) FROM sessions", [], |row| row.get(0))
        .map_err(|e| format!("Failed to count sessions: {}", e))?;

    Ok(count)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{
        DistractionEvent, InterventionEvent, TimelineBlock, WhitelistedApp, WhitelistedTab,
    };

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(
            r#"
            CREATE TABLE sessions (
                id TEXT PRIMARY KEY,
                started_at TEXT NOT NULL,
                ended_at TEXT,
                planned_duration_minutes INTEGER NOT NULL,
                actual_duration_minutes INTEGER,
                mode TEXT NOT NULL,
                intention TEXT,
                victory_level TEXT,
                flow_efficiency REAL,
                longest_streak_minutes INTEGER DEFAULT 0,
                distraction_attempts INTEGER DEFAULT 0,
                interventions_used INTEGER DEFAULT 0,
                end_reason TEXT,
                end_sub_reason TEXT,
                timeline_blocks TEXT DEFAULT '[]',
                distraction_events TEXT DEFAULT '[]',
                intervention_events TEXT DEFAULT '[]',
                whitelisted_apps TEXT DEFAULT '[]',
                whitelisted_tabs TEXT DEFAULT '[]'
            );
            "#,
        )
        .unwrap();
        conn
    }

    fn create_test_session() -> SessionRecord {
        SessionRecord {
            session_id: "test-session-123".to_string(),
            started_at: "2026-01-13T10:00:00Z".to_string(),
            ended_at: None,
            planned_duration_minutes: 60,
            actual_duration_minutes: None,
            mode: SessionMode::Flow,
            intention: Some("Deep work on project".to_string()),
            victory_level: None,
            flow_efficiency: None,
            longest_streak_minutes: 0,
            distraction_attempts: 0,
            interventions_used: 0,
            end_reason: None,
            end_sub_reason: None,
            timeline_blocks: vec![],
            distraction_events: vec![],
            intervention_events: vec![],
            whitelisted_apps: vec![WhitelistedApp {
                app_name: "VS Code".to_string(),
                purpose: Some("Coding".to_string()),
            }],
            whitelisted_tabs: vec![WhitelistedTab {
                url: "https://docs.rs".to_string(),
                title: "Rust Documentation".to_string(),
                purpose: None,
            }],
        }
    }

    #[test]
    fn test_save_and_get_session() {
        let conn = setup_test_db();
        let session = create_test_session();

        save_session(&conn, &session).unwrap();

        let loaded = get_session(&conn, "test-session-123").unwrap();
        assert!(loaded.is_some());

        let loaded = loaded.unwrap();
        assert_eq!(loaded.session_id, "test-session-123");
        assert_eq!(loaded.mode, SessionMode::Flow);
        assert_eq!(loaded.planned_duration_minutes, 60);
        assert_eq!(loaded.intention, Some("Deep work on project".to_string()));
        assert_eq!(loaded.whitelisted_apps.len(), 1);
        assert_eq!(loaded.whitelisted_apps[0].app_name, "VS Code");
        assert_eq!(loaded.whitelisted_tabs.len(), 1);
        assert_eq!(loaded.whitelisted_tabs[0].url, "https://docs.rs");
    }

    #[test]
    fn test_get_nonexistent_session() {
        let conn = setup_test_db();

        let loaded = get_session(&conn, "nonexistent-id").unwrap();
        assert!(loaded.is_none());
    }

    #[test]
    fn test_update_session() {
        let conn = setup_test_db();
        let mut session = create_test_session();

        save_session(&conn, &session).unwrap();

        // Update the session
        session.ended_at = Some("2026-01-13T11:00:00Z".to_string());
        session.actual_duration_minutes = Some(55);
        session.victory_level = Some(VictoryLevel::Good);
        session.flow_efficiency = Some(85.5);
        session.end_reason = Some(EndReason::MissionComplete);
        session.timeline_blocks = vec![
            TimelineBlock {
                start: 0,
                end: 30,
                state: crate::models::TimelineState::Flow,
            },
            TimelineBlock {
                start: 30,
                end: 55,
                state: crate::models::TimelineState::Working,
            },
        ];
        session.distraction_events = vec![DistractionEvent {
            timestamp: 1800000,
            distraction_type: "app_switch".to_string(),
        }];
        session.intervention_events = vec![InterventionEvent {
            timestamp: 1810000,
            intervention_type: "breath".to_string(),
        }];

        save_session(&conn, &session).unwrap();

        let loaded = get_session(&conn, "test-session-123").unwrap().unwrap();
        assert_eq!(
            loaded.ended_at,
            Some("2026-01-13T11:00:00Z".to_string())
        );
        assert_eq!(loaded.actual_duration_minutes, Some(55));
        assert_eq!(loaded.victory_level, Some(VictoryLevel::Good));
        assert_eq!(loaded.flow_efficiency, Some(85.5));
        assert_eq!(loaded.end_reason, Some(EndReason::MissionComplete));
        assert_eq!(loaded.timeline_blocks.len(), 2);
        assert_eq!(loaded.distraction_events.len(), 1);
        assert_eq!(loaded.intervention_events.len(), 1);
    }

    #[test]
    fn test_get_all_sessions() {
        let conn = setup_test_db();

        // Create multiple sessions
        for i in 1..=3 {
            let mut session = create_test_session();
            session.session_id = format!("session-{}", i);
            session.started_at = format!("2026-01-{:02}T10:00:00Z", 10 + i);
            save_session(&conn, &session).unwrap();
        }

        let all = get_all_sessions(&conn).unwrap();
        assert_eq!(all.len(), 3);

        // Should be in descending order by started_at
        assert_eq!(all[0].session_id, "session-3");
        assert_eq!(all[1].session_id, "session-2");
        assert_eq!(all[2].session_id, "session-1");
    }

    #[test]
    fn test_get_sessions_in_range() {
        let conn = setup_test_db();

        // Create sessions across multiple days
        let dates = ["2026-01-10", "2026-01-12", "2026-01-15", "2026-01-18"];
        for (i, date) in dates.iter().enumerate() {
            let mut session = create_test_session();
            session.session_id = format!("session-{}", i + 1);
            session.started_at = format!("{}T10:00:00Z", date);
            save_session(&conn, &session).unwrap();
        }

        let range = get_sessions_in_range(&conn, "2026-01-11", "2026-01-16").unwrap();
        assert_eq!(range.len(), 2); // Should get sessions from 12 and 15
    }

    #[test]
    fn test_get_active_session() {
        let conn = setup_test_db();

        // Create a completed session
        let mut completed = create_test_session();
        completed.session_id = "completed-session".to_string();
        completed.ended_at = Some("2026-01-13T11:00:00Z".to_string());
        save_session(&conn, &completed).unwrap();

        // No active session yet
        let active = get_active_session(&conn).unwrap();
        assert!(active.is_none());

        // Create an active session
        let active_session = create_test_session();
        save_session(&conn, &active_session).unwrap();

        let active = get_active_session(&conn).unwrap();
        assert!(active.is_some());
        assert_eq!(active.unwrap().session_id, "test-session-123");
    }

    #[test]
    fn test_delete_session() {
        let conn = setup_test_db();
        let session = create_test_session();

        save_session(&conn, &session).unwrap();
        assert!(get_session(&conn, "test-session-123").unwrap().is_some());

        delete_session(&conn, "test-session-123").unwrap();
        assert!(get_session(&conn, "test-session-123").unwrap().is_none());
    }

    #[test]
    fn test_delete_all_sessions() {
        let conn = setup_test_db();

        for i in 1..=5 {
            let mut session = create_test_session();
            session.session_id = format!("session-{}", i);
            save_session(&conn, &session).unwrap();
        }

        assert_eq!(count_sessions(&conn).unwrap(), 5);

        delete_all_sessions(&conn).unwrap();
        assert_eq!(count_sessions(&conn).unwrap(), 0);
    }

    #[test]
    fn test_count_sessions() {
        let conn = setup_test_db();

        assert_eq!(count_sessions(&conn).unwrap(), 0);

        for i in 1..=3 {
            let mut session = create_test_session();
            session.session_id = format!("session-{}", i);
            save_session(&conn, &session).unwrap();
        }

        assert_eq!(count_sessions(&conn).unwrap(), 3);
    }

    #[test]
    fn test_mode_serialization() {
        let conn = setup_test_db();

        // Test all modes
        for (i, mode) in [SessionMode::Zen, SessionMode::Flow, SessionMode::Legend]
            .iter()
            .enumerate()
        {
            let mut session = create_test_session();
            session.session_id = format!("session-{}", i);
            session.mode = mode.clone();
            save_session(&conn, &session).unwrap();
        }

        let zen = get_session(&conn, "session-0").unwrap().unwrap();
        let flow = get_session(&conn, "session-1").unwrap().unwrap();
        let legend = get_session(&conn, "session-2").unwrap().unwrap();

        assert_eq!(zen.mode, SessionMode::Zen);
        assert_eq!(flow.mode, SessionMode::Flow);
        assert_eq!(legend.mode, SessionMode::Legend);
    }

    #[test]
    fn test_optional_fields_null_handling() {
        let conn = setup_test_db();

        // Create session with all optional fields as None
        let session = SessionRecord {
            session_id: "minimal-session".to_string(),
            started_at: "2026-01-13T10:00:00Z".to_string(),
            ended_at: None,
            planned_duration_minutes: 30,
            actual_duration_minutes: None,
            mode: SessionMode::Zen,
            intention: None,
            victory_level: None,
            flow_efficiency: None,
            longest_streak_minutes: 0,
            distraction_attempts: 0,
            interventions_used: 0,
            end_reason: None,
            end_sub_reason: None,
            timeline_blocks: vec![],
            distraction_events: vec![],
            intervention_events: vec![],
            whitelisted_apps: vec![],
            whitelisted_tabs: vec![],
        };

        save_session(&conn, &session).unwrap();

        let loaded = get_session(&conn, "minimal-session").unwrap().unwrap();
        assert!(loaded.ended_at.is_none());
        assert!(loaded.actual_duration_minutes.is_none());
        assert!(loaded.intention.is_none());
        assert!(loaded.victory_level.is_none());
        assert!(loaded.flow_efficiency.is_none());
        assert!(loaded.end_reason.is_none());
        assert!(loaded.end_sub_reason.is_none());
        assert!(loaded.timeline_blocks.is_empty());
        assert!(loaded.whitelisted_apps.is_empty());
    }
}
