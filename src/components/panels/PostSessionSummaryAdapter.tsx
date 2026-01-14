// src/components/panels/PostSessionSummaryAdapter.tsx
// Adapts the PostSessionSummaryPanel to work with App.tsx

import { PanelContainer } from '@/components/PanelContainer'
import { PostSessionSummaryPanel } from '@/features/desktop/panels/PostSessionSummaryPanel'
import type { SessionRecord } from '@/lib/tauri-types'

interface PostSessionSummaryAdapterProps {
  isOpen: boolean
  session: SessionRecord | null
  onClose: () => void
  onContinueToReflection: () => void
}

/**
 * PostSessionSummaryAdapter
 * 
 * Wraps PostSessionSummaryPanel with PanelContainer for consistent styling.
 * This panel shows "The Game Tape" - a visual summary of the completed session:
 * 
 * - Session Timeline: Visual bar showing flow/working/distracted/reset segments
 * - Flow Efficiency: Percentage of time in flow state
 * - Longest Streak: Longest continuous focus period
 * - Distractions: Count of distraction attempts
 * - Interventions: Count of interventions used
 * - Victory Badge: Achievement level based on performance
 * 
 * User can either:
 * - Continue to reflection (capture learnings)
 * - Skip reflection and close
 */
export function PostSessionSummaryAdapter({
  isOpen,
  session,
  onClose,
  onContinueToReflection,
}: PostSessionSummaryAdapterProps) {
  
  const handleContinueToReflection = () => {
    onContinueToReflection()
  }
  
  const handleDone = () => {
    // Skip reflection, just close
    onClose()
  }
  
  return (
    <PanelContainer isOpen={isOpen}>
      <PostSessionSummaryPanel
        isOpen={true}  // Always true since PanelContainer handles visibility
        session={session}
        onContinueToReflection={handleContinueToReflection}
        onDone={handleDone}
      />
    </PanelContainer>
  )
}

export type { PostSessionSummaryAdapterProps }
