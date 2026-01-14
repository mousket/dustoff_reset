// src-tauri/src/telemetry/platform/apps.rs
// Cross-platform installed application discovery

use serde::{Deserialize, Serialize};

/// Information about an installed application
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstalledApp {
    /// Display name of the app
    pub name: String,
    /// Bundle ID (macOS) or executable path (Windows)
    pub identifier: String,
    /// Path to the application
    pub path: String,
    /// Category of the app (browser, editor, communication, etc.)
    pub category: Option<String>,
    /// Whether this is a known browser
    pub is_browser: bool,
}

/// Get list of installed applications on macOS
#[cfg(target_os = "macos")]
pub fn get_installed_apps() -> Result<Vec<InstalledApp>, String> {
    use std::fs;
    use std::path::Path;
    use std::process::Command;
    
    let mut apps = Vec::new();
    
    // Scan /Applications folder
    let applications_path = Path::new("/Applications");
    
    if let Ok(entries) = fs::read_dir(applications_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            
            // Only process .app bundles
            if path.extension().and_then(|e| e.to_str()) == Some("app") {
                if let Some(app_name) = path.file_stem().and_then(|n| n.to_str()) {
                    // Try to get bundle ID using mdls
                    let bundle_id = get_bundle_id_macos(&path.to_string_lossy());
                    let category = categorize_app(app_name, bundle_id.as_deref());
                    let is_browser = is_known_browser(bundle_id.as_deref());
                    
                    apps.push(InstalledApp {
                        name: app_name.to_string(),
                        identifier: bundle_id.unwrap_or_else(|| app_name.to_lowercase()),
                        path: path.to_string_lossy().to_string(),
                        category,
                        is_browser,
                    });
                }
            }
        }
    }
    
    // Also scan ~/Applications
    if let Some(home) = dirs::home_dir() {
        let user_apps = home.join("Applications");
        if let Ok(entries) = fs::read_dir(user_apps) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|e| e.to_str()) == Some("app") {
                    if let Some(app_name) = path.file_stem().and_then(|n| n.to_str()) {
                        let bundle_id = get_bundle_id_macos(&path.to_string_lossy());
                        let category = categorize_app(app_name, bundle_id.as_deref());
                        let is_browser = is_known_browser(bundle_id.as_deref());
                        
                        apps.push(InstalledApp {
                            name: app_name.to_string(),
                            identifier: bundle_id.unwrap_or_else(|| app_name.to_lowercase()),
                            path: path.to_string_lossy().to_string(),
                            category,
                            is_browser,
                        });
                    }
                }
            }
        }
    }
    
    // Sort alphabetically
    apps.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    
    Ok(apps)
}

/// Get bundle ID for a macOS app
#[cfg(target_os = "macos")]
fn get_bundle_id_macos(app_path: &str) -> Option<String> {
    use std::process::Command;
    
    let output = Command::new("mdls")
        .args(["-name", "kMDItemCFBundleIdentifier", "-raw", app_path])
        .output()
        .ok()?;
    
    if output.status.success() {
        let id = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if id != "(null)" && !id.is_empty() {
            return Some(id);
        }
    }
    
    None
}

/// Get list of installed applications on Windows
#[cfg(target_os = "windows")]
pub fn get_installed_apps() -> Result<Vec<InstalledApp>, String> {
    use std::fs;
    use std::path::Path;
    
    let mut apps = Vec::new();
    
    // Common installation paths
    let paths = [
        "C:\\Program Files",
        "C:\\Program Files (x86)",
    ];
    
    for base_path in paths {
        let path = Path::new(base_path);
        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.flatten() {
                let entry_path = entry.path();
                if entry_path.is_dir() {
                    if let Some(app_name) = entry_path.file_name().and_then(|n| n.to_str()) {
                        // Skip system folders
                        if app_name.starts_with("Windows") || app_name == "Common Files" {
                            continue;
                        }
                        
                        let category = categorize_app(app_name, None);
                        let is_browser = is_known_browser_name(app_name);
                        
                        apps.push(InstalledApp {
                            name: app_name.to_string(),
                            identifier: app_name.to_lowercase().replace(" ", "-"),
                            path: entry_path.to_string_lossy().to_string(),
                            category,
                            is_browser,
                        });
                    }
                }
            }
        }
    }
    
    // Also check Start Menu shortcuts
    if let Some(start_menu) = dirs::data_local_dir() {
        let programs = start_menu.join("Microsoft\\Windows\\Start Menu\\Programs");
        scan_windows_shortcuts(&programs, &mut apps);
    }
    
    // Sort and deduplicate
    apps.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    apps.dedup_by(|a, b| a.name.to_lowercase() == b.name.to_lowercase());
    
    Ok(apps)
}

#[cfg(target_os = "windows")]
fn scan_windows_shortcuts(path: &std::path::Path, apps: &mut Vec<InstalledApp>) {
    use std::fs;
    
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            let entry_path = entry.path();
            if entry_path.is_dir() {
                scan_windows_shortcuts(&entry_path, apps);
            } else if entry_path.extension().and_then(|e| e.to_str()) == Some("lnk") {
                if let Some(name) = entry_path.file_stem().and_then(|n| n.to_str()) {
                    // Skip uninstallers and system shortcuts
                    if name.contains("Uninstall") || name.contains("Help") {
                        continue;
                    }
                    
                    let category = categorize_app(name, None);
                    let is_browser = is_known_browser_name(name);
                    
                    apps.push(InstalledApp {
                        name: name.to_string(),
                        identifier: name.to_lowercase().replace(" ", "-"),
                        path: entry_path.to_string_lossy().to_string(),
                        category,
                        is_browser,
                    });
                }
            }
        }
    }
}

/// Fallback for unsupported platforms
#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub fn get_installed_apps() -> Result<Vec<InstalledApp>, String> {
    Err("App discovery is not supported on this platform".to_string())
}

/// Get list of installed browsers
pub fn get_installed_browsers() -> Vec<InstalledApp> {
    get_installed_apps()
        .unwrap_or_default()
        .into_iter()
        .filter(|app| app.is_browser)
        .collect()
}

/// Check if a bundle ID is a known browser
fn is_known_browser(bundle_id: Option<&str>) -> bool {
    match bundle_id {
        Some(id) => {
            let known_browsers = [
                "com.google.Chrome",
                "com.apple.Safari",
                "org.mozilla.firefox",
                "com.microsoft.edgemac",
                "com.brave.Browser",
                "com.operasoftware.Opera",
                "company.thebrowser.Browser", // Arc
                "com.vivaldi.Vivaldi",
            ];
            known_browsers.iter().any(|&b| id.contains(b))
        }
        None => false,
    }
}

/// Check if app name suggests it's a browser
fn is_known_browser_name(name: &str) -> bool {
    let name_lower = name.to_lowercase();
    let browser_names = ["chrome", "safari", "firefox", "edge", "brave", "opera", "arc", "vivaldi"];
    browser_names.iter().any(|&b| name_lower.contains(b))
}

/// Categorize an app based on name and bundle ID
fn categorize_app(name: &str, bundle_id: Option<&str>) -> Option<String> {
    let name_lower = name.to_lowercase();
    let id_lower = bundle_id.map(|b| b.to_lowercase());
    
    // Browsers
    if is_known_browser(bundle_id) || is_known_browser_name(name) {
        return Some("browser".to_string());
    }
    
    // Code editors
    let editors = ["code", "studio", "xcode", "sublime", "atom", "vim", "emacs", "notepad", "textmate", "bbedit"];
    if editors.iter().any(|&e| name_lower.contains(e)) {
        return Some("editor".to_string());
    }
    
    // Communication
    let comms = ["slack", "discord", "teams", "zoom", "meet", "skype", "telegram", "whatsapp", "messages", "mail"];
    if comms.iter().any(|&c| name_lower.contains(c)) {
        return Some("communication".to_string());
    }
    
    // Design tools
    let design = ["figma", "sketch", "photoshop", "illustrator", "affinity", "canva", "gimp"];
    if design.iter().any(|&d| name_lower.contains(d)) {
        return Some("design".to_string());
    }
    
    // Productivity
    let productivity = ["notion", "obsidian", "evernote", "todoist", "things", "omnifocus", "bear"];
    if productivity.iter().any(|&p| name_lower.contains(p)) {
        return Some("productivity".to_string());
    }
    
    // Office
    let office = ["word", "excel", "powerpoint", "pages", "numbers", "keynote", "libreoffice"];
    if office.iter().any(|&o| name_lower.contains(o)) {
        return Some("office".to_string());
    }
    
    // Media
    let media = ["spotify", "music", "vlc", "quicktime", "itunes", "podcast"];
    if media.iter().any(|&m| name_lower.contains(m)) {
        return Some("media".to_string());
    }
    
    // Terminal
    let terminals = ["terminal", "iterm", "warp", "hyper", "alacritty", "kitty"];
    if terminals.iter().any(|&t| name_lower.contains(t)) {
        return Some("terminal".to_string());
    }
    
    None
}
