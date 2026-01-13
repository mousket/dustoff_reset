export * from "./types"
export * from "./calibration"
export * from "./initial-bandwidth"
export * from "./session-bandwidth"
export * from "./storage"

import { loadDailyCalibration, type DailyCalibrationStorage } from "./storage"
import { calculateCalibrationScore } from "./calibration"

export interface BandwidthEngine {
  getTodaysCalibration: () => { calculatedBandwidth: number; data: DailyCalibrationStorage } | null
}

export function getBandwidthEngine(): BandwidthEngine {
  return {
    getTodaysCalibration: () => {
      const calibData = loadDailyCalibration()
      if (!calibData) return null

      // Calculate the calibration score from the stored data
      const calibrationScore = calculateCalibrationScore(calibData.calibrationData)

      return {
        calculatedBandwidth: calibrationScore.totalScore,
        data: calibData,
      }
    },
  }
}
