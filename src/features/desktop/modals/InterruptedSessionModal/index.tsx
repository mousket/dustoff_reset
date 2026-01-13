
import { AlertTriangle } from "lucide-react"

interface InterruptedSessionModalProps {
  isOpen: boolean
  onContinue: () => void
  onDiscard: () => void
  duration?: number
  startTime?: number
}

export function InterruptedSessionModal({
  isOpen,
  onContinue,
  onDiscard,
  duration,
  startTime,
}: InterruptedSessionModalProps) {
  if (!isOpen) return null

  const elapsedMinutes = startTime ? Math.floor((Date.now() - startTime) / 60000) : null
  const durationText = duration ? `${duration} minute${duration !== 1 ? "s" : ""}` : null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-2xl bg-[#0a0f0d]/95 backdrop-blur-xl border border-amber-500/30 shadow-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-white">Session Interrupted</h3>
            <p className="text-sm text-zinc-400 mt-1">
              It looks like your previous session was interrupted. Would you like to continue where you left off?
            </p>
            {durationText && (
              <p className="text-xs text-emerald-400 mt-2">
                Planned: {durationText}
                {elapsedMinutes !== null && ` • Elapsed: ${elapsedMinutes} min`}
              </p>
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
