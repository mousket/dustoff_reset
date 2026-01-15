# Phase 8: Badges, Streaks & Viral Sharing

## The System That Makes Dustoff Reset the #1 Viral App of 2026

---

## Overview

This walkthrough builds the complete badge, streak, and social sharing system. Every feature is designed with **virality in mind** - creating moments users *want* to share.

**Total Time:** 14-21 hours
**Parts:** 5

| Part | Description | Time |
|------|-------------|------|
| 1 | Database & Rust Backend | 3-4h |
| 2 | Badge Definitions & Logic | 3-4h |
| 3 | UI Components | 3-4h |
| 4 | Social Sharing & Virality | 3-4h |
| 5 | Integration & Polish | 2-3h |

---

## The Viral Strategy

Before we code, understand **why** each badge exists:

### Badge Categories by Viral Potential

| Category | Examples | Why It's Shareable |
|----------|----------|-------------------|
| **Glory Badges** | "Legend Slayer", "Flow Master" | Flex, status, aspiration |
| **Shame Badges** | "Doomscroller", "Rage Quitter" | Self-deprecating humor, relatability |
| **Streak Badges** | "7-Day Warrior", "30-Day Legend" | Commitment proof, accountability |
| **Rare Badges** | "Perfect Session", "The Unicorn" | Exclusivity, bragging rights |
| **Story Badges** | "Redemption Arc", "The Comeback" | Narrative, emotional journey |

**The Magic Formula:**
> People share **victories** to flex and **failures** to be relatable.
> Dustoff Reset gives them both.

---

# Part 1: Database & Rust Backend

**Goal:** Set up persistent storage for badges, streaks, and progress
**Time:** 3-4 hours

---

## Step 1.1: Create Badge Types

**Create file:** `src-tauri/src/badges/types.rs`

**Prompt for Cursor:**

```
Create the badge type definitions for Dustoff Reset.

Create file: src-tauri/src/badges/types.rs

```rust
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
```

Add chrono dependency to Cargo.toml:
```toml
chrono = "0.4"
```

This defines all types needed for the badge system.
```

---

## Step 1.2: Create Badge Module Structure

**Create file:** `src-tauri/src/badges/mod.rs`

**Prompt for Cursor:**

```
Create the badges module structure.

Create file: src-tauri/src/badges/mod.rs

```rust
// src-tauri/src/badges/mod.rs

pub mod types;
pub mod persistence;
pub mod evaluator;
pub mod streaks;
pub mod definitions;

pub use types::*;
pub use persistence::*;
pub use evaluator::*;
pub use streaks::*;
pub use definitions::*;
```
```

---

## Step 1.3: Create Database Schema for Badges

**Create file:** `src-tauri/src/badges/persistence.rs`

**Prompt for Cursor:**

```
Create the badge persistence layer with SQLite.

Create file: src-tauri/src/badges/persistence.rs

```rust
// src-tauri/src/badges/persistence.rs

use rusqlite::{params, Connection, Result as SqliteResult};
use uuid::Uuid;

use crate::badges::types::{UserBadge, Streak, BadgeProgress, now_ms};

/// Initialize badge tables in the database
pub fn init_badge_tables(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "
        -- User's unlocked badges
        CREATE TABLE IF NOT EXISTS user_badges (
            id TEXT PRIMARY KEY,
            badge_id TEXT NOT NULL UNIQUE,
            unlocked_at INTEGER NOT NULL,
            session_id TEXT,
            metadata TEXT
        );
        
        CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
        CREATE INDEX IF NOT EXISTS idx_user_badges_unlocked_at ON user_badges(unlocked_at);
        
        -- Streak tracking
        CREATE TABLE IF NOT EXISTS streaks (
            id TEXT PRIMARY KEY,
            streak_type TEXT NOT NULL UNIQUE,
            current_count INTEGER DEFAULT 0,
            longest_count INTEGER DEFAULT 0,
            last_activity_date TEXT,
            started_at INTEGER,
            updated_at INTEGER NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_streaks_type ON streaks(streak_type);
        
        -- Badge progress for progressive badges
        CREATE TABLE IF NOT EXISTS badge_progress (
            badge_id TEXT PRIMARY KEY,
            current_value INTEGER DEFAULT 0,
            target_value INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );
        
        -- Lifetime stats for badge evaluation
        CREATE TABLE IF NOT EXISTS lifetime_stats (
            key TEXT PRIMARY KEY,
            value INTEGER DEFAULT 0,
            updated_at INTEGER NOT NULL
        );
        "
    ).map_err(|e| format!("Failed to create badge tables: {}", e))?;
    
    Ok(())
}

// ==================== USER BADGES ====================

/// Save a newly unlocked badge
pub fn save_user_badge(conn: &Connection, badge: &UserBadge) -> Result<(), String> {
    let id = if badge.id.is_empty() {
        Uuid::new_v4().to_string()
    } else {
        badge.id.clone()
    };
    
    conn.execute(
        "INSERT OR IGNORE INTO user_badges (id, badge_id, unlocked_at, session_id, metadata)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            id,
            badge.badge_id,
            badge.unlocked_at,
            badge.session_id,
            badge.metadata,
        ],
    ).map_err(|e| format!("Failed to save badge: {}", e))?;
    
    Ok(())
}

/// Get all unlocked badges
pub fn get_all_user_badges(conn: &Connection) -> Result<Vec<UserBadge>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, badge_id, unlocked_at, session_id, metadata 
         FROM user_badges 
         ORDER BY unlocked_at DESC"
    ).map_err(|e| e.to_string())?;
    
    let badges = stmt.query_map([], |row| {
        Ok(UserBadge {
            id: row.get(0)?,
            badge_id: row.get(1)?,
            unlocked_at: row.get(2)?,
            session_id: row.get(3)?,
            metadata: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?;
    
    badges.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

/// Check if a badge is already unlocked
pub fn is_badge_unlocked(conn: &Connection, badge_id: &str) -> Result<bool, String> {
    let count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM user_badges WHERE badge_id = ?1",
        params![badge_id],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;
    
    Ok(count > 0)
}

/// Get recently unlocked badges (last N)
pub fn get_recent_badges(conn: &Connection, limit: i32) -> Result<Vec<UserBadge>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, badge_id, unlocked_at, session_id, metadata 
         FROM user_badges 
         ORDER BY unlocked_at DESC
         LIMIT ?1"
    ).map_err(|e| e.to_string())?;
    
    let badges = stmt.query_map(params![limit], |row| {
        Ok(UserBadge {
            id: row.get(0)?,
            badge_id: row.get(1)?,
            unlocked_at: row.get(2)?,
            session_id: row.get(3)?,
            metadata: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?;
    
    badges.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

// ==================== STREAKS ====================

/// Get or create a streak record
pub fn get_or_create_streak(conn: &Connection, streak_type: &str) -> Result<Streak, String> {
    let existing = conn.query_row(
        "SELECT id, streak_type, current_count, longest_count, last_activity_date, started_at, updated_at
         FROM streaks WHERE streak_type = ?1",
        params![streak_type],
        |row| {
            Ok(Streak {
                id: row.get(0)?,
                streak_type: row.get(1)?,
                current_count: row.get(2)?,
                longest_count: row.get(3)?,
                last_activity_date: row.get(4)?,
                started_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        },
    );
    
    match existing {
        Ok(streak) => Ok(streak),
        Err(rusqlite::Error::QueryReturnedNoRows) => {
            // Create new streak
            let id = Uuid::new_v4().to_string();
            let now = now_ms();
            
            conn.execute(
                "INSERT INTO streaks (id, streak_type, current_count, longest_count, updated_at)
                 VALUES (?1, ?2, 0, 0, ?3)",
                params![id, streak_type, now],
            ).map_err(|e| e.to_string())?;
            
            Ok(Streak {
                id,
                streak_type: streak_type.to_string(),
                current_count: 0,
                longest_count: 0,
                last_activity_date: None,
                started_at: None,
                updated_at: now,
            })
        }
        Err(e) => Err(e.to_string()),
    }
}

/// Update a streak
pub fn update_streak(conn: &Connection, streak: &Streak) -> Result<(), String> {
    conn.execute(
        "UPDATE streaks SET 
            current_count = ?1,
            longest_count = ?2,
            last_activity_date = ?3,
            started_at = ?4,
            updated_at = ?5
         WHERE streak_type = ?6",
        params![
            streak.current_count,
            streak.longest_count,
            streak.last_activity_date,
            streak.started_at,
            streak.updated_at,
            streak.streak_type,
        ],
    ).map_err(|e| format!("Failed to update streak: {}", e))?;
    
    Ok(())
}

/// Get all streaks
pub fn get_all_streaks(conn: &Connection) -> Result<Vec<Streak>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, streak_type, current_count, longest_count, last_activity_date, started_at, updated_at
         FROM streaks"
    ).map_err(|e| e.to_string())?;
    
    let streaks = stmt.query_map([], |row| {
        Ok(Streak {
            id: row.get(0)?,
            streak_type: row.get(1)?,
            current_count: row.get(2)?,
            longest_count: row.get(3)?,
            last_activity_date: row.get(4)?,
            started_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    }).map_err(|e| e.to_string())?;
    
    streaks.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

// ==================== BADGE PROGRESS ====================

/// Get or create badge progress
pub fn get_or_create_progress(conn: &Connection, badge_id: &str, target: i32) -> Result<BadgeProgress, String> {
    let existing = conn.query_row(
        "SELECT badge_id, current_value, target_value, updated_at
         FROM badge_progress WHERE badge_id = ?1",
        params![badge_id],
        |row| {
            Ok(BadgeProgress {
                badge_id: row.get(0)?,
                current_value: row.get(1)?,
                target_value: row.get(2)?,
                updated_at: row.get(3)?,
            })
        },
    );
    
    match existing {
        Ok(progress) => Ok(progress),
        Err(rusqlite::Error::QueryReturnedNoRows) => {
            let now = now_ms();
            
            conn.execute(
                "INSERT INTO badge_progress (badge_id, current_value, target_value, updated_at)
                 VALUES (?1, 0, ?2, ?3)",
                params![badge_id, target, now],
            ).map_err(|e| e.to_string())?;
            
            Ok(BadgeProgress {
                badge_id: badge_id.to_string(),
                current_value: 0,
                target_value: target,
                updated_at: now,
            })
        }
        Err(e) => Err(e.to_string()),
    }
}

/// Update badge progress
pub fn update_progress(conn: &Connection, progress: &BadgeProgress) -> Result<(), String> {
    conn.execute(
        "UPDATE badge_progress SET 
            current_value = ?1,
            target_value = ?2,
            updated_at = ?3
         WHERE badge_id = ?4",
        params![
            progress.current_value,
            progress.target_value,
            progress.updated_at,
            progress.badge_id,
        ],
    ).map_err(|e| format!("Failed to update progress: {}", e))?;
    
    Ok(())
}

/// Increment badge progress and return new value
pub fn increment_progress(conn: &Connection, badge_id: &str, amount: i32, target: i32) -> Result<BadgeProgress, String> {
    let mut progress = get_or_create_progress(conn, badge_id, target)?;
    progress.current_value += amount;
    progress.updated_at = now_ms();
    update_progress(conn, &progress)?;
    Ok(progress)
}

// ==================== LIFETIME STATS ====================

/// Get a lifetime stat
pub fn get_lifetime_stat(conn: &Connection, key: &str) -> Result<i32, String> {
    let value = conn.query_row(
        "SELECT value FROM lifetime_stats WHERE key = ?1",
        params![key],
        |row| row.get(0),
    );
    
    match value {
        Ok(v) => Ok(v),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(0),
        Err(e) => Err(e.to_string()),
    }
}

/// Increment a lifetime stat
pub fn increment_lifetime_stat(conn: &Connection, key: &str, amount: i32) -> Result<i32, String> {
    let now = now_ms();
    
    conn.execute(
        "INSERT INTO lifetime_stats (key, value, updated_at)
         VALUES (?1, ?2, ?3)
         ON CONFLICT(key) DO UPDATE SET
            value = value + ?2,
            updated_at = ?3",
        params![key, amount, now],
    ).map_err(|e| e.to_string())?;
    
    get_lifetime_stat(conn, key)
}

/// Set a lifetime stat (for max values)
pub fn set_lifetime_stat_if_greater(conn: &Connection, key: &str, value: i32) -> Result<(), String> {
    let now = now_ms();
    
    conn.execute(
        "INSERT INTO lifetime_stats (key, value, updated_at)
         VALUES (?1, ?2, ?3)
         ON CONFLICT(key) DO UPDATE SET
            value = MAX(value, ?2),
            updated_at = ?3",
        params![key, value, now],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}
```

This provides full CRUD operations for badges, streaks, progress, and lifetime stats.
```

---

## Step 1.4: Create Streak Calculator

**Create file:** `src-tauri/src/badges/streaks.rs`

**Prompt for Cursor:**

```
Create the streak calculation logic.

Create file: src-tauri/src/badges/streaks.rs

```rust
// src-tauri/src/badges/streaks.rs

use rusqlite::Connection;
use chrono::{Local, NaiveDate, Duration};

use crate::badges::types::{Streak, now_ms, today_iso};
use crate::badges::persistence::{get_or_create_streak, update_streak};

/// Streak types we track
pub const STREAK_DAILY: &str = "daily";
pub const STREAK_WEEKLY: &str = "weekly";
pub const STREAK_ZEN: &str = "zen_daily";
pub const STREAK_FLOW: &str = "flow_daily";
pub const STREAK_LEGEND: &str = "legend_daily";

/// Update daily streak after completing a session
pub fn update_daily_streak(conn: &Connection) -> Result<Streak, String> {
    update_streak_for_type(conn, STREAK_DAILY)
}

/// Update mode-specific streak
pub fn update_mode_streak(conn: &Connection, mode: &str) -> Result<Streak, String> {
    let streak_type = match mode.to_lowercase().as_str() {
        "zen" => STREAK_ZEN,
        "flow" => STREAK_FLOW,
        "legend" => STREAK_LEGEND,
        _ => return Err(format!("Unknown mode: {}", mode)),
    };
    
    update_streak_for_type(conn, streak_type)
}

/// Update weekly streak (called when user completes at least one session in a week)
pub fn update_weekly_streak(conn: &Connection) -> Result<Streak, String> {
    let mut streak = get_or_create_streak(conn, STREAK_WEEKLY)?;
    let today = today_iso();
    let today_date = NaiveDate::parse_from_str(&today, "%Y-%m-%d")
        .map_err(|e| e.to_string())?;
    
    // Get the week number
    let current_week = today_date.iso_week().week();
    let current_year = today_date.iso_week().year();
    let current_week_key = format!("{}-W{}", current_year, current_week);
    
    if let Some(ref last_date) = streak.last_activity_date {
        if last_date == &current_week_key {
            // Already counted this week
            return Ok(streak);
        }
        
        // Parse last week
        let parts: Vec<&str> = last_date.split("-W").collect();
        if parts.len() == 2 {
            let last_year: i32 = parts[0].parse().unwrap_or(0);
            let last_week: u32 = parts[1].parse().unwrap_or(0);
            
            // Check if consecutive week
            let is_consecutive = if current_year == last_year {
                current_week == last_week + 1
            } else if current_year == last_year + 1 && current_week == 1 {
                // First week of new year, check if last was final week of previous year
                last_week >= 52
            } else {
                false
            };
            
            if is_consecutive {
                streak.current_count += 1;
            } else {
                // Streak broken, restart
                streak.current_count = 1;
                streak.started_at = Some(now_ms());
            }
        }
    } else {
        // First week ever
        streak.current_count = 1;
        streak.started_at = Some(now_ms());
    }
    
    // Update longest
    if streak.current_count > streak.longest_count {
        streak.longest_count = streak.current_count;
    }
    
    streak.last_activity_date = Some(current_week_key);
    streak.updated_at = now_ms();
    
    update_streak(conn, &streak)?;
    
    Ok(streak)
}

/// Core streak update logic for daily streaks
fn update_streak_for_type(conn: &Connection, streak_type: &str) -> Result<Streak, String> {
    let mut streak = get_or_create_streak(conn, streak_type)?;
    let today = today_iso();
    
    if let Some(ref last_date) = streak.last_activity_date {
        if last_date == &today {
            // Already updated today, no change
            return Ok(streak);
        }
        
        // Parse dates to check if consecutive
        let last = NaiveDate::parse_from_str(last_date, "%Y-%m-%d")
            .map_err(|e| e.to_string())?;
        let today_parsed = NaiveDate::parse_from_str(&today, "%Y-%m-%d")
            .map_err(|e| e.to_string())?;
        
        let diff = today_parsed.signed_duration_since(last).num_days();
        
        if diff == 1 {
            // Consecutive day, increment streak
            streak.current_count += 1;
        } else if diff > 1 {
            // Streak broken, restart
            streak.current_count = 1;
            streak.started_at = Some(now_ms());
        }
        // diff == 0 handled above, diff < 0 shouldn't happen
    } else {
        // First day ever
        streak.current_count = 1;
        streak.started_at = Some(now_ms());
    }
    
    // Update longest if current exceeds it
    if streak.current_count > streak.longest_count {
        streak.longest_count = streak.current_count;
    }
    
    streak.last_activity_date = Some(today);
    streak.updated_at = now_ms();
    
    update_streak(conn, &streak)?;
    
    Ok(streak)
}

/// Check if streak is at risk (last activity was yesterday)
pub fn is_streak_at_risk(streak: &Streak) -> bool {
    if let Some(ref last_date) = streak.last_activity_date {
        if let Ok(last) = NaiveDate::parse_from_str(last_date, "%Y-%m-%d") {
            let today = Local::now().date_naive();
            let diff = today.signed_duration_since(last).num_days();
            return diff == 1; // Yesterday = at risk
        }
    }
    false
}

/// Check if streak is broken (last activity was more than 1 day ago)
pub fn is_streak_broken(streak: &Streak) -> bool {
    if streak.current_count == 0 {
        return false; // Never started
    }
    
    if let Some(ref last_date) = streak.last_activity_date {
        if let Ok(last) = NaiveDate::parse_from_str(last_date, "%Y-%m-%d") {
            let today = Local::now().date_naive();
            let diff = today.signed_duration_since(last).num_days();
            return diff > 1;
        }
    }
    
    false
}

/// Get streak milestone (7, 14, 30, 60, 90, 180, 365)
pub fn get_streak_milestone(count: i32) -> Option<i32> {
    let milestones = [7, 14, 30, 60, 90, 180, 365];
    milestones.iter().find(|&&m| count == m).copied()
}

/// Get next streak milestone
pub fn get_next_milestone(count: i32) -> i32 {
    let milestones = [7, 14, 30, 60, 90, 180, 365];
    for m in milestones {
        if count < m {
            return m;
        }
    }
    365 + ((count - 365) / 365 + 1) * 365 // Next yearly milestone
}
```

This handles all streak calculations including daily, weekly, and mode-specific streaks.
```

---

## Step 1.5: Create Tauri Commands for Badges

**Create file:** `src-tauri/src/commands/badges.rs`

**Prompt for Cursor:**

```
Create Tauri commands for badge operations.

Create file: src-tauri/src/commands/badges.rs

```rust
// src-tauri/src/commands/badges.rs

use tauri::{command, State};

use crate::storage::AppState;
use crate::badges::types::{UserBadge, Streak, BadgeProgress, SessionStatsForBadges, BadgeEvaluationResult};
use crate::badges::persistence::{
    init_badge_tables,
    get_all_user_badges,
    get_recent_badges,
    is_badge_unlocked,
    get_all_streaks,
    get_or_create_streak,
    get_lifetime_stat,
};
use crate::badges::streaks::{
    update_daily_streak,
    update_mode_streak,
    update_weekly_streak,
    is_streak_at_risk,
    STREAK_DAILY,
};
use crate::badges::evaluator::evaluate_session_for_badges;

/// Initialize badge tables (call on app startup)
#[command]
pub fn init_badges(state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    init_badge_tables(&conn)
}

/// Get all unlocked badges
#[command]
pub fn get_badges(state: State<AppState>) -> Result<Vec<UserBadge>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    get_all_user_badges(&conn)
}

/// Get recently unlocked badges
#[command]
pub fn get_recent_unlocked_badges(state: State<AppState>, limit: i32) -> Result<Vec<UserBadge>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    get_recent_badges(&conn, limit)
}

/// Check if a specific badge is unlocked
#[command]
pub fn check_badge_unlocked(state: State<AppState>, badge_id: String) -> Result<bool, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    is_badge_unlocked(&conn, &badge_id)
}

/// Get all streaks
#[command]
pub fn get_streaks(state: State<AppState>) -> Result<Vec<Streak>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    get_all_streaks(&conn)
}

/// Get a specific streak
#[command]
pub fn get_streak(state: State<AppState>, streak_type: String) -> Result<Streak, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    get_or_create_streak(&conn, &streak_type)
}

/// Check if daily streak is at risk
#[command]
pub fn check_streak_at_risk(state: State<AppState>) -> Result<bool, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let streak = get_or_create_streak(&conn, STREAK_DAILY)?;
    Ok(is_streak_at_risk(&streak))
}

/// Get a lifetime stat
#[command]
pub fn get_stat(state: State<AppState>, key: String) -> Result<i32, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    get_lifetime_stat(&conn, &key)
}

/// Evaluate badges after session completion
/// This is the main entry point called when a session ends
#[command]
pub fn evaluate_badges_for_session(
    state: State<AppState>,
    stats: SessionStatsForBadges,
) -> Result<BadgeEvaluationResult, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    evaluate_session_for_badges(&conn, &stats)
}

/// Get badge count (for "collect N badges" badges)
#[command]
pub fn get_badge_count(state: State<AppState>) -> Result<i32, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let badges = get_all_user_badges(&conn)?;
    Ok(badges.len() as i32)
}
```

Update src-tauri/src/commands/mod.rs to include badges:
```rust
pub mod badges;
pub use badges::*;
```

Register commands in main.rs invoke_handler.
```

---

## Step 1.6: Update main.rs with Badge Commands

**Update file:** `src-tauri/src/main.rs`

**Prompt for Cursor:**

```
Update main.rs to include badge module and commands.

Add to src-tauri/src/main.rs:

1. Add module declaration:
```rust
mod badges;
```

2. Import badge commands:
```rust
use commands::badges::{
    init_badges,
    get_badges,
    get_recent_unlocked_badges,
    check_badge_unlocked,
    get_streaks,
    get_streak,
    check_streak_at_risk,
    get_stat,
    evaluate_badges_for_session,
    get_badge_count,
};
```

3. Add commands to invoke_handler:
```rust
.invoke_handler(tauri::generate_handler![
    // ... existing commands
    init_badges,
    get_badges,
    get_recent_unlocked_badges,
    check_badge_unlocked,
    get_streaks,
    get_streak,
    check_streak_at_risk,
    get_stat,
    evaluate_badges_for_session,
    get_badge_count,
])
```

4. Initialize badge tables on startup (in setup or after DB init):
```rust
// After database is initialized
if let Ok(conn) = app_state.db.lock() {
    let _ = badges::persistence::init_badge_tables(&conn);
}
```
```

---

## Part 1 Checkpoint

**Verify:**
- [ ] `cargo build` succeeds
- [ ] Badge tables created in SQLite
- [ ] No compilation errors

---

# Part 2: Badge Definitions & Evaluator Logic

**Goal:** Define all 40+ badges and the logic to unlock them
**Time:** 3-4 hours

---

## Step 2.1: Create Badge Definitions (Rust)

**Create file:** `src-tauri/src/badges/definitions.rs`

**Prompt for Cursor:**

```
Create all badge definitions. This is the heart of the badge system.

Create file: src-tauri/src/badges/definitions.rs

```rust
// src-tauri/src/badges/definitions.rs

use crate::badges::types::{BadgeDefinition, BadgeRarity, BadgeCategory, BadgeCriteria};

/// Get all badge definitions
pub fn get_all_badge_definitions() -> Vec<BadgeDefinition> {
    vec![
        // ==================== MILESTONE BADGES ====================
        BadgeDefinition {
            id: "first_blood".to_string(),
            name: "First Blood".to_string(),
            description: "Complete your first focus session".to_string(),
            flavor_text: "Every legend starts somewhere.".to_string(),
            icon: "🩸".to_string(),
            rarity: BadgeRarity::Common,
            category: BadgeCategory::Milestone,
            criteria: BadgeCriteria::TotalSessions { count: 1 },
            secret: false,
            share_text: "Just completed my first focus session with Dustoff Reset! The journey begins. 🩸".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "FirstBlood".to_string(), "Focus".to_string()],
        },
        BadgeDefinition {
            id: "getting_started".to_string(),
            name: "Getting Started".to_string(),
            description: "Complete 5 sessions".to_string(),
            flavor_text: "You're building a habit.".to_string(),
            icon: "🌱".to_string(),
            rarity: BadgeRarity::Common,
            category: BadgeCategory::Milestone,
            criteria: BadgeCriteria::TotalSessions { count: 5 },
            secret: false,
            share_text: "5 focus sessions down! Building the habit. 🌱 #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "FocusHabit".to_string()],
        },
        BadgeDefinition {
            id: "double_digits".to_string(),
            name: "Double Digits".to_string(),
            description: "Complete 10 sessions".to_string(),
            flavor_text: "Consistency is showing.".to_string(),
            icon: "🔟".to_string(),
            rarity: BadgeRarity::Uncommon,
            category: BadgeCategory::Milestone,
            criteria: BadgeCriteria::TotalSessions { count: 10 },
            secret: false,
            share_text: "10 focus sessions complete! Double digits 🔟 #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "Consistency".to_string()],
        },
        BadgeDefinition {
            id: "quarter_century".to_string(),
            name: "Quarter Century".to_string(),
            description: "Complete 25 sessions".to_string(),
            flavor_text: "You're not messing around.".to_string(),
            icon: "🎯".to_string(),
            rarity: BadgeRarity::Uncommon,
            category: BadgeCategory::Milestone,
            criteria: BadgeCriteria::TotalSessions { count: 25 },
            secret: false,
            share_text: "25 focus sessions! This is becoming who I am. 🎯 #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "FocusMode".to_string()],
        },
        BadgeDefinition {
            id: "fifty_club".to_string(),
            name: "The Fifty Club".to_string(),
            description: "Complete 50 sessions".to_string(),
            flavor_text: "Elite focus territory.".to_string(),
            icon: "🏅".to_string(),
            rarity: BadgeRarity::Rare,
            category: BadgeCategory::Milestone,
            criteria: BadgeCriteria::TotalSessions { count: 50 },
            secret: false,
            share_text: "50 sessions. I'm in the Fifty Club now. 🏅 #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "FiftyClub".to_string()],
        },
        BadgeDefinition {
            id: "centurion".to_string(),
            name: "Centurion".to_string(),
            description: "Complete 100 sessions".to_string(),
            flavor_text: "A hundred battles. A hundred victories.".to_string(),
            icon: "💯".to_string(),
            rarity: BadgeRarity::Epic,
            category: BadgeCategory::Milestone,
            criteria: BadgeCriteria::TotalSessions { count: 100 },
            secret: false,
            share_text: "100 FOCUS SESSIONS. I am the Centurion. 💯 #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "Centurion".to_string(), "100Sessions".to_string()],
        },
        
        // ==================== STREAK BADGES ====================
        BadgeDefinition {
            id: "three_day_streak".to_string(),
            name: "Trilogy".to_string(),
            description: "3-day focus streak".to_string(),
            flavor_text: "Three days. A pattern emerges.".to_string(),
            icon: "3️⃣".to_string(),
            rarity: BadgeRarity::Common,
            category: BadgeCategory::Streak,
            criteria: BadgeCriteria::DayStreak { days: 3 },
            secret: false,
            share_text: "3-day focus streak! The pattern is forming. 3️⃣ #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "Streak".to_string()],
        },
        BadgeDefinition {
            id: "week_warrior".to_string(),
            name: "Week Warrior".to_string(),
            description: "7-day focus streak".to_string(),
            flavor_text: "A full week of focus. Respect.".to_string(),
            icon: "📅".to_string(),
            rarity: BadgeRarity::Uncommon,
            category: BadgeCategory::Streak,
            criteria: BadgeCriteria::DayStreak { days: 7 },
            secret: false,
            share_text: "7-DAY FOCUS STREAK! One full week. 📅 #DustoffReset #WeekWarrior".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "WeekWarrior".to_string(), "7DayStreak".to_string()],
        },
        BadgeDefinition {
            id: "fortnight_fighter".to_string(),
            name: "Fortnight Fighter".to_string(),
            description: "14-day focus streak".to_string(),
            flavor_text: "Two weeks of relentless focus.".to_string(),
            icon: "⚔️".to_string(),
            rarity: BadgeRarity::Rare,
            category: BadgeCategory::Streak,
            criteria: BadgeCriteria::DayStreak { days: 14 },
            secret: false,
            share_text: "14-DAY STREAK! Two weeks of pure focus. ⚔️ #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "14DayStreak".to_string()],
        },
        BadgeDefinition {
            id: "monthly_master".to_string(),
            name: "Monthly Master".to_string(),
            description: "30-day focus streak".to_string(),
            flavor_text: "A month of mastery. You're different now.".to_string(),
            icon: "🗓️".to_string(),
            rarity: BadgeRarity::Epic,
            category: BadgeCategory::Streak,
            criteria: BadgeCriteria::DayStreak { days: 30 },
            secret: false,
            share_text: "30-DAY FOCUS STREAK! A FULL MONTH! I'm not the same person I was. 🗓️ #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "MonthlyMaster".to_string(), "30DayStreak".to_string()],
        },
        BadgeDefinition {
            id: "quarterly_quest".to_string(),
            name: "Quarterly Quest".to_string(),
            description: "90-day focus streak".to_string(),
            flavor_text: "Three months. This is your life now.".to_string(),
            icon: "🏆".to_string(),
            rarity: BadgeRarity::Legendary,
            category: BadgeCategory::Streak,
            criteria: BadgeCriteria::DayStreak { days: 90 },
            secret: false,
            share_text: "90-DAY STREAK. THREE MONTHS. This isn't a phase—this is who I am. 🏆 #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "90DayStreak".to_string(), "Legendary".to_string()],
        },
        BadgeDefinition {
            id: "yearly_legend".to_string(),
            name: "Yearly Legend".to_string(),
            description: "365-day focus streak".to_string(),
            flavor_text: "One year. Every. Single. Day. You are the legend.".to_string(),
            icon: "👑".to_string(),
            rarity: BadgeRarity::Legendary,
            category: BadgeCategory::Streak,
            criteria: BadgeCriteria::DayStreak { days: 365 },
            secret: false,
            share_text: "365-DAY STREAK. ONE FULL YEAR. Every. Single. Day. 👑 #DustoffReset #YearlyLegend".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "YearlyLegend".to_string(), "365Days".to_string()],
        },
        
        // ==================== PERFORMANCE BADGES ====================
        BadgeDefinition {
            id: "flow_state".to_string(),
            name: "Flow State".to_string(),
            description: "Finish a session with bandwidth ≥ 80".to_string(),
            flavor_text: "You found the zone.".to_string(),
            icon: "⚡".to_string(),
            rarity: BadgeRarity::Uncommon,
            category: BadgeCategory::Performance,
            criteria: BadgeCriteria::MinBandwidth { threshold: 80 },
            secret: false,
            share_text: "Achieved FLOW STATE! Finished with 80+ bandwidth. ⚡ #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "FlowState".to_string()],
        },
        BadgeDefinition {
            id: "untouchable".to_string(),
            name: "Untouchable".to_string(),
            description: "Finish a session with bandwidth ≥ 90".to_string(),
            flavor_text: "Nothing could break your focus.".to_string(),
            icon: "🛡️".to_string(),
            rarity: BadgeRarity::Rare,
            category: BadgeCategory::Performance,
            criteria: BadgeCriteria::MinBandwidth { threshold: 90 },
            secret: false,
            share_text: "UNTOUCHABLE. 90+ bandwidth. Nothing broke my focus. 🛡️ #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "Untouchable".to_string()],
        },
        BadgeDefinition {
            id: "perfect_session".to_string(),
            name: "Perfect Session".to_string(),
            description: "Finish with 100 bandwidth (no penalties)".to_string(),
            flavor_text: "Flawless. Absolutely flawless.".to_string(),
            icon: "💎".to_string(),
            rarity: BadgeRarity::Epic,
            category: BadgeCategory::Performance,
            criteria: BadgeCriteria::ExactBandwidth { value: 100 },
            secret: false,
            share_text: "PERFECT SESSION. 100 bandwidth. Zero distractions. 💎 #DustoffReset #Perfect".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "PerfectSession".to_string()],
        },
        BadgeDefinition {
            id: "the_wall".to_string(),
            name: "The Wall".to_string(),
            description: "Complete a session with zero distractions".to_string(),
            flavor_text: "They tried. They failed. The wall held.".to_string(),
            icon: "🧱".to_string(),
            rarity: BadgeRarity::Rare,
            category: BadgeCategory::Performance,
            criteria: BadgeCriteria::ZeroDistractions,
            secret: false,
            share_text: "THE WALL HELD. Zero distractions. Nothing got through. 🧱 #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "TheWall".to_string()],
        },
        BadgeDefinition {
            id: "laser_focus".to_string(),
            name: "Laser Focus".to_string(),
            description: "Return from every delay gate in a session".to_string(),
            flavor_text: "Tempted every time. Resisted every time.".to_string(),
            icon: "🎯".to_string(),
            rarity: BadgeRarity::Rare,
            category: BadgeCategory::Performance,
            criteria: BadgeCriteria::PerfectReturns,
            secret: false,
            share_text: "LASER FOCUS. Returned from every temptation. 🎯 #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "LaserFocus".to_string()],
        },
        
        // ==================== MODE BADGES ====================
        BadgeDefinition {
            id: "zen_initiate".to_string(),
            name: "Zen Initiate".to_string(),
            description: "Complete 5 Zen mode sessions".to_string(),
            flavor_text: "The training grounds welcome you.".to_string(),
            icon: "🧘".to_string(),
            rarity: BadgeRarity::Common,
            category: BadgeCategory::Mode,
            criteria: BadgeCriteria::ModeSessions { mode: "Zen".to_string(), count: 5 },
            secret: false,
            share_text: "Zen Initiate. 5 sessions in the training grounds. 🧘 #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "ZenMode".to_string()],
        },
        BadgeDefinition {
            id: "flow_rider".to_string(),
            name: "Flow Rider".to_string(),
            description: "Complete 10 Flow mode sessions".to_string(),
            flavor_text: "You ride the wave of focus.".to_string(),
            icon: "🌊".to_string(),
            rarity: BadgeRarity::Uncommon,
            category: BadgeCategory::Mode,
            criteria: BadgeCriteria::ModeSessions { mode: "Flow".to_string(), count: 10 },
            secret: false,
            share_text: "Flow Rider! 10 sessions riding the focus wave. 🌊 #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "FlowMode".to_string()],
        },
        BadgeDefinition {
            id: "legend_born".to_string(),
            name: "Legend Born".to_string(),
            description: "Complete your first Legend mode session".to_string(),
            flavor_text: "You stepped into the arena.".to_string(),
            icon: "⚔️".to_string(),
            rarity: BadgeRarity::Uncommon,
            category: BadgeCategory::Mode,
            criteria: BadgeCriteria::ModeSessions { mode: "Legend".to_string(), count: 1 },
            secret: false,
            share_text: "LEGEND BORN. I stepped into the arena. ⚔️ #DustoffReset #LegendMode".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "LegendMode".to_string(), "LegendBorn".to_string()],
        },
        BadgeDefinition {
            id: "legend_proven".to_string(),
            name: "Legend Proven".to_string(),
            description: "Complete 10 Legend mode sessions".to_string(),
            flavor_text: "The arena knows your name.".to_string(),
            icon: "🔥".to_string(),
            rarity: BadgeRarity::Rare,
            category: BadgeCategory::Mode,
            criteria: BadgeCriteria::ModeSessions { mode: "Legend".to_string(), count: 10 },
            secret: false,
            share_text: "LEGEND PROVEN. 10 sessions in the arena. 🔥 #DustoffReset #LegendMode".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "LegendProven".to_string()],
        },
        BadgeDefinition {
            id: "legend_eternal".to_string(),
            name: "Legend Eternal".to_string(),
            description: "Complete 50 Legend mode sessions".to_string(),
            flavor_text: "Your legend will echo through eternity.".to_string(),
            icon: "👑".to_string(),
            rarity: BadgeRarity::Legendary,
            category: BadgeCategory::Mode,
            criteria: BadgeCriteria::ModeSessions { mode: "Legend".to_string(), count: 50 },
            secret: false,
            share_text: "LEGEND ETERNAL. 50 sessions in the arena. My legend echoes forever. 👑 #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "LegendEternal".to_string()],
        },
        BadgeDefinition {
            id: "extension_survivor".to_string(),
            name: "Extension Survivor".to_string(),
            description: "Survive a +5 minute session extension in Legend mode".to_string(),
            flavor_text: "They extended your suffering. You endured.".to_string(),
            icon: "⏱️".to_string(),
            rarity: BadgeRarity::Rare,
            category: BadgeCategory::Mode,
            criteria: BadgeCriteria::SurviveExtensions { count: 1 },
            secret: false,
            share_text: "Session extended +5 min. I SURVIVED. ⏱️ #DustoffReset #LegendMode".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "ExtensionSurvivor".to_string()],
        },
        BadgeDefinition {
            id: "triple_extension".to_string(),
            name: "Triple Extension".to_string(),
            description: "Survive 3+ extensions in a single Legend session".to_string(),
            flavor_text: "15 extra minutes of hell. You're still here.".to_string(),
            icon: "💀".to_string(),
            rarity: BadgeRarity::Epic,
            category: BadgeCategory::Mode,
            criteria: BadgeCriteria::SurviveExtensions { count: 3 },
            secret: false,
            share_text: "3 EXTENSIONS. +15 MINUTES. I SURVIVED THE GAUNTLET. 💀 #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "TripleExtension".to_string()],
        },
        
        // ==================== SHAME BADGES (WALKS OF SHAME) ====================
        BadgeDefinition {
            id: "the_fall".to_string(),
            name: "The Fall".to_string(),
            description: "Finish a session with bandwidth ≤ 20".to_string(),
            flavor_text: "You fell. But you didn't quit.".to_string(),
            icon: "📉".to_string(),
            rarity: BadgeRarity::Shame,
            category: BadgeCategory::Shame,
            criteria: BadgeCriteria::MaxBandwidth { threshold: 20 },
            secret: false,
            share_text: "I fell hard today. Bandwidth: 📉 But I didn't quit. #DustoffReset #WalkOfShame".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "WalkOfShame".to_string()],
        },
        BadgeDefinition {
            id: "rock_bottom".to_string(),
            name: "Rock Bottom".to_string(),
            description: "Finish a session with bandwidth ≤ 5".to_string(),
            flavor_text: "You hit the floor. The only way is up.".to_string(),
            icon: "🪨".to_string(),
            rarity: BadgeRarity::Shame,
            category: BadgeCategory::Shame,
            criteria: BadgeCriteria::MaxBandwidth { threshold: 5 },
            secret: false,
            share_text: "ROCK BOTTOM. Bandwidth nearly zero. But I finished. 🪨 #DustoffReset #WalkOfShame".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "RockBottom".to_string(), "WalkOfShame".to_string()],
        },
        BadgeDefinition {
            id: "one_hp".to_string(),
            name: "One HP".to_string(),
            description: "Finish a session with exactly 1 bandwidth".to_string(),
            flavor_text: "Hanging by a thread. Still alive.".to_string(),
            icon: "💔".to_string(),
            rarity: BadgeRarity::Shame,
            category: BadgeCategory::Shame,
            criteria: BadgeCriteria::ExactBandwidth { value: 1 },
            secret: true,
            share_text: "Finished with EXACTLY 1 BANDWIDTH. One HP left. Still standing. 💔 #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "OneHP".to_string()],
        },
        BadgeDefinition {
            id: "doomscroller".to_string(),
            name: "Doomscroller".to_string(),
            description: "Get blocked 5+ times in a single session".to_string(),
            flavor_text: "The wall had to work overtime.".to_string(),
            icon: "📱".to_string(),
            rarity: BadgeRarity::Shame,
            category: BadgeCategory::Shame,
            criteria: BadgeCriteria::MinDistractions { count: 5 },
            secret: false,
            share_text: "I tried to escape 5+ times today. The wall said no. 📱 #DustoffReset #Doomscroller".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "Doomscroller".to_string()],
        },
        BadgeDefinition {
            id: "serial_offender".to_string(),
            name: "Serial Offender".to_string(),
            description: "Get blocked 10+ times in a single session".to_string(),
            flavor_text: "You really tried everything, huh?".to_string(),
            icon: "🚨".to_string(),
            rarity: BadgeRarity::Shame,
            category: BadgeCategory::Shame,
            criteria: BadgeCriteria::MinDistractions { count: 10 },
            secret: false,
            share_text: "10+ BLOCKS in one session. I'm a serial offender. 🚨 #DustoffReset #WalkOfShame".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "SerialOffender".to_string()],
        },
        BadgeDefinition {
            id: "no_willpower".to_string(),
            name: "No Willpower".to_string(),
            description: "Wait through every delay gate without returning".to_string(),
            flavor_text: "You watched every countdown. Chose distraction every time.".to_string(),
            icon: "🫠".to_string(),
            rarity: BadgeRarity::Shame,
            category: BadgeCategory::Shame,
            criteria: BadgeCriteria::ZeroReturns,
            secret: false,
            share_text: "Zero willpower today. Waited through every gate. 🫠 #DustoffReset #Honest".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "NoWillpower".to_string()],
        },
        
        // ==================== RESILIENCE BADGES ====================
        BadgeDefinition {
            id: "redemption_arc".to_string(),
            name: "Redemption Arc".to_string(),
            description: "Get a Flow State badge after getting The Fall".to_string(),
            flavor_text: "You fell. You rose. You conquered.".to_string(),
            icon: "🔄".to_string(),
            rarity: BadgeRarity::Rare,
            category: BadgeCategory::Resilience,
            criteria: BadgeCriteria::Custom { key: "redemption_arc".to_string() },
            secret: true,
            share_text: "THE REDEMPTION ARC IS COMPLETE. I fell. I rose. I conquered. 🔄 #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "RedemptionArc".to_string()],
        },
        BadgeDefinition {
            id: "comeback_kid".to_string(),
            name: "Comeback Kid".to_string(),
            description: "Complete a session after breaking a streak".to_string(),
            flavor_text: "The streak died. You didn't.".to_string(),
            icon: "🔙".to_string(),
            rarity: BadgeRarity::Uncommon,
            category: BadgeCategory::Resilience,
            criteria: BadgeCriteria::Custom { key: "comeback_kid".to_string() },
            secret: false,
            share_text: "Broke my streak. Came back anyway. 🔙 #DustoffReset #ComebackKid".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "ComebackKid".to_string()],
        },
        BadgeDefinition {
            id: "phoenix".to_string(),
            name: "Phoenix".to_string(),
            description: "Rebuild a 7+ day streak after losing one".to_string(),
            flavor_text: "From the ashes, you rise.".to_string(),
            icon: "🐦‍🔥".to_string(),
            rarity: BadgeRarity::Epic,
            category: BadgeCategory::Resilience,
            criteria: BadgeCriteria::Custom { key: "phoenix".to_string() },
            secret: true,
            share_text: "Lost my streak. Built a new one. PHOENIX RISING. 🐦‍🔥 #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "Phoenix".to_string()],
        },
        
        // ==================== TIME BADGES ====================
        BadgeDefinition {
            id: "hour_hero".to_string(),
            name: "Hour Hero".to_string(),
            description: "Accumulate 1 hour of total focus time".to_string(),
            flavor_text: "Your first hour of reclaimed time.".to_string(),
            icon: "⏰".to_string(),
            rarity: BadgeRarity::Common,
            category: BadgeCategory::Milestone,
            criteria: BadgeCriteria::TotalFocusTime { minutes: 60 },
            secret: false,
            share_text: "1 HOUR of focus time with Dustoff Reset! ⏰ #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "FocusTime".to_string()],
        },
        BadgeDefinition {
            id: "time_thief".to_string(),
            name: "Time Thief".to_string(),
            description: "Accumulate 10 hours of total focus time".to_string(),
            flavor_text: "10 hours stolen back from distraction.".to_string(),
            icon: "⌛".to_string(),
            rarity: BadgeRarity::Uncommon,
            category: BadgeCategory::Milestone,
            criteria: BadgeCriteria::TotalFocusTime { minutes: 600 },
            secret: false,
            share_text: "10 HOURS of focus! Stolen back from distractions. ⌛ #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "TimeThief".to_string()],
        },
        BadgeDefinition {
            id: "time_lord".to_string(),
            name: "Time Lord".to_string(),
            description: "Accumulate 100 hours of total focus time".to_string(),
            flavor_text: "100 hours. You've mastered time itself.".to_string(),
            icon: "🕰️".to_string(),
            rarity: BadgeRarity::Epic,
            category: BadgeCategory::Milestone,
            criteria: BadgeCriteria::TotalFocusTime { minutes: 6000 },
            secret: false,
            share_text: "100 HOURS OF FOCUS. I am the Time Lord. 🕰️ #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "TimeLord".to_string()],
        },
        
        // ==================== SECRET BADGES ====================
        BadgeDefinition {
            id: "night_owl".to_string(),
            name: "Night Owl".to_string(),
            description: "Complete a session between midnight and 5am".to_string(),
            flavor_text: "The night belongs to the focused.".to_string(),
            icon: "🦉".to_string(),
            rarity: BadgeRarity::Uncommon,
            category: BadgeCategory::Secret,
            criteria: BadgeCriteria::Custom { key: "night_owl".to_string() },
            secret: true,
            share_text: "Late night focus session unlocked. 🦉 #DustoffReset #NightOwl".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "NightOwl".to_string()],
        },
        BadgeDefinition {
            id: "early_bird".to_string(),
            name: "Early Bird".to_string(),
            description: "Complete a session between 5am and 7am".to_string(),
            flavor_text: "You caught the worm.".to_string(),
            icon: "🐦".to_string(),
            rarity: BadgeRarity::Uncommon,
            category: BadgeCategory::Secret,
            criteria: BadgeCriteria::Custom { key: "early_bird".to_string() },
            secret: true,
            share_text: "Early morning focus session! 🐦 #DustoffReset #EarlyBird".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "EarlyBird".to_string()],
        },
        BadgeDefinition {
            id: "marathon".to_string(),
            name: "Marathon".to_string(),
            description: "Complete a 90+ minute session".to_string(),
            flavor_text: "An epic session. A feat of endurance.".to_string(),
            icon: "🏃".to_string(),
            rarity: BadgeRarity::Rare,
            category: BadgeCategory::Secret,
            criteria: BadgeCriteria::SessionDuration { minutes: 90 },
            secret: true,
            share_text: "90+ MINUTE SESSION. Marathon complete. 🏃 #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "Marathon".to_string()],
        },
        BadgeDefinition {
            id: "triple_threat".to_string(),
            name: "Triple Threat".to_string(),
            description: "Complete 3 sessions in a single day".to_string(),
            flavor_text: "Three sessions. One day. Absolute unit.".to_string(),
            icon: "🔱".to_string(),
            rarity: BadgeRarity::Rare,
            category: BadgeCategory::Secret,
            criteria: BadgeCriteria::SessionsInDay { count: 3 },
            secret: true,
            share_text: "3 SESSIONS IN ONE DAY! Triple threat! 🔱 #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "TripleThreat".to_string()],
        },
        BadgeDefinition {
            id: "badge_collector".to_string(),
            name: "Badge Collector".to_string(),
            description: "Unlock 20 badges".to_string(),
            flavor_text: "Gotta catch 'em all.".to_string(),
            icon: "🎖️".to_string(),
            rarity: BadgeRarity::Rare,
            category: BadgeCategory::Secret,
            criteria: BadgeCriteria::BadgeCount { count: 20 },
            secret: true,
            share_text: "20 BADGES COLLECTED! 🎖️ #DustoffReset #BadgeCollector".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "BadgeCollector".to_string()],
        },
        
        // ==================== SOCIAL BADGES ====================
        BadgeDefinition {
            id: "first_share".to_string(),
            name: "Spread the Word".to_string(),
            description: "Share your first badge or session".to_string(),
            flavor_text: "You're helping others find focus.".to_string(),
            icon: "📢".to_string(),
            rarity: BadgeRarity::Common,
            category: BadgeCategory::Social,
            criteria: BadgeCriteria::ShareCount { count: 1 },
            secret: false,
            share_text: "Just shared my first Dustoff Reset achievement! 📢 #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string()],
        },
        BadgeDefinition {
            id: "influencer".to_string(),
            name: "Influencer".to_string(),
            description: "Share 10 badges or sessions".to_string(),
            flavor_text: "You're building a focus movement.".to_string(),
            icon: "📣".to_string(),
            rarity: BadgeRarity::Uncommon,
            category: BadgeCategory::Social,
            criteria: BadgeCriteria::ShareCount { count: 10 },
            secret: false,
            share_text: "10 shares! Building the focus movement. 📣 #DustoffReset".to_string(),
            hashtags: vec!["DustoffReset".to_string(), "Influencer".to_string()],
        },
    ]
}

/// Get a badge definition by ID
pub fn get_badge_definition(badge_id: &str) -> Option<BadgeDefinition> {
    get_all_badge_definitions()
        .into_iter()
        .find(|b| b.id == badge_id)
}

/// Get all badges in a category
pub fn get_badges_by_category(category: BadgeCategory) -> Vec<BadgeDefinition> {
    get_all_badge_definitions()
        .into_iter()
        .filter(|b| b.category == category)
        .collect()
}

/// Get all non-secret badges (for display before unlock)
pub fn get_visible_badges() -> Vec<BadgeDefinition> {
    get_all_badge_definitions()
        .into_iter()
        .filter(|b| !b.secret)
        .collect()
}
```

This defines 40+ badges across all categories with viral share text and hashtags.
```

---

## Step 2.2: Create Badge Evaluator

**Create file:** `src-tauri/src/badges/evaluator.rs`

**Prompt for Cursor:**

```
Create the badge evaluation logic that checks which badges to unlock after a session.

Create file: src-tauri/src/badges/evaluator.rs

```rust
// src-tauri/src/badges/evaluator.rs

use rusqlite::Connection;
use chrono::Local;

use crate::badges::types::{
    BadgeDefinition, BadgeCriteria, UserBadge, BadgeProgress, 
    BadgeEvaluationResult, SessionStatsForBadges, now_ms,
};
use crate::badges::definitions::{get_all_badge_definitions, get_badge_definition};
use crate::badges::persistence::{
    is_badge_unlocked, save_user_badge, 
    get_lifetime_stat, increment_lifetime_stat, set_lifetime_stat_if_greater,
    increment_progress, get_or_create_progress, get_all_user_badges,
};
use crate::badges::streaks::{
    update_daily_streak, update_mode_streak, update_weekly_streak,
    get_streak_milestone, STREAK_DAILY,
};

/// Main entry point: evaluate all badges after a session completes
pub fn evaluate_session_for_badges(
    conn: &Connection,
    stats: &SessionStatsForBadges,
) -> Result<BadgeEvaluationResult, String> {
    let mut result = BadgeEvaluationResult {
        unlocked: Vec::new(),
        progress_updates: Vec::new(),
        streak_updates: Vec::new(),
    };
    
    // Only evaluate if session was completed (not quit early)
    if !stats.completed {
        return Ok(result);
    }
    
    // Update lifetime stats
    update_lifetime_stats(conn, stats)?;
    
    // Update streaks
    let daily_streak = update_daily_streak(conn)?;
    result.streak_updates.push(daily_streak.clone());
    
    let mode_streak = update_mode_streak(conn, &stats.mode)?;
    result.streak_updates.push(mode_streak.clone());
    
    let weekly_streak = update_weekly_streak(conn)?;
    result.streak_updates.push(weekly_streak);
    
    // Get all badge definitions
    let all_badges = get_all_badge_definitions();
    
    // Check each badge
    for badge_def in all_badges {
        // Skip if already unlocked
        if is_badge_unlocked(conn, &badge_def.id)? {
            continue;
        }
        
        // Check if badge criteria is met
        let (unlocked, progress) = check_badge_criteria(conn, &badge_def, stats, &daily_streak)?;
        
        if unlocked {
            // Create and save the unlocked badge
            let user_badge = UserBadge {
                id: String::new(), // Will be generated
                badge_id: badge_def.id.clone(),
                unlocked_at: now_ms(),
                session_id: Some(stats.session_id.clone()),
                metadata: Some(serde_json::to_string(stats).unwrap_or_default()),
            };
            
            save_user_badge(conn, &user_badge)?;
            result.unlocked.push(user_badge);
            
            println!("[Badges] Unlocked: {} - {}", badge_def.icon, badge_def.name);
        }
        
        // Track progress for progressive badges
        if let Some(prog) = progress {
            result.progress_updates.push(prog);
        }
    }
    
    // Check for meta-badges (badges about badges)
    check_meta_badges(conn, &mut result)?;
    
    // Check for custom/secret badges
    check_custom_badges(conn, stats, &mut result)?;
    
    Ok(result)
}

/// Update lifetime stats from session
fn update_lifetime_stats(conn: &Connection, stats: &SessionStatsForBadges) -> Result<(), String> {
    // Total sessions
    increment_lifetime_stat(conn, "total_sessions", 1)?;
    
    // Mode-specific sessions
    let mode_key = format!("{}_sessions", stats.mode.to_lowercase());
    increment_lifetime_stat(conn, &mode_key, 1)?;
    
    // Total focus time
    increment_lifetime_stat(conn, "total_focus_minutes", stats.duration_minutes)?;
    
    // Sessions today
    let today_key = format!("sessions_{}", Local::now().format("%Y%m%d"));
    increment_lifetime_stat(conn, &today_key, 1)?;
    
    // Best bandwidth (max)
    set_lifetime_stat_if_greater(conn, "best_bandwidth", stats.final_bandwidth)?;
    
    // Total distractions
    increment_lifetime_stat(conn, "total_distractions", stats.distraction_count)?;
    
    // Total extensions survived
    if stats.extensions_survived > 0 {
        increment_lifetime_stat(conn, "total_extensions_survived", stats.extensions_survived)?;
    }
    
    Ok(())
}

/// Check if a badge's criteria is met
fn check_badge_criteria(
    conn: &Connection,
    badge: &BadgeDefinition,
    stats: &SessionStatsForBadges,
    daily_streak: &crate::badges::types::Streak,
) -> Result<(bool, Option<BadgeProgress>), String> {
    match &badge.criteria {
        BadgeCriteria::TotalSessions { count } => {
            let total = get_lifetime_stat(conn, "total_sessions")?;
            let progress = get_or_create_progress(conn, &badge.id, *count)?;
            let mut updated = progress.clone();
            updated.current_value = total;
            Ok((total >= *count, Some(updated)))
        }
        
        BadgeCriteria::ModeSessions { mode, count } => {
            let key = format!("{}_sessions", mode.to_lowercase());
            let total = get_lifetime_stat(conn, &key)?;
            let progress = get_or_create_progress(conn, &badge.id, *count)?;
            let mut updated = progress.clone();
            updated.current_value = total;
            Ok((total >= *count, Some(updated)))
        }
        
        BadgeCriteria::DayStreak { days } => {
            Ok((daily_streak.current_count >= *days, None))
        }
        
        BadgeCriteria::WeekStreak { weeks } => {
            // Get weekly streak
            let weekly = crate::badges::persistence::get_or_create_streak(conn, "weekly")?;
            Ok((weekly.current_count >= *weeks, None))
        }
        
        BadgeCriteria::MinBandwidth { threshold } => {
            Ok((stats.final_bandwidth >= *threshold, None))
        }
        
        BadgeCriteria::MaxBandwidth { threshold } => {
            Ok((stats.final_bandwidth <= *threshold, None))
        }
        
        BadgeCriteria::ExactBandwidth { value } => {
            Ok((stats.final_bandwidth == *value, None))
        }
        
        BadgeCriteria::ZeroDistractions => {
            Ok((stats.distraction_count == 0, None))
        }
        
        BadgeCriteria::MinDistractions { count } => {
            Ok((stats.distraction_count >= *count, None))
        }
        
        BadgeCriteria::PerfectReturns => {
            // Must have had delay gates AND returned from all of them
            let had_gates = stats.delay_gates_shown > 0;
            let returned_all = stats.delay_gates_shown == stats.delay_gates_returned;
            Ok((had_gates && returned_all, None))
        }
        
        BadgeCriteria::ZeroReturns => {
            // Must have had delay gates AND returned from none
            let had_gates = stats.delay_gates_shown > 0;
            let returned_none = stats.delay_gates_returned == 0;
            Ok((had_gates && returned_none, None))
        }
        
        BadgeCriteria::SessionsInDay { count } => {
            let today_key = format!("sessions_{}", Local::now().format("%Y%m%d"));
            let today_count = get_lifetime_stat(conn, &today_key)?;
            Ok((today_count >= *count, None))
        }
        
        BadgeCriteria::TotalFocusTime { minutes } => {
            let total = get_lifetime_stat(conn, "total_focus_minutes")?;
            let progress = get_or_create_progress(conn, &badge.id, *minutes)?;
            let mut updated = progress.clone();
            updated.current_value = total;
            Ok((total >= *minutes, Some(updated)))
        }
        
        BadgeCriteria::SessionDuration { minutes } => {
            Ok((stats.duration_minutes >= *minutes, None))
        }
        
        BadgeCriteria::SurviveExtensions { count } => {
            Ok((stats.extensions_survived >= *count, None))
        }
        
        BadgeCriteria::ShareCount { count } => {
            let total = get_lifetime_stat(conn, "total_shares")?;
            Ok((total >= *count, None))
        }
        
        BadgeCriteria::BadgeCount { count } => {
            let badges = get_all_user_badges(conn)?;
            Ok((badges.len() as i32 >= *count, None))
        }
        
        BadgeCriteria::Custom { key: _ } => {
            // Custom badges are handled separately
            Ok((false, None))
        }
    }
}

/// Check meta badges (badges about badges)
fn check_meta_badges(conn: &Connection, result: &mut BadgeEvaluationResult) -> Result<(), String> {
    // Badge collector badges
    let badge_counts = [10, 20, 30, 40];
    let current_count = get_all_user_badges(conn)?.len() as i32 + result.unlocked.len() as i32;
    
    for threshold in badge_counts {
        let badge_id = format!("badge_collector_{}", threshold);
        if current_count >= threshold && !is_badge_unlocked(conn, &badge_id)? {
            // Check if badge exists
            if get_badge_definition(&badge_id).is_none() {
                continue;
            }
            
            let user_badge = UserBadge {
                id: String::new(),
                badge_id,
                unlocked_at: now_ms(),
                session_id: None,
                metadata: None,
            };
            save_user_badge(conn, &user_badge)?;
            result.unlocked.push(user_badge);
        }
    }
    
    Ok(())
}

/// Check custom/secret badges
fn check_custom_badges(
    conn: &Connection,
    stats: &SessionStatsForBadges,
    result: &mut BadgeEvaluationResult,
) -> Result<(), String> {
    let hour = Local::now().format("%H").to_string().parse::<i32>().unwrap_or(12);
    
    // Night Owl: Session completed between midnight and 5am
    if hour >= 0 && hour < 5 {
        try_unlock_custom_badge(conn, "night_owl", stats, result)?;
    }
    
    // Early Bird: Session completed between 5am and 7am
    if hour >= 5 && hour < 7 {
        try_unlock_custom_badge(conn, "early_bird", stats, result)?;
    }
    
    // Redemption Arc: Flow State after The Fall
    if stats.final_bandwidth >= 80 {
        if is_badge_unlocked(conn, "the_fall")? && !is_badge_unlocked(conn, "redemption_arc")? {
            try_unlock_custom_badge(conn, "redemption_arc", stats, result)?;
        }
    }
    
    Ok(())
}

/// Try to unlock a custom badge
fn try_unlock_custom_badge(
    conn: &Connection,
    badge_id: &str,
    stats: &SessionStatsForBadges,
    result: &mut BadgeEvaluationResult,
) -> Result<(), String> {
    if is_badge_unlocked(conn, badge_id)? {
        return Ok(());
    }
    
    if get_badge_definition(badge_id).is_none() {
        return Ok(());
    }
    
    let user_badge = UserBadge {
        id: String::new(),
        badge_id: badge_id.to_string(),
        unlocked_at: now_ms(),
        session_id: Some(stats.session_id.clone()),
        metadata: None,
    };
    
    save_user_badge(conn, &user_badge)?;
    result.unlocked.push(user_badge);
    
    println!("[Badges] Unlocked custom badge: {}", badge_id);
    
    Ok(())
}

/// Record a share action (for share badges)
pub fn record_share(conn: &Connection) -> Result<i32, String> {
    increment_lifetime_stat(conn, "total_shares", 1)
}
```

This evaluator checks all badge criteria after each session and unlocks appropriate badges.
```

---

## Part 2 Checkpoint

**Verify:**
- [ ] `cargo build` succeeds
- [ ] 40+ badge definitions compile
- [ ] Evaluator logic compiles
- [ ] No type errors

---

# Part 3: TypeScript & UI Components

**Goal:** Create frontend badge display and unlock notifications
**Time:** 3-4 hours

---

## Step 3.1: Create TypeScript Badge Types

**Create file:** `src/lib/badges/types.ts`

**Prompt for Cursor:**

```
Create TypeScript types for the badge system.

Create file: src/lib/badges/types.ts

```typescript
// src/lib/badges/types.ts

export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'shame'

export type BadgeCategory = 
  | 'milestone' 
  | 'streak' 
  | 'performance' 
  | 'mode' 
  | 'resilience' 
  | 'social' 
  | 'shame' 
  | 'secret'

export interface BadgeDefinition {
  id: string
  name: string
  description: string
  flavorText: string
  icon: string
  rarity: BadgeRarity
  category: BadgeCategory
  secret: boolean
  shareText: string
  hashtags: string[]
}

export interface UserBadge {
  id: string
  badgeId: string
  unlockedAt: number
  sessionId?: string
  metadata?: string
}

export interface Streak {
  id: string
  streakType: string
  currentCount: number
  longestCount: number
  lastActivityDate?: string
  startedAt?: number
  updatedAt: number
}

export interface BadgeProgress {
  badgeId: string
  currentValue: number
  targetValue: number
  updatedAt: number
}

export interface BadgeEvaluationResult {
  unlocked: UserBadge[]
  progressUpdates: BadgeProgress[]
  streakUpdates: Streak[]
}

export interface SessionStatsForBadges {
  sessionId: string
  mode: string
  durationMinutes: number
  finalBandwidth: number
  distractionCount: number
  delayGatesShown: number
  delayGatesReturned: number
  blocksShown: number
  extensionsSurvived: number
  totalPenalties: number
  totalBonuses: number
  completed: boolean
  quitEarly: boolean
}

// Rarity colors for styling
export const RARITY_COLORS: Record<BadgeRarity, { bg: string; border: string; text: string }> = {
  common: {
    bg: 'bg-gray-500/20',
    border: 'border-gray-500/40',
    text: 'text-gray-400',
  },
  uncommon: {
    bg: 'bg-green-500/20',
    border: 'border-green-500/40',
    text: 'text-green-400',
  },
  rare: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/40',
    text: 'text-blue-400',
  },
  epic: {
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/40',
    text: 'text-purple-400',
  },
  legendary: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
  },
  shame: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/40',
    text: 'text-red-400',
  },
}

// Category icons
export const CATEGORY_ICONS: Record<BadgeCategory, string> = {
  milestone: '🏁',
  streak: '🔥',
  performance: '⚡',
  mode: '🎮',
  resilience: '💪',
  social: '📢',
  shame: '😅',
  secret: '🔮',
}
```
```

---

## Step 3.2: Create Badge Definitions (TypeScript Mirror)

**Create file:** `src/lib/badges/badge-definitions.ts`

**Prompt for Cursor:**

```
Create the TypeScript badge definitions (mirrors Rust definitions).

Create file: src/lib/badges/badge-definitions.ts



```typescript
// src/lib/badges/badge-definitions.ts

import { BadgeDefinition } from './types'

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ==================== MILESTONE BADGES ====================
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Complete your first focus session',
    flavorText: 'Every legend starts somewhere.',
    icon: '🩸',
    rarity: 'common',
    category: 'milestone',
    secret: false,
    shareText: 'Just completed my first focus session with Dustoff Reset! The journey begins. 🩸',
    hashtags: ['DustoffReset', 'FirstBlood', 'Focus'],
  },
  {
    id: 'getting_started',
    name: 'Getting Started',
    description: 'Complete 5 sessions',
    flavorText: "You're building a habit.",
    icon: '🌱',
    rarity: 'common',
    category: 'milestone',
    secret: false,
    shareText: '5 focus sessions down! Building the habit. 🌱',
    hashtags: ['DustoffReset', 'FocusHabit'],
  },
  {
    id: 'double_digits',
    name: 'Double Digits',
    description: 'Complete 10 sessions',
    flavorText: 'Consistency is showing.',
    icon: '🔟',
    rarity: 'uncommon',
    category: 'milestone',
    secret: false,
    shareText: '10 focus sessions complete! Double digits 🔟',
    hashtags: ['DustoffReset', 'Consistency'],
  },
  {
    id: 'quarter_century',
    name: 'Quarter Century',
    description: 'Complete 25 sessions',
    flavorText: "You're not messing around.",
    icon: '🎯',
    rarity: 'uncommon',
    category: 'milestone',
    secret: false,
    shareText: '25 focus sessions! This is becoming who I am. 🎯',
    hashtags: ['DustoffReset', 'FocusMode'],
  },
  {
    id: 'fifty_club',
    name: 'The Fifty Club',
    description: 'Complete 50 sessions',
    flavorText: 'Elite focus territory.',
    icon: '🏅',
    rarity: 'rare',
    category: 'milestone',
    secret: false,
    shareText: "50 sessions. I'm in the Fifty Club now. 🏅",
    hashtags: ['DustoffReset', 'FiftyClub'],
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Complete 100 sessions',
    flavorText: 'A hundred battles. A hundred victories.',
    icon: '💯',
    rarity: 'epic',
    category: 'milestone',
    secret: false,
    shareText: '100 FOCUS SESSIONS. I am the Centurion. 💯',
    hashtags: ['DustoffReset', 'Centurion', '100Sessions'],
  },

  // ==================== STREAK BADGES ====================
  {
    id: 'three_day_streak',
    name: 'Trilogy',
    description: '3-day focus streak',
    flavorText: 'Three days. A pattern emerges.',
    icon: '3️⃣',
    rarity: 'common',
    category: 'streak',
    secret: false,
    shareText: '3-day focus streak! The pattern is forming. 3️⃣',
    hashtags: ['DustoffReset', 'Streak'],
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: '7-day focus streak',
    flavorText: 'A full week of focus. Respect.',
    icon: '📅',
    rarity: 'uncommon',
    category: 'streak',
    secret: false,
    shareText: '7-DAY FOCUS STREAK! One full week. 📅',
    hashtags: ['DustoffReset', 'WeekWarrior', '7DayStreak'],
  },
  {
    id: 'fortnight_fighter',
    name: 'Fortnight Fighter',
    description: '14-day focus streak',
    flavorText: 'Two weeks of relentless focus.',
    icon: '⚔️',
    rarity: 'rare',
    category: 'streak',
    secret: false,
    shareText: '14-DAY STREAK! Two weeks of pure focus. ⚔️',
    hashtags: ['DustoffReset', '14DayStreak'],
  },
  {
    id: 'monthly_master',
    name: 'Monthly Master',
    description: '30-day focus streak',
    flavorText: "A month of mastery. You're different now.",
    icon: '🗓️',
    rarity: 'epic',
    category: 'streak',
    secret: false,
    shareText: "30-DAY FOCUS STREAK! A FULL MONTH! I'm not the same person I was. 🗓️",
    hashtags: ['DustoffReset', 'MonthlyMaster', '30DayStreak'],
  },
  {
    id: 'quarterly_quest',
    name: 'Quarterly Quest',
    description: '90-day focus streak',
    flavorText: 'Three months. This is your life now.',
    icon: '🏆',
    rarity: 'legendary',
    category: 'streak',
    secret: false,
    shareText: "90-DAY STREAK. THREE MONTHS. This isn't a phase—this is who I am. 🏆",
    hashtags: ['DustoffReset', '90DayStreak', 'Legendary'],
  },
  {
    id: 'yearly_legend',
    name: 'Yearly Legend',
    description: '365-day focus streak',
    flavorText: 'One year. Every. Single. Day. You are the legend.',
    icon: '👑',
    rarity: 'legendary',
    category: 'streak',
    secret: false,
    shareText: '365-DAY STREAK. ONE FULL YEAR. Every. Single. Day. 👑',
    hashtags: ['DustoffReset', 'YearlyLegend', '365Days'],
  },

  // ==================== PERFORMANCE BADGES ====================
  {
    id: 'flow_state',
    name: 'Flow State',
    description: 'Finish a session with bandwidth ≥ 80',
    flavorText: 'You found the zone.',
    icon: '⚡',
    rarity: 'uncommon',
    category: 'performance',
    secret: false,
    shareText: 'Achieved FLOW STATE! Finished with 80+ bandwidth. ⚡',
    hashtags: ['DustoffReset', 'FlowState'],
  },
  {
    id: 'untouchable',
    name: 'Untouchable',
    description: 'Finish a session with bandwidth ≥ 90',
    flavorText: 'Nothing could break your focus.',
    icon: '🛡️',
    rarity: 'rare',
    category: 'performance',
    secret: false,
    shareText: 'UNTOUCHABLE. 90+ bandwidth. Nothing broke my focus. 🛡️',
    hashtags: ['DustoffReset', 'Untouchable'],
  },
  {
    id: 'perfect_session',
    name: 'Perfect Session',
    description: 'Finish with 100 bandwidth (no penalties)',
    flavorText: 'Flawless. Absolutely flawless.',
    icon: '💎',
    rarity: 'epic',
    category: 'performance',
    secret: false,
    shareText: 'PERFECT SESSION. 100 bandwidth. Zero distractions. 💎',
    hashtags: ['DustoffReset', 'PerfectSession'],
  },
  {
    id: 'the_wall',
    name: 'The Wall',
    description: 'Complete a session with zero distractions',
    flavorText: 'They tried. They failed. The wall held.',
    icon: '🧱',
    rarity: 'rare',
    category: 'performance',
    secret: false,
    shareText: 'THE WALL HELD. Zero distractions. Nothing got through. 🧱',
    hashtags: ['DustoffReset', 'TheWall'],
  },
  {
    id: 'laser_focus',
    name: 'Laser Focus',
    description: 'Return from every delay gate in a session',
    flavorText: 'Tempted every time. Resisted every time.',
    icon: '🎯',
    rarity: 'rare',
    category: 'performance',
    secret: false,
    shareText: 'LASER FOCUS. Returned from every temptation. 🎯',
    hashtags: ['DustoffReset', 'LaserFocus'],
  },

  // ==================== MODE BADGES ====================
  {
    id: 'zen_initiate',
    name: 'Zen Initiate',
    description: 'Complete 5 Zen mode sessions',
    flavorText: 'The training grounds welcome you.',
    icon: '🧘',
    rarity: 'common',
    category: 'mode',
    secret: false,
    shareText: 'Zen Initiate. 5 sessions in the training grounds. 🧘',
    hashtags: ['DustoffReset', 'ZenMode'],
  },
  {
    id: 'flow_rider',
    name: 'Flow Rider',
    description: 'Complete 10 Flow mode sessions',
    flavorText: 'You ride the wave of focus.',
    icon: '🌊',
    rarity: 'uncommon',
    category: 'mode',
    secret: false,
    shareText: 'Flow Rider! 10 sessions riding the focus wave. 🌊',
    hashtags: ['DustoffReset', 'FlowMode'],
  },
  {
    id: 'legend_born',
    name: 'Legend Born',
    description: 'Complete your first Legend mode session',
    flavorText: 'You stepped into the arena.',
    icon: '⚔️',
    rarity: 'uncommon',
    category: 'mode',
    secret: false,
    shareText: 'LEGEND BORN. I stepped into the arena. ⚔️',
    hashtags: ['DustoffReset', 'LegendMode', 'LegendBorn'],
  },
  {
    id: 'legend_proven',
    name: 'Legend Proven',
    description: 'Complete 10 Legend mode sessions',
    flavorText: 'The arena knows your name.',
    icon: '🔥',
    rarity: 'rare',
    category: 'mode',
    secret: false,
    shareText: 'LEGEND PROVEN. 10 sessions in the arena. 🔥',
    hashtags: ['DustoffReset', 'LegendProven'],
  },
  {
    id: 'legend_eternal',
    name: 'Legend Eternal',
    description: 'Complete 50 Legend mode sessions',
    flavorText: 'Your legend will echo through eternity.',
    icon: '👑',
    rarity: 'legendary',
    category: 'mode',
    secret: false,
    shareText: 'LEGEND ETERNAL. 50 sessions in the arena. My legend echoes forever. 👑',
    hashtags: ['DustoffReset', 'LegendEternal'],
  },
  {
    id: 'extension_survivor',
    name: 'Extension Survivor',
    description: 'Survive a +5 minute session extension in Legend mode',
    flavorText: 'They extended your suffering. You endured.',
    icon: '⏱️',
    rarity: 'rare',
    category: 'mode',
    secret: false,
    shareText: 'Session extended +5 min. I SURVIVED. ⏱️',
    hashtags: ['DustoffReset', 'ExtensionSurvivor'],
  },
  {
    id: 'triple_extension',
    name: 'Triple Extension',
    description: 'Survive 3+ extensions in a single Legend session',
    flavorText: "15 extra minutes of hell. You're still here.",
    icon: '💀',
    rarity: 'epic',
    category: 'mode',
    secret: false,
    shareText: '3 EXTENSIONS. +15 MINUTES. I SURVIVED THE GAUNTLET. 💀',
    hashtags: ['DustoffReset', 'TripleExtension'],
  },

  // ==================== SHAME BADGES ====================
  {
    id: 'the_fall',
    name: 'The Fall',
    description: 'Finish a session with bandwidth ≤ 20',
    flavorText: "You fell. But you didn't quit.",
    icon: '📉',
    rarity: 'shame',
    category: 'shame',
    secret: false,
    shareText: "I fell hard today. Bandwidth: 📉 But I didn't quit.",
    hashtags: ['DustoffReset', 'WalkOfShame'],
  },
  {
    id: 'rock_bottom',
    name: 'Rock Bottom',
    description: 'Finish a session with bandwidth ≤ 5',
    flavorText: 'You hit the floor. The only way is up.',
    icon: '🪨',
    rarity: 'shame',
    category: 'shame',
    secret: false,
    shareText: 'ROCK BOTTOM. Bandwidth nearly zero. But I finished. 🪨',
    hashtags: ['DustoffReset', 'RockBottom', 'WalkOfShame'],
  },
  {
    id: 'one_hp',
    name: 'One HP',
    description: 'Finish a session with exactly 1 bandwidth',
    flavorText: 'Hanging by a thread. Still alive.',
    icon: '💔',
    rarity: 'shame',
    category: 'shame',
    secret: true,
    shareText: 'Finished with EXACTLY 1 BANDWIDTH. One HP left. Still standing. 💔',
    hashtags: ['DustoffReset', 'OneHP'],
  },
  {
    id: 'doomscroller',
    name: 'Doomscroller',
    description: 'Get blocked 5+ times in a single session',
    flavorText: 'The wall had to work overtime.',
    icon: '📱',
    rarity: 'shame',
    category: 'shame',
    secret: false,
    shareText: 'I tried to escape 5+ times today. The wall said no. 📱',
    hashtags: ['DustoffReset', 'Doomscroller'],
  },
  {
    id: 'serial_offender',
    name: 'Serial Offender',
    description: 'Get blocked 10+ times in a single session',
    flavorText: 'You really tried everything, huh?',
    icon: '🚨',
    rarity: 'shame',
    category: 'shame',
    secret: false,
    shareText: "10+ BLOCKS in one session. I'm a serial offender. 🚨",
    hashtags: ['DustoffReset', 'SerialOffender'],
  },
  {
    id: 'no_willpower',
    name: 'No Willpower',
    description: 'Wait through every delay gate without returning',
    flavorText: 'You watched every countdown. Chose distraction every time.',
    icon: '🫠',
    rarity: 'shame',
    category: 'shame',
    secret: false,
    shareText: 'Zero willpower today. Waited through every gate. 🫠',
    hashtags: ['DustoffReset', 'NoWillpower'],
  },

  // ==================== RESILIENCE BADGES ====================
  {
    id: 'redemption_arc',
    name: 'Redemption Arc',
    description: 'Get a Flow State badge after getting The Fall',
    flavorText: 'You fell. You rose. You conquered.',
    icon: '🔄',
    rarity: 'rare',
    category: 'resilience',
    secret: true,
    shareText: 'THE REDEMPTION ARC IS COMPLETE. I fell. I rose. I conquered. 🔄',
    hashtags: ['DustoffReset', 'RedemptionArc'],
  },
  {
    id: 'comeback_kid',
    name: 'Comeback Kid',
    description: 'Complete a session after breaking a streak',
    flavorText: "The streak died. You didn't.",
    icon: '🔙',
    rarity: 'uncommon',
    category: 'resilience',
    secret: false,
    shareText: 'Broke my streak. Came back anyway. 🔙',
    hashtags: ['DustoffReset', 'ComebackKid'],
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    description: 'Rebuild a 7+ day streak after losing one',
    flavorText: 'From the ashes, you rise.',
    icon: '🐦‍🔥',
    rarity: 'epic',
    category: 'resilience',
    secret: true,
    shareText: 'Lost my streak. Built a new one. PHOENIX RISING. 🐦‍🔥',
    hashtags: ['DustoffReset', 'Phoenix'],
  },

  // ==================== TIME BADGES ====================
  {
    id: 'hour_hero',
    name: 'Hour Hero',
    description: 'Accumulate 1 hour of total focus time',
    flavorText: 'Your first hour of reclaimed time.',
    icon: '⏰',
    rarity: 'common',
    category: 'milestone',
    secret: false,
    shareText: '1 HOUR of focus time with Dustoff Reset! ⏰',
    hashtags: ['DustoffReset', 'FocusTime'],
  },
  {
    id: 'time_thief',
    name: 'Time Thief',
    description: 'Accumulate 10 hours of total focus time',
    flavorText: '10 hours stolen back from distraction.',
    icon: '⌛',
    rarity: 'uncommon',
    category: 'milestone',
    secret: false,
    shareText: '10 HOURS of focus! Stolen back from distractions. ⌛',
    hashtags: ['DustoffReset', 'TimeThief'],
  },
  {
    id: 'time_lord',
    name: 'Time Lord',
    description: 'Accumulate 100 hours of total focus time',
    flavorText: "100 hours. You've mastered time itself.",
    icon: '🕰️',
    rarity: 'epic',
    category: 'milestone',
    secret: false,
    shareText: '100 HOURS OF FOCUS. I am the Time Lord. 🕰️',
    hashtags: ['DustoffReset', 'TimeLord'],
  },

  // ==================== SECRET BADGES ====================
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete a session between midnight and 5am',
    flavorText: 'The night belongs to the focused.',
    icon: '🦉',
    rarity: 'uncommon',
    category: 'secret',
    secret: true,
    shareText: 'Late night focus session unlocked. 🦉',
    hashtags: ['DustoffReset', 'NightOwl'],
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete a session between 5am and 7am',
    flavorText: 'You caught the worm.',
    icon: '🐦',
    rarity: 'uncommon',
    category: 'secret',
    secret: true,
    shareText: 'Early morning focus session! 🐦',
    hashtags: ['DustoffReset', 'EarlyBird'],
  },
  {
    id: 'marathon',
    name: 'Marathon',
    description: 'Complete a 90+ minute session',
    flavorText: 'An epic session. A feat of endurance.',
    icon: '🏃',
    rarity: 'rare',
    category: 'secret',
    secret: true,
    shareText: '90+ MINUTE SESSION. Marathon complete. 🏃',
    hashtags: ['DustoffReset', 'Marathon'],
  },
  {
    id: 'triple_threat',
    name: 'Triple Threat',
    description: 'Complete 3 sessions in a single day',
    flavorText: 'Three sessions. One day. Absolute unit.',
    icon: '🔱',
    rarity: 'rare',
    category: 'secret',
    secret: true,
    shareText: '3 SESSIONS IN ONE DAY! Triple threat! 🔱',
    hashtags: ['DustoffReset', 'TripleThreat'],
  },
  {
    id: 'badge_collector',
    name: 'Badge Collector',
    description: 'Unlock 20 badges',
    flavorText: "Gotta catch 'em all.",
    icon: '🎖️',
    rarity: 'rare',
    category: 'secret',
    secret: true,
    shareText: '20 BADGES COLLECTED! 🎖️',
    hashtags: ['DustoffReset', 'BadgeCollector'],
  },

  // ==================== SOCIAL BADGES ====================
  {
    id: 'first_share',
    name: 'Spread the Word',
    description: 'Share your first badge or session',
    flavorText: "You're helping others find focus.",
    icon: '📢',
    rarity: 'common',
    category: 'social',
    secret: false,
    shareText: 'Just shared my first Dustoff Reset achievement! 📢',
    hashtags: ['DustoffReset'],
  },
  {
    id: 'influencer',
    name: 'Influencer',
    description: 'Share 10 badges or sessions',
    flavorText: "You're building a focus movement.",
    icon: '📣',
    rarity: 'uncommon',
    category: 'social',
    secret: false,
    shareText: '10 shares! Building the focus movement. 📣',
    hashtags: ['DustoffReset', 'Influencer'],
  },
]

// Helper functions
export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find(b => b.id === id)
}

export function getBadgesByCategory(category: BadgeCategory): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter(b => b.category === category)
}

export function getVisibleBadges(): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter(b => !b.secret)
}

export function getSecretBadges(): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter(b => b.secret)
}
```

This mirrors the Rust definitions for use in the frontend.
```

---

## Step 3.3: Create Badge Module Index

**Create file:** `src/lib/badges/index.ts`

**Prompt for Cursor:**

```
Create the badges module index.

Create file: src/lib/badges/index.ts

```typescript
// src/lib/badges/index.ts

export * from './types'
export * from './badge-definitions'
```
```

---

## Step 3.4: Update Tauri Bridge with Badge Commands

**Update file:** `src/lib/tauri-bridge.ts`

**Prompt for Cursor:**

```
Add badge commands to the Tauri bridge.

Add these methods to src/lib/tauri-bridge.ts:

```typescript
import type { 
  UserBadge, 
  Streak, 
  BadgeEvaluationResult, 
  SessionStatsForBadges 
} from '@/lib/badges/types'

// In the tauriBridge object, add:

// Badge commands
initBadges: async (): Promise<void> => {
  return invoke('init_badges')
},

getBadges: async (): Promise<UserBadge[]> => {
  return invoke('get_badges')
},

getRecentBadges: async (limit: number): Promise<UserBadge[]> => {
  return invoke('get_recent_unlocked_badges', { limit })
},

checkBadgeUnlocked: async (badgeId: string): Promise<boolean> => {
  return invoke('check_badge_unlocked', { badgeId })
},

getStreaks: async (): Promise<Streak[]> => {
  return invoke('get_streaks')
},

getStreak: async (streakType: string): Promise<Streak> => {
  return invoke('get_streak', { streakType })
},

checkStreakAtRisk: async (): Promise<boolean> => {
  return invoke('check_streak_at_risk')
},

getStat: async (key: string): Promise<number> => {
  return invoke('get_stat', { key })
},

evaluateBadgesForSession: async (stats: SessionStatsForBadges): Promise<BadgeEvaluationResult> => {
  return invoke('evaluate_badges_for_session', { stats })
},

getBadgeCount: async (): Promise<number> => {
  return invoke('get_badge_count')
},
```
```

---

## Step 3.5: Create useBadges Hook

**Create file:** `src/hooks/useBadges.ts`

**Prompt for Cursor:**

```
Create the useBadges hook for badge state management.

Create file: src/hooks/useBadges.ts

```typescript
// src/hooks/useBadges.ts

import { useState, useEffect, useCallback } from 'react'
import { tauriBridge } from '@/lib/tauri-bridge'
import { 
  UserBadge, 
  Streak, 
  BadgeEvaluationResult, 
  SessionStatsForBadges,
  BadgeDefinition,
} from '@/lib/badges/types'
import { getBadgeById, BADGE_DEFINITIONS } from '@/lib/badges/badge-definitions'

export interface BadgeWithDefinition extends UserBadge {
  definition: BadgeDefinition
}

export interface UseBadgesReturn {
  // State
  badges: BadgeWithDefinition[]
  streaks: Streak[]
  isLoading: boolean
  error: string | null
  
  // Computed
  totalBadges: number
  unlockedCount: number
  dailyStreak: Streak | null
  longestStreak: number
  
  // Actions
  refreshBadges: () => Promise<void>
  refreshStreaks: () => Promise<void>
  evaluateSession: (stats: SessionStatsForBadges) => Promise<BadgeEvaluationResult>
  isStreakAtRisk: () => Promise<boolean>
  
  // Helpers
  getBadgeDefinition: (badgeId: string) => BadgeDefinition | undefined
  isBadgeUnlocked: (badgeId: string) => boolean
}

export function useBadges(): UseBadgesReturn {
  const [badges, setBadges] = useState<BadgeWithDefinition[]>([])
  const [streaks, setStreaks] = useState<Streak[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load badges from backend
  const refreshBadges = useCallback(async () => {
    try {
      const userBadges = await tauriBridge.getBadges()
      
      // Combine with definitions
      const badgesWithDefs: BadgeWithDefinition[] = userBadges
        .map(ub => {
          const def = getBadgeById(ub.badgeId)
          if (!def) return null
          return { ...ub, definition: def }
        })
        .filter((b): b is BadgeWithDefinition => b !== null)
      
      setBadges(badgesWithDefs)
    } catch (err) {
      console.error('[useBadges] Failed to load badges:', err)
      setError(err instanceof Error ? err.message : 'Failed to load badges')
    }
  }, [])

  // Load streaks from backend
  const refreshStreaks = useCallback(async () => {
    try {
      const loadedStreaks = await tauriBridge.getStreaks()
      setStreaks(loadedStreaks)
    } catch (err) {
      console.error('[useBadges] Failed to load streaks:', err)
      setError(err instanceof Error ? err.message : 'Failed to load streaks')
    }
  }, [])

  // Initial load
  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      try {
        await tauriBridge.initBadges()
        await Promise.all([refreshBadges(), refreshStreaks()])
      } catch (err) {
        console.error('[useBadges] Init failed:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize badges')
      } finally {
        setIsLoading(false)
      }
    }
    
    init()
  }, [refreshBadges, refreshStreaks])

  // Evaluate session for badges
  const evaluateSession = useCallback(async (stats: SessionStatsForBadges): Promise<BadgeEvaluationResult> => {
    try {
      const result = await tauriBridge.evaluateBadgesForSession(stats)
      
      // Refresh badges and streaks after evaluation
      await Promise.all([refreshBadges(), refreshStreaks()])
      
      return result
    } catch (err) {
      console.error('[useBadges] Evaluation failed:', err)
      throw err
    }
  }, [refreshBadges, refreshStreaks])

  // Check if streak is at risk
  const isStreakAtRisk = useCallback(async (): Promise<boolean> => {
    try {
      return await tauriBridge.checkStreakAtRisk()
    } catch (err) {
      console.error('[useBadges] Streak check failed:', err)
      return false
    }
  }, [])

  // Check if badge is unlocked
  const isBadgeUnlocked = useCallback((badgeId: string): boolean => {
    return badges.some(b => b.badgeId === badgeId)
  }, [badges])

  // Computed values
  const totalBadges = BADGE_DEFINITIONS.length
  const unlockedCount = badges.length
  
  const dailyStreak = streaks.find(s => s.streakType === 'daily') || null
  
  const longestStreak = streaks.reduce((max, s) => 
    Math.max(max, s.longestCount), 0
  )

  return {
    badges,
    streaks,
    isLoading,
    error,
    totalBadges,
    unlockedCount,
    dailyStreak,
    longestStreak,
    refreshBadges,
    refreshStreaks,
    evaluateSession,
    isStreakAtRisk,
    getBadgeDefinition: getBadgeById,
    isBadgeUnlocked,
  }
}
```
```

---

## Step 3.6: Create BadgeCard Component

**Create file:** `src/components/badges/BadgeCard.tsx`

**Prompt for Cursor:**

```
Create the BadgeCard component for displaying individual badges.

Create file: src/components/badges/BadgeCard.tsx

```typescript
// src/components/badges/BadgeCard.tsx

import React from 'react'
import { BadgeDefinition, RARITY_COLORS } from '@/lib/badges/types'
import { cn } from '@/lib/utils'

interface BadgeCardProps {
  badge: BadgeDefinition
  unlocked: boolean
  unlockedAt?: number
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  showDescription?: boolean
  className?: string
}

export const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  unlocked,
  unlockedAt,
  size = 'md',
  onClick,
  showDescription = true,
  className,
}) => {
  const colors = RARITY_COLORS[badge.rarity]
  
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  }
  
  const iconSizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-5xl',
  }
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200',
        unlocked ? colors.bg : 'bg-gray-800/50',
        unlocked ? colors.border : 'border-gray-700/50',
        'border',
        onClick && 'cursor-pointer hover:scale-105 hover:shadow-lg',
        !unlocked && 'opacity-50 grayscale',
        className
      )}
      onClick={onClick}
    >
      {/* Badge Icon */}
      <div
        className={cn(
          sizeClasses[size],
          'flex items-center justify-center rounded-full',
          unlocked ? colors.bg : 'bg-gray-700/50',
          'border-2',
          unlocked ? colors.border : 'border-gray-600/50',
          'transition-all duration-300',
          unlocked && 'animate-pulse-slow'
        )}
      >
        <span className={cn(iconSizes[size], !unlocked && 'opacity-30')}>
          {unlocked || !badge.secret ? badge.icon : '❓'}
        </span>
      </div>
      
      {/* Badge Name */}
      <div className="text-center">
        <p className={cn(
          'font-semibold',
          size === 'sm' ? 'text-xs' : 'text-sm',
          unlocked ? colors.text : 'text-gray-500'
        )}>
          {unlocked || !badge.secret ? badge.name : '???'}
        </p>
        
        {/* Rarity Label */}
        <p className={cn(
          'text-xs capitalize',
          unlocked ? colors.text : 'text-gray-600',
          'opacity-70'
        )}>
          {badge.rarity}
        </p>
      </div>
      
      {/* Description */}
      {showDescription && size !== 'sm' && (
        <p className={cn(
          'text-xs text-center',
          unlocked ? 'text-gray-300' : 'text-gray-600',
          'line-clamp-2'
        )}>
          {unlocked || !badge.secret ? badge.description : 'Complete a secret challenge'}
        </p>
      )}
      
      {/* Unlock Date */}
      {unlocked && unlockedAt && size === 'lg' && (
        <p className="text-xs text-gray-500">
          Unlocked {formatDate(unlockedAt)}
        </p>
      )}
    </div>
  )
}
```
```

---

## Step 3.7: Create BadgeUnlockToast Component

**Create file:** `src/components/badges/BadgeUnlockToast.tsx`

**Prompt for Cursor:**

```
Create the BadgeUnlockToast component for badge unlock notifications.

Create file: src/components/badges/BadgeUnlockToast.tsx

```typescript
// src/components/badges/BadgeUnlockToast.tsx

import React, { useEffect, useState } from 'react'
import { BadgeDefinition, RARITY_COLORS } from '@/lib/badges/types'
import { cn } from '@/lib/utils'

interface BadgeUnlockToastProps {
  badge: BadgeDefinition
  onClose: () => void
  onShare?: () => void
  duration?: number
}

export const BadgeUnlockToast: React.FC<BadgeUnlockToastProps> = ({
  badge,
  onClose,
  onShare,
  duration = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const colors = RARITY_COLORS[badge.rarity]

  useEffect(() => {
    // Enter animation
    requestAnimationFrame(() => setIsVisible(true))
    
    // Auto close
    const timer = setTimeout(() => {
      handleClose()
    }, duration)
    
    return () => clearTimeout(timer)
  }, [duration])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(onClose, 300)
  }

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50',
        'transform transition-all duration-300 ease-out',
        isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
      )}
    >
      <div
        className={cn(
          'flex items-center gap-4 p-4 rounded-xl',
          'bg-gray-900/95 backdrop-blur-sm',
          'border-2',
          colors.border,
          'shadow-2xl',
          'min-w-[320px] max-w-[400px]'
        )}
      >
        {/* Badge Icon with Glow */}
        <div
          className={cn(
            'w-16 h-16 flex items-center justify-center rounded-full',
            colors.bg,
            'border-2',
            colors.border,
            'animate-bounce-slow'
          )}
          style={{
            boxShadow: badge.rarity === 'legendary' 
              ? '0 0 20px rgba(251, 191, 36, 0.5)' 
              : badge.rarity === 'epic'
              ? '0 0 15px rgba(168, 85, 247, 0.5)'
              : undefined
          }}
        >
          <span className="text-3xl">{badge.icon}</span>
        </div>
        
        {/* Content */}
        <div className="flex-1">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            Badge Unlocked!
          </p>
          <p className={cn('font-bold text-lg', colors.text)}>
            {badge.name}
          </p>
          <p className="text-sm text-gray-400 line-clamp-1">
            {badge.flavorText}
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col gap-2">
          {onShare && (
            <button
              onClick={onShare}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium',
                'bg-cyan-500/20 text-cyan-400',
                'hover:bg-cyan-500/30 transition-colors'
              )}
            >
              Share
            </button>
          )}
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-300 text-sm"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}

// Queue manager for multiple badge unlocks
interface BadgeQueueManagerProps {
  badges: BadgeDefinition[]
  onShare?: (badge: BadgeDefinition) => void
  onAllClosed?: () => void
}

export const BadgeUnlockQueue: React.FC<BadgeQueueManagerProps> = ({
  badges,
  onShare,
  onAllClosed,
}) => {
  const [queue, setQueue] = useState<BadgeDefinition[]>(badges)
  const [currentBadge, setCurrentBadge] = useState<BadgeDefinition | null>(null)

  useEffect(() => {
    if (!currentBadge && queue.length > 0) {
      setCurrentBadge(queue[0])
      setQueue(prev => prev.slice(1))
    }
  }, [currentBadge, queue])

  useEffect(() => {
    if (!currentBadge && queue.length === 0 && badges.length > 0) {
      onAllClosed?.()
    }
  }, [currentBadge, queue, badges.length, onAllClosed])

  const handleClose = () => {
    setCurrentBadge(null)
  }

  if (!currentBadge) return null

  return (
    <BadgeUnlockToast
      badge={currentBadge}
      onClose={handleClose}
      onShare={onShare ? () => onShare(currentBadge) : undefined}
      duration={4000}
    />
  )
}
```
```

---

## Step 3.8: Create StreakDisplay Component

**Create file:** `src/components/badges/StreakDisplay.tsx`

**Prompt for Cursor:**

```
Create the StreakDisplay component for showing current streaks.

Create file: src/components/badges/StreakDisplay.tsx

```typescript
// src/components/badges/StreakDisplay.tsx

import React from 'react'
import { Streak } from '@/lib/badges/types'
import { cn } from '@/lib/utils'

interface StreakDisplayProps {
  streak: Streak
  isAtRisk?: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({
  streak,
  isAtRisk = false,
  size = 'md',
  showLabel = true,
  className,
}) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  }
  
  const getStreakColor = () => {
    if (isAtRisk) return 'text-amber-400'
    if (streak.currentCount >= 30) return 'text-purple-400'
    if (streak.currentCount >= 7) return 'text-cyan-400'
    if (streak.currentCount >= 3) return 'text-green-400'
    return 'text-gray-400'
  }
  
  const getStreakLabel = () => {
    switch (streak.streakType) {
      case 'daily': return 'Day Streak'
      case 'weekly': return 'Week Streak'
      case 'zen_daily': return 'Zen Streak'
      case 'flow_daily': return 'Flow Streak'
      case 'legend_daily': return 'Legend Streak'
      default: return 'Streak'
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-xl">🔥</span>
      <div className="flex flex-col">
        <span className={cn(sizeClasses[size], 'font-bold', getStreakColor())}>
          {streak.currentCount}
        </span>
        {showLabel && (
          <span className="text-xs text-gray-500">
            {getStreakLabel()}
            {isAtRisk && (
              <span className="text-amber-400 ml-1">(at risk!)</span>
            )}
          </span>
        )}
      </div>
      {streak.longestCount > streak.currentCount && size !== 'sm' && (
        <span className="text-xs text-gray-600 ml-2">
          Best: {streak.longestCount}
        </span>
      )}
    </div>
  )
}

// Compact version for HUD
export const StreakBadge: React.FC<{
  count: number
  isAtRisk?: boolean
  className?: string
}> = ({ count, isAtRisk, className }) => {
  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-full',
        'bg-gray-800/80 border border-gray-700/50',
        isAtRisk && 'border-amber-500/50 animate-pulse',
        className
      )}
    >
      <span className="text-sm">🔥</span>
      <span className={cn(
        'font-bold text-sm',
        isAtRisk ? 'text-amber-400' : 'text-gray-300'
      )}>
        {count}
      </span>
    </div>
  )
}
```
```

---

## Step 3.9: Create BadgeGrid Component

**Create file:** `src/components/badges/BadgeGrid.tsx`

**Prompt for Cursor:**

```
Create the BadgeGrid component for displaying all badges.

Create file: src/components/badges/BadgeGrid.tsx

```typescript
// src/components/badges/BadgeGrid.tsx

import React, { useState, useMemo } from 'react'
import { BadgeDefinition, BadgeCategory, CATEGORY_ICONS } from '@/lib/badges/types'
import { BADGE_DEFINITIONS, getBadgesByCategory } from '@/lib/badges/badge-definitions'
import { BadgeCard } from './BadgeCard'
import { cn } from '@/lib/utils'

interface BadgeGridProps {
  unlockedBadgeIds: string[]
  unlockedAtMap?: Record<string, number>
  onBadgeClick?: (badge: BadgeDefinition) => void
  showLocked?: boolean
  filterCategory?: BadgeCategory | 'all'
  className?: string
}

export const BadgeGrid: React.FC<BadgeGridProps> = ({
  unlockedBadgeIds,
  unlockedAtMap = {},
  onBadgeClick,
  showLocked = true,
  filterCategory = 'all',
  className,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>(filterCategory)

  const categories: (BadgeCategory | 'all')[] = [
    'all',
    'milestone',
    'streak',
    'performance',
    'mode',
    'resilience',
    'shame',
    'secret',
    'social',
  ]

  const filteredBadges = useMemo(() => {
    let badges = selectedCategory === 'all' 
      ? BADGE_DEFINITIONS 
      : getBadgesByCategory(selectedCategory)
    
    if (!showLocked) {
      badges = badges.filter(b => unlockedBadgeIds.includes(b.id))
    }
    
    // Sort: unlocked first, then by rarity
    const rarityOrder = ['legendary', 'epic', 'rare', 'uncommon', 'common', 'shame']
    
    return badges.sort((a, b) => {
      const aUnlocked = unlockedBadgeIds.includes(a.id) ? 0 : 1
      const bUnlocked = unlockedBadgeIds.includes(b.id) ? 0 : 1
      
      if (aUnlocked !== bUnlocked) return aUnlocked - bUnlocked
      
      return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
    })
  }, [selectedCategory, showLocked, unlockedBadgeIds])

  const stats = useMemo(() => {
    const total = BADGE_DEFINITIONS.length
    const unlocked = unlockedBadgeIds.length
    const percentage = Math.round((unlocked / total) * 100)
    return { total, unlocked, percentage }
  }, [unlockedBadgeIds])

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Stats Bar */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎖️</span>
          <span className="text-lg font-bold text-gray-200">
            {stats.unlocked} / {stats.total}
          </span>
          <span className="text-sm text-gray-500">
            ({stats.percentage}%)
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="flex-1 mx-4 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
      </div>
      
      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap',
              'transition-all duration-200',
              selectedCategory === cat
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:bg-gray-700/50'
            )}
          >
            {cat === 'all' ? '🏆 All' : `${CATEGORY_ICONS[cat]} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
          </button>
        ))}
      </div>
      
      {/* Badge Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {filteredBadges.map(badge => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            unlocked={unlockedBadgeIds.includes(badge.id)}
            unlockedAt={unlockedAtMap[badge.id]}
            size="md"
            onClick={onBadgeClick ? () => onBadgeClick(badge) : undefined}
            showDescription={false}
          />
        ))}
      </div>
      
      {/* Empty State */}
      {filteredBadges.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <span className="text-4xl mb-2">🔒</span>
          <p>No badges in this category yet</p>
          <p className="text-sm">Complete sessions to unlock badges!</p>
        </div>
      )}
    </div>
  )
}
```
```

---

## Step 3.10: Create Badges Component Index

**Create file:** `src/components/badges/index.ts`

**Prompt for Cursor:**

```
Create the badges component index.

Create file: src/components/badges/index.ts

```typescript
// src/components/badges/index.ts

export { BadgeCard } from './BadgeCard'
export { BadgeUnlockToast, BadgeUnlockQueue } from './BadgeUnlockToast'
export { StreakDisplay, StreakBadge } from './StreakDisplay'
export { BadgeGrid } from './BadgeGrid'
```
```

---

## Part 3 Checkpoint

**Verify:**
- [ ] All TypeScript files compile
- [ ] Components render without errors
- [ ] Badge definitions match Rust (40+ badges)

---

# Part 4: Social Sharing & Virality

**Goal:** Create shareable badge cards and social integration
**Time:** 3-4 hours

---

## Step 4.1: Create ShareCard Component

**Create file:** `src/components/badges/ShareCard.tsx`

**Prompt for Cursor:**

```
Create the ShareCard component for generating shareable badge images.

Create file: src/components/badges/ShareCard.tsx

```typescript
// src/components/badges/ShareCard.tsx

import React, { useRef } from 'react'
import { BadgeDefinition, RARITY_COLORS } from '@/lib/badges/types'
import { cn } from '@/lib/utils'

interface ShareCardProps {
  badge: BadgeDefinition
  username?: string
  date?: Date
  stats?: {
    streak?: number
    totalSessions?: number
    totalHours?: number
  }
  className?: string
}

export const ShareCard: React.FC<ShareCardProps> = ({
  badge,
  username,
  date = new Date(),
  stats,
  className,
}) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const colors = RARITY_COLORS[badge.rarity]

  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  // Background gradient based on rarity
  const getBgGradient = () => {
    switch (badge.rarity) {
      case 'legendary':
        return 'bg-gradient-to-br from-amber-900/90 via-gray-900 to-amber-950/90'
      case 'epic':
        return 'bg-gradient-to-br from-purple-900/90 via-gray-900 to-purple-950/90'
      case 'rare':
        return 'bg-gradient-to-br from-blue-900/90 via-gray-900 to-blue-950/90'
      case 'shame':
        return 'bg-gradient-to-br from-red-900/90 via-gray-900 to-red-950/90'
      default:
        return 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950'
    }
  }

  return (
    <div
      ref={cardRef}
      className={cn(
        'w-[400px] h-[500px] p-6 rounded-2xl',
        getBgGradient(),
        'border-2',
        colors.border,
        'flex flex-col items-center justify-between',
        'shadow-2xl',
        className
      )}
      style={{
        boxShadow: badge.rarity === 'legendary' 
          ? '0 0 40px rgba(251, 191, 36, 0.3)' 
          : badge.rarity === 'epic'
          ? '0 0 30px rgba(168, 85, 247, 0.3)'
          : undefined
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <span className="text-sm font-bold text-gray-400 tracking-wider">
            DUSTOFF RESET
          </span>
        </div>
        <span className={cn('text-xs px-2 py-1 rounded-full', colors.bg, colors.text, 'uppercase')}>
          {badge.rarity}
        </span>
      </div>

      {/* Badge Icon */}
      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            'w-32 h-32 flex items-center justify-center rounded-full',
            colors.bg,
            'border-4',
            colors.border
          )}
          style={{
            boxShadow: badge.rarity === 'legendary' || badge.rarity === 'epic'
              ? `0 0 30px ${badge.rarity === 'legendary' ? 'rgba(251, 191, 36, 0.5)' : 'rgba(168, 85, 247, 0.5)'}`
              : undefined
          }}
        >
          <span className="text-6xl">{badge.icon}</span>
        </div>
        
        {/* Badge Name */}
        <h2 className={cn('text-3xl font-bold text-center', colors.text)}>
          {badge.name}
        </h2>
        
        {/* Flavor Text */}
        <p className="text-gray-400 text-center text-lg italic">
          "{badge.flavorText}"
        </p>
      </div>

      {/* Stats (if provided) */}
      {stats && (
        <div className="flex justify-center gap-6 w-full">
          {stats.streak && (
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-cyan-400">🔥 {stats.streak}</span>
              <span className="text-xs text-gray-500">Day Streak</span>
            </div>
          )}
          {stats.totalSessions && (
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-green-400">{stats.totalSessions}</span>
              <span className="text-xs text-gray-500">Sessions</span>
            </div>
          )}
          {stats.totalHours && (
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-purple-400">{stats.totalHours}h</span>
              <span className="text-xs text-gray-500">Focus Time</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between w-full pt-4 border-t border-gray-700/50">
        <div className="text-sm text-gray-500">
          {username && <span className="text-gray-400">@{username}</span>}
          {username && ' • '}
          {formattedDate}
        </div>
        <div className="text-xs text-gray-600">
          dustoffreset.com
        </div>
      </div>
    </div>
  )
}
```
```

---

## Step 4.2: Create useShareBadge Hook

**Create file:** `src/hooks/useShareBadge.ts`

**Prompt for Cursor:**

```
Create the useShareBadge hook for sharing badges to social media.

Create file: src/hooks/useShareBadge.ts

```typescript
// src/hooks/useShareBadge.ts

import { useCallback } from 'react'
import { BadgeDefinition } from '@/lib/badges/types'
import { tauriBridge } from '@/lib/tauri-bridge'

interface ShareOptions {
  badge: BadgeDefinition
  stats?: {
    streak?: number
    totalSessions?: number
  }
}

interface UseShareBadgeReturn {
  shareToTwitter: (options: ShareOptions) => void
  shareToClipboard: (options: ShareOptions) => Promise<boolean>
  recordShare: () => Promise<void>
}

export function useShareBadge(): UseShareBadgeReturn {
  
  // Build share text
  const buildShareText = useCallback((options: ShareOptions) => {
    const { badge, stats } = options
    
    let text = badge.shareText
    
    // Add stats if available
    if (stats?.streak && stats.streak > 1) {
      text += ` 🔥 ${stats.streak}-day streak!`
    }
    
    // Add hashtags
    const hashtags = badge.hashtags.join(' #')
    text += `\n\n#${hashtags}`
    
    // Add app link
    text += '\n\ndustoffreset.com'
    
    return text
  }, [])

  // Share to Twitter/X
  const shareToTwitter = useCallback((options: ShareOptions) => {
    const text = buildShareText(options)
    const encodedText = encodeURIComponent(text)
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`
    
    // Open in browser
    window.open(twitterUrl, '_blank', 'width=550,height=420')
  }, [buildShareText])

  // Copy to clipboard
  const shareToClipboard = useCallback(async (options: ShareOptions): Promise<boolean> => {
    const text = buildShareText(options)
    
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      return false
    }
  }, [buildShareText])

  // Record share action (for share badges)
  const recordShare = useCallback(async () => {
    try {
      // This increments the total_shares stat in the backend
      // which is used for the "Spread the Word" and "Influencer" badges
      await tauriBridge.getStat('total_shares') // Trigger increment via separate command
      console.log('[Share] Share recorded')
    } catch (err) {
      console.error('[Share] Failed to record share:', err)
    }
  }, [])

  return {
    shareToTwitter,
    shareToClipboard,
    recordShare,
  }
}
```
```

---

## Step 4.3: Create BadgeShareModal Component

**Create file:** `src/components/badges/BadgeShareModal.tsx`

**Prompt for Cursor:**

```
Create the BadgeShareModal component for the share interface.

Create file: src/components/badges/BadgeShareModal.tsx

```typescript
// src/components/badges/BadgeShareModal.tsx

import React, { useState } from 'react'
import { BadgeDefinition, RARITY_COLORS } from '@/lib/badges/types'
import { ShareCard } from './ShareCard'
import { useShareBadge } from '@/hooks/useShareBadge'
import { cn } from '@/lib/utils'

interface BadgeShareModalProps {
  badge: BadgeDefinition
  stats?: {
    streak?: number
    totalSessions?: number
    totalHours?: number
  }
  onClose: () => void
}

export const BadgeShareModal: React.FC<BadgeShareModalProps> = ({
  badge,
  stats,
  onClose,
}) => {
  const [copied, setCopied] = useState(false)
  const { shareToTwitter, shareToClipboard, recordShare } = useShareBadge()
  const colors = RARITY_COLORS[badge.rarity]

  const handleTwitterShare = async () => {
    shareToTwitter({ badge, stats })
    await recordShare()
  }

  const handleCopyText = async () => {
    const success = await shareToClipboard({ badge, stats })
    if (success) {
      setCopied(true)
      await recordShare()
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 p-6 max-w-lg">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 text-2xl"
        >
          ✕
        </button>
        
        {/* Title */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-100 mb-2">
            Share Your Achievement!
          </h2>
          <p className="text-gray-400">
            Let the world know about your focus journey
          </p>
        </div>
        
        {/* Preview Card */}
        <div className="transform scale-75 origin-center">
          <ShareCard badge={badge} stats={stats} />
        </div>
        
        {/* Share Buttons */}
        <div className="flex gap-4 w-full max-w-sm">
          {/* Twitter/X Button */}
          <button
            onClick={handleTwitterShare}
            className={cn(
              'flex-1 flex items-center justify-center gap-2',
              'px-6 py-3 rounded-xl font-medium',
              'bg-[#1DA1F2]/20 text-[#1DA1F2] border border-[#1DA1F2]/40',
              'hover:bg-[#1DA1F2]/30 transition-colors'
            )}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on X
          </button>
          
          {/* Copy Button */}
          <button
            onClick={handleCopyText}
            className={cn(
              'flex-1 flex items-center justify-center gap-2',
              'px-6 py-3 rounded-xl font-medium',
              'bg-gray-700/50 text-gray-300 border border-gray-600/50',
              'hover:bg-gray-600/50 transition-colors'
            )}
          >
            {copied ? (
              <>
                <span>✓</span>
                Copied!
              </>
            ) : (
              <>
                <span>📋</span>
                Copy Text
              </>
            )}
          </button>
        </div>
        
        {/* Share Preview Text */}
        <div className="w-full max-w-sm p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
          <p className="text-sm text-gray-400 mb-2">Preview:</p>
          <p className="text-gray-300 text-sm whitespace-pre-wrap">
            {badge.shareText}
            {stats?.streak && stats.streak > 1 && ` 🔥 ${stats.streak}-day streak!`}
            {'\n\n'}
            #{badge.hashtags.join(' #')}
            {'\n\n'}
            dustoffreset.com
          </p>
        </div>
        
        {/* Dismiss */}
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 text-sm"
        >
          Maybe Later
        </button>
      </div>
    </div>
  )
}
```
```

---

## Step 4.4: Add Share Recording Command (Rust)

**Update file:** `src-tauri/src/commands/badges.rs`

**Prompt for Cursor:**

```
Add a command to record share actions.

Add to src-tauri/src/commands/badges.rs:

```rust
use crate::badges::persistence::increment_lifetime_stat;

/// Record a share action (for share-related badges)
#[command]
pub fn record_badge_share(state: State<AppState>) -> Result<i32, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    increment_lifetime_stat(&conn, "total_shares", 1)
}
```

Add to invoke_handler in main.rs:
```rust
record_badge_share,
```
```

---

## Step 4.5: Update Tauri Bridge with Share Command

**Update file:** `src/lib/tauri-bridge.ts`

**Prompt for Cursor:**

```
Add the share recording command to the Tauri bridge.

Add to tauriBridge object:

```typescript
recordBadgeShare: async (): Promise<number> => {
  return invoke('record_badge_share')
},
```
```

---

## Step 4.6: Update useShareBadge Hook with Record

**Update file:** `src/hooks/useShareBadge.ts`

**Prompt for Cursor:**

```
Update useShareBadge to properly record shares.

Update the recordShare function in src/hooks/useShareBadge.ts:

```typescript
// Record share action (for share badges)
const recordShare = useCallback(async () => {
  try {
    const newCount = await tauriBridge.recordBadgeShare()
    console.log('[Share] Share recorded, total:', newCount)
  } catch (err) {
    console.error('[Share] Failed to record share:', err)
  }
}, [])
```
```

---

## Part 4 Checkpoint

**Verify:**
- [ ] ShareCard renders correctly
- [ ] Twitter share opens intent
- [ ] Copy to clipboard works
- [ ] Share count increments

---

# Part 5: Integration & Polish

**Goal:** Wire badges to post-session flow and add final polish
**Time:** 2-3 hours

---

## Step 5.1: Create Session Stats Collector

**Create file:** `src/lib/badges/session-stats-collector.ts`

**Prompt for Cursor:**

```
Create a utility to collect session stats for badge evaluation.

Create file: src/lib/badges/session-stats-collector.ts

```typescript
// src/lib/badges/session-stats-collector.ts

import { SessionStatsForBadges } from './types'

interface SessionData {
  sessionId: string
  mode: string
  durationMinutes: number
  finalBandwidth: number
  completed: boolean
  quitEarly: boolean
}

interface TelemetryData {
  distractionCount: number
  delayGatesShown: number
  delayGatesReturned: number
  blocksShown: number
  extensionsSurvived: number
  totalPenalties: number
  totalBonuses: number
}

export function collectSessionStats(
  session: SessionData,
  telemetry: TelemetryData
): SessionStatsForBadges {
  return {
    sessionId: session.sessionId,
    mode: session.mode,
    durationMinutes: session.durationMinutes,
    finalBandwidth: Math.round(session.finalBandwidth),
    distractionCount: telemetry.distractionCount,
    delayGatesShown: telemetry.delayGatesShown,
    delayGatesReturned: telemetry.delayGatesReturned,
    blocksShown: telemetry.blocksShown,
    extensionsSurvived: telemetry.extensionsSurvived,
    totalPenalties: telemetry.totalPenalties,
    totalBonuses: telemetry.totalBonuses,
    completed: session.completed,
    quitEarly: session.quitEarly,
  }
}
```
```

---

## Step 5.2: Integrate Badges with Post-Session Flow

**Update file:** `src/App.tsx` (or wherever post-session is handled)

**Prompt for Cursor:**

```
Integrate badge evaluation into the post-session flow.

Add badge evaluation when a session completes. Find where session completion is handled and add:

```typescript
import { useBadges } from '@/hooks/useBadges'
import { BadgeUnlockQueue } from '@/components/badges/BadgeUnlockToast'
import { BadgeShareModal } from '@/components/badges/BadgeShareModal'
import { collectSessionStats } from '@/lib/badges/session-stats-collector'
import { getBadgeById } from '@/lib/badges/badge-definitions'
import { BadgeDefinition } from '@/lib/badges/types'

// In your component:
const { evaluateSession, dailyStreak } = useBadges()
const [newlyUnlockedBadges, setNewlyUnlockedBadges] = useState<BadgeDefinition[]>([])
const [shareModalBadge, setShareModalBadge] = useState<BadgeDefinition | null>(null)

// When session completes (in your session completion handler):
const handleSessionComplete = async () => {
  // ... existing completion logic ...
  
  // Collect stats for badge evaluation
  const stats = collectSessionStats(
    {
      sessionId: currentSession.id,
      mode: currentSession.mode,
      durationMinutes: currentSession.duration,
      finalBandwidth: bandwidth,
      completed: true,
      quitEarly: false,
    },
    {
      distractionCount: telemetryStats.offenseCount,
      delayGatesShown: telemetryStats.delayGatesShown || 0,
      delayGatesReturned: telemetryStats.delayGatesReturned || 0,
      blocksShown: telemetryStats.blocksShown || 0,
      extensionsSurvived: telemetryStats.extensionsSurvived || 0,
      totalPenalties: Math.abs(telemetryStats.totalPenalties || 0),
      totalBonuses: telemetryStats.totalBonuses || 0,
    }
  )
  
  // Evaluate badges
  try {
    const result = await evaluateSession(stats)
    
    if (result.unlocked.length > 0) {
      // Convert to definitions for display
      const unlockedDefs = result.unlocked
        .map(ub => getBadgeById(ub.badgeId))
        .filter((b): b is BadgeDefinition => b !== null)
      
      setNewlyUnlockedBadges(unlockedDefs)
      console.log('[Badges] Unlocked:', unlockedDefs.map(b => b.name))
    }
  } catch (err) {
    console.error('[Badges] Evaluation failed:', err)
  }
}

// In your JSX, add the unlock queue and share modal:
{newlyUnlockedBadges.length > 0 && (
  <BadgeUnlockQueue
    badges={newlyUnlockedBadges}
    onShare={(badge) => setShareModalBadge(badge)}
    onAllClosed={() => setNewlyUnlockedBadges([])}
  />
)}

{shareModalBadge && (
  <BadgeShareModal
    badge={shareModalBadge}
    stats={{
      streak: dailyStreak?.currentCount,
      totalSessions: undefined, // Could fetch from lifetime stats
    }}
    onClose={() => setShareModalBadge(null)}
  />
)}
```

This integrates badge evaluation into your existing session completion flow.
```

---

## Step 5.3: Add Streak Display to HUD

**Update your HUD component:**

**Prompt for Cursor:**

```
Add streak display to the main HUD.

In your HUD component (likely the session/timer display), add the streak badge:

```typescript
import { useBadges } from '@/hooks/useBadges'
import { StreakBadge } from '@/components/badges/StreakDisplay'

// In component:
const { dailyStreak } = useBadges()
const [isStreakAtRisk, setIsStreakAtRisk] = useState(false)

useEffect(() => {
  const checkRisk = async () => {
    const atRisk = await tauriBridge.checkStreakAtRisk()
    setIsStreakAtRisk(atRisk)
  }
  checkRisk()
}, [])

// In JSX, add near the timer:
{dailyStreak && dailyStreak.currentCount > 0 && (
  <StreakBadge
    count={dailyStreak.currentCount}
    isAtRisk={isStreakAtRisk}
  />
)}
```
```

---

## Step 5.4: Add CSS Animations

**Update file:** `src/index.css`

**Prompt for Cursor:**

```
Add animations for badge unlocks and streaks.

Add to src/index.css:

```css
/* Badge animations */
@keyframes bounce-slow {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes pulse-slow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes glow-legendary {
  0%, 100% {
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.4);
  }
  50% {
    box-shadow: 0 0 40px rgba(251, 191, 36, 0.7);
  }
}

@keyframes glow-epic {
  0%, 100% {
    box-shadow: 0 0 15px rgba(168, 85, 247, 0.4);
  }
  50% {
    box-shadow: 0 0 30px rgba(168, 85, 247, 0.7);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.animate-bounce-slow {
  animation: bounce-slow 2s ease-in-out infinite;
}

.animate-pulse-slow {
  animation: pulse-slow 3s ease-in-out infinite;
}

.animate-glow-legendary {
  animation: glow-legendary 2s ease-in-out infinite;
}

.animate-glow-epic {
  animation: glow-epic 2s ease-in-out infinite;
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}

/* Streak at risk pulse */
.streak-at-risk {
  animation: pulse 1s ease-in-out infinite;
}
```
```

---

## Step 5.5: Initialize Badges on App Start

**Update file:** `src/App.tsx` (or main initialization)

**Prompt for Cursor:**

```
Initialize the badge system when the app starts.

Add to your app initialization (usually in a useEffect):

```typescript
import { tauriBridge } from '@/lib/tauri-bridge'

// In App.tsx or your root component
useEffect(() => {
  const initApp = async () => {
    try {
      // Initialize badge tables
      await tauriBridge.initBadges()
      console.log('[App] Badge system initialized')
      
      // Check if streak is at risk (for notifications)
      const atRisk = await tauriBridge.checkStreakAtRisk()
      if (atRisk) {
        console.log('[App] Daily streak is at risk!')
        // Could show a notification or banner here
      }
    } catch (err) {
      console.error('[App] Failed to initialize badges:', err)
    }
  }
  
  initApp()
}, [])
```
```

---

## Phase 8 Complete! 🎉

You now have a complete badge, streak, and social sharing system designed for virality.

### Summary of What You Built:

**Backend (Rust):**
- `badges/types.rs` - Type definitions
- `badges/definitions.rs` - 40+ badge definitions
- `badges/persistence.rs` - SQLite CRUD
- `badges/evaluator.rs` - Badge unlock logic
- `badges/streaks.rs` - Streak calculations
- `commands/badges.rs` - Tauri commands

**Frontend (TypeScript):**
- `lib/badges/types.ts` - TypeScript types
- `lib/badges/badge-definitions.ts` - Badge definitions
- `hooks/useBadges.ts` - Badge state management
- `hooks/useShareBadge.ts` - Social sharing

**UI Components:**
- `BadgeCard.tsx` - Individual badge display
- `BadgeGrid.tsx` - Badge collection view
- `BadgeUnlockToast.tsx` - Unlock notifications
- `StreakDisplay.tsx` - Streak counters
- `ShareCard.tsx` - Shareable badge cards
- `BadgeShareModal.tsx` - Share interface

### Viral Features:
- ✅ 40+ badges across 8 categories
- ✅ Daily/weekly/mode-specific streaks
- ✅ Shame badges for relatable failures
- ✅ Twitter share integration
- ✅ Copy-to-clipboard
- ✅ Streak-at-risk notifications
- ✅ Secret badges for discovery
- ✅ Progressive badge unlocks

---

**Next Steps:**
1. Test badge unlocks end-to-end
2. Add a Badges panel to view collection
3. Consider adding sound effects (Phase 7)
4. Add streak recovery notifications
5. Consider leaderboards (future)

Let me know when you're ready for the next phase or if you need any adjustments to Phase 8!