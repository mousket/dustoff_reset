export interface EndSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: EndReason, subReason?: string) => void
}

export type EndReason = "completed" | "early-exit" | "interrupted"

export interface EndReasonOption {
  value: EndReason
  label: string
  subReasons?: string[]
}
