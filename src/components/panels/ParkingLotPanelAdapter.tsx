// src/components/panels/ParkingLotPanelAdapter.tsx
// Adapts the ParkingLotManagementPanel to work with App.tsx

import { useEffect } from 'react'
import { PanelContainer } from '@/components/PanelContainer'
import { ParkingLotManagementPanel } from '@/features/desktop/panels/ParkingLotManagementPanel'
import { refreshParkingLotCache } from '@/lib/parking-lot-storage'

interface ParkingLotPanelAdapterProps {
  isOpen: boolean
  onClose: () => void
  onItemsChange?: () => void
}

/**
 * ParkingLotPanelAdapter
 * 
 * Wraps ParkingLotManagementPanel with PanelContainer for consistent styling.
 * This panel allows users to:
 * - View all active parking lot items
 * - Add new items
 * - Edit existing items
 * - Change item status (new → in-progress → done)
 * - Delete items
 * 
 * The panel uses the parking-lot-storage module which bridges to Tauri.
 */
export function ParkingLotPanelAdapter({
  isOpen,
  onClose,
  onItemsChange,
}: ParkingLotPanelAdapterProps) {
  
  // Refresh parking lot cache when panel opens
  useEffect(() => {
    if (isOpen) {
      refreshParkingLotCache()
    }
  }, [isOpen])
  
  const handleItemsChange = (action?: { action: string; id?: string; text?: string }) => {
    // Refresh cache after any change
    refreshParkingLotCache()
    
    // Notify parent if callback provided
    if (onItemsChange) {
      onItemsChange()
    }
    
    // Log action for debugging
    if (action) {
      console.log('Parking lot action:', action)
    }
  }
  
  return (
    <PanelContainer isOpen={isOpen} width={500}>
      <ParkingLotManagementPanel
        isOpen={true}  // Always true since PanelContainer handles visibility
        onClose={onClose}
        onItemsChange={handleItemsChange}
      />
    </PanelContainer>
  )
}

export type { ParkingLotPanelAdapterProps }
