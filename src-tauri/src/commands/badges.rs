// src-tauri/src/commands/badges.rs

use std::sync::PoisonError;
use tauri::{command, State};

use crate::AppState;
use crate::badges::types::{UserBadge, Streak, SessionStatsForBadges, BadgeEvaluationResult};
use crate::badges::persistence::{
    init_badge_tables,
    get_all_user_badges,
    get_recent_badges,
    is_badge_unlocked,
    get_all_streaks,
    get_or_create_streak,
    get_lifetime_stat,
    get_badge_count as db_get_badge_count,
};
use crate::badges::streaks::{
    is_streak_at_risk,
    STREAK_DAILY,
};

/// Helper to convert PoisonError to String
fn lock_err<T>(_: PoisonError<T>) -> String {
    "Failed to acquire database lock".to_string()
}

/// Initialize badge tables (call on app startup)
#[command]
pub fn init_badges(state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(lock_err)?;
    init_badge_tables(&conn)
}

/// Get all unlocked badges
#[command]
pub fn get_badges(state: State<AppState>) -> Result<Vec<UserBadge>, String> {
    let conn = state.db.lock().map_err(lock_err)?;
    get_all_user_badges(&conn)
}

/// Get recently unlocked badges
#[command]
pub fn get_recent_unlocked_badges(state: State<AppState>, limit: i32) -> Result<Vec<UserBadge>, String> {
    let conn = state.db.lock().map_err(lock_err)?;
    get_recent_badges(&conn, limit)
}

/// Check if a specific badge is unlocked
#[command]
pub fn check_badge_unlocked(state: State<AppState>, badge_id: String) -> Result<bool, String> {
    let conn = state.db.lock().map_err(lock_err)?;
    is_badge_unlocked(&conn, &badge_id)
}

/// Get all streaks
#[command]
pub fn get_streaks(state: State<AppState>) -> Result<Vec<Streak>, String> {
    let conn = state.db.lock().map_err(lock_err)?;
    get_all_streaks(&conn)
}

/// Get a specific streak
#[command]
pub fn get_streak(state: State<AppState>, streak_type: String) -> Result<Streak, String> {
    let conn = state.db.lock().map_err(lock_err)?;
    get_or_create_streak(&conn, &streak_type)
}

/// Check if daily streak is at risk
#[command]
pub fn check_streak_at_risk(state: State<AppState>) -> Result<bool, String> {
    let conn = state.db.lock().map_err(lock_err)?;
    let streak = get_or_create_streak(&conn, STREAK_DAILY)?;
    Ok(is_streak_at_risk(&streak))
}

/// Get a lifetime stat
#[command]
pub fn get_stat(state: State<AppState>, key: String) -> Result<i32, String> {
    let conn = state.db.lock().map_err(lock_err)?;
    get_lifetime_stat(&conn, &key)
}

/// Evaluate badges after session completion
/// This is the main entry point called when a session ends
#[command]
pub fn evaluate_badges_for_session(
    state: State<AppState>,
    stats: SessionStatsForBadges,
) -> Result<BadgeEvaluationResult, String> {
    let conn = state.db.lock().map_err(lock_err)?;
    crate::badges::evaluator::evaluate_session_for_badges(&conn, &stats)
}

/// Get badge count (for "collect N badges" badges)
#[command]
pub fn get_badge_count(state: State<AppState>) -> Result<i32, String> {
    let conn = state.db.lock().map_err(lock_err)?;
    db_get_badge_count(&conn)
}
