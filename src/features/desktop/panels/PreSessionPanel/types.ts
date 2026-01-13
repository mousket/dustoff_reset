export type SessionType = "deep" | "parking-lot" | "administrative"

export interface PreSessionData {
  sessionType: SessionType
  selectedParkingLotItems?: string[]
  intention: string
  mode: "Zen" | "Flow" | "Legend"
  duration: number
  whitelistedApps: string[]
  whitelistedBrowser: string
  whitelistedTabs: string[]
  systemChecksComplete: boolean
  emotionalGrounding: number
  preparationMinutes: number
  preparationChecklist: string[]
}

export interface PreSessionPanelProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: PreSessionData) => void
}

export interface WhitelistSuggestion {
  name: string
  icon: string
  category: "app" | "browser" | "tab"
}
