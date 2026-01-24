// src/lib/permissions/types.ts

export type PermissionStatus = 'granted' | 'denied' | 'unknown' | 'not_required'

export type PermissionType = 'accessibility' | 'screen_recording' | 'automation'

export interface PermissionDetail {
  permissionType: PermissionType
  status: PermissionStatus
  required: boolean
  description: string
}

export interface PermissionState {
  platform: string
  allGranted: boolean
  permissions: PermissionDetail[]
  instructions: string | null
}

// Platform-specific messaging
export const PLATFORM_NAMES: Record<string, string> = {
  macos: 'macOS',
  windows: 'Windows',
  'linux-x11': 'Linux (X11)',
  'linux-wayland': 'Linux (Wayland)',
  unsupported: 'Unsupported Platform',
}

export const PLATFORM_ICONS: Record<string, string> = {
  macos: '🍎',
  windows: '🪟',
  'linux-x11': '🐧',
  'linux-wayland': '🐧',
  unsupported: '❓',
}