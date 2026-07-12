// src/components/modals/TimeUpModalAdapter.tsx
// Adapter for TimeUpModal - shows when the session timer completes naturally.
// Unlike EndSessionModal (manual stop), this flow must offer "I need more time":
// running out of time is not the same as finishing, and the app should never
// record an unfinished session as mission_complete by default.

import { TimeUpModal, type ExtensionMinutes } from '@/features/desktop/modals/TimeUpModal'

interface TimeUpModalAdapterProps {
  isOpen: boolean
  intention?: string | null
  onFinished: () => void
  onExtend: (minutes: ExtensionMinutes) => void
  onStop: () => void
}

/**
 * TimeUpModalAdapter
 *
 * User Flow:
 * 1. Session timer reaches planned duration → session pauses, modal appears
 * 2. Three options:
 *    - "I finished what I intended" → mission_complete (post-session flow)
 *    - "I need more time" (+5/+10/+15) → timer extends, session resumes
 *    - "Stopping here — didn't finish" → stopping_early / "Ran out of time"
 */
export function TimeUpModalAdapter({ isOpen, intention, onFinished, onExtend, onStop }: TimeUpModalAdapterProps) {
  return (
    <div className="mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <TimeUpModal
        isOpen={isOpen}
        intention={intention}
        onFinished={onFinished}
        onExtend={onExtend}
        onStop={onStop}
      />
    </div>
  )
}

export type { TimeUpModalAdapterProps }
