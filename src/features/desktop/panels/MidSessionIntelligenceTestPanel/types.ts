export interface MidSessionIntelligenceTestPanelProps {
  isOpen: boolean
  onClose: () => void
  onBandwidthChange: (delta: number) => void
  onSetBandwidth: (value: number) => void
  onSimulateTabSwitch: () => void
  onSimulateAppSwitch: () => void
  onSimulateTabBurst: () => void
  onSimulateAppBurst: () => void
  onSimulateSustainedFocus: (minutes: number) => void
  onSimulateBreathReset: () => void
  onSimulateWalkReset: () => void
  onSimulateDumpReset: () => void
  onTriggerFriction: () => void
  onTriggerFocusSlipping: () => void
  onTriggerNonWhitelistedApp: () => void
  onTriggerTabSwitching: () => void
  onResetSessionState: () => void
  onForceEnterFlow: () => void
  onForceExitFlow: () => void
  onResetFlowState: () => void
  onSimulateInterruption: (type: string) => void
  currentBandwidth: number
  sessionMode: "Zen" | "Flow" | "Legend"
  flowState?: {
    sustainedFocusMinutes: number
    flowEligible: boolean
    flowTriggered: boolean
    flowActive: boolean
    flowCelebrationTriggered: boolean
    flowStreakMinutes: number
    lastInterruptionTimestamp: number
    lastSwitchTimestamp: number
    conditionsValid: boolean
  }
}
