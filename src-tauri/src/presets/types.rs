use serde::{Deserialize, Serialize};

/// Session mode
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SessionMode {
    Zen,
    Flow,
    Legend,
}

impl SessionMode {
    pub fn as_str(&self) -> &'static str {
        match self {
            SessionMode::Zen => "Zen",
            SessionMode::Flow => "Flow",
            SessionMode::Legend => "Legend",
        }
    }
    
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "zen" => Some(SessionMode::Zen),
            "flow" => Some(SessionMode::Flow),
            "legend" => Some(SessionMode::Legend),
            _ => None,
        }
    }
}

/// A saved session preset
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionPreset {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub mode: SessionMode,
    pub duration_minutes: i32,
    pub whitelisted_apps: Vec<String>,
    pub whitelisted_domains: Vec<String>,
    pub use_default_blocklist: bool,
    pub include_mental_prep: bool,
    pub is_default: bool,
    pub is_last_session: bool,
    pub created_at: u64,
    pub updated_at: u64,
    pub last_used_at: Option<u64>,
    pub usage_count: i32,
}

impl SessionPreset {
    pub fn new(name: String, icon: String, mode: SessionMode, duration_minutes: i32) -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64;
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            icon,
            mode,
            duration_minutes,
            whitelisted_apps: Vec::new(),
            whitelisted_domains: Vec::new(),
            use_default_blocklist: true,
            include_mental_prep: true,
            is_default: false,
            is_last_session: false,
            created_at: now,
            updated_at: now,
            last_used_at: None,
            usage_count: 0,
        }
    }
}

/// App category for classification
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum AppCategory {
    Productivity,
    Communication,
    Browser,
    Entertainment,
    Social,
    Game,
    Utility,
    Unknown,
}

impl AppCategory {
    pub fn as_str(&self) -> &'static str {
        match self {
            AppCategory::Productivity => "productivity",
            AppCategory::Communication => "communication",
            AppCategory::Browser => "browser",
            AppCategory::Entertainment => "entertainment",
            AppCategory::Social => "social",
            AppCategory::Game => "game",
            AppCategory::Utility => "utility",
            AppCategory::Unknown => "unknown",
        }
    }
    
    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "productivity" => AppCategory::Productivity,
            "communication" => AppCategory::Communication,
            "browser" => AppCategory::Browser,
            "entertainment" => AppCategory::Entertainment,
            "social" => AppCategory::Social,
            "game" => AppCategory::Game,
            "utility" => AppCategory::Utility,
            _ => AppCategory::Unknown,
        }
    }
    
    pub fn is_default_blocked(&self) -> bool {
        matches!(self, AppCategory::Social | AppCategory::Game | AppCategory::Entertainment)
    }
}

/// A cached application entry
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CachedApp {
    pub id: String,
    pub app_name: String,
    pub bundle_id: Option<String>,
    pub exe_path: Option<String>,
    pub category: AppCategory,
    pub is_browser: bool,
    pub is_default_blocked: bool,
    pub is_default_whitelisted: bool,
    pub user_classification: Option<String>,
    pub first_seen_at: u64,
    pub last_seen_at: u64,
}

/// Domain block entry
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlockedDomain {
    pub id: String,
    pub domain: String,
    pub category: String,
    pub is_default: bool,
    pub added_at: u64,
}

/// Input for creating a new preset
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePresetInput {
    pub name: String,
    pub icon: String,
    pub mode: String,
    pub duration_minutes: i32,
    pub whitelisted_apps: Vec<String>,
    pub whitelisted_domains: Vec<String>,
    pub use_default_blocklist: bool,
    pub include_mental_prep: bool,
}

/// Input for updating a preset
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePresetInput {
    pub id: String,
    pub name: Option<String>,
    pub icon: Option<String>,
    pub mode: Option<String>,
    pub duration_minutes: Option<i32>,
    pub whitelisted_apps: Option<Vec<String>>,
    pub whitelisted_domains: Option<Vec<String>>,
    pub use_default_blocklist: Option<bool>,
    pub include_mental_prep: Option<bool>,
}

/// Result of starting a session from Quick Start
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuickStartConfig {
    pub mode: SessionMode,
    pub duration_minutes: i32,
    pub whitelisted_apps: Vec<String>,
    pub whitelisted_domains: Vec<String>,
    pub blocked_apps: Vec<String>,
    pub blocked_domains: Vec<String>,
}

/// Response type for get_all_presets
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AllPresetsResponse {
    pub last_session: Option<SessionPreset>,
    pub user_presets: Vec<SessionPreset>,
    pub default_presets: Vec<SessionPreset>,
}

/// Helper function to get current timestamp in milliseconds
pub fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64
}
