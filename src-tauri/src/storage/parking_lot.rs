use rusqlite::{params, Connection, Row};

use crate::models::{
    ItemAction, ItemCategory, ItemStatus, ParkingLotItem, ParkingLotStatus,
};

/// Helper to serialize ParkingLotStatus to string
fn status_to_string(status: &ParkingLotStatus) -> &'static str {
    match status {
        ParkingLotStatus::Open => "OPEN",
        ParkingLotStatus::Completed => "COMPLETED",
        ParkingLotStatus::Deleted => "DELETED",
    }
}

/// Helper to deserialize ParkingLotStatus from string
fn status_from_string(s: &str) -> ParkingLotStatus {
    match s {
        "COMPLETED" => ParkingLotStatus::Completed,
        "DELETED" => ParkingLotStatus::Deleted,
        _ => ParkingLotStatus::Open,
    }
}

/// Helper to serialize ItemStatus to string
fn item_status_to_string(status: &ItemStatus) -> &'static str {
    match status {
        ItemStatus::New => "new",
        ItemStatus::InProgress => "in-progress",
        ItemStatus::Done => "done",
    }
}

/// Helper to deserialize ItemStatus from string
fn item_status_from_string(s: &str) -> ItemStatus {
    match s {
        "in-progress" => ItemStatus::InProgress,
        "done" => ItemStatus::Done,
        _ => ItemStatus::New,
    }
}

/// Helper to serialize ItemCategory to string
fn category_to_string(category: &ItemCategory) -> &'static str {
    match category {
        ItemCategory::Task => "task",
        ItemCategory::Idea => "idea",
        ItemCategory::Reminder => "reminder",
        ItemCategory::Distraction => "distraction",
    }
}

/// Helper to deserialize ItemCategory from string
fn category_from_string(s: &str) -> ItemCategory {
    match s {
        "idea" => ItemCategory::Idea,
        "reminder" => ItemCategory::Reminder,
        "distraction" => ItemCategory::Distraction,
        _ => ItemCategory::Task,
    }
}

/// Helper to serialize ItemAction to string
fn action_to_string(action: &ItemAction) -> &'static str {
    match action {
        ItemAction::NextSession => "next-session",
        ItemAction::Keep => "keep",
        ItemAction::Delete => "delete",
    }
}

/// Helper to deserialize ItemAction from string
fn action_from_string(s: &str) -> ItemAction {
    match s {
        "keep" => ItemAction::Keep,
        "delete" => ItemAction::Delete,
        _ => ItemAction::NextSession,
    }
}

/// Helper to build a ParkingLotItem from a database row
fn item_from_row(row: &Row) -> Result<ParkingLotItem, rusqlite::Error> {
    let id: String = row.get(0)?;
    let text: String = row.get(1)?;
    let timestamp: i64 = row.get(2)?;
    let status_str: String = row.get(3)?;
    let item_status_str: Option<String> = row.get(4)?;
    let category_str: Option<String> = row.get(5)?;
    let tags_json: String = row.get(6)?;
    let action_str: Option<String> = row.get(7)?;
    let session_id: Option<String> = row.get(8)?;
    let resolved_at: Option<String> = row.get(9)?;

    Ok(ParkingLotItem {
        id,
        text,
        timestamp,
        status: status_from_string(&status_str),
        item_status: item_status_str.map(|s| item_status_from_string(&s)),
        category: category_str.map(|s| category_from_string(&s)),
        tags: serde_json::from_str(&tags_json).unwrap_or_default(),
        action: action_str.map(|s| action_from_string(&s)),
        session_id,
        resolved_at,
    })
}

/// Add a new parking lot item.
pub fn add_parking_lot_item(conn: &Connection, item: &ParkingLotItem) -> Result<(), String> {
    let tags_json = serde_json::to_string(&item.tags).map_err(|e| e.to_string())?;
    let status_str = status_to_string(&item.status);
    let item_status_str = item.item_status.as_ref().map(item_status_to_string);
    let category_str = item.category.as_ref().map(category_to_string);
    let action_str = item.action.as_ref().map(action_to_string);

    conn.execute(
        r#"
        INSERT INTO parking_lot_items 
        (id, text, timestamp, status, item_status, category, tags, action, session_id, resolved_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
        "#,
        params![
            item.id,
            item.text,
            item.timestamp,
            status_str,
            item_status_str,
            category_str,
            tags_json,
            action_str,
            item.session_id,
            item.resolved_at,
        ],
    )
    .map_err(|e| format!("Failed to add parking lot item: {}", e))?;

    Ok(())
}

/// Update an existing parking lot item.
pub fn update_parking_lot_item(conn: &Connection, item: &ParkingLotItem) -> Result<(), String> {
    let tags_json = serde_json::to_string(&item.tags).map_err(|e| e.to_string())?;
    let status_str = status_to_string(&item.status);
    let item_status_str = item.item_status.as_ref().map(item_status_to_string);
    let category_str = item.category.as_ref().map(category_to_string);
    let action_str = item.action.as_ref().map(action_to_string);

    let rows_updated = conn
        .execute(
            r#"
        UPDATE parking_lot_items SET
            text = ?2,
            timestamp = ?3,
            status = ?4,
            item_status = ?5,
            category = ?6,
            tags = ?7,
            action = ?8,
            session_id = ?9,
            resolved_at = ?10
        WHERE id = ?1
        "#,
            params![
                item.id,
                item.text,
                item.timestamp,
                status_str,
                item_status_str,
                category_str,
                tags_json,
                action_str,
                item.session_id,
                item.resolved_at,
            ],
        )
        .map_err(|e| format!("Failed to update parking lot item: {}", e))?;

    if rows_updated == 0 {
        return Err(format!("Parking lot item not found: {}", item.id));
    }

    Ok(())
}

/// Get a parking lot item by ID.
pub fn get_parking_lot_item(
    conn: &Connection,
    id: &str,
) -> Result<Option<ParkingLotItem>, String> {
    let result = conn.query_row(
        r#"
        SELECT id, text, timestamp, status, item_status, category, tags, action, session_id, resolved_at
        FROM parking_lot_items 
        WHERE id = ?1
        "#,
        params![id],
        item_from_row,
    );

    match result {
        Ok(item) => Ok(Some(item)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(format!("Failed to get parking lot item: {}", e)),
    }
}

/// Get all active (OPEN) parking lot items.
pub fn get_active_parking_lot_items(conn: &Connection) -> Result<Vec<ParkingLotItem>, String> {
    let mut stmt = conn
        .prepare(
            r#"
        SELECT id, text, timestamp, status, item_status, category, tags, action, session_id, resolved_at
        FROM parking_lot_items 
        WHERE status = 'OPEN'
        ORDER BY timestamp DESC
        "#,
        )
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let items = stmt
        .query_map([], item_from_row)
        .map_err(|e| format!("Failed to query parking lot items: {}", e))?;

    let mut results = Vec::new();
    for item in items {
        results.push(item.map_err(|e| format!("Failed to read parking lot item: {}", e))?);
    }

    Ok(results)
}

/// Get items marked for next session.
pub fn get_next_session_items(conn: &Connection) -> Result<Vec<ParkingLotItem>, String> {
    let mut stmt = conn
        .prepare(
            r#"
        SELECT id, text, timestamp, status, item_status, category, tags, action, session_id, resolved_at
        FROM parking_lot_items 
        WHERE status = 'OPEN' AND action = 'next-session'
        ORDER BY timestamp DESC
        "#,
        )
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let items = stmt
        .query_map([], item_from_row)
        .map_err(|e| format!("Failed to query next session items: {}", e))?;

    let mut results = Vec::new();
    for item in items {
        results.push(item.map_err(|e| format!("Failed to read parking lot item: {}", e))?);
    }

    Ok(results)
}

/// Get items for a specific session.
pub fn get_session_parking_lot_items(
    conn: &Connection,
    session_id: &str,
) -> Result<Vec<ParkingLotItem>, String> {
    let mut stmt = conn
        .prepare(
            r#"
        SELECT id, text, timestamp, status, item_status, category, tags, action, session_id, resolved_at
        FROM parking_lot_items 
        WHERE session_id = ?1
        ORDER BY timestamp ASC
        "#,
        )
        .map_err(|e| format!("Failed to prepare statement: {}", e))?;

    let items = stmt
        .query_map(params![session_id], item_from_row)
        .map_err(|e| format!("Failed to query session items: {}", e))?;

    let mut results = Vec::new();
    for item in items {
        results.push(item.map_err(|e| format!("Failed to read parking lot item: {}", e))?);
    }

    Ok(results)
}

/// Delete a parking lot item (hard delete).
pub fn delete_parking_lot_item(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM parking_lot_items WHERE id = ?1", params![id])
        .map_err(|e| format!("Failed to delete parking lot item: {}", e))?;

    Ok(())
}

/// Delete all parking lot items (for reset/demo).
pub fn delete_all_parking_lot_items(conn: &Connection) -> Result<(), String> {
    conn.execute("DELETE FROM parking_lot_items", [])
        .map_err(|e| format!("Failed to delete all parking lot items: {}", e))?;

    Ok(())
}

/// Count active parking lot items.
pub fn count_active_parking_lot_items(conn: &Connection) -> Result<i32, String> {
    let count: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM parking_lot_items WHERE status = 'OPEN'",
            [],
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to count parking lot items: {}", e))?;

    Ok(count)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(
            r#"
            CREATE TABLE parking_lot_items (
                id TEXT PRIMARY KEY,
                text TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'OPEN',
                item_status TEXT,
                category TEXT,
                tags TEXT DEFAULT '[]',
                action TEXT,
                session_id TEXT,
                resolved_at TEXT
            );
            "#,
        )
        .unwrap();
        conn
    }

    fn create_test_item(id: &str) -> ParkingLotItem {
        ParkingLotItem {
            id: id.to_string(),
            text: "Test task".to_string(),
            timestamp: 1736784000000,
            status: ParkingLotStatus::Open,
            item_status: Some(ItemStatus::New),
            category: Some(ItemCategory::Task),
            tags: vec!["urgent".to_string()],
            action: None,
            session_id: Some("session-123".to_string()),
            resolved_at: None,
        }
    }

    #[test]
    fn test_add_and_get_item() {
        let conn = setup_test_db();
        let item = create_test_item("item-1");

        add_parking_lot_item(&conn, &item).unwrap();

        let loaded = get_parking_lot_item(&conn, "item-1").unwrap();
        assert!(loaded.is_some());

        let loaded = loaded.unwrap();
        assert_eq!(loaded.id, "item-1");
        assert_eq!(loaded.text, "Test task");
        assert_eq!(loaded.status, ParkingLotStatus::Open);
        assert_eq!(loaded.item_status, Some(ItemStatus::New));
        assert_eq!(loaded.category, Some(ItemCategory::Task));
        assert_eq!(loaded.tags, vec!["urgent".to_string()]);
        assert_eq!(loaded.session_id, Some("session-123".to_string()));
    }

    #[test]
    fn test_update_item() {
        let conn = setup_test_db();
        let mut item = create_test_item("item-1");

        add_parking_lot_item(&conn, &item).unwrap();

        // Update the item
        item.text = "Updated task".to_string();
        item.status = ParkingLotStatus::Completed;
        item.item_status = Some(ItemStatus::Done);
        item.action = Some(ItemAction::Keep);
        item.resolved_at = Some("2026-01-13T12:00:00Z".to_string());

        update_parking_lot_item(&conn, &item).unwrap();

        let loaded = get_parking_lot_item(&conn, "item-1").unwrap().unwrap();
        assert_eq!(loaded.text, "Updated task");
        assert_eq!(loaded.status, ParkingLotStatus::Completed);
        assert_eq!(loaded.item_status, Some(ItemStatus::Done));
        assert_eq!(loaded.action, Some(ItemAction::Keep));
        assert!(loaded.resolved_at.is_some());
    }

    #[test]
    fn test_get_active_items() {
        let conn = setup_test_db();

        // Add active items
        for i in 1..=3 {
            let item = create_test_item(&format!("active-{}", i));
            add_parking_lot_item(&conn, &item).unwrap();
        }

        // Add completed item
        let mut completed = create_test_item("completed-1");
        completed.status = ParkingLotStatus::Completed;
        add_parking_lot_item(&conn, &completed).unwrap();

        let active = get_active_parking_lot_items(&conn).unwrap();
        assert_eq!(active.len(), 3);
    }

    #[test]
    fn test_get_next_session_items() {
        let conn = setup_test_db();

        // Add regular item
        let item1 = create_test_item("item-1");
        add_parking_lot_item(&conn, &item1).unwrap();

        // Add next-session items
        for i in 2..=4 {
            let mut item = create_test_item(&format!("item-{}", i));
            item.action = Some(ItemAction::NextSession);
            add_parking_lot_item(&conn, &item).unwrap();
        }

        let next_session = get_next_session_items(&conn).unwrap();
        assert_eq!(next_session.len(), 3);
    }

    #[test]
    fn test_delete_item() {
        let conn = setup_test_db();
        let item = create_test_item("item-1");

        add_parking_lot_item(&conn, &item).unwrap();
        assert!(get_parking_lot_item(&conn, "item-1").unwrap().is_some());

        delete_parking_lot_item(&conn, "item-1").unwrap();
        assert!(get_parking_lot_item(&conn, "item-1").unwrap().is_none());
    }

    #[test]
    fn test_count_active_items() {
        let conn = setup_test_db();

        assert_eq!(count_active_parking_lot_items(&conn).unwrap(), 0);

        for i in 1..=5 {
            let item = create_test_item(&format!("item-{}", i));
            add_parking_lot_item(&conn, &item).unwrap();
        }

        assert_eq!(count_active_parking_lot_items(&conn).unwrap(), 5);
    }

    #[test]
    fn test_session_items() {
        let conn = setup_test_db();

        // Add items for session-123
        for i in 1..=3 {
            let item = create_test_item(&format!("item-{}", i));
            add_parking_lot_item(&conn, &item).unwrap();
        }

        // Add item for different session
        let mut other = create_test_item("item-other");
        other.session_id = Some("session-456".to_string());
        add_parking_lot_item(&conn, &other).unwrap();

        let session_items = get_session_parking_lot_items(&conn, "session-123").unwrap();
        assert_eq!(session_items.len(), 3);
    }
}
