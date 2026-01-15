import { useState, useEffect, useCallback, useRef } from 'react'
import { tauriBridge, CalibrationData, RecoveryData, ReflectionObject } from '@/lib/tauri-bridge'
import { resizeForPanel, PanelType } from '@/hooks/useTauriWindow'
import { HUDAdapter } from '@/components/HUDAdapter'
import type { SessionMode } from '@/features/desktop/hud/FloatingHUD/types'

// Hooks
import { useSessionManager, SessionConfig } from '@/hooks/useSessionManager'
import { useSessionTimer } from '@/hooks/useSessionTimer'
import { useBandwidthEngine } from '@/hooks/useBandwidthEngine'
import { useSessionTelemetryStats } from '@/hooks/useSessionTelemetryStats'

// Telemetry
import { 
  setupTelemetryListeners, 
  cleanupTelemetryListeners,
  calculateAppSwitchPenalty,
  calculateDomainPenalty,
  calculateBonus,
  getAppCategory,
  getDomainCategory,
  isAppWhitelisted,
  isDomainWhitelisted,
  isDistraction,
  getInterventionConfig,
  AppCategory,
  type TelemetryEvent,
} from '@/lib/telemetry'

// Panel Adapters
import { CalibrationPanelAdapter } from '@/components/panels/CalibrationPanelAdapter'
import { PreSessionPanelAdapter, PreSessionConfig } from '@/components/panels/PreSessionPanelAdapter'
import { ResetPanelAdapter, RitualType, RitualCompletionData } from '@/components/panels/ResetPanelAdapter'
import { ParkingLotPanelAdapter } from '@/components/panels/ParkingLotPanelAdapter'
import { ParkingLotHarvestAdapter } from '@/components/panels/ParkingLotHarvestAdapter'
import { PostSessionSummaryAdapter } from '@/components/panels/PostSessionSummaryAdapter'
import { SessionReflectionAdapter } from '@/components/panels/SessionReflectionAdapter'
import { getNextSessionItems, getActiveParkingLotItems, type ParkingLotItemFull } from '@/lib/parking-lot-storage'

// Overlays
import { InterventionOverlayAdapter } from '@/components/overlays/InterventionOverlayAdapter'
import { FlowCelebrationOverlay } from '@/features/desktop/overlays/FlowCelebrationOverlay'
import { DelayGateAdapter, createInitialDelayGateState, type DelayGateState } from '@/components/overlays/DelayGateAdapter'
import { BlockScreenAdapter, createInitialBlockScreenState, type BlockScreenState } from '@/components/overlays/BlockScreenAdapter'

// Modals
import { EndSessionModalAdapter } from '@/components/modals/EndSessionModalAdapter'
import { InterruptedSessionModalAdapter } from '@/components/modals/InterruptedSessionModalAdapter'

import { getCurrentWindow } from '@tauri-apps/api/window'

// Dev utilities - exposes helpers to browser console
import '@/lib/dev-utils'

type AppMode = 'loading' | 'recovery' | 'not-calibrated' | 'idle' | 'pre-session' | 'session' | 'paused' | 'post-session'
type InterventionType = 'friction' | 'focus-slipping'

function App() {
  // ============================================
  // WINDOW SETUP - Always on top
  // ============================================
  useEffect(() => {
    getCurrentWindow().setAlwaysOnTop(true)
  }, [])
  // ============================================
  // CORE STATE
  // ============================================
  const [mode, setMode] = useState<AppMode>('loading')
  const [currentPanel, setCurrentPanel] = useState<PanelType | null>(null)

  // Data state
  const [calibration, setCalibration] = useState<CalibrationData | null>(null)
  const [recoveryData, setRecoveryData] = useState<RecoveryData | null>(null)
  const [nextSessionItems, setNextSessionItems] = useState<ParkingLotItemFull[]>([])

  // Overlay state
  const [showInterventionOverlay, setShowInterventionOverlay] = useState(false)
  const [interventionType, setInterventionType] = useState<InterventionType>('friction')
  const [showFlowCelebration, setShowFlowCelebration] = useState(false)
  
  // Delay Gate state (Flow mode intervention)
  const [delayGateState, setDelayGateState] = useState<DelayGateState>(createInitialDelayGateState())
  
  // Legend Mode Intervention state (strict penalty, no countdown)
  const [blockScreenState, setBlockScreenState] = useState<BlockScreenState>(createInitialBlockScreenState())

  // Modal state
  const [showEndSessionModal, setShowEndSessionModal] = useState(false)

  // Telemetry cleanup function ref
  const telemetryCleanupRef = useRef<(() => void) | null>(null)
  
  // Telemetry offense tracking for escalation
  const offenseCountRef = useRef(0)

  // ============================================
  // SESSION MANAGER HOOK
  // ============================================
  const sessionManager = useSessionManager()

  // ============================================
  // BANDWIDTH ENGINE HOOK
  // ============================================
  const bandwidthEngine = useBandwidthEngine({
    initialBandwidth: calibration?.calibrationScore ?? 75,
    isSessionActive: mode === 'session',
    isPaused: mode === 'paused',
    mode: (sessionManager.currentSession?.mode || 'Flow') as SessionMode,
    onFrictionTrigger: () => {
      console.log('[App] Friction trigger!')
      setInterventionType('friction')
      setShowInterventionOverlay(true)
    },
    onFocusSlippingTrigger: () => {
      console.log('[App] Focus slipping trigger!')
      setInterventionType('focus-slipping')
      setShowInterventionOverlay(true)
    },
    onFlowAchieved: () => {
      console.log('[App] 🎉 Flow achieved!')
      setShowFlowCelebration(true)
      // Track flow state
      sessionManager.setInFlowState(true)
      telemetryStats.recordFlowAchieved()
      // Auto-dismiss after 8 seconds
      setTimeout(() => setShowFlowCelebration(false), 8000)
    },
    onFlowLost: () => {
      console.log('[App] Flow lost')
      // Track flow state
      sessionManager.setInFlowState(false)
      telemetryStats.recordFlowLost()
    },
  })

  // ============================================
  // SESSION TIMER HOOK
  // ============================================
  const timer = useSessionTimer({
    isActive: mode === 'session',
    isPaused: mode === 'paused',
    plannedDurationMinutes: sessionManager.currentSession?.plannedDurationMinutes || 0,
    sessionId: sessionManager.sessionId || '',
    sessionStartedAt: sessionManager.currentSession?.startedAt || '',
    mode: (sessionManager.currentSession?.mode || 'Flow') as SessionMode,
    intention: sessionManager.currentSession?.intention || null,
    currentBandwidth: bandwidthEngine.current,
    onTimeUp: handleTimeUp,
    onOvertime: handleOvertime,
  })

  // ============================================
  // TELEMETRY STATS HOOK
  // ============================================
  const telemetryStats = useSessionTelemetryStats({
    sessionId: sessionManager.sessionId,
    isActive: mode === 'session' || mode === 'paused',
  })

  // ============================================
  // INITIALIZATION
  // ============================================
  useEffect(() => {
    initializeApp()
  }, [])

  // Resize window when panel changes
  useEffect(() => {
    resizeForPanel(currentPanel)
  }, [currentPanel])

  // Resize window when end session modal opens
  useEffect(() => {
    if (showEndSessionModal) {
      resizeForPanel('endSession')
    } else if (!currentPanel) {
      resizeForPanel(null) // Back to HUD only
    }
  }, [showEndSessionModal, currentPanel])

  // Auto-enable always-on-top during active sessions
  useEffect(() => {
    const updateWindowFloat = async () => {
      try {
        const isSessionActive = mode === 'session' || mode === 'paused'
        if (isSessionActive) {
          await tauriBridge.setAlwaysOnTop(true)
          console.log('[Window] Always on top: enabled (session active)')
        }
        // Note: We don't disable when session ends to maintain user preference
        // User can manually toggle via settings if needed
      } catch (error) {
        console.error('[Window] Failed to set always on top:', error)
      }
    }
    
    updateWindowFloat()
  }, [mode])

  const initializeApp = useCallback(async () => {
    try {
      // Check for crashed session
      const recovery = await tauriBridge.getRecoveryData()
      if (recovery) {
        setRecoveryData(recovery)
        setMode('recovery')
        return
      }

      // Check for today's calibration
      const cal = await tauriBridge.loadCalibration()
      if (cal) {
        setCalibration(cal)
        setMode('idle')
      } else {
        setMode('not-calibrated')
        setCurrentPanel('calibration')
      }

      // Load next session items
      loadNextSessionItems()
    } catch (error) {
      console.error('Failed to initialize:', error)
      setMode('not-calibrated')
      setCurrentPanel('calibration')
    }
  }, [])

  const loadNextSessionItems = async () => {
    try {
      const items = await getNextSessionItems()
      setNextSessionItems(items)
    } catch (error) {
      console.error('Failed to load next session items:', error)
    }
  }

  // ============================================
  // TIMER CALLBACKS
  // ============================================
  function handleTimeUp() {
    console.log('[App] Time is up!')
    // Could show a completion prompt or celebration
  }

  function handleOvertime() {
    console.log('[App] Session is 5 minutes overtime!')
    // Could show overtime nudge toast
  }

  // ============================================
  // CALIBRATION HANDLERS
  // ============================================

  const handleCalibrationComplete = async (data: CalibrationData) => {
    try {
      await tauriBridge.saveCalibration(data)
      setCalibration(data)
      setCurrentPanel(null)
      setMode('idle')
    } catch (error) {
      console.error('Failed to save calibration:', error)
    }
  }

  const handleCalibrate = () => {
    setCurrentPanel('calibration')
  }

  // ============================================
  // RECOVERY HANDLERS
  // ============================================

  const handleRecoveryResume = async () => {
    if (!recoveryData) return

    // Start a new session with recovered config
    const config: SessionConfig = {
      mode: recoveryData.mode,
      durationMinutes: recoveryData.plannedDurationMinutes,
      intention: recoveryData.intention || '',
      whitelistedApps: [],
      whitelistedTabs: [],
    }

    await sessionManager.startSession(config)

    await tauriBridge.clearRecoveryData()
    setRecoveryData(null)
    setMode('session')
  }

  const handleRecoveryDiscard = async () => {
    await tauriBridge.clearRecoveryData()
    setRecoveryData(null)
    await initializeApp()
  }

  // ============================================
  // SESSION LIFECYCLE HANDLERS
  // ============================================

  const handleStartSession = () => {
    setCurrentPanel('preSession')
  }

  const handleSessionStart = async (config: PreSessionConfig) => {
    try {
      const sessionConfig: SessionConfig = {
        mode: config.mode,
        durationMinutes: config.durationMinutes,
        intention: config.intention,
        whitelistedApps: config.whitelistedApps,
        whitelistedTabs: config.whitelistedTabs,
      }

      await sessionManager.startSession(sessionConfig)

      // Reset bandwidth engine for new session
      bandwidthEngine.resetEngine()
      
      // Reset telemetry stats for new session
      telemetryStats.resetStats()

      setCurrentPanel(null)
      setMode('session')

      console.log('[App] Session started:', sessionManager.sessionId)
      console.log('[App] Whitelisted apps:', config.whitelistedApps)
      console.log('[App] Whitelisted tabs:', config.whitelistedTabs)

      // === TELEMETRY: Start monitoring ===
      if (sessionManager.sessionId) {
        console.log('[Telemetry] About to start monitor...')
        try {
          // Start the telemetry monitor with whitelisted apps/tabs
          console.log('[Telemetry] Calling tauriBridge.startTelemetryMonitor...')
          await tauriBridge.startTelemetryMonitor(
            sessionManager.sessionId,
            config.whitelistedApps,
            config.whitelistedTabs
          )
          console.log('[Telemetry] ✅ Monitor started for session:', sessionManager.sessionId)

          // Reset offense count for new session
          offenseCountRef.current = 0
          
          // Store session config for penalty calculation
          const sessionMode = config.mode as 'Zen' | 'Flow' | 'Legend'
          const whitelistedApps = config.whitelistedApps
          const whitelistedTabs = config.whitelistedTabs
          
          // Setup event listeners
          const cleanup = await setupTelemetryListeners({
            onAppSwitch: (event) => {
              if (!event.appInfo) return
              
              const appName = event.appInfo.appName
              const category = getAppCategory(event.appInfo)
              const isWhitelisted = isAppWhitelisted(event.appInfo, whitelistedApps)
              
              console.log(`[Telemetry] 📱 App switch: ${appName} | Category: ${category} | Whitelisted: ${isWhitelisted}`)
              
              // Calculate penalty (even for whitelisted, to get category info)
              const penaltyResult = calculateAppSwitchPenalty(
                event.appInfo,
                sessionMode,
                offenseCountRef.current + 1,
                isWhitelisted
              )
              
              // Apply penalty if there is one
              if (penaltyResult.finalPenalty < 0) {
                offenseCountRef.current++
                bandwidthEngine.applyTelemetryPenalty(
                  penaltyResult.finalPenalty,
                  `${appName} (${penaltyResult.categoryName})`
                )
              }
            },
            onNonWhitelistedApp: (event) => {
              if (!event.appInfo) return
              
              const appName = event.appInfo.appName
              const category = getAppCategory(event.appInfo)
              
              console.log(`[Telemetry] ⚠️ Non-whitelisted app: ${appName} | Category: ${category}`)
              
              // Calculate and apply penalty
              const penaltyResult = calculateAppSwitchPenalty(
                event.appInfo,
                sessionMode,
                offenseCountRef.current + 1,
                false // Not whitelisted
              )
              
              if (penaltyResult.finalPenalty < 0) {
                offenseCountRef.current++
                bandwidthEngine.applyTelemetryPenalty(
                  penaltyResult.finalPenalty,
                  `${appName} (${penaltyResult.categoryName}) - not whitelisted`
                )
                
                // Record stats
                telemetryStats.recordPenalty(
                  penaltyResult.finalPenalty,
                  penaltyResult.categoryName,
                  appName
                )
                telemetryStats.recordAppSwitch(appName, false)
                
                // Record distraction in session manager
                sessionManager.recordDistraction(penaltyResult.categoryName)
                sessionManager.addTimelineBlock('distracted')
                
                // Get intervention config based on mode
                const intervention = getInterventionConfig(
                  event.appInfo,
                  sessionMode,
                  offenseCountRef.current,
                  false
                )
                
                // Flow mode: Delay Gate
                if (sessionMode === 'Flow' && intervention.type === 'delay_gate') {
                  console.log(`[DelayGate] Triggering for ${appName} (${intervention.delaySeconds}s)`)
                  sessionManager.recordIntervention('delay_gate')
                  setCurrentPanel(null)
                  resizeForPanel('intervention')
                  setDelayGateState({
                    isOpen: true,
                    triggerName: appName,
                    category: category,
                    delaySeconds: intervention.delaySeconds || 10,
                    offenseNumber: offenseCountRef.current,
                    message: intervention.message || 'Wait to continue, or return to work.',
                  })
                }
                
                // Legend mode: Intervention Screen (no countdown)
                if (sessionMode === 'Legend' && intervention.type === 'block_screen') {
                  console.log(`[LegendIntervention] Triggering for ${appName}`)
                  sessionManager.recordIntervention('block_screen')
                  setCurrentPanel(null)
                  resizeForPanel('intervention')
                  setBlockScreenState({
                    isOpen: true,
                    triggerName: appName,
                    category: category,
                    offenseNumber: offenseCountRef.current,
                    message: intervention.message || `${appName} is blocked.`,
                    triggeredExtension: intervention.triggerExtension,
                    extensionMinutes: intervention.extensionMinutes,
                  })
                }
              }
            },
            onTabSwitch: (event) => {
              if (!event.browserTab?.domain) return
              
              const domain = event.browserTab.domain
              const category = getDomainCategory(domain)
              const isWhitelisted = isDomainWhitelisted(domain, whitelistedTabs)
              
              console.log(`[Telemetry] 🌐 Tab switch: ${domain} | Category: ${category} | Whitelisted: ${isWhitelisted}`)
              
              // Skip if whitelisted
              if (isWhitelisted) return
              
              // Only penalize distracting domains (not neutral/productive)
              if (!isDistraction(category)) return
              
              // Calculate and apply penalty for distracting domain
              const penaltyResult = calculateDomainPenalty(
                domain,
                sessionMode,
                offenseCountRef.current + 1,
                false
              )
              
              if (penaltyResult.finalPenalty < 0) {
                offenseCountRef.current++
                bandwidthEngine.applyTelemetryPenalty(
                  penaltyResult.finalPenalty,
                  `${domain} (${penaltyResult.categoryName})`
                )
                
                // Record stats
                telemetryStats.recordPenalty(
                  penaltyResult.finalPenalty,
                  penaltyResult.categoryName,
                  domain
                )
                telemetryStats.recordDomainVisit(domain, false)
                
                // Record distraction in session manager
                sessionManager.recordDistraction(penaltyResult.categoryName)
                sessionManager.addTimelineBlock('distracted')
                
                // Get intervention config
                const mockAppInfo = {
                  appName: domain,
                  bundleId: null,
                  windowTitle: null,
                  activeSince: Date.now(),
                }
                
                const intervention = getInterventionConfig(
                  mockAppInfo,
                  sessionMode,
                  offenseCountRef.current,
                  false
                )
                
                // Flow mode: Delay Gate
                if (sessionMode === 'Flow' && intervention.type === 'delay_gate') {
                  console.log(`[DelayGate] Triggering for ${domain} (${intervention.delaySeconds}s)`)
                  sessionManager.recordIntervention('delay_gate')
                  setCurrentPanel(null)
                  resizeForPanel('intervention')
                  setDelayGateState({
                    isOpen: true,
                    triggerName: domain,
                    category: category,
                    delaySeconds: intervention.delaySeconds || 10,
                    offenseNumber: offenseCountRef.current,
                    message: intervention.message || 'Wait to continue, or return to work.',
                  })
                }
                
                // Legend mode: Intervention Screen (no countdown)
                if (sessionMode === 'Legend' && intervention.type === 'block_screen') {
                  console.log(`[LegendIntervention] Triggering for ${domain}`)
                  sessionManager.recordIntervention('block_screen')
                  setCurrentPanel(null)
                  resizeForPanel('intervention')
                  setBlockScreenState({
                    isOpen: true,
                    triggerName: domain,
                    category: category,
                    offenseNumber: offenseCountRef.current,
                    message: intervention.message || `${domain} is blocked.`,
                    triggeredExtension: intervention.triggerExtension,
                    extensionMinutes: intervention.extensionMinutes,
                  })
                }
              }
            },
            onNonWhitelistedDomain: (event) => {
              // This event only fires when whitelisted_domains is non-empty
              // Penalties and delay gate are now handled in onTabSwitch
              // This handler is just for additional logging
              if (!event.browserTab?.domain) return
              const domain = event.browserTab.domain
              console.log(`[Telemetry] ⚠️ Non-whitelisted domain event: ${domain}`)
            },
            onReturnToWhitelisted: (event) => {
              const appName = event.appInfo?.appName || 'app'
              console.log(`[Telemetry] ✅ Returned to whitelisted: ${appName}`)
              
              // Apply quick return bonus
              const bonusResult = calculateBonus('quick_return', sessionMode)
              bandwidthEngine.applyTelemetryBonus(
                bonusResult.finalBonus,
                `Returned to ${appName}`
              )
            },
            onAnyEvent: (event) => {
              console.log('[Telemetry] Event:', event.eventType)
            },
          })
          telemetryCleanupRef.current = cleanup
        } catch (telemetryError) {
          console.error('[Telemetry] Failed to start monitor:', telemetryError)
          // Continue without telemetry - app still works
        }
      }
    } catch (error) {
      console.error('Failed to start session:', error)
    }
  }

  const handlePauseSession = async () => {
    await sessionManager.pauseSession()
    setMode('paused')
  }

  const handleResumeSession = async () => {
    await sessionManager.resumeSession()
    setMode('session')
    // Close any open panel (like reset ritual) when resuming
    if (currentPanel === 'reset') {
      setCurrentPanel(null)
      sessionManager.addTimelineBlock('working')
    }
  }

  const handleStopSession = () => {
    // Show end session modal instead of directly ending
    setShowEndSessionModal(true)
  }

  const handleEndSessionConfirm = async (
    reason: 'mission_complete' | 'stopping_early' | 'pulled_away',
    subReason?: string
  ) => {
    setShowEndSessionModal(false)
    
    // === TELEMETRY: Stop monitoring ===
    try {
      await tauriBridge.stopTelemetryMonitor()
      if (telemetryCleanupRef.current) {
        telemetryCleanupRef.current()
        telemetryCleanupRef.current = null
      }
      console.log('[Telemetry] Monitor stopped')
    } catch (telemetryError) {
      console.error('[Telemetry] Failed to stop monitor:', telemetryError)
    }
    
    // === TELEMETRY: Save stats ===
    try {
      await telemetryStats.saveStats()
      console.log('[Telemetry] Stats saved')
    } catch (statsError) {
      console.error('[Telemetry] Failed to save stats:', statsError)
    }

    const finalSession = await sessionManager.endSession(reason, subReason)

    if (finalSession) {
      console.log('[App] Session ended:', {
        victoryLevel: finalSession.victoryLevel,
        flowEfficiency: finalSession.flowEfficiency,
        duration: finalSession.actualDurationMinutes,
        reason,
        subReason,
      })
    }

    setMode('post-session')
    setCurrentPanel('postSessionSummary')
  }

  const handleEndSessionQuickExit = async () => {
    setShowEndSessionModal(false)
    
    // === TELEMETRY: Stop monitoring ===
    try {
      await tauriBridge.stopTelemetryMonitor()
      if (telemetryCleanupRef.current) {
        telemetryCleanupRef.current()
        telemetryCleanupRef.current = null
      }
      console.log('[Telemetry] Monitor stopped (quick exit)')
    } catch (telemetryError) {
      console.error('[Telemetry] Failed to stop monitor:', telemetryError)
    }

    // Quick exit - end session without going through reflection flow
    await sessionManager.endSession('stopping_early', 'Quick exit')
    
    setMode('idle')
    setCurrentPanel(null)
  }

  const handleEndSessionCancel = () => {
    setShowEndSessionModal(false)
    // Return to session
  }

  // ============================================
  // RESET HANDLERS
  // ============================================

  const handleReset = () => {
    sessionManager.recordIntervention('reset-panel-opened')
    setCurrentPanel('reset')
  }

  const handleResetComplete = (ritualType: RitualType) => {
    // Called when ritual is SELECTED (not completed)
    // NO bonus awarded here - wait for actual completion
    console.log('Reset ritual started:', ritualType)
    sessionManager.recordIntervention(`reset-${ritualType}`)
    sessionManager.addTimelineBlock('reset')
  }
  
  const handleRitualComplete = (data: RitualCompletionData) => {
    // Called when ritual ACTUALLY completes (or is skipped)
    // Award points based on ACTUAL time spent (anti-cheat)
    const actualMinutes = Math.floor(data.actualDuration / 60)
    const plannedMinutes = Math.floor(data.plannedDuration / 60)
    
    console.log(`[Reset] Ritual complete:`, {
      type: data.ritualType,
      planned: `${plannedMinutes}min`,
      actual: `${actualMinutes}min (${data.actualDuration}s)`,
      skipped: data.wasSkipped,
    })
    
    // Only award points for time actually spent
    if (actualMinutes > 0) {
      const bonusPoints = actualMinutes * 2
      bandwidthEngine.applyResetBonus(actualMinutes)
      telemetryStats.recordResetRitual(bonusPoints)
      console.log(`[Reset] Awarded ${bonusPoints} points for ${actualMinutes} minutes`)
    } else if (data.actualDuration >= 30) {
      // At least 30 seconds = 1 point
      bandwidthEngine.applyTelemetryBonus(1, `${data.ritualType} (partial)`)
      telemetryStats.recordResetRitual(1)
      console.log(`[Reset] Awarded 1 point for ${data.actualDuration}s`)
    } else {
      console.log(`[Reset] No points awarded - only ${data.actualDuration}s spent`)
    }
  }

  const handleResetClose = () => {
    // Resume session if it was paused for the reset ritual
    if (mode === 'paused') {
      sessionManager.resumeSession()
      setMode('session')
      sessionManager.addTimelineBlock('working')
    } else if (mode === 'session') {
      sessionManager.addTimelineBlock('working')
    }
    setCurrentPanel(null)
  }

  // ============================================
  // INTERVENTION HANDLERS
  // ============================================

  const handleInterventionDismiss = () => {
    setShowInterventionOverlay(false)
  }

  const handleInterventionAction = () => {
    setShowInterventionOverlay(false)
    // Open reset panel for deeper intervention
    setCurrentPanel('reset')
  }

  // ============================================
  // DELAY GATE HANDLERS (Flow Mode)
  // ============================================

  const handleDelayGateReturnToWork = () => {
    console.log('[DelayGate] User chose to return to work')
    // Award bonus for returning to work
    const bonusResult = calculateBonus('delay_gate_returned', 
      (sessionManager.currentSession?.mode || 'Flow') as 'Zen' | 'Flow' | 'Legend'
    )
    bandwidthEngine.applyTelemetryBonus(
      bonusResult.finalBonus,
      'Returned from delay gate'
    )
    // Record intervention response
    telemetryStats.recordIntervention('returned')
    telemetryStats.recordBonus(bonusResult.finalBonus, 'Returned from delay gate')
    // Return to working state
    sessionManager.addTimelineBlock('working')
    // Close the delay gate and resize back to HUD
    setDelayGateState(createInitialDelayGateState())
    resizeForPanel(null)
  }

  const handleDelayGateProceed = () => {
    console.log('[DelayGate] Countdown complete - user proceeding to distraction')
    // Record intervention response (proceeded through)
    telemetryStats.recordIntervention('proceeded')
    // Stay in distracted state (already set)
    // Penalty already applied when delay gate was triggered
    // Close the gate and resize back to HUD
    setDelayGateState(createInitialDelayGateState())
    resizeForPanel(null)
  }

  const handleDelayGateDismiss = () => {
    console.log('[DelayGate] Delay gate dismissed')
    setDelayGateState(createInitialDelayGateState())
    resizeForPanel(null)
  }

  // ============================================
  // LEGEND MODE INTERVENTION HANDLERS
  // ============================================

  // Handle session extension when block screen triggers it (fires once per block event)
  const handleBlockScreenExtension = useCallback((extensionMinutes: number) => {
    if (extensionMinutes > 0) {
      timer.extendSession(extensionMinutes)
      console.log(`[Legend] Session extended by ${extensionMinutes} minutes`)
    }
  }, [timer])

  const handleBlockScreenAccept = () => {
    console.log('[LegendIntervention] User accepted and returned to work')
    
    // Award small bonus for accepting the block gracefully
    const bonusResult = calculateBonus('block_accepted', 
      (sessionManager.currentSession?.mode || 'Legend') as 'Zen' | 'Flow' | 'Legend'
    )
    bandwidthEngine.applyTelemetryBonus(
      bonusResult.finalBonus,
      'Accepted block'
    )
    // Record intervention response (returned to work)
    telemetryStats.recordIntervention('returned')
    telemetryStats.recordBonus(bonusResult.finalBonus, 'Accepted block')
    // Return to working state
    sessionManager.addTimelineBlock('working')
    // Close the block screen and resize back to HUD
    setBlockScreenState(createInitialBlockScreenState())
    resizeForPanel(null)
  }

  // ============================================
  // PARKING LOT HANDLERS
  // ============================================

  const handleOpenParkingLot = () => {
    // Toggle parking lot panel
    if (currentPanel === 'parkingLot') {
      setCurrentPanel(null)
    } else {
      setCurrentPanel('parkingLot')
    }
  }

  const handleParkingLotItemsChange = () => {
    loadNextSessionItems()
  }

  const handleHarvestComplete = () => {
    setCurrentPanel(null)
    setMode('idle')
  }

  // ============================================
  // POST-SESSION FLOW HANDLERS
  // ============================================

  const handleContinueToReflection = () => {
    setCurrentPanel('sessionReflection')
  }

  const handleReflectionComplete = async (reflection: ReflectionObject) => {
    console.log('Reflection saved:', reflection)

    const activeItems = getActiveParkingLotItems()
    if (activeItems.length > 0) {
      setCurrentPanel('parkingLotHarvest')
    } else {
      handleHarvestComplete()
    }
  }

  const handleClosePanel = () => {
    setCurrentPanel(null)
    if (mode === 'post-session') {
      setMode('idle')
    }
  }

  // ============================================
  // RENDER: LOADING STATE
  // ============================================

  if (mode === 'loading') {
    return (
      <div className="w-full h-full bg-transparent flex items-center justify-center">
        <div className="w-[320px] h-[60px] rounded-full bg-[#0a0f0d]/90 backdrop-blur-xl border border-[#2f4a42]/40 shadow-2xl flex items-center justify-center">
          <div className="text-cyan-400 animate-pulse">Initializing...</div>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER: RECOVERY MODAL
  // ============================================

  if (mode === 'recovery' && recoveryData) {
    // Resize window for recovery modal
    resizeForPanel('recovery')
    
    // Handle dragging for recovery modal
    const handleRecoveryDrag = async (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('button')) {
        e.preventDefault()
        const { startDragging } = await import('@/hooks/useTauriWindow')
        await startDragging()
      }
    }
    
    return (
      <div 
        className="flex flex-col items-center p-4 cursor-grab active:cursor-grabbing"
        onMouseDown={handleRecoveryDrag}
      >
        <InterruptedSessionModalAdapter
          isOpen={true}
          recoveryData={recoveryData}
          onResume={handleRecoveryResume}
          onDiscard={handleRecoveryDiscard}
        />
      </div>
    )
  }

  // ============================================
  // DERIVED VALUES FOR HUD
  // ============================================
  const totalTimeSeconds = (sessionManager.currentSession?.plannedDurationMinutes || 0) * 60
  const sessionModeForHUD = (sessionManager.currentSession?.mode || 'Flow') as SessionMode

  // ============================================
  // RENDER: MAIN APP
  // ============================================

  return (
    <div className="w-full min-h-full bg-transparent">
      {/* Main container - flex column, centered */}
      <div className="flex flex-col items-center">

        {/* FloatingHUD via Adapter - uses bandwidth engine values */}
        <HUDAdapter
          bandwidth={bandwidthEngine.current}
          mode={mode}
          isCalibrated={calibration !== null}
          sessionMode={sessionModeForHUD}
          sessionTime={timer.elapsedSeconds}
          timeRemaining={timer.timeRemaining}
          totalTime={totalTimeSeconds}
          isInFlow={bandwidthEngine.isInFlow}
          onStartSession={handleStartSession}
          onPauseSession={handlePauseSession}
          onResumeSession={handleResumeSession}
          onStopSession={handleStopSession}
          onOpenParkingLot={handleOpenParkingLot}
          onCalibrate={handleCalibrate}
          onReset={handleReset}
        />

        {/* Intervention Overlay */}
        {showInterventionOverlay && (
          <InterventionOverlayAdapter
            isOpen={true}
            type={interventionType}
            mode={sessionModeForHUD}
            currentBandwidth={bandwidthEngine.current}
            onDismiss={handleInterventionDismiss}
            onReset={handleInterventionAction}
          />
        )}

        {/* Flow Celebration Overlay */}
        {showFlowCelebration && (
          <FlowCelebrationOverlay
            isOpen={true}
            mode={sessionModeForHUD}
            onDismiss={() => setShowFlowCelebration(false)}
          />
        )}

        {/* End Session Modal */}
        {showEndSessionModal && (
          <EndSessionModalAdapter
            isOpen={true}
            onCancel={handleEndSessionCancel}
            onEndSession={handleEndSessionConfirm}
            onQuickExit={handleEndSessionQuickExit}
          />
        )}

        {/* Panels render below HUD */}
        {currentPanel === 'calibration' && (
          <CalibrationPanelAdapter
            isOpen={true}
            onClose={handleClosePanel}
            onComplete={handleCalibrationComplete}
          />
        )}

        {currentPanel === 'preSession' && (
          <PreSessionPanelAdapter
            isOpen={true}
            onClose={handleClosePanel}
            onStartSession={handleSessionStart}
          />
        )}

        {currentPanel === 'reset' && (
          <ResetPanelAdapter
            isOpen={true}
            onClose={handleResetClose}
            onSelectRitual={handleResetComplete}
            onRitualComplete={handleRitualComplete}
            sessionMode={sessionModeForHUD}
          />
        )}

        {/* Delay Gate Panel (Flow Mode) - renders below HUD when triggered */}
        <DelayGateAdapter
          state={delayGateState}
          onReturnToWork={handleDelayGateReturnToWork}
          onProceed={handleDelayGateProceed}
          onDismiss={handleDelayGateDismiss}
        />

        {/* Legend Mode Intervention - strict penalty with no countdown */}
        <BlockScreenAdapter
          state={blockScreenState}
          onAccept={handleBlockScreenAccept}
          onExtension={handleBlockScreenExtension}
        />

        {currentPanel === 'parkingLot' && (
          <ParkingLotPanelAdapter
            isOpen={true}
            onClose={handleClosePanel}
            onItemsChange={handleParkingLotItemsChange}
          />
        )}

        {currentPanel === 'postSessionSummary' && (
          <PostSessionSummaryAdapter
            isOpen={true}
            session={sessionManager.currentSession}
            telemetryStats={telemetryStats.stats}
            onClose={handleClosePanel}
            onContinueToReflection={handleContinueToReflection}
          />
        )}

        {currentPanel === 'sessionReflection' && (
          <SessionReflectionAdapter
            isOpen={true}
            session={sessionManager.currentSession}
            onClose={handleClosePanel}
            onComplete={handleReflectionComplete}
          />
        )}

        {currentPanel === 'parkingLotHarvest' && (
          <ParkingLotHarvestAdapter
            isOpen={true}
            onClose={handleHarvestComplete}
            sessionId={sessionManager.sessionId || undefined}
          />
        )}

      </div>
    </div>
  )
}

export default App
