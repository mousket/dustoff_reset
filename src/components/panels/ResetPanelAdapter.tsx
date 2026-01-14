// src/components/panels/ResetPanelAdapter.tsx
// Adapts the ResetPanel to work with App.tsx

import { PanelContainer } from '@/components/PanelContainer'
import { ResetPanel } from '@/features/desktop/panels/ResetPanel'
import type { RitualType, RitualCompletionData } from '@/features/desktop/panels/ResetPanel/types'
import type { SessionMode } from '@/features/desktop/hud/FloatingHUD/types'

interface ResetPanelAdapterProps {
  isOpen: boolean
  onClose: () => void
  onSelectRitual: (ritualType: RitualType) => void
  onRitualComplete?: (data: RitualCompletionData) => void
  sessionMode?: SessionMode
}

/**
 * ResetPanelAdapter
 * 
 * Wraps ResetPanel with PanelContainer for consistent styling.
 * The ResetPanel allows users to choose from different reset rituals
 * during a session to recharge before continuing work.
 * 
 * Anti-cheat: Points are awarded based on ACTUAL time spent,
 * not the planned duration. Users who skip early get proportional points.
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
  onRitualComplete,
  sessionMode = 'Flow',
}: ResetPanelAdapterProps) {
  
  const handleSelectRitual = (ritualType: RitualType) => {
    // Notify that ritual started (no bonus awarded yet!)
    onSelectRitual(ritualType)
  }
  
  return (
    <PanelContainer isOpen={isOpen}>
      <ResetPanel
        isOpen={true}  // Always true since PanelContainer handles visibility
        onClose={onClose}
        onSelectRitual={handleSelectRitual}
        onRitualComplete={onRitualComplete}
        sessionMode={sessionMode}
      />
    </PanelContainer>
  )
}

// Re-export types for convenience
export type { RitualType, RitualCompletionData }
export type { ResetPanelAdapterProps }
