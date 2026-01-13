
import { useState, useEffect } from "react"
import type { ResetModalProps, RitualType, RitualOption } from "./types"

export function ResetModal({ isOpen, onClose, onSelectRitual, sessionMode = "Zen" }: ResetModalProps) {
  const [activeRitual, setActiveRitual] = useState<RitualType | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)

  const ritualOptions: RitualOption[] = [
    {
      id: "breath",
      label: "Breath Reset",
      duration: 120,
      description: "Ground yourself with breathing",
    },
    {
      id: "walk",
      label: "Walk Reset",
      duration: 300,
      description: "Take a short walk",
    },
    {
      id: "dump",
      label: "Dump Reset",
      duration: 180,
      description: "Write down your thoughts",
    },
  ]

  // Countdown timer for active ritual
  useEffect(() => {
    if (activeRitual && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Ritual complete
            setActiveRitual(null)
            onClose()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [activeRitual, timeRemaining, onClose])

  const handleSelectRitual = (ritual: RitualOption) => {
    // Start ritual countdown
    setActiveRitual(ritual.id)
    setTimeRemaining(ritual.duration)
    onSelectRitual(ritual.id)
  }

  const handleSkipRitual = () => {
    setActiveRitual(null)
    setTimeRemaining(0)
    onClose()
  }

  if (!isOpen) return null

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={handleSkipRitual} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="pointer-events-auto w-[520px] rounded-2xl bg-[#0a0f0d]/95 backdrop-blur-xl border border-zinc-700 shadow-2xl p-8">
          {activeRitual ? (
            // Ritual in progress view
            <div className="space-y-6 text-center">
              <div className="text-6xl mb-4">{ritualOptions.find((r) => r.id === activeRitual)?.icon}</div>

              <h2 className="text-2xl font-bold text-white">
                {ritualOptions.find((r) => r.id === activeRitual)?.label}
              </h2>

              <p className="text-sm text-zinc-400">{ritualOptions.find((r) => r.id === activeRitual)?.description}</p>

              {/* Circular countdown timer */}
              <div className="relative w-48 h-48 mx-auto my-8">
                <svg className="transform -rotate-90 w-48 h-48">
                  {/* Background circle */}
                  <circle cx="96" cy="96" r="88" stroke="#27272a" strokeWidth="8" fill="none" />
                  {/* Progress circle */}
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="#10b981"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - timeRemaining / ritualOptions.find((r) => r.id === activeRitual)!.duration)}`}
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>

                {/* Timer text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-5xl font-bold text-emerald-400">{formatTime(timeRemaining)}</div>
                </div>
              </div>

              <button
                onClick={handleSkipRitual}
                className="w-full px-6 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-medium transition-colors"
              >
                Skip & Resume
              </button>
            </div>
          ) : (
            // Ritual selection view matching onboarding design
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Choose Your Reset</h2>
                <p className="text-sm text-zinc-400">Take a moment to recharge and return focused</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {ritualOptions.map((ritual) => (
                  <button
                    key={ritual.id}
                    onClick={() => handleSelectRitual(ritual)}
                    className="p-4 rounded-lg border border-zinc-700 bg-[#0a0f0d]/80 hover:bg-zinc-800/50 hover:border-emerald-500 transition-all group text-center"
                  >
                    <div className="text-base font-medium text-white group-hover:text-emerald-400 transition-colors mb-1">
                      {ritual.label}
                    </div>
                    <div className="text-xs text-zinc-500 mb-2">{ritual.description}</div>
                    <div className="text-xs text-emerald-400 font-mono">{Math.floor(ritual.duration / 60)} min</div>
                  </button>
                ))}
              </div>

              <button
                onClick={onClose}
                className="w-full px-6 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
