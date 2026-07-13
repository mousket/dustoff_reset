// src/components/PreMeetingNudge.tsx
// "Arrive with capacity": when a calendar event is close, offer a short
// reset BEFORE it — anticipatory recovery instead of walking in drained.

import { CalendarClock, X } from 'lucide-react'

interface PreMeetingNudgeProps {
  eventTitle: string
  minutesUntil: number
  onReset: () => void
  onDismiss: () => void
}

export function PreMeetingNudge({ eventTitle, minutesUntil, onReset, onDismiss }: PreMeetingNudgeProps) {
  return (
    <div className="mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="rounded-2xl bg-[#0a0f0d]/90 backdrop-blur-xl border border-cyan-500/30 shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-cyan-500/20 rounded-lg flex-shrink-0">
            <CalendarClock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-light truncate" title={eventTitle}>
              {eventTitle} in {minutesUntil} min
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Arrive with capacity — take a short reset first?
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={onReset}
          className="mt-3 w-full py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 text-sm font-light transition-colors"
        >
          Reset before it
        </button>
      </div>
    </div>
  )
}
