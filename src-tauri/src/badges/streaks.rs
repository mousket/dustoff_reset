// src-tauri/src/badges/streaks.rs

use rusqlite::Connection;
use chrono::{Local, NaiveDate, Datelike};

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
