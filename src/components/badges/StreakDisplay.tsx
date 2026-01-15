import React from 'react'
import { Streak } from '@/lib/badges/types'
import { cn } from '@/lib/utils'

interface StreakDisplayProps {
  streak: Streak
  isAtRisk?: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({
  streak,
  isAtRisk = false,
  size = 'md',
  showLabel = true,
  className,
}) => {
  const sizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
  }
  
  const getStreakColor = () => {
    if (isAtRisk) return { text: 'text-amber-400', glow: 'rgba(251, 191, 36, 0.3)' }
    if (streak.currentCount >= 30) return { text: 'text-purple-400', glow: 'rgba(168, 85, 247, 0.3)' }
    if (streak.currentCount >= 7) return { text: 'text-emerald-400', glow: 'rgba(16, 185, 129, 0.3)' }
    if (streak.currentCount >= 3) return { text: 'text-cyan-400', glow: 'rgba(6, 182, 212, 0.3)' }
    return { text: 'text-zinc-400', glow: 'rgba(161, 161, 170, 0.1)' }
  }
  
  const getStreakLabel = () => {
    switch (streak.streakType) {
      case 'daily': return 'Day Streak'
      case 'weekly': return 'Week Streak'
      case 'zen_daily': return 'Zen Streak'
      case 'flow_daily': return 'Flow Streak'
      case 'legend_daily': return 'Legend Streak'
      default: return 'Streak'
    }
  }

  const colors = getStreakColor()

  return (
    <div 
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-xl',
        'bg-[#0a0f0d]/80 border border-zinc-800/60',
        isAtRisk && 'border-amber-500/40',
        className
      )}
      style={{
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), 0 0 20px ${colors.glow}`,
      }}
    >
      <span className={cn('text-lg', isAtRisk && 'animate-pulse')}>🔥</span>
      <div className="flex flex-col">
        <span className={cn(sizeClasses[size], 'font-bold leading-none', colors.text)}>
          {streak.currentCount}
        </span>
        {showLabel && (
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
            {getStreakLabel()}
            {isAtRisk && (
              <span className="text-amber-500 ml-1 normal-case">• at risk!</span>
            )}
          </span>
        )}
      </div>
      {streak.longestCount > streak.currentCount && size !== 'sm' && (
        <div className="ml-auto text-right">
          <span className="text-[10px] text-zinc-700 uppercase tracking-wider block">Best</span>
          <span className="text-xs text-zinc-500 font-medium">{streak.longestCount}</span>
        </div>
      )}
    </div>
  )
}

// Compact version for HUD
export const StreakBadge: React.FC<{
  count: number
  isAtRisk?: boolean
  className?: string
}> = ({ count, isAtRisk, className }) => {
  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-full',
        'bg-[#0a0f0d]/90 backdrop-blur-sm border',
        isAtRisk 
          ? 'border-amber-500/50' 
          : 'border-zinc-800/60',
        className
      )}
      style={{
        boxShadow: isAtRisk 
          ? '0 0 12px rgba(251, 191, 36, 0.2)' 
          : 'inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <span className={cn('text-xs', isAtRisk && 'animate-pulse')}>🔥</span>
      <span className={cn(
        'font-bold text-xs',
        isAtRisk ? 'text-amber-400' : 'text-zinc-300'
      )}>
        {count}
      </span>
    </div>
  )
}