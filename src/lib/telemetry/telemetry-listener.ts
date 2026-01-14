// src/lib/telemetry/telemetry-listener.ts
// Listens for telemetry events from the Rust backend

import { listen, UnlistenFn } from '@tauri-apps/api/event'

// ============================================
// EVENT NAMES (must match Rust constants)
// ============================================

export const EVENT_APP_SWITCH = 'telemetry:app-switch'
export const EVENT_NON_WHITELISTED_APP = 'telemetry:non-whitelisted-app'
export const EVENT_TAB_SWITCH = 'telemetry:tab-switch'
export const EVENT_NON_WHITELISTED_DOMAIN = 'telemetry:non-whitelisted-domain'
export const EVENT_RETURN_TO_WHITELISTED = 'telemetry:return-to-whitelisted'
export const EVENT_SESSION_START = 'telemetry:session-start'
export const EVENT_SESSION_END = 'telemetry:session-end'
export const EVENT_INTERVENTION_TRIGGERED = 'telemetry:intervention-triggered'
export const EVENT_GENERIC = 'telemetry:event'

// ============================================
// TYPES (matching Rust structs)
// ============================================

export interface ActiveAppInfo {
  appName: string
  bundleId: string | null
  windowTitle: string | null
  activeSince: number
}

export interface BrowserTabInfo {
  browser: string
  url: string | null
  title: string | null
  domain: string | null
}

export type TelemetryEventType =
  | 'app_switch'
  | 'non_whitelisted_app'
  | 'tab_switch'
  | 'non_whitelisted_domain'
  | 'return_to_whitelisted'
  | 'session_start'
  | 'session_end'
  | 'intervention_triggered'
  | 'intervention_dismissed'

export interface TelemetryEvent {
  id: string
  sessionId: string
  eventType: TelemetryEventType
  timestamp: number
  appInfo: ActiveAppInfo | null
  browserTab: BrowserTabInfo | null
  metadata: string | null
}

// ============================================
// HANDLER TYPES
// ============================================

export interface TelemetryHandlers {
  onAppSwitch?: (event: TelemetryEvent) => void
  onNonWhitelistedApp?: (event: TelemetryEvent) => void
  onTabSwitch?: (event: TelemetryEvent) => void
  onNonWhitelistedDomain?: (event: TelemetryEvent) => void
  onReturnToWhitelisted?: (event: TelemetryEvent) => void
  onSessionStart?: (event: TelemetryEvent) => void
  onSessionEnd?: (event: TelemetryEvent) => void
  onInterventionTriggered?: (event: TelemetryEvent) => void
  onAnyEvent?: (event: TelemetryEvent) => void
}

// ============================================
// LISTENER SETUP
// ============================================

let unlisteners: UnlistenFn[] = []

/**
 * Setup telemetry event listeners
 * Call this when a session starts
 * Returns a cleanup function to remove listeners
 */
export async function setupTelemetryListeners(
  handlers: TelemetryHandlers
): Promise<() => void> {
  // Clean up any existing listeners
  await cleanupTelemetryListeners()

  console.log('[Telemetry] Setting up event listeners...')

  // Listen for app switch events
  if (handlers.onAppSwitch) {
    const unlisten = await listen<TelemetryEvent>(EVENT_APP_SWITCH, (event) => {
      console.log('[Telemetry] App switch:', event.payload.appInfo?.appName)
      handlers.onAppSwitch?.(event.payload)
    })
    unlisteners.push(unlisten)
  }

  // Listen for non-whitelisted app events
  if (handlers.onNonWhitelistedApp) {
    const unlisten = await listen<TelemetryEvent>(EVENT_NON_WHITELISTED_APP, (event) => {
      console.log('[Telemetry] Non-whitelisted app:', event.payload.appInfo?.appName)
      handlers.onNonWhitelistedApp?.(event.payload)
    })
    unlisteners.push(unlisten)
  }

  // Listen for tab switch events
  if (handlers.onTabSwitch) {
    const unlisten = await listen<TelemetryEvent>(EVENT_TAB_SWITCH, (event) => {
      console.log('[Telemetry] Tab switch:', event.payload.browserTab?.domain)
      handlers.onTabSwitch?.(event.payload)
    })
    unlisteners.push(unlisten)
  }

  // Listen for non-whitelisted domain events
  if (handlers.onNonWhitelistedDomain) {
    const unlisten = await listen<TelemetryEvent>(EVENT_NON_WHITELISTED_DOMAIN, (event) => {
      console.log('[Telemetry] Non-whitelisted domain:', event.payload.browserTab?.domain)
      handlers.onNonWhitelistedDomain?.(event.payload)
    })
    unlisteners.push(unlisten)
  }

  // Listen for return to whitelisted events
  if (handlers.onReturnToWhitelisted) {
    const unlisten = await listen<TelemetryEvent>(EVENT_RETURN_TO_WHITELISTED, (event) => {
      console.log('[Telemetry] Returned to whitelisted:', event.payload.appInfo?.appName)
      handlers.onReturnToWhitelisted?.(event.payload)
    })
    unlisteners.push(unlisten)
  }

  // Listen for session start events
  if (handlers.onSessionStart) {
    const unlisten = await listen<TelemetryEvent>(EVENT_SESSION_START, (event) => {
      console.log('[Telemetry] Session started')
      handlers.onSessionStart?.(event.payload)
    })
    unlisteners.push(unlisten)
  }

  // Listen for session end events
  if (handlers.onSessionEnd) {
    const unlisten = await listen<TelemetryEvent>(EVENT_SESSION_END, (event) => {
      console.log('[Telemetry] Session ended')
      handlers.onSessionEnd?.(event.payload)
    })
    unlisteners.push(unlisten)
  }

  // Listen for intervention events
  if (handlers.onInterventionTriggered) {
    const unlisten = await listen<TelemetryEvent>(EVENT_INTERVENTION_TRIGGERED, (event) => {
      console.log('[Telemetry] Intervention triggered')
      handlers.onInterventionTriggered?.(event.payload)
    })
    unlisteners.push(unlisten)
  }

  // Listen for all events (generic handler)
  if (handlers.onAnyEvent) {
    const unlisten = await listen<TelemetryEvent>(EVENT_GENERIC, (event) => {
      console.log('[Telemetry] Event:', event.payload.eventType, event.payload.appInfo?.appName)
      handlers.onAnyEvent?.(event.payload)
    })
    unlisteners.push(unlisten)
  }

  console.log('[Telemetry] Listeners setup complete')

  // Return cleanup function
  return cleanupTelemetryListeners
}

/**
 * Cleanup all telemetry listeners
 */
export async function cleanupTelemetryListeners(): Promise<void> {
  for (const unlisten of unlisteners) {
    unlisten()
  }
  unlisteners = []
  console.log('[Telemetry] Listeners cleaned up')
}
