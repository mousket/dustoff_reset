use serde::{Deserialize, Serialize};

/// Post-session reflection record.
/// Maps to TypeScript ReflectionObject interface.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReflectionObject {
    /// Associated session ID
    pub session_id: String,
    /// What went well during the session
    pub what_went_well: String,
    /// Notes on friction points or difficulties
    pub friction_notes: Option<String>,
    /// Closing energy level (1-5 emoji scale)
    pub closing_energy: i32,
    /// Whether the reflection was skipped
    pub skipped: bool,
    /// Creation timestamp (ISO 8601)
    pub created_at: String,
}

impl ReflectionObject {
    /// Create a new reflection for a session
    pub fn new(session_id: String, what_went_well: String, closing_energy: i32) -> Self {
        Self {
            session_id,
            what_went_well,
            friction_notes: None,
            closing_energy: closing_energy.clamp(1, 5),
            skipped: false,
            created_at: chrono::Utc::now().to_rfc3339(),
        }
    }

    /// Create a skipped reflection placeholder
    pub fn skipped(session_id: String) -> Self {
        Self {
            session_id,
            what_went_well: String::new(),
            friction_notes: None,
            closing_energy: 3, // Neutral default
            skipped: true,
            created_at: chrono::Utc::now().to_rfc3339(),
        }
    }

    /// Get energy level as an emoji
    pub fn energy_emoji(&self) -> &'static str {
        match self.closing_energy {
            1 => "😫", // Exhausted
            2 => "😐", // Low
            3 => "🙂", // Neutral
            4 => "😊", // Good
            5 => "🔥", // Energized
            _ => "🙂", // Default to neutral
        }
    }

    /// Check if the session ended with positive energy
    pub fn is_positive_ending(&self) -> bool {
        self.closing_energy >= 4
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_reflection() {
        let reflection = ReflectionObject::new(
            "session-123".to_string(),
            "Great focus today!".to_string(),
            4,
        );

        assert_eq!(reflection.session_id, "session-123");
        assert_eq!(reflection.what_went_well, "Great focus today!");
        assert_eq!(reflection.closing_energy, 4);
        assert!(!reflection.skipped);
        assert!(reflection.is_positive_ending());
    }

    #[test]
    fn test_skipped_reflection() {
        let reflection = ReflectionObject::skipped("session-123".to_string());

        assert!(reflection.skipped);
        assert_eq!(reflection.what_went_well, "");
        assert_eq!(reflection.closing_energy, 3);
    }

    #[test]
    fn test_energy_clamping() {
        let reflection = ReflectionObject::new(
            "session-123".to_string(),
            "Test".to_string(),
            10, // Should be clamped to 5
        );

        assert_eq!(reflection.closing_energy, 5);
    }

    #[test]
    fn test_energy_emoji() {
        let mut reflection = ReflectionObject::new(
            "session-123".to_string(),
            "Test".to_string(),
            1,
        );
        assert_eq!(reflection.energy_emoji(), "😫");

        reflection.closing_energy = 5;
        assert_eq!(reflection.energy_emoji(), "🔥");
    }
}
