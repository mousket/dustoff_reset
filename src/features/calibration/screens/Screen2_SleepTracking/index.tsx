
import { useState } from "react"
import type { Screen2Props, SleepData } from "./types"
import { validateSleepData, getDefaultSleepData } from "./logic"
import { mockSleepData } from "./mockData"
import { TimeInput } from "../../components/TimeInput"

export function Screen2_SleepTracking({ onContinue, onBack, demo = false }: Screen2Props) {
  const [data, setData] = useState<SleepData>(demo ? mockSleepData : getDefaultSleepData())

  const canContinue = validateSleepData(data)

  const handleContinue = () => {
    console.log("[v0] Saving sleep data:", data)
    onContinue()
  }

  return (
    <div className="fixed inset-0 bg-[#0a0f0d] flex items-center justify-center p-4">
      <div className="w-full max-w-3xl h-[90vh] flex flex-col">
        <div className="bg-[#141c19] border-2 border-[#10B981] rounded-2xl shadow-2xl shadow-emerald-500/10 h-full flex flex-col">
          <div className="text-center p-12 pb-6 space-y-4 animate-fade-in flex-shrink-0">
            <div className="text-sm text-[#10B981] font-mono uppercase tracking-wider">Step 2 of 6</div>
            <h1 className="font-mono text-4xl font-bold text-white">How Did You Sleep?</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Your sleep shapes how you enter your practice. Let's understand how you rested.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-12 pb-6 scrollbar-thin scrollbar-thumb-[#2f4a42] scrollbar-track-transparent">
            <div className="space-y-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TimeInput
                  label="When did you go to bed last night?"
                  value={data.bedtime}
                  onChange={(value) => setData({ ...data, bedtime: value })}
                  aria-label="Approximate bedtime"
                />

                <TimeInput
                  label="When did you wake up?"
                  value={data.wakeTime}
                  onChange={(value) => setData({ ...data, wakeTime: value })}
                  aria-label="Wake time"
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  When did you officially start your day?
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  This is when you actually got up — brushed your teeth, grabbed coffee, got dressed, or stepped into
                  the world.
                </p>
                <TimeInput
                  value={data.startOfDay}
                  onChange={(value) => setData({ ...data, startOfDay: value })}
                  aria-label="Official start of day"
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-3">Do you feel you got enough sleep?</label>
                <div className="flex gap-3">
                  {[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                    { value: "notSure", label: "Not sure" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setData({ ...data, sleepSufficient: option.value as any })}
                      className={`flex-1 px-6 py-2 rounded-md font-mono text-sm transition-all ${
                        data.sleepSufficient === option.value
                          ? "bg-[#10B981] text-white"
                          : "bg-[#0a0f0d] text-muted-foreground border border-[#2f4a42] hover:border-[#10B981]/50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-3">How rested do you feel?</label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={data.restfulness}
                    onChange={(e) => setData({ ...data, restfulness: Number(e.target.value) })}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #8b2d5c 0%, #10B981 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground font-mono">
                    <span>Not rested</span>
                    <span className="text-white font-semibold">{data.restfulness}</span>
                    <span>Fully rested</span>
                  </div>
                </div>
              </div>

              <div className="text-center text-muted-foreground italic pt-6 border-t border-[#2f4a42]">
                Your state is not a judgment. It's information.
              </div>
            </div>
          </div>

          <div
            className="flex justify-between items-center p-12 pt-6 border-t border-[#2f4a42] animate-fade-in flex-shrink-0"
            style={{ animationDelay: "600ms" }}
          >
            <button
              onClick={onBack}
              className="px-6 py-3 text-muted-foreground hover:text-white font-mono transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className={`px-10 py-3 bg-gradient-to-r from-[#10B981] to-[#8b2d5c] text-white font-mono rounded-md transition-all shadow-lg ${
                canContinue ? "opacity-100 hover:opacity-90" : "opacity-30 cursor-not-allowed"
              }`}
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
