// src/hooks/useTauriWindow.ts
// React hook and utilities for Tauri window management

import { tauriBridge } from '@/lib/tauri-bridge'

// Panel dimensions from UI Architecture doc
export const PANEL_DIMENSIONS = {
  hudOnly: { width: 320, height: 80 },
  calibration: { width: 700, height: 680 },
  preSession: { width: 640, height: 560 },
  reset: { width: 480, height: 440 },
  parkingLot: { width: 500, height: 590 },
  parkingLotHarvest: { width: 600, height: 690 },
  postSessionSummary: { width: 550, height: 540 },
  sessionReflection: { width: 520, height: 490 },
  intervention: { width: 400, height: 200 },
  flowCelebration: { width: 500, height: 240 },
} as const

export type PanelType = keyof typeof PANEL_DIMENSIONS

/**
 * Resize the window to fit the specified panel type.
 * If panel is null, resizes to HUD-only dimensions.
 */
export async function resizeForPanel(panel: PanelType | null): Promise<void> {
  const dims = panel ? PANEL_DIMENSIONS[panel] : PANEL_DIMENSIONS.hudOnly
  await tauriBridge.resizeWindow(dims.width, dims.height)
}

/**
 * Start dragging the window (call on mousedown of drag handle).
 * Used for frameless window dragging.
 */
export async function startDragging(): Promise<void> {
  await tauriBridge.startDragging()
}

/**
 * Get the current window size.
 */
export async function getWindowSize(): Promise<{ width: number; height: number }> {
  return tauriBridge.getWindowSize()
}

/**
 * Set the window position.
 */
export async function setWindowPosition(x: number, y: number): Promise<void> {
  await tauriBridge.setWindowPosition(x, y)
}

/**
 * Get the current window position.
 */
export async function getWindowPosition(): Promise<{ x: number; y: number }> {
  return tauriBridge.getWindowPosition()
}

/**
 * React hook for window management.
 * Provides panel resizing and window control functions.
 */
export function useTauriWindow() {
  return {
    resizeForPanel,
    startDragging,
    getWindowSize,
    setWindowPosition,
    getWindowPosition,
    PANEL_DIMENSIONS,
  }
}
