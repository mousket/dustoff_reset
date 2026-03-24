
# **12 - Implementation Roadmap**

**Version:** 1.0  
**Last Updated:** January 12, 2026  
**Purpose:** Complete implementation strategy and phased development plan for migrating Human Capacity OS from web prototype to native desktop application.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Current Status - Phase 1](#2-current-status---phase-1)
3. [Phase 2 - Desktop Migration](#3-phase-2---desktop-migration)
4. [Technical Stack Comparison](#4-technical-stack-comparison)
5. [5-Week Sprint Breakdown](#5-5-week-sprint-breakdown)
6. [Migration Strategy](#6-migration-strategy)
7. [Technical Debt & Priorities](#7-technical-debt--priorities)
8. [Testing & Validation](#8-testing--validation)
9. [Future Enhancements](#9-future-enhancements)
10. [Success Metrics](#10-success-metrics)

---

## 1. Overview

### 1.1 Project Vision

**Human Capacity OS** is a desktop application that helps knowledge workers manage cognitive bandwidth through biological calibration, real-time monitoring, and adaptive interventions.

**Core Philosophy:**
- Human capacity is NOT constant - it varies daily based on sleep, stress, and cognitive load
- Honest self-assessment enables realistic planning and achievable goals
- System-level monitoring provides objective feedback on focus patterns
- Adaptive interventions prevent burnout and optimize productivity

---

### 1.2 Development Phases

| Phase | Environment | Storage | Monitoring | Status |
|-------|-------------|---------|------------|--------|
| **Phase 1** | Web (Next.js) | localStorage/IndexedDB | UI-only, no system access | ✅ **COMPLETE** |
| **Phase 2** | Desktop (Tauri) | SQLite + file system | OS-level window/app tracking | 🔵 **PLANNED** |
| **Phase 3** | Desktop + Cloud | Cloud sync + local DB | Enhanced ML predictions | 🔲 Future |

---

## 2. Current Status - Phase 1

### 2.1 What's Built (Phase 1 - Web Prototype)

**Status:** ✅ **COMPLETE**  
**Live Demo:** https://vercel.com/architectsofthecloud-1644s-projects/v0-humancapacityos  
**Environment:** Browser-based Next.js application  
**Primary Purpose:** UI/UX validation and component library development

---

#### **✅ Completed Features**

**Core UI Components (40+ Components):**
- FloatingHUD (always-visible bandwidth display)
- DraggableContainer (movable panel container)
- All panels: PreSession, PostSession, Reset, Parking Lot, Calibration
- All overlays: Intervention, Flow Celebration, Overtime Nudge
- All modals: Interrupted Session, End Session, Ritual Selection

**Calibration System:**
- Daily calibration flow (sleep, emotional state, distractions)
- Pre-session calibration (intention setting, app whitelist)
- Workday boundary logic (5am reset, not midnight)
- Calibration persistence and validation

**Session Management:**
- Session timer with pause/resume
- Mode selection (Zen, Flow, Legend)
- Duration planning and tracking
- Victory level calculation (Legend, Good, Minimum, Missed)
- Session reflection and notes

**Parking Lot System:**
- Brain dump capture during sessions
- Parking lot review before sessions
- Harvest flow after sessions (categorize, tag, action)
- Item status tracking (new, in-progress, done)

**Bandwidth System (UI Only):**
- Visual bandwidth score display (0-100)
- Color-coded states (emerald, cyan, amber, red)
- Manual bandwidth adjustments (friction, focus-slipping buttons)
- Bandwidth history timeline

**Ritual System (UI Only):**
- Ritual selection panel (breath, walk, dump, personal)
- Countdown timers with animations
- Ritual completion tracking
- Integration with parking lot (dump ritual)

**Intervention System (UI Only):**
- Intervention overlay (friction, focus-slipping)
- Mode-specific messaging (Zen, Flow, Legend)
- Auto-dismiss countdowns
- Action button pathways to rituals

**Flow State Detection (UI Only):**
- Flow celebration overlay
- Persistent flow indicator on HUD
- Flow timeline tracking

---

#### **⚠️ Phase 1 Limitations**

**No System Monitoring:**
- Cannot detect actual app/window switching
- Cannot measure real input patterns (mouse, keyboard)
- No blacklist enforcement
- No background process monitoring

**Browser Storage Only:**
- All data in localStorage/IndexedDB
- 5-10MB storage limit
- No cross-device sync
- Data lost on browser clear

**No OS Integration:**
- Cannot block distracting apps/websites
- Cannot send system notifications
- Cannot run in background
- No window management

**Manual Bandwidth Control:**
- User must manually trigger friction/focus-slipping
- No automatic bandwidth decay (entropy)
- No real-time telemetry
- Relies entirely on user self-reporting

---

### 2.2 Current Tech Stack (Phase 1)

```
Frontend: Next.js 16 (App Router)
UI Library: React 19.2 (with canary features)
Styling: Tailwind CSS v4
Components: Radix UI primitives + shadcn/ui
TypeScript: Strict mode enabled
Storage: IndexedDB (via idb library)
Deployment: Vercel
Domain: v0-humancapacityos.vercel.app
```

---

### 2.3 File Structure (Phase 1)

```
/
├── app/
│   ├── calibration/          # Calibration ceremony page
│   ├── demo/                 # Demo pages for testing
│   ├── desktop/              # Main desktop application page
│   └── layout.tsx            # Root layout
│
├── components/
│   └── ui/                   # 40+ shadcn/ui components
│
├── features/
│   ├── calibration/          # Calibration screens
│   └── desktop/              # Desktop app features
│       ├── bandwidth-engine/ # Bandwidth calculations
│       ├── hud/              # FloatingHUD
│       ├── modals/           # Modal components
│       ├── overlays/         # Overlay components
│       └── panels/           # Panel components
│
├── lib/
│   ├── storage.ts            # localStorage wrappers
│   ├── session-storage.ts    # Session data persistence
│   ├── parking-lot-storage.ts# Parking lot data
│   └── types.ts              # Shared TypeScript types
│
├── data/
│   ├── bandwidth.json        # Default bandwidth data
│   └── parkingLot.json       # Default parking lot items
│
└── documentation/
    ├── README.md             # Documentation index
    ├── 01_frontend_component_registry.md
    ├── 02_frontend_process_flows.md
    ├── 03_tauri_bridge_api.md
    ├── 04_backend_process_architecture.md
    ├── 05_biological_core_math.md
    ├── 06_telemetry_and_penalties.md
    ├── 07_calibration_logic.md
    ├── 08_ritual_mechanics.md
    ├── 09_intervention_system.md
    ├── 10_data_models_and_storage.md
    └── 11_implementation_roadmap.md (this file)
```

---

## 3. Phase 2 - Desktop Migration

### 3.1 Objectives

**Primary Goal:** Migrate from browser-based web app to native desktop application with OS-level monitoring and intervention capabilities.

**Key Deliverables:**
1. Native desktop app (Windows, macOS, Linux)
2. Rust backend with SQLite database
3. System-level telemetry (window tracking, input monitoring)
4. Automatic bandwidth decay (entropy engine)
5. OS-level blocking (blacklist enforcement)
6. Background process monitoring
7. Native notifications
8. Window management

---

### 3.2 Architecture Changes

**Before (Phase 1):**
```
┌─────────────────────────┐
│  Next.js Web App        │
│  ┌─────────────────┐    │
│  │ React Frontend  │    │
│  │ (All Logic)     │    │
│  └────────┬────────┘    │
│           │             │
│  ┌────────▼────────┐    │
│  │ localStorage    │    │
│  └─────────────────┘    │
└─────────────────────────┘
```

**After (Phase 2):**
```
┌─────────────────────────────────────┐
│  Tauri Desktop App                  │
│  ┌─────────────────┐                │
│  │ React Frontend  │◄───Events──────┤
│  │ (UI Only)       │                │
│  └────────┬────────┘                │
│           │ IPC Commands            │
│  ┌────────▼────────────────────┐    │
│  │ Rust Backend                │    │
│  │ ┌──────────────────────┐    │    │
│  │ │ Business Logic       │    │    │
│  │ │ - Bandwidth Engine   │    │    │
│  │ │ - Telemetry          │    │    │
│  │ │ - Intervention Logic │    │    │
│  │ └──────────────────────┘    │    │
│  │ ┌──────────────────────┐    │    │
│  │ │ Background Threads   │    │    │
│  │ │ - Entropy Ticker     │    │    │
│  │ │ - Input Monitoring   │    │    │
│  │ │ - Window Tracking    │    │    │
│  │ └──────────────────────┘    │    │
│  │ ┌──────────────────────┐    │    │
│  │ │ OS Integration       │    │    │
│  │ │ - Window Manager     │    │    │
│  │ │ - App Blocker        │    │    │
│  │ │ - Notifications      │    │    │
│  │ └──────────────────────┘    │    │
│  └────────┬────────────────────┘    │
│           │                         │
│  ┌────────▼────────┐                │
│  │ SQLite Database │                │
│  └─────────────────┘                │
└─────────────────────────────────────┘
```

---

## 4. Technical Stack Comparison

| Aspect | Phase 1 (Web) | Phase 2 (Desktop) |
|--------|---------------|-------------------|
| **Frontend** | Next.js 16, React 19 | React 19 (via Tauri webview) |
| **Backend** | None (browser only) | Rust + Tauri |
| **Storage** | localStorage, IndexedDB | SQLite + file system |
| **IPC** | None | Tauri commands + events |
| **OS Access** | None (sandboxed browser) | Full system access |
| **Packaging** | Web bundle (Vercel) | Native executables (.exe, .app, .deb) |
| **Distribution** | URL link | Binary downloads |
| **Updates** | Instant (web deploy) | App update mechanism |
| **Performance** | Network dependent | Native performance |
| **Offline** | Limited (PWA) | Fully offline capable |

---

## 5. 5-Week Sprint Breakdown

### Sprint Overview

| Week | Phase | Focus | Deliverables |
|------|-------|-------|--------------|
| **1** | The Skeleton | Project structure + component migration | Tauri project, React components ported |
| **2** | The Spine | Rust backend + data models | State management, storage layer, mock commands |
| **3** | The Nerves | Frontend-backend communication | Tauri IPC, event system, bidirectional flow |
| **4** | The Brain | Core algorithms + background processes | Entropy decay, telemetry, calibration logic |
| **5** | The Muscles | OS integration + full system | Window monitoring, blocking, interventions |

---

### **Week 1: The Skeleton - Project Structure & Component Migration**

#### **Objectives:**
- Initialize Tauri project structure
- Migrate all React components from web prototype
- Establish build pipeline
- Verify compilation and hot-reload

#### **Tasks:**

**1.1 Initialize Tauri Project**
```bash
npm create tauri-app@latest
# Select: React + TypeScript template
# Project name: human-capacity-os
# Package manager: npm
```

**1.2 Project Structure Setup**
```
human-capacity-os/
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs         # Entry point
│   │   ├── commands/       # Tauri commands (empty for now)
│   │   ├── models/         # Data models (empty for now)
│   │   └── lib.rs          # Library module
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
│
└── src/                    # React frontend
    ├── components/         # Migrate from web app
    ├── features/           # Migrate from web app
    ├── lib/                # Migrate from web app
    ├── App.tsx             # Main app component
    └── main.tsx            # Entry point
```

**1.3 Copy Components from Phase 1**
- Copy entire `/components/ui/` folder (40+ shadcn components)
- Copy entire `/features/` folder
  - `/features/calibration/` (7 calibration screens)
  - `/features/desktop/` (HUD, panels, overlays, modals)
- Copy `/lib/` folder (types, storage wrappers - to be refactored later)

**1.4 Update Import Paths**
- Change all `@/` imports to relative paths or configure alias
- Update `tsconfig.json` with path mappings:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**1.5 Verify Build**
```bash
npm run tauri dev  # Should compile and open desktop window
```

#### **Deliverables:**
- ✅ Tauri project initialized
- ✅ All React components migrated
- ✅ Build pipeline functional
- ✅ App opens in desktop window (even if non-functional)

#### **Documentation Reference:**
- File 01 - Frontend Component Registry
- File 02 - Frontend Process Flows

---

### **Week 2: The Spine - Rust Backend & State Management**

#### **Objectives:**
- Define Rust data models
- Implement storage layer (SQLite or JSON files)
- Create mock Tauri commands for frontend testing
- Establish state management architecture

#### **Tasks:**

**2.1 Define Rust Data Models**

Create `src-tauri/src/models/mod.rs`:
```rust
pub mod calibration;
pub mod session;
pub mod parking_lot;
pub mod bandwidth;
pub mod user;
```

Create each model file:
```rust
// src-tauri/src/models/calibration.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CalibrationData {
    pub date: String,              // YYYY-MM-DD
    pub calibration_score: f32,    // 0-100
    pub sleep_hours: f32,
    pub sleep_quality: i32,
    pub emotional_residue: i32,
    pub emotional_state: String,
    pub distractions: Vec<String>,
    pub timestamp: i64,
}

// src-tauri/src/models/session.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionRecord {
    pub session_id: String,
    pub started_at: String,
    pub ended_at: String,
    pub planned_duration_minutes: i32,
    pub actual_duration_minutes: i32,
    pub mode: String,              // "Zen" | "Flow" | "Legend"
    pub victory_level: String,     // "Legend" | "Good" | "Minimum" | "Missed"
    pub flow_efficiency: f32,
    pub longest_streak_minutes: i32,
    pub distraction_attempts: i32,
    pub interventions_used: i32,
    pub end_reason: String,
}

// src-tauri/src/models/parking_lot.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParkingLotItem {
    pub id: String,
    pub text: String,
    pub timestamp: String,
    pub session_id: Option<String>,
    pub status: String,            // "OPEN" | "COMPLETED" | "DELETED"
    pub category: Option<String>,
    pub tags: Option<Vec<String>>,
    pub action: Option<String>,
}
```

**2.2 Storage Layer Implementation**

**Option A: JSON File Storage (Simple, Phase 2 MVP)**
```rust
// src-tauri/src/storage/json_store.rs
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

pub fn get_app_data_dir(app: &AppHandle) -> PathBuf {
    app.path_resolver()
        .app_data_dir()
        .expect("Failed to resolve app data directory")
}

pub fn save_calibration(app: &AppHandle, data: CalibrationData) -> Result<(), String> {
    let path = get_app_data_dir(app).join("calibration.json");
    let json = serde_json::to_string_pretty(&data)
        .map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn load_calibration(app: &AppHandle) -> Result<Option<CalibrationData>, String> {
    let path = get_app_data_dir(app).join("calibration.json");
    if !path.exists() {
        return Ok(None);
    }
    let json = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let data = serde_json::from_str(&json).map_err(|e| e.to_string())?;
    Ok(Some(data))
}
```

**Option B: SQLite (Production-Ready)**
```toml
# Cargo.toml
[dependencies]
rusqlite = { version = "0.29", features = ["bundled"] }
```

```rust
// src-tauri/src/storage/sqlite_store.rs
use rusqlite::{Connection, Result};

pub fn init_db(path: &str) -> Result<Connection> {
    let conn = Connection::open(path)?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS calibrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL UNIQUE,
            calibration_score REAL NOT NULL,
            sleep_hours REAL NOT NULL,
            sleep_quality INTEGER NOT NULL,
            emotional_residue INTEGER NOT NULL,
            emotional_state TEXT NOT NULL,
            distractions TEXT,
            timestamp INTEGER NOT NULL
        )",
        [],
    )?;
    
    // Create other tables (sessions, parking_lot_items, bandwidth_snapshots)
    
    Ok(conn)
}
```

**2.3 Mock Tauri Commands**

Create `src-tauri/src/commands/mod.rs`:
```rust
use tauri::State;
use crate::models::calibration::CalibrationData;

// Mock command - returns hardcoded data for now
#[tauri::command]
pub async fn get_calibration(date: String) -> Result<Option<CalibrationData>, String> {
    // TODO: Implement actual storage lookup
    Ok(None)
}

#[tauri::command]
pub async fn save_calibration(data: CalibrationData) -> Result<(), String> {
    // TODO: Implement actual storage save
    println!("[v0] Mock save_calibration: {:?}", data);
    Ok(())
}

#[tauri::command]
pub async fn get_bandwidth() -> Result<f32, String> {
    // TODO: Implement actual bandwidth calculation
    Ok(70.0)
}
```

Register commands in `main.rs`:
```rust
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::get_calibration,
            commands::save_calibration,
            commands::get_bandwidth,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**2.4 Frontend Integration (Mock Calls)**

Update frontend to call Tauri commands:
```typescript
// lib/tauri-api.ts
import { invoke } from '@tauri-apps/api/tauri'

export async function getCalibration(date: string) {
  return await invoke('get_calibration', { date })
}

export async function saveCalibration(data: CalibrationData) {
  return await invoke('save_calibration', { data })
}

export async function getBandwidth() {
  return await invoke('get_bandwidth')
}
```

#### **Deliverables:**
- ✅ All Rust data models defined
- ✅ Storage layer implemented (JSON or SQLite)
- ✅ Mock Tauri commands created
- ✅ Frontend can invoke commands (returns mock data)

#### **Documentation Reference:**
- File 10 - Data Models and Storage
- File 04 - Tauri Bridge API

---

### **Week 3: The Nerves - Frontend-Backend Communication**

#### **Objectives:**
- Implement all Tauri commands with real storage
- Build event emission system (backend → frontend)
- Test bidirectional communication
- Remove all localStorage dependencies

#### **Tasks:**

**3.1 Implement All Tauri Commands**

Complete all commands from File 04 specification:

**Calibration Commands:**
```rust
#[tauri::command]
pub async fn get_calibration(app: AppHandle, date: String) -> Result<Option<CalibrationData>, String> {
    storage::load_calibration(&app, &date)
}

#[tauri::command]
pub async fn save_calibration(app: AppHandle, data: CalibrationData) -> Result<(), String> {
    storage::save_calibration(&app, data)
}

#[tauri::command]
pub async fn has_calibrated_today(app: AppHandle) -> Result<bool, String> {
    let today = get_workday_date();
    let cal = storage::load_calibration(&app, &today)?;
    Ok(cal.is_some())
}
```

**Session Commands:**
```rust
#[tauri::command]
pub async fn start_session(app: AppHandle, data: SessionStartData) -> Result<String, String> {
    let session_id = uuid::Uuid::new_v4().to_string();
    let session = SessionRecord {
        session_id: session_id.clone(),
        started_at: chrono::Utc::now().to_rfc3339(),
        mode: data.mode,
        planned_duration_minutes: data.planned_duration_minutes,
        // ... initialize other fields
    };
    storage::save_session(&app, session)?;
    Ok(session_id)
}

#[tauri::command]
pub async fn get_active_session(app: AppHandle) -> Result<Option<SessionRecord>, String> {
    storage::get_active_session(&app)
}

#[tauri::command]
pub async fn end_session(app: AppHandle, session_id: String, end_data: SessionEndData) -> Result<(), String> {
    storage::update_session(&app, session_id, end_data)
}
```

**Parking Lot Commands:**
```rust
#[tauri::command]
pub async fn get_parking_lot_items(app: AppHandle) -> Result<Vec<ParkingLotItem>, String> {
    storage::load_parking_lot_items(&app)
}

#[tauri::command]
pub async fn add_parking_lot_item(app: AppHandle, text: String) -> Result<ParkingLotItem, String> {
    let item = ParkingLotItem {
        id: uuid::Uuid::new_v4().to_string(),
        text,
        timestamp: chrono::Utc::now().to_rfc3339(),
        status: "OPEN".to_string(),
        // ... other fields
    };
    storage::save_parking_lot_item(&app, &item)?;
    Ok(item)
}

#[tauri::command]
pub async fn update_parking_lot_item(app: AppHandle, id: String, updates: ParkingLotItemUpdate) -> Result<(), String> {
    storage::update_parking_lot_item(&app, id, updates)
}
```

**Bandwidth Commands:**
```rust
#[tauri::command]
pub async fn get_bandwidth(app: AppHandle) -> Result<f32, String> {
    storage::load_bandwidth(&app)
}

#[tauri::command]
pub async fn apply_bandwidth_penalty(app: AppHandle, penalty: f32, reason: String) -> Result<f32, String> {
    let current = storage::load_bandwidth(&app)?;
    let new_bandwidth = (current + penalty).max(0.0).min(100.0);
    storage::save_bandwidth(&app, new_bandwidth)?;
    Ok(new_bandwidth)
}
```

**3.2 Event Emission System**

Implement backend → frontend events:

```rust
use tauri::{Manager, Window};

pub fn emit_bandwidth_changed(window: &Window, new_bandwidth: f32) -> Result<(), String> {
    window.emit("bandwidth-changed", new_bandwidth)
        .map_err(|e| e.to_string())
}

pub fn emit_intervention_triggered(window: &Window, intervention_type: String) -> Result<(), String> {
    window.emit("intervention-triggered", intervention_type)
        .map_err(|e| e.to_string())
}

pub fn emit_flow_state_changed(window: &Window, is_active: bool) -> Result<(), String> {
    window.emit("flow-state-changed", is_active)
        .map_err(|e| e.to_string())
}
```

**3.3 Frontend Event Listeners**

Update React components to listen for events:

```typescript
// lib/tauri-events.ts
import { listen } from '@tauri-apps/api/event'

export function setupEventListeners(callbacks: {
  onBandwidthChanged: (bandwidth: number) => void
  onInterventionTriggered: (type: string) => void
  onFlowStateChanged: (isActive: boolean) => void
}) {
  listen('bandwidth-changed', (event) => {
    callbacks.onBandwidthChanged(event.payload as number)
  })
  
  listen('intervention-triggered', (event) => {
    callbacks.onInterventionTriggered(event.payload as string)
  })
  
  listen('flow-state-changed', (event) => {
    callbacks.onFlowStateChanged(event.payload as boolean)
  })
}
```

**3.4 Remove localStorage Dependencies**

Replace all `localStorage` calls with Tauri commands:

```typescript
// Before (Phase 1)
localStorage.setItem('calibration', JSON.stringify(data))

// After (Phase 2)
await invoke('save_calibration', { data })
```

Search for all instances:
```bash
grep -r "localStorage" src/
# Replace each with appropriate Tauri command
```

#### **Deliverables:**
- ✅ All Tauri commands implemented with real storage
- ✅ Event emission system functional
- ✅ Frontend listens to backend events
- ✅ All localStorage calls replaced
- ✅ Bidirectional communication verified

#### **Documentation Reference:**
- File 04 - Tauri Bridge API

---

### **Week 4: The Brain - Core Algorithms & Background Processes**

#### **Objectives:**
- Implement entropy decay logic (passive bandwidth drain)
- Build background ticker thread
- Implement telemetry collection
- Integrate calibration system with bandwidth calculations

#### **Tasks:**

**4.1 Entropy Decay Engine**

Implement the core bandwidth decay algorithm:

```rust
// src-tauri/src/bandwidth/entropy.rs
use std::time::{Duration, Instant};

const ENTROPY_DECAY_RATE: f32 = 0.05; // 5% per hour

pub struct EntropyEngine {
    last_tick: Instant,
    current_bandwidth: f32,
}

impl EntropyEngine {
    pub fn new(initial_bandwidth: f32) -> Self {
        Self {
            last_tick: Instant::now(),
            current_bandwidth: initial_bandwidth,
        }
    }
    
    pub fn tick(&mut self) -> f32 {
        let now = Instant::now();
        let elapsed = now.duration_since(self.last_tick).as_secs_f32();
        
        // Apply entropy decay: bandwidth(t) = bandwidth(t-1) * (1 - 0.05 * dt/3600)
        let decay_factor = 1.0 - (ENTROPY_DECAY_RATE * elapsed / 3600.0);
        self.current_bandwidth = (self.current_bandwidth * decay_factor).max(0.0);
        
        self.last_tick = now;
        self.current_bandwidth
    }
    
    pub fn apply_penalty(&mut self, penalty: f32) -> f32 {
        self.current_bandwidth = (self.current_bandwidth + penalty).max(0.0).min(100.0);
        self.current_bandwidth
    }
    
    pub fn apply_restoration(&mut self, restoration: f32) -> f32 {
        self.current_bandwidth = (self.current_bandwidth + restoration).max(0.0).min(100.0);
        self.current_bandwidth
    }
}
```

**4.2 Background Ticker Thread**

Create a background thread that runs continuously:

```rust
// src-tauri/src/background/ticker.rs
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Manager};

pub fn start_entropy_ticker(app: AppHandle, engine: Arc<Mutex<EntropyEngine>>) {
    thread::spawn(move || {
        loop {
            thread::sleep(Duration::from_secs(60)); // Tick every 60 seconds
            
            let new_bandwidth = {
                let mut engine = engine.lock().unwrap();
                engine.tick()
            };
            
            // Emit bandwidth changed event to frontend
            if let Some(window) = app.get_window("main") {
                let _ = window.emit("bandwidth-changed", new_bandwidth);
            }
            
            println!("[v0] Entropy tick: bandwidth = {:.2}", new_bandwidth);
        }
    });
}
```

Start ticker on app initialization:

```rust
// main.rs
fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let initial_bandwidth = 70.0; // TODO: Load from calibration
            let engine = Arc::new(Mutex::new(EntropyEngine::new(initial_bandwidth)));
            
            // Start background ticker
            start_entropy_ticker(app.handle(), engine.clone());
            
            // Store engine in app state for command access
            app.manage(engine);
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // ... commands
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**4.3 Telemetry Collection (Basic)**

Implement window focus tracking:

```rust
// src-tauri/src/telemetry/window_monitor.rs
use std::time::Instant;

pub struct WindowMonitor {
    last_switch: Instant,
    switch_count: u32,
    current_window: Option<String>,
}

impl WindowMonitor {
    pub fn new() -> Self {
        Self {
            last_switch: Instant::now(),
            switch_count: 0,
            current_window: None,
        }
    }
    
    pub fn record_window_switch(&mut self, window_name: String) -> bool {
        let now = Instant::now();
        let elapsed = now.duration_since(self.last_switch).as_secs();
        
        // Check for burst switching (>5 switches in 60 seconds)
        if elapsed < 60 {
            self.switch_count += 1;
            if self.switch_count > 5 {
                // Trigger intervention
                return true;
            }
        } else {
            self.switch_count = 1;
        }
        
        self.last_switch = now;
        self.current_window = Some(window_name);
        false
    }
}
```

**4.4 Calibration Integration**

Implement initial bandwidth calculation from calibration:

```rust
// src-tauri/src/bandwidth/calibration.rs
use crate::models::calibration::CalibrationData;

pub fn calculate_initial_bandwidth(calibration: &CalibrationData) -> f32 {
    let mut bandwidth = 0.0;
    
    // Sleep score (0-40 points)
    let sleep_score = calculate_sleep_score(calibration.sleep_hours, calibration.sleep_quality);
    bandwidth += sleep_score;
    
    // Emotional score (0-40 points)
    let emotional_score = calculate_emotional_score(
        calibration.emotional_residue,
        &calibration.emotional_state
    );
    bandwidth += emotional_score;
    
    // Distraction score (0-20 points)
    let distraction_score = calculate_distraction_score(&calibration.distractions);
    bandwidth += distraction_score;
    
    bandwidth.max(0.0).min(100.0)
}

fn calculate_sleep_score(hours: f32, quality: i32) -> f32 {
    let hours_score = if hours >= 7.0 && hours <= 9.0 {
        25.0
    } else if hours == 6.0 || hours == 10.0 {
        20.0
    } else if hours == 5.0 || hours == 11.0 {
        12.0
    } else {
        5.0
    };
    
    let quality_score = if quality >= 8 {
        15.0
    } else if quality >= 6 {
        10.0
    } else if quality >= 4 {
        5.0
    } else {
        2.0
    };
    
    hours_score + quality_score
}

fn calculate_emotional_score(residue: i32, state: &str) -> f32 {
    let residue_score = if residue <= 3 {
        20.0
    } else if residue <= 5 {
        15.0
    } else if residue <= 7 {
        8.0
    } else {
        3.0
    };
    
    let state_score = match state {
        "Energized" => 20.0,
        "Focused" => 18.0,
        "Calm" => 15.0,
        "Tired" => 8.0,
        "Anxious" => 5.0,
        "Scattered" => 3.0,
        _ => 10.0,
    };
    
    residue_score + state_score
}

fn calculate_distraction_score(distractions: &[String]) -> f32 {
    match distractions.len() {
        0 => 20.0,
        1 => 16.0,
        2 => 12.0,
        3 => 8.0,
        4 => 5.0,
        _ => 2.0,
    }
}
```

#### **Deliverables:**
- ✅ Entropy decay engine implemented
- ✅ Background ticker thread running
- ✅ Basic telemetry collection (window tracking)
- ✅ Calibration → initial bandwidth calculation
- ✅ Backend continuously updates bandwidth

#### **Documentation Reference:**
- File 05 - Biological Core Math
- File 07 - Calibration Logic
- File 06 - Telemetry and Penalties

---

### **Week 5: The Muscles - OS Integration & Full System**

#### **Objectives:**
- Implement OS-level window monitoring
- Build intervention detection and triggering
- Implement ritual mechanics with validation
- Add mode-based blocking logic

#### **Tasks:**

**5.1 Window Monitoring (Platform-Specific)**

**macOS:**
```rust
// Cargo.toml
[target.'cfg(target_os = "macos")'.dependencies]
cocoa = "0.25"
objc = "0.2"
```

```rust
// src-tauri/src/os/macos.rs
use cocoa::appkit::NSWorkspace;
use cocoa::base::{id, nil};
use objc::{class, msg_send, sel, sel_impl};

pub fn get_active_window() -> Option<String> {
    unsafe {
        let workspace: id = msg_send![class!(NSWorkspace), sharedWorkspace];
        let app: id = msg_send![workspace, frontmostApplication];
        let name: id = msg_send![app, localizedName];
        
        if name == nil {
            return None;
        }
        
        let c_str = msg_send![name, UTF8String];
        Some(std::ffi::CStr::from_ptr(c_str).to_string_lossy().to_string())
    }
}
```

**Windows:**
```rust
// Cargo.toml
[target.'cfg(target_os = "windows")'.dependencies]
winapi = { version = "0.3", features = ["winuser", "processthreadsapi", "psapi"] }
```

```rust
// src-tauri/src/os/windows.rs
use winapi::um::winuser::{GetForegroundWindow, GetWindowTextW};

pub fn get_active_window() -> Option<String> {
    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd.is_null() {
            return None;
        }
        
        let mut buffer = [0u16; 512];
        GetWindowTextW(hwnd, buffer.as_mut_ptr(), buffer.len() as i32);
        
        let title = String::from_utf16_lossy(&buffer);
        Some(title.trim_end_matches('\0').to_string())
    }
}
```

**5.2 Intervention Detection**

Implement automatic intervention triggering:

```rust
// src-tauri/src/intervention/detector.rs
pub struct InterventionDetector {
    bandwidth_threshold_friction: f32,     // 60.0
    bandwidth_threshold_focus_slip: f32,   // 50.0
}

impl InterventionDetector {
    pub fn check_triggers(&self, bandwidth: f32, window_monitor: &WindowMonitor) -> Option<InterventionType> {
        // Check bandwidth thresholds
        if bandwidth < self.bandwidth_threshold_focus_slip {
            return Some(InterventionType::FocusSlipping);
        }
        if bandwidth < self.bandwidth_threshold_friction {
            return Some(InterventionType::Friction);
        }
        
        // Check burst switching
        if window_monitor.detect_burst() {
            return Some(InterventionType::TabSwitch);
        }
        
        None
    }
}

pub enum InterventionType {
    Friction,
    FocusSlipping,
    NonWhitelistedApp,
    TabSwitch,
}
```

**5.3 Ritual Mechanics**

Implement ritual validation:

```rust
// src-tauri/src/ritual/validator.rs
pub struct RitualValidator {
    ritual_type: RitualType,
    start_time: Instant,
    required_duration: Duration,
}

impl RitualValidator {
    pub fn new(ritual_type: RitualType) -> Self {
        let required_duration = match ritual_type {
            RitualType::Breath => Duration::from_secs(120),  // 2 min
            RitualType::Walk => Duration::from_secs(300),    // 5 min
            RitualType::Dump => Duration::from_secs(180),    // 3 min
            RitualType::Personal => Duration::from_secs(240), // 4 min
        };
        
        Self {
            ritual_type,
            start_time: Instant::now(),
            required_duration,
        }
    }
    
    pub fn is_complete(&self) -> bool {
        self.start_time.elapsed() >= self.required_duration
    }
    
    pub fn get_restoration_value(&self) -> f32 {
        match self.ritual_type {
            RitualType::Breath => 5.0,
            RitualType::Walk => 7.5,
            RitualType::Dump => 6.0,
            RitualType::Personal => 0.0,
        }
    }
}
```

**5.4 App Blocking (Legend Mode)**

Implement blacklist enforcement:

```rust
// src-tauri/src/blocking/blocker.rs
pub struct AppBlocker {
    blacklist: Vec<String>,
    mode: SessionMode,
}

impl AppBlocker {
    pub fn should_block(&self, app_name: &str) -> bool {
        if self.mode != SessionMode::Legend {
            return false; // Only block in Legend mode
        }
        
        self.blacklist.iter().any(|blocked| app_name.contains(blocked))
    }
    
    pub fn block_app(&self, app_name: &str) -> Result<(), String> {
        // Platform-specific app blocking
        #[cfg(target_os = "macos")]
        {
            // Use AppleScript to close app
            std::process::Command::new("osascript")
                .arg("-e")
                .arg(format!("tell application \"{}\" to quit", app_name))
                .output()
                .map_err(|e| e.to_string())?;
        }
        
        #[cfg(target_os = "windows")]
        {
            // Use taskkill
            std::process::Command::new("taskkill")
                .arg("/IM")
                .arg(format!("{}.exe", app_name))
                .arg("/F")
                .output()
                .map_err(|e| e.to_string())?;
        }
        
        Ok(())
    }
}
```

**5.5 Integration Testing**

Test full system integration:

```rust
// src-tauri/src/tests/integration_test.rs
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_full_session_flow() {
        // 1. Load calibration
        let calibration = load_test_calibration();
        let initial_bandwidth = calculate_initial_bandwidth(&calibration);
        assert_eq!(initial_bandwidth, 85.0);
        
        // 2. Start session
        let mut engine = EntropyEngine::new(initial_bandwidth);
        
        // 3. Simulate 30 minutes passing
        thread::sleep(Duration::from_secs(1800));
        let bandwidth_after_decay = engine.tick();
        assert!(bandwidth_after_decay < initial_bandwidth);
        
        // 4. Apply context switch penalty
        engine.apply_penalty(-15.0);
        
        // 5. Check intervention trigger
        let detector = InterventionDetector::new();
        let intervention = detector.check_triggers(engine.current_bandwidth, &WindowMonitor::new());
        assert!(intervention.is_some());
        
        // 6. Complete ritual
        engine.apply_restoration(7.5);
        assert!(engine.current_bandwidth > 60.0);
    }
}
```

#### **Deliverables:**
- ✅ OS-level window monitoring implemented
- ✅ Intervention detection automatic
- ✅ Ritual validation functional
- ✅ App blocking (Legend mode) operational
- ✅ Full system integration tested

#### **Documentation Reference:**
- File 09 - Intervention System
- File 08 - Ritual Mechanics
- File 06 - Telemetry and Penalties

---

## 6. Migration Strategy

### 6.1 Data Migration from Web to Desktop

**Export from Web Version:**
```typescript
// Run in browser console on web version
function exportAllData() {
  const data = {
    calibration: localStorage.getItem('dustoff_daily_calibration'),
    sessions: localStorage.getItem('dustoff_sessions'),
    parkingLot: localStorage.getItem('dustoff_parking_lot'),
    user: localStorage.getItem('dustoff_user'),
  }
  
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'hcos-export.json'
  a.click()
}

exportAllData()
```

**Import to Desktop Version:**
```rust
// src-tauri/src/migration/import.rs
#[tauri::command]
pub async fn import_web_data(app: AppHandle, json_data: String) -> Result<(), String> {
    let data: WebExportData = serde_json::from_str(&json_data)
        .map_err(|e| e.to_string())?;
    
    // Import calibration
    if let Some(cal_str) = data.calibration {
        let cal: CalibrationData = serde_json::from_str(&cal_str)
            .map_err(|e| e.to_string())?;
        storage::save_calibration(&app, cal)?;
    }
    
    // Import sessions
    if let Some(sessions_str) = data.sessions {
        let sessions: Vec<SessionRecord> = serde_json::from_str(&sessions_str)
            .map_err(|e| e.to_string())?;
        for session in sessions {
            storage::save_session(&app, session)?;
        }
    }
    
    // Import parking lot
    if let Some(parking_str) = data.parking_lot {
        let items: Vec<ParkingLotItem> = serde_json::from_str(&parking_str)
            .map_err(|e| e.to_string())?;
        for item in items {
            storage::save_parking_lot_item(&app, &item)?;
        }
    }
    
    Ok(())
}
```

### 6.2 Backward Compatibility

Maintain web version during transition:
- Keep web app deployed on Vercel
- Add banner: "Desktop app now available with OS-level features"
- Provide export tool for data migration
- Archive web version after 3 months

---

## 7. Technical Debt & Priorities

### 7.1 Current Technical Debt (Phase 1)

**CRITICAL:**
- ❌ No actual system monitoring (all UI mocks)
- ❌ No bandwidth decay engine
- ❌ No OS integration
- ❌ localStorage size limits

**HIGH:**
- ⚠️ Manual bandwidth adjustments (user must click friction/focus-slipping)
- ⚠️ No cross-device sync
- ⚠️ No data backup/restore
- ⚠️ Incomplete error handling

**MEDIUM:**
- ⚠️ No analytics or insights
- ⚠️ Limited session history UI
- ⚠️ No customization options
- ⚠️ Basic parking lot features

### 7.2 Phase 2 Priorities

**Sprint 1 (Week 1) - CRITICAL:**
- ✅ Project initialization
- ✅ Component migration
- ✅ Build pipeline

**Sprint 2 (Week 2) - CRITICAL:**
- ✅ Data models
- ✅ Storage layer
- ✅ Mock commands

**Sprint 3 (Week 3) - CRITICAL:**
- ✅ Tauri IPC
- ✅ Event system
- ✅ Remove localStorage

**Sprint 4 (Week 4) - HIGH:**
- ✅ Entropy decay
- ✅ Background threads
- ✅ Calibration integration

**Sprint 5 (Week 5) - HIGH:**
- ✅ OS monitoring
- ✅ Interventions
- ✅ Blocking

---

## 8. Testing & Validation

### 8.1 Unit Tests

**Rust Backend:**
```bash
cd src-tauri
cargo test
```

Test coverage:
- Bandwidth calculations
- Calibration scoring
- Entropy decay formulas
- Intervention triggers
- Storage operations

**Frontend:**
```bash
npm run test
```

Test coverage:
- Component rendering
- State management
- IPC command calls
- Event listeners

### 8.2 Integration Tests

**End-to-End Session Flow:**
1. Start app → Calibration → 85% bandwidth
2. Start 45-minute session
3. Monitor bandwidth decay (60s ticks)
4. Trigger context switch → -15 points
5. Intervention overlay appears
6. Complete walk ritual → +7.5 points
7. End session → Debrief panel
8. Review session data

**Cross-Platform Testing:**
- macOS (primary development)
- Windows (secondary)
- Linux (tertiary)

### 8.3 Performance Benchmarks

**Targets:**
- App startup: <2 seconds
- Command latency: <50ms
- Event emission: <10ms
- Bandwidth tick interval: 60s ±1s
- Memory usage: <100MB idle, <200MB active
- CPU usage: <2% idle, <5% active

---

## 9. Future Enhancements

### 9.1 Phase 3 - Cloud Sync

**Features:**
- Multi-device synchronization
- Cloud backup
- Cross-platform data access
- Team collaboration features

**Tech Stack:**
- Backend: Rust (Actix Web or Axum)
- Database: PostgreSQL
- Hosting: AWS, Azure, or DigitalOcean
- Authentication: OAuth 2.0

### 9.2 Advanced Analytics

**Features:**
- Bandwidth trends over time
- Optimal session duration recommendations
- Flow state pattern analysis
- Productivity insights

**Implementation:**
- Time-series database (InfluxDB or TimescaleDB)
- ML models for predictions (Python + TensorFlow)
- Data visualization (Recharts or D3.js)

### 9.3 Mobile Companion App

**Features:**
- Remote session monitoring
- Quick parking lot capture
- Session notifications
- Daily calibration reminders

**Tech Stack:**
- React Native or Flutter
- Push notifications (Firebase)
- Mobile database (SQLite or Realm)

### 9.4 Browser Extension

**Features:**
- Website blocking (Legend mode)
- Tab management (focus mode)
- Time tracking per site
- Integration with desktop app

**Tech Stack:**
- TypeScript
- WebExtensions API
- Chrome/Firefox/Safari support

---

## 10. Success Metrics

### 10.1 Development Metrics

- ✅ All 11 documentation files complete
- ✅ Phase 1 (web prototype) functional
- 🔲 Phase 2 (desktop app) functional
- 🔲 All Tauri commands implemented
- 🔲 Background processes running
- 🔲 OS integration functional

### 10.2 Quality Metrics

- 🔲 Unit test coverage: >80%
- 🔲 Integration tests: All major flows covered
- 🔲 Zero critical bugs in production
- 🔲 Performance targets met (see 8.3)

### 10.3 User Experience Metrics

- 🔲 App startup time: <2 seconds
- 🔲 Bandwidth accuracy: Validated against self-reports
- 🔲 Intervention effectiveness: >70% acceptance rate
- 🔲 Data migration success: 100% accuracy

---

**End of Implementation Roadmap**

---


This document provides a complete 5-week sprint plan for migrating Human Capacity OS from a web prototype to a native desktop application using Tauri. It includes detailed technical specifications, code examples, testing strategies, and success criteria for each phase of development.