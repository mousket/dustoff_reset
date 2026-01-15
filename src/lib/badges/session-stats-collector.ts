import { SessionStatsForBadges } from './types'

interface SessionData {
  sessionId: string
  mode: string
  durationMinutes: number
  finalBandwidth: number
  completed: boolean
  quitEarly: boolean
}

interface TelemetryData {
  distractionCount: number
  delayGatesShown: number
  delayGatesReturned: number
  blocksShown: number
  extensionsSurvived: number
  totalPenalties: number
  totalBonuses: number
}

export function collectSessionStats(
  session: SessionData,
  telemetry: TelemetryData
): SessionStatsForBadges {
  return {
    sessionId: session.sessionId,
    mode: session.mode,
    durationMinutes: session.durationMinutes,
    finalBandwidth: Math.round(session.finalBandwidth),
    distractionCount: telemetry.distractionCount,
    delayGatesShown: telemetry.delayGatesShown,
    delayGatesReturned: telemetry.delayGatesReturned,
    blocksShown: telemetry.blocksShown,
    extensionsSurvived: telemetry.extensionsSurvived,
    totalPenalties: telemetry.totalPenalties,
    totalBonuses: telemetry.totalBonuses,
    completed: session.completed,
    quitEarly: session.quitEarly,
  }
}