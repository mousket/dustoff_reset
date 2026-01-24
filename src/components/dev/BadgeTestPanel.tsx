// src/components/dev/BadgeTestPanel.tsx
// DEV ONLY - Remove before production!
// Test panel for badges and sharing functionality

import React, { useState } from 'react'
import { BADGE_DEFINITIONS, getBadgesByCategory } from '@/lib/badges/badge-definitions'
import { BadgeDefinition, BadgeCategory, RARITY_COLORS } from '@/lib/badges/types'
import { useShareBadge } from '@/hooks/useShareBadge'
import { cn } from '@/lib/utils'

interface BadgeTestPanelProps {
  isOpen: boolean
  onClose: () => void
  onTriggerBadge: (badge: BadgeDefinition) => void
}

const CATEGORIES: BadgeCategory[] = [
  'milestone',
  'streak', 
  'performance',
  'mode',
  'shame',
  'resilience',
  'secret',
  'social',
]

export function BadgeTestPanel({ isOpen, onClose, onTriggerBadge }: BadgeTestPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory>('milestone')
  const [testStats, setTestStats] = useState({ streak: 7, totalSessions: 25, totalHours: 12 })
  const { shareToTwitter, shareToLinkedIn, shareToClipboard, buildShareText, buildLinkedInText } = useShareBadge()

  if (!isOpen) return null

  const filteredBadges = getBadgesByCategory(selectedCategory)

  const handleTestTwitter = async (badge: BadgeDefinition) => {
    console.log('[Test] Sharing to Twitter:', badge.name)
    await shareToTwitter({ badge, stats: testStats })
  }

  const handleTestLinkedIn = async (badge: BadgeDefinition) => {
    console.log('[Test] Sharing to LinkedIn:', badge.name)
    await shareToLinkedIn({ badge, stats: testStats })
  }

  const handleTestCopy = async (badge: BadgeDefinition) => {
    const success = await shareToClipboard({ badge, stats: testStats })
    if (success) {
      console.log('[Test] Copied to clipboard!')
    }
  }

  const handlePreviewText = (badge: BadgeDefinition, platform: 'twitter' | 'linkedin') => {
    const text = platform === 'twitter' 
      ? buildShareText({ badge, stats: testStats })
      : buildLinkedInText({ badge, stats: testStats })
    console.log(`[Test] ${platform} text:`, text)
    alert(`${platform.toUpperCase()} Preview:\n\n${text}`)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-[600px] max-h-[80vh] bg-zinc-900 border border-red-500/50 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-red-500/20 border-b border-red-500/30">
          <div>
            <h2 className="text-lg font-bold text-red-400">🧪 Badge Test Panel</h2>
            <p className="text-xs text-zinc-400">DEV ONLY - Remove before production!</p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-red-400 text-sm"
          >
            Close
          </button>
        </div>

        {/* Test Stats */}
        <div className="px-5 py-3 bg-zinc-800/50 border-b border-zinc-700/50">
          <p className="text-xs text-zinc-500 mb-2">Test Stats (used in share text):</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              🔥 Streak:
              <input
                type="number"
                value={testStats.streak}
                onChange={(e) => setTestStats(s => ({ ...s, streak: parseInt(e.target.value) || 0 }))}
                className="w-16 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-xs"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              📊 Sessions:
              <input
                type="number"
                value={testStats.totalSessions}
                onChange={(e) => setTestStats(s => ({ ...s, totalSessions: parseInt(e.target.value) || 0 }))}
                className="w-16 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-xs"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              ⏱️ Hours:
              <input
                type="number"
                value={testStats.totalHours}
                onChange={(e) => setTestStats(s => ({ ...s, totalHours: parseInt(e.target.value) || 0 }))}
                className="w-16 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white text-xs"
              />
            </label>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-5 py-2 border-b border-zinc-700/50 flex gap-1 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                selectedCategory === cat
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Badge List */}
        <div className="p-5 max-h-[400px] overflow-y-auto space-y-2">
          {filteredBadges.map((badge) => {
            const colors = RARITY_COLORS[badge.rarity]
            return (
              <div
                key={badge.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border',
                  colors.bg,
                  colors.border
                )}
              >
                {/* Badge Info */}
                <div className="w-10 h-10 flex items-center justify-center text-2xl">
                  {badge.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white text-sm">{badge.name}</p>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded', colors.bg, colors.text)}>
                      {badge.rarity}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 truncate">{badge.description}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={() => onTriggerBadge(badge)}
                    className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded text-emerald-400 text-xs"
                    title="Trigger badge unlock toast"
                  >
                    🎉 Unlock
                  </button>
                  <button
                    onClick={() => handleTestTwitter(badge)}
                    className="px-2 py-1 bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 border border-[#1DA1F2]/40 rounded text-[#1DA1F2] text-xs"
                    title="Test Twitter share"
                  >
                    𝕏
                  </button>
                  <button
                    onClick={() => handleTestLinkedIn(badge)}
                    className="px-2 py-1 bg-[#0A66C2]/20 hover:bg-[#0A66C2]/30 border border-[#0A66C2]/40 rounded text-[#0A66C2] text-xs"
                    title="Test LinkedIn share"
                  >
                    in
                  </button>
                  <button
                    onClick={() => handleTestCopy(badge)}
                    className="px-2 py-1 bg-zinc-700/50 hover:bg-zinc-600/50 border border-zinc-600/50 rounded text-zinc-400 text-xs"
                    title="Copy share text"
                  >
                    📋
                  </button>
                  <button
                    onClick={() => handlePreviewText(badge, 'twitter')}
                    className="px-2 py-1 bg-zinc-700/50 hover:bg-zinc-600/50 border border-zinc-600/50 rounded text-zinc-400 text-xs"
                    title="Preview share text"
                  >
                    👁️
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-800/50 border-t border-zinc-700/50">
          <p className="text-[10px] text-zinc-600 text-center">
            Total badges: {BADGE_DEFINITIONS.length} | Category: {filteredBadges.length} badges
          </p>
        </div>
      </div>
    </div>
  )
}
