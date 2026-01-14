// src/components/panels/SessionReflectionAdapter.tsx
// Adapts the SessionReflectionPanel to work with App.tsx

import { PanelContainer } from '@/components/PanelContainer'
import { SessionReflectionPanel } from '@/features/desktop/panels/SessionReflectionPanel'
import type { SessionRecord, ReflectionObject } from '@/lib/tauri-types'
import { tauriBridge } from '@/lib/tauri-bridge'

interface SessionReflectionAdapterProps {
  isOpen: boolean
  session: SessionRecord | null
  onClose: () => void
  onComplete?: (reflection: ReflectionObject) => void
}

/**
 * SessionReflectionAdapter
 * 
 * Wraps SessionReflectionPanel with PanelContainer for consistent styling.
 * This panel captures post-session reflection data:
 * 
 * Questions:
 * - Q1: What went well this session? (required)
 * - Q2: What was the friction? (shown if flow efficiency < 60%)
 * - Q3: How's your closing energy? (emoji scale 1-5)
 * 
 * The reflection is saved to Tauri storage on completion.
 */
export function SessionReflectionAdapter({
  isOpen,
  session,
  onClose,
  onComplete,
}: SessionReflectionAdapterProps) {
  
  // The panel expects session.id but our type uses sessionId
  // Create a compatible session object
  const panelSession = session ? {
    ...session,
    id: session.sessionId, // Add id alias for panel compatibility
  } : null
  
  const handleSave = async (reflection: ReflectionObject) => {
    try {
      // Save reflection to Tauri storage
      await tauriBridge.saveReflection(reflection)
      
      // Notify parent
      if (onComplete) {
        onComplete(reflection)
      }
      
      onClose()
    } catch (error) {
      console.error('Failed to save reflection:', error)
      // Still close on error - don't block user
      onClose()
    }
  }
  
  const handleSkip = async () => {
    // Create a skipped reflection record if we have a session
    if (session) {
      try {
        const skippedReflection: ReflectionObject = {
          sessionId: session.sessionId,
          whatWentWell: '',
          frictionNotes: null,
          closingEnergy: 3, // Default middle value
          skipped: true,
          createdAt: new Date().toISOString(),
        }
        
        await tauriBridge.saveReflection(skippedReflection)
      } catch (error) {
        console.error('Failed to save skipped reflection:', error)
      }
    }
    
    onClose()
  }
  
  return (
    <PanelContainer isOpen={isOpen}>
      <SessionReflectionPanel
        session={panelSession}
        onSave={handleSave}
        onSkip={handleSkip}
      />
    </PanelContainer>
  )
}

export type { SessionReflectionAdapterProps }
