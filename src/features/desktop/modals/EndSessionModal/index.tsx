
import { useState } from "react"
import { X } from "lucide-react"

interface EndSessionModalProps {
  isOpen: boolean
  onContinue: (reason: "completed" | "stopping_early" | "pulled_away", subReason?: string) => void
  onQuickExit: () => void
  onCancel: () => void
}

export function EndSessionModal({ isOpen, onContinue, onQuickExit, onCancel }: EndSessionModalProps) {
  const [selectedReason, setSelectedReason] = useState<"completed" | "stopping_early" | "pulled_away" | null>(null)
  const [selectedSubReason, setSelectedSubReason] = useState<string | null>(null)

  if (!isOpen) return null

  const subReasons = {
    stopping_early: ["Energy dropped", "New priority came in", "I mis-estimated this session"],
    pulled_away: ["Message / notification", "Person / meeting", "Random distraction"],
  }

  const handleContinue = () => {
    if (selectedReason) {
      onContinue(selectedReason, selectedSubReason || undefined)
    }
  }

  // Check if a sub-reason panel is open
  const hasSubReasonOpen = selectedReason === "stopping_early" || selectedReason === "pulled_away"

  return (
    <div className="w-[525px] rounded-3xl bg-[#0a0f0d]/90 backdrop-blur-xl border border-emerald-500/30 shadow-2xl flex flex-col max-h-[85vh]">
      {/* Header - Fixed */}
      <div className="p-6 pb-4 flex-shrink-0">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-light text-emerald-400">End Session</h2>
            <p className="text-sm text-zinc-400 mt-1">Take a moment to tell us what's happening.</p>
          </div>
          <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Options */}
      <div className="flex-1 overflow-y-auto px-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        <div className="space-y-4">
          <div
            onClick={() => {
              setSelectedReason("completed")
              setSelectedSubReason(null)
            }}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedReason === "completed"
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-zinc-700 bg-[#0a0f0d]/80 hover:border-emerald-500"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedReason === "completed" ? "border-emerald-500" : "border-zinc-500"
                }`}
              >
                {selectedReason === "completed" && <div className="w-3 h-3 rounded-full bg-emerald-500" />}
              </div>
              <span className="text-white font-light">I completed what I intended</span>
            </div>
          </div>

          <div
            onClick={() => {
              setSelectedReason("stopping_early")
              setSelectedSubReason(null)
            }}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedReason === "stopping_early"
                ? "border-amber-500 bg-amber-500/10"
                : "border-zinc-700 bg-[#0a0f0d]/80 hover:border-amber-500"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedReason === "stopping_early" ? "border-amber-500" : "border-zinc-500"
                }`}
              >
                {selectedReason === "stopping_early" && <div className="w-3 h-3 rounded-full bg-amber-500" />}
              </div>
              <span className="text-white font-light">I'm stopping early</span>
            </div>

            {selectedReason === "stopping_early" && (
              <div className="mt-3 ml-8 space-y-2">
                {subReasons.stopping_early.map((subReason) => (
                  <div
                    key={subReason}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedSubReason(subReason)
                    }}
                    className={`p-3 rounded-md text-sm cursor-pointer transition-colors font-light ${
                      selectedSubReason === subReason
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50"
                    }`}
                  >
                    {subReason}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            onClick={() => {
              setSelectedReason("pulled_away")
              setSelectedSubReason(null)
            }}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedReason === "pulled_away"
                ? "border-red-500 bg-red-500/10"
                : "border-zinc-700 bg-[#0a0f0d]/80 hover:border-red-500"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedReason === "pulled_away" ? "border-red-500" : "border-zinc-500"
                }`}
              >
                {selectedReason === "pulled_away" && <div className="w-3 h-3 rounded-full bg-red-500" />}
              </div>
              <span className="text-white font-light">I got pulled away</span>
            </div>

            {selectedReason === "pulled_away" && (
              <div className="mt-3 ml-8 space-y-2">
                {subReasons.pulled_away.map((subReason) => (
                  <div
                    key={subReason}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedSubReason(subReason)
                    }}
                    className={`p-3 rounded-md text-sm cursor-pointer transition-colors font-light ${
                      selectedSubReason === subReason
                        ? "bg-red-500/20 text-red-300"
                        : "bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50"
                    }`}
                  >
                    {subReason}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer - Fixed at bottom, always visible */}
      <div className="p-6 pt-4 flex-shrink-0 border-t border-zinc-800/50">
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-zinc-800 text-zinc-200 rounded-lg hover:bg-zinc-700 border border-zinc-700 transition-colors text-sm font-light"
          >
            Cancel
          </button>
          <button
            onClick={onQuickExit}
            className="px-6 py-3 bg-zinc-800 text-zinc-200 rounded-lg hover:bg-zinc-700 border border-zinc-700 transition-colors text-sm font-light"
          >
            Quick Exit
          </button>
          <button
            onClick={handleContinue}
            disabled={!selectedReason || (hasSubReasonOpen && !selectedSubReason)}
            className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-light"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
