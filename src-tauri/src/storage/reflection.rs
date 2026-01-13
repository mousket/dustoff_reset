use rusqlite::{params, Connection, Row};

use crate::models::{ReflectionObject, SessionRecord};
use crate::storage::session::get_session;

/// Helper to build a ReflectionObject from a database row
fn reflection_from_row(row: &Row) -> Result<ReflectionObject, rusqlite::Error> {
    let session_id: String = row.get(0)?;
    let what_went_well: String = row.get(1)?;
    let friction_notes: Option<String> = row.get(2)?;
    let closing_energy: i32 = row.get(3)?;
    let skipped_int: i32 = row.get(4)?;

    Ok(ReflectionObject {
        session_id,
        what_went_well,
        friction_notes,
        closing_energy,
        skipped: skipped_int != 0,
        // created_at is not in the DB schema, so we use a placeholder
        // In practice, this could be joined from the session's started_at
        created_at: chrono::Utc::now().to_rfc3339(),
    })
}

/// Helper to build a ReflectionObject from a row that includes created_at from a join
fn reflection_from_row_with_timestamp(row: &Row) -> Result<ReflectionObject, rusqlite::Error> {
    let session_id: String = row.get(0)?;
    let what_went_well: String = row.get(1)?;
    let friction_notes: Option<String> = row.get(2)?;
    let closing_energy: i32 = row.get(3)?;
    let skipped_int: i32 = row.get(4)?;
    let created_at: String = row.get(5)?; // From sessions.started_at

    Ok(ReflectionObject {
        session_id,
        what_went_well,
        friction_notes,
        closing_energy,
        skipped: skipped_int != 0,
        created_at,
    })
}

/// Save or update a reflection.
/// Uses INSERT OR REPLACE based on session_id uniqueness.
pub fn save_reflection(conn: &Connection, reflection: &ReflectionObject) -> Result<(), String> {
    let skipped_int = if reflection.skipped { 1 } else { 0 };

    conn.execute(
        r#"
        INSERT OR REPLACE INTO reflections 
        (session_id, what_went_well, friction_notes, closing_energy, skipped)
        VALUES (?1, ?2, ?3, ?4, ?5)
        "#,
        params![
            reflection.session_id,
            reflection.what_went_well,
            reflection.friction_notes,
            reflection.closing_energy,
            skipped_int,
        ],
    )
    .map_err(|e| format!("Failed to save reflection: {}", e))?;

    Ok(())
}

/// Get a reflection by session ID.
/// Returns None if no reflection exists for the session.
pub fn get_reflection(
    conn: &Connection,
    session_id: &str,
) -> Result<Option<ReflectionObject>, String> {
    let result = conn.query_row(
        r#"
        SELECT session_id, what_went_well, friction_notes, closing_energy, skipped
        FROM reflections 
        WHERE session_id = ?1
        "#,
        params![session_id],
        reflection_from_row,
    );

    match result {
        Ok(reflection) => Ok(Some(reflection)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Failed to get reflection: {}", e)),
    }
}

/// Get a reflection with its associated session record.
/// Returns None if either the session or reflection doesn't exist.
pub fn get_reflection_with_session(
    conn: &Connection,
    session_id: &str,
) -> Result<Option<(SessionRecord, ReflectionObject)>, String> {
    // First, get the session
    let session = get_session(conn, session_id)?;
    let session = match session {
        Some(s) => s,
        None => return Ok(None),
    };

    // Then get the reflection with created_at from the session
    let result = conn.query_row(
        r#"
        SELECT r.session_id, r.what_went_well, r.friction_notes, r.closing_energy, r.skipped, 
               s.started_at
        FROM reflections r
        JOIN sessions s ON r.session_id = s.id
        WHERE r.session_id = ?1
        "#,
        params![session_id],
        reflection_from_row_with_timestamp,
    );

    match result {
        Ok(reflection) => Ok(Some((session, reflection))),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Failed to get reflection with session: {}", e)),
    }
}

/// Delete a reflection by session ID.
pub fn delete_reflection(conn: &Connection, session_id: &str) -> Result<(), String> {
    conn.execute(
        "DELETE FROM reflections WHERE session_id = ?1",
        params![session_id],
    )
    .map_err(|e| format!("Failed to delete reflection: {}", e))?;

    Ok(())
}

/// Delete all reflections (for reset/demo purposes).
pub fn delete_all_reflections(conn: &Connection) -> Result<(), String> {
    conn.execute("DELETE FROM reflections", [])
        .map_err(|e| format!("Failed to delete all reflections: {}", e))?;

    Ok(())
}

/// Count reflections.
pub fn count_reflections(conn: &Connection) -> Result<i32, String> {
    let count: i32 = conn
        .query_row("SELECT COUNT(*) FROM reflections", [], |row| row.get(0))
        .map_err(|e| format!("Failed to count reflections: {}", e))?;

    Ok(count)
}

/// Get all reflections for sessions that were not skipped.
pub fn get_completed_reflections(conn: &Connection) -> Result<Vec<ReflectionObject>, String> {
    let mut stmt = conn
        .prepare(
            r#"
        SELECT r.session_id, r.what_went_well, r.friction_notes, r.closing_energy, r.skipped,
               s.started_at
        FROM reflections r
        JOIN sessions s ON r.session_id = s.id
        WHERE r.skipped = 0
        ORDER BY s.started_at DESC
        "#,
        )
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let reflections = stmt
        .query_map([], reflection_from_row_with_timestamp)
        .map_err(|e| format!("Failed to query reflections: {}", e))?;

    let mut results = Vec::new();
    for reflection in reflections {
        results.push(reflection.map_err(|e| format!("Failed to read reflection row: {}", e))?);
    }

    Ok(results)
}

/// Get recent reflections with their sessions.
pub fn get_recent_reflections_with_sessions(
    conn: &Connection,
    limit: i32,
) -> Result<Vec<(SessionRecord, ReflectionObject)>, String> {
    // First get the reflection session IDs
    let mut stmt = conn
        .prepare(
            r#"
        SELECT r.session_id
        FROM reflections r
        JOIN sessions s ON r.session_id = s.id
        ORDER BY s.started_at DESC
        LIMIT ?1
        "#,
        )
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let session_ids: Vec<String> = stmt
        .query_map(params![limit], |row| row.get(0))
        .map_err(|e| format!("Failed to query session IDs: {}", e))?
        .filter_map(|r| r.ok())
        .collect();

    let mut results = Vec::new();
    for session_id in session_ids {
        if let Some(pair) = get_reflection_with_session(conn, &session_id)? {
            results.push(pair);
        }
    }

    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::SessionMode;

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(
            r#"
            PRAGMA foreign_keys = ON;

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

            CREATE TABLE reflections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
                what_went_well TEXT NOT NULL,
                friction_notes TEXT,
                closing_energy INTEGER NOT NULL,
                skipped INTEGER DEFAULT 0
            );
            "#,
        )
        .unwrap();
        conn
    }

    fn create_test_session(conn: &Connection, session_id: &str) -> SessionRecord {
        use crate::storage::session::save_session;

        let session = SessionRecord {
            session_id: session_id.to_string(),
            started_at: "2026-01-13T10:00:00Z".to_string(),
            ended_at: Some("2026-01-13T11:00:00Z".to_string()),
            planned_duration_minutes: 60,
            actual_duration_minutes: Some(55),
            mode: SessionMode::Flow,
            intention: Some("Deep work".to_string()),
            victory_level: None,
            flow_efficiency: Some(85.0),
            longest_streak_minutes: 30,
            distraction_attempts: 2,
            interventions_used: 1,
            end_reason: None,
            end_sub_reason: None,
            timeline_blocks: vec![],
            distraction_events: vec![],
            intervention_events: vec![],
            whitelisted_apps: vec![],
            whitelisted_tabs: vec![],
        };
        save_session(conn, &session).unwrap();
        session
    }

    fn create_test_reflection(session_id: &str) -> ReflectionObject {
        ReflectionObject {
            session_id: session_id.to_string(),
            what_went_well: "Great focus today!".to_string(),
            friction_notes: Some("Had trouble starting".to_string()),
            closing_energy: 4,
            skipped: false,
            created_at: "2026-01-13T11:05:00Z".to_string(),
        }
    }

    #[test]
    fn test_save_and_get_reflection() {
        let conn = setup_test_db();
        create_test_session(&conn, "session-123");
        let reflection = create_test_reflection("session-123");

        save_reflection(&conn, &reflection).unwrap();

        let loaded = get_reflection(&conn, "session-123").unwrap();
        assert!(loaded.is_some());

        let loaded = loaded.unwrap();
        assert_eq!(loaded.session_id, "session-123");
        assert_eq!(loaded.what_went_well, "Great focus today!");
        assert_eq!(
            loaded.friction_notes,
            Some("Had trouble starting".to_string())
        );
        assert_eq!(loaded.closing_energy, 4);
        assert!(!loaded.skipped);
    }

    #[test]
    fn test_get_nonexistent_reflection() {
        let conn = setup_test_db();

        let loaded = get_reflection(&conn, "nonexistent").unwrap();
        assert!(loaded.is_none());
    }

    #[test]
    fn test_update_reflection() {
        let conn = setup_test_db();
        create_test_session(&conn, "session-123");
        let mut reflection = create_test_reflection("session-123");

        save_reflection(&conn, &reflection).unwrap();

        // Update the reflection
        reflection.what_went_well = "Even better focus!".to_string();
        reflection.closing_energy = 5;
        save_reflection(&conn, &reflection).unwrap();

        let loaded = get_reflection(&conn, "session-123").unwrap().unwrap();
        assert_eq!(loaded.what_went_well, "Even better focus!");
        assert_eq!(loaded.closing_energy, 5);
    }

    #[test]
    fn test_skipped_reflection() {
        let conn = setup_test_db();
        create_test_session(&conn, "session-123");

        let reflection = ReflectionObject {
            session_id: "session-123".to_string(),
            what_went_well: "".to_string(),
            friction_notes: None,
            closing_energy: 3,
            skipped: true,
            created_at: "2026-01-13T11:05:00Z".to_string(),
        };

        save_reflection(&conn, &reflection).unwrap();

        let loaded = get_reflection(&conn, "session-123").unwrap().unwrap();
        assert!(loaded.skipped);
        assert_eq!(loaded.closing_energy, 3);
    }

    #[test]
    fn test_get_reflection_with_session() {
        let conn = setup_test_db();
        create_test_session(&conn, "session-123");
        let reflection = create_test_reflection("session-123");

        save_reflection(&conn, &reflection).unwrap();

        let result = get_reflection_with_session(&conn, "session-123").unwrap();
        assert!(result.is_some());

        let (session, reflection) = result.unwrap();
        assert_eq!(session.session_id, "session-123");
        assert_eq!(session.mode, SessionMode::Flow);
        assert_eq!(reflection.what_went_well, "Great focus today!");
        // created_at should come from session's started_at
        assert_eq!(reflection.created_at, "2026-01-13T10:00:00Z");
    }

    #[test]
    fn test_get_reflection_with_session_no_session() {
        let conn = setup_test_db();

        let result = get_reflection_with_session(&conn, "nonexistent").unwrap();
        assert!(result.is_none());
    }

    #[test]
    fn test_get_reflection_with_session_no_reflection() {
        let conn = setup_test_db();
        create_test_session(&conn, "session-123");

        let result = get_reflection_with_session(&conn, "session-123").unwrap();
        assert!(result.is_none());
    }

    #[test]
    fn test_delete_reflection() {
        let conn = setup_test_db();
        create_test_session(&conn, "session-123");
        let reflection = create_test_reflection("session-123");

        save_reflection(&conn, &reflection).unwrap();
        assert!(get_reflection(&conn, "session-123").unwrap().is_some());

        delete_reflection(&conn, "session-123").unwrap();
        assert!(get_reflection(&conn, "session-123").unwrap().is_none());
    }

    #[test]
    fn test_delete_all_reflections() {
        let conn = setup_test_db();

        for i in 1..=3 {
            let session_id = format!("session-{}", i);
            create_test_session(&conn, &session_id);
            let reflection = create_test_reflection(&session_id);
            save_reflection(&conn, &reflection).unwrap();
        }

        assert_eq!(count_reflections(&conn).unwrap(), 3);

        delete_all_reflections(&conn).unwrap();
        assert_eq!(count_reflections(&conn).unwrap(), 0);
    }

    #[test]
    fn test_count_reflections() {
        let conn = setup_test_db();

        assert_eq!(count_reflections(&conn).unwrap(), 0);

        for i in 1..=5 {
            let session_id = format!("session-{}", i);
            create_test_session(&conn, &session_id);
            let reflection = create_test_reflection(&session_id);
            save_reflection(&conn, &reflection).unwrap();
        }

        assert_eq!(count_reflections(&conn).unwrap(), 5);
    }

    #[test]
    fn test_get_completed_reflections() {
        let conn = setup_test_db();

        // Create 3 completed reflections
        for i in 1..=3 {
            let session_id = format!("session-{}", i);
            create_test_session(&conn, &session_id);
            let reflection = create_test_reflection(&session_id);
            save_reflection(&conn, &reflection).unwrap();
        }

        // Create 2 skipped reflections
        for i in 4..=5 {
            let session_id = format!("session-{}", i);
            create_test_session(&conn, &session_id);
            let mut reflection = create_test_reflection(&session_id);
            reflection.skipped = true;
            save_reflection(&conn, &reflection).unwrap();
        }

        let completed = get_completed_reflections(&conn).unwrap();
        assert_eq!(completed.len(), 3);

        // All should have skipped = false
        for r in completed {
            assert!(!r.skipped);
        }
    }

    #[test]
    fn test_cascade_delete() {
        let conn = setup_test_db();
        create_test_session(&conn, "session-123");
        let reflection = create_test_reflection("session-123");
        save_reflection(&conn, &reflection).unwrap();

        assert!(get_reflection(&conn, "session-123").unwrap().is_some());

        // Delete the session - reflection should be deleted due to CASCADE
        use crate::storage::session::delete_session;
        delete_session(&conn, "session-123").unwrap();

        assert!(get_reflection(&conn, "session-123").unwrap().is_none());
    }
}
