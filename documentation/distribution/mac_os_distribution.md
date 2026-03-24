
## Building for macOS Distribution

### Step 1: Create a Release Build

```bash
# From your project root
npm run tauri build
```

This creates:
```
src-tauri/target/release/bundle/
├── macos/
│   └── Dustoff Reset.app        # The app bundle
└── dmg/
    └── Dustoff Reset_0.1.0_aarch64.dmg   # Installer disk image
```
/Users/gerardbeaubrun/Documents/projects/dustoff_reset_desktop/dustoff_reset/src-tauri/target/release/bundle/macos/Dustoff Reset.app
/Users/gerardbeaubrun/Documents/projects/dustoff_reset_desktop/dustoff_reset/src-tauri/target/release/bundle/dmg/Dustoff Reset_0.1.0_aarch64.dmg

**Send the user the `.dmg` file** - this is the professional installer.

---

## What the user Will Experience

### Installation Flow

1. **Double-click the .dmg file**
   - macOS mounts it as a virtual disk
   - Shows the app icon and Applications folder

2. **Drag to Applications**
   - Standard macOS install pattern
   - No admin password required (unless you code-sign differently)

3. **First Launch - Gatekeeper Warning**
   
   ⚠️ **This is the big one!** Since the app isn't signed with an Apple Developer certificate, the user will see:

   > "Dustoff Reset" cannot be opened because the developer cannot be verified.

   **How to bypass:**
   - Right-click (or Control+click) on the app
   - Select "Open"
   - Click "Open" in the dialog
   - This only needs to be done once

   **Tell the user this upfront!** Include instructions.

---

## Permissions - The Critical Part

### Accessibility Permission (Required for App Detection)

Your app uses `NSWorkspace` to detect the frontmost app. This **requires Accessibility permission**.

**What the user will see:**

On first launch (when telemetry starts), macOS will show:

> "Dustoff Reset" would like to control this computer using accessibility features.

She needs to:
1. Click "Open System Preferences"
2. Go to Privacy & Security → Accessibility
3. Enable "Dustoff Reset" in the list
4. May need to restart the app

### How to Make This Smoother

**Option A: Prompt explicitly on first launch**

Add this to your app initialization (Rust side):

```rust
// src-tauri/src/commands/permissions.rs

#[cfg(target_os = "macos")]
use std::process::Command;

/// Check if we have accessibility permissions
#[cfg(target_os = "macos")]
#[tauri::command]
pub fn check_accessibility_permission() -> bool {
    // This uses a macOS API to check permission status
    let output = Command::new("osascript")
        .arg("-e")
        .arg("tell application \"System Events\" to return true")
        .output();
    
    match output {
        Ok(o) => o.status.success(),
        Err(_) => false,
    }
}

/// Open System Preferences to Accessibility pane
#[cfg(target_os = "macos")]
#[tauri::command]
pub fn open_accessibility_settings() -> Result<(), String> {
    Command::new("open")
        .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(not(target_os = "macos"))]
#[tauri::command]
pub fn check_accessibility_permission() -> bool {
    true // Windows doesn't need this
}

#[cfg(not(target_os = "macos"))]
#[tauri::command]
pub fn open_accessibility_settings() -> Result<(), String> {
    Ok(()) // No-op on Windows
}
```

**Option B: Show a friendly onboarding screen**

Create an onboarding component that:
1. Detects if permission is missing
2. Explains why it's needed
3. Has a button to open Settings
4. Checks again when user returns

---

## SQLite Database - Automatic Setup

### Where It Lives

Tauri creates the database automatically in the app's data directory:

```
macOS: ~/Library/Application Support/com.dustoffreset.app/
       └── dustoff.db  (or whatever you named it)

Windows: C:\Users\<user>\AppData\Roaming\com.dustoffreset.app\
         └── dustoff.db
```

### Does It Create Automatically?

**Yes, IF** you have code that:
1. Gets the app data directory
2. Creates the database file if it doesn't exist
3. Runs migrations/table creation

**Check your database initialization code:**

```rust
// This should be in your app setup
use tauri::api::path::app_data_dir;

fn init_database(app: &tauri::App) -> Result<Connection, String> {
    let app_dir = app_data_dir(&app.config())
        .ok_or("Failed to get app data directory")?;
    
    // Create directory if it doesn't exist
    std::fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create app directory: {}", e))?;
    
    let db_path = app_dir.join("dustoff.db");
    
    // Open or create database
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;
    
    // Run migrations
    init_tables(&conn)?;
    init_badge_tables(&conn)?;
    
    Ok(conn)
}
```

**If this is set up correctly, the user's database will be created on first launch.**

---

## Pre-Flight Checklist Before Sending

### 1. Test the Release Build Yourself First

```bash
# Build
npm run tauri build

# Find the .app
open src-tauri/target/release/bundle/macos/

# Run it directly (not from dev mode)
# Double-click "Dustoff Reset.app"
```

**Verify:**
- [ ] App launches
- [ ] Accessibility permission prompt appears (or you handle it gracefully)
- [ ] After granting permission, app detection works
- [ ] Database is created (check `~/Library/Application Support/...`)
- [ ] A session can be started and completed
- [ ] Badges unlock correctly

### 2. Test the DMG Installer

```bash
# Find the DMG
open src-tauri/target/release/bundle/dmg/
```

- Double-click the DMG
- Drag to Applications
- Launch from Applications folder
- Go through first-launch flow

### 3. Check App Signing Status

```bash
# Check if app is signed
codesign -dv "src-tauri/target/release/bundle/macos/Dustoff Reset.app"
```

Without an Apple Developer account ($99/year), the app will be **unsigned**, which causes the Gatekeeper warning.

---

## What to Send the user

### The Package

1. **The DMG file:**
   ```
   src-tauri/target/release/bundle/dmg/Dustoff Reset_x.x.x_aarch64.dmg
   ```
   
   If the user has an Intel Mac, you also need:
   ```
   Dustoff Reset_x.x.x_x64.dmg
   ```

   **To build for Intel Mac:**
   ```bash
   # If you're on Apple Silicon, you need to cross-compile
   rustup target add x86_64-apple-darwin
   npm run tauri build -- --target x86_64-apple-darwin
   ```

2. **Upload to:** Google Drive, Dropbox, or WeTransfer

### The Instructions (Send This to the user)

---

**Subject: Dustoff Reset - Test Build 🎯**

Hey the user!

Here's the latest build of Dustoff Reset. Super excited for you to try it!

**Installation:**

1. Download the DMG file: [LINK]

2. Double-click to open, drag "Dustoff Reset" to Applications

3. **Important - First Launch:**
   - Right-click on the app in Applications
   - Select "Open"
   - Click "Open" when macOS warns about unverified developer
   - (This is because we haven't paid Apple $99/year for signing yet)

4. **Grant Accessibility Permission:**
   - The app needs this to detect which apps you're using
   - When prompted, click "Open System Preferences"
   - Go to Privacy & Security → Accessibility
   - Toggle ON for "Dustoff Reset"
   - You may need to restart the app

**What to Test:**

1. Start a Zen mode session (easiest)
2. Switch to Twitter or another app during the session
3. See if it detects the switch and shows in the log
4. Complete the session
5. You should unlock your first badge! 🏅

**Known Issues:**
- [List any known bugs]
- If app detection doesn't work, double-check Accessibility permission

Let me know how it goes! Screenshots of any issues would be super helpful.

---

## Professional Polish: Add Version Checking

Before sending, update your `tauri.conf.json`:

```json
{
  "package": {
    "productName": "Dustoff Reset",
    "version": "0.1.0"
  },
  "tauri": {
    "bundle": {
      "identifier": "com.dustoffreset.app",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ],
      "macOS": {
        "minimumSystemVersion": "10.15"
      }
    }
  }
}
```

---

## Quick Summary

| Question | Answer |
|----------|--------|
| How to send? | Build DMG, upload to cloud storage, send link |
| Installer needed? | DMG is the installer (drag to Applications) |
| Permissions automatic? | macOS will prompt, the user must approve manually |
| SQLite created automatically? | Yes, if your init code is correct |
| Database access? | App has full access to its own data directory |
| Gatekeeper warning? | Yes, until you pay for Apple Developer ($99/yr) |
