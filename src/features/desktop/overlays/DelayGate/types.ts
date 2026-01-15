// src/features/desktop/overlays/DelayGate/types.ts

export interface DelayGateProps {
  isOpen: boolean
  /** The app or domain that triggered the delay gate */
  triggerName: string
  /** Category of the distraction (social_media, entertainment, etc.) */
  category: string
  /** Number of seconds to wait (escalates with offenses) */
  delaySeconds: number
  /** Current offense number in this session */
  offenseNumber: number
  /** Message to display */
  message: string
  /** Called when user chooses to return to work (earns bonus) */
  onReturnToWork: () => void
  /** Called when countdown completes and user proceeds to distraction */
  onProceed: () => void
  /** Called when delay gate is dismissed */
  onDismiss: () => void
}
