export interface PostSessionSummaryProps {
  isOpen: boolean
  onClose: () => void
  onContinue: () => void
  sessionData: SessionSummaryData
}

export interface SessionSummaryData {
  sessionId: string
  duration: number
  initialBandwidth: number
  finalBandwidth: number
  bandwidthHistory: BandwidthPoint[]
  metrics: SessionMetrics
  victoryLevel: "Minimum" | "Good" | "Legend" | "Missed"
}

export interface BandwidthPoint {
  timestamp: number
  value: number
  event?: string
}

export interface SessionMetrics {
  focusTime: number
  distractionCount: number
  interventionCount: number
  resetCount: number
  flowStreakMinutes: number
  longestFlowStreak: number
  parkingLotItemsCaptured: number
}
