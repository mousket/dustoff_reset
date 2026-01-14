// src/components/modals/EndSessionModalAdapter.tsx
// Adapter for EndSessionModal - shows when user clicks Stop
// Lets user select: mission_complete, stopping_early, pulled_away
// Calls sessionManager.endSession(reason, subReason)

import { EndSessionModal } from '@/features/desktop/modals/EndSessionModal'
import type { SessionRecord } from '@/lib/tauri-types'

// Map modal's reason types to session record's end reason types
type ModalReason = 'completed' | 'stopping_early' | 'pulled_away'
type SessionEndReason = NonNullable<SessionRecord['endReason']>

interface EndSessionModalAdapterProps {
  isOpen: boolean
  onCancel: () => void
  onEndSession: (reason: SessionEndReason, subReason?: string) => void
  onQuickExit: () => void
}

/**
 * EndSessionModalAdapter
 * 
 * Wraps the EndSessionModal component to integrate with App.tsx.
 * 
 * User Flow:
 * 1. User clicks Stop in HUD
 * 2. Modal appears with three options:
 *    - "I completed what I intended" → mission_complete
 *    - "I'm stopping early" → stopping_early (with sub-reasons)
 *    - "I got pulled away" → pulled_away (with sub-reasons)
 * 3. User selects reason and optional sub-reason
 * 4. Clicks "Continue" → onEndSession called
 * 5. Or clicks "Quick Exit" → onQuickExit (ends without reflection)
 * 6. Or clicks "Cancel" → returns to session
 */
export function EndSessionModalAdapter({
  isOpen,
  onCancel,
  onEndSession,
  onQuickExit,
}: EndSessionModalAdapterProps) {
  // Map the modal's reason to session record's end reason
  const mapReason = (modalReason: ModalReason): SessionEndReason => {
    switch (modalReason) {
      case 'completed':
        return 'mission_complete'
      case 'stopping_early':
        return 'stopping_early'
      case 'pulled_away':
        return 'pulled_away'
      default:
        return 'mission_complete'
    }
  }

  const handleContinue = (reason: ModalReason, subReason?: string) => {
    const mappedReason = mapReason(reason)
    onEndSession(mappedReason, subReason)
  }

  // Render modal directly without fixed overlay (Tauri window handles positioning)
  return (
    <div className="mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <EndSessionModal
        isOpen={isOpen}
        onContinue={handleContinue}
        onQuickExit={onQuickExit}
        onCancel={onCancel}
      />
    </div>
  )
}

export type { EndSessionModalAdapterProps }
