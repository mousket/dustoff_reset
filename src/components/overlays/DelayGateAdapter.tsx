// src/components/overlays/DelayGateAdapter.tsx
// Adapts the DelayGate panel to work with App.tsx

import { PanelContainer } from '@/components/PanelContainer'
import { DelayGate } from '@/features/desktop/overlays/DelayGate'

export interface DelayGateState {
  isOpen: boolean
  triggerName: string
  triggerApp?: string  // The actual app name (for minimize on return)
  category: string
  delaySeconds: number
  offenseNumber: number
  message: string
}

interface DelayGateAdapterProps {
  state: DelayGateState
  onReturnToWork: () => void
  onProceed: () => void
  onDismiss: () => void
}

/**
 * DelayGateAdapter
 * 
 * Wraps the DelayGate component in PanelContainer for App.tsx.
 * Renders as a panel BELOW the HUD (not a full-screen overlay).
 * 
 * The delay gate appears in Flow mode when:
 * - User switches to a distracting app (social media, entertainment, gaming)
 * - User visits a distracting domain in browser
 * 
 * Behavior:
 * - Shows countdown (10-30s based on offense number)
 * - "Return to Work" → awards bonus, closes gate
 * - Wait through countdown → proceeds (penalty already applied)
 * - Escalating messages and times with repeated offenses
 */
export function DelayGateAdapter({
  state,
  onReturnToWork,
  onProceed,
  onDismiss,
}: DelayGateAdapterProps) {
  return (
    <PanelContainer isOpen={state.isOpen}>
      <DelayGate
        isOpen={true}
        triggerName={state.triggerName}
        category={state.category}
        delaySeconds={state.delaySeconds}
        offenseNumber={state.offenseNumber}
        message={state.message}
        onReturnToWork={onReturnToWork}
        onProceed={onProceed}
        onDismiss={onDismiss}
      />
    </PanelContainer>
  )
}

/**
 * Create initial delay gate state
 */
export function createInitialDelayGateState(): DelayGateState {
  return {
    isOpen: false,
    triggerName: '',
    category: '',
    delaySeconds: 10,
    offenseNumber: 1,
    message: '',
  }
}

export type { DelayGateAdapterProps }
