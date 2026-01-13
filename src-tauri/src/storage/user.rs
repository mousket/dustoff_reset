use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

/// User data for preferences and settings.
/// Stored as a single row in the database (id = 1).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserData {
    /// User's email address
    pub email: Option<String>,
    /// User's first name
    pub first_name: Option<String>,
    /// Custom operator name (displayed in UI)
    pub operator_name: Option<String>,
    /// Default session mode (Zen, Flow, Legend)
    pub default_mode: String,
}

impl Default for UserData {
    fn default() -> Self {
        Self {
            email: None,
            first_name: None,
            operator_name: None,
            default_mode: "Flow".to_string(),
        }
    }
}

impl UserData {
    /// Get the display name (operator name, first name, or "Operator")
    pub fn display_name(&self) -> &str {
        self.operator_name
            .as_deref()
            .or(self.first_name.as_deref())
            .unwrap_or("Operator")
    }

    /// Check if user has completed onboarding (has at least a name)
    pub fn is_onboarded(&self) -> bool {
        self.first_name.is_some() || self.operator_name.is_some()
    }
}

/// Save or update user data.
/// Uses INSERT OR REPLACE with id = 1 to ensure only one row.
/// Only updates fields that are Some.
pub fn save_user(
    conn: &Connection,
    email: Option<&str>,
    first_name: Option<&str>,
    operator_name: Option<&str>,
    default_mode: Option<&str>,
) -> Result<(), String> {
    // First, get existing data to merge with new values
    let existing = get_user(conn)?;
    let existing = existing.unwrap_or_default();

    let final_email = email.map(|s| s.to_string()).or(existing.email);
    let final_first_name = first_name.map(|s| s.to_string()).or(existing.first_name);
    let final_operator_name = operator_name.map(|s| s.to_string()).or(existing.operator_name);
    let final_default_mode = default_mode
        .map(|s| s.to_string())
        .unwrap_or(existing.default_mode);

    conn.execute(
        r#"
        INSERT OR REPLACE INTO user_data 
        (id, email, first_name, operator_name, default_mode)
        VALUES (1, ?1, ?2, ?3, ?4)
        "#,
        params![
            final_email,
            final_first_name,
            final_operator_name,
            final_default_mode,
        ],
    )
    .map_err(|e| format!("Failed to save user data: {}", e))?;

    Ok(())
}

/// Save complete UserData struct.
pub fn save_user_data(conn: &Connection, data: &UserData) -> Result<(), String> {
    conn.execute(
        r#"
        INSERT OR REPLACE INTO user_data 
        (id, email, first_name, operator_name, default_mode)
        VALUES (1, ?1, ?2, ?3, ?4)
        "#,
        params![
            data.email,
            data.first_name,
            data.operator_name,
            data.default_mode,
        ],
    )
    .map_err(|e| format!("Failed to save user data: {}", e))?;

    Ok(())
}

/// Get user data if it exists.
/// Returns None if user hasn't been set up yet.
pub fn get_user(conn: &Connection) -> Result<Option<UserData>, String> {
    let result = conn.query_row(
        r#"
        SELECT email, first_name, operator_name, default_mode
        FROM user_data 
        WHERE id = 1
        "#,
        [],
        |row| {
            let email: Option<String> = row.get(0)?;
            let first_name: Option<String> = row.get(1)?;
            let operator_name: Option<String> = row.get(2)?;
            let default_mode: Option<String> = row.get(3)?;

            Ok(UserData {
                email,
                first_name,
                operator_name,
                default_mode: default_mode.unwrap_or_else(|| "Flow".to_string()),
            })
        },
    );

    match result {
        Ok(data) => Ok(Some(data)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Failed to get user data: {}", e)),
    }
}

/// Check if user data exists.
pub fn has_user(conn: &Connection) -> Result<bool, String> {
    let count: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM user_data WHERE id = 1",
            [],
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to check user data: {}", e))?;

    Ok(count > 0)
}

/// Clear user data (for reset/demo).
pub fn clear_user(conn: &Connection) -> Result<(), String> {
    conn.execute("DELETE FROM user_data WHERE id = 1", [])
        .map_err(|e| format!("Failed to clear user data: {}", e))?;

    Ok(())
}

/// Update just the default mode.
pub fn set_default_mode(conn: &Connection, mode: &str) -> Result<(), String> {
    // Ensure row exists first
    if !has_user(conn)? {
        // Create with defaults
        save_user(conn, None, None, None, Some(mode))?;
    } else {
        conn.execute(
            "UPDATE user_data SET default_mode = ?1 WHERE id = 1",
            params![mode],
        )
        .map_err(|e| format!("Failed to update default mode: {}", e))?;
    }

    Ok(())
}

/// Update just the operator name.
pub fn set_operator_name(conn: &Connection, name: &str) -> Result<(), String> {
    // Ensure row exists first
    if !has_user(conn)? {
        save_user(conn, None, None, Some(name), None)?;
    } else {
        conn.execute(
            "UPDATE user_data SET operator_name = ?1 WHERE id = 1",
            params![name],
        )
        .map_err(|e| format!("Failed to update operator name: {}", e))?;
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
            CREATE TABLE user_data (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                email TEXT,
                first_name TEXT,
                operator_name TEXT,
                default_mode TEXT DEFAULT 'Flow'
            );
            "#,
        )
        .unwrap();
        conn
    }

    #[test]
    fn test_save_and_get_user() {
        let conn = setup_test_db();

        save_user(
            &conn,
            Some("test@example.com"),
            Some("John"),
            Some("Commander"),
            Some("Legend"),
        )
        .unwrap();

        let user = get_user(&conn).unwrap();
        assert!(user.is_some());

        let user = user.unwrap();
        assert_eq!(user.email, Some("test@example.com".to_string()));
        assert_eq!(user.first_name, Some("John".to_string()));
        assert_eq!(user.operator_name, Some("Commander".to_string()));
        assert_eq!(user.default_mode, "Legend");
    }

    #[test]
    fn test_get_nonexistent_user() {
        let conn = setup_test_db();

        let user = get_user(&conn).unwrap();
        assert!(user.is_none());
    }

    #[test]
    fn test_partial_update() {
        let conn = setup_test_db();

        // Initial save
        save_user(&conn, Some("test@example.com"), Some("John"), None, None).unwrap();

        // Partial update - only update operator name
        save_user(&conn, None, None, Some("Commander"), None).unwrap();

        let user = get_user(&conn).unwrap().unwrap();
        assert_eq!(user.email, Some("test@example.com".to_string())); // Preserved
        assert_eq!(user.first_name, Some("John".to_string())); // Preserved
        assert_eq!(user.operator_name, Some("Commander".to_string())); // Updated
        assert_eq!(user.default_mode, "Flow"); // Default preserved
    }

    #[test]
    fn test_clear_user() {
        let conn = setup_test_db();

        save_user(&conn, Some("test@example.com"), Some("John"), None, None).unwrap();
        assert!(has_user(&conn).unwrap());

        clear_user(&conn).unwrap();
        assert!(!has_user(&conn).unwrap());
        assert!(get_user(&conn).unwrap().is_none());
    }

    #[test]
    fn test_has_user() {
        let conn = setup_test_db();

        assert!(!has_user(&conn).unwrap());

        save_user(&conn, None, Some("John"), None, None).unwrap();

        assert!(has_user(&conn).unwrap());
    }

    #[test]
    fn test_set_default_mode() {
        let conn = setup_test_db();

        // Set mode when no user exists - should create row
        set_default_mode(&conn, "Zen").unwrap();

        let user = get_user(&conn).unwrap().unwrap();
        assert_eq!(user.default_mode, "Zen");

        // Update mode
        set_default_mode(&conn, "Legend").unwrap();

        let user = get_user(&conn).unwrap().unwrap();
        assert_eq!(user.default_mode, "Legend");
    }

    #[test]
    fn test_set_operator_name() {
        let conn = setup_test_db();

        // Set name when no user exists - should create row
        set_operator_name(&conn, "Captain").unwrap();

        let user = get_user(&conn).unwrap().unwrap();
        assert_eq!(user.operator_name, Some("Captain".to_string()));

        // Update name
        set_operator_name(&conn, "Admiral").unwrap();

        let user = get_user(&conn).unwrap().unwrap();
        assert_eq!(user.operator_name, Some("Admiral".to_string()));
    }

    #[test]
    fn test_save_user_data_struct() {
        let conn = setup_test_db();

        let data = UserData {
            email: Some("struct@example.com".to_string()),
            first_name: Some("Jane".to_string()),
            operator_name: Some("Ace".to_string()),
            default_mode: "Flow".to_string(),
        };

        save_user_data(&conn, &data).unwrap();

        let user = get_user(&conn).unwrap().unwrap();
        assert_eq!(user.email, Some("struct@example.com".to_string()));
        assert_eq!(user.first_name, Some("Jane".to_string()));
        assert_eq!(user.operator_name, Some("Ace".to_string()));
    }

    #[test]
    fn test_display_name() {
        // With operator name
        let user1 = UserData {
            email: None,
            first_name: Some("John".to_string()),
            operator_name: Some("Commander".to_string()),
            default_mode: "Flow".to_string(),
        };
        assert_eq!(user1.display_name(), "Commander");

        // Without operator name, with first name
        let user2 = UserData {
            email: None,
            first_name: Some("John".to_string()),
            operator_name: None,
            default_mode: "Flow".to_string(),
        };
        assert_eq!(user2.display_name(), "John");

        // Without any name
        let user3 = UserData::default();
        assert_eq!(user3.display_name(), "Operator");
    }

    #[test]
    fn test_is_onboarded() {
        let user1 = UserData {
            email: None,
            first_name: Some("John".to_string()),
            operator_name: None,
            default_mode: "Flow".to_string(),
        };
        assert!(user1.is_onboarded());

        let user2 = UserData {
            email: Some("test@example.com".to_string()),
            first_name: None,
            operator_name: None,
            default_mode: "Flow".to_string(),
        };
        assert!(!user2.is_onboarded());

        let user3 = UserData::default();
        assert!(!user3.is_onboarded());
    }

    #[test]
    fn test_all_fields_null() {
        let conn = setup_test_db();

        save_user(&conn, None, None, None, None).unwrap();

        let user = get_user(&conn).unwrap().unwrap();
        assert!(user.email.is_none());
        assert!(user.first_name.is_none());
        assert!(user.operator_name.is_none());
        assert_eq!(user.default_mode, "Flow"); // Default
    }
}
