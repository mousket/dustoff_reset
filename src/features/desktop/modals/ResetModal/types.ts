export type RitualType = "breath" | "walk" | "dump" | "end"

export interface RitualOption {
  id: RitualType
  label: string
  duration: number // in seconds
  description: string
  icon?: string // Optional icon
}

export interface ResetModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectRitual: (type: RitualType) => void
  sessionMode?: "Zen" | "Flow" | "Legend"
}
