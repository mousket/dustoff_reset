That's the issue! The app needs Accessibility permissions for AppleScript to detect which app is in the foreground.

## How to Add Permissions

### Option 1: Add Manually via System Settings

1. **System Settings** → **Privacy & Security** → **Accessibility**
2. Click the **+** button at the bottom
3. Navigate to the dustoff_reset binary. In dev mode, it's at:
   ```
   /Users/gerardbeaubrun/Documents/projects/dustoff_reset_desktop/dustoff_reset/src-tauri/target/debug/dustoff_reset
   ```
4. Add it and toggle it **ON**

### Option 2: The Terminal Running the App

Since you're running in dev mode via `npm run tauri dev`, the **terminal** might also need permissions:

1. Check if **Terminal**, **iTerm**, or **Cursor** (whichever is running the dev server) is in the Accessibility list
2. If not, add it and toggle ON

### Option 3: Trigger the Permission Dialog

Let me add a quick test that will trigger macOS to show the permission dialog:

[2 tools called]

The app is rebuilding. Once it finishes, try this:

## Quick Fix: Add the Debug Binary

1. Open **System Settings** → **Privacy & Security** → **Accessibility**
2. Click **+** (you may need to unlock with your password first)
3. Press `Cmd + Shift + G` to "Go to folder"
4. Paste this path:
   ```
   /Users/gerardbeaubrun/Documents/projects/dustoff_reset_desktop/dustoff_reset/src-tauri/target/debug/
   ```
5. Select `dustoff_reset` (the binary file, not a folder)
6. Click **Open** → Toggle it **ON**

## Alternative: Use Terminal Permissions

If the above doesn't work, the parent process (Terminal or Cursor) also needs permissions:

1. In the same Accessibility list, look for:
   - **Terminal** (if using Terminal.app)
   - **iTerm** (if using iTerm)
   - **Cursor** (the IDE itself)
2. Toggle those ON if they're there, or add them with **+**

---

After adding permissions, **restart the session** in the app (end it and start a new one) and check the **terminal** for logs like:

```
[Telemetry] ========================================
[Telemetry] Starting monitor for session: ...
[Telemetry Loop] Starting monitor loop...
[Telemetry Loop] Tick #1
[Telemetry Loop] Active app: Some("Google Chrome")
```open docs/ui-mockup-preview.html