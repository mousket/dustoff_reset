
import { useState, useEffect, useCallback } from 'react'
import { tauriBridge } from '@/lib/tauri-bridge'
import { 
  UserBadge, 
  Streak, 
  BadgeEvaluationResult, 
  SessionStatsForBadges,
  BadgeDefinition,
} from '@/lib/badges/types'
import { getBadgeById, BADGE_DEFINITIONS } from '@/lib/badges/badge-definitions'

export interface BadgeWithDefinition extends UserBadge {
  definition: BadgeDefinition
}

export interface UseBadgesReturn {
  // State
  badges: BadgeWithDefinition[]
  streaks: Streak[]
  isLoading: boolean
  error: string | null
  
  // Computed
  totalBadges: number
  unlockedCount: number
  dailyStreak: Streak | null
  longestStreak: number
  
  // Actions
  refreshBadges: () => Promise<void>
  refreshStreaks: () => Promise<void>
  evaluateSession: (stats: SessionStatsForBadges) => Promise<BadgeEvaluationResult>
  isStreakAtRisk: () => Promise<boolean>
  
  // Helpers
  getBadgeDefinition: (badgeId: string) => BadgeDefinition | undefined
  isBadgeUnlocked: (badgeId: string) => boolean
}

export function useBadges(): UseBadgesReturn {
  const [badges, setBadges] = useState<BadgeWithDefinition[]>([])
  const [streaks, setStreaks] = useState<Streak[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load badges from backend
  const refreshBadges = useCallback(async () => {
    try {
      const userBadges = await tauriBridge.getBadges()
      
      // Combine with definitions
      const badgesWithDefs: BadgeWithDefinition[] = userBadges
        .map(ub => {
          const def = getBadgeById(ub.badgeId)
          if (!def) return null
          return { ...ub, definition: def }
        })
        .filter((b): b is BadgeWithDefinition => b !== null)
      
      setBadges(badgesWithDefs)
    } catch (err) {
      console.error('[useBadges] Failed to load badges:', err)
      setError(err instanceof Error ? err.message : 'Failed to load badges')
    }
  }, [])

  // Load streaks from backend
  const refreshStreaks = useCallback(async () => {
    try {
      const loadedStreaks = await tauriBridge.getStreaks()
      setStreaks(loadedStreaks)
    } catch (err) {
      console.error('[useBadges] Failed to load streaks:', err)
      setError(err instanceof Error ? err.message : 'Failed to load streaks')
    }
  }, [])

  // Initial load
  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      try {
        await tauriBridge.initBadges()
        await Promise.all([refreshBadges(), refreshStreaks()])
      } catch (err) {
        console.error('[useBadges] Init failed:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize badges')
      } finally {
        setIsLoading(false)
      }
    }
    
    init()
  }, [refreshBadges, refreshStreaks])

  // Evaluate session for badges
  const evaluateSession = useCallback(async (stats: SessionStatsForBadges): Promise<BadgeEvaluationResult> => {
    try {
      const result = await tauriBridge.evaluateBadgesForSession(stats)
      
      // Refresh badges and streaks after evaluation
      await Promise.all([refreshBadges(), refreshStreaks()])
      
      return result
    } catch (err) {
      console.error('[useBadges] Evaluation failed:', err)
      throw err
    }
  }, [refreshBadges, refreshStreaks])

  // Check if streak is at risk
  const isStreakAtRisk = useCallback(async (): Promise<boolean> => {
    try {
      return await tauriBridge.checkStreakAtRisk()
    } catch (err) {
      console.error('[useBadges] Streak check failed:', err)
      return false
    }
  }, [])

  // Check if badge is unlocked
  const isBadgeUnlocked = useCallback((badgeId: string): boolean => {
    return badges.some(b => b.badgeId === badgeId)
  }, [badges])

  // Computed values
  const totalBadges = BADGE_DEFINITIONS.length
  const unlockedCount = badges.length
  
  const dailyStreak = streaks.find(s => s.streakType === 'daily') || null
  
  const longestStreak = streaks.reduce((max, s) => 
    Math.max(max, s.longestCount), 0
  )

  return {
    badges,
    streaks,
    isLoading,
    error,
    totalBadges,
    unlockedCount,
    dailyStreak,
    longestStreak,
    refreshBadges,
    refreshStreaks,
    evaluateSession,
    isStreakAtRisk,
    getBadgeDefinition: getBadgeById,
    isBadgeUnlocked,
  }
}