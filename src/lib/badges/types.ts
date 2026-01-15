// src/lib/badges/types.ts

export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'shame'

export type BadgeCategory = 
  | 'milestone' 
  | 'streak' 
  | 'performance' 
  | 'mode' 
  | 'resilience' 
  | 'social' 
  | 'shame' 
  | 'secret'

export interface BadgeDefinition {
  id: string
  name: string
  description: string
  flavorText: string
  icon: string
  rarity: BadgeRarity
  category: BadgeCategory
  secret: boolean
  shareText: string
  hashtags: string[]
}

export interface UserBadge {
  id: string
  badgeId: string
  unlockedAt: number
  sessionId?: string
  metadata?: string
}

export interface Streak {
  id: string
  streakType: string
  currentCount: number
  longestCount: number
  lastActivityDate?: string
  startedAt?: number
  updatedAt: number
}

export interface BadgeProgress {
  badgeId: string
  currentValue: number
  targetValue: number
  updatedAt: number
}

export interface BadgeEvaluationResult {
  unlocked: UserBadge[]
  progressUpdates: BadgeProgress[]
  streakUpdates: Streak[]
}

export interface SessionStatsForBadges {
  sessionId: string
  mode: string
  durationMinutes: number
  finalBandwidth: number
  distractionCount: number
  delayGatesShown: number
  delayGatesReturned: number
  blocksShown: number
  extensionsSurvived: number
  totalPenalties: number
  totalBonuses: number
  completed: boolean
  quitEarly: boolean
}

// Rarity colors for styling
export const RARITY_COLORS: Record<BadgeRarity, { bg: string; border: string; text: string }> = {
  common: {
    bg: 'bg-gray-500/20',
    border: 'border-gray-500/40',
    text: 'text-gray-400',
  },
  uncommon: {
    bg: 'bg-green-500/20',
    border: 'border-green-500/40',
    text: 'text-green-400',
  },
  rare: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/40',
    text: 'text-blue-400',
  },
  epic: {
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/40',
    text: 'text-purple-400',
  },
  legendary: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
  },
  shame: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/40',
    text: 'text-red-400',
  },
}

// Category icons
export const CATEGORY_ICONS: Record<BadgeCategory, string> = {
  milestone: '🏁',
  streak: '🔥',
  performance: '⚡',
  mode: '🎮',
  resilience: '💪',
  social: '📢',
  shame: '😅',
  secret: '🔮',
}
