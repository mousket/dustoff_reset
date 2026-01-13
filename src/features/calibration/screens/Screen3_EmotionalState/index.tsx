
import { useState } from "react"
import type { Screen3Props, Screen3Data } from "./types"
import { emotionCards, loadLevels, validateScreen3Data, getReflectionPrompt } from "./logic"
import { mockScreen3Data } from "./mockData"

export default function Screen3_EmotionalState({ onContinue, onBack, demo = false, initialData }: Screen3Props) {
  const [emotionalState, setEmotionalState] = useState<Screen3Data["emotionalState"] | "">(
    demo ? mockScreen3Data.emotionalState : initialData?.emotionalState || "",
  )
  const [cognitiveLoad, setCognitiveLoad] = useState<Screen3Data["cognitiveLoad"] | 0>(
    demo ? mockScreen3Data.cognitiveLoad : initialData?.cognitiveLoad || 0,
  )

  const canContinue = validateScreen3Data(emotionalState, cognitiveLoad)

  const handleContinue = () => {
    if (!canContinue || !emotionalState || !cognitiveLoad) return
    onContinue({ emotionalState, cognitiveLoad })
  }

  return (
    <div className="fixed inset-0 bg-[#0a0f0d] flex items-center justify-center p-4">
      <div className="w-full max-w-3xl h-[90vh] flex flex-col">
        <div className="bg-[#141c19] border-2 border-[#10B981] rounded-2xl shadow-2xl shadow-emerald-500/10 h-full flex flex-col">
          {/* Header */}
          <div className="text-center p-12 pb-6 space-y-4 animate-fade-in flex-shrink-0">
            <div className="text-sm text-[#10B981] font-mono uppercase tracking-wider">Step 3 of 6</div>
            <h1 className="font-mono text-4xl font-bold text-white">How Do You Feel?</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              How are you arriving emotionally today?
            </p>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-12 pb-6 scrollbar-thin scrollbar-thumb-[#2f4a42] scrollbar-track-transparent">
            <div className="space-y-10">
              <div className="space-y-6">
                <h3 className="font-mono text-lg text-[#10B981] font-semibold">Emotional State</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {emotionCards.map((emotion, index) => (
                    <button
                      key={emotion.id}
                      onClick={() => setEmotionalState(emotion.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all animate-fade-in ${
                        emotionalState === emotion.id
                          ? "border-[#10B981] bg-[#10B981]/10"
                          : "border-[#2f4a42] bg-[#0a0f0d] hover:border-[#10B981]/50"
                      }`}
                      style={{ animationDelay: `${300 + index * 100}ms` }}
                    >
                      <div className="font-mono font-semibold text-white mb-1">{emotion.label}</div>
                      <div className="text-sm text-muted-foreground">{emotion.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6 animate-fade-in" style={{ animationDelay: "800ms" }}>
                <h3 className="font-mono text-lg text-[#10B981] font-semibold">Cognitive Load</h3>
                <p className="text-muted-foreground">How heavy is your mind right now?</p>

                <div className="grid grid-cols-5 gap-3">
                  {loadLevels.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setCognitiveLoad(level.value)}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        cognitiveLoad === level.value
                          ? "border-[#10B981] bg-[#10B981]/10"
                          : "border-[#2f4a42] bg-[#0a0f0d] hover:border-[#10B981]/50"
                      }`}
                    >
                      <div className="font-mono font-bold text-2xl text-white mb-1">{level.value}</div>
                      <div className="text-xs text-muted-foreground">{level.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-center text-muted-foreground italic pt-6 border-t border-[#2f4a42]">
                {getReflectionPrompt()}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex justify-between items-center p-12 pt-6 border-t border-[#2f4a42] animate-fade-in flex-shrink-0"
            style={{ animationDelay: "1100ms" }}
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

export type { Screen3Props, Screen3Data }
