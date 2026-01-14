// src/hooks/useBandwidthEngine.ts
// Implements the biological bandwidth model with entropy decay and intervention triggers

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseBandwidthEngineProps {
  initialBandwidth: number
  isSessionActive: boolean
  isPaused: boolean
  mode: 'Zen' | 'Flow' | 'Legend'
  onFrictionTrigger: () => void       // bandwidth < 60
  onFocusSlippingTrigger: () => void  // bandwidth < 50
  onFlowAchieved: () => void          // sustained focus 12+ min
  onFlowLost: () => void              // exited flow state
}

interface BandwidthState {
  current: number
  trend: 'rising' | 'stable' | 'falling'
  isInFlow: boolean
  flowDurationMinutes: number
  contextSwitches: number
}

interface BandwidthActions {
  applyContextSwitchPenalty: () => void
  applyResetBonus: (minutes: number) => void
  applyDistractionPenalty: () => void
  applyFocusBonus: () => void
  applyTelemetryPenalty: (penalty: number, reason?: string) => void
  applyTelemetryBonus: (bonus: number, reason?: string) => void
  resetEngine: () => void
}

// Decay rates per mode (bandwidth points per minute)
const DECAY_RATES = {
  Zen: 0.15,      // Gentle decay - forgiving mode
  Flow: 0.25,     // Moderate decay - balanced mode
  Legend: 0.40,   // Aggressive decay - challenge mode
}

// Bonus/penalty amounts
const CONTEXT_SWITCH_PENALTY = 5     // Points lost per context switch
const DISTRACTION_PENALTY = 8        // Points lost per recorded distraction
const FOCUS_BONUS = 1                // Points gained per 5 min of focus (halved)
const RESET_BONUS_PER_MINUTE = 2     // Points gained per minute of reset ritual (~6 for 3min walk)

// Intervention thresholds
const FRICTION_THRESHOLD = 60        // Show subtle nudge
const FOCUS_SLIPPING_THRESHOLD = 50  // Show stronger intervention
const CRITICAL_THRESHOLD = 30        // Session at risk

// Flow state
const FLOW_ENTRY_THRESHOLD = 70      // Bandwidth needed to enter flow
const FLOW_EXIT_THRESHOLD = 60       // Bandwidth where flow is lost
const FLOW_ACHIEVEMENT_MINUTES = 12  // Minutes needed for flow celebration

/**
 * useBandwidthEngine
 * 
 * Implements the biological bandwidth model from the Dustoff Reset methodology.
 * 
 * Core mechanics:
 * 1. Bandwidth starts at calibration score
 * 2. Decays over time (entropy) - simulates cognitive fatigue
 * 3. Mode affects decay rate (Legend is hardest)
 * 4. Context switches cause immediate penalties
 * 5. Sustained focus provides bonuses
 * 6. Reset rituals restore bandwidth
 * 7. Triggers interventions at thresholds
 * 
 * Flow State:
 * - Entered when bandwidth > 70 and stable/rising
 * - Lost when bandwidth drops below 60
 * - 50% reduced decay while in flow
 * - Celebration after 12 minutes sustained
 * 
 * @example
 * ```tsx
 * const bandwidth = useBandwidthEngine({
 *   initialBandwidth: calibration.calibrationScore,
 *   isSessionActive: mode === 'session',
 *   isPaused: mode === 'paused',
 *   mode: sessionMode,
 *   onFrictionTrigger: () => showNudge(),
 *   onFocusSlippingTrigger: () => showIntervention(),
 *   onFlowAchieved: () => celebrate(),
 *   onFlowLost: () => console.log('Flow lost'),
 * })
 * ```
 */
export function useBandwidthEngine({
  initialBandwidth,
  isSessionActive,
  isPaused,
  mode,
  onFrictionTrigger,
  onFocusSlippingTrigger,
  onFlowAchieved,
  onFlowLost,
}: UseBandwidthEngineProps): BandwidthState & BandwidthActions {
  // Core state
  const [bandwidth, setBandwidth] = useState(initialBandwidth)
  const [trend, setTrend] = useState<'rising' | 'stable' | 'falling'>('stable')
  const [isInFlow, setIsInFlow] = useState(false)
  const [flowStartTime, setFlowStartTime] = useState<number | null>(null)
  const [flowDurationMinutes, setFlowDurationMinutes] = useState(0)
  const [contextSwitches, setContextSwitches] = useState(0)
  
  // Refs for tracking trigger states (don't cause re-renders)
  const lastBandwidth = useRef(initialBandwidth)
  const bandwidthHistory = useRef<number[]>([initialBandwidth])
  const frictionTriggered = useRef(false)
  const focusSlippingTriggered = useRef(false)
  const flowAchievedTriggered = useRef(false)
  const lastFocusBonusTime = useRef<number>(Date.now())
  
  // Reset when session starts
  useEffect(() => {
    if (isSessionActive && !isPaused) {
      // Only reset on fresh session start, not on resume
      if (bandwidth === initialBandwidth) {
        resetEngine()
      }
    }
  }, [isSessionActive])
  
  // Update initial bandwidth when it changes (e.g., after calibration)
  useEffect(() => {
    if (!isSessionActive) {
      setBandwidth(initialBandwidth)
      lastBandwidth.current = initialBandwidth
    }
  }, [initialBandwidth, isSessionActive])
  
  // Main decay loop (runs every second when session active)
  useEffect(() => {
    if (!isSessionActive || isPaused) return
    
    const interval = setInterval(() => {
      setBandwidth(prev => {
        // Calculate base decay
        const decayRate = DECAY_RATES[mode]
        const decayPerSecond = decayRate / 60
        
        // Apply flow bonus (50% reduced decay while in flow)
        const effectiveDecay = isInFlow ? decayPerSecond * 0.5 : decayPerSecond
        
        let newBandwidth = prev - effectiveDecay
        
        // Clamp to 0-100
        newBandwidth = Math.max(0, Math.min(100, newBandwidth))
        
        // Update bandwidth history for trend calculation
        bandwidthHistory.current.push(newBandwidth)
        if (bandwidthHistory.current.length > 30) {
          bandwidthHistory.current.shift()
        }
        
        // Calculate trend from recent history
        const history = bandwidthHistory.current
        if (history.length >= 10) {
          const recent = history.slice(-5).reduce((a, b) => a + b, 0) / 5
          const older = history.slice(-10, -5).reduce((a, b) => a + b, 0) / 5
          const diff = recent - older
          
          if (diff > 0.5) {
            setTrend('rising')
          } else if (diff < -0.5) {
            setTrend('falling')
          } else {
            setTrend('stable')
          }
        }
        
        lastBandwidth.current = newBandwidth
        
        // Check intervention thresholds (only trigger once per threshold crossing)
        if (newBandwidth < FOCUS_SLIPPING_THRESHOLD && prev >= FOCUS_SLIPPING_THRESHOLD) {
          if (!focusSlippingTriggered.current) {
            focusSlippingTriggered.current = true
            // Use setTimeout to avoid state update during render
            setTimeout(() => onFocusSlippingTrigger(), 0)
          }
        } else if (newBandwidth < FRICTION_THRESHOLD && prev >= FRICTION_THRESHOLD) {
          if (!frictionTriggered.current) {
            frictionTriggered.current = true
            setTimeout(() => onFrictionTrigger(), 0)
          }
        }
        
        // Reset triggers if bandwidth recovers significantly
        if (newBandwidth >= FRICTION_THRESHOLD + 5) {
          frictionTriggered.current = false
        }
        if (newBandwidth >= FOCUS_SLIPPING_THRESHOLD + 5) {
          focusSlippingTriggered.current = false
        }
        
        return newBandwidth
      })
      
      // Apply periodic focus bonus (every 5 minutes of sustained focus)
      const now = Date.now()
      if (now - lastFocusBonusTime.current >= 5 * 60 * 1000) {
        if (bandwidth > FLOW_ENTRY_THRESHOLD) {
          setBandwidth(prev => Math.min(100, prev + FOCUS_BONUS))
          lastFocusBonusTime.current = now
        }
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isSessionActive, isPaused, mode, isInFlow, bandwidth, onFrictionTrigger, onFocusSlippingTrigger])
  
  // Flow state tracking
  useEffect(() => {
    if (!isSessionActive || isPaused) return
    
    // Check if in "flow zone"
    const shouldBeInFlow = bandwidth >= FLOW_ENTRY_THRESHOLD && trend !== 'falling'
    const shouldExitFlow = bandwidth < FLOW_EXIT_THRESHOLD
    
    if (shouldBeInFlow && !isInFlow) {
      // Entering flow
      setIsInFlow(true)
      setFlowStartTime(Date.now())
      console.log('[BandwidthEngine] Entered flow state')
    } else if (shouldExitFlow && isInFlow) {
      // Exiting flow
      setIsInFlow(false)
      setFlowStartTime(null)
      setFlowDurationMinutes(0)
      flowAchievedTriggered.current = false
      console.log('[BandwidthEngine] Exited flow state')
      setTimeout(() => onFlowLost(), 0)
    }
  }, [bandwidth, trend, isSessionActive, isPaused, isInFlow, onFlowLost])
  
  // Flow duration and achievement tracking
  useEffect(() => {
    if (!isInFlow || !flowStartTime) return
    
    const interval = setInterval(() => {
      const duration = Math.floor((Date.now() - flowStartTime) / 60000)
      setFlowDurationMinutes(duration)
      
      // Check for flow achievement
      if (duration >= FLOW_ACHIEVEMENT_MINUTES && !flowAchievedTriggered.current) {
        flowAchievedTriggered.current = true
        console.log('[BandwidthEngine] Flow achievement unlocked!')
        onFlowAchieved()
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isInFlow, flowStartTime, onFlowAchieved])
  
  // ============================================
  // ACTIONS
  // ============================================
  
  /**
   * Apply penalty for context switching (app/tab change)
   */
  const applyContextSwitchPenalty = useCallback(() => {
    setBandwidth(prev => Math.max(0, prev - CONTEXT_SWITCH_PENALTY))
    setContextSwitches(prev => prev + 1)
    console.log('[BandwidthEngine] Context switch penalty applied')
  }, [])
  
  /**
   * Apply bonus from completing a reset ritual
   */
  const applyResetBonus = useCallback((minutes: number) => {
    const bonus = minutes * RESET_BONUS_PER_MINUTE
    setBandwidth(prev => Math.min(100, prev + bonus))
    console.log(`[BandwidthEngine] Reset bonus applied: +${bonus} points`)
  }, [])
  
  /**
   * Apply penalty for recorded distraction
   */
  const applyDistractionPenalty = useCallback(() => {
    setBandwidth(prev => Math.max(0, prev - DISTRACTION_PENALTY))
    console.log('[BandwidthEngine] Distraction penalty applied')
  }, [])
  
  /**
   * Apply manual focus bonus (for positive behaviors)
   */
  const applyFocusBonus = useCallback(() => {
    setBandwidth(prev => Math.min(100, prev + FOCUS_BONUS))
    console.log('[BandwidthEngine] Focus bonus applied')
  }, [])
  
  /**
   * Apply penalty from telemetry system (app/domain switches)
   * @param penalty - The penalty value (should be negative)
   * @param reason - Optional reason for logging
   */
  const applyTelemetryPenalty = useCallback((penalty: number, reason?: string) => {
    if (penalty >= 0) return // Only apply actual penalties
    
    setBandwidth(prev => {
      const newBandwidth = Math.max(0, prev + penalty)
      console.log(`[BandwidthEngine] Telemetry penalty: ${penalty} (${reason || 'unknown'}) | ${Math.round(prev)} → ${Math.round(newBandwidth)}`)
      return newBandwidth
    })
    setContextSwitches(prev => prev + 1)
  }, [])
  
  /**
   * Apply bonus from telemetry system (returning to work, etc.)
   * @param bonus - The bonus value (should be positive)
   * @param reason - Optional reason for logging
   */
  const applyTelemetryBonus = useCallback((bonus: number, reason?: string) => {
    if (bonus <= 0) return // Only apply actual bonuses
    
    setBandwidth(prev => {
      const newBandwidth = Math.min(100, prev + bonus)
      console.log(`[BandwidthEngine] Telemetry bonus: +${bonus} (${reason || 'unknown'}) | ${Math.round(prev)} → ${Math.round(newBandwidth)}`)
      return newBandwidth
    })
  }, [])
  
  /**
   * Reset the engine to initial state
   */
  const resetEngine = useCallback(() => {
    setBandwidth(initialBandwidth)
    setTrend('stable')
    setIsInFlow(false)
    setFlowStartTime(null)
    setFlowDurationMinutes(0)
    setContextSwitches(0)
    lastBandwidth.current = initialBandwidth
    bandwidthHistory.current = [initialBandwidth]
    frictionTriggered.current = false
    focusSlippingTriggered.current = false
    flowAchievedTriggered.current = false
    lastFocusBonusTime.current = Date.now()
    console.log('[BandwidthEngine] Engine reset')
  }, [initialBandwidth])
  
  return {
    // State
    current: Math.round(bandwidth),
    trend,
    isInFlow,
    flowDurationMinutes,
    contextSwitches,
    
    // Actions
    applyContextSwitchPenalty,
    applyResetBonus,
    applyDistractionPenalty,
    applyFocusBonus,
    applyTelemetryPenalty,
    applyTelemetryBonus,
    resetEngine,
  }
}

// Export constants for use elsewhere
export const BANDWIDTH_THRESHOLDS = {
  FRICTION: FRICTION_THRESHOLD,
  FOCUS_SLIPPING: FOCUS_SLIPPING_THRESHOLD,
  CRITICAL: CRITICAL_THRESHOLD,
  FLOW_ENTRY: FLOW_ENTRY_THRESHOLD,
  FLOW_EXIT: FLOW_EXIT_THRESHOLD,
}

export const BANDWIDTH_DECAY_RATES = DECAY_RATES

export type { UseBandwidthEngineProps, BandwidthState, BandwidthActions }
