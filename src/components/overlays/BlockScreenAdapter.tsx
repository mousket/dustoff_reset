// src/components/overlays/BlockScreenAdapter.tsx
// Adapts the BlockScreen panel to work with App.tsx

import { PanelContainer } from '@/components/PanelContainer'
import { BlockScreen } from '@/features/desktop/overlays/BlockScreen'

export interface BlockScreenState {
  isOpen: boolean
  triggerName: string
  category: string
  offenseNumber: number
  message: string
  triggeredExtension: boolean
  extensionMinutes: number
}

interface BlockScreenAdapterProps {
  state: BlockScreenState
  onAccept: () => void
  onExtension?: (minutes: number) => void
}

/**
 * BlockScreenAdapter (Legend Mode Intervention)
 * 
 * Wraps the BlockScreen component in PanelContainer for App.tsx.
 * Renders as a panel BELOW the HUD.
 * 
 * NOTE: This is an intervention/penalty screen, NOT an actual app blocker.
 * We penalize the user and require acknowledgment, but don't force-close apps.
 * 
 * The intervention appears in Legend mode when:
 * - User switches to a distracting app (social media, entertainment, gaming)
 * - User visits a distracting domain in browser
 * - User tries to access communication apps after first warning
 * 
 * Unlike Delay Gate:
 * - NO countdown
 * - NO "wait through" option
 * - User MUST acknowledge and return to work
 * - Can trigger session extension at certain offense numbers
 */
export function BlockScreenAdapter({
  state,
  onAccept,
  onExtension,
}: BlockScreenAdapterProps) {
  return (
    <PanelContainer isOpen={state.isOpen}>
      <BlockScreen
        isOpen={true}
        triggerName={state.triggerName}
        category={state.category}
        offenseNumber={state.offenseNumber}
        message={state.message}
        triggeredExtension={state.triggeredExtension}
        extensionMinutes={state.extensionMinutes}
        onAccept={onAccept}
        onExtension={onExtension}
      />
    </PanelContainer>
  )
}

/**
 * Create initial block screen state
 */
export function createInitialBlockScreenState(): BlockScreenState {
  return {
    isOpen: false,
    triggerName: '',
    category: '',
    offenseNumber: 1,
    message: '',
    triggeredExtension: false,
    extensionMinutes: 0,
  }
}

export type { BlockScreenAdapterProps }
