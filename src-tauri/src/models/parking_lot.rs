use serde::{Deserialize, Serialize};

/// Status of a parking lot item
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ParkingLotStatus {
    Open,
    Completed,
    Deleted,
}

/// Item status for workflow tracking
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum ItemStatus {
    New,
    InProgress,
    Done,
}

/// Category for harvest workflow
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ItemCategory {
    Task,
    Idea,
    Reminder,
    Distraction,
}

/// Action for harvest workflow
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum ItemAction {
    NextSession,
    Keep,
    Delete,
}

/// A parking lot item - captured thought, task, or distraction.
/// Maps to TypeScript ParkingLotItemFull interface.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParkingLotItem {
    /// Unique ID (UUID)
    pub id: String,
    /// Text content of the item
    pub text: String,
    /// Creation timestamp in milliseconds
    pub timestamp: i64,
    /// Current status (OPEN, COMPLETED, DELETED)
    pub status: ParkingLotStatus,
    /// Workflow status (new, in-progress, done)
    pub item_status: Option<ItemStatus>,
    /// Category for harvest workflow
    pub category: Option<ItemCategory>,
    /// Tags for organization
    pub tags: Vec<String>,
    /// Action for harvest workflow
    pub action: Option<ItemAction>,
    /// Associated session ID (if captured during a session)
    pub session_id: Option<String>,
    /// Timestamp when item was resolved (ISO 8601)
    pub resolved_at: Option<String>,
}

impl ParkingLotItem {
    /// Create a new parking lot item with defaults
    pub fn new(id: String, text: String) -> Self {
        Self {
            id,
            text,
            timestamp: chrono::Utc::now().timestamp_millis(),
            status: ParkingLotStatus::Open,
            item_status: Some(ItemStatus::New),
            category: None,
            tags: Vec::new(),
            action: None,
            session_id: None,
            resolved_at: None,
        }
    }

    /// Mark the item as completed
    pub fn complete(&mut self) {
        self.status = ParkingLotStatus::Completed;
        self.item_status = Some(ItemStatus::Done);
        self.resolved_at = Some(chrono::Utc::now().to_rfc3339());
    }

    /// Mark the item as deleted (soft delete)
    pub fn delete(&mut self) {
        self.status = ParkingLotStatus::Deleted;
        self.resolved_at = Some(chrono::Utc::now().to_rfc3339());
    }

    /// Check if the item is still open/active
    pub fn is_open(&self) -> bool {
        self.status == ParkingLotStatus::Open
    }

    /// Check if the item is scheduled for next session
    pub fn is_next_session(&self) -> bool {
        self.action == Some(ItemAction::NextSession)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_parking_lot_item() {
        let item = ParkingLotItem::new("test-id".to_string(), "Test task".to_string());
        
        assert_eq!(item.id, "test-id");
        assert_eq!(item.text, "Test task");
        assert_eq!(item.status, ParkingLotStatus::Open);
        assert_eq!(item.item_status, Some(ItemStatus::New));
        assert!(item.is_open());
    }

    #[test]
    fn test_complete_item() {
        let mut item = ParkingLotItem::new("test-id".to_string(), "Test task".to_string());
        item.complete();
        
        assert_eq!(item.status, ParkingLotStatus::Completed);
        assert_eq!(item.item_status, Some(ItemStatus::Done));
        assert!(!item.is_open());
        assert!(item.resolved_at.is_some());
    }

    #[test]
    fn test_delete_item() {
        let mut item = ParkingLotItem::new("test-id".to_string(), "Test task".to_string());
        item.delete();
        
        assert_eq!(item.status, ParkingLotStatus::Deleted);
        assert!(!item.is_open());
        assert!(item.resolved_at.is_some());
    }
}
