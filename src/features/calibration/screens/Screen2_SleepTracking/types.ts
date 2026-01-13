export interface Screen2Props {
  onContinue: () => void
  onBack: () => void
  demo?: boolean
}

export interface SleepData {
  bedtime: string
  wakeTime: string
  startOfDay: string
  sleepSufficient: "yes" | "no" | "notSure" | ""
  restfulness: number
}
