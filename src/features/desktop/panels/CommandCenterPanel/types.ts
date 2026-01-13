export interface CommandCenterPanelProps {
  isOpen: boolean
  onClose: () => void
  onTriggerIntervention: (type: "friction" | "slipping" | "non-whitelisted" | "tab-switching") => void
  onRunSequentialTest: () => void
  onTestResetModal: () => void
  onTriggerFlowCelebration: () => void
  onSetBandwidth?: (value: number) => void
  sessionMode: "Zen" | "Flow" | "Legend"
}
