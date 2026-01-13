
import { useState } from "react"
import type { Screen4Props, Screen4Data } from "./types"
import {
  distractionOptions,
  distractionLabels,
  toggleDistraction as toggleDistractionUtil,
  getReflectionPrompt,
} from "./logic"
import { mockScreen4Data } from "./mockData"

export default function Screen4_DistractionsHurdles({ onContinue, onBack, demo = false, initialData }: Screen4Props) {
  const [distractions, setDistractions] = useState<string[]>(
    demo ? mockScreen4Data.distractions : initialData?.distractions || [],
  )
  const [distractionNotes, setDistractionNotes] = useState(
    demo ? mockScreen4Data.distractionNotes : initialData?.distractionNotes || "",
  )
  const [obstacles, setObstacles] = useState(demo ? mockScreen4Data.obstacles : initialData?.obstacles || "")

  const toggleDistraction = (distraction: string) => {
    setDistractions((prev) => toggleDistractionUtil(prev, distraction))
  }

  const handleContinue = () => {
    onContinue({ distractions, distractionNotes, obstacles })
  }

  return (
    <div className="fixed inset-0 bg-[#0a0f0d] flex items-center justify-center p-4">
      <div className="w-full max-w-3xl h-[90vh] flex flex-col">
        <div className="bg-[#141c19] border-2 border-[#10B981] rounded-2xl shadow-2xl shadow-emerald-500/10 h-full flex flex-col">
          {/* Header */}
          <div className="text-center p-12 pb-6 space-y-4 animate-fade-in flex-shrink-0">
            <div className="text-sm text-[#10B981] font-mono uppercase tracking-wider">Step 4 of 6</div>
            <h1 className="font-mono text-4xl font-bold text-white">Distractions and Hurdles</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              What might pull your attention or create resistance today?
            </p>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-12 pb-6 scrollbar-thin scrollbar-thumb-[#2f4a42] scrollbar-track-transparent">
            <div className="space-y-10">
              {/* Expected Distractions */}
              <div className="space-y-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
                <h3 className="font-mono text-lg text-[#10B981] font-semibold">Expected Distractions</h3>
                <p className="text-muted-foreground">What distractions do you expect today?</p>

                <div className="grid grid-cols-3 gap-2">
                  {distractionOptions.map((distraction) => (
                    <button
                      key={distraction}
                      onClick={() => toggleDistraction(distraction)}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        distractions.includes(distraction)
                          ? "border-[#10B981] bg-[#10B981]/10"
                          : "border-[#2f4a42] bg-[#0a0f0d] hover:border-[#10B981]/50"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                            distractions.includes(distraction) ? "border-[#10B981] bg-[#10B981]" : "border-[#2f4a42]"
                          }`}
                        >
                          {distractions.includes(distraction) && (
                            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" />
                            </svg>
                          )}
                        </div>
                        <span className="text-muted-foreground font-mono text-xs">
                          {distractionLabels[distraction as keyof typeof distractionLabels]}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Anything else you expect to arise…</label>
                  <textarea
                    value={distractionNotes}
                    onChange={(e) => setDistractionNotes(e.target.value)}
                    placeholder="e.g., I have a difficult conversation scheduled at 2pm…"
                    className="w-full px-4 py-3 bg-[#0a0f0d] border border-[#2f4a42] rounded-md text-white font-mono text-sm focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] outline-none transition-colors resize-none"
                    rows={3}
                  />
                </div>
              </div>

              {/* Obstacles & Resistance */}
              <div className="space-y-6 animate-fade-in" style={{ animationDelay: "600ms" }}>
                <h3 className="font-mono text-lg text-[#10B981] font-semibold">Obstacles & Resistance</h3>
                <p className="text-muted-foreground">
                  What difficulties, obstacles, or resistance might you experience or face today?
                </p>

                <textarea
                  value={obstacles}
                  onChange={(e) => setObstacles(e.target.value)}
                  placeholder="e.g., I'm feeling resistance to starting a difficult project, or I have a deadline that feels overwhelming…"
                  className="w-full px-4 py-3 bg-[#0a0f0d] border border-[#2f4a42] rounded-md text-white font-mono text-sm focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] outline-none transition-colors resize-none"
                  rows={4}
                />
              </div>

              <div className="text-center text-muted-foreground italic pt-6 border-t border-[#2f4a42]">
                {getReflectionPrompt()}
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
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
              className="px-10 py-3 bg-gradient-to-r from-[#10B981] to-[#8b2d5c] text-white font-mono text-lg rounded-md transition-all shadow-lg hover:opacity-90"
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export type { Screen4Props, Screen4Data }
