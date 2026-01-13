
import { useEffect } from "react"
import { X } from "lucide-react"
import type { FlowCelebrationOverlayProps } from "./types"

const FLOW_CELEBRATION_CONFIG = {
  Zen: {
    title: "Beautiful Work",
    message:
      "You've been in sustained focus for a while now. We're extending your session by 5 minutes to honor this flow state.",
    borderColor: "border-emerald-500/50",
    glowColor: "shadow-[0_0_60px_rgba(16,185,129,0.4)]",
    titleColor: "text-emerald-400",
    animationColor: "bg-emerald-500",
  },
  Flow: {
    title: "Flow State Achieved",
    message:
      "Exceptional focus detected. Your cognitive bandwidth is peaking. Session extended by 5 minutes. Keep going.",
    borderColor: "border-cyan-500/50",
    glowColor: "shadow-[0_0_60px_rgba(6,182,212,0.5)]",
    titleColor: "text-cyan-400",
    animationColor: "bg-cyan-500",
  },
  Legend: {
    title: "PEAK PERFORMANCE",
    message:
      "You're operating at maximum cognitive capacity. This is legendary work. Session extended 5 minutes. Finish strong.",
    borderColor: "border-amber-500/50",
    glowColor: "shadow-[0_0_60px_rgba(251,191,36,0.4)]",
    titleColor: "text-amber-400",
    animationColor: "bg-gradient-to-r from-amber-500 to-red-500",
  },
}

export function FlowCelebrationOverlay({ isOpen, mode, onDismiss }: FlowCelebrationOverlayProps) {
  const config = FLOW_CELEBRATION_CONFIG[mode]

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onDismiss()
      }, 300000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, onDismiss])

  if (!isOpen) return null

  return (
    <div
      className={`w-[500px] ${config.borderColor} ${config.glowColor} bg-[#0a0f0d]/55 backdrop-blur-xl border-2 rounded-3xl p-8 mb-4 transition-all duration-300 ${
        isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex justify-center mb-6">
        <div
          className={`w-20 h-20 rounded-full ${config.animationColor} opacity-60 animate-[pulse_1.5s_ease-in-out_infinite]`}
        />
      </div>

      <div className="space-y-3 text-center mb-6">
        <h2 className={`text-xl font-thin tracking-wide ${config.titleColor}`}>{config.title}</h2>
        <div className="text-sm text-zinc-300 leading-relaxed space-y-2">
          <p>You've been in sustained focus for a while now.</p>
          <p>We're extending your session by 5 minutes to honor this flow state.</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
        <span>⏱️</span>
        <span>+5 minutes added</span>
      </div>
    </div>
  )
}
