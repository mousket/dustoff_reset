use rusqlite::{params, Connection};
use crate::presets::types::*;

/// Categorize an app based on its name and bundle ID
pub fn categorize_app(app_name: &str, bundle_id: Option<&str>) -> AppCategory {
    let name_lower = app_name.to_lowercase();
    let bundle_lower = bundle_id.map(|b| b.to_lowercase()).unwrap_or_default();
    
    // Browsers
    if name_lower.contains("safari") || name_lower.contains("chrome") 
        || name_lower.contains("firefox") || name_lower.contains("edge")
        || name_lower.contains("arc") || name_lower.contains("brave")
        || bundle_lower.contains("browser") {
        return AppCategory::Browser;
    }
    
    // Code Editors / IDEs
    if name_lower.contains("code") || name_lower.contains("cursor")
        || name_lower.contains("sublime") || name_lower.contains("atom")
        || name_lower.contains("xcode") || name_lower.contains("android studio")
        || name_lower.contains("intellij") || name_lower.contains("webstorm")
        || name_lower.contains("pycharm") || name_lower.contains("vim")
        || name_lower.contains("emacs") || name_lower.contains("neovim") {
        return AppCategory::Productivity;
    }
    
    // Terminals
    if name_lower.contains("terminal") || name_lower.contains("iterm")
        || name_lower.contains("warp") || name_lower.contains("hyper")
        || name_lower.contains("kitty") || name_lower.contains("alacritty") {
        return AppCategory::Productivity;
    }
    
    // Office / Productivity
    if name_lower.contains("word") || name_lower.contains("excel")
        || name_lower.contains("powerpoint") || name_lower.contains("pages")
        || name_lower.contains("numbers") || name_lower.contains("keynote")
        || name_lower.contains("notion") || name_lower.contains("obsidian")
        || name_lower.contains("evernote") || name_lower.contains("bear")
        || name_lower.contains("notes") || name_lower.contains("reminders")
        || name_lower.contains("calendar") || name_lower.contains("figma")
        || name_lower.contains("sketch") || name_lower.contains("adobe") {
        return AppCategory::Productivity;
    }
    
    // Communication
    if name_lower.contains("slack") || name_lower.contains("teams")
        || name_lower.contains("zoom") || name_lower.contains("discord")
        || name_lower.contains("mail") || name_lower.contains("outlook")
        || name_lower.contains("messages") || name_lower.contains("webex") {
        return AppCategory::Communication;
    }
    
    // Social Media
    if name_lower.contains("twitter") || name_lower.contains("facebook")
        || name_lower.contains("instagram") || name_lower.contains("tiktok")
        || name_lower.contains("snapchat") || name_lower.contains("whatsapp")
        || name_lower.contains("telegram") || name_lower.contains("signal") {
        return AppCategory::Social;
    }
    
    // Games
    if name_lower.contains("steam") || name_lower.contains("epic games")
        || name_lower.contains("minecraft") || name_lower.contains("roblox")
        || bundle_lower.contains("game") {
        return AppCategory::Game;
    }
    
    // Entertainment
    if name_lower.contains("netflix") || name_lower.contains("spotify")
        || name_lower.contains("music") || name_lower.contains("tv")
        || name_lower.contains("photos") || name_lower.contains("youtube") {
        return AppCategory::Entertainment;
    }
    
    // Utilities
    if name_lower.contains("finder") || name_lower.contains("preview")
        || name_lower.contains("calculator") || name_lower.contains("system")
        || name_lower.contains("settings") || name_lower.contains("preferences") {
        return AppCategory::Utility;
    }
    
    AppCategory::Unknown
}

/// Cache a newly discovered app
pub fn cache_app(
    conn: &Connection,
    app_name: &str,
    bundle_id: Option<&str>,
    exe_path: Option<&str>,
) -> Result<CachedApp, String> {
    let now = now_ms();
    let id = uuid::Uuid::new_v4().to_string();
    let category = categorize_app(app_name, bundle_id);
    
    let is_browser = matches!(category, AppCategory::Browser);
    let is_default_blocked = category.is_default_blocked();
    let is_default_whitelisted = matches!(
        category, 
        AppCategory::Productivity | AppCategory::Communication | AppCategory::Utility
    );
    
    // Use INSERT OR REPLACE to update if app already exists
    conn.execute(
        "INSERT OR REPLACE INTO cached_apps (
            id, app_name, bundle_id, exe_path, category,
            is_browser, is_default_blocked, is_default_whitelisted,
            first_seen_at, last_seen_at
        ) VALUES (
            COALESCE((SELECT id FROM cached_apps WHERE app_name = ?2), ?1),
            ?2, ?3, ?4, ?5, ?6, ?7, ?8,
            COALESCE((SELECT first_seen_at FROM cached_apps WHERE app_name = ?2), ?9),
            ?10
        )",
        params![
            id,
            app_name,
            bundle_id,
            exe_path,
            category.as_str(),
            is_browser,
            is_default_blocked,
            is_default_whitelisted,
            now,
            now,
        ],
    ).map_err(|e| format!("Failed to cache app: {}", e))?;
    
    Ok(CachedApp {
        id,
        app_name: app_name.to_string(),
        bundle_id: bundle_id.map(String::from),
        exe_path: exe_path.map(String::from),
        category,
        is_browser,
        is_default_blocked,
        is_default_whitelisted,
        user_classification: None,
        first_seen_at: now,
        last_seen_at: now,
    })
}

/// Get all cached apps
pub fn get_cached_apps(conn: &Connection) -> Result<Vec<CachedApp>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, app_name, bundle_id, exe_path, category,
                is_browser, is_default_blocked, is_default_whitelisted,
                user_classification, first_seen_at, last_seen_at
         FROM cached_apps
         ORDER BY app_name"
    ).map_err(|e| e.to_string())?;
    
    let apps = stmt.query_map([], |row| {
        let category_str: String = row.get(4)?;
        Ok(CachedApp {
            id: row.get(0)?,
            app_name: row.get(1)?,
            bundle_id: row.get(2)?,
            exe_path: row.get(3)?,
            category: AppCategory::from_str(&category_str),
            is_browser: row.get(5)?,
            is_default_blocked: row.get(6)?,
            is_default_whitelisted: row.get(7)?,
            user_classification: row.get(8)?,
            first_seen_at: row.get(9)?,
            last_seen_at: row.get(10)?,
        })
    }).map_err(|e| e.to_string())?;
    
    apps.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}

/// Update user classification for an app
pub fn set_app_classification(
    conn: &Connection,
    app_name: &str,
    classification: Option<&str>,
) -> Result<(), String> {
    conn.execute(
        "UPDATE cached_apps SET user_classification = ?1 WHERE app_name = ?2",
        params![classification, app_name],
    ).map_err(|e| format!("Failed to update app classification: {}", e))?;
    
    Ok(())
}

/// Check if app scan is needed
pub fn needs_app_scan(conn: &Connection) -> Result<bool, String> {
    let result = conn.query_row(
        "SELECT value FROM app_scan_metadata WHERE key = 'last_full_scan'",
        [],
        |row| row.get::<_, String>(0),
    );
    
    match result {
        Ok(timestamp_str) => {
            let last_scan: u64 = timestamp_str.parse().unwrap_or(0);
            let now = now_ms();
            let one_day_ms = 24 * 60 * 60 * 1000;
            Ok(now - last_scan > one_day_ms)
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(true),
        Err(e) => Err(e.to_string()),
    }
}

/// Record that an app scan was completed
pub fn record_app_scan(conn: &Connection, app_count: i32) -> Result<(), String> {
    let now = now_ms();
    
    conn.execute(
        "INSERT OR REPLACE INTO app_scan_metadata (key, value, updated_at) 
         VALUES ('last_full_scan', ?1, ?2)",
        params![now.to_string(), now],
    ).map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT OR REPLACE INTO app_scan_metadata (key, value, updated_at) 
         VALUES ('app_count', ?1, ?2)",
        params![app_count.to_string(), now],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}
