import type { HUDMode } from "./types"

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function getBandwidthColor(bandwidth: number | null): string {
  if (bandwidth === null) return "#71717a"
  if (bandwidth >= 85) return "#10B981" // Bright emerald - confident glow
  if (bandwidth >= 70) return "#34D399" // Soft emerald - stable
  if (bandwidth >= 60) return "#a3e635" // Yellow-green - slight caution
  if (bandwidth >= 50) return "#fbbf24" // Yellow - noticeable caution
  if (bandwidth >= 40) return "#fb923c" // Orange - depletion warning
  if (bandwidth >= 25) return "#ef4444" // Red - critical state
  return "#dc2626" // Dark red - danger zone
}

export function getStatusMessage(mode: HUDMode, isCalibratedToday: boolean): string {
  if (mode === "not-calibrated") return "Not Calibrated Today"
  if (mode === "idle") return "Ready to Work"
  if (mode === "session") return "In Session"
  if (mode === "paused") return "Session Paused"
  if (mode === "break") return "On Break"
  return "Unknown"
}

export function shouldShowCalibrationPrompt(mode: HUDMode, isCalibratedToday: boolean): boolean {
  return mode === "not-calibrated" || (!isCalibratedToday && mode === "idle")
}

export function getModeStyles(sessionMode: string | undefined) {
  if (!sessionMode) return { color: "#10B981", glow: "rgba(16, 185, 129, 0.3)", particle: "#34d399" }

  if (sessionMode === "Legend") {
    return {
      color: "#fbbf24", // Gold base color
      secondaryColor: "#dc2626", // Red secondary for gradient
      glow: "rgba(251, 191, 36, 0.4)", // Warm gold glow
      particle: "#fb923c", // Orange particles
      gradient: "from-yellow-500 via-orange-500 to-red-600", // Gold to red gradient
    }
  }

  if (sessionMode === "Flow") {
    return {
      color: "#38bdf8", // Light electric blue
      glow: "rgba(56, 189, 248, 0.4)", // Electric blue glow
      particle: "#7dd3fc", // Lighter blue particles
    }
  }

  // Zen mode (default)
  return {
    color: "#10B981",
    glow: "rgba(16, 185, 129, 0.3)",
    particle: "#34d399",
  }
}
