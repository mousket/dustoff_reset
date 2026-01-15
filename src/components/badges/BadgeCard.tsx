import React from 'react'
import { BadgeDefinition, RARITY_COLORS } from '@/lib/badges/types'
import { cn } from '@/lib/utils'

interface BadgeCardProps {
  badge: BadgeDefinition
  unlocked: boolean
  unlockedAt?: number
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  showDescription?: boolean
  className?: string
}

// Glow colors for each rarity
const RARITY_GLOWS: Record<string, string> = {
  common: 'rgba(156, 163, 175, 0.2)',
  uncommon: 'rgba(34, 197, 94, 0.3)',
  rare: 'rgba(59, 130, 246, 0.3)',
  epic: 'rgba(168, 85, 247, 0.4)',
  legendary: 'rgba(251, 191, 36, 0.5)',
  shame: 'rgba(239, 68, 68, 0.3)',
}

export const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  unlocked,
  unlockedAt,
  size = 'md',
  onClick,
  showDescription = true,
  className,
}) => {
  const colors = RARITY_COLORS[badge.rarity]
  const glowColor = RARITY_GLOWS[badge.rarity]
  
  const sizeClasses = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
  }
  
  const iconSizes = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  }
  
  const containerPadding = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  }
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-2xl transition-all duration-300',
        containerPadding[size],
        'bg-[#0a0f0d]/80 backdrop-blur-sm',
        'border',
        unlocked ? colors.border : 'border-zinc-800/60',
        onClick && 'cursor-pointer hover:scale-105',
        !unlocked && 'opacity-40',
        className
      )}
      style={{
        boxShadow: unlocked 
          ? `0 4px 20px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.05)` 
          : 'inset 0 1px 0 rgba(255,255,255,0.02)',
      }}
      onClick={onClick}
    >
      {/* Badge Icon Container */}
      <div
        className={cn(
          sizeClasses[size],
          'relative flex items-center justify-center rounded-full',
          'border',
          unlocked ? colors.border : 'border-zinc-700/50',
          'transition-all duration-500',
        )}
        style={{
          background: unlocked 
            ? `radial-gradient(circle at 30% 30%, ${glowColor}, transparent 70%)` 
            : 'radial-gradient(circle at 30% 30%, rgba(39, 39, 42, 0.5), transparent 70%)',
          boxShadow: unlocked 
            ? `0 0 20px ${glowColor}` 
            : undefined,
        }}
      >
        <span 
          className={cn(
            iconSizes[size], 
            'transition-all duration-300',
            !unlocked && 'grayscale opacity-40'
          )}
        >
          {unlocked || !badge.secret ? badge.icon : '❓'}
        </span>
        
        {/* Subtle inner glow for unlocked */}
        {unlocked && (
          <div 
            className="absolute inset-0 rounded-full opacity-30"
            style={{
              background: `radial-gradient(circle, ${glowColor} 0%, transparent 60%)`,
            }}
          />
        )}
      </div>
      
      {/* Badge Info */}
      <div className="text-center space-y-0.5">
        <p className={cn(
          'font-semibold leading-tight',
          size === 'sm' ? 'text-[10px]' : 'text-xs',
          unlocked ? 'text-zinc-200' : 'text-zinc-600'
        )}>
          {unlocked || !badge.secret ? badge.name : '???'}
        </p>
        
        {/* Rarity Label */}
        <p className={cn(
          'text-[10px] uppercase tracking-wider font-medium',
          unlocked ? colors.text : 'text-zinc-700',
        )}>
          {badge.rarity}
        </p>
      </div>
      
      {/* Description */}
      {showDescription && size !== 'sm' && (
        <p className={cn(
          'text-[10px] text-center leading-tight',
          unlocked ? 'text-zinc-400' : 'text-zinc-700',
          'line-clamp-2'
        )}>
          {unlocked || !badge.secret ? badge.description : 'Complete a secret challenge'}
        </p>
      )}
      
      {/* Unlock Date */}
      {unlocked && unlockedAt && size === 'lg' && (
        <p className="text-[10px] text-zinc-600">
          {formatDate(unlockedAt)}
        </p>
      )}
    </div>
  )
}