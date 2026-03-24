
## **Dustoff Reset - System Requirements**

### **macOS**

| Requirement | Specification |
|-------------|---------------|
| **Minimum OS Version** | macOS 10.13 (High Sierra) or later |
| **Recommended OS** | macOS 12.0 (Monterey) or later |
| **Architecture** | Intel (x86_64) and Apple Silicon (arm64) |
| **RAM** | 4 GB minimum, 8 GB recommended |
| **Disk Space** | ~150 MB (app + SQLite database) |
| **Display** | Any resolution; optimized for 1920×1080+ |

**Required System Permissions:**
- ✅ **Accessibility** (required) – For detecting frontmost app and window titles via `NSWorkspace` and AppleScript
- ⚠️ **Screen Recording** (optional/future) – Reserved for future screenshot-based detection features

**Why these specs:**
- Uses Objective-C runtime (`objc` crate) + `NSWorkspace` APIs for app detection
- Uses AppleScript via `osascript` for window title detection
- Uses IOKit (`ioreg`) for idle time detection
- Transparent/frameless window with glassmorphism requires macOS compositing

---

### **Windows**

| Requirement | Specification |
|-------------|---------------|
| **Minimum OS Version** | Windows 10 (1809+) or Windows 11 |
| **Architecture** | x86_64 (64-bit only) |
| **RAM** | 4 GB minimum, 8 GB recommended |
| **Disk Space** | ~100 MB (app + SQLite database) |
| **Display** | Any resolution; optimized for 1920×1080+ |
| **Runtime** | WebView2 (Edge Chromium-based) – bundled or auto-installed |

**Required System Permissions:**
- No special permissions needed (Win32 APIs don't require explicit user grants)
- Uses standard Win32 APIs:
  - `GetForegroundWindow()` – Detect active window
  - `GetWindowTextW()` – Get window titles
  - `OpenProcess()` with `PROCESS_QUERY_INFORMATION` – Get app details
  - `GetLastInputInfo()` – Idle time detection

**Why these specs:**
- Tauri 2.x requires WebView2 (included with Windows 11, auto-installs on Windows 10)
- Uses `windows` crate with Win32 bindings for native window detection
- Transparent windows require Windows DWM (Desktop Window Manager)

---

### **Linux** *(Planned/Experimental)*

| Requirement | Specification |
|-------------|---------------|
| **Minimum OS** | Ubuntu 20.04+, Fedora 36+, or equivalent |
| **Desktop Environment** | X11 (full support) or Wayland (partial) |
| **Architecture** | x86_64 |
| **RAM** | 4 GB minimum, 8 GB recommended |
| **Disk Space** | ~100 MB |

**Required System Dependencies:**
```bash
# Debian/Ubuntu
sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev

# Fedora
sudo dnf install webkit2gtk4.1-devel gtk3-devel libappindicator-gtk3-devel
```

**Required System Permissions:**
- **X11:** Uses `XGetInputFocus()` and window properties for app detection
- **Wayland:** Limited – no standardized way to detect foreground apps (may require compositor-specific protocols)

**Current Status:** Fallback monitor returns mock data; Linux support is experimental.

---

### **Summary Comparison**

| Feature | macOS | Windows | Linux |
|---------|-------|---------|-------|
| **Frontmost App Detection** | ✅ Full | ✅ Full | ⚠️ X11 only |
| **Window Title Capture** | ✅ Full | ✅ Full | ⚠️ X11 only |
| **Idle Time Detection** | ✅ Full | ✅ Full | ⚠️ Limited |
| **Transparent Overlay** | ✅ Full | ✅ Full | ⚠️ Compositor-dependent |
| **Permissions Required** | Yes (Accessibility) | No | Varies |
| **Ready for Production** | ✅ Yes | 🔄 Testing | 🔄 Experimental |

---

### **Hardware Recommendations**

For **optimal performance** (since the app polls every 1 second and runs as an always-on-top overlay):

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **CPU** | Dual-core 1.5 GHz | Quad-core 2.0 GHz+ |
| **RAM** | 4 GB | 8 GB |
| **Storage** | HDD (any) | SSD (faster SQLite queries) |
| **Display** | 1280×720 | 1920×1080+ |

The app is lightweight (~20-50 MB RAM usage) thanks to Tauri's small footprint compared to Electron-based apps. SQLite is bundled, so no external database setup is needed.