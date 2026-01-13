export interface DailyCalibrationStorage {
  date: string
  calibrationScore: number
  calibrationData: {
    sleepHours: number
    sleepQuality: number
    emotionalResidue: number
    emotionalState: string
    distractions: string[]
  }
  timestamp: number
}

const CALIBRATION_KEY = "dustoff_daily_calibration"

function getWorkdayDate(): string {
  const now = new Date()
  const hours = now.getHours()

  // If it's before 5am, use yesterday's date (still the same workday)
  if (hours < 5) {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toLocaleDateString("en-CA") // YYYY-MM-DD format
  }

  return now.toLocaleDateString("en-CA") // YYYY-MM-DD format
}

export function saveDailyCalibration(data: DailyCalibrationStorage): void {
  try {
    localStorage.setItem(CALIBRATION_KEY, JSON.stringify(data))
  } catch (error) {
    console.error("[Dustoff] Failed to save calibration:", error)
  }
}

export function loadDailyCalibration(): DailyCalibrationStorage | null {
  try {
    const stored = localStorage.getItem(CALIBRATION_KEY)
    if (!stored) return null

    const data: DailyCalibrationStorage = JSON.parse(stored)
    const today = getWorkdayDate()

    if (data.date !== today) {
      localStorage.removeItem(CALIBRATION_KEY)
      return null
    }

    return data
  } catch (error) {
    console.error("[v0] Failed to load calibration:", error)
    return null
  }
}

export function hasCalibratedToday(): boolean {
  return loadDailyCalibration() !== null
}

export function clearDailyCalibration(): void {
  try {
    localStorage.removeItem(CALIBRATION_KEY)
  } catch (error) {
    console.error("[Dustoff] Failed to clear calibration:", error)
  }
}
