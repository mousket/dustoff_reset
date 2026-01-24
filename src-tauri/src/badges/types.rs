// src-tauri/src/badges/types.rs

use serde::{Deserialize, Serialize};

/// Badge rarity levels (affects visual styling and shareability)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum BadgeRarity {
    Common,      // Easy to get, everyone has these
    Uncommon,    // Takes some effort
    Rare,        // Impressive achievement
    Epic,        // Very difficult
    Legendary,   // Elite status
    Shame,       // Walk of shame badges (still shareable!)
}

/// Badge category for organization
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum BadgeCategory {
    Milestone,      // First session, 10 sessions, etc.
    Streak,         // Consecutive days/weeks
    Performance,    // High bandwidth, no distractions
    Mode,           // Mode-specific badges
    Resilience,     // Coming back from failure
    Social,         // Sharing, referrals
    Shame,          // Walk of shame
    Secret,         // Hidden until unlocked
}

/// Criteria type for badge unlocking
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum BadgeCriteria {
    /// Complete N total sessions
    TotalSessions { count: i32 },
    
    /// Complete N sessions in a specific mode
    ModeSessions { mode: String, count: i32 },
    
    /// Achieve N-day streak
    DayStreak { days: i32 },
    
    /// Achieve N-week streak
    WeekStreak { weeks: i32 },
    
    /// Finish session with bandwidth >= threshold
    MinBandwidth { threshold: i32 },
    
    /// Finish session with bandwidth <= threshold (shame)
    MaxBandwidth { threshold: i32 },
    
    /// Complete session with zero distractions
    ZeroDistractions,
    
    /// Complete session with N+ distractions (shame)
    MinDistractions { count: i32 },
    
    /// Return from all delay gates in a session
    PerfectReturns,
    
    /// Never return from delay gates (shame)
    ZeroReturns,
    
    /// Complete N sessions in a single day
    SessionsInDay { count: i32 },
    
    /// Total focus time in minutes
    TotalFocusTime { minutes: i32 },
    
    /// Specific bandwidth finish (e.g., exactly 1 or 100)
    ExactBandwidth { value: i32 },
    
    /// Session duration milestone
    SessionDuration { minutes: i32 },
    
    /// Legend mode specific: survive N extensions
    SurviveExtensions { count: i32 },
    
    /// Share N badges/sessions
    ShareCount { count: i32 },
    
    /// Unlock N other badges
    BadgeCount { count: i32 },
    
    /// Custom criteria (evaluated separately)
    Custom { key: String },
}

/// A badge definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BadgeDefinition {
    /// Unique identifier (e.g., "first_blood")
    pub id: String,
    
    /// Display name (e.g., "First Blood")
    pub name: String,
    
    /// Short description
    pub description: String,
    
    /// Longer flavor text for share cards
    pub flavor_text: String,
    
    /// Emoji icon
    pub icon: String,
    
    /// Rarity level
    pub rarity: BadgeRarity,
    
    /// Category
    pub category: BadgeCategory,
    
    /// Unlock criteria
    pub criteria: BadgeCriteria,
    
    /// Whether badge is hidden until unlocked
    pub secret: bool,
    
    /// Share message template
    pub share_text: String,
    
    /// Hashtags for social sharing
    pub hashtags: Vec<String>,
}

/// A user's unlocked badge
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserBadge {
    /// Unique instance ID
    pub id: String,
    
    /// Badge definition ID
    pub badge_id: String,
    
    /// When it was unlocked (Unix timestamp ms)
    pub unlocked_at: u64,
    
    /// Session that triggered the unlock
    pub session_id: Option<String>,
    
    /// Additional context (JSON)
    pub metadata: Option<String>,
}

/// Streak information
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Streak {
    /// Unique ID
    pub id: String,
    
    /// Type: "daily", "weekly", "legend_daily", etc.
    pub streak_type: String,
    
    /// Current streak count
    pub current_count: i32,
    
    /// Longest streak ever
    pub longest_count: i32,
    
    /// Last activity date (ISO format: "2026-01-15")
    pub last_activity_date: Option<String>,
    
    /// When streak started (Unix timestamp ms)
    pub started_at: Option<u64>,
    
    /// Last update (Unix timestamp ms)
    pub updated_at: u64,
}

/// Progress toward a progressive badge
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BadgeProgress {
    /// Badge ID this progress is for
    pub badge_id: String,
    
    /// Current progress value
    pub current_value: i32,
    
    /// Target value to unlock
    pub target_value: i32,
    
    /// Last update (Unix timestamp ms)
    pub updated_at: u64,
}

/// Result of badge evaluation after a session
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BadgeEvaluationResult {
    /// Newly unlocked badges
    pub unlocked: Vec<UserBadge>,
    
    /// Progress updates
    pub progress_updates: Vec<BadgeProgress>,
    
    /// Streak updates
    pub streak_updates: Vec<Streak>,
}

/// Stats needed for badge evaluation
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionStatsForBadges {
    pub session_id: String,
    pub mode: String,
    pub duration_minutes: i32,
    pub final_bandwidth: i32,
    pub distraction_count: i32,
    pub delay_gates_shown: i32,
    pub delay_gates_returned: i32,
    pub blocks_shown: i32,
    pub extensions_survived: i32,
    pub total_penalties: f64,
    pub total_bonuses: f64,
    pub completed: bool,
    pub quit_early: bool,
}

/// Get current timestamp in milliseconds
pub fn now_ms() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64
}

/// Get current date as ISO string (YYYY-MM-DD)
pub fn today_iso() -> String {
    use chrono::Local;
    Local::now().format("%Y-%m-%d").to_string()
}
