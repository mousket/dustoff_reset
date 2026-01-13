// src/lib/tauri-bridge.ts
// Type-safe wrappers for all Tauri commands
// This provides a clean API for React components to interact with the Rust backend

import { invoke } from '@tauri-apps/api/core'
import type {
  CalibrationData,
  SessionRecord,
  ReflectionObject,
  ParkingLotItem,
  ParkingLotItemUpdate,
  RecoveryData,
  UserData,
} from './tauri-types'

export const tauriBridge = {
  // ============================================
  // CALIBRATION
  // ============================================

  saveCalibration: (data: CalibrationData): Promise<void> =>
    invoke('save_calibration', { data }),

  loadCalibration: (): Promise<CalibrationData | null> =>
    invoke('load_calibration'),

  clearCalibration: (): Promise<void> =>
    invoke('clear_calibration'),

  // ============================================
  // SESSION
  // ============================================

  saveSession: (session: SessionRecord): Promise<void> =>
    invoke('save_session', { session }),

  getSession: (sessionId: string): Promise<SessionRecord | null> =>
    invoke('get_session', { sessionId }),

  getAllSessions: (startDate?: string, endDate?: string): Promise<SessionRecord[]> =>
    invoke('get_all_sessions', { startDate, endDate }),

  // ============================================
  // REFLECTION
  // ============================================

  saveReflection: (reflection: ReflectionObject): Promise<void> =>
    invoke('save_reflection', { reflection }),

  getReflection: (sessionId: string): Promise<ReflectionObject | null> =>
    invoke('get_reflection', { sessionId }),

  // ============================================
  // RECOVERY
  // ============================================

  saveRecoveryData: (data: RecoveryData): Promise<void> =>
    invoke('save_recovery_data', { data }),

  getRecoveryData: (): Promise<RecoveryData | null> =>
    invoke('get_recovery_data'),

  clearRecoveryData: (): Promise<void> =>
    invoke('clear_recovery_data'),

  // ============================================
  // PARKING LOT
  // ============================================

  addParkingLotItem: (text: string): Promise<ParkingLotItem> =>
    invoke('add_parking_lot_item', { text }),

  updateParkingLotItem: (id: string, updates: ParkingLotItemUpdate): Promise<void> =>
    invoke('update_parking_lot_item', { id, updates }),

  getActiveParkingLotItems: (): Promise<ParkingLotItem[]> =>
    invoke('get_active_parking_lot_items'),

  getNextSessionItems: (): Promise<ParkingLotItem[]> =>
    invoke('get_next_session_items'),

  deleteParkingLotItem: (id: string): Promise<void> =>
    invoke('delete_parking_lot_item', { id }),

  // ============================================
  // USER
  // ============================================

  saveUser: (
    email?: string,
    firstName?: string,
    operatorName?: string,
    defaultMode?: string
  ): Promise<void> =>
    invoke('save_user', { email, firstName, operatorName, defaultMode }),

  getUser: (): Promise<UserData | null> =>
    invoke('get_user'),

  // ============================================
  // UTILITIES
  // ============================================

  getWorkdayDate: (): Promise<string> =>
    invoke('get_workday_date'),

  generateUuid: (): Promise<string> =>
    invoke('generate_uuid'),

  // ============================================
  // WINDOW (from Day 1)
  // ============================================

  resizeWindow: (width: number, height: number): Promise<void> =>
    invoke('resize_window', { width, height }),

  getWindowSize: (): Promise<{ width: number; height: number }> =>
    invoke('get_window_size'),

  startDragging: (): Promise<void> =>
    invoke('start_dragging'),

  setWindowPosition: (x: number, y: number): Promise<void> =>
    invoke('set_window_position', { x, y }),

  getWindowPosition: (): Promise<{ x: number; y: number }> =>
    invoke('get_window_position'),

  // ============================================
  // DATA MANAGEMENT
  // ============================================

  resetAllData: (): Promise<void> =>
    invoke('reset_all_data'),
}

// Re-export types for convenience
export type {
  CalibrationData,
  SessionRecord,
  ReflectionObject,
  ParkingLotItem,
  ParkingLotItemUpdate,
  RecoveryData,
  UserData,
  TimelineBlock,
  TimelineState,
  DistractionEvent,
  InterventionEvent,
  WhitelistedApp,
  WhitelistedTab,
  SessionMode,
  VictoryLevel,
  EndReason,
  ParkingLotStatus,
  ItemStatus,
  ItemCategory,
  ItemAction,
} from './tauri-types'
