
import { useState, useEffect, useRef } from "react"
import { X } from "lucide-react"
import type { ReflectionObject, SessionRecord } from "@/lib/session-storage"

interface SessionReflectionPanelProps {
  session: SessionRecord | null
  onSave: (reflection: ReflectionObject) => void
  onSkip: () => void
}

export function SessionReflectionPanel({ session, onSave, onSkip }: SessionReflectionPanelProps) {
  const [whatWentWell, setWhatWentWell] = useState("")
  const [frictionNotes, setFrictionNotes] = useState("")
  const [closingEnergy, setClosingEnergy] = useState<number>(3)

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    q1: true,
    q2: false,
    q3: false,
  })

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (session && textareaRef.current) {
      console.log("[v0] Reflection panel mounted, focusing textarea")
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }, [session])

  if (!session) {
    console.log("[v0] SessionReflectionPanel: No session provided")
    return null
  }

  const flowEfficiency = session.flowEfficiency || 100
  const showFrictionQuestion = flowEfficiency < 60

  const energyEmojis = [
    { value: 1, emoji: "😫", label: "Drained" },
    { value: 2, emoji: "😐", label: "Meh" },
    { value: 3, emoji: "😊", label: "Okay" },
    { value: 4, emoji: "😄", label: "Energized" },
    { value: 5, emoji: "🔥", label: "Fire" },
  ]

  const handleSave = () => {
    const reflection: ReflectionObject = {
      sessionId: session.sessionId,
      whatWentWell,
      frictionNotes: showFrictionQuestion ? frictionNotes : null,
      closingEnergy,
      skipped: false,
      createdAt: new Date().toISOString(),
    }
    console.log("[v0] Saving reflection:", reflection)
    onSave(reflection)
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  console.log("[v0] Rendering SessionReflectionPanel")

  return (
    <div className="relative w-full max-w-6xl max-h-[80vh] overflow-y-auto rounded-2xl bg-[#0a0f0d]/55 backdrop-blur-xl border border-zinc-700 shadow-2xl p-8 space-y-6">
      <button onClick={onSkip} className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors z-10">
        <X className="w-5 h-5" />
      </button>

      <div>
        <h2 className="text-sm text-emerald-400 uppercase tracking-wider">DEBRIEF</h2>
        <p className="text-xs text-zinc-500 mt-1">Let's capture what happened while it's fresh.</p>
      </div>

      <div className="space-y-4">
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("q1")}
            className="w-full px-4 py-3 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors flex items-center justify-between"
          >
            <p className="text-xs text-zinc-400 uppercase tracking-wider">
              <span className="text-emerald-400 font-medium">Q1.</span> What went well this session?
            </p>
            <span className="text-zinc-500">{expandedSections.q1 ? "▼" : "▶"}</span>
          </button>
          {expandedSections.q1 && (
            <div className="p-4">
              <textarea
                ref={textareaRef}
                value={whatWentWell}
                onChange={(e) => setWhatWentWell(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 min-h-[100px] text-sm"
                placeholder="What worked? What surprised you? What would you repeat?"
              />
            </div>
          )}
        </div>

        {showFrictionQuestion && (
          <div className="border border-amber-500/30 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection("q2")}
              className="w-full px-4 py-3 bg-amber-500/10 hover:bg-amber-500/20 transition-colors flex items-center justify-between"
            >
              <p className="text-xs text-zinc-400 uppercase tracking-wider">
                <span className="text-amber-400 font-medium">Q2.</span> What was the friction?
              </p>
              <span className="text-zinc-500">{expandedSections.q2 ? "▼" : "▶"}</span>
            </button>
            {expandedSections.q2 && (
              <div className="p-4 bg-amber-500/5 space-y-3">
                <p className="text-xs text-zinc-400">
                  Your flow efficiency was {flowEfficiency}%. What made it hard to stay focused?
                </p>
                <textarea
                  value={frictionNotes}
                  onChange={(e) => setFrictionNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 min-h-[80px] text-sm"
                  placeholder="Distractions, interruptions, unclear goals, fatigue..."
                />
              </div>
            )}
          </div>
        )}

        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("q3")}
            className="w-full px-4 py-3 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors flex items-center justify-between"
          >
            <p className="text-xs text-zinc-400 uppercase tracking-wider">
              <span className="text-cyan-400 font-medium">Q{showFrictionQuestion ? "3" : "2"}.</span> How's your closing
              energy?
            </p>
            <span className="text-zinc-500">{expandedSections.q3 ? "▼" : "▶"}</span>
          </button>
          {expandedSections.q3 && (
            <div className="p-4">
              <div className="grid grid-cols-5 gap-3">
                {energyEmojis.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setClosingEnergy(item.value)}
                    className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                      closingEnergy === item.value
                        ? "border-emerald-500 bg-emerald-500/20 shadow-lg shadow-emerald-500/20"
                        : "border-zinc-700 bg-zinc-900/30 hover:border-zinc-600"
                    }`}
                  >
                    <div className="text-3xl mb-1">{item.emoji}</div>
                    <div className="text-xs text-zinc-400 font-medium">{item.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onSkip}
          className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          Skip
        </button>
        <button
          onClick={handleSave}
          disabled={!whatWentWell.trim()}
          className="px-6 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-zinc-300 uppercase tracking-wider rounded-2xl transition-all duration-200 border border-emerald-500/30 backdrop-blur-sm text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Reflection
        </button>
      </div>
    </div>
  )
}
