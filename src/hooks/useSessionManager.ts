// src/hooks/useSessionManager.ts
// Orchestrates the full session lifecycle including timeline tracking and metrics

import { useState, useCallback } from 'react'
import { tauriBridge } from '@/lib/tauri-bridge'
import type { 
  SessionRecord, 
  SessionMode, 
  VictoryLevel, 
  EndReason,
  TimelineBlock,
  DistractionEvent,
  InterventionEvent,
  WhitelistedApp,
  WhitelistedTab,
} from '@/lib/tauri-types'

interface SessionConfig {
  mode: SessionMode
  durationMinutes: number
  intention: string
  whitelistedApps: string[]
  whitelistedTabs: string[]
}

interface UseSessionManagerReturn {
  // State
  currentSession: SessionRecord | null
  sessionId: string | null
  isSessionActive: boolean
  isSessionPaused: boolean
  sessionStartTime: Date | null
  
  // Actions
  startSession: (config: SessionConfig) => Promise<string>  // Returns sessionId
  pauseSession: () => Promise<void>
  resumeSession: () => Promise<void>
  endSession: (reason: EndReason, subReason?: string) => Promise<SessionRecord | null>
  
  // Timeline & Events
  addTimelineBlock: (state: TimelineBlock['state']) => void
  recordDistraction: (type: string) => void
  recordIntervention: (type: string) => void
  setInFlowState: (isInFlow: boolean) => void
  
  // Metrics
  getElapsedMinutes: () => number
  getLongestStreak: () => number
}

/**
 * useSessionManager
 * 
 * A hook that manages the complete session lifecycle:
 * - Session creation with proper record structure
 * - Timeline tracking (flow, working, distracted, reset states)
 * - Distraction and intervention event recording
 * - Victory level calculation based on completion ratio
 * - Flow efficiency calculation
 * - Session persistence to Tauri storage
 * 
 * @example
 * ```tsx
 * const {
 *   currentSession,
 *   isSessionActive,
 *   startSession,
 *   endSession,
 *   recordDistraction,
 * } = useSessionManager()
 * 
 * // Start a session
 * const sessionId = await startSession({
 *   mode: 'Flow',
 *   durationMinutes: 25,
 *   intention: 'Complete the feature',
 *   whitelistedApps: ['VS Code'],
 *   whitelistedTabs: [],
 * })
 * 
 * // Record events during session
 * recordDistraction('browser-switch')
 * 
 * // End session
 * const finalSession = await endSession('mission_complete')
 * ```
 */
export function useSessionManager(): UseSessionManagerReturn {
  const [currentSession, setCurrentSession] = useState<SessionRecord | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [isSessionPaused, setIsSessionPaused] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  
  // Event tracking
  const [timelineBlocks, setTimelineBlocks] = useState<TimelineBlock[]>([])
  const [distractionEvents, setDistractionEvents] = useState<DistractionEvent[]>([])
  const [interventionEvents, setInterventionEvents] = useState<InterventionEvent[]>([])
  const [currentState, setCurrentState] = useState<TimelineBlock['state']>('working')
  
  // Start a new session
  const startSession = useCallback(async (config: SessionConfig): Promise<string> => {
    const newSessionId = await tauriBridge.generateUuid()
    const startedAt = new Date().toISOString()
    const startTime = new Date()
    
    // Convert string arrays to proper types
    const whitelistedApps: WhitelistedApp[] = config.whitelistedApps.map(app => ({
      appName: app,
      purpose: null,
    }))
    
    const whitelistedTabs: WhitelistedTab[] = config.whitelistedTabs.map(url => ({
      url,
      title: '',
      purpose: null,
    }))
    
    const session: SessionRecord = {
      sessionId: newSessionId,
      startedAt,
      endedAt: null,
      plannedDurationMinutes: config.durationMinutes,
      actualDurationMinutes: null,
      mode: config.mode,
      intention: config.intention || null,
      victoryLevel: null,
      flowEfficiency: null,
      longestStreakMinutes: 0,
      distractionAttempts: 0,
      interventionsUsed: 0,
      endReason: null,
      endSubReason: null,
      timelineBlocks: [],
      distractionEvents: [],
      interventionEvents: [],
      whitelistedApps,
      whitelistedTabs,
    }
    
    // Initialize state
    setCurrentSession(session)
    setSessionId(newSessionId)
    setSessionStartTime(startTime)
    setIsSessionActive(true)
    setIsSessionPaused(false)
    setTimelineBlocks([{ start: 0, end: 0, state: 'working' }])
    setDistractionEvents([])
    setInterventionEvents([])
    setCurrentState('working')
    
    // Save initial session record
    await tauriBridge.saveSession(session)
    
    console.log('[SessionManager] Session started:', newSessionId)
    return newSessionId
  }, [])
  
  // Pause session
  const pauseSession = useCallback(async () => {
    setIsSessionPaused(true)
    console.log('[SessionManager] Session paused')
    // Note: Recovery data saving is handled by useSessionTimer
  }, [])
  
  // Resume session
  const resumeSession = useCallback(async () => {
    setIsSessionPaused(false)
    console.log('[SessionManager] Session resumed')
  }, [])
  
  // End session and calculate final metrics
  const endSession = useCallback(async (
    reason: EndReason,
    subReason?: string
  ): Promise<SessionRecord | null> => {
    if (!currentSession || !sessionStartTime) {
      console.warn('[SessionManager] No active session to end')
      return null
    }
    
    const endedAt = new Date()
    const actualDurationMinutes = Math.floor(
      (endedAt.getTime() - sessionStartTime.getTime()) / 60000
    )
    
    // Finalize the last timeline block
    const finalizedBlocks = [...timelineBlocks]
    if (finalizedBlocks.length > 0) {
      finalizedBlocks[finalizedBlocks.length - 1].end = actualDurationMinutes
    }
    
    // Calculate victory level based on completion ratio
    const ratio = actualDurationMinutes / currentSession.plannedDurationMinutes
    let victoryLevel: VictoryLevel
    if (reason === 'pulled_away') {
      victoryLevel = 'Missed'
    } else if (ratio >= 1.0) {
      victoryLevel = 'Legend'
    } else if (ratio >= 0.8) {
      victoryLevel = 'Good'
    } else if (ratio >= 0.6) {
      victoryLevel = 'Minimum'
    } else {
      victoryLevel = 'Missed'
    }
    
    // Calculate flow efficiency
    const flowBlocks = finalizedBlocks.filter(b => b.state === 'flow')
    const totalFlowMinutes = flowBlocks.reduce((sum, b) => sum + (b.end - b.start), 0)
    const flowEfficiency = actualDurationMinutes > 0 
      ? Math.round((totalFlowMinutes / actualDurationMinutes) * 100)
      : 0
    
    // Calculate longest streak (consecutive flow/working without distraction)
    const longestStreakMinutes = calculateLongestStreak(finalizedBlocks)
    
    const finalSession: SessionRecord = {
      ...currentSession,
      endedAt: endedAt.toISOString(),
      actualDurationMinutes,
      victoryLevel,
      flowEfficiency,
      longestStreakMinutes,
      distractionAttempts: distractionEvents.length,
      interventionsUsed: interventionEvents.length,
      endReason: reason,
      endSubReason: subReason || null,
      timelineBlocks: finalizedBlocks,
      distractionEvents,
      interventionEvents,
    }
    
    // Save final session and clear recovery data
    await tauriBridge.saveSession(finalSession)
    await tauriBridge.clearRecoveryData()
    
    // Update state
    setCurrentSession(finalSession)
    setIsSessionActive(false)
    setIsSessionPaused(false)
    
    console.log('[SessionManager] Session ended:', {
      sessionId: finalSession.sessionId,
      duration: actualDurationMinutes,
      victoryLevel,
      flowEfficiency,
    })
    
    return finalSession
  }, [currentSession, sessionStartTime, timelineBlocks, distractionEvents, interventionEvents])
  
  // Add a new timeline block (state change)
  const addTimelineBlock = useCallback((state: TimelineBlock['state']) => {
    if (!sessionStartTime || state === currentState) return
    
    const minutesElapsed = Math.floor((Date.now() - sessionStartTime.getTime()) / 60000)
    
    setTimelineBlocks(prev => {
      const updated = [...prev]
      // Close the current block
      if (updated.length > 0) {
        updated[updated.length - 1].end = minutesElapsed
      }
      // Start a new block
      updated.push({ start: minutesElapsed, end: minutesElapsed, state })
      return updated
    })
    
    setCurrentState(state)
    console.log('[SessionManager] State changed to:', state)
  }, [sessionStartTime, currentState])
  
  // Record a distraction event
  const recordDistraction = useCallback((type: string) => {
    if (!sessionStartTime) return
    
    const timestamp = Date.now() - sessionStartTime.getTime()
    setDistractionEvents(prev => [...prev, { timestamp, type }])
    console.log('[SessionManager] Distraction recorded:', type)
  }, [sessionStartTime])
  
  // Record an intervention event
  const recordIntervention = useCallback((type: string) => {
    if (!sessionStartTime) return
    
    const timestamp = Date.now() - sessionStartTime.getTime()
    setInterventionEvents(prev => [...prev, { timestamp, type }])
    console.log('[SessionManager] Intervention recorded:', type)
  }, [sessionStartTime])
  
  // Set flow state (convenience method)
  const setInFlowState = useCallback((isInFlow: boolean) => {
    addTimelineBlock(isInFlow ? 'flow' : 'working')
  }, [addTimelineBlock])
  
  // Get elapsed minutes since session start
  const getElapsedMinutes = useCallback(() => {
    if (!sessionStartTime) return 0
    return Math.floor((Date.now() - sessionStartTime.getTime()) / 60000)
  }, [sessionStartTime])
  
  // Get longest streak from current timeline
  const getLongestStreak = useCallback(() => {
    return calculateLongestStreak(timelineBlocks)
  }, [timelineBlocks])
  
  return {
    currentSession,
    sessionId,
    isSessionActive,
    isSessionPaused,
    sessionStartTime,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    addTimelineBlock,
    recordDistraction,
    recordIntervention,
    setInFlowState,
    getElapsedMinutes,
    getLongestStreak,
  }
}

/**
 * Calculate the longest consecutive streak of flow/working blocks
 */
function calculateLongestStreak(blocks: TimelineBlock[]): number {
  let longestStreak = 0
  let currentStreak = 0
  
  for (const block of blocks) {
    if (block.state === 'flow' || block.state === 'working') {
      currentStreak += block.end - block.start
      longestStreak = Math.max(longestStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  }
  
  return longestStreak
}

export type { SessionConfig, UseSessionManagerReturn }
