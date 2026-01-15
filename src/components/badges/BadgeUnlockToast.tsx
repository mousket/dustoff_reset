import React, { useEffect, useState } from 'react'
import { BadgeDefinition, RARITY_COLORS } from '@/lib/badges/types'
import { cn } from '@/lib/utils'
import { Share2, X } from 'lucide-react'

interface BadgeUnlockToastProps {
  badge: BadgeDefinition
  isOpen: boolean
  onClose: () => void
  onShare?: () => void
  duration?: number
}

// Glow colors for each rarity
const RARITY_GLOWS: Record<string, string> = {
  common: 'rgba(156, 163, 175, 0.15)',
  uncommon: 'rgba(34, 197, 94, 0.25)',
  rare: 'rgba(59, 130, 246, 0.3)',
  epic: 'rgba(168, 85, 247, 0.35)',
  legendary: 'rgba(251, 191, 36, 0.4)',
  shame: 'rgba(239, 68, 68, 0.25)',
}

/**
 * BadgeUnlockToast
 * 
 * A notification panel that slides out from below the HUD when a badge is unlocked.
 * Follows the app's panel pattern - attaches to the HUD like other panels.
 */
export const BadgeUnlockToast: React.FC<BadgeUnlockToastProps> = ({
  badge,
  isOpen,
  onClose,
  onShare,
  duration = 5000,
}) => {
  const colors = RARITY_COLORS[badge.rarity]
  const glowColor = RARITY_GLOWS[badge.rarity]

  // Auto close timer
  useEffect(() => {
    if (!isOpen) return
    
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    
    return () => clearTimeout(timer)
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  return (
    <div className="mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div
        className={cn(
          'flex items-center gap-4 p-4 rounded-2xl',
          'bg-[#0a0f0d]/95 backdrop-blur-xl',
          'border',
          colors.border,
          'w-[320px]'
        )}
        style={{
          boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 40px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.05)`,
        }}
      >
        {/* Badge Icon with Glow */}
        <div
          className={cn(
            'w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-full',
            'border',
            colors.border,
          )}
          style={{
            background: `radial-gradient(circle at 30% 30%, ${glowColor}, transparent 70%)`,
            boxShadow: `0 0 25px ${glowColor}`,
          }}
        >
          <span className="text-2xl">{badge.icon}</span>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-medium mb-0.5">
            Badge Unlocked
          </p>
          <p className="font-bold text-sm text-zinc-100 truncate">
            {badge.name}
          </p>
          <p className="text-[11px] text-zinc-500 line-clamp-1 italic">
            "{badge.flavorText}"
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          {onShare && (
            <button
              onClick={onShare}
              className={cn(
                'flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium',
                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
                'hover:bg-emerald-500/30 hover:border-emerald-500/50 transition-all duration-200'
              )}
            >
              <Share2 className="w-3 h-3" />
              Share
            </button>
          )}
          <button
            onClick={onClose}
            className="flex items-center justify-center text-zinc-600 hover:text-zinc-400 transition-colors p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Queue manager for multiple badge unlocks
interface BadgeQueueManagerProps {
  badges: BadgeDefinition[]
  onShare?: (badge: BadgeDefinition) => void
  onAllClosed?: () => void
}

export const BadgeUnlockQueue: React.FC<BadgeQueueManagerProps> = ({
  badges,
  onShare,
  onAllClosed,
}) => {
  const [queue, setQueue] = useState<BadgeDefinition[]>(badges)
  const [currentBadge, setCurrentBadge] = useState<BadgeDefinition | null>(null)

  useEffect(() => {
    if (!currentBadge && queue.length > 0) {
      setCurrentBadge(queue[0])
      setQueue(prev => prev.slice(1))
    }
  }, [currentBadge, queue])

  useEffect(() => {
    if (!currentBadge && queue.length === 0 && badges.length > 0) {
      onAllClosed?.()
    }
  }, [currentBadge, queue, badges.length, onAllClosed])

  const handleClose = () => {
    setCurrentBadge(null)
  }

  if (!currentBadge) return null

  return (
    <BadgeUnlockToast
      badge={currentBadge}
      isOpen={true}
      onClose={handleClose}
      onShare={onShare ? () => onShare(currentBadge) : undefined}
      duration={4000}
    />
  )
}