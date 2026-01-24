import { useCallback } from 'react'
import { BadgeDefinition } from '@/lib/badges/types'
import { invoke } from '@tauri-apps/api/core'
import { openUrl } from '@tauri-apps/plugin-opener'

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
  shareToTwitter: (options: ShareOptions) => Promise<void>
  shareToLinkedIn: (options: ShareOptions) => Promise<void>
  shareToClipboard: (options: ShareOptions) => Promise<boolean>
  recordShare: () => Promise<void>
  buildShareText: (options: ShareOptions) => string
  buildLinkedInText: (options: ShareOptions) => string
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

  // Build LinkedIn-optimized share text (more professional tone)
  const buildLinkedInText = useCallback((options: ShareOptions): string => {
    const { badge, stats } = options
    
    // LinkedIn prefers a more professional tone
    let text = ''
    
    // Map badge share text to more professional versions
    const professionalText = badge.shareText
      .replace(/!+/g, '.') // Reduce exclamation marks
      .replace(/🩸|💀|🫠|📉|🪨|💔|🚨|📱/g, '') // Remove shame emojis for LinkedIn
    
    text = professionalText.trim()
    
    // Add stats in a professional way
    if (stats?.streak && stats.streak > 1) {
      text += `\n\n📊 Current streak: ${stats.streak} days`
    }
    if (stats?.totalHours && stats.totalHours > 0) {
      text += `\n⏱️ Total focus time: ${stats.totalHours} hours`
    }
    if (stats?.totalSessions && stats.totalSessions > 0) {
      text += `\n✅ Sessions completed: ${stats.totalSessions}`
    }
    
    // Add professional context
    text += '\n\n🎯 Building better focus habits with Dustoff Reset - a desktop app that helps you stay focused and track your productivity.'
    
    // Add hashtags (LinkedIn-friendly)
    text += '\n\n#Productivity #Focus #DeepWork #DustoffReset'
    
    // Add app link
    text += '\n\ndustoffreset.com'
    
    return text
  }, [])

  // Share to Twitter/X
  const shareToTwitter = useCallback(async (options: ShareOptions) => {
    const text = buildShareText(options)
    const encodedText = encodeURIComponent(text)
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`
    
    // Open in default browser via Tauri opener plugin
    try {
      await openUrl(twitterUrl)
      console.log('[Share] Opened Twitter share URL')
    } catch (err) {
      console.error('[Share] Failed to open Twitter:', err)
      // Fallback to window.open
      window.open(twitterUrl, '_blank')
    }
  }, [buildShareText])

  // Share to LinkedIn
  const shareToLinkedIn = useCallback(async (options: ShareOptions) => {
    const text = buildLinkedInText(options)
    const encodedText = encodeURIComponent(text)
    
    // LinkedIn share URL with pre-filled text
    const linkedInUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodedText}`
    
    // Open in default browser via Tauri opener plugin
    try {
      await openUrl(linkedInUrl)
      console.log('[Share] Opened LinkedIn share URL')
    } catch (err) {
      console.error('[Share] Failed to open LinkedIn:', err)
      // Fallback to window.open
      window.open(linkedInUrl, '_blank')
    }
  }, [buildLinkedInText])

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
    shareToLinkedIn,
    shareToClipboard,
    recordShare,
    buildShareText,
    buildLinkedInText,
  }
}