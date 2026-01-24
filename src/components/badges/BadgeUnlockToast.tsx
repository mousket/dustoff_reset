import React, { useEffect, useState } from 'react'
import { BadgeDefinition, RARITY_COLORS } from '@/lib/badges/types'
import { cn } from '@/lib/utils'
import { Share2 } from 'lucide-react'

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
  duration = 15000, // 15 seconds - give user time to read and decide to share
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
          'flex flex-col gap-3 p-4 rounded-2xl',
          'bg-[#0a0f0d]/98 backdrop-blur-xl',
          'border-2',
          colors.border,
          'w-[400px]'
        )}
        style={{
          boxShadow: `0 12px 40px rgba(0,0,0,0.7), 0 0 60px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.08)`,
        }}
      >
        {/* Top row: Icon + Content */}
        <div className="flex items-center gap-4">
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
            <p className="font-bold text-base text-zinc-100">
              {badge.name}
            </p>
            <p className="text-xs text-zinc-500 italic">
              "{badge.flavorText}"
            </p>
          </div>
        </div>
        
        {/* Bottom row: Actions */}
        <div className="flex items-center gap-2">
          {onShare && (
            <button
              onClick={onShare}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold',
                'bg-gradient-to-r from-emerald-500/30 to-emerald-600/20 text-emerald-300',
                'border border-emerald-500/40',
                'hover:from-emerald-500/40 hover:to-emerald-600/30 hover:text-emerald-200',
                'hover:border-emerald-400/60',
                'transition-all duration-200 shadow-lg shadow-emerald-500/20'
              )}
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}

// Queue manager for multiple badge unlocks
// Now renders as a fixed overlay that floats on top of everything
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

  // Render as panel attached to HUD (not floating overlay)
  return (
    <BadgeUnlockToast
      badge={currentBadge}
      isOpen={true}
      onClose={handleClose}
      onShare={onShare ? () => onShare(currentBadge) : undefined}
      duration={15000} // 15 seconds - give user time to read and share
    />
  )
}