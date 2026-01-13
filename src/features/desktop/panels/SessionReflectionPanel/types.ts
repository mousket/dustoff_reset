export interface SessionReflectionProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (reflection: ReflectionData) => void
  sessionId: string
}

export interface ReflectionData {
  whatWorked: string
  whatPulledAway: string
  sessionRating: number
  keyLearning: string
}
