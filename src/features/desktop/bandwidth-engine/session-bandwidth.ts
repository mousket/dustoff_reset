export interface BandwidthEvent {
  type:
    | "friction"
    | "focus-slipping"
    | "non-whitelisted-app"
    | "tab-switch"
    | "app-switch"
    | "sustained-focus"
    | "flow-celebration"
    | "breath-reset"
    | "walk-reset"
    | "dump-reset"
  timestamp: number
  details?: any
}

export interface BandwidthState {
  currentBandwidth: number
  lastEventTimestamp: number
  sustainedFocusMinutes: number
  lastSwitchTimestamp: number
  switchCount: number
  nonWhitelistedAppHistory: Map<string, number>
  flowState: FlowState
}

export interface FlowState {
  isActive: boolean
  sustainedFocusMinutes: number
  flowEligible: boolean
  flowTriggered: boolean
  flowCelebrationTriggered: boolean
  flowStreakMinutes: number
  lastInterruptionTimestamp: number
  conditionsValid: boolean
}

export function applyFrictionPenalty(current: number): number {
  return Math.max(0, current - 5)
}

export function applyFocusSlippingPenalty(current: number): number {
  return Math.max(0, current - 10)
}

export function applyNonWhitelistedAppPenalty(
  current: number,
  appName: string,
  lastOccurrence: number | undefined,
): number {
  const now = Date.now()
  const isRepeat = lastOccurrence && now - lastOccurrence < 120000 // 2 minutes

  if (isRepeat) {
    return Math.max(0, current - 6)
  }
  return Math.max(0, current - 12)
}

export function applyTabSwitchPenalty(current: number, switchCount: number, timeWindow: number): number {
  // Check if burst (>5 switches in 60s)
  if (switchCount > 5 && timeWindow <= 60000) {
    return Math.max(0, current - 5)
  }
  // Normal switch
  return Math.max(0, current - 2)
}

export function applyAppSwitchPenalty(current: number, switchCount: number, timeWindow: number): number {
  // Check if burst (>3 switches in 60s)
  if (switchCount > 3 && timeWindow <= 60000) {
    return Math.max(0, current - 6)
  }
  // Normal switch
  return Math.max(0, current - 4)
}

export function applySustainedFocusGain(current: number): number {
  // Cap at 95
  return Math.min(95, current + 1)
}

export function applyFlowCelebrationBonus(current: number): number {
  // Cap at 95
  return Math.min(95, current + 5)
}

export function applyBreathResetRestoration(current: number): number {
  return Math.min(100, current + 5)
}

export function applyWalkResetRestoration(current: number): number {
  return Math.min(100, current + 7.5)
}

export function applyDumpResetRestoration(current: number): number {
  return Math.min(100, current + 6)
}

export function checkAutoInterventionTrigger(bandwidth: number): "friction" | "focus-slipping" | null {
  if (bandwidth < 50) {
    return "focus-slipping"
  }
  if (bandwidth < 60) {
    return "friction"
  }
  return null
}

export function checkFlowConditions(
  sustainedFocusMinutes: number,
  bandwidth: number,
  lastInterruptionTimestamp: number,
  lastSwitchTimestamp: number,
): boolean {
  const now = Date.now()
  const TWELVE_MINUTES_MS = 12 * 60 * 1000

  // Condition 1: 12+ minutes sustained focus
  const hasSustainedFocus = sustainedFocusMinutes >= 12

  // Condition 2: No context switching in last 12 minutes
  const noRecentSwitches = now - lastSwitchTimestamp > TWELVE_MINUTES_MS || lastSwitchTimestamp === 0

  // Condition 3: No interventions in last 12 minutes
  const noRecentInterventions = now - lastInterruptionTimestamp > TWELVE_MINUTES_MS || lastInterruptionTimestamp === 0

  // Condition 4: Bandwidth >= 75
  const bandwidthThreshold = bandwidth >= 75

  return hasSustainedFocus && noRecentSwitches && noRecentInterventions && bandwidthThreshold
}

export function enterFlowState(flowState: FlowState): FlowState {
  return {
    ...flowState,
    isActive: true,
    flowEligible: true,
    flowTriggered: true,
    flowCelebrationTriggered: true,
    conditionsValid: true,
  }
}

export function exitFlowState(flowState: FlowState, reason: string): FlowState {
  console.log("[v0] Flow state exited:", reason)
  return {
    ...flowState,
    isActive: false,
    flowStreakMinutes: 0,
    conditionsValid: false,
  }
}

export function applyFlowStreakGain(current: number, flowState: FlowState): number {
  if (!flowState.isActive) return current
  // +1 bandwidth per minute while in flow, cap at 95
  return Math.min(95, current + 1)
}

export function applyBandwidthEvent(
  event: BandwidthEvent,
  state: BandwidthState,
): { newBandwidth: number; updatedState: BandwidthState } {
  let newBandwidth = state.currentBandwidth

  switch (event.type) {
    case "friction":
      newBandwidth = applyFrictionPenalty(newBandwidth)
      break

    case "focus-slipping":
      newBandwidth = applyFocusSlippingPenalty(newBandwidth)
      break

    case "non-whitelisted-app": {
      const appName = event.details?.appName || "unknown"
      const lastOccurrence = state.nonWhitelistedAppHistory.get(appName)
      newBandwidth = applyNonWhitelistedAppPenalty(newBandwidth, appName, lastOccurrence)
      state.nonWhitelistedAppHistory.set(appName, event.timestamp)
      break
    }

    case "tab-switch": {
      const timeWindow = event.timestamp - state.lastSwitchTimestamp
      const switchCount = timeWindow <= 60000 ? state.switchCount + 1 : 1
      newBandwidth = applyTabSwitchPenalty(newBandwidth, switchCount, timeWindow)
      state.switchCount = switchCount
      state.lastSwitchTimestamp = event.timestamp
      break
    }

    case "app-switch": {
      const timeWindow = event.timestamp - state.lastSwitchTimestamp
      const switchCount = timeWindow <= 60000 ? state.switchCount + 1 : 1
      newBandwidth = applyAppSwitchPenalty(newBandwidth, switchCount, timeWindow)
      state.switchCount = switchCount
      state.lastSwitchTimestamp = event.timestamp
      break
    }

    case "sustained-focus":
      newBandwidth = applySustainedFocusGain(newBandwidth)
      state.sustainedFocusMinutes++
      break

    case "flow-celebration":
      newBandwidth = applyFlowCelebrationBonus(newBandwidth)
      break

    case "breath-reset":
      newBandwidth = applyBreathResetRestoration(newBandwidth)
      break

    case "walk-reset":
      newBandwidth = applyWalkResetRestoration(newBandwidth)
      break

    case "dump-reset":
      newBandwidth = applyDumpResetRestoration(newBandwidth)
      break
  }

  // Apply flow streak gain if flow state is active
  newBandwidth = applyFlowStreakGain(newBandwidth, state.flowState)

  // Clamp to 0-100
  newBandwidth = Math.max(0, Math.min(100, newBandwidth))

  return {
    newBandwidth,
    updatedState: {
      ...state,
      currentBandwidth: newBandwidth,
      lastEventTimestamp: event.timestamp,
    },
  }
}

export function initializeBandwidthState(initialBandwidth: number): BandwidthState {
  return {
    currentBandwidth: initialBandwidth,
    lastEventTimestamp: Date.now(),
    sustainedFocusMinutes: 0,
    lastSwitchTimestamp: 0,
    switchCount: 0,
    nonWhitelistedAppHistory: new Map(),
    flowState: initializeFlowState(),
  }
}

export function initializeFlowState(): FlowState {
  return {
    isActive: false,
    sustainedFocusMinutes: 0,
    flowEligible: false,
    flowTriggered: false,
    flowCelebrationTriggered: false,
    flowStreakMinutes: 0,
    lastInterruptionTimestamp: 0,
    conditionsValid: false,
  }
}
