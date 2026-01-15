// src/features/desktop/overlays/BlockScreen/index.tsx
// Legend Mode Intervention - strict penalty with no countdown
// Renders as a panel below the HUD

import { useCallback, useEffect, useRef } from "react"
import type { BlockScreenProps } from "./types"
import { AlertTriangle, ArrowLeft, Clock, Flame } from "lucide-react"

/**
 * BlockScreen (Legend Mode Intervention)
 * 
 * A strict intervention panel that appears in Legend mode when a distraction is detected.
 * Unlike the Delay Gate, there is NO countdown - user MUST return to work immediately.
 * 
 * Note: This is an intervention/penalty screen, not an actual app blocker.
 * The user receives a penalty and must acknowledge it, but the app isn't force-closed.
 * 
 * Features:
 * - No countdown - immediate intervention
 * - No "wait through" option
 * - Session extension warnings at certain offense numbers
 * - Escalating severity with repeated offenses
 */
export function BlockScreen({
  isOpen,
  triggerName,
  category,
  offenseNumber,
  message,
  triggeredExtension,
  extensionMinutes,
  onAccept,
  onExtension,
}: BlockScreenProps) {
  // Track if we've already fired the extension for this block event
  // Uses offenseNumber as a unique identifier for each block event
  const lastExtensionOffense = useRef<number | null>(null)

  // Fire extension callback once when block opens with extension triggered
  useEffect(() => {
    if (
      isOpen &&
      triggeredExtension &&
      extensionMinutes > 0 &&
      onExtension &&
      lastExtensionOffense.current !== offenseNumber
    ) {
      lastExtensionOffense.current = offenseNumber
      onExtension(extensionMinutes)
      console.log(`[BlockScreen] Extension triggered: +${extensionMinutes} min (offense #${offenseNumber})`)
    }
  }, [isOpen, triggeredExtension, extensionMinutes, offenseNumber, onExtension])

  // Reset tracking when block closes
  useEffect(() => {
    if (!isOpen) {
      lastExtensionOffense.current = null
    }
  }, [isOpen])

  const handleAccept = useCallback(() => {
    onAccept()
  }, [onAccept])

  if (!isOpen) return null

  // Format category for display
  const categoryDisplay = category.replace(/_/g, ' ')

  // Severity increases with offense number
  const getSeverityLevel = () => {
    if (offenseNumber >= 6) return 'critical'
    if (offenseNumber >= 3) return 'severe'
    return 'warning'
  }

  const severity = getSeverityLevel()

  const severityStyles = {
    warning: {
      border: 'border-red-500/60',
      glow: 'shadow-[0_0_40px_rgba(239,68,68,0.4)]',
      text: 'text-red-400',
      textLight: 'text-red-100',
      bg: 'bg-red-500/10',
      button: 'bg-red-500/30 hover:bg-red-500/40 border-red-500/50 text-red-100',
      icon: 'text-red-500',
    },
    severe: {
      border: 'border-red-600/70',
      glow: 'shadow-[0_0_50px_rgba(220,38,38,0.5)]',
      text: 'text-red-500',
      textLight: 'text-red-100',
      bg: 'bg-red-600/15',
      button: 'bg-red-600/40 hover:bg-red-600/50 border-red-600/60 text-red-100',
      icon: 'text-red-600',
    },
    critical: {
      border: 'border-red-700/80',
      glow: 'shadow-[0_0_60px_rgba(185,28,28,0.6)]',
      text: 'text-red-600',
      textLight: 'text-red-50',
      bg: 'bg-red-700/20',
      button: 'bg-red-700/50 hover:bg-red-700/60 border-red-700/70 text-red-50',
      icon: 'text-red-700',
    },
  }

  const styles = severityStyles[severity]

  return (
    <div className={`w-[475px] rounded-3xl bg-[#0a0808]/95 backdrop-blur-xl border-2 ${styles.border} ${styles.glow} overflow-hidden transition-all duration-300`}>
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl ${styles.bg} border ${styles.border}`}>
            <AlertTriangle className={`w-5 h-5 ${styles.icon}`} />
          </div>
          <div className="flex-1">
            <h2 className={`text-lg font-bold ${styles.text} uppercase tracking-wider`}>
              Distraction Detected
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5 uppercase tracking-wide">
              Legend Mode • Offense #{offenseNumber}
            </p>
          </div>
        </div>

        {/* What triggered the intervention */}
        <div className={`p-3 rounded-xl bg-black/50 border ${styles.border}/40`}>
          <div className="flex items-center justify-between">
            <p className={`text-base font-semibold ${styles.textLight}`}>
              {triggerName}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${styles.bg} ${styles.text} font-medium`}>
              {categoryDisplay}
            </span>
          </div>
        </div>

        {/* Message */}
        <p className={`text-sm ${styles.textLight}/80 leading-relaxed`}>
          {message}
        </p>

        {/* Session Extension Warning - only show if triggered */}
        {triggeredExtension && (
          <div className={`p-3 rounded-xl ${styles.bg} border ${styles.border}/50 flex items-center gap-3`}>
            <Clock className={`w-4 h-4 ${styles.text} flex-shrink-0`} />
            <div>
              <p className={`text-sm font-bold ${styles.text}`}>
                Session Extended +{extensionMinutes} min
              </p>
              <p className="text-xs text-zinc-500">
                Consequence of repeated distractions
              </p>
            </div>
          </div>
        )}

        {/* Severity indicator for high offense counts */}
        {offenseNumber >= 3 && (
          <div className="flex items-center justify-center gap-1.5 py-1">
            {Array.from({ length: Math.min(offenseNumber, 6) }).map((_, i) => (
              <Flame 
                key={i} 
                className={`w-3.5 h-3.5 ${i < offenseNumber ? styles.text : 'text-zinc-700'}`} 
              />
            ))}
          </div>
        )}

        {/* Prominent warning message */}
        <div className={`p-3 rounded-xl border ${styles.border}/30 bg-black/40 text-center`}>
          <p className={`text-sm font-bold ${styles.text} uppercase tracking-wider`}>
            Legend mode demands focus — no waiting through
          </p>
        </div>

        {/* Single action - Return to work */}
        <button
          onClick={handleAccept}
          className={`w-full px-4 py-3 rounded-xl border-2 ${styles.button} font-bold uppercase tracking-wide transition-all hover:scale-[1.01] flex items-center justify-center gap-2`}
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Work
        </button>
      </div>
    </div>
  )
}

export type { BlockScreenProps }
