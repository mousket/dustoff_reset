// src/hooks/useSessionTelemetryStats.ts
// Tracks and accumulates telemetry statistics during a session

import { useState, useCallback, useRef } from 'react'
import { tauriBridge, SessionTelemetryStats } from '@/lib/tauri-bridge'

/**
 * Extended telemetry stats that includes penalty/bonus tracking
 * These are computed in the frontend and saved at session end
 */
export interface SessionTelemetryBreakdown {
  // From backend SessionTelemetryStats
  appSwitches: number
  nonWhitelistedSwitches: number
  tabSwitches: number
  nonWhitelistedDomains: number
  timeInWhitelisted: number
  timeInNonWhitelisted: number
  appUsage: Record<string, number>
  domainVisits: Record<string, number>
  
  // Frontend-tracked penalty/bonus stats
  totalPenaltyPoints: number
  totalBonusPoints: number
  offenseCount: number
  interventionCount: number
  interventionReturnedCount: number  // Times user chose "Return to Work"
  interventionProceededCount: number // Times user waited through (Flow) or was blocked (Legend)
  
  // Breakdown by category
  penaltiesByCategory: Record<string, number>
  offensesByCategory: Record<string, number>
  
  // Flow state tracking
  flowAchievedCount: number
  flowLostCount: number
  totalFlowMinutes: number
  
  // Reset ritual tracking
  resetRitualsCompleted: number
  resetBonusPoints: number
}

/**
 * Create initial empty stats
 */
export function createInitialTelemetryBreakdown(): SessionTelemetryBreakdown {
  return {
    appSwitches: 0,
    nonWhitelistedSwitches: 0,
    tabSwitches: 0,
    nonWhitelistedDomains: 0,
    timeInWhitelisted: 0,
    timeInNonWhitelisted: 0,
    appUsage: {},
    domainVisits: {},
    totalPenaltyPoints: 0,
    totalBonusPoints: 0,
    offenseCount: 0,
    interventionCount: 0,
    interventionReturnedCount: 0,
    interventionProceededCount: 0,
    penaltiesByCategory: {},
    offensesByCategory: {},
    flowAchievedCount: 0,
    flowLostCount: 0,
    totalFlowMinutes: 0,
    resetRitualsCompleted: 0,
    resetBonusPoints: 0,
  }
}

interface UseSessionTelemetryStatsProps {
  sessionId: string | null
  isActive: boolean
}

interface UseSessionTelemetryStatsReturn {
  stats: SessionTelemetryBreakdown
  
  // Recording functions
  recordPenalty: (points: number, category: string, reason?: string) => void
  recordBonus: (points: number, reason?: string) => void
  recordIntervention: (type: 'returned' | 'proceeded') => void
  recordFlowAchieved: () => void
  recordFlowLost: () => void
  recordResetRitual: (bonusPoints: number) => void
  recordAppSwitch: (appName: string, isWhitelisted: boolean) => void
  recordDomainVisit: (domain: string, isWhitelisted: boolean) => void
  
  // Lifecycle
  resetStats: () => void
  saveStats: () => Promise<void>
  loadStats: () => Promise<void>
}

/**
 * useSessionTelemetryStats
 * 
 * Tracks detailed telemetry statistics during a session including:
 * - Penalty and bonus point totals
 * - Offense counts by category
 * - Intervention responses
 * - Flow state transitions
 * - Reset ritual completions
 * 
 * Stats are accumulated in memory and saved to the database at session end.
 */
export function useSessionTelemetryStats({
  sessionId,
  isActive,
}: UseSessionTelemetryStatsProps): UseSessionTelemetryStatsReturn {
  const [stats, setStats] = useState<SessionTelemetryBreakdown>(createInitialTelemetryBreakdown())
  const flowStartTime = useRef<number | null>(null)
  // Use ref for isActive to avoid closure issues with telemetry handlers
  const isActiveRef = useRef(isActive)
  isActiveRef.current = isActive
  
  // Record a penalty
  const recordPenalty = useCallback((points: number, category: string, reason?: string) => {
    if (!isActiveRef.current) return
    
    const absPoints = Math.abs(points) // Penalties are stored as positive values
    
    setStats(prev => ({
      ...prev,
      totalPenaltyPoints: prev.totalPenaltyPoints + absPoints,
      offenseCount: prev.offenseCount + 1,
      penaltiesByCategory: {
        ...prev.penaltiesByCategory,
        [category]: (prev.penaltiesByCategory[category] || 0) + absPoints,
      },
      offensesByCategory: {
        ...prev.offensesByCategory,
        [category]: (prev.offensesByCategory[category] || 0) + 1,
      },
    }))
    
    console.log(`[TelemetryStats] Recorded penalty: ${absPoints} pts (${category})${reason ? ` - ${reason}` : ''}`)
  }, [])
  
  // Record a bonus
  const recordBonus = useCallback((points: number, reason?: string) => {
    if (!isActiveRef.current) return
    
    setStats(prev => ({
      ...prev,
      totalBonusPoints: prev.totalBonusPoints + points,
    }))
    
    console.log(`[TelemetryStats] Recorded bonus: +${points} pts${reason ? ` - ${reason}` : ''}`)
  }, [])
  
  // Record intervention response
  const recordIntervention = useCallback((type: 'returned' | 'proceeded') => {
    if (!isActiveRef.current) return
    
    setStats(prev => ({
      ...prev,
      interventionCount: prev.interventionCount + 1,
      interventionReturnedCount: type === 'returned' 
        ? prev.interventionReturnedCount + 1 
        : prev.interventionReturnedCount,
      interventionProceededCount: type === 'proceeded'
        ? prev.interventionProceededCount + 1
        : prev.interventionProceededCount,
    }))
    
    console.log(`[TelemetryStats] Recorded intervention: ${type}`)
  }, [])
  
  // Record flow achieved
  const recordFlowAchieved = useCallback(() => {
    if (!isActiveRef.current) return
    
    flowStartTime.current = Date.now()
    
    setStats(prev => ({
      ...prev,
      flowAchievedCount: prev.flowAchievedCount + 1,
    }))
    
    console.log('[TelemetryStats] Flow achieved')
  }, [])
  
  // Record flow lost
  const recordFlowLost = useCallback(() => {
    if (!isActiveRef.current) return
    
    let flowMinutes = 0
    if (flowStartTime.current) {
      flowMinutes = Math.round((Date.now() - flowStartTime.current) / 60000)
      flowStartTime.current = null
    }
    
    setStats(prev => ({
      ...prev,
      flowLostCount: prev.flowLostCount + 1,
      totalFlowMinutes: prev.totalFlowMinutes + flowMinutes,
    }))
    
    console.log(`[TelemetryStats] Flow lost (${flowMinutes} min in flow)`)
  }, [])
  
  // Record reset ritual completion
  const recordResetRitual = useCallback((bonusPoints: number) => {
    if (!isActiveRef.current) return
    
    setStats(prev => ({
      ...prev,
      resetRitualsCompleted: prev.resetRitualsCompleted + 1,
      resetBonusPoints: prev.resetBonusPoints + bonusPoints,
      totalBonusPoints: prev.totalBonusPoints + bonusPoints,
    }))
    
    console.log(`[TelemetryStats] Reset ritual completed: +${bonusPoints} pts`)
  }, [])
  
  // Record app switch
  const recordAppSwitch = useCallback((appName: string, isWhitelisted: boolean) => {
    if (!isActiveRef.current) return
    
    setStats(prev => ({
      ...prev,
      appSwitches: prev.appSwitches + 1,
      nonWhitelistedSwitches: isWhitelisted ? prev.nonWhitelistedSwitches : prev.nonWhitelistedSwitches + 1,
      appUsage: {
        ...prev.appUsage,
        [appName]: (prev.appUsage[appName] || 0) + 1,
      },
    }))
  }, [])
  
  // Record domain visit
  const recordDomainVisit = useCallback((domain: string, isWhitelisted: boolean) => {
    if (!isActiveRef.current) return
    
    setStats(prev => ({
      ...prev,
      tabSwitches: prev.tabSwitches + 1,
      nonWhitelistedDomains: isWhitelisted ? prev.nonWhitelistedDomains : prev.nonWhitelistedDomains + 1,
      domainVisits: {
        ...prev.domainVisits,
        [domain]: (prev.domainVisits[domain] || 0) + 1,
      },
    }))
  }, [])
  
  // Reset stats
  const resetStats = useCallback(() => {
    setStats(createInitialTelemetryBreakdown())
    flowStartTime.current = null
    console.log('[TelemetryStats] Stats reset')
  }, [])
  
  // Save stats to database
  const saveStats = useCallback(async () => {
    if (!sessionId) {
      console.warn('[TelemetryStats] Cannot save: no session ID')
      return
    }
    
    try {
      // Convert to SessionTelemetryStats format for backend
      const backendStats: SessionTelemetryStats = {
        appSwitches: stats.appSwitches,
        nonWhitelistedSwitches: stats.nonWhitelistedSwitches,
        tabSwitches: stats.tabSwitches,
        nonWhitelistedDomains: stats.nonWhitelistedDomains,
        timeInWhitelisted: stats.timeInWhitelisted,
        timeInNonWhitelisted: stats.timeInNonWhitelisted,
        appUsage: stats.appUsage,
        domainVisits: stats.domainVisits,
      }
      
      await tauriBridge.saveTelemetryStats(sessionId, backendStats)
      console.log('[TelemetryStats] Stats saved to database')
    } catch (error) {
      console.error('[TelemetryStats] Failed to save stats:', error)
    }
  }, [sessionId, stats])
  
  // Load stats from database
  const loadStats = useCallback(async () => {
    if (!sessionId) return
    
    try {
      const backendStats = await tauriBridge.getTelemetryStats(sessionId)
      if (backendStats) {
        setStats(prev => ({
          ...prev,
          ...backendStats,
        }))
        console.log('[TelemetryStats] Stats loaded from database')
      }
    } catch (error) {
      console.error('[TelemetryStats] Failed to load stats:', error)
    }
  }, [sessionId])
  
  return {
    stats,
    recordPenalty,
    recordBonus,
    recordIntervention,
    recordFlowAchieved,
    recordFlowLost,
    recordResetRitual,
    recordAppSwitch,
    recordDomainVisit,
    resetStats,
    saveStats,
    loadStats,
  }
}

export type { UseSessionTelemetryStatsProps, UseSessionTelemetryStatsReturn }
