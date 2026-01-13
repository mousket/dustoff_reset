
import type { Screen6Props } from "./types"
import { getCurrentDate, getCompletionMessage } from "./logic"
import RitualGlyph from "../../components/RitualGlyph"

export default function Screen6_Completion({ onContinue, demo = false }: Screen6Props) {
  const message = getCompletionMessage()

  const handleEnter = () => {
    if (!demo) {
      const today = getCurrentDate()
      // Storage will be handled by parent component
      console.log("[Calibration] Completed on:", today)
    }
    onContinue()
  }

  return (
    <div className="fixed inset-0 bg-[#0a0f0d] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-[#141c19] border-2 border-[#10B981] rounded-2xl p-12 shadow-2xl shadow-emerald-500/10">
          {/* Header */}
          <div className="text-center mb-12 space-y-4 animate-fade-in">
            <h1 className="font-mono text-5xl font-bold text-white">{message.title}</h1>
          </div>

          {/* Body */}
          <div className="space-y-8 mb-12 text-center">
            {/* Ritual Glyph with Glow */}
            <div className="flex justify-center animate-fade-in" style={{ animationDelay: "300ms" }}>
              <RitualGlyph size={120} />
            </div>

            {/* Completion Message */}
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: "600ms" }}>
              <p className="text-2xl text-white font-sans leading-relaxed whitespace-pre-line">{message.message}</p>
              <p className="text-lg text-[#10B981] italic font-mono">{message.subtitle}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-center animate-fade-in" style={{ animationDelay: "900ms" }}>
            <button
              onClick={handleEnter}
              className="px-12 py-4 bg-gradient-to-r from-[#10B981] to-[#8b2d5c] text-white font-mono text-lg rounded-md transition-all shadow-lg hover:opacity-90"
            >
              Enter DustOff Reset →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export type { Screen6Props }
