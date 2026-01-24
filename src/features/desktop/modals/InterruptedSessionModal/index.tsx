
import { AlertTriangle, Clock, Zap, Shield, Sparkles } from "lucide-react"

interface InterruptedSessionModalProps {
  isOpen: boolean
  onContinue: () => void
  onDiscard: () => void
  duration?: number           // Planned duration in minutes
  elapsedSeconds?: number     // How long the session was running
  mode?: 'Zen' | 'Flow' | 'Legend'
  bandwidth?: number          // Bandwidth at time of interruption
  whitelistedAppsCount?: number
  whitelistedTabsCount?: number
}

export function InterruptedSessionModal({
  isOpen,
  onContinue,
  onDiscard,
  duration,
  elapsedSeconds,
  mode,
  bandwidth,
  whitelistedAppsCount,
  whitelistedTabsCount,
}: InterruptedSessionModalProps) {
  if (!isOpen) return null

  const elapsedMinutes = elapsedSeconds ? Math.floor(elapsedSeconds / 60) : 0
  const remainingMinutes = duration && elapsedSeconds 
    ? Math.max(0, duration - Math.floor(elapsedSeconds / 60))
    : duration || 0
  const durationText = duration ? `${duration} min` : null

  const getModeIcon = () => {
    switch (mode) {
      case 'Zen': return <Sparkles className="w-4 h-4" />
      case 'Flow': return <Zap className="w-4 h-4" />
      case 'Legend': return <Shield className="w-4 h-4" />
      default: return <Zap className="w-4 h-4" />
    }
  }

  const getModeColor = () => {
    switch (mode) {
      case 'Zen': return 'text-purple-400'
      case 'Flow': return 'text-blue-400'
      case 'Legend': return 'text-amber-400'
      default: return 'text-blue-400'
    }
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#0a0f0d]/95 backdrop-blur-xl border border-amber-500/30 shadow-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-white">Session Interrupted</h3>
            <p className="text-sm text-zinc-400 mt-1">
              Your session was interrupted. Continue where you left off?
            </p>
          </div>
        </div>

        {/* Session Info */}
        <div className="bg-zinc-900/50 rounded-lg p-4 space-y-3 border border-zinc-800">
          {/* Mode and Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={getModeColor()}>{getModeIcon()}</span>
              <span className={`text-sm font-medium ${getModeColor()}`}>
                {mode || 'Flow'} Mode
              </span>
            </div>
            {durationText && (
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-sm">{durationText} session</span>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Progress</span>
              <span className="text-emerald-400">
                {elapsedMinutes} min elapsed • {remainingMinutes} min remaining
              </span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                style={{ width: `${duration ? Math.min(100, (elapsedMinutes / duration) * 100) : 0}%` }}
              />
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex gap-4 text-xs pt-1">
            {bandwidth !== undefined && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-zinc-400">Bandwidth: </span>
                <span className="text-white font-medium">{Math.round(bandwidth)}%</span>
              </div>
            )}
            {(whitelistedAppsCount !== undefined && whitelistedAppsCount > 0) && (
              <div className="text-zinc-500">
                {whitelistedAppsCount} app{whitelistedAppsCount !== 1 ? 's' : ''} whitelisted
              </div>
            )}
            {(whitelistedTabsCount !== undefined && whitelistedTabsCount > 0) && (
              <div className="text-zinc-500">
                {whitelistedTabsCount} tab{whitelistedTabsCount !== 1 ? 's' : ''} whitelisted
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onDiscard}
            className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Discard
          </button>
          <button
            onClick={onContinue}
            className="flex-1 px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors text-sm font-medium"
          >
            Continue Session
          </button>
        </div>
      </div>
    </div>
  )
}
