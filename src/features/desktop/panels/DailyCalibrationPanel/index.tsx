
import { useState } from "react"
import { X } from "lucide-react"

interface DailyCalibrationPanelProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: CalibrationData) => void
}

interface CalibrationData {
  sleepHours: number
  sleepQuality: number
  emotionalResidue: number
  emotionalState: string
  distractions: string[]
}

export function DailyCalibrationPanel({ isOpen, onClose, onComplete }: DailyCalibrationPanelProps) {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<CalibrationData>({
    sleepHours: 7,
    sleepQuality: 7,
    emotionalResidue: 5,
    emotionalState: "",
    distractions: [],
  })

  if (!isOpen) return null

  const handleComplete = () => {
    onComplete(data)
  }

  return (
    <div
      className="rounded-3xl bg-[#0a0f0d]/55 backdrop-blur-xl border border-emerald-500/30 shadow-2xl transition-all duration-300"
      style={{ width: "380px", maxHeight: "calc(100vh - 120px)" }}
    >
      {/* Header - Increased font sizes for readability */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-emerald-500/30">
        <div>
          <h3 className="text-lg font-semibold text-emerald-400">Daily Calibration</h3>
          <p className="text-xs text-zinc-400">Step {step} of 4</p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 flex items-center justify-center text-zinc-400 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Content - Increased all font sizes */}
      <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(100vh-280px)]">
        {step === 1 && (
          <div className="space-y-3">
            <div>
              <label className="text-sm text-zinc-200 mb-1.5 block font-medium">How many hours did you sleep?</label>
              <input
                type="range"
                min="3"
                max="12"
                value={data.sleepHours}
                onChange={(e) => setData({ ...data, sleepHours: Number.parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="text-center text-2xl font-bold text-emerald-400 mt-1.5">{data.sleepHours} hours</div>
            </div>

            <div>
              <label className="text-sm text-zinc-200 mb-1.5 block font-medium">Sleep quality (1-10)</label>
              <input
                type="range"
                min="1"
                max="10"
                value={data.sleepQuality}
                onChange={(e) => setData({ ...data, sleepQuality: Number.parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="text-center text-2xl font-bold text-emerald-400 mt-1.5">{data.sleepQuality}/10</div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div>
              <label className="text-sm text-zinc-200 mb-1.5 block font-medium">
                Emotional Residue (1-10)
                <span className="block text-xs text-zinc-400 mt-0.5 font-normal">
                  How much emotional baggage are you carrying today?
                </span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={data.emotionalResidue}
                onChange={(e) => setData({ ...data, emotionalResidue: Number.parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="text-center text-2xl font-bold text-amber-400 mt-1.5">{data.emotionalResidue}/10</div>
              <p className="text-xs text-zinc-400 text-center mt-1.5">
                {data.emotionalResidue <= 3 && "Light and clear"}
                {data.emotionalResidue > 3 && data.emotionalResidue <= 6 && "Some weight"}
                {data.emotionalResidue > 6 && "Heavy load"}
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <label className="text-sm text-zinc-200 mb-1.5 block font-medium">How are you feeling today?</label>
            <div className="grid grid-cols-2 gap-3">
              {["Energized", "Calm", "Anxious", "Tired", "Focused", "Scattered"].map((state) => (
                <button
                  key={state}
                  onClick={() => setData({ ...data, emotionalState: state })}
                  className={`px-4 py-3 rounded-lg border transition-all text-sm font-medium ${
                    data.emotionalState === state
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : "bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:border-zinc-600"
                  }`}
                >
                  {state}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <label className="text-sm text-zinc-200 mb-1.5 block font-medium">What might distract you today?</label>
            <div className="grid grid-cols-2 gap-3">
              {["Email", "Slack", "Social Media", "Meetings", "Phone Calls", "Other Tasks"].map((distraction) => (
                <button
                  key={distraction}
                  onClick={() => {
                    const current = data.distractions
                    const updated = current.includes(distraction)
                      ? current.filter((d) => d !== distraction)
                      : [...current, distraction]
                    setData({ ...data, distractions: updated })
                  }}
                  className={`px-4 py-3 rounded-lg border transition-all text-sm font-medium ${
                    data.distractions.includes(distraction)
                      ? "bg-orange-500/20 border-orange-500 text-orange-400"
                      : "bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:border-zinc-600"
                  }`}
                >
                  {distraction}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-emerald-500/30">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="px-3 py-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 text-sm transition-colors"
          >
            Back
          </button>
        )}
        {step < 4 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="px-4 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-sm transition-colors ml-auto"
          >
            Next
          </button>
        ) : (
          <button
            onClick={() => {
              handleComplete()
              onClose()
            }}
            className="px-4 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-sm transition-colors ml-auto"
          >
            Complete Calibration
          </button>
        )}
      </div>
    </div>
  )
}
