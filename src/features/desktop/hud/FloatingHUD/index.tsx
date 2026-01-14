import type { FloatingHUDProps } from "./types"
import { formatTime, getBandwidthColor, getModeStyles } from "./logic"

export function FloatingHUD({
  demo = false,
  isCalibratedToday,
  bandwidthScore,
  estimatedDelta,
  mode,
  sessionMode,
  sessionTime = 0,
  timeRemaining = 0,
  isInFlow = false,
  onStartCalibration,
  onStartSession,
  onPauseSession,
  onResumeSession,
  onStopSession,
  onOpenParkingLot,
  onReset,
}: FloatingHUDProps) {
  const bandwidthValue = bandwidthScore ?? 0
  const bandwidthColor = getBandwidthColor(bandwidthScore)
  const modeStyles = getModeStyles(sessionMode)
  const isPaused = mode === "paused"

  return (
    <div
      className="relative overflow-visible"
      style={{
        width: "320px",
        height: "60px",
      }}
    >

      <div
        className="relative w-full h-full rounded-full bg-[#0a0f0d]/90 backdrop-blur-xl border shadow-2xl overflow-hidden transition-all duration-500"
        style={{
          borderColor: isInFlow ? "#10b981" : isPaused ? "#3f3f46" : sessionMode ? modeStyles.color : "#2f4a42",
          boxShadow: isPaused
            ? "0 8px 32px rgba(0, 0, 0, 0.6)"
            : sessionMode
              ? `0 8px 32px rgba(0, 0, 0, 0.8), 0 0 60px ${modeStyles.glow}`
              : "0 8px 32px rgba(0, 0, 0, 0.8), 0 0 60px rgba(16, 185, 129, 0.15)",
          opacity: isPaused ? 0.7 : 1,
        }}
      >
        <div className="absolute left-0 top-0 h-full w-16 flex items-center justify-center">
          {!isPaused && (
            <div
              className="absolute w-12 h-12 rounded-full opacity-40 blur-xl transition-all duration-1000"
              style={{
                background: `radial-gradient(circle, ${sessionMode ? modeStyles.color : bandwidthColor} 0%, transparent 70%)`,
              }}
            />
          )}

          <div className="relative z-10 text-center">
            {mode === "not-calibrated" ? (
              <div className="text-lg font-bold text-zinc-500">—</div>
            ) : mode === "estimated" ? (
              <>
                <div className="text-xl font-bold text-yellow-400">{bandwidthValue}</div>
                {estimatedDelta && <div className="text-[9px] text-yellow-500">+{estimatedDelta} est</div>}
              </>
            ) : (
              <div
                className="text-xl font-bold transition-all duration-1000"
                style={{ color: isPaused ? "#71717a" : bandwidthColor }}
              >
                {bandwidthValue}
              </div>
            )}
          </div>

          {!isPaused && mode !== "not-calibrated" && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(6)].map((_, i) => {
                const angle = (i * 360) / 6
                const radius = 20
                const x = radius * Math.cos((angle * Math.PI) / 180)
                const y = radius * Math.sin((angle * Math.PI) / 180)
                return (
                  <div
                    key={i}
                    className="absolute w-1 h-1 rounded-full transition-all duration-1000"
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                      backgroundColor:
                        mode === "estimated" ? "#fbbf24" : sessionMode ? modeStyles.particle : bandwidthColor,
                      opacity: 0.6,
                      animation: `twinkle ${2 + i * 0.2}s ease-in-out infinite`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                )
              })}
            </div>
          )}
        </div>

        <div className="absolute left-14 right-20 top-0 h-full flex flex-col items-center justify-center gap-0.5">
          {mode === "session" || mode === "paused" ? (
            <>
              <div className="flex items-center gap-2">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${mode === "session" ? "animate-pulse" : ""}`}
                  style={{
                    backgroundColor: isPaused ? "#71717a" : modeStyles.color,
                  }}
                />
                <span className="text-xs font-medium" style={{ color: isPaused ? "#71717a" : modeStyles.color }}>
                  {sessionMode || "Session"}
                </span>
              </div>
              <div className={`text-xs font-mono ${isPaused ? "text-zinc-500" : "text-emerald-400"}`}>
                {formatTime(sessionTime)} / {formatTime(sessionTime + timeRemaining)}
              </div>
            </>
          ) : mode === "not-calibrated" ? (
            <>
              <span className="text-xs text-zinc-400">Not Calibrated</span>
              <span className="text-[10px] text-emerald-500">Calibrate today</span>
            </>
          ) : mode === "estimated" ? (
            <>
              <span className="text-xs text-yellow-400">Estimated</span>
              <span className="text-[10px] text-yellow-600">Calibrate for accuracy</span>
            </>
          ) : (
            <>
              <span className="text-xs text-zinc-400">Ready to Work</span>
              <span className="text-[10px] text-zinc-600">Start your session</span>
            </>
          )}
        </div>

        <div className="absolute right-2 top-0 h-full flex items-center gap-1">
          {onOpenParkingLot && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpenParkingLot()
              }}
              className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-zinc-300 text-xs transition-colors"
              title="Parking Lot"
            >
              ☰
            </button>
          )}

          {mode === "not-calibrated" && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStartCalibration()
              }}
              className="w-8 h-8 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs transition-all animate-pulse"
              title="Calibrate Today"
            >
              ⚡
            </button>
          )}

          {(mode === "idle" || mode === "estimated") && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStartSession()
              }}
              className="w-8 h-8 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs transition-colors"
              title="Start Session"
            >
              ▶
            </button>
          )}

          {/* Pause button - pauses session AND opens reset ritual */}
          {mode === "session" && onPauseSession && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPauseSession()
                // Also open reset ritual panel
                if (onReset) onReset()
              }}
              className="w-8 h-8 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs transition-colors"
              title="Pause & Reset"
            >
              ⏸
            </button>
          )}

          {/* Resume button when paused */}
          {mode === "paused" && onResumeSession && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onResumeSession()
              }}
              className="w-8 h-8 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs transition-colors"
              title="Resume Session"
            >
              ▶
            </button>
          )}

          {(mode === "session" || mode === "paused") && onStopSession && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStopSession()
              }}
              className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 flex items-center justify-center text-red-400 text-xs transition-colors"
              title="Stop Session"
            >
              ⏹
            </button>
          )}
        </div>

        {!isPaused && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-1000"
            style={{
              boxShadow: sessionMode
                ? `inset 0 0 20px ${modeStyles.glow}, inset 0 0 40px ${modeStyles.glow}`
                : `inset 0 0 20px ${bandwidthColor}15, inset 0 0 40px ${bandwidthColor}08`,
              opacity: bandwidthValue / 100,
            }}
          />
        )}
      </div>

    </div>
  )
}
