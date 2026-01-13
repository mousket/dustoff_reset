use serde::{Deserialize, Serialize};

use super::session::SessionMode;

/// Recovery data for restoring an interrupted session.
/// Stored as a single row in the database.
/// Maps to TypeScript RecoveryData interface.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryData {
    /// Session ID being recovered
    pub session_id: String,
    /// Session start time (ISO 8601)
    pub started_at: String,
    /// Planned session duration in minutes
    pub planned_duration_minutes: i32,
    /// Session mode (Zen, Flow, Legend)
    pub mode: SessionMode,
    /// Session intention/goal
    pub intention: Option<String>,
    /// Elapsed time in seconds when paused/crashed
    pub elapsed_seconds: i64,
    /// Bandwidth level at time of pause
    pub bandwidth_at_pause: Option<f64>,
}

impl RecoveryData {
    /// Create new recovery data for a session
    pub fn new(
        session_id: String,
        started_at: String,
        planned_duration_minutes: i32,
        mode: SessionMode,
    ) -> Self {
        Self {
            session_id,
            started_at,
            planned_duration_minutes,
            mode,
            intention: None,
            elapsed_seconds: 0,
            bandwidth_at_pause: None,
        }
    }

    /// Update elapsed time
    pub fn update_elapsed(&mut self, elapsed_seconds: i64) {
        self.elapsed_seconds = elapsed_seconds;
    }

    /// Calculate remaining time in seconds
    pub fn remaining_seconds(&self) -> i64 {
        let planned_seconds = (self.planned_duration_minutes * 60) as i64;
        (planned_seconds - self.elapsed_seconds).max(0)
    }

    /// Check if the session has time remaining
    pub fn has_time_remaining(&self) -> bool {
        self.remaining_seconds() > 0
    }

    /// Get elapsed time as minutes
    pub fn elapsed_minutes(&self) -> f64 {
        self.elapsed_seconds as f64 / 60.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_recovery_data_creation() {
        let recovery = RecoveryData::new(
            "session-123".to_string(),
            "2026-01-13T10:00:00Z".to_string(),
            60,
            SessionMode::Flow,
        );

        assert_eq!(recovery.session_id, "session-123");
        assert_eq!(recovery.planned_duration_minutes, 60);
        assert_eq!(recovery.elapsed_seconds, 0);
        assert!(recovery.has_time_remaining());
    }

    #[test]
    fn test_remaining_seconds() {
        let mut recovery = RecoveryData::new(
            "session-123".to_string(),
            "2026-01-13T10:00:00Z".to_string(),
            60, // 60 minutes
            SessionMode::Flow,
        );

        recovery.update_elapsed(1800); // 30 minutes elapsed
        
        assert_eq!(recovery.remaining_seconds(), 1800); // 30 minutes remaining
        assert_eq!(recovery.elapsed_minutes(), 30.0);
        assert!(recovery.has_time_remaining());
    }

    #[test]
    fn test_no_time_remaining() {
        let mut recovery = RecoveryData::new(
            "session-123".to_string(),
            "2026-01-13T10:00:00Z".to_string(),
            60,
            SessionMode::Flow,
        );

        recovery.update_elapsed(3600); // Full 60 minutes elapsed
        
        assert_eq!(recovery.remaining_seconds(), 0);
        assert!(!recovery.has_time_remaining());
    }
}
