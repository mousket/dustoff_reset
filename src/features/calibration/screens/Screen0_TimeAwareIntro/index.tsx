
import { useState, useEffect } from "react"
import type { Screen0Props } from "./types"
import { getTimeAwareGreeting, getCurrentHour } from "./logic"
import { mockTimeAwareData } from "./mockData"
import RitualGlyph from "../../components/RitualGlyph"

export function Screen0_TimeAwareIntro({ onContinue, demo = false }: Screen0Props) {
  const [greeting, setGreeting] = useState(demo ? mockTimeAwareData.greeting : "Good morning")

  useEffect(() => {
    if (demo) {
      setGreeting(mockTimeAwareData.greeting)
      return
    }

    const hour = getCurrentHour()
    setGreeting(getTimeAwareGreeting(hour))
  }, [demo])

  return (
    <div className="fixed inset-0 bg-[#0a0f0d] flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl my-8">
        <div className="bg-[#141c19] border-2 border-[#10B981] rounded-2xl p-12 shadow-2xl shadow-emerald-500/10">
          <div className="text-center mb-12 space-y-4 animate-fade-in">
            <h1 className="font-mono text-4xl font-bold text-white">Calibration Ceremony</h1>
            <p className="text-xl text-muted-foreground">{greeting}. Let's begin.</p>
          </div>

          <div className="space-y-8 mb-12 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <RitualGlyph />

            <div className="text-muted-foreground space-y-4 text-center max-w-xl mx-auto leading-relaxed">
              <p>
                Every coach needs to know how their athlete is doing. The Calibration Ceremony is our way to understand
                your state at the beginning of the day.
              </p>
              <p>
                It helps us adjust what we consider your best for today, make better recommendations, and know how to
                help you increase your bandwidth.
              </p>
              <p className="text-[#10B981] font-normal pt-4">This only takes 2 minutes. Let's begin...</p>
            </div>
          </div>

          <div className="flex justify-center animate-fade-in" style={{ animationDelay: "600ms" }}>
            <button
              onClick={onContinue}
              className="px-10 py-3 bg-gradient-to-r from-[#10B981] to-[#8b2d5c] hover:opacity-90 text-white font-mono rounded-md transition-all shadow-lg"
            >
              Begin Calibration
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
