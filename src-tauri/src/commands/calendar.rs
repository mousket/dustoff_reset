// src-tauri/src/commands/calendar.rs
// Read-only calendar awareness via AppleScript (same osascript approach as
// the browser telemetry). Local-only: events are read, cached in memory,
// and never persisted or sent anywhere.
//
// v1 limitations (acceptable, documented):
// - macOS only (other platforms return an empty list)
// - Calendar.app AppleScript does not expand recurring-event instances
//   beyond what Calendar has materialized
// - First call triggers the standard macOS Automation permission prompt
//   ("DustOff Reset wants to control Calendar")

use serde::Serialize;
use std::sync::Mutex;
use std::time::{Duration, Instant};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CalendarEvent {
    pub title: String,
    pub start_iso: String,
    pub end_iso: String,
    pub calendar: String,
}

// 5-minute cache: calendar queries via AppleScript are slow (seconds),
// and the UI polls. Cache always holds the next-24h window.
static CACHE: Mutex<Option<(Instant, Vec<CalendarEvent>)>> = Mutex::new(None);
const CACHE_TTL: Duration = Duration::from_secs(300);
const FETCH_WINDOW_HOURS: u32 = 24;

/// Get upcoming calendar events within `hours_ahead` (default 12, max 24).
/// Returns events sorted by start time. Empty list on non-macOS platforms.
#[tauri::command]
pub async fn get_upcoming_events(hours_ahead: Option<u32>) -> Result<Vec<CalendarEvent>, String> {
    let hours = hours_ahead.unwrap_or(12).min(FETCH_WINDOW_HOURS) as i64;

    // Serve from cache when fresh
    let cached: Option<Vec<CalendarEvent>> = {
        let cache = CACHE.lock().map_err(|e| e.to_string())?;
        cache
            .as_ref()
            .filter(|(at, _)| at.elapsed() < CACHE_TTL)
            .map(|(_, events)| events.clone())
    };

    let events = match cached {
        Some(events) => events,
        None => {
            let fetched = tauri::async_runtime::spawn_blocking(fetch_events_from_calendar_app)
                .await
                .map_err(|e| e.to_string())??;
            let mut cache = CACHE.lock().map_err(|e| e.to_string())?;
            *cache = Some((Instant::now(), fetched.clone()));
            fetched
        }
    };

    // Filter the cached 24h window down to the requested horizon
    let cutoff = chrono::Local::now() + chrono::Duration::hours(hours);
    Ok(events
        .into_iter()
        .filter(|e| match parse_event_time(&e.start_iso) {
            Some(start) => start <= cutoff,
            None => true, // unparseable start: keep, let the frontend decide
        })
        .collect())
}

/// Parse an AppleScript «class isot» timestamp. It usually carries no
/// timezone suffix (e.g. "2026-07-12T14:00:00"), so treat it as local time;
/// fall back to RFC 3339 if a zone is present.
fn parse_event_time(iso: &str) -> Option<chrono::DateTime<chrono::Local>> {
    if let Ok(naive) = chrono::NaiveDateTime::parse_from_str(iso, "%Y-%m-%dT%H:%M:%S") {
        return naive.and_local_timezone(chrono::Local).earliest();
    }
    chrono::DateTime::parse_from_rfc3339(iso)
        .ok()
        .map(|dt| dt.with_timezone(&chrono::Local))
}

#[cfg(target_os = "macos")]
fn fetch_events_from_calendar_app() -> Result<Vec<CalendarEvent>, String> {
    use std::process::Command;

    let script = format!(
        r#"set nowDate to current date
set endDate to nowDate + ({} * hours)
set out to ""
tell application "Calendar"
    repeat with c in calendars
        try
            set evts to (every event of c whose start date is greater than or equal to nowDate and start date is less than or equal to endDate)
            repeat with e in evts
                set out to out & (summary of e) & "||" & ((start date of e) as «class isot» as string) & "||" & ((end date of e) as «class isot» as string) & "||" & (name of c) & linefeed
            end repeat
        end try
    end repeat
end tell
return out"#,
        FETCH_WINDOW_HOURS
    );

    let output = Command::new("osascript")
        .arg("-e")
        .arg(&script)
        .output()
        .map_err(|e| format!("Failed to execute osascript: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Calendar query failed: {}", stderr.trim()));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut events: Vec<CalendarEvent> = stdout
        .lines()
        .filter_map(|line| {
            let parts: Vec<&str> = line.split("||").collect();
            if parts.len() == 4 && !parts[1].is_empty() {
                Some(CalendarEvent {
                    title: parts[0].trim().to_string(),
                    start_iso: parts[1].trim().to_string(),
                    end_iso: parts[2].trim().to_string(),
                    calendar: parts[3].trim().to_string(),
                })
            } else {
                None
            }
        })
        .collect();

    events.sort_by(|a, b| a.start_iso.cmp(&b.start_iso));
    Ok(events)
}

#[cfg(not(target_os = "macos"))]
fn fetch_events_from_calendar_app() -> Result<Vec<CalendarEvent>, String> {
    Ok(Vec::new())
}
