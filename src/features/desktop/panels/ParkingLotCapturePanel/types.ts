export interface ParkingLotItem {
  id: string
  text: string
  timestamp: number
}

export interface ParkingLotCaptureProps {
  isOpen: boolean
  onClose: () => void
  onAddItem: (item: string) => void
  currentItems?: ParkingLotItem[]
  maxItems?: number
}
