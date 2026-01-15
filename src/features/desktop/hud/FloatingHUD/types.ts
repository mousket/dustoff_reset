export type HUDMode = "idle" | "session" | "paused" | "not-calibrated" | "estimated" | "break"
export type SessionMode = "Zen" | "Flow" | "Legend"

export interface FloatingHUDProps {
  demo?: boolean
  isCalibratedToday: boolean
  bandwidthScore: number | null
  estimatedDelta?: number
  mode: HUDMode
  sessionMode?: SessionMode
  sessionTime?: number
  totalTime?: number  
  timeRemaining?: number
  isInFlow?: boolean // Added isInFlow prop for persistent flow indicator
  // Streak display
  streakCount?: number
  isStreakAtRisk?: boolean
  onStartCalibration: () => void
  onStartSession: () => void
  onPauseSession?: () => void
  onResumeSession?: () => void
  onStopSession?: () => void
  onOpenParkingLot: () => void
  onOpenHistory: () => void
  onOpenSettings: () => void
  onCalibrate?: () => void
  onReset?: () => void
}

export interface HUDState {
  isExpanded: boolean
  showTooltip: boolean
}
