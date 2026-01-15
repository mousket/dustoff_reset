// src/components/badges/ShareCard.tsx

import React, { useRef } from 'react'
import { BadgeDefinition, RARITY_COLORS } from '@/lib/badges/types'
import { cn } from '@/lib/utils'

interface ShareCardProps {
  badge: BadgeDefinition
  username?: string
  date?: Date
  stats?: {
    streak?: number
    totalSessions?: number
    totalHours?: number
  }
  className?: string
}

// Glow colors for each rarity
const RARITY_GLOWS: Record<string, string> = {
  common: 'rgba(156, 163, 175, 0.15)',
  uncommon: 'rgba(34, 197, 94, 0.25)',
  rare: 'rgba(59, 130, 246, 0.3)',
  epic: 'rgba(168, 85, 247, 0.4)',
  legendary: 'rgba(251, 191, 36, 0.5)',
  shame: 'rgba(239, 68, 68, 0.3)',
}

export const ShareCard: React.FC<ShareCardProps> = ({
  badge,
  username,
  date = new Date(),
  stats,
  className,
}) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const colors = RARITY_COLORS[badge.rarity]
  const glowColor = RARITY_GLOWS[badge.rarity]

  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  // Background gradient based on rarity - using app's dark theme
  const getBgGradient = () => {
    switch (badge.rarity) {
      case 'legendary':
        return 'from-amber-950/80 via-[#0a0f0d] to-amber-950/60'
      case 'epic':
        return 'from-purple-950/80 via-[#0a0f0d] to-purple-950/60'
      case 'rare':
        return 'from-blue-950/80 via-[#0a0f0d] to-blue-950/60'
      case 'shame':
        return 'from-red-950/80 via-[#0a0f0d] to-red-950/60'
      case 'uncommon':
        return 'from-emerald-950/80 via-[#0a0f0d] to-emerald-950/60'
      default:
        return 'from-zinc-900 via-[#0a0f0d] to-zinc-900'
    }
  }

  return (
    <div
      ref={cardRef}
      className={cn(
        'w-[400px] h-[500px] p-6 rounded-2xl',
        'bg-gradient-to-br',
        getBgGradient(),
        'border',
        colors.border,
        'flex flex-col items-center justify-between',
        className
      )}
      style={{
        boxShadow: `0 8px 40px rgba(0,0,0,0.6), 0 0 60px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <span className="text-xs font-bold text-zinc-500 tracking-widest uppercase">
            Dustoff Reset
          </span>
        </div>
        <span className={cn(
          'text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-medium',
          colors.bg, 
          colors.text,
          'border',
          colors.border
        )}>
          {badge.rarity}
        </span>
      </div>

      {/* Badge Icon */}
      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            'w-28 h-28 flex items-center justify-center rounded-full',
            'border-2',
            colors.border
          )}
          style={{
            background: `radial-gradient(circle at 30% 30%, ${glowColor}, transparent 70%)`,
            boxShadow: `0 0 40px ${glowColor}`,
          }}
        >
          <span className="text-5xl">{badge.icon}</span>
        </div>
        
        {/* Badge Name */}
        <h2 className={cn('text-2xl font-bold text-center text-zinc-100')}>
          {badge.name}
        </h2>
        
        {/* Flavor Text */}
        <p className="text-zinc-500 text-center text-sm italic max-w-[280px]">
          "{badge.flavorText}"
        </p>
      </div>

      {/* Stats (if provided) */}
      {stats && (
        <div className="flex justify-center gap-4 w-full">
          {stats.streak !== undefined && stats.streak > 0 && (
            <div 
              className="flex flex-col items-center px-4 py-2 rounded-xl bg-[#0a0f0d]/60 border border-zinc-800/60"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}
            >
              <span className="text-xl font-bold text-amber-400">🔥 {stats.streak}</span>
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Streak</span>
            </div>
          )}
          {stats.totalSessions !== undefined && stats.totalSessions > 0 && (
            <div 
              className="flex flex-col items-center px-4 py-2 rounded-xl bg-[#0a0f0d]/60 border border-zinc-800/60"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}
            >
              <span className="text-xl font-bold text-emerald-400">{stats.totalSessions}</span>
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Sessions</span>
            </div>
          )}
          {stats.totalHours !== undefined && stats.totalHours > 0 && (
            <div 
              className="flex flex-col items-center px-4 py-2 rounded-xl bg-[#0a0f0d]/60 border border-zinc-800/60"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}
            >
              <span className="text-xl font-bold text-purple-400">{stats.totalHours}h</span>
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Focus</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between w-full pt-3 border-t border-zinc-800/60">
        <div className="text-xs text-zinc-600">
          {username && <span className="text-zinc-500">@{username}</span>}
          {username && ' · '}
          {formattedDate}
        </div>
        <div className="text-[10px] text-zinc-700 tracking-wider">
          dustoffreset.com
        </div>
      </div>
    </div>
  )
}
