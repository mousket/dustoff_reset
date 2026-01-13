
import { X, TrendingUp, Zap, Clock, Target, AlertTriangle } from "lucide-react"
import type { SessionRecord } from "@/lib/session-storage"

interface PostSessionSummaryPanelProps {
  isOpen: boolean
  session: SessionRecord | null
  onContinueToReflection: () => void
  onDone: () => void
}

export function PostSessionSummaryPanel({
  isOpen,
  session,
  onContinueToReflection,
  onDone,
}: PostSessionSummaryPanelProps) {
  if (!isOpen || !session) return null

  const modeColors = {
    Zen: { bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500" },
    Flow: { bg: "bg-cyan-500", text: "text-cyan-400", border: "border-cyan-500" },
    Legend: { bg: "bg-red-500", text: "text-red-400", border: "border-red-500" },
  }

  const colors = modeColors[session.mode]
  const totalDuration = session.actualDurationMinutes ?? 1 // Default to 1 to avoid division by zero

  return (
    <div className="relative w-full max-w-6xl max-h-[80vh] overflow-y-auto rounded-2xl bg-[#0a0f0d]/55 backdrop-blur-xl border border-zinc-700 shadow-2xl p-8 space-y-6">
      <button onClick={onDone} className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors z-10">
        <X className="w-5 h-5" />
      </button>

      <div>
        <h2 className="text-xl font-bold text-emerald-400 uppercase tracking-wider">The Game Tape</h2>
        <p className="text-xs text-zinc-500 mt-1">Let's review what just happened.</p>
      </div>

      {/* Timeline Section */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs text-zinc-400 uppercase tracking-wider">Session Timeline</h3>
        </div>

        <div className="h-14 rounded-lg overflow-hidden flex bg-slate-950">
          {session.timelineBlocks.map((block, i) => {
            const width = ((block.end - block.start) / totalDuration) * 100
            const blockColors = {
              flow: "bg-emerald-500",
              working: "bg-cyan-600",
              distracted: "bg-red-500",
              reset: "bg-slate-600",
            }
            return (
              <div
                key={i}
                className={`${blockColors[block.state]} transition-all hover:opacity-80`}
                style={{ width: `${width}%` }}
                title={`${block.state}: ${block.start}-${block.end} min`}
              />
            )
          })}
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-zinc-500">0 min</span>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
              <span className="text-zinc-400">Flow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-cyan-600" />
              <span className="text-zinc-400">Working</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-red-500" />
              <span className="text-zinc-400">Distracted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-slate-600" />
              <span className="text-zinc-400">Reset</span>
            </div>
          </div>
          <span className="text-xs text-zinc-500">{totalDuration} min</span>
        </div>
      </div>

      {/* Metrics Grid - Improved alignment and spacing */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-zinc-400 uppercase tracking-wider">Flow Efficiency</span>
          </div>
          <div className="text-4xl font-bold text-white">{session.flowEfficiency}%</div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-zinc-400 uppercase tracking-wider">Longest Streak</span>
          </div>
          <div className="text-4xl font-bold text-white">{session.longestStreakMinutes} min</div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-zinc-400 uppercase tracking-wider">Distractions</span>
          </div>
          <div
            className="text-4xl font-bold text-white cursor-pointer hover:text-cyan-400 transition-colors"
            title="Click to see details"
          >
            {session.distractionAttempts}
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-zinc-400 uppercase tracking-wider">Interventions</span>
          </div>
          <div
            className="text-4xl font-bold text-white cursor-pointer hover:text-cyan-400 transition-colors"
            title="Click to see details"
          >
            {session.interventionsUsed}
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3 col-span-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${colors.bg}`} />
            <span className="text-xs text-zinc-400 uppercase tracking-wider">Victory Badge</span>
          </div>
          <div className="flex items-center gap-4">
            <div className={`text-4xl font-bold ${colors.text}`}>{session.victoryLevel}</div>
            <span className="text-zinc-500">·</span>
            <span className="text-lg text-zinc-400">{session.mode} Mode</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onDone}
          className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white transition-colors rounded-lg text-sm font-medium"
        >
          Skip Reflection
        </button>
        <button
          onClick={onContinueToReflection}
          className="px-6 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-zinc-300 uppercase tracking-wider rounded-2xl transition-all duration-200 border border-emerald-500/30 backdrop-blur-sm text-sm font-medium"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
