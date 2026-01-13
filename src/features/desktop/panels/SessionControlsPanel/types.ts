export interface SessionControlsProps {
  isOpen: boolean
  onClose: () => void
  onPause: () => void
  onReset: () => void
  onEnd: () => void
  onToggleFlow: () => void
  onOpenParkingLot: () => void
  isFlowMode: boolean
  isPaused: boolean
  sessionMode: "Zen" | "Flow" | "Legend"
}
