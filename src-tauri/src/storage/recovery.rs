use rusqlite::{params, Connection};

use crate::models::{RecoveryData, SessionMode};

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

/// Save recovery data.
/// Uses INSERT OR REPLACE with id = 1 to ensure only one row.
/// This overwrites any existing recovery data.
pub fn save_recovery_data(conn: &Connection, data: &RecoveryData) -> Result<(), String> {
    let mode_str = mode_to_string(&data.mode);

    conn.execute(
        r#"
        INSERT OR REPLACE INTO recovery_data 
        (id, session_id, started_at, planned_duration_minutes, mode, intention, elapsed_seconds, bandwidth_at_pause)
        VALUES (1, ?1, ?2, ?3, ?4, ?5, ?6, ?7)
        "#,
        params![
            data.session_id,
            data.started_at,
            data.planned_duration_minutes,
            mode_str,
            data.intention,
            data.elapsed_seconds,
            data.bandwidth_at_pause,
        ],
    )
    .map_err(|e| format!("Failed to save recovery data: {}", e))?;

    Ok(())
}

/// Get the recovery data if it exists.
/// Returns None if no recovery data is stored.
pub fn get_recovery_data(conn: &Connection) -> Result<Option<RecoveryData>, String> {
    let result = conn.query_row(
        r#"
        SELECT session_id, started_at, planned_duration_minutes, mode, 
               intention, elapsed_seconds, bandwidth_at_pause
        FROM recovery_data 
        WHERE id = 1
        "#,
        [],
        |row| {
            let session_id: String = row.get(0)?;
            let started_at: String = row.get(1)?;
            let planned_duration_minutes: i32 = row.get(2)?;
            let mode_str: String = row.get(3)?;
            let intention: Option<String> = row.get(4)?;
            let elapsed_seconds: i64 = row.get(5)?;
            let bandwidth_at_pause: Option<f64> = row.get(6)?;

            Ok(RecoveryData {
                session_id,
                started_at,
                planned_duration_minutes,
                mode: mode_from_string(&mode_str),
                intention,
                elapsed_seconds,
                bandwidth_at_pause,
            })
        },
    );

    match result {
        Ok(data) => Ok(Some(data)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Failed to get recovery data: {}", e)),
    }
}

/// Clear the recovery data.
/// Called after successful recovery or when user discards the interrupted session.
pub fn clear_recovery_data(conn: &Connection) -> Result<(), String> {
    conn.execute("DELETE FROM recovery_data WHERE id = 1", [])
        .map_err(|e| format!("Failed to clear recovery data: {}", e))?;

    Ok(())
}

/// Quick check if recovery data exists.
/// Used on app launch to determine if there's a session to recover.
pub fn has_recovery_data(conn: &Connection) -> Result<bool, String> {
    let count: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM recovery_data WHERE id = 1",
            [],
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to check recovery data: {}", e))?;

    Ok(count > 0)
}

/// Update just the elapsed time in recovery data.
/// Useful for periodic saves during an active session.
pub fn update_recovery_elapsed(conn: &Connection, elapsed_seconds: i64) -> Result<(), String> {
    let rows_updated = conn
        .execute(
            "UPDATE recovery_data SET elapsed_seconds = ?1 WHERE id = 1",
            params![elapsed_seconds],
        )
        .map_err(|e| format!("Failed to update recovery elapsed: {}", e))?;

    if rows_updated == 0 {
        return Err("No recovery data to update".to_string());
    }

    Ok(())
}

/// Update elapsed time and bandwidth at pause.
/// Called when session is paused or before potential crash.
pub fn update_recovery_state(
    conn: &Connection,
    elapsed_seconds: i64,
    bandwidth_at_pause: Option<f64>,
) -> Result<(), String> {
    let rows_updated = conn
        .execute(
            "UPDATE recovery_data SET elapsed_seconds = ?1, bandwidth_at_pause = ?2 WHERE id = 1",
            params![elapsed_seconds, bandwidth_at_pause],
        )
        .map_err(|e| format!("Failed to update recovery state: {}", e))?;

    if rows_updated == 0 {
        return Err("No recovery data to update".to_string());
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(
            r#"
            CREATE TABLE recovery_data (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                session_id TEXT NOT NULL,
                started_at TEXT NOT NULL,
                planned_duration_minutes INTEGER NOT NULL,
                mode TEXT NOT NULL,
                intention TEXT,
                elapsed_seconds INTEGER NOT NULL,
                bandwidth_at_pause REAL
            );
            "#,
        )
        .unwrap();
        conn
    }

    fn create_test_recovery() -> RecoveryData {
        RecoveryData {
            session_id: "session-123".to_string(),
            started_at: "2026-01-13T10:00:00Z".to_string(),
            planned_duration_minutes: 60,
            mode: SessionMode::Flow,
            intention: Some("Deep work on project".to_string()),
            elapsed_seconds: 1800, // 30 minutes
            bandwidth_at_pause: Some(75.5),
        }
    }

    #[test]
    fn test_save_and_get_recovery_data() {
        let conn = setup_test_db();
        let recovery = create_test_recovery();

        save_recovery_data(&conn, &recovery).unwrap();

        let loaded = get_recovery_data(&conn).unwrap();
        assert!(loaded.is_some());

        let loaded = loaded.unwrap();
        assert_eq!(loaded.session_id, "session-123");
        assert_eq!(loaded.started_at, "2026-01-13T10:00:00Z");
        assert_eq!(loaded.planned_duration_minutes, 60);
        assert_eq!(loaded.mode, SessionMode::Flow);
        assert_eq!(loaded.intention, Some("Deep work on project".to_string()));
        assert_eq!(loaded.elapsed_seconds, 1800);
        assert_eq!(loaded.bandwidth_at_pause, Some(75.5));
    }

    #[test]
    fn test_get_nonexistent_recovery_data() {
        let conn = setup_test_db();

        let loaded = get_recovery_data(&conn).unwrap();
        assert!(loaded.is_none());
    }

    #[test]
    fn test_overwrite_recovery_data() {
        let conn = setup_test_db();
        let recovery1 = create_test_recovery();

        save_recovery_data(&conn, &recovery1).unwrap();

        // Save different recovery data - should overwrite
        let recovery2 = RecoveryData {
            session_id: "session-456".to_string(),
            started_at: "2026-01-14T14:00:00Z".to_string(),
            planned_duration_minutes: 90,
            mode: SessionMode::Legend,
            intention: None,
            elapsed_seconds: 900,
            bandwidth_at_pause: None,
        };

        save_recovery_data(&conn, &recovery2).unwrap();

        let loaded = get_recovery_data(&conn).unwrap().unwrap();
        assert_eq!(loaded.session_id, "session-456");
        assert_eq!(loaded.planned_duration_minutes, 90);
        assert_eq!(loaded.mode, SessionMode::Legend);
        assert!(loaded.intention.is_none());
    }

    #[test]
    fn test_clear_recovery_data() {
        let conn = setup_test_db();
        let recovery = create_test_recovery();

        save_recovery_data(&conn, &recovery).unwrap();
        assert!(has_recovery_data(&conn).unwrap());

        clear_recovery_data(&conn).unwrap();
        assert!(!has_recovery_data(&conn).unwrap());
        assert!(get_recovery_data(&conn).unwrap().is_none());
    }

    #[test]
    fn test_has_recovery_data() {
        let conn = setup_test_db();

        assert!(!has_recovery_data(&conn).unwrap());

        let recovery = create_test_recovery();
        save_recovery_data(&conn, &recovery).unwrap();

        assert!(has_recovery_data(&conn).unwrap());
    }

    #[test]
    fn test_update_recovery_elapsed() {
        let conn = setup_test_db();
        let recovery = create_test_recovery();

        save_recovery_data(&conn, &recovery).unwrap();

        update_recovery_elapsed(&conn, 2400).unwrap(); // 40 minutes

        let loaded = get_recovery_data(&conn).unwrap().unwrap();
        assert_eq!(loaded.elapsed_seconds, 2400);
    }

    #[test]
    fn test_update_recovery_elapsed_no_data() {
        let conn = setup_test_db();

        let result = update_recovery_elapsed(&conn, 1000);
        assert!(result.is_err());
    }

    #[test]
    fn test_update_recovery_state() {
        let conn = setup_test_db();
        let recovery = create_test_recovery();

        save_recovery_data(&conn, &recovery).unwrap();

        update_recovery_state(&conn, 3000, Some(65.0)).unwrap();

        let loaded = get_recovery_data(&conn).unwrap().unwrap();
        assert_eq!(loaded.elapsed_seconds, 3000);
        assert_eq!(loaded.bandwidth_at_pause, Some(65.0));
    }

    #[test]
    fn test_mode_serialization() {
        let conn = setup_test_db();

        // Test all modes
        for mode in [SessionMode::Zen, SessionMode::Flow, SessionMode::Legend] {
            let recovery = RecoveryData {
                session_id: "test".to_string(),
                started_at: "2026-01-13T10:00:00Z".to_string(),
                planned_duration_minutes: 60,
                mode: mode.clone(),
                intention: None,
                elapsed_seconds: 0,
                bandwidth_at_pause: None,
            };

            save_recovery_data(&conn, &recovery).unwrap();
            let loaded = get_recovery_data(&conn).unwrap().unwrap();
            assert_eq!(loaded.mode, mode);

            clear_recovery_data(&conn).unwrap();
        }
    }

    #[test]
    fn test_optional_fields_null() {
        let conn = setup_test_db();

        let recovery = RecoveryData {
            session_id: "minimal".to_string(),
            started_at: "2026-01-13T10:00:00Z".to_string(),
            planned_duration_minutes: 30,
            mode: SessionMode::Zen,
            intention: None,
            elapsed_seconds: 0,
            bandwidth_at_pause: None,
        };

        save_recovery_data(&conn, &recovery).unwrap();

        let loaded = get_recovery_data(&conn).unwrap().unwrap();
        assert!(loaded.intention.is_none());
        assert!(loaded.bandwidth_at_pause.is_none());
    }
}
