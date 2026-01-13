// src/components/panels/ParkingLotHarvestAdapter.tsx
// Adapts the ParkingLotHarvestPanel to work with App.tsx

import { useState, useEffect } from 'react'
import { PanelContainer } from '@/components/PanelContainer'
import { ParkingLotHarvestPanel } from '@/features/desktop/panels/ParkingLotHarvestPanel'
import { 
  getActiveParkingLotItems, 
  refreshParkingLotCache,
  updateParkingLotItem,
  deleteParkingLotItem,
  type ParkingLotItemFull 
} from '@/lib/parking-lot-storage'

// Harvested item data returned from the panel
export interface HarvestedItem {
  id: string
  category: 'task' | 'idea' | 'reminder' | 'distraction'
  tags: string[]
  action: 'next-session' | 'keep' | 'delete'
}

interface ParkingLotHarvestAdapterProps {
  isOpen: boolean
  onClose: () => void
  onComplete?: (harvestedItems: HarvestedItem[]) => void
  sessionId?: string  // Optional: link items to session
}

/**
 * ParkingLotHarvestAdapter
 * 
 * Wraps ParkingLotHarvestPanel with PanelContainer for consistent styling.
 * This panel appears at the end of a session to let users:
 * - Categorize items (task, idea, reminder, distraction)
 * - Add tags (urgent, follow-up, research, etc.)
 * - Decide action (next-session, keep, delete)
 * 
 * The adapter:
 * - Loads items from parking lot storage
 * - Processes harvested items (updates categories, tags, actions)
 * - Deletes items marked for deletion
 */
export function ParkingLotHarvestAdapter({
  isOpen,
  onClose,
  onComplete,
  sessionId,
}: ParkingLotHarvestAdapterProps) {
  const [items, setItems] = useState<ParkingLotItemFull[]>([])
  
  // Load items when panel opens
  useEffect(() => {
    if (isOpen) {
      refreshParkingLotCache().then(() => {
        const activeItems = getActiveParkingLotItems()
        // Filter to items from current session if sessionId provided
        if (sessionId) {
          setItems(activeItems.filter(item => item.sessionId === sessionId))
        } else {
          setItems(activeItems)
        }
      })
    }
  }, [isOpen, sessionId])
  
  const handleComplete = async (harvestedItems: HarvestedItem[]) => {
    try {
      // Process each harvested item
      for (const harvested of harvestedItems) {
        if (harvested.action === 'delete') {
          // Delete items marked for deletion
          await deleteParkingLotItem(harvested.id)
        } else {
          // Update category, tags, and action
          await updateParkingLotItem(harvested.id, {
            category: harvested.category,
            tags: harvested.tags,
            action: harvested.action,
          })
        }
      }
      
      // Refresh cache after all updates
      await refreshParkingLotCache()
      
      // Notify parent
      if (onComplete) {
        onComplete(harvestedItems)
      }
      
      onClose()
    } catch (error) {
      console.error('Failed to process harvested items:', error)
      // Still close on error - don't block user
      onClose()
    }
  }
  
  const handleSkip = () => {
    // Just close without processing
    onClose()
  }
  
  return (
    <PanelContainer isOpen={isOpen} width={600}>
      <ParkingLotHarvestPanel
        isOpen={true}  // Always true since PanelContainer handles visibility
        items={items}
        onComplete={handleComplete}
        onSkip={handleSkip}
      />
    </PanelContainer>
  )
}

export type { ParkingLotHarvestAdapterProps }
