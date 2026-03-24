use tauri::{command, State};
use crate::AppState;
use crate::presets::types::*;
use crate::presets::persistence::*;
use crate::presets::defaults::*;
use crate::presets::app_cache::*;

const MAX_USER_PRESETS: i32 = 5;

/// Initialize preset system (call on app startup)
#[command]
pub fn init_presets(state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    
    init_preset_tables(&conn)?;
    insert_default_presets(&conn)?;
    insert_default_blocked_domains(&conn)?;
    
    println!("[Presets] Initialized preset system");
    Ok(())
}

/// Get all presets organized by category
#[command]
pub fn get_all_presets(state: State<AppState>) -> Result<AllPresetsResponse, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    
    let last_session = get_last_session_preset(&conn)?;
    let user_presets = get_user_presets(&conn)?;
    let default_presets = get_default_presets(&conn)?;
    
    Ok(AllPresetsResponse {
        last_session,
        user_presets,
        default_presets,
    })
}

/// Get a single preset by ID
#[command]
pub fn get_preset(state: State<AppState>, id: String) -> Result<SessionPreset, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    get_preset_by_id(&conn, &id)
}

/// Create a new user preset
#[command]
pub fn create_user_preset(
    state: State<AppState>,
    input: CreatePresetInput,
) -> Result<SessionPreset, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    
    let count = count_user_presets(&conn)?;
    if count >= MAX_USER_PRESETS {
        return Err(format!("Maximum of {} presets allowed. Please delete one first.", MAX_USER_PRESETS));
    }
    
    let preset = create_preset(&conn, &input)?;
    println!("[Presets] Created preset: {}", preset.name);
    Ok(preset)
}

/// Update an existing preset
#[command]
pub fn update_user_preset(
    state: State<AppState>,
    input: UpdatePresetInput,
) -> Result<SessionPreset, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let preset = update_preset(&conn, &input)?;
    println!("[Presets] Updated preset: {}", preset.name);
    Ok(preset)
}

/// Delete a preset
#[command]
pub fn delete_user_preset(state: State<AppState>, id: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    delete_preset(&conn, &id)?;
    println!("[Presets] Deleted preset: {}", id);
    Ok(())
}

/// Save current session as "Last Session"
#[command]
pub fn save_as_last_session(
    state: State<AppState>,
    mode: String,
    duration_minutes: i32,
    whitelisted_apps: Vec<String>,
    whitelisted_domains: Vec<String>,
    use_default_blocklist: bool,
    include_mental_prep: bool,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    
    let session_mode = SessionMode::from_str(&mode)
        .ok_or_else(|| format!("Invalid mode: {}", mode))?;
    
    let preset = SessionPreset {
        id: "last_session".to_string(),
        name: "Last Session".to_string(),
        icon: "🔄".to_string(),
        mode: session_mode,
        duration_minutes,
        whitelisted_apps,
        whitelisted_domains,
        use_default_blocklist,
        include_mental_prep,
        is_default: false,
        is_last_session: true,
        created_at: now_ms(),
        updated_at: now_ms(),
        last_used_at: Some(now_ms()),
        usage_count: 0,
    };
    
    save_last_session(&conn, &preset)?;
    println!("[Presets] Saved last session");
    Ok(())
}

/// Record that a preset was used
#[command]
pub fn use_preset(state: State<AppState>, id: String) -> Result<SessionPreset, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    record_preset_usage(&conn, &id)?;
    let preset = get_preset_by_id(&conn, &id)?;
    println!("[Presets] Used preset: {}", preset.name);
    Ok(preset)
}

/// Get Quick Start configuration with smart defaults
#[command]
pub fn get_quick_start_config(
    state: State<AppState>,
    mode: String,
    duration_minutes: i32,
) -> Result<QuickStartConfig, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    
    let session_mode = SessionMode::from_str(&mode)
        .ok_or_else(|| format!("Invalid mode: {}", mode))?;
    
    let whitelisted_apps = get_default_whitelisted_apps(&conn)?;
    let whitelisted_domains = get_default_whitelisted_domains();
    let blocked_apps = get_default_blocked_apps(&conn)?;
    let blocked_domains = get_all_blocked_domains(&conn)?;
    
    Ok(QuickStartConfig {
        mode: session_mode,
        duration_minutes,
        whitelisted_apps,
        whitelisted_domains,
        blocked_apps,
        blocked_domains,
    })
}

/// Get count of user presets
#[command]
pub fn get_user_preset_count(state: State<AppState>) -> Result<i32, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    count_user_presets(&conn)
}

/// Get all cached apps
#[command]
pub fn get_all_cached_apps(state: State<AppState>) -> Result<Vec<CachedApp>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    get_cached_apps(&conn)
}

/// Cache a new app (called during app scanning)
#[command]
pub fn cache_new_app(
    state: State<AppState>,
    app_name: String,
    bundle_id: Option<String>,
    exe_path: Option<String>,
) -> Result<CachedApp, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    cache_app(&conn, &app_name, bundle_id.as_deref(), exe_path.as_deref())
}

/// Set user classification for an app
#[command]
pub fn set_app_user_classification(
    state: State<AppState>,
    app_name: String,
    classification: Option<String>,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    set_app_classification(&conn, &app_name, classification.as_deref())
}

/// Check if app scan is needed
#[command]
pub fn check_needs_app_scan(state: State<AppState>) -> Result<bool, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    needs_app_scan(&conn)
}

/// Record app scan completion
#[command]
pub fn record_app_scan_complete(state: State<AppState>, app_count: i32) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    record_app_scan(&conn, app_count)?;
    println!("[Presets] App scan complete, cached {} apps", app_count);
    Ok(())
}

/// Get all blocked domains
#[command]
pub fn get_blocked_domains(state: State<AppState>) -> Result<Vec<String>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    get_all_blocked_domains(&conn)
}

/// Get default whitelisted domains
#[command]
pub fn get_whitelisted_domains() -> Result<Vec<String>, String> {
    Ok(get_default_whitelisted_domains())
}
