export type RitualType = "breath" | "walk" | "dump" | "personal"

export interface RitualOption {
  id: RitualType
  label: string
  duration: number
  description: string
}

export interface ResetPanelProps {
  isOpen: boolean
  onClose: () => void
  onSelectRitual: (ritualType: RitualType) => void
  sessionMode?: "Zen" | "Flow" | "Legend"
}
