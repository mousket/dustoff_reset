// src/hooks/usePermissions.ts

import { useState, useEffect, useCallback } from 'react'
import { tauriBridge } from '@/lib/tauri-bridge'
import { PermissionState, PLATFORM_NAMES, PLATFORM_ICONS } from '@/lib/permissions/types'

export interface UsePermissionsReturn {
  // State
  permissionState: PermissionState | null
  isLoading: boolean
  error: string | null
  
  // Computed
  isGranted: boolean
  platform: string
  platformName: string
  platformIcon: string
  needsSetup: boolean
  
  // Actions
  checkPermissions: () => Promise<void>
  openSettings: () => Promise<void>
  requestPermission: (type: string) => Promise<void>
}

export function usePermissions(): UsePermissionsReturn {
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check permissions
  const checkPermissions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const state = await tauriBridge.checkPermissions()
      setPermissionState(state)
      
      console.log('[Permissions] State:', state)
    } catch (err) {
      console.error('[Permissions] Check failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to check permissions')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Open system settings
  const openSettings = useCallback(async () => {
    try {
      await tauriBridge.openSystemPermissions()
    } catch (err) {
      console.error('[Permissions] Failed to open settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to open settings')
    }
  }, [])

  // Request a specific permission
  const requestPermission = useCallback(async (type: string) => {
    try {
      await tauriBridge.requestPermission(type)
      // Re-check after requesting
      await checkPermissions()
    } catch (err) {
      console.error('[Permissions] Request failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to request permission')
    }
  }, [checkPermissions])

  // Initial check
  useEffect(() => {
    checkPermissions()
  }, [checkPermissions])

  // Computed values
  const isGranted = permissionState?.allGranted ?? false
  const platform = permissionState?.platform ?? 'unknown'
  const platformName = PLATFORM_NAMES[platform] ?? platform
  const platformIcon = PLATFORM_ICONS[platform] ?? '❓'
  const needsSetup = !isLoading && !isGranted

  return {
    permissionState,
    isLoading,
    error,
    isGranted,
    platform,
    platformName,
    platformIcon,
    needsSetup,
    checkPermissions,
    openSettings,
    requestPermission,
  }
}
