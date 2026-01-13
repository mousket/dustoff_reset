export interface CalibrationData {
  sleepHours: number
  sleepQuality: number
  emotionalResidue: number
  emotionalState: string
  distractions: string[]
}

export interface PreSessionData {
  sessionType: "deep" | "parking-lot" | "administrative"
  mode?: "Zen" | "Flow" | "Legend"
  duration?: number
  preparationMinutes?: number
  preparationChecklist?: string[]
  emotionalGrounding?: number
  whitelistedApps?: string[]
  whitelistedBrowser?: string
  whitelistedTabs?: string[]
}

export interface CalibrationScore {
  sleepScore: number
  emotionalScore: number
  distractionScore: number
  totalScore: number
  timestamp: number
}

export interface InitialBandwidth {
  baseCalibrationScore: number
  modeModifier: number
  prepModifier: number
  whitelistModifier: number
  totalBandwidth: number
  timestamp: number
}
