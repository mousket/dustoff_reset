// src-tauri/src/badges/evaluator.rs
// Badge evaluation logic - evaluates session stats against badge criteria

use rusqlite::Connection;

use crate::badges::types::{
    SessionStatsForBadges, 
    BadgeEvaluationResult, 
    UserBadge, 
    BadgeProgress,
    Streak,
};
use crate::badges::streaks::{update_daily_streak, update_mode_streak, update_weekly_streak};
use crate::badges::persistence::{
    increment_lifetime_stat,
    set_lifetime_stat_if_greater,
};

/// Evaluate a completed session for badge unlocks
/// This is the main entry point called after each session
pub fn evaluate_session_for_badges(
    conn: &Connection,
    stats: &SessionStatsForBadges,
) -> Result<BadgeEvaluationResult, String> {
    let mut result = BadgeEvaluationResult {
        unlocked: Vec::new(),
        progress_updates: Vec::new(),
        streak_updates: Vec::new(),
    };
    
    // Only evaluate completed sessions
    if !stats.completed {
        return Ok(result);
    }
    
    // Update lifetime stats
    update_lifetime_stats(conn, stats)?;
    
    // Update streaks
    let daily_streak = update_daily_streak(conn)?;
    result.streak_updates.push(daily_streak);
    
    let mode_streak = update_mode_streak(conn, &stats.mode)?;
    result.streak_updates.push(mode_streak);
    
    let weekly_streak = update_weekly_streak(conn)?;
    result.streak_updates.push(weekly_streak);
    
    // TODO: Evaluate badge criteria against stats and definitions
    // This will be fully implemented when definitions.rs is complete
    
    Ok(result)
}

/// Update lifetime stats based on session
fn update_lifetime_stats(conn: &Connection, stats: &SessionStatsForBadges) -> Result<(), String> {
    // Increment total sessions
    increment_lifetime_stat(conn, "total_sessions", 1)?;
    
    // Increment mode-specific sessions
    let mode_key = format!("{}_sessions", stats.mode.to_lowercase());
    increment_lifetime_stat(conn, &mode_key, 1)?;
    
    // Increment total focus time
    increment_lifetime_stat(conn, "total_focus_minutes", stats.duration_minutes)?;
    
    // Track highest bandwidth
    set_lifetime_stat_if_greater(conn, "highest_bandwidth", stats.final_bandwidth)?;
    
    // Track lowest bandwidth (shame stat)
    // We use negative values so MAX() works for "lowest"
    let inverted = -stats.final_bandwidth;
    set_lifetime_stat_if_greater(conn, "lowest_bandwidth_inv", inverted)?;
    
    // Track perfect sessions (zero distractions)
    if stats.distraction_count == 0 {
        increment_lifetime_stat(conn, "perfect_sessions", 1)?;
    }
    
    // Track sessions with returns from delay gates
    if stats.delay_gates_shown > 0 && stats.delay_gates_returned == stats.delay_gates_shown {
        increment_lifetime_stat(conn, "perfect_return_sessions", 1)?;
    }
    
    // Track Legend mode extensions survived
    if stats.extensions_survived > 0 {
        increment_lifetime_stat(conn, "total_extensions_survived", stats.extensions_survived)?;
    }
    
    // Track quit early (shame)
    if stats.quit_early {
        increment_lifetime_stat(conn, "quit_early_count", 1)?;
    }
    
    Ok(())
}
