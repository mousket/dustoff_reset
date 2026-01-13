
import { Clock } from "lucide-react"

interface OvertimeNudgeToastProps {
  isOpen: boolean
  minutesOver: number
  onFinishSession: () => void
  onExtend: () => void
  onDismiss: () => void
}

export function OvertimeNudgeToast({
  isOpen,
  minutesOver,
  onFinishSession,
  onExtend,
  onDismiss,
}: OvertimeNudgeToastProps) {
  if (!isOpen) return null

  return (
    <div className="fixed top-6 right-6 z-[150] w-96 animate-in slide-in-from-top-2 duration-300">
      <div className="rounded-xl bg-[#0a0f0d]/95 backdrop-blur-xl border border-amber-500/30 shadow-2xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-white">Session Overtime</h4>
            <p className="text-xs text-zinc-400 mt-1">
              You're {minutesOver} minutes over your planned duration. Time to wrap up or extend?
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onFinishSession}
            className="flex-1 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors text-xs font-medium uppercase tracking-wider"
          >
            End Session
          </button>
          <button
            onClick={onExtend}
            className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-lg transition-colors text-xs font-medium"
          >
            +5 Minutes
          </button>
        </div>
      </div>
    </div>
  )
}
