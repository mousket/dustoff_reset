// src/components/panels/PreSessionPanelAdapter.tsx
// Adapts the PreSessionPanel to work with App.tsx

import { useEffect } from 'react'
import { PanelContainer } from '@/components/PanelContainer'
import { PreSessionPanel } from '@/features/desktop/panels/PreSessionPanel'
import type { PreSessionData, SessionType } from '@/features/desktop/panels/PreSessionPanel/types'
import { refreshParkingLotCache } from '@/lib/parking-lot-storage'
import type { SessionMode } from '@/features/desktop/hud/FloatingHUD/types'

// Simplified config for App.tsx
export interface PreSessionConfig {
  mode: SessionMode
  durationMinutes: number
  intention: string
  sessionType: 'deep' | 'parking-lot' | 'administrative'
  whitelistedApps: string[]
  whitelistedTabs: string[]
  selectedParkingLotItems?: string[]
}

interface PreSessionPanelAdapterProps {
  isOpen: boolean
  onClose: () => void
  onStartSession: (config: PreSessionConfig) => void
}

export function PreSessionPanelAdapter({
  isOpen,
  onClose,
  onStartSession,
}: PreSessionPanelAdapterProps) {
  
  // Refresh parking lot cache when panel opens
  useEffect(() => {
    if (isOpen) {
      refreshParkingLotCache()
    }
  }, [isOpen])
  
  const handleComplete = (data: PreSessionData) => {
    // Convert PreSessionData to PreSessionConfig
    const config: PreSessionConfig = {
      mode: data.mode,
      durationMinutes: data.duration,
      intention: data.intention,
      sessionType: data.sessionType,
      whitelistedApps: data.whitelistedApps,
      whitelistedTabs: data.whitelistedTabs,
      selectedParkingLotItems: data.selectedParkingLotItems,
    }
    
    onStartSession(config)
  }
  
  return (
    <PanelContainer isOpen={isOpen}>
      <PreSessionPanel
        isOpen={true}  // Always true since PanelContainer handles visibility
        onComplete={handleComplete}
        onClose={onClose}
      />
    </PanelContainer>
  )
}

export type { PreSessionPanelAdapterProps }
