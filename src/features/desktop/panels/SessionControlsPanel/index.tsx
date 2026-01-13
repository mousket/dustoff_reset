
import type { SessionControlsProps } from "./types"

export function SessionControlsPanel({
  isOpen,
  onClose,
  onPause,
  onReset,
  onEnd,
  onToggleFlow,
  onOpenParkingLot,
  isFlowMode,
  isPaused,
  sessionMode,
}: SessionControlsProps) {
  if (!isOpen) return null

  const controls = [
    {
      label: isPaused ? "Resume" : "Pause",
      icon: isPaused ? "▶" : "⏸",
      onClick: onPause,
      color: "zinc",
      description: isPaused ? "Continue session" : "Take a break",
    },
    {
      label: "Reset",
      icon: "↻",
      onClick: onReset,
      color: "amber",
      description: "Restart focus state",
    },
    {
      label: "End Session",
      icon: "⏹",
      onClick: onEnd,
      color: "red",
      description: "Complete and review",
    },
    {
      label: "Parking Lot",
      icon: "📋",
      onClick: onOpenParkingLot,
      color: "emerald",
      description: "Capture thoughts",
    },
    {
      label: isFlowMode ? "Exit Flow" : "Enter Flow",
      icon: "⚡",
      onClick: onToggleFlow,
      color: isFlowMode ? "purple" : "cyan",
      description: isFlowMode ? "Return to normal mode" : "Activate flow protection",
    },
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; hover: string }> = {
      zinc: {
        bg: "bg-zinc-500/20",
        border: "border-zinc-500/30",
        text: "text-zinc-300",
        hover: "hover:bg-zinc-500/30",
      },
      amber: {
        bg: "bg-amber-500/20",
        border: "border-amber-500/30",
        text: "text-amber-400",
        hover: "hover:bg-amber-500/30",
      },
      red: {
        bg: "bg-red-500/20",
        border: "border-red-500/30",
        text: "text-red-400",
        hover: "hover:bg-red-500/30",
      },
      emerald: {
        bg: "bg-emerald-500/20",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
        hover: "hover:bg-emerald-500/30",
      },
      purple: {
        bg: "bg-purple-500/20",
        border: "border-purple-500/30",
        text: "text-purple-400",
        hover: "hover:bg-purple-500/30",
      },
      cyan: {
        bg: "bg-cyan-500/20",
        border: "border-cyan-500/30",
        text: "text-cyan-400",
        hover: "hover:bg-cyan-500/30",
      },
    }
    return colors[color] || colors.zinc
  }

  return (
    <div
      className="w-[380px] rounded-3xl bg-[#0a0f0d]/55 backdrop-blur-xl border border-[#2f4a42]/40 shadow-2xl overflow-hidden"
      style={{
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.8), 0 0 60px rgba(16, 185, 129, 0.08)",
      }}
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Session Controls</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Mode: {sessionMode}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-800/50 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {controls.map((control) => {
            const colors = getColorClasses(control.color)
            return (
              <button
                key={control.label}
                onClick={() => {
                  control.onClick()
                  onClose()
                }}
                className={`p-4 ${colors.bg} ${colors.hover} border ${colors.border} rounded-xl transition-all group`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`text-2xl ${colors.text}`}>{control.icon}</div>
                  <div className="text-center">
                    <div className={`text-sm font-medium ${colors.text}`}>{control.label}</div>
                    <div className="text-xs text-zinc-500 mt-1">{control.description}</div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Session Info */}
        <div className="px-3 py-2 bg-zinc-900/30 border border-zinc-800/50 rounded-lg">
          <div className="text-xs text-zinc-400">
            {isPaused ? (
              <span className="text-amber-400">Session paused. Take your time.</span>
            ) : (
              <span>Session active. Stay focused.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
