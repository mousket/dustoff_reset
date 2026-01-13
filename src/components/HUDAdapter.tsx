// src/components/HUDAdapter.tsx
// Adapts App.tsx state to FloatingHUD props with Tauri window dragging

import { FloatingHUD } from '@/features/desktop/hud/FloatingHUD'
import type { HUDMode, SessionMode } from '@/features/desktop/hud/FloatingHUD/types'
import { startDragging } from '@/hooks/useTauriWindow'

interface HUDAdapterProps {
  // State from App.tsx
  bandwidth: number
  mode: 'loading' | 'recovery' | 'not-calibrated' | 'idle' | 'pre-session' | 'session' | 'paused' | 'post-session'
  isCalibrated: boolean
  sessionMode: SessionMode
  sessionTime: number      // Elapsed time in seconds
  timeRemaining: number    // Remaining time in seconds
  totalTime: number        // Total planned time in seconds
  isInFlow: boolean
  
  // Callbacks
  onStartSession: () => void
  onPauseSession: () => void
  onResumeSession: () => void
  onStopSession: () => void
  onOpenParkingLot: () => void
  onCalibrate: () => void
  onOpenHistory?: () => void
  onOpenSettings?: () => void
  onReset?: () => void
}

export function HUDAdapter({
  bandwidth,
  mode,
  isCalibrated,
  sessionMode,
  sessionTime,
  timeRemaining,
  isInFlow,
  onStartSession,
  onPauseSession,
  onResumeSession,
  onStopSession,
  onOpenParkingLot,
  onCalibrate,
  onOpenHistory,
  onOpenSettings,
}: HUDAdapterProps) {
  
  // Map App modes to HUD modes
  const hudMode: HUDMode = (() => {
    switch (mode) {
      case 'not-calibrated':
        return 'not-calibrated'
      case 'session':
        return 'session'
      case 'paused':
        return 'paused'
      case 'idle':
      case 'pre-session':
      case 'post-session':
      default:
        return 'idle'
    }
  })()
  
  const handleDragStart = async (e: React.MouseEvent) => {
    // Check if click is on the HUD (not on buttons or interactive elements)
    const target = e.target as HTMLElement
    const isButton = target.closest('button')
    const isInput = target.closest('input')
    const isClickable = target.closest('[data-clickable]')
    
    if (!isButton && !isInput && !isClickable) {
      e.preventDefault()
      await startDragging()
    }
  }
  
  // Provide no-op handlers for required props that App.tsx might not have
  const handleOpenHistory = onOpenHistory || (() => {
    console.log('History not yet implemented')
  })
  
  const handleOpenSettings = onOpenSettings || (() => {
    console.log('Settings not yet implemented')
  })
  
  return (
    <div 
      data-drag-region
      onMouseDown={handleDragStart}
      className="cursor-grab active:cursor-grabbing"
    >
      <FloatingHUD
        isCalibratedToday={isCalibrated}
        bandwidthScore={bandwidth}
        mode={hudMode}
        sessionMode={sessionMode}
        sessionTime={sessionTime}
        timeRemaining={timeRemaining}
        isInFlow={isInFlow}
        onStartCalibration={onCalibrate}
        onStartSession={onStartSession}
        onPauseSession={onPauseSession}
        onResumeSession={onResumeSession}
        onStopSession={onStopSession}
        onOpenParkingLot={onOpenParkingLot}
        onOpenHistory={handleOpenHistory}
        onOpenSettings={handleOpenSettings}
      />
    </div>
  )
}

export type { HUDAdapterProps }
