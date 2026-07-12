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
  /** Why the panel opened: 'critical' hard stop, 'landing' after a rough
   *  session ending, or null for a user-initiated reset */
  context?: 'critical' | 'landing' | null
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
  context = null,
}: ResetPanelAdapterProps) {

  const handleSelectRitual = (ritualType: RitualType) => {
    // Notify that ritual started (no bonus awarded yet!)
    onSelectRitual(ritualType)
  }

  return (
    <PanelContainer isOpen={isOpen}>
      {context === 'critical' && (
        <div className="mb-3 p-3 rounded-xl border border-red-500/40 bg-red-500/10">
          <p className="text-sm text-red-300 font-light">
            Capacity critical — the session is paused.
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Pushing through from here costs more than it produces. Take a short reset to come back up.
          </p>
        </div>
      )}
      {context === 'landing' && (
        <div className="mb-3 p-3 rounded-xl border border-cyan-500/40 bg-cyan-500/10">
          <p className="text-sm text-cyan-300 font-light">
            That session ended before you were done.
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Land it properly — two minutes to reset before whatever's next. Or close this if you're good.
          </p>
        </div>
      )}
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
