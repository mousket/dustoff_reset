export type FlowCelebrationMode = "Zen" | "Flow" | "Legend"

export interface FlowCelebrationOverlayProps {
  isOpen: boolean
  mode: FlowCelebrationMode
  onDismiss: () => void
}
