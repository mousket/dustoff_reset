// Development utilities for testing
import { tauriBridge } from './tauri-bridge'

// Clear today's calibration to force re-calibration
export async function clearTodayCalibration() {
  await tauriBridge.clearCalibration()
  console.log('✅ Calibration cleared - restart app to see calibration screen')
}

// Reset all data (calibrations, sessions, reflections, parking lot)
export async function resetAllData() {
  await tauriBridge.resetAllData()
  console.log('✅ All data reset - restart app for fresh start')
}

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).devUtils = {
    clearTodayCalibration,
    resetAllData,
  }
}
