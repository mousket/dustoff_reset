use rusqlite::{params, Connection};
use crate::presets::types::*;

/// Insert default presets if they don't exist
pub fn insert_default_presets(conn: &Connection) -> Result<(), String> {
    let defaults = get_default_preset_definitions();
    
    for preset in defaults {
        let exists: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM presets WHERE id = ?1)",
            params![preset.id],
            |row| row.get(0),
        ).map_err(|e| e.to_string())?;
        
        if !exists {
            let apps_json = serde_json::to_string(&preset.whitelisted_apps)
                .map_err(|e| e.to_string())?;
            let domains_json = serde_json::to_string(&preset.whitelisted_domains)
                .map_err(|e| e.to_string())?;
            
            conn.execute(
                "INSERT INTO presets (
                    id, name, icon, mode, duration_minutes,
                    whitelisted_apps, whitelisted_domains,
                    use_default_blocklist, include_mental_prep,
                    is_default, is_last_session,
                    created_at, updated_at, usage_count
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, TRUE, FALSE, ?10, ?11, 0)",
                params![
                    preset.id,
                    preset.name,
                    preset.icon,
                    preset.mode.as_str(),
                    preset.duration_minutes,
                    apps_json,
                    domains_json,
                    preset.use_default_blocklist,
                    preset.include_mental_prep,
                    preset.created_at,
                    preset.updated_at,
                ],
            ).map_err(|e| format!("Failed to insert default preset: {}", e))?;
        }
    }
    
    Ok(())
}

/// Get the default preset definitions
pub fn get_default_preset_definitions() -> Vec<SessionPreset> {
    let now = now_ms();
    
    vec![
        SessionPreset {
            id: "default_quick_focus".to_string(),
            name: "Quick Focus".to_string(),
            icon: "🧘".to_string(),
            mode: SessionMode::Zen,
            duration_minutes: 25,
            whitelisted_apps: vec![],
            whitelisted_domains: vec![],
            use_default_blocklist: true,
            include_mental_prep: false,
            is_default: true,
            is_last_session: false,
            created_at: now,
            updated_at: now,
            last_used_at: None,
            usage_count: 0,
        },
        SessionPreset {
            id: "default_deep_work".to_string(),
            name: "Deep Work".to_string(),
            icon: "🌊".to_string(),
            mode: SessionMode::Flow,
            duration_minutes: 60,
            whitelisted_apps: vec![],
            whitelisted_domains: vec![
                "github.com".to_string(),
                "gitlab.com".to_string(),
                "stackoverflow.com".to_string(),
                "docs.google.com".to_string(),
            ],
            use_default_blocklist: true,
            include_mental_prep: false,
            is_default: true,
            is_last_session: false,
            created_at: now,
            updated_at: now,
            last_used_at: None,
            usage_count: 0,
        },
        SessionPreset {
            id: "default_coding_sprint".to_string(),
            name: "Coding Sprint".to_string(),
            icon: "🔥".to_string(),
            mode: SessionMode::Legend,
            duration_minutes: 90,
            whitelisted_apps: vec![
                "VS Code".to_string(),
                "Visual Studio Code".to_string(),
                "Cursor".to_string(),
                "Terminal".to_string(),
                "iTerm".to_string(),
                "Warp".to_string(),
            ],
            whitelisted_domains: vec![
                "github.com".to_string(),
                "stackoverflow.com".to_string(),
                "docs.rs".to_string(),
                "crates.io".to_string(),
                "npmjs.com".to_string(),
            ],
            use_default_blocklist: true,
            include_mental_prep: false,
            is_default: true,
            is_last_session: false,
            created_at: now,
            updated_at: now,
            last_used_at: None,
            usage_count: 0,
        },
        SessionPreset {
            id: "default_admin_email".to_string(),
            name: "Admin & Email".to_string(),
            icon: "📧".to_string(),
            mode: SessionMode::Zen,
            duration_minutes: 30,
            whitelisted_apps: vec![
                "Mail".to_string(),
                "Microsoft Outlook".to_string(),
                "Calendar".to_string(),
                "Slack".to_string(),
                "Microsoft Teams".to_string(),
                "Notion".to_string(),
            ],
            whitelisted_domains: vec![
                "gmail.com".to_string(),
                "mail.google.com".to_string(),
                "calendar.google.com".to_string(),
                "outlook.com".to_string(),
                "outlook.office.com".to_string(),
                "notion.so".to_string(),
                "slack.com".to_string(),
            ],
            use_default_blocklist: true,
            include_mental_prep: false,
            is_default: true,
            is_last_session: false,
            created_at: now,
            updated_at: now,
            last_used_at: None,
            usage_count: 0,
        },
    ]
}

/// Insert default blocked domains
pub fn insert_default_blocked_domains(conn: &Connection) -> Result<(), String> {
    let domains = get_default_blocked_domain_list();
    let now = now_ms();
    
    for (domain, category) in domains {
        conn.execute(
            "INSERT OR IGNORE INTO blocked_domains (id, domain, category, is_default, added_at)
             VALUES (?1, ?2, ?3, TRUE, ?4)",
            params![
                uuid::Uuid::new_v4().to_string(),
                domain,
                category,
                now,
            ],
        ).map_err(|e| format!("Failed to insert blocked domain: {}", e))?;
    }
    
    Ok(())
}

/// Default blocked domains list
pub fn get_default_blocked_domain_list() -> Vec<(&'static str, &'static str)> {
    vec![
        // Social Media
        ("twitter.com", "social"),
        ("x.com", "social"),
        ("facebook.com", "social"),
        ("instagram.com", "social"),
        ("tiktok.com", "social"),
        ("snapchat.com", "social"),
        ("reddit.com", "social"),
        ("tumblr.com", "social"),
        ("pinterest.com", "social"),
        ("threads.net", "social"),
        
        // Entertainment
        ("netflix.com", "entertainment"),
        ("hulu.com", "entertainment"),
        ("disneyplus.com", "entertainment"),
        ("hbomax.com", "entertainment"),
        ("primevideo.com", "entertainment"),
        ("twitch.tv", "entertainment"),
        ("crunchyroll.com", "entertainment"),
        
        // Gaming
        ("steampowered.com", "gaming"),
        ("store.steampowered.com", "gaming"),
        ("epicgames.com", "gaming"),
        ("gog.com", "gaming"),
        ("itch.io", "gaming"),
        ("roblox.com", "gaming"),
        
        // Shopping
        ("amazon.com", "shopping"),
        ("ebay.com", "shopping"),
        ("etsy.com", "shopping"),
    ]
}

/// Get all blocked domains from database
pub fn get_all_blocked_domains(conn: &Connection) -> Result<Vec<String>, String> {
    let mut stmt = conn.prepare("SELECT domain FROM blocked_domains")
        .map_err(|e| e.to_string())?;
    
    let domains = stmt.query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    
    domains.collect::<Result<Vec<String>, _>>()
        .map_err(|e| e.to_string())
}

/// Get default whitelisted apps from cache
pub fn get_default_whitelisted_apps(conn: &Connection) -> Result<Vec<String>, String> {
    let mut stmt = conn.prepare(
        "SELECT app_name FROM cached_apps 
         WHERE (category IN ('productivity', 'communication', 'browser', 'utility') 
                OR is_default_whitelisted = TRUE)
           AND is_default_blocked = FALSE
           AND (user_classification IS NULL OR user_classification = 'whitelisted')"
    ).map_err(|e| e.to_string())?;
    
    let apps = stmt.query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    
    apps.collect::<Result<Vec<String>, _>>()
        .map_err(|e| e.to_string())
}

/// Get default blocked apps from cache
pub fn get_default_blocked_apps(conn: &Connection) -> Result<Vec<String>, String> {
    let mut stmt = conn.prepare(
        "SELECT app_name FROM cached_apps 
         WHERE (category IN ('social', 'game', 'entertainment') 
                OR is_default_blocked = TRUE)
           AND (user_classification IS NULL OR user_classification = 'blocked')"
    ).map_err(|e| e.to_string())?;
    
    let apps = stmt.query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    
    apps.collect::<Result<Vec<String>, _>>()
        .map_err(|e| e.to_string())
}

/// Default whitelisted domains
pub fn get_default_whitelisted_domains() -> Vec<String> {
    vec![
        "github.com".to_string(),
        "gitlab.com".to_string(),
        "bitbucket.org".to_string(),
        "stackoverflow.com".to_string(),
        "stackexchange.com".to_string(),
        "developer.mozilla.org".to_string(),
        "docs.rs".to_string(),
        "crates.io".to_string(),
        "npmjs.com".to_string(),
        "pypi.org".to_string(),
        "notion.so".to_string(),
        "linear.app".to_string(),
        "asana.com".to_string(),
        "trello.com".to_string(),
        "monday.com".to_string(),
        "clickup.com".to_string(),
        "figma.com".to_string(),
        "docs.google.com".to_string(),
        "sheets.google.com".to_string(),
        "slides.google.com".to_string(),
        "drive.google.com".to_string(),
        "calendar.google.com".to_string(),
        "mail.google.com".to_string(),
        "outlook.office.com".to_string(),
        "office.com".to_string(),
        "sharepoint.com".to_string(),
        "teams.microsoft.com".to_string(),
        "slack.com".to_string(),
        "zoom.us".to_string(),
        "chat.openai.com".to_string(),
        "claude.ai".to_string(),
        "anthropic.com".to_string(),
        "spotify.com".to_string(),
        "music.apple.com".to_string(),
    ]
}
