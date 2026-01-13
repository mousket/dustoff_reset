use chrono::{Duration, Local, Timelike};
use rusqlite::{params, Connection};

use crate::models::CalibrationData;

/// Get the current workday date, accounting for the 5am boundary.
/// If it's before 5am, we're still in yesterday's workday.
pub fn get_workday_date() -> String {
    let now = Local::now();
    let date = if now.hour() < 5 {
        now.date_naive() - Duration::days(1)
    } else {
        now.date_naive()
    };
    date.format("%Y-%m-%d").to_string()
}

/// Save or update a calibration record.
/// Uses INSERT OR REPLACE to handle both new and existing records.
pub fn save_calibration(conn: &Connection, data: &CalibrationData) -> Result<(), String> {
    let distractions_json =
        serde_json::to_string(&data.distractions).map_err(|e| e.to_string())?;

    // Use current timestamp if not provided (0 means not set)
    let timestamp = if data.timestamp == 0 {
        Local::now().timestamp_millis()
    } else {
        data.timestamp
    };

    conn.execute(
        r#"
        INSERT OR REPLACE INTO calibrations 
        (date, calibration_score, sleep_hours, sleep_quality, emotional_residue, emotional_state, distractions, timestamp)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
        "#,
        params![
            data.date,
            data.calibration_score,
            data.sleep_hours,
            data.sleep_quality,
            data.emotional_residue,
            data.emotional_state,
            distractions_json,
            timestamp,
        ],
    )
    .map_err(|e| format!("Failed to save calibration: {}", e))?;

    Ok(())
}

/// Load a calibration record by date.
/// Returns None if no calibration exists for the given date.
pub fn load_calibration(conn: &Connection, date: &str) -> Result<Option<CalibrationData>, String> {
    let result = conn.query_row(
        r#"
        SELECT date, calibration_score, sleep_hours, sleep_quality, 
               emotional_residue, emotional_state, distractions, timestamp
        FROM calibrations 
        WHERE date = ?1
        "#,
        params![date],
        |row| {
            let distractions_json: String = row.get(6)?;
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, f64>(1)?,
                row.get::<_, f64>(2)?,
                row.get::<_, i32>(3)?,
                row.get::<_, i32>(4)?,
                row.get::<_, String>(5)?,
                distractions_json,
                row.get::<_, i64>(7)?,
            ))
        },
    );

    match result {
        Ok((date, calibration_score, sleep_hours, sleep_quality, emotional_residue, emotional_state, distractions_json, timestamp)) => {
            let distractions: Vec<String> = serde_json::from_str(&distractions_json)
                .map_err(|e| format!("Failed to parse distractions JSON: {}", e))?;

            Ok(Some(CalibrationData {
                date,
                calibration_score,
                sleep_hours,
                sleep_quality,
                emotional_residue,
                emotional_state,
                distractions,
                timestamp,
            }))
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Failed to load calibration: {}", e)),
    }
}

/// Load the calibration for the current workday.
/// Uses the 5am boundary to determine the current workday.
pub fn load_calibration_for_today(conn: &Connection) -> Result<Option<CalibrationData>, String> {
    let today = get_workday_date();
    load_calibration(conn, &today)
}

/// Check if there's a calibration for the current workday.
pub fn has_calibrated_today(conn: &Connection) -> Result<bool, String> {
    let today = get_workday_date();
    let count: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM calibrations WHERE date = ?1",
            params![today],
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to check calibration: {}", e))?;

    Ok(count > 0)
}

/// Delete a calibration for a specific date.
pub fn clear_calibration(conn: &Connection, date: &str) -> Result<(), String> {
    conn.execute("DELETE FROM calibrations WHERE date = ?1", params![date])
        .map_err(|e| format!("Failed to clear calibration: {}", e))?;

    Ok(())
}

/// Delete all calibrations (for reset/demo purposes).
pub fn clear_all_calibrations(conn: &Connection) -> Result<(), String> {
    conn.execute("DELETE FROM calibrations", [])
        .map_err(|e| format!("Failed to clear all calibrations: {}", e))?;

    Ok(())
}

/// Get recent calibrations (for history/analytics).
pub fn get_recent_calibrations(
    conn: &Connection,
    limit: i32,
) -> Result<Vec<CalibrationData>, String> {
    let mut stmt = conn
        .prepare(
            r#"
        SELECT date, calibration_score, sleep_hours, sleep_quality, 
               emotional_residue, emotional_state, distractions, timestamp
        FROM calibrations 
        ORDER BY date DESC
        LIMIT ?1
        "#,
        )
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let calibrations = stmt
        .query_map(params![limit], |row| {
            let distractions_json: String = row.get(6)?;
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, f64>(1)?,
                row.get::<_, f64>(2)?,
                row.get::<_, i32>(3)?,
                row.get::<_, i32>(4)?,
                row.get::<_, String>(5)?,
                distractions_json,
                row.get::<_, i64>(7)?,
            ))
        })
        .map_err(|e| format!("Failed to query calibrations: {}", e))?;

    let mut results = Vec::new();
    for cal in calibrations {
        let (date, calibration_score, sleep_hours, sleep_quality, emotional_residue, emotional_state, distractions_json, timestamp) =
            cal.map_err(|e| format!("Failed to read row: {}", e))?;

        let distractions: Vec<String> = serde_json::from_str(&distractions_json)
            .map_err(|e| format!("Failed to parse distractions JSON: {}", e))?;

        results.push(CalibrationData {
            date,
            calibration_score,
            sleep_hours,
            sleep_quality,
            emotional_residue,
            emotional_state,
            distractions,
            timestamp,
        });
    }

    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(
            r#"
            CREATE TABLE calibrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT UNIQUE NOT NULL,
                calibration_score REAL NOT NULL,
                sleep_hours REAL NOT NULL,
                sleep_quality INTEGER NOT NULL,
                emotional_residue INTEGER NOT NULL,
                emotional_state TEXT NOT NULL,
                distractions TEXT NOT NULL DEFAULT '[]',
                timestamp INTEGER NOT NULL
            );
            "#,
        )
        .unwrap();
        conn
    }

    fn create_test_calibration() -> CalibrationData {
        CalibrationData {
            date: "2026-01-13".to_string(),
            calibration_score: 85.0,
            sleep_hours: 7.5,
            sleep_quality: 8,
            emotional_residue: 3,
            emotional_state: "Focused".to_string(),
            distractions: vec!["Email".to_string(), "Slack".to_string()],
            timestamp: 1736784000000,
        }
    }

    #[test]
    fn test_save_and_load_calibration() {
        let conn = setup_test_db();
        let cal = create_test_calibration();

        save_calibration(&conn, &cal).unwrap();

        let loaded = load_calibration(&conn, "2026-01-13").unwrap();
        assert!(loaded.is_some());

        let loaded = loaded.unwrap();
        assert_eq!(loaded.date, "2026-01-13");
        assert_eq!(loaded.calibration_score, 85.0);
        assert_eq!(loaded.sleep_hours, 7.5);
        assert_eq!(loaded.distractions.len(), 2);
        assert_eq!(loaded.distractions[0], "Email");
    }

    #[test]
    fn test_load_nonexistent_calibration() {
        let conn = setup_test_db();

        let loaded = load_calibration(&conn, "2026-01-01").unwrap();
        assert!(loaded.is_none());
    }

    #[test]
    fn test_update_calibration() {
        let conn = setup_test_db();
        let mut cal = create_test_calibration();

        save_calibration(&conn, &cal).unwrap();

        // Update the calibration
        cal.calibration_score = 90.0;
        cal.sleep_hours = 8.0;
        save_calibration(&conn, &cal).unwrap();

        let loaded = load_calibration(&conn, "2026-01-13").unwrap().unwrap();
        assert_eq!(loaded.calibration_score, 90.0);
        assert_eq!(loaded.sleep_hours, 8.0);
    }

    #[test]
    fn test_clear_calibration() {
        let conn = setup_test_db();
        let cal = create_test_calibration();

        save_calibration(&conn, &cal).unwrap();
        assert!(load_calibration(&conn, "2026-01-13").unwrap().is_some());

        clear_calibration(&conn, "2026-01-13").unwrap();
        assert!(load_calibration(&conn, "2026-01-13").unwrap().is_none());
    }

    #[test]
    fn test_clear_all_calibrations() {
        let conn = setup_test_db();

        let mut cal1 = create_test_calibration();
        cal1.date = "2026-01-13".to_string();
        save_calibration(&conn, &cal1).unwrap();

        let mut cal2 = create_test_calibration();
        cal2.date = "2026-01-14".to_string();
        save_calibration(&conn, &cal2).unwrap();

        clear_all_calibrations(&conn).unwrap();

        assert!(load_calibration(&conn, "2026-01-13").unwrap().is_none());
        assert!(load_calibration(&conn, "2026-01-14").unwrap().is_none());
    }

    #[test]
    fn test_get_recent_calibrations() {
        let conn = setup_test_db();

        for i in 1..=5 {
            let mut cal = create_test_calibration();
            cal.date = format!("2026-01-{:02}", i);
            save_calibration(&conn, &cal).unwrap();
        }

        let recent = get_recent_calibrations(&conn, 3).unwrap();
        assert_eq!(recent.len(), 3);
        // Should be in descending order
        assert_eq!(recent[0].date, "2026-01-05");
        assert_eq!(recent[1].date, "2026-01-04");
        assert_eq!(recent[2].date, "2026-01-03");
    }

    #[test]
    fn test_has_calibrated_today() {
        let conn = setup_test_db();
        let today = get_workday_date();

        assert!(!has_calibrated_today(&conn).unwrap());

        let mut cal = create_test_calibration();
        cal.date = today;
        save_calibration(&conn, &cal).unwrap();

        assert!(has_calibrated_today(&conn).unwrap());
    }
}
