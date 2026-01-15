import { useCallback } from 'react'
import { BadgeDefinition } from '@/lib/badges/types'
import { invoke } from '@tauri-apps/api/core'

interface ShareStats {
  streak?: number
  totalSessions?: number
  totalHours?: number
}

interface ShareOptions {
  badge: BadgeDefinition
  stats?: ShareStats
}

interface UseShareBadgeReturn {
  shareToTwitter: (options: ShareOptions) => void
  shareToClipboard: (options: ShareOptions) => Promise<boolean>
  recordShare: () => Promise<void>
  buildShareText: (options: ShareOptions) => string
}

/**
 * useShareBadge
 * 
 * Hook for sharing badges to social media and clipboard.
 * Also tracks shares for the "Spread the Word" and "Influencer" badges.
 */
export function useShareBadge(): UseShareBadgeReturn {
  
  // Build share text from badge and stats
  const buildShareText = useCallback((options: ShareOptions): string => {
    const { badge, stats } = options
    
    let text = badge.shareText
    
    // Add stats if available
    if (stats?.streak && stats.streak > 1) {
      text += ` 🔥 ${stats.streak}-day streak!`
    }
    if (stats?.totalHours && stats.totalHours > 0) {
      text += ` ⏱️ ${stats.totalHours}h focused`
    }
    
    // Add hashtags
    const hashtags = badge.hashtags.join(' #')
    text += `\n\n#${hashtags}`
    
    // Add app link
    text += '\n\ndustoffreset.com'
    
    return text
  }, [])

  // Share to Twitter/X
  const shareToTwitter = useCallback((options: ShareOptions) => {
    const text = buildShareText(options)
    const encodedText = encodeURIComponent(text)
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`
    
    // Open in default browser via Tauri shell or fallback to window.open
    try {
      window.open(twitterUrl, '_blank', 'width=550,height=420')
    } catch (err) {
      console.error('[Share] Failed to open Twitter:', err)
    }
  }, [buildShareText])

  // Copy to clipboard
  const shareToClipboard = useCallback(async (options: ShareOptions): Promise<boolean> => {
    const text = buildShareText(options)
    
    try {
      await navigator.clipboard.writeText(text)
      console.log('[Share] Copied to clipboard')
      return true
    } catch (err) {
      console.error('[Share] Failed to copy to clipboard:', err)
      return false
    }
  }, [buildShareText])

  // Record share action (for share badges)
  // Increments the total_shares lifetime stat
  const recordShare = useCallback(async () => {
    try {
      // Call backend to increment total_shares stat
      // We need a dedicated command for this - using direct invoke
      await invoke('increment_share_count')
      console.log('[Share] Share recorded')
    } catch (err) {
      // If command doesn't exist, log but don't fail
      console.warn('[Share] Failed to record share (command may not exist):', err)
    }
  }, [])
  

  return {
    shareToTwitter,
    shareToClipboard,
    recordShare,
    buildShareText,
  }
}