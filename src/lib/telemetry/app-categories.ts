// src/lib/telemetry/app-categories.ts
// Cross-platform app categorization

import type { ActiveAppInfo } from './telemetry-listener'

/**
 * App categories from least to most distracting
 */
export enum AppCategory {
  PRODUCTIVE = 'productive',
  NEUTRAL = 'neutral',
  COMMUNICATION = 'communication',
  SOCIAL_MEDIA = 'social_media',
  ENTERTAINMENT = 'entertainment',
  GAMING = 'gaming',
  UNKNOWN = 'unknown',
}

/**
 * macOS Bundle ID to category mapping
 */
export const MACOS_BUNDLE_CATEGORIES: Record<string, AppCategory> = {
  // === PRODUCTIVE ===
  // IDEs & Editors
  'com.microsoft.VSCode': AppCategory.PRODUCTIVE,
  'com.microsoft.VSCodeInsiders': AppCategory.PRODUCTIVE,
  'com.apple.dt.Xcode': AppCategory.PRODUCTIVE,
  'com.sublimetext.4': AppCategory.PRODUCTIVE,
  'com.sublimetext.3': AppCategory.PRODUCTIVE,
  'com.jetbrains.intellij': AppCategory.PRODUCTIVE,
  'com.jetbrains.WebStorm': AppCategory.PRODUCTIVE,
  'com.jetbrains.pycharm': AppCategory.PRODUCTIVE,
  'com.jetbrains.goland': AppCategory.PRODUCTIVE,
  'com.jetbrains.rubymine': AppCategory.PRODUCTIVE,
  'com.github.atom': AppCategory.PRODUCTIVE,
  'abnerworks.Typora': AppCategory.PRODUCTIVE,
  'com.cursor.Cursor': AppCategory.PRODUCTIVE,
  'com.todesktop.230313mzl4w4u92': AppCategory.PRODUCTIVE, // Cursor alt bundle
  
  // Terminals
  'com.apple.Terminal': AppCategory.PRODUCTIVE,
  'com.googlecode.iterm2': AppCategory.PRODUCTIVE,
  'dev.warp.Warp-Stable': AppCategory.PRODUCTIVE,
  'co.zeit.hyper': AppCategory.PRODUCTIVE,
  'net.kovidgoyal.kitty': AppCategory.PRODUCTIVE,
  'io.alacritty': AppCategory.PRODUCTIVE,
  
  // Design
  'com.figma.Desktop': AppCategory.PRODUCTIVE,
  'com.bohemiancoding.sketch3': AppCategory.PRODUCTIVE,
  'com.adobe.illustrator': AppCategory.PRODUCTIVE,
  'com.adobe.Photoshop': AppCategory.PRODUCTIVE,
  'com.adobe.InDesign': AppCategory.PRODUCTIVE,
  'com.adobe.AfterEffects': AppCategory.PRODUCTIVE,
  'com.affinity.designer': AppCategory.PRODUCTIVE,
  'com.affinity.photo': AppCategory.PRODUCTIVE,
  
  // Notes & Docs
  'notion.id': AppCategory.PRODUCTIVE,
  'md.obsidian': AppCategory.PRODUCTIVE,
  'com.apple.Notes': AppCategory.PRODUCTIVE,
  'com.apple.iWork.Pages': AppCategory.PRODUCTIVE,
  'com.apple.iWork.Numbers': AppCategory.PRODUCTIVE,
  'com.apple.iWork.Keynote': AppCategory.PRODUCTIVE,
  'com.microsoft.Word': AppCategory.PRODUCTIVE,
  'com.microsoft.Excel': AppCategory.PRODUCTIVE,
  'com.microsoft.Powerpoint': AppCategory.PRODUCTIVE,
  'com.google.GoogleDocs': AppCategory.PRODUCTIVE,
  
  // Project Management
  'com.linear': AppCategory.PRODUCTIVE,
  'com.todoist.mac.Todoist': AppCategory.PRODUCTIVE,
  'com.culturedcode.ThingsMac': AppCategory.PRODUCTIVE,
  
  // Development Tools
  'com.apple.dt.Instruments': AppCategory.PRODUCTIVE,
  'com.postmanlabs.mac': AppCategory.PRODUCTIVE,
  'com.docker.docker': AppCategory.PRODUCTIVE,
  'com.insomnia.app': AppCategory.PRODUCTIVE,
  'com.tinyapp.TablePlus': AppCategory.PRODUCTIVE,
  
  // === NEUTRAL ===
  'com.apple.finder': AppCategory.NEUTRAL,
  'com.apple.Preview': AppCategory.NEUTRAL,
  'com.apple.calculator': AppCategory.NEUTRAL,
  'com.apple.systempreferences': AppCategory.NEUTRAL,
  'com.apple.SystemPreferences': AppCategory.NEUTRAL,
  'com.apple.ActivityMonitor': AppCategory.NEUTRAL,
  'com.apple.iCal': AppCategory.NEUTRAL,
  'com.1password.1password': AppCategory.NEUTRAL,
  'com.agilebits.onepassword7': AppCategory.NEUTRAL,
  'com.bitwarden.desktop': AppCategory.NEUTRAL,
  
  // Browsers (neutral by default - tabs determine category)
  'com.google.Chrome': AppCategory.NEUTRAL,
  'com.apple.Safari': AppCategory.NEUTRAL,
  'org.mozilla.firefox': AppCategory.NEUTRAL,
  'com.microsoft.edgemac': AppCategory.NEUTRAL,
  'com.brave.Browser': AppCategory.NEUTRAL,
  'company.thebrowser.Browser': AppCategory.NEUTRAL, // Arc
  'com.vivaldi.Vivaldi': AppCategory.NEUTRAL,
  'com.operasoftware.Opera': AppCategory.NEUTRAL,
  
  // === COMMUNICATION ===
  'com.tinyspeck.slackmacgap': AppCategory.COMMUNICATION,
  'com.hnc.Discord': AppCategory.COMMUNICATION,
  'com.apple.MobileSMS': AppCategory.COMMUNICATION,
  'com.apple.mail': AppCategory.COMMUNICATION,
  'com.microsoft.Outlook': AppCategory.COMMUNICATION,
  'us.zoom.xos': AppCategory.COMMUNICATION,
  'com.microsoft.teams': AppCategory.COMMUNICATION,
  'com.microsoft.teams2': AppCategory.COMMUNICATION,
  'ru.keepcoder.Telegram': AppCategory.COMMUNICATION,
  'net.whatsapp.WhatsApp': AppCategory.COMMUNICATION,
  'com.facebook.Messenger': AppCategory.COMMUNICATION,
  'org.whispersystems.signal-desktop': AppCategory.COMMUNICATION,
  'com.skype.skype': AppCategory.COMMUNICATION,
  
  // === SOCIAL MEDIA ===
  'com.twitter.twitter-mac': AppCategory.SOCIAL_MEDIA,
  'com.atebits.Tweetie2': AppCategory.SOCIAL_MEDIA,
  'com.facebook.Facebook': AppCategory.SOCIAL_MEDIA,
  'com.burbn.instagram': AppCategory.SOCIAL_MEDIA,
  'com.zhiliaoapp.musically': AppCategory.SOCIAL_MEDIA, // TikTok
  'com.linkedin.LinkedIn': AppCategory.SOCIAL_MEDIA,
  'com.reddit.Reddit': AppCategory.SOCIAL_MEDIA,
  'com.pinterest.PinterestMac': AppCategory.SOCIAL_MEDIA,
  
  // === ENTERTAINMENT ===
  'com.spotify.client': AppCategory.ENTERTAINMENT,
  'com.apple.Music': AppCategory.ENTERTAINMENT,
  'com.apple.iTunes': AppCategory.ENTERTAINMENT,
  'com.netflix.Netflix': AppCategory.ENTERTAINMENT,
  'tv.twitch.TwitchApp': AppCategory.ENTERTAINMENT,
  'com.apple.TV': AppCategory.ENTERTAINMENT,
  'com.apple.podcasts': AppCategory.ENTERTAINMENT,
  'com.audible.mac': AppCategory.ENTERTAINMENT,
  'org.videolan.vlc': AppCategory.ENTERTAINMENT,
  'io.plex.plex-media-player': AppCategory.ENTERTAINMENT,
  
  // === GAMING ===
  'com.valvesoftware.steam': AppCategory.GAMING,
  'com.epicgames.EpicGamesLauncher': AppCategory.GAMING,
  'com.blizzard.bnetlauncher': AppCategory.GAMING,
  'net.battle.app': AppCategory.GAMING,
  'com.riotgames.RiotClient': AppCategory.GAMING,
}

/**
 * Windows executable name to category mapping
 * Keys should be lowercase .exe names
 */
export const WINDOWS_EXE_CATEGORIES: Record<string, AppCategory> = {
  // === PRODUCTIVE ===
  // IDEs & Editors
  'code.exe': AppCategory.PRODUCTIVE,
  'code - insiders.exe': AppCategory.PRODUCTIVE,
  'devenv.exe': AppCategory.PRODUCTIVE, // Visual Studio
  'idea64.exe': AppCategory.PRODUCTIVE,
  'idea.exe': AppCategory.PRODUCTIVE,
  'webstorm64.exe': AppCategory.PRODUCTIVE,
  'pycharm64.exe': AppCategory.PRODUCTIVE,
  'goland64.exe': AppCategory.PRODUCTIVE,
  'sublime_text.exe': AppCategory.PRODUCTIVE,
  'atom.exe': AppCategory.PRODUCTIVE,
  'cursor.exe': AppCategory.PRODUCTIVE,
  'notepad++.exe': AppCategory.PRODUCTIVE,
  
  // Terminals
  'windowsterminal.exe': AppCategory.PRODUCTIVE,
  'cmd.exe': AppCategory.PRODUCTIVE,
  'powershell.exe': AppCategory.PRODUCTIVE,
  'pwsh.exe': AppCategory.PRODUCTIVE,
  'warp.exe': AppCategory.PRODUCTIVE,
  'alacritty.exe': AppCategory.PRODUCTIVE,
  
  // Design
  'figma.exe': AppCategory.PRODUCTIVE,
  'illustrator.exe': AppCategory.PRODUCTIVE,
  'photoshop.exe': AppCategory.PRODUCTIVE,
  'indesign.exe': AppCategory.PRODUCTIVE,
  'afterfx.exe': AppCategory.PRODUCTIVE,
  
  // Notes & Docs
  'notion.exe': AppCategory.PRODUCTIVE,
  'obsidian.exe': AppCategory.PRODUCTIVE,
  'winword.exe': AppCategory.PRODUCTIVE, // Microsoft Word
  'excel.exe': AppCategory.PRODUCTIVE,
  'powerpnt.exe': AppCategory.PRODUCTIVE,
  'onenote.exe': AppCategory.PRODUCTIVE,
  
  // Development Tools
  'docker desktop.exe': AppCategory.PRODUCTIVE,
  'postman.exe': AppCategory.PRODUCTIVE,
  'insomnia.exe': AppCategory.PRODUCTIVE,
  'tableplus.exe': AppCategory.PRODUCTIVE,
  
  // === NEUTRAL ===
  'explorer.exe': AppCategory.NEUTRAL,
  'systemsettings.exe': AppCategory.NEUTRAL,
  'taskmgr.exe': AppCategory.NEUTRAL,
  'calc.exe': AppCategory.NEUTRAL,
  '1password.exe': AppCategory.NEUTRAL,
  'bitwarden.exe': AppCategory.NEUTRAL,
  
  // Browsers (neutral by default)
  'chrome.exe': AppCategory.NEUTRAL,
  'msedge.exe': AppCategory.NEUTRAL,
  'firefox.exe': AppCategory.NEUTRAL,
  'brave.exe': AppCategory.NEUTRAL,
  'arc.exe': AppCategory.NEUTRAL,
  'opera.exe': AppCategory.NEUTRAL,
  'vivaldi.exe': AppCategory.NEUTRAL,
  
  // === COMMUNICATION ===
  'slack.exe': AppCategory.COMMUNICATION,
  'discord.exe': AppCategory.COMMUNICATION,
  'teams.exe': AppCategory.COMMUNICATION,
  'ms-teams.exe': AppCategory.COMMUNICATION,
  'outlook.exe': AppCategory.COMMUNICATION,
  'zoom.exe': AppCategory.COMMUNICATION,
  'telegram.exe': AppCategory.COMMUNICATION,
  'whatsapp.exe': AppCategory.COMMUNICATION,
  'signal.exe': AppCategory.COMMUNICATION,
  'skype.exe': AppCategory.COMMUNICATION,
  'messenger.exe': AppCategory.COMMUNICATION,
  
  // === SOCIAL MEDIA ===
  'twitter.exe': AppCategory.SOCIAL_MEDIA,
  'facebook.exe': AppCategory.SOCIAL_MEDIA,
  'instagram.exe': AppCategory.SOCIAL_MEDIA,
  'tiktok.exe': AppCategory.SOCIAL_MEDIA,
  'linkedin.exe': AppCategory.SOCIAL_MEDIA,
  
  // === ENTERTAINMENT ===
  'spotify.exe': AppCategory.ENTERTAINMENT,
  'netflix.exe': AppCategory.ENTERTAINMENT,
  'twitch.exe': AppCategory.ENTERTAINMENT,
  'vlc.exe': AppCategory.ENTERTAINMENT,
  'wmplayer.exe': AppCategory.ENTERTAINMENT,
  'plex.exe': AppCategory.ENTERTAINMENT,
  
  // === GAMING ===
  'steam.exe': AppCategory.GAMING,
  'steamwebhelper.exe': AppCategory.GAMING,
  'epicgameslauncher.exe': AppCategory.GAMING,
  'battle.net.exe': AppCategory.GAMING,
  'riotclientservices.exe': AppCategory.GAMING,
  'origin.exe': AppCategory.GAMING,
  'gog galaxy.exe': AppCategory.GAMING,
  'ubisoft connect.exe': AppCategory.GAMING,
}

/**
 * Fallback: check app name keywords (works on both platforms)
 * Keys should be lowercase
 */
export const APP_NAME_KEYWORDS: Record<string, AppCategory> = {
  // Social Media
  'twitter': AppCategory.SOCIAL_MEDIA,
  'tweetbot': AppCategory.SOCIAL_MEDIA,
  'tweetdeck': AppCategory.SOCIAL_MEDIA,
  'facebook': AppCategory.SOCIAL_MEDIA,
  'instagram': AppCategory.SOCIAL_MEDIA,
  'tiktok': AppCategory.SOCIAL_MEDIA,
  'linkedin': AppCategory.SOCIAL_MEDIA,
  'snapchat': AppCategory.SOCIAL_MEDIA,
  'pinterest': AppCategory.SOCIAL_MEDIA,
  
  // Entertainment
  'youtube': AppCategory.ENTERTAINMENT,
  'netflix': AppCategory.ENTERTAINMENT,
  'spotify': AppCategory.ENTERTAINMENT,
  'twitch': AppCategory.ENTERTAINMENT,
  'reddit': AppCategory.ENTERTAINMENT,
  'hulu': AppCategory.ENTERTAINMENT,
  'disney': AppCategory.ENTERTAINMENT,
  'prime video': AppCategory.ENTERTAINMENT,
  'amazon video': AppCategory.ENTERTAINMENT,
  'plex': AppCategory.ENTERTAINMENT,
  
  // Communication
  'slack': AppCategory.COMMUNICATION,
  'discord': AppCategory.COMMUNICATION,
  'zoom': AppCategory.COMMUNICATION,
  'teams': AppCategory.COMMUNICATION,
  'telegram': AppCategory.COMMUNICATION,
  'whatsapp': AppCategory.COMMUNICATION,
  'messenger': AppCategory.COMMUNICATION,
  'outlook': AppCategory.COMMUNICATION,
  'mail': AppCategory.COMMUNICATION,
  'signal': AppCategory.COMMUNICATION,
  
  // Productive
  'code': AppCategory.PRODUCTIVE,
  'vscode': AppCategory.PRODUCTIVE,
  'visual studio': AppCategory.PRODUCTIVE,
  'xcode': AppCategory.PRODUCTIVE,
  'terminal': AppCategory.PRODUCTIVE,
  'iterm': AppCategory.PRODUCTIVE,
  'figma': AppCategory.PRODUCTIVE,
  'notion': AppCategory.PRODUCTIVE,
  'obsidian': AppCategory.PRODUCTIVE,
  'cursor': AppCategory.PRODUCTIVE,
  
  // Gaming
  'steam': AppCategory.GAMING,
  'epic games': AppCategory.GAMING,
  'battle.net': AppCategory.GAMING,
  'riot': AppCategory.GAMING,
  'origin': AppCategory.GAMING,
  'ubisoft': AppCategory.GAMING,
}

/**
 * Domain to category mapping for browser tabs
 */
export const DOMAIN_CATEGORIES: Record<string, AppCategory> = {
  // Social Media
  'twitter.com': AppCategory.SOCIAL_MEDIA,
  'x.com': AppCategory.SOCIAL_MEDIA,
  'facebook.com': AppCategory.SOCIAL_MEDIA,
  'instagram.com': AppCategory.SOCIAL_MEDIA,
  'tiktok.com': AppCategory.SOCIAL_MEDIA,
  'linkedin.com': AppCategory.SOCIAL_MEDIA,
  'pinterest.com': AppCategory.SOCIAL_MEDIA,
  'snapchat.com': AppCategory.SOCIAL_MEDIA,
  'threads.net': AppCategory.SOCIAL_MEDIA,
  
  // Entertainment
  'youtube.com': AppCategory.ENTERTAINMENT,
  'netflix.com': AppCategory.ENTERTAINMENT,
  'twitch.tv': AppCategory.ENTERTAINMENT,
  'reddit.com': AppCategory.ENTERTAINMENT,
  'hulu.com': AppCategory.ENTERTAINMENT,
  'disneyplus.com': AppCategory.ENTERTAINMENT,
  'primevideo.com': AppCategory.ENTERTAINMENT,
  'spotify.com': AppCategory.ENTERTAINMENT,
  'soundcloud.com': AppCategory.ENTERTAINMENT,
  '9gag.com': AppCategory.ENTERTAINMENT,
  'imgur.com': AppCategory.ENTERTAINMENT,
  
  // Productive
  'github.com': AppCategory.PRODUCTIVE,
  'gitlab.com': AppCategory.PRODUCTIVE,
  'bitbucket.org': AppCategory.PRODUCTIVE,
  'stackoverflow.com': AppCategory.PRODUCTIVE,
  'notion.so': AppCategory.PRODUCTIVE,
  'figma.com': AppCategory.PRODUCTIVE,
  'linear.app': AppCategory.PRODUCTIVE,
  'docs.google.com': AppCategory.PRODUCTIVE,
  'sheets.google.com': AppCategory.PRODUCTIVE,
  'slides.google.com': AppCategory.PRODUCTIVE,
  'gemini.google.com': AppCategory.PRODUCTIVE,
  'claude.ai': AppCategory.PRODUCTIVE,
  'chat.openai.com': AppCategory.PRODUCTIVE,
  'chatgpt.com': AppCategory.PRODUCTIVE,
  
  // Communication
  'slack.com': AppCategory.COMMUNICATION,
  'discord.com': AppCategory.COMMUNICATION,
  'mail.google.com': AppCategory.COMMUNICATION,
  'outlook.live.com': AppCategory.COMMUNICATION,
  'outlook.office.com': AppCategory.COMMUNICATION,
  'web.whatsapp.com': AppCategory.COMMUNICATION,
  'web.telegram.org': AppCategory.COMMUNICATION,
  
  // Gaming
  'steampowered.com': AppCategory.GAMING,
  'store.steampowered.com': AppCategory.GAMING,
  'epicgames.com': AppCategory.GAMING,
  'riotgames.com': AppCategory.GAMING,
  'blizzard.com': AppCategory.GAMING,
}

/**
 * Detect current platform
 */
function isMacOS(): boolean {
  return typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')
}

function isWindows(): boolean {
  return typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('win')
}

/**
 * Get the category for an app (cross-platform)
 */
export function getAppCategory(appInfo: ActiveAppInfo): AppCategory {
  const bundleId = appInfo.bundleId || ''
  const appName = appInfo.appName || ''
  
  // Try platform-specific lookup first
  if (isMacOS() && bundleId) {
    // macOS: identifier is bundle ID
    if (MACOS_BUNDLE_CATEGORIES[bundleId]) {
      return MACOS_BUNDLE_CATEGORIES[bundleId]
    }
  } else if (isWindows()) {
    // Windows: identifier is exe name
    const exeName = appName.toLowerCase()
    if (WINDOWS_EXE_CATEGORIES[exeName]) {
      return WINDOWS_EXE_CATEGORIES[exeName]
    }
    // Try adding .exe if not present
    if (!exeName.endsWith('.exe') && WINDOWS_EXE_CATEGORIES[`${exeName}.exe`]) {
      return WINDOWS_EXE_CATEGORIES[`${exeName}.exe`]
    }
  }
  
  // Fallback: check app name keywords (works on both platforms)
  const nameLower = appName.toLowerCase()
  const idLower = bundleId.toLowerCase()
  
  for (const [keyword, category] of Object.entries(APP_NAME_KEYWORDS)) {
    if (nameLower.includes(keyword) || idLower.includes(keyword)) {
      return category
    }
  }
  
  // Default to unknown
  return AppCategory.UNKNOWN
}

/**
 * Get category for a domain (for browser tabs)
 */
export function getDomainCategory(domain: string | null): AppCategory {
  if (!domain) return AppCategory.UNKNOWN
  
  const domainLower = domain.toLowerCase()
  
  // Direct lookup
  if (DOMAIN_CATEGORIES[domainLower]) {
    return DOMAIN_CATEGORIES[domainLower]
  }
  
  // Check if domain ends with a known domain
  for (const [knownDomain, category] of Object.entries(DOMAIN_CATEGORIES)) {
    if (domainLower === knownDomain || domainLower.endsWith(`.${knownDomain}`)) {
      return category
    }
  }
  
  // Check keywords in domain
  for (const [keyword, category] of Object.entries(APP_NAME_KEYWORDS)) {
    if (domainLower.includes(keyword)) {
      return category
    }
  }
  
  return AppCategory.NEUTRAL // Default browser tabs to neutral
}

/**
 * Check if a category is considered a distraction
 */
export function isDistraction(category: AppCategory): boolean {
  return [
    AppCategory.SOCIAL_MEDIA,
    AppCategory.ENTERTAINMENT,
    AppCategory.GAMING,
  ].includes(category)
}

/**
 * Check if a category requires intervention based on mode
 */
export function requiresIntervention(
  category: AppCategory,
  mode: 'Zen' | 'Flow' | 'Legend'
): boolean {
  if (mode === 'Zen') {
    return false // Zen never blocks
  }
  
  if (mode === 'Flow') {
    return isDistraction(category) // Flow blocks distractions
  }
  
  if (mode === 'Legend') {
    // Legend blocks distractions AND communication
    return isDistraction(category) || category === AppCategory.COMMUNICATION
  }
  
  return false
}

/**
 * Get distraction level (0-5) for a category
 */
export function getDistractionLevel(category: AppCategory): number {
  switch (category) {
    case AppCategory.PRODUCTIVE: return 0
    case AppCategory.NEUTRAL: return 1
    case AppCategory.COMMUNICATION: return 2
    case AppCategory.SOCIAL_MEDIA: return 4
    case AppCategory.ENTERTAINMENT: return 5
    case AppCategory.GAMING: return 5
    case AppCategory.UNKNOWN: return 3
    default: return 3
  }
}

/**
 * Get a human-readable name for a category
 */
export function getCategoryDisplayName(category: AppCategory): string {
  switch (category) {
    case AppCategory.PRODUCTIVE: return 'Productive'
    case AppCategory.NEUTRAL: return 'Neutral'
    case AppCategory.COMMUNICATION: return 'Communication'
    case AppCategory.SOCIAL_MEDIA: return 'Social Media'
    case AppCategory.ENTERTAINMENT: return 'Entertainment'
    case AppCategory.GAMING: return 'Gaming'
    case AppCategory.UNKNOWN: return 'Unknown'
    default: return 'Unknown'
  }
}
