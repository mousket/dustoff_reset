// src-tauri/src/badges/evaluator.rs

use rusqlite::Connection;
use chrono::Local;

use crate::badges::types::{
    BadgeDefinition, BadgeCriteria, UserBadge, BadgeProgress, 
    BadgeEvaluationResult, SessionStatsForBadges, Streak, now_ms,
};
use crate::badges::definitions::{get_all_badge_definitions, get_badge_definition};
use crate::badges::persistence::{
    is_badge_unlocked, save_user_badge, 
    get_lifetime_stat, increment_lifetime_stat, set_lifetime_stat_if_greater,
    get_or_create_progress, get_all_user_badges, get_or_create_streak,
};
use crate::badges::streaks::{
    update_daily_streak, update_mode_streak, update_weekly_streak,
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
    
    // Track perfect sessions (zero distractions)
    if stats.distraction_count == 0 {
        increment_lifetime_stat(conn, "perfect_sessions", 1)?;
    }
    
    // Track sessions with perfect returns
    if stats.delay_gates_shown > 0 && stats.delay_gates_returned == stats.delay_gates_shown {
        increment_lifetime_stat(conn, "perfect_return_sessions", 1)?;
    }
    
    // Track quit early (shame stat)
    if stats.quit_early {
        increment_lifetime_stat(conn, "quit_early_count", 1)?;
    }
    
    Ok(())
}

/// Check if a badge's criteria is met
fn check_badge_criteria(
    conn: &Connection,
    badge: &BadgeDefinition,
    stats: &SessionStatsForBadges,
    daily_streak: &Streak,
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
            let weekly = get_or_create_streak(conn, "weekly")?;
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
    // Badge collector badge
    let badge_id = "badge_collector";
    let current_count = get_all_user_badges(conn)?.len() as i32 + result.unlocked.len() as i32;
    
    if current_count >= 20 && !is_badge_unlocked(conn, badge_id)? {
        if get_badge_definition(badge_id).is_some() {
            let user_badge = UserBadge {
                id: String::new(),
                badge_id: badge_id.to_string(),
                unlocked_at: now_ms(),
                session_id: None,
                metadata: None,
            };
            save_user_badge(conn, &user_badge)?;
            result.unlocked.push(user_badge);
            println!("[Badges] Unlocked meta badge: badge_collector");
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
    
    // Comeback Kid: Session after breaking a streak
    // This is tracked separately when streak breaks are detected
    
    // Phoenix: Rebuild 7+ day streak after losing one
    // This is tracked by comparing previous longest_count
    
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

/// Manually trigger badge evaluation (for testing or re-evaluation)
pub fn reevaluate_all_badges(
    conn: &Connection,
    stats: &SessionStatsForBadges,
) -> Result<BadgeEvaluationResult, String> {
    evaluate_session_for_badges(conn, stats)
}
