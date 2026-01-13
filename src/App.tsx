import { useState, useEffect, useCallback } from 'react'
import { tauriBridge, CalibrationData, RecoveryData, ReflectionObject } from '@/lib/tauri-bridge'
import { resizeForPanel, PanelType } from '@/hooks/useTauriWindow'
import { HUDAdapter } from '@/components/HUDAdapter'
import type { SessionMode } from '@/features/desktop/hud/FloatingHUD/types'

// Hooks
import { useSessionManager, SessionConfig } from '@/hooks/useSessionManager'
import { useSessionTimer } from '@/hooks/useSessionTimer'
import { useBandwidthEngine } from '@/hooks/useBandwidthEngine'

// Panel Adapters
import { CalibrationPanelAdapter } from '@/components/panels/CalibrationPanelAdapter'
import { PreSessionPanelAdapter, PreSessionConfig } from '@/components/panels/PreSessionPanelAdapter'
import { ResetPanelAdapter, RitualType } from '@/components/panels/ResetPanelAdapter'
import { ParkingLotPanelAdapter } from '@/components/panels/ParkingLotPanelAdapter'
import { ParkingLotHarvestAdapter } from '@/components/panels/ParkingLotHarvestAdapter'
import { PostSessionSummaryAdapter } from '@/components/panels/PostSessionSummaryAdapter'
import { SessionReflectionAdapter } from '@/components/panels/SessionReflectionAdapter'
import { getNextSessionItems, getActiveParkingLotItems, type ParkingLotItemFull } from '@/lib/parking-lot-storage'

// Overlays
import { InterventionOverlayAdapter } from '@/components/overlays/InterventionOverlayAdapter'
import { FlowCelebrationOverlay } from '@/features/desktop/overlays/FlowCelebrationOverlay'

// Modals
import { EndSessionModalAdapter } from '@/components/modals/EndSessionModalAdapter'
import { InterruptedSessionModalAdapter } from '@/components/modals/InterruptedSessionModalAdapter'

type AppMode = 'loading' | 'recovery' | 'not-calibrated' | 'idle' | 'pre-session' | 'session' | 'paused' | 'post-session'
type InterventionType = 'friction' | 'focus-slipping'

function App() {
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

  // Modal state
  const [showEndSessionModal, setShowEndSessionModal] = useState(false)

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
      // Auto-dismiss after 8 seconds
      setTimeout(() => setShowFlowCelebration(false), 8000)
    },
    onFlowLost: () => {
      console.log('[App] Flow lost')
      // Could show a subtle notification here
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
  // INITIALIZATION
  // ============================================
  useEffect(() => {
    initializeApp()
  }, [])

  // Resize window when panel changes
  useEffect(() => {
    resizeForPanel(currentPanel)
  }, [currentPanel])

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

      setCurrentPanel(null)
      setMode('session')

      console.log('[App] Session started:', sessionManager.sessionId)
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
    console.log('Reset ritual selected:', ritualType)
    sessionManager.recordIntervention(`reset-${ritualType}`)
    sessionManager.addTimelineBlock('reset')

    // Apply bandwidth bonus based on ritual duration
    const ritualDurations: Record<RitualType, number> = {
      breath: 2,
      walk: 5,
      dump: 3,
      personal: 4,
    }
    const minutes = ritualDurations[ritualType] || 2
    bandwidthEngine.applyResetBonus(minutes)
  }

  const handleResetClose = () => {
    if (mode === 'session' || mode === 'paused') {
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
  // PARKING LOT HANDLERS
  // ============================================

  const handleOpenParkingLot = () => {
    setCurrentPanel('parkingLot')
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
    return (
      <InterruptedSessionModalAdapter
        isOpen={true}
        recoveryData={recoveryData}
        onResume={handleRecoveryResume}
        onDiscard={handleRecoveryDiscard}
      />
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
    <div className="w-full h-full bg-transparent">
      {/* Main container */}
      <div className="relative">

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
            sessionMode={sessionModeForHUD}
          />
        )}

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

        {/* Debug overlay - remove in production */}
        {import.meta.env.DEV && mode === 'session' && (
          <div className="fixed bottom-2 right-2 text-xs text-zinc-500 bg-black/50 p-2 rounded font-mono">
            <div>⚡ Bandwidth: {bandwidthEngine.current}</div>
            <div>📈 Trend: {bandwidthEngine.trend}</div>
            <div>🌊 Flow: {bandwidthEngine.isInFlow ? `Yes (${bandwidthEngine.flowDurationMinutes}m)` : 'No'}</div>
            <div>⏱️ Elapsed: {timer.elapsedSeconds}s</div>
            <div>⏳ Remaining: {timer.timeRemaining}s</div>
            {timer.isOvertime && <div className="text-red-400">🚨 Overtime: +{timer.overtimeSeconds}s</div>}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
