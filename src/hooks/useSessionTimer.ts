// src/hooks/useSessionTimer.ts
// Manages session timing, recovery data saving, and overtime detection

import { useState, useEffect, useRef, useCallback } from 'react'
import { tauriBridge, RecoveryData } from '@/lib/tauri-bridge'

interface UseSessionTimerProps {
  isActive: boolean
  isPaused: boolean
  plannedDurationMinutes: number
  sessionId: string
  sessionStartedAt: string  // ISO timestamp for recovery
  mode: 'Zen' | 'Flow' | 'Legend'
  intention: string | null
  currentBandwidth: number
  onTimeUp: () => void
  onOvertime: () => void
}

interface SessionTimerState {
  elapsedSeconds: number
  timeRemaining: number
  isOvertime: boolean
  overtimeSeconds: number
}

/**
 * useSessionTimer
 * 
 * A hook that manages the session countdown timer with:
 * - Accurate time tracking (elapsed and remaining)
 * - Periodic recovery data saving (every 30 seconds)
 * - Time up detection (when planned time completes)
 * - Overtime detection (5 minutes past planned time)
 * 
 * @example
 * ```tsx
 * const { elapsedSeconds, timeRemaining, isOvertime } = useSessionTimer({
 *   isActive: mode === 'session',
 *   isPaused: mode === 'paused',
 *   plannedDurationMinutes: 25,
 *   sessionId: currentSessionId,
 *   sessionStartedAt: currentSession.startedAt,
 *   mode: 'Flow',
 *   intention: 'Complete the feature',
 *   currentBandwidth: 75,
 *   onTimeUp: () => console.log('Time is up!'),
 *   onOvertime: () => console.log('5 minutes overtime!'),
 * })
 * ```
 */
export function useSessionTimer({
  isActive,
  isPaused,
  plannedDurationMinutes,
  sessionId,
  sessionStartedAt,
  mode,
  intention,
  currentBandwidth,
  onTimeUp,
  onOvertime,
}: UseSessionTimerProps): SessionTimerState {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isOvertime, setIsOvertime] = useState(false)
  
  // Refs for tracking trigger states (don't cause re-renders)
  const lastRecoverySave = useRef(0)
  const hasTriggeredTimeUp = useRef(false)
  const hasTriggeredOvertime = useRef(false)
  
  // Calculate derived values
  const totalSeconds = plannedDurationMinutes * 60
  const timeRemaining = Math.max(0, totalSeconds - elapsedSeconds)
  const overtimeSeconds = Math.max(0, elapsedSeconds - totalSeconds)
  
  // Save recovery data periodically
  const saveRecoveryData = useCallback(async () => {
    if (!sessionId) return
    
    const recoveryData: RecoveryData = {
      sessionId,
      startedAt: sessionStartedAt,
      plannedDurationMinutes,
      mode,
      intention,
      elapsedSeconds,
      bandwidthAtPause: currentBandwidth,
    }
    
    try {
      await tauriBridge.saveRecoveryData(recoveryData)
      console.log('[Timer] Recovery data saved at', elapsedSeconds, 'seconds')
    } catch (error) {
      console.error('[Timer] Failed to save recovery data:', error)
    }
  }, [sessionId, sessionStartedAt, plannedDurationMinutes, mode, intention, elapsedSeconds, currentBandwidth])
  
  // Main timer effect
  useEffect(() => {
    if (!isActive || isPaused) return
    
    const interval = setInterval(() => {
      setElapsedSeconds(prev => {
        const newElapsed = prev + 1
        
        // Check for time up (exactly when planned time completes)
        if (newElapsed >= totalSeconds && !hasTriggeredTimeUp.current) {
          hasTriggeredTimeUp.current = true
          // Use setTimeout to avoid state update during render
          setTimeout(() => onTimeUp(), 0)
        }
        
        // Check for overtime (5 minutes past planned time)
        const OVERTIME_THRESHOLD = 5 * 60 // 5 minutes in seconds
        if (newElapsed >= totalSeconds + OVERTIME_THRESHOLD && !hasTriggeredOvertime.current) {
          hasTriggeredOvertime.current = true
          setIsOvertime(true)
          setTimeout(() => onOvertime(), 0)
        }
        
        // Save recovery data every 30 seconds
        const RECOVERY_INTERVAL = 30
        if (newElapsed - lastRecoverySave.current >= RECOVERY_INTERVAL) {
          lastRecoverySave.current = newElapsed
          // Don't await - fire and forget to avoid blocking timer
          saveRecoveryData()
        }
        
        return newElapsed
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isActive, isPaused, totalSeconds, onTimeUp, onOvertime, saveRecoveryData])
  
  // Reset when session changes
  useEffect(() => {
    if (sessionId) {
      setElapsedSeconds(0)
      setIsOvertime(false)
      hasTriggeredTimeUp.current = false
      hasTriggeredOvertime.current = false
      lastRecoverySave.current = 0
    }
  }, [sessionId])
  
  // Save recovery data when pausing
  useEffect(() => {
    if (isPaused && sessionId) {
      saveRecoveryData()
    }
  }, [isPaused, sessionId, saveRecoveryData])
  
  return {
    elapsedSeconds,
    timeRemaining,
    isOvertime,
    overtimeSeconds,
  }
}

// Helper function to format time for display
export function formatTime(seconds: number): string {
  const mins = Math.floor(Math.abs(seconds) / 60)
  const secs = Math.abs(seconds) % 60
  const prefix = seconds < 0 ? '-' : ''
  return `${prefix}${mins}:${secs.toString().padStart(2, '0')}`
}

// Helper function to format time with hours
export function formatTimeWithHours(seconds: number): string {
  const hours = Math.floor(Math.abs(seconds) / 3600)
  const mins = Math.floor((Math.abs(seconds) % 3600) / 60)
  const secs = Math.abs(seconds) % 60
  const prefix = seconds < 0 ? '-' : ''
  
  if (hours > 0) {
    return `${prefix}${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${prefix}${mins}:${secs.toString().padStart(2, '0')}`
}

export type { UseSessionTimerProps, SessionTimerState }
