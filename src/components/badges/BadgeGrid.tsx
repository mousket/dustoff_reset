import React, { useState, useMemo } from 'react'
import { BadgeDefinition, BadgeCategory, CATEGORY_ICONS } from '@/lib/badges/types'
import { BADGE_DEFINITIONS, getBadgesByCategory } from '@/lib/badges/badge-definitions'
import { BadgeCard } from './BadgeCard'
import { cn } from '@/lib/utils'

interface BadgeGridProps {
  unlockedBadgeIds: string[]
  unlockedAtMap?: Record<string, number>
  onBadgeClick?: (badge: BadgeDefinition) => void
  showLocked?: boolean
  filterCategory?: BadgeCategory | 'all'
  className?: string
}

export const BadgeGrid: React.FC<BadgeGridProps> = ({
  unlockedBadgeIds,
  unlockedAtMap = {},
  onBadgeClick,
  showLocked = true,
  filterCategory = 'all',
  className,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>(filterCategory)

  const categories: (BadgeCategory | 'all')[] = [
    'all',
    'milestone',
    'streak',
    'performance',
    'mode',
    'resilience',
    'shame',
    'secret',
    'social',
  ]

  const filteredBadges = useMemo(() => {
    let badges = selectedCategory === 'all' 
      ? BADGE_DEFINITIONS 
      : getBadgesByCategory(selectedCategory)
    
    if (!showLocked) {
      badges = badges.filter(b => unlockedBadgeIds.includes(b.id))
    }
    
    // Sort: unlocked first, then by rarity
    const rarityOrder = ['legendary', 'epic', 'rare', 'uncommon', 'common', 'shame']
    
    return badges.sort((a, b) => {
      const aUnlocked = unlockedBadgeIds.includes(a.id) ? 0 : 1
      const bUnlocked = unlockedBadgeIds.includes(b.id) ? 0 : 1
      
      if (aUnlocked !== bUnlocked) return aUnlocked - bUnlocked
      
      return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
    })
  }, [selectedCategory, showLocked, unlockedBadgeIds])

  const stats = useMemo(() => {
    const total = BADGE_DEFINITIONS.length
    const unlocked = unlockedBadgeIds.length
    const percentage = Math.round((unlocked / total) * 100)
    return { total, unlocked, percentage }
  }, [unlockedBadgeIds])

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Stats Bar */}
      <div 
        className="flex items-center gap-3 p-3 rounded-xl bg-[#0a0f0d]/80 border border-zinc-800/60"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        <span className="text-xl">🎖️</span>
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-lg font-bold text-zinc-100">
              {stats.unlocked}
            </span>
            <span className="text-sm text-zinc-600">
              / {stats.total} badges
            </span>
          </div>
          {/* Progress Bar */}
          <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ 
                width: `${stats.percentage}%`,
                background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 50%, #8b5cf6 100%)',
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
              }}
            />
          </div>
        </div>
        <span className="text-sm font-medium text-emerald-500">
          {stats.percentage}%
        </span>
      </div>
      
      {/* Category Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap',
              'transition-all duration-200 border',
              selectedCategory === cat
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                : 'bg-zinc-900/50 text-zinc-500 border-zinc-800/50 hover:bg-zinc-800/50 hover:text-zinc-400'
            )}
          >
            {cat === 'all' ? '🏆 All' : `${CATEGORY_ICONS[cat]} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
          </button>
        ))}
      </div>
      
      {/* Badge Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {filteredBadges.map(badge => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            unlocked={unlockedBadgeIds.includes(badge.id)}
            unlockedAt={unlockedAtMap[badge.id]}
            size="sm"
            onClick={onBadgeClick ? () => onBadgeClick(badge) : undefined}
            showDescription={false}
          />
        ))}
      </div>
      
      {/* Empty State */}
      {filteredBadges.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-zinc-600">
          <span className="text-3xl mb-2 opacity-50">🔒</span>
          <p className="text-sm">No badges in this category yet</p>
          <p className="text-xs text-zinc-700">Complete sessions to unlock badges!</p>
        </div>
      )}
    </div>
  )
}