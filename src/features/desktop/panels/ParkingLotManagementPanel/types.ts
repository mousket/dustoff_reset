export interface ParkingLotItemFull {
  id: string
  text: string
  timestamp: number
  status: "OPEN" | "COMPLETED" | "DELETED"
  itemStatus?: "new" | "in-progress" | "done" // Add UI status field
  createdAt: string
  updatedAt: string
}

export interface ParkingLotManagementPanelProps {
  isOpen: boolean
  onClose: () => void
  onItemsChange?: (action?: { action: string; id?: string; text?: string }) => void
}
