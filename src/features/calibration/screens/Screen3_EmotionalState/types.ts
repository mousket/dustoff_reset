export interface Screen3Props {
  onContinue: (data: Screen3Data) => void
  onBack: () => void
  demo?: boolean
  initialData?: Partial<Screen3Data>
}

export interface Screen3Data {
  emotionalState: "CLEAR" | "FOCUSED" | "SCATTERED" | "HEAVY" | "DRAINED"
  cognitiveLoad: 1 | 2 | 3 | 4 | 5
}

export interface EmotionCard {
  id: "CLEAR" | "FOCUSED" | "SCATTERED" | "HEAVY" | "DRAINED"
  label: string
  description: string
}

export interface LoadLevel {
  value: 1 | 2 | 3 | 4 | 5
  label: string
}
