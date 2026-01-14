// src-tauri/src/telemetry/app_monitor.rs
// macOS active application detection

use super::types::{ActiveAppInfo, BrowserTabInfo};
use std::process::Command;

/// Known browser bundle IDs
const BROWSER_BUNDLE_IDS: &[&str] = &[
    "com.google.Chrome",
    "com.apple.Safari",
    "org.mozilla.firefox",
    "com.microsoft.edgemac",
    "com.brave.Browser",
    "com.operasoftware.Opera",
    "company.thebrowser.Browser", // Arc
];

/// Get the currently active application on macOS
#[cfg(target_os = "macos")]
pub fn get_active_app() -> Option<ActiveAppInfo> {
    // Use AppleScript to get the frontmost application
    let script = r#"
        tell application "System Events"
            set frontApp to first application process whose frontmost is true
            set appName to name of frontApp
            set bundleId to bundle identifier of frontApp
            return appName & "|" & bundleId
        end tell
    "#;

    let output = Command::new("osascript")
        .arg("-e")
        .arg(script)
        .output()
        .ok()?;

    if !output.status.success() {
        // Log the error for debugging
        let stderr = String::from_utf8_lossy(&output.stderr);
        if !stderr.is_empty() {
            println!("[Telemetry] AppleScript error: {}", stderr);
        }
        return None;
    }

    let result = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let parts: Vec<&str> = result.split('|').collect();

    if parts.len() >= 2 {
        Some(ActiveAppInfo {
            app_name: parts[0].to_string(),
            bundle_id: Some(parts[1].to_string()),
            window_title: get_window_title(parts[0]),
            active_since: chrono::Utc::now().timestamp_millis(),
        })
    } else {
        None
    }
}

/// Get the window title for an application
#[cfg(target_os = "macos")]
fn get_window_title(app_name: &str) -> Option<String> {
    let script = format!(
        r#"
        tell application "System Events"
            tell process "{}"
                if exists (window 1) then
                    return name of window 1
                else
                    return ""
                end if
            end tell
        end tell
        "#,
        app_name
    );

    let output = Command::new("osascript")
        .arg("-e")
        .arg(&script)
        .output()
        .ok()?;

    if output.status.success() {
        let title = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !title.is_empty() {
            return Some(title);
        }
    }

    None
}

/// Check if an app is a known browser
pub fn is_browser(bundle_id: &Option<String>) -> bool {
    if let Some(id) = bundle_id {
        BROWSER_BUNDLE_IDS.iter().any(|&bid| id.contains(bid))
    } else {
        false
    }
}

/// Get browser tab info for Chrome
#[cfg(target_os = "macos")]
pub fn get_chrome_tab() -> Option<BrowserTabInfo> {
    let script = r#"
        tell application "Google Chrome"
            if (count of windows) > 0 then
                set currentTab to active tab of front window
                set tabUrl to URL of currentTab
                set tabTitle to title of currentTab
                return tabUrl & "|" & tabTitle
            end if
        end tell
    "#;

    let output = Command::new("osascript")
        .arg("-e")
        .arg(script)
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let result = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let parts: Vec<&str> = result.splitn(2, '|').collect();

    if parts.len() >= 2 {
        let url = parts[0].to_string();
        let domain = extract_domain(&url);
        
        Some(BrowserTabInfo {
            browser: "Chrome".to_string(),
            url: Some(url),
            title: Some(parts[1].to_string()),
            domain,
        })
    } else {
        None
    }
}

/// Get browser tab info for Safari
#[cfg(target_os = "macos")]
pub fn get_safari_tab() -> Option<BrowserTabInfo> {
    let script = r#"
        tell application "Safari"
            if (count of windows) > 0 then
                set currentTab to current tab of front window
                set tabUrl to URL of currentTab
                set tabTitle to name of currentTab
                return tabUrl & "|" & tabTitle
            end if
        end tell
    "#;

    let output = Command::new("osascript")
        .arg("-e")
        .arg(script)
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let result = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let parts: Vec<&str> = result.splitn(2, '|').collect();

    if parts.len() >= 2 {
        let url = parts[0].to_string();
        let domain = extract_domain(&url);
        
        Some(BrowserTabInfo {
            browser: "Safari".to_string(),
            url: Some(url),
            title: Some(parts[1].to_string()),
            domain,
        })
    } else {
        None
    }
}

/// Get browser tab info based on the active browser
#[cfg(target_os = "macos")]
pub fn get_browser_tab(bundle_id: &Option<String>) -> Option<BrowserTabInfo> {
    match bundle_id.as_deref() {
        Some(id) if id.contains("com.google.Chrome") => get_chrome_tab(),
        Some(id) if id.contains("com.apple.Safari") => get_safari_tab(),
        // TODO: Add Firefox, Edge, Arc support
        _ => None,
    }
}

/// Extract domain from URL
fn extract_domain(url: &str) -> Option<String> {
    // Simple domain extraction
    let url = url.trim();
    if url.is_empty() {
        return None;
    }

    // Remove protocol
    let without_protocol = url
        .strip_prefix("https://")
        .or_else(|| url.strip_prefix("http://"))
        .unwrap_or(url);

    // Get domain (before first /)
    let domain = without_protocol
        .split('/')
        .next()
        .map(|s| s.to_string());

    // Remove www. prefix
    domain.map(|d| d.strip_prefix("www.").unwrap_or(&d).to_string())
}

/// Fallback for non-macOS platforms
#[cfg(not(target_os = "macos"))]
pub fn get_active_app() -> Option<ActiveAppInfo> {
    None
}

#[cfg(not(target_os = "macos"))]
pub fn get_browser_tab(_bundle_id: &Option<String>) -> Option<BrowserTabInfo> {
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_domain() {
        assert_eq!(
            extract_domain("https://www.google.com/search?q=test"),
            Some("google.com".to_string())
        );
        assert_eq!(
            extract_domain("https://github.com/tauri-apps/tauri"),
            Some("github.com".to_string())
        );
        assert_eq!(extract_domain(""), None);
    }

    #[test]
    fn test_is_browser() {
        assert!(is_browser(&Some("com.google.Chrome".to_string())));
        assert!(is_browser(&Some("com.apple.Safari".to_string())));
        assert!(!is_browser(&Some("com.microsoft.VSCode".to_string())));
        assert!(!is_browser(&None));
    }
}
