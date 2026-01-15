// src-tauri/src/badges/persistence.rs

use rusqlite::{params, Connection};
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

/// Get badge count
pub fn get_badge_count(conn: &Connection) -> Result<i32, String> {
    let count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM user_badges",
        [],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;
    
    Ok(count)
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

/// Get all badge progress records
pub fn get_all_progress(conn: &Connection) -> Result<Vec<BadgeProgress>, String> {
    let mut stmt = conn.prepare(
        "SELECT badge_id, current_value, target_value, updated_at FROM badge_progress"
    ).map_err(|e| e.to_string())?;
    
    let progress = stmt.query_map([], |row| {
        Ok(BadgeProgress {
            badge_id: row.get(0)?,
            current_value: row.get(1)?,
            target_value: row.get(2)?,
            updated_at: row.get(3)?,
        })
    }).map_err(|e| e.to_string())?;
    
    progress.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
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
