// src/features/desktop/overlays/DelayGate/index.tsx
// Delay Gate panel for Flow mode - gives user time to reconsider
// Renders as a panel below the HUD (not a full-screen overlay)

import { useState, useEffect, useCallback } from "react"
import type { DelayGateProps } from "./types"
import { ArrowLeft, Clock, AlertTriangle } from "lucide-react"

/**
 * DelayGate
 * 
 * A countdown panel that appears below the HUD in Flow mode when a distraction is detected.
 * Gives the user time to reconsider before allowing access to the distracting app/site.
 * 
 * Features:
 * - Countdown timer (10-30 seconds based on offense number)
 * - "Return to Work" button (earns bonus points)
 * - Can wait through the countdown to proceed (penalty already applied)
 * - Escalating messages based on offense count
 */
export function DelayGate({
  isOpen,
  triggerName,
  category,
  delaySeconds,
  offenseNumber,
  message,
  onReturnToWork,
  onProceed,
  onDismiss,
}: DelayGateProps) {
  const [timeRemaining, setTimeRemaining] = useState(delaySeconds)

  // Reset timer when delay gate opens with new delay
  useEffect(() => {
    if (isOpen) {
      setTimeRemaining(delaySeconds)
    }
  }, [isOpen, delaySeconds])

  // Countdown timer
  useEffect(() => {
    if (!isOpen || timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Countdown complete - user waited through
          onProceed()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, timeRemaining, onProceed])

  const handleReturnToWork = useCallback(() => {
    onReturnToWork()
  }, [onReturnToWork])

  if (!isOpen) return null

  // Format category for display
  const categoryDisplay = category.replace(/_/g, ' ')
  
  // Progress percentage for countdown bar
  const progressPercent = (timeRemaining / delaySeconds) * 100

  // Get urgency colors based on time remaining
  const getUrgencyColors = () => {
    if (timeRemaining <= 3) {
      return {
        border: 'border-red-500/50',
        glow: 'shadow-[0_0_30px_rgba(239,68,68,0.3)]',
        text: 'text-red-400',
        textLight: 'text-red-100',
        bg: 'bg-red-500/10',
        bar: 'bg-red-500',
        button: 'bg-red-500/20 hover:bg-red-500/30 border-red-500/40 text-red-300',
      }
    }
    if (timeRemaining <= 7) {
      return {
        border: 'border-amber-500/50',
        glow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]',
        text: 'text-amber-400',
        textLight: 'text-amber-100',
        bg: 'bg-amber-500/10',
        bar: 'bg-amber-500',
        button: 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300',
      }
    }
    return {
      border: 'border-cyan-500/50',
      glow: 'shadow-[0_0_30px_rgba(6,182,212,0.3)]',
      text: 'text-cyan-400',
      textLight: 'text-cyan-100',
      bg: 'bg-cyan-500/10',
      bar: 'bg-cyan-500',
      button: 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/40 text-cyan-300',
    }
  }

  const colors = getUrgencyColors()

  return (
    <div className={`w-[475px] rounded-3xl bg-[#0a0f0d]/90 backdrop-blur-xl border-2 ${colors.border} ${colors.glow} overflow-hidden transition-all duration-500`}>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className={`p-2.5 rounded-xl ${colors.bg} border ${colors.border}`}>
            <AlertTriangle className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div className="flex-1">
            <h2 className={`text-lg font-semibold ${colors.text} uppercase tracking-wide`}>
              Delay Gate
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Flow Mode Protection
            </p>
          </div>
          {/* Offense counter */}
          <div className={`px-2.5 py-1 rounded-full ${colors.bg} border ${colors.border}`}>
            <span className={`text-xs font-mono ${colors.text}`}>
              #{offenseNumber}
            </span>
          </div>
        </div>

        {/* What triggered it */}
        <div className={`p-4 rounded-xl bg-black/40 border ${colors.border}/30 space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">
              Detected
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
              {categoryDisplay}
            </span>
          </div>
          <p className={`text-base font-medium ${colors.textLight}`}>
            {triggerName}
          </p>
        </div>

        {/* Message - prominent styling */}
        <div className={`p-3 rounded-xl border ${colors.border}/30 bg-black/40 text-center`}>
          <p className={`text-sm font-bold ${colors.text} uppercase tracking-wider`}>
            {message}
          </p>
        </div>

        {/* Countdown display */}
        <div className="flex items-center justify-center gap-3 py-2">
          <Clock className={`w-5 h-5 ${colors.text}`} />
          <span className={`text-5xl font-bold font-mono ${colors.text} tabular-nums`}>
            {timeRemaining}
          </span>
          <span className="text-sm text-zinc-500">
            seconds
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.bar} transition-all duration-1000 ease-linear`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-1">
          {/* Primary action: Return to work */}
          <button
            onClick={handleReturnToWork}
            className={`w-full px-5 py-3.5 rounded-xl border-2 ${colors.button} font-semibold transition-all hover:scale-[1.01] flex items-center justify-center gap-3`}
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Work
            <span className="text-xs opacity-60">(+2 bonus)</span>
          </button>

          {/* Secondary: Wait it out hint */}
          <p className="text-xs text-center text-zinc-600">
            Or wait {timeRemaining}s to proceed — penalty already applied
          </p>
        </div>
      </div>
    </div>
  )
}

export type { DelayGateProps }
