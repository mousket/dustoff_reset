// src/components/panels/ResetPanelAdapter.tsx
// Adapts the ResetPanel to work with App.tsx

import { PanelContainer } from '@/components/PanelContainer'
import { ResetPanel } from '@/features/desktop/panels/ResetPanel'
import type { RitualType } from '@/features/desktop/panels/ResetPanel/types'
import type { SessionMode } from '@/features/desktop/hud/FloatingHUD/types'

interface ResetPanelAdapterProps {
  isOpen: boolean
  onClose: () => void
  onSelectRitual: (ritualType: RitualType) => void
  sessionMode?: SessionMode
}

/**
 * ResetPanelAdapter
 * 
 * Wraps ResetPanel with PanelContainer for consistent styling.
 * The ResetPanel allows users to choose from different reset rituals
 * during a session to recharge before continuing work.
 * 
 * Ritual options:
 * - breath: 2 min breathing exercise
 * - walk: 5 min walk break
 * - dump: 3 min thought dump
 * - personal: 4 min personal break
 */
export function ResetPanelAdapter({
  isOpen,
  onClose,
  onSelectRitual,
  sessionMode = 'Flow',
}: ResetPanelAdapterProps) {
  
  const handleSelectRitual = (ritualType: RitualType) => {
    // The ResetPanel handles its own timer internally
    // We just need to notify App.tsx that a ritual was selected
    onSelectRitual(ritualType)
  }
  
  return (
    <PanelContainer isOpen={isOpen} width={480}>
      <ResetPanel
        isOpen={true}  // Always true since PanelContainer handles visibility
        onClose={onClose}
        onSelectRitual={handleSelectRitual}
        sessionMode={sessionMode}
      />
    </PanelContainer>
  )
}

// Re-export the RitualType for convenience
export type { RitualType }
export type { ResetPanelAdapterProps }
