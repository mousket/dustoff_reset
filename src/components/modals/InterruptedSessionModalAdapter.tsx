// src/components/modals/InterruptedSessionModalAdapter.tsx
// Adapter for InterruptedSessionModal - shows on app launch if recovery data exists
// Lets user Resume or Discard
// Resume: restore session state
// Discard: clear recovery data

import { InterruptedSessionModal } from '@/features/desktop/modals/InterruptedSessionModal'
import type { RecoveryData } from '@/lib/tauri-types'

interface InterruptedSessionModalAdapterProps {
  isOpen: boolean
  recoveryData: RecoveryData | null
  onResume: () => void
  onDiscard: () => void
}

/**
 * InterruptedSessionModalAdapter
 * 
 * Wraps the InterruptedSessionModal to integrate with App.tsx recovery flow.
 * 
 * Shows when:
 * - App launches and finds recovery data in storage
 * - Indicates a previous session was interrupted (crash, force quit, etc.)
 * 
 * Recovery Data Contains:
 * - sessionId: The interrupted session's ID
 * - startedAt: When the session started
 * - plannedDurationMinutes: Original session duration
 * - mode: Zen/Flow/Legend
 * - intention: User's session intention
 * - elapsedSeconds: How much time had passed
 * - bandwidthAtPause: Bandwidth level when interrupted
 * 
 * User Actions:
 * - Resume: Restart session with recovered config
 * - Discard: Clear recovery data and start fresh
 */
export function InterruptedSessionModalAdapter({
  isOpen,
  recoveryData,
  onResume,
  onDiscard,
}: InterruptedSessionModalAdapterProps) {
  if (!isOpen || !recoveryData) return null

  return (
    <InterruptedSessionModal
      isOpen={isOpen}
      onContinue={onResume}
      onDiscard={onDiscard}
      duration={recoveryData.plannedDurationMinutes}
      elapsedSeconds={recoveryData.elapsedSeconds}
      mode={recoveryData.mode}
      bandwidth={recoveryData.bandwidthAtPause ?? undefined}
      whitelistedAppsCount={recoveryData.whitelistedApps?.length}
      whitelistedTabsCount={recoveryData.whitelistedTabs?.length}
    />
  )
}

export type { InterruptedSessionModalAdapterProps }
