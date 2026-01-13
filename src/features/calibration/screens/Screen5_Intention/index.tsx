
import { useState } from "react"
import type { Screen5Props, Screen5Data } from "./types"
import { validatePrimaryIntention, filterEmptyStrings, getReflectionPrompt } from "./logic"
import { mockScreen5Data } from "./mockData"

export default function Screen5_Intention({ onContinue, onBack, demo = false, initialData }: Screen5Props) {
  const [primaryIntention, setPrimaryIntention] = useState(
    demo ? mockScreen5Data.primaryIntention : initialData?.primaryIntention || "",
  )
  const [secondaryIntentions, setSecondaryIntentions] = useState<string[]>(
    demo ? mockScreen5Data.secondaryIntentions : initialData?.secondaryIntentions || ["", "", ""],
  )
  const [specificTasks, setSpecificTasks] = useState<string[]>(
    demo ? mockScreen5Data.specificTasks : initialData?.specificTasks || ["", "", ""],
  )
  const [showSecondary, setShowSecondary] = useState(false)
  const [showTasks, setShowTasks] = useState(false)

  const canContinue = validatePrimaryIntention(primaryIntention)

  const handleContinue = () => {
    if (!canContinue) return
    onContinue({
      primaryIntention,
      secondaryIntentions: filterEmptyStrings(secondaryIntentions),
      specificTasks: filterEmptyStrings(specificTasks),
    })
  }

  const updateSecondary = (index: number, value: string) => {
    const updated = [...secondaryIntentions]
    updated[index] = value
    setSecondaryIntentions(updated)
  }

  const updateTask = (index: number, value: string) => {
    const updated = [...specificTasks]
    updated[index] = value
    setSpecificTasks(updated)
  }

  return (
    <div className="fixed inset-0 bg-[#0a0f0d] flex items-center justify-center p-4">
      <div className="w-full max-w-3xl h-[90vh] flex flex-col">
        <div className="bg-[#141c19] border-2 border-[#10B981] rounded-2xl shadow-2xl shadow-emerald-500/10 h-full flex flex-col">
          {/* Header */}
          <div className="text-center p-12 pb-6 space-y-4 animate-fade-in flex-shrink-0">
            <div className="text-sm text-[#10B981] font-mono uppercase tracking-wider">Step 5 of 6</div>
            <h1 className="font-mono text-4xl font-bold text-white">Set Your Intention</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Every practice begins with intention. What are you here to move forward today?
            </p>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-12 pb-6 scrollbar-thin scrollbar-thumb-[#2f4a42] scrollbar-track-transparent">
            <div className="space-y-10">
              {/* Primary Intention - Always Visible */}
              <div className="space-y-4 animate-fade-in" style={{ animationDelay: "300ms" }}>
                <div>
                  <label className="block text-sm text-[#10B981] font-mono font-semibold mb-2 uppercase tracking-wide">
                    Primary Win <span className="text-white">*</span>
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">
                    If you accomplish this, it will be your biggest win. What is the theme of what you want to do or be
                    today?
                  </p>
                  <textarea
                    value={primaryIntention}
                    onChange={(e) => setPrimaryIntention(e.target.value)}
                    placeholder="e.g., Make meaningful progress on the product launch…"
                    className="w-full px-4 py-4 bg-[#0a0f0d] border-2 border-[#2f4a42] rounded-md text-white font-sans leading-relaxed focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] outline-none transition-colors resize-none"
                    rows={3}
                    aria-label="Primary intention for today - required"
                  />
                </div>
              </div>

              <div className="space-y-4 animate-fade-in" style={{ animationDelay: "500ms" }}>
                <button
                  onClick={() => setShowSecondary(!showSecondary)}
                  className="w-full flex items-center justify-between p-4 bg-[#0a0f0d] border border-[#2f4a42] rounded-md hover:border-[#10B981]/50 transition-colors"
                >
                  <div className="text-left">
                    <div className="text-sm text-muted-foreground font-mono font-semibold uppercase tracking-wide">
                      Secondary Wins <span className="text-xs normal-case">(Optional)</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Other wins that would make today successful</p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-[#10B981] transition-transform ${showSecondary ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showSecondary && (
                  <div className="space-y-3 animate-fade-in">
                    {[0, 1, 2].map((index) => (
                      <input
                        key={index}
                        type="text"
                        value={secondaryIntentions[index]}
                        onChange={(e) => updateSecondary(index, e.target.value)}
                        placeholder={`Optional - Another win for today…`}
                        className="w-full px-4 py-3 bg-[#0a0f0d] border border-[#2f4a42] rounded-md text-white font-sans focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] outline-none transition-colors"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4 animate-fade-in" style={{ animationDelay: "700ms" }}>
                <button
                  onClick={() => setShowTasks(!showTasks)}
                  className="w-full flex items-center justify-between p-4 bg-[#0a0f0d] border border-[#2f4a42] rounded-md hover:border-[#10B981]/50 transition-colors"
                >
                  <div className="text-left">
                    <div className="text-sm text-muted-foreground font-mono font-semibold uppercase tracking-wide">
                      Specific Tasks <span className="text-xs normal-case">(Optional)</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Concrete tasks you want to work on today</p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-[#10B981] transition-transform ${showTasks ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showTasks && (
                  <div className="space-y-3 animate-fade-in">
                    {[0, 1, 2].map((index) => (
                      <input
                        key={index}
                        type="text"
                        value={specificTasks[index]}
                        onChange={(e) => updateTask(index, e.target.value)}
                        placeholder={`Optional - Task to tackle…`}
                        className="w-full px-4 py-3 bg-[#0a0f0d] border border-[#2f4a42] rounded-md text-white font-sans focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] outline-none transition-colors"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="text-center text-muted-foreground italic pt-6 border-t border-[#2f4a42]">
                {getReflectionPrompt()}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex justify-between items-center p-12 pt-6 border-t border-[#2f4a42] animate-fade-in flex-shrink-0"
            style={{ animationDelay: "900ms" }}
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
                canContinue ? "opacity-100 hover:opacity-90" : "opacity-50 cursor-not-allowed"
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

export type { Screen5Props, Screen5Data }
