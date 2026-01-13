export type Mode = "ZEN" | "LEGEND" | "FLOW"
export type SessionStatus = "ACTIVE" | "COMPLETED" | "FAILED" | "ABANDONED"
export type SessionResult = "SUCCESS" | "FAILED" | "ABANDONED"
export type LegendState = "ACTIVE" | "AT_RISK" | "FAILED"
export type EventType =
  | "SESSION_STARTED"
  | "SESSION_ENDED"
  | "FLOW_STARTED"
  | "FLOW_ENDED"
  | "DRIFT_DETECTED"
  | "DISTRACTION_DETECTED"
  | "PARKING_LOT_CAPTURE"
  | "INTERVENTION_TRIGGERED"
  | "INTERVENTION_ACCEPTED"
  | "INTERVENTION_IGNORED"
  | "BANDWIDTH_CHANGED"
  | "LEGEND_WARNING"
  | "LEGEND_FAILURE"

export type BandwidthSource =
  | "PRE_SESSION"
  | "DURING_SESSION"
  | "POST_SESSION"
  | "INTERVENTION"
  | "FLOW"
  | "DRIFT"
  | "FRICTION"

export type FrictionType = "KEYBOARD" | "MOUSE" | "CURSOR"

export interface AppWhitelist {
  appName: string
  purpose: "Primary Work" | "Research/Reference" | "Communication" | "Ambient Support" | "Learning/Tutorial" | "Other"
}

export interface BrowserTabIntent {
  url: string
  title: string
  purpose: "Primary Work" | "Research/Reference" | "Ambient Support" | "Learning/Tutorial" | "Communication" | "Other"
}

export interface ExpectedDistraction {
  type: string
  description?: string
}

export interface SessionEvent {
  id: string
  sessionId: string
  type: EventType
  timestamp: string
  metadata?: Record<string, any>
}

export interface FlowSegment {
  id: string
  sessionId: string
  startTime: string
  endTime: string | null
  durationMinutes: number
  appName: string
  depth: 1 | 2 | 3
}

export interface CognitiveFrictionEvent {
  id: string
  sessionId: string
  type: FrictionType
  timestamp: string
  intensity: 1 | 2 | 3 | 4 | 5
  duration: number
  context?: string
}

export interface BandwidthSnapshot {
  timestamp: string
  score: number
  source: BandwidthSource
  reason?: string
}

export interface ShockMirrorReport {
  sessionId: string
  timeline: Array<{
    minute: number
    state: "FOCUSED" | "DRIFTING" | "DISTRACTED" | "FLOW" | "IDLE"
    app?: string
    details?: string
  }>
  flowMap: {
    totalMinutes: number
    segments: FlowSegment[]
    breakReasons: string[]
  }
  driftMap: {
    events: Array<{
      timestamp: string
      type: "APP" | "TAB" | "IDLE" | "DISTRACTION"
      details: string
    }>
  }
  frictionMap: {
    events: CognitiveFrictionEvent[]
    clusters: Array<{
      startTime: string
      endTime: string
      intensity: number
    }>
  }
  bandwidthMap: {
    start: number
    end: number
    delta: number
    snapshots: BandwidthSnapshot[]
  }
  legendMap?: {
    warnings: number
    failures: number
    integrityScore: number
  }
  narrative: string
}

export interface Session {
  id: string
  mode: Mode
  intention: string
  durationPlanned: number
  startTime: string
  endTime: string | null
  status: SessionStatus
  result: SessionResult | null
  intendedApps: AppWhitelist[]
  browserTabs: BrowserTabIntent[]
  expectedDistractions: ExpectedDistraction[]
  events: SessionEvent[]
  flowSegments: FlowSegment[]
  cognitiveFrictionEvents: CognitiveFrictionEvent[]
  bandwidthChange: number | null
  selfReportedFocus: number | null
  selfReportedDrain: number | null
  endReason: string | null
  shockMirror: ShockMirrorReport | null
  legendState?: LegendState
}

export interface ParkingLotItem {
  id: string
  text: string
  timestamp: string
  sessionId: string | null
  status: "OPEN" | "COMPLETED" | "DELETED"
}

export interface OnboardingData {
  completed: boolean
  version: string
  completedAt: string | null
}

export interface UserData {
  email: string | null
  firstName: string | null
  lastName: string | null
  operatorName: string | null
  initialBandwidth: number | null
  defaultMode: Mode | null
  publicCommitment: boolean
  intention: string
  dayStartTime: string | null
  workBlockDuration: number | null
  trackWeekends: "ALWAYS" | "PROMPT" | "NEVER" | null
  deepWorkProfile: Array<{
    type: string
    priority: number
  }>
}

export interface BandwidthData {
  currentScore: number
  lastUpdated: string
  history: BandwidthSnapshot[]
}

export interface SessionsData {
  sessions: Session[]
}

export interface ParkingLotData {
  items: ParkingLotItem[]
}

export interface ShockMirrorData {
  reports: ShockMirrorReport[]
}

export interface AuthData {
  isAuthenticated: boolean
  username: string | null
  email: string | null // Added email field
  registeredAt: string | null
  onboardingCompleted: boolean
  lastCalibration: string | null
}

export interface RegisteredUser {
  username: string
  email: string
  password: string // In production, this would be hashed
  registeredAt: string
}

export interface UserRegistry {
  users: RegisteredUser[]
}
