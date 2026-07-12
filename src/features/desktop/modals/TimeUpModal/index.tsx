import { useState } from "react"
import { Clock, CheckCircle2, Hourglass, StopCircle } from "lucide-react"

export type TimeUpChoice = "finished" | "more_time" | "stopping"
export type ExtensionMinutes = 5 | 10 | 15

interface TimeUpModalProps {
  isOpen: boolean
  intention?: string | null
  /** Next calendar event, if known — warns when an extension collides */
  nextEventTitle?: string | null
  nextEventMinutes?: number | null
  onFinished: () => void
  onExtend: (minutes: ExtensionMinutes) => void
  onStop: () => void
}

const EXTENSION_OPTIONS: ExtensionMinutes[] = [5, 10, 15]

export function TimeUpModal({
  isOpen,
  intention,
  nextEventTitle,
  nextEventMinutes,
  onFinished,
  onExtend,
  onStop,
}: TimeUpModalProps) {
  const [selectedChoice, setSelectedChoice] = useState<TimeUpChoice | null>(null)
  const [selectedExtension, setSelectedExtension] = useState<ExtensionMinutes>(10)

  if (!isOpen) return null

  const handleContinue = () => {
    if (selectedChoice === "finished") onFinished()
    else if (selectedChoice === "more_time") onExtend(selectedExtension)
    else if (selectedChoice === "stopping") onStop()
  }

  return (
    <div className="w-[525px] rounded-3xl bg-[#0a0f0d]/90 backdrop-blur-xl border border-emerald-500/30 shadow-2xl flex flex-col max-h-[85vh]">
      {/* Header */}
      <div className="p-6 pb-4 flex-shrink-0">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Clock className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-light text-emerald-400">Time's up</h2>
            <p className="text-sm text-zinc-400 mt-1">
              {intention ? `"${intention}" — where did it land?` : "Where did this session land?"}
            </p>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="flex-1 overflow-y-auto px-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        <div className="space-y-4">
          {/* Finished */}
          <div
            onClick={() => setSelectedChoice("finished")}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedChoice === "finished"
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-zinc-700 bg-[#0a0f0d]/80 hover:border-emerald-500"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedChoice === "finished" ? "border-emerald-500" : "border-zinc-500"
                }`}
              >
                {selectedChoice === "finished" && <div className="w-3 h-3 rounded-full bg-emerald-500" />}
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-white font-light">I finished what I intended</span>
            </div>
          </div>

          {/* Need more time */}
          <div
            onClick={() => setSelectedChoice("more_time")}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedChoice === "more_time"
                ? "border-blue-500 bg-blue-500/10"
                : "border-zinc-700 bg-[#0a0f0d]/80 hover:border-blue-500"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedChoice === "more_time" ? "border-blue-500" : "border-zinc-500"
                }`}
              >
                {selectedChoice === "more_time" && <div className="w-3 h-3 rounded-full bg-blue-500" />}
              </div>
              <Hourglass className="w-4 h-4 text-blue-400" />
              <span className="text-white font-light">I need more time</span>
            </div>

            {selectedChoice === "more_time" && (
              <div className="mt-3 ml-8 animate-in fade-in duration-200">
                <div className="flex gap-2">
                  {EXTENSION_OPTIONS.map((minutes) => (
                    <button
                      key={minutes}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedExtension(minutes)
                      }}
                      className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                        selectedExtension === minutes
                          ? "border-blue-500 bg-blue-500/20 text-blue-300"
                          : "border-zinc-700 text-zinc-400 hover:border-blue-500/50"
                      }`}
                    >
                      +{minutes} min
                    </button>
                  ))}
                </div>
                {nextEventTitle != null &&
                  nextEventMinutes != null &&
                  selectedExtension >= nextEventMinutes && (
                    <p className="mt-2 text-xs text-amber-400">
                      +{selectedExtension} min runs into "{nextEventTitle}" (in {nextEventMinutes} min)
                    </p>
                  )}
              </div>
            )}
          </div>

          {/* Stopping without finishing */}
          <div
            onClick={() => setSelectedChoice("stopping")}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedChoice === "stopping"
                ? "border-amber-500 bg-amber-500/10"
                : "border-zinc-700 bg-[#0a0f0d]/80 hover:border-amber-500"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedChoice === "stopping" ? "border-amber-500" : "border-zinc-500"
                }`}
              >
                {selectedChoice === "stopping" && <div className="w-3 h-3 rounded-full bg-amber-500" />}
              </div>
              <StopCircle className="w-4 h-4 text-amber-400" />
              <span className="text-white font-light">Stopping here — didn't finish</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 pt-4 flex-shrink-0">
        <button
          onClick={handleContinue}
          disabled={!selectedChoice}
          className={`w-full py-3 rounded-lg font-light transition-all ${
            selectedChoice
              ? "bg-emerald-500 text-black hover:bg-emerald-400"
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
