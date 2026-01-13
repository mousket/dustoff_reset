import type { SleepData } from "./types"

export function validateSleepData(data: SleepData): boolean {
  return !!(data.bedtime && data.wakeTime && data.startOfDay && data.sleepSufficient)
}

export function getDefaultSleepData(): SleepData {
  return {
    bedtime: "22:00",
    wakeTime: "07:00",
    startOfDay: "08:00",
    sleepSufficient: "",
    restfulness: 3,
  }
}
