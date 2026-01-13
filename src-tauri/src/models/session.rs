use serde::{Deserialize, Serialize};

/// Session mode types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SessionMode {
    Zen,
    Flow,
    Legend,
}

/// Victory level for session completion
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum VictoryLevel {
    Minimum,
    Good,
    Legend,
    Missed,
}

/// Reason for ending a session
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum EndReason {
    MissionComplete,
    StoppingEarly,
    PulledAway,
}

/// Timeline block state
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TimelineState {
    Flow,
    Working,
    Distracted,
    Reset,
}

/// A block of time within a session timeline.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimelineBlock {
    /// Start time in minutes since session start
    pub start: i32,
    /// End time in minutes since session start
    pub end: i32,
    /// State during this block
    pub state: TimelineState,
}

/// A distraction event during a session.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DistractionEvent {
    /// Timestamp in milliseconds since session start
    pub timestamp: i64,
    /// Type of distraction
    #[serde(rename = "type")]
    pub distraction_type: String,
}

/// An intervention event during a session.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InterventionEvent {
    /// Timestamp in milliseconds since session start
    pub timestamp: i64,
    /// Type of intervention (breath, walk, dump, etc.)
    #[serde(rename = "type")]
    pub intervention_type: String,
}

/// Whitelisted application for a session.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WhitelistedApp {
    /// Application name
    pub app_name: String,
    /// Purpose of the app in this session
    pub purpose: Option<String>,
}

/// Whitelisted browser tab for a session.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WhitelistedTab {
    /// URL of the tab
    pub url: String,
    /// Title of the tab
    pub title: String,
    /// Purpose of the tab in this session
    pub purpose: Option<String>,
}

/// Complete session record matching the database schema and TypeScript SessionRecord.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionRecord {
    /// Unique session ID (UUID)
    pub session_id: String,
    /// Session start time (ISO 8601)
    pub started_at: String,
    /// Session end time (ISO 8601), None if still active
    pub ended_at: Option<String>,
    /// Planned session duration in minutes
    pub planned_duration_minutes: i32,
    /// Actual session duration in minutes
    pub actual_duration_minutes: Option<i32>,
    /// Session mode (Zen, Flow, Legend)
    pub mode: SessionMode,
    /// Session intention/goal
    pub intention: Option<String>,
    /// Victory level achieved
    pub victory_level: Option<VictoryLevel>,
    /// Flow efficiency percentage (0-100)
    pub flow_efficiency: Option<f64>,
    /// Longest uninterrupted focus streak in minutes
    pub longest_streak_minutes: i32,
    /// Number of distraction attempts
    pub distraction_attempts: i32,
    /// Number of interventions used
    pub interventions_used: i32,
    /// Reason for ending the session
    pub end_reason: Option<EndReason>,
    /// Additional context for end reason
    pub end_sub_reason: Option<String>,
    /// Timeline blocks for the session
    pub timeline_blocks: Vec<TimelineBlock>,
    /// Distraction events during the session
    pub distraction_events: Vec<DistractionEvent>,
    /// Intervention events during the session
    pub intervention_events: Vec<InterventionEvent>,
    /// Whitelisted apps for this session
    pub whitelisted_apps: Vec<WhitelistedApp>,
    /// Whitelisted browser tabs for this session
    pub whitelisted_tabs: Vec<WhitelistedTab>,
}

impl SessionRecord {
    /// Create a new session record with defaults
    pub fn new(session_id: String, mode: SessionMode, planned_duration_minutes: i32) -> Self {
        Self {
            session_id,
            started_at: chrono::Utc::now().to_rfc3339(),
            ended_at: None,
            planned_duration_minutes,
            actual_duration_minutes: None,
            mode,
            intention: None,
            victory_level: None,
            flow_efficiency: None,
            longest_streak_minutes: 0,
            distraction_attempts: 0,
            interventions_used: 0,
            end_reason: None,
            end_sub_reason: None,
            timeline_blocks: Vec::new(),
            distraction_events: Vec::new(),
            intervention_events: Vec::new(),
            whitelisted_apps: Vec::new(),
            whitelisted_tabs: Vec::new(),
        }
    }

    /// Calculate flow efficiency from timeline blocks.
    /// Flow efficiency = (time in flow state / total session time) * 100
    pub fn calculate_flow_efficiency(&self) -> f64 {
        if self.timeline_blocks.is_empty() {
            return 0.0;
        }

        let total_minutes: i32 = self
            .timeline_blocks
            .iter()
            .map(|b| b.end - b.start)
            .sum();

        if total_minutes == 0 {
            return 0.0;
        }

        let flow_minutes: i32 = self
            .timeline_blocks
            .iter()
            .filter(|b| b.state == TimelineState::Flow)
            .map(|b| b.end - b.start)
            .sum();

        (flow_minutes as f64 / total_minutes as f64) * 100.0
    }

    /// Calculate the longest streak of flow or working state.
    pub fn calculate_longest_streak(&self) -> i32 {
        let mut longest = 0;
        let mut current_streak = 0;

        for block in &self.timeline_blocks {
            if block.state == TimelineState::Flow || block.state == TimelineState::Working {
                current_streak += block.end - block.start;
                longest = longest.max(current_streak);
            } else {
                current_streak = 0;
            }
        }

        longest
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_flow_efficiency_calculation() {
        let mut session = SessionRecord::new(
            "test-id".to_string(),
            SessionMode::Flow,
            60,
        );

        session.timeline_blocks = vec![
            TimelineBlock { start: 0, end: 30, state: TimelineState::Flow },
            TimelineBlock { start: 30, end: 40, state: TimelineState::Distracted },
            TimelineBlock { start: 40, end: 60, state: TimelineState::Working },
        ];

        // 30 minutes flow / 60 total = 50%
        assert_eq!(session.calculate_flow_efficiency(), 50.0);
    }

    #[test]
    fn test_longest_streak_calculation() {
        let mut session = SessionRecord::new(
            "test-id".to_string(),
            SessionMode::Flow,
            60,
        );

        session.timeline_blocks = vec![
            TimelineBlock { start: 0, end: 20, state: TimelineState::Flow },
            TimelineBlock { start: 20, end: 25, state: TimelineState::Distracted },
            TimelineBlock { start: 25, end: 60, state: TimelineState::Working },
        ];

        // Longest streak: 25-60 = 35 minutes (working)
        assert_eq!(session.calculate_longest_streak(), 35);
    }
}
