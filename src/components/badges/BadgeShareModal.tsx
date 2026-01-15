// src/components/badges/BadgeShareModal.tsx
// Panel-style modal for sharing badges - slides out from HUD like other panels

import React, { useState } from 'react'
import { BadgeDefinition, RARITY_COLORS } from '@/lib/badges/types'
import { useShareBadge } from '@/hooks/useShareBadge'
import { cn } from '@/lib/utils'
import { X, Check, Copy } from 'lucide-react'

interface BadgeShareModalProps {
  badge: BadgeDefinition
  isOpen: boolean
  stats?: {
    streak?: number
    totalSessions?: number
    totalHours?: number
  }
  onClose: () => void
}

// Glow colors for rarity
const RARITY_GLOWS: Record<string, string> = {
  common: 'rgba(156, 163, 175, 0.15)',
  uncommon: 'rgba(34, 197, 94, 0.25)',
  rare: 'rgba(59, 130, 246, 0.3)',
  epic: 'rgba(168, 85, 247, 0.35)',
  legendary: 'rgba(251, 191, 36, 0.4)',
  shame: 'rgba(239, 68, 68, 0.25)',
}

/**
 * BadgeShareModal
 * 
 * A panel that slides out from the HUD for sharing badge achievements.
 * Contains a compact preview and share buttons for Twitter/X and clipboard.
 */
export const BadgeShareModal: React.FC<BadgeShareModalProps> = ({
  badge,
  isOpen,
  stats,
  onClose,
}) => {
  const [copied, setCopied] = useState(false)
  const { shareToTwitter, shareToClipboard, recordShare, buildShareText } = useShareBadge()
  const colors = RARITY_COLORS[badge.rarity]
  const glowColor = RARITY_GLOWS[badge.rarity]

  const handleTwitterShare = async () => {
    shareToTwitter({ badge, stats })
    await recordShare()
  }

  const handleCopyText = async () => {
    const success = await shareToClipboard({ badge, stats })
    if (success) {
      setCopied(true)
      await recordShare()
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!isOpen) return null

  const previewText = buildShareText({ badge, stats })

  return (
    <div className="mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div 
        className="relative flex flex-col items-center gap-4 p-5 rounded-2xl bg-[#0a0f0d]/95 backdrop-blur-xl border border-zinc-800/60 w-[440px]"
        style={{
          boxShadow: `0 8px 40px rgba(0,0,0,0.6), 0 0 40px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.05)`,
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        
        {/* Title */}
        <div className="text-center">
          <h2 className="text-base font-bold text-zinc-100 mb-0.5">
            Share Your Achievement
          </h2>
          <p className="text-xs text-zinc-500">
            Let the world know about your focus journey
          </p>
        </div>
        
        {/* Badge Preview (compact inline version) */}
        <div 
          className="flex items-center gap-4 w-full p-3 rounded-xl border"
          style={{
            background: `linear-gradient(135deg, ${glowColor} 0%, transparent 50%)`,
            borderColor: colors.border.replace('border-', '').replace('/40', ''),
          }}
        >
          {/* Badge Icon */}
          <div
            className={cn(
              'w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-full',
              'border',
              colors.border,
            )}
            style={{
              background: `radial-gradient(circle at 30% 30%, ${glowColor}, transparent 70%)`,
              boxShadow: `0 0 20px ${glowColor}`,
            }}
          >
            <span className="text-3xl">{badge.icon}</span>
          </div>
          
          {/* Badge Info */}
          <div className="flex-1 min-w-0">
            <p className={cn('font-bold text-lg text-zinc-100 truncate')}>
              {badge.name}
            </p>
            <p className="text-xs text-zinc-500 italic line-clamp-2">
              "{badge.flavorText}"
            </p>
            {/* Stats Row */}
            {stats && (
              <div className="flex gap-3 mt-2">
                {stats.streak !== undefined && stats.streak > 0 && (
                  <span className="text-xs text-amber-400 font-medium">🔥 {stats.streak}</span>
                )}
                {stats.totalSessions !== undefined && stats.totalSessions > 0 && (
                  <span className="text-xs text-emerald-400 font-medium">{stats.totalSessions} sessions</span>
                )}
                {stats.totalHours !== undefined && stats.totalHours > 0 && (
                  <span className="text-xs text-purple-400 font-medium">{stats.totalHours}h focus</span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Share Buttons */}
        <div className="flex gap-2 w-full">
          {/* Twitter/X Button */}
          <button
            onClick={handleTwitterShare}
            className={cn(
              'flex-1 flex items-center justify-center gap-2',
              'px-4 py-2.5 rounded-xl text-sm font-medium',
              'bg-[#1DA1F2]/15 text-[#1DA1F2] border border-[#1DA1F2]/30',
              'hover:bg-[#1DA1F2]/25 hover:border-[#1DA1F2]/50 transition-all duration-200'
            )}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on X
          </button>
          
          {/* Copy Button */}
          <button
            onClick={handleCopyText}
            className={cn(
              'flex-1 flex items-center justify-center gap-2',
              'px-4 py-2.5 rounded-xl text-sm font-medium',
              'bg-zinc-800/50 text-zinc-300 border border-zinc-700/50',
              'hover:bg-zinc-700/50 hover:border-zinc-600/50 transition-all duration-200',
              copied && 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            )}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Text
              </>
            )}
          </button>
        </div>
        
        {/* Share Preview Text */}
        <div 
          className="w-full p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/50"
          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)' }}
        >
          <p className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1">Preview</p>
          <p className="text-[11px] text-zinc-400 whitespace-pre-wrap leading-relaxed line-clamp-4">
            {previewText}
          </p>
        </div>
        
        {/* Dismiss */}
        <button
          onClick={onClose}
          className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors"
        >
          Maybe Later
        </button>
      </div>
    </div>
  )
}
