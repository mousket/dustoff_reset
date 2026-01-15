// src/features/desktop/overlays/BlockScreen/types.ts

export interface BlockScreenProps {
  isOpen: boolean
  /** The app or domain that triggered the block */
  triggerName: string
  /** Category of the distraction (social_media, entertainment, etc.) */
  category: string
  /** Current offense number in this session */
  offenseNumber: number
  /** Message to display */
  message: string
  /** Whether this offense triggered a session extension */
  triggeredExtension: boolean
  /** Minutes added to session (if extension triggered) */
  extensionMinutes: number
  /** Called when user accepts the block and returns to work */
  onAccept: () => void
  /** Called when session extension is triggered (fires once per block event) */
  onExtension?: (minutes: number) => void
}
