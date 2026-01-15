
import { X, TrendingUp, Zap, Clock, Target, AlertTriangle, Minus, Plus, ArrowLeftRight, Shield } from "lucide-react"
import type { SessionRecord } from "@/lib/session-storage"
import type { SessionTelemetryBreakdown } from "@/hooks/useSessionTelemetryStats"

interface PostSessionSummaryPanelProps {
  isOpen: boolean
  session: SessionRecord | null
  telemetryStats?: SessionTelemetryBreakdown | null
  onContinueToReflection: () => void
  onDone: () => void
}

export function PostSessionSummaryPanel({
  isOpen,
  session,
  telemetryStats,
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

      {/* Session Mode Badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.bg}/20 border ${colors.border}/40`}>
        <div className={`w-2 h-2 rounded-full ${colors.bg}`} />
        <span className={`text-sm font-medium ${colors.text}`}>{session.mode} Mode Session</span>
      </div>

      {/* Metrics Grid - with tooltips */}
      <div className="grid grid-cols-3 gap-3">
        <div 
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-2 cursor-help transition-all hover:border-zinc-700"
          title="Percentage of time you were in a focused flow state (bandwidth > 70 sustained)"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-zinc-400 uppercase tracking-wider">Flow Efficiency</span>
          </div>
          <div className="text-2xl font-bold text-white">{session.flowEfficiency ?? 0}%</div>
        </div>

        <div 
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-2 cursor-help transition-all hover:border-zinc-700"
          title="Longest continuous period of focused work without distractions"
        >
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-zinc-400 uppercase tracking-wider">Longest Streak</span>
          </div>
          <div className="text-2xl font-bold text-white">{session.longestStreakMinutes} min</div>
        </div>

        <div 
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-2 cursor-help transition-all hover:border-zinc-700"
          title="Times you switched to distracting apps or websites during the session"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-zinc-400 uppercase tracking-wider">Distractions</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {session.distractionAttempts}
          </div>
          <p className="text-xs text-zinc-500">attempts blocked/warned</p>
        </div>

        <div 
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-2 cursor-help transition-all hover:border-zinc-700"
          title="Number of intervention screens shown (Delay Gate or Block Screen)"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-zinc-400 uppercase tracking-wider">Interventions</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {session.interventionsUsed}
          </div>
          <p className="text-xs text-zinc-500">screens shown</p>
        </div>

        <div 
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-2 col-span-2 cursor-help transition-all hover:border-zinc-700"
          title="Your achievement level based on session completion percentage and distraction resistance"
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${colors.bg}`} />
            <span className="text-xs text-zinc-400 uppercase tracking-wider">Victory Badge</span>
          </div>
          <div className={`text-2xl font-bold ${colors.text}`}>{session.victoryLevel}</div>
          <p className="text-xs text-zinc-500">Based on completion & performance</p>
        </div>
      </div>

      {/* Telemetry Breakdown Section */}
      {telemetryStats && (telemetryStats.totalPenaltyPoints > 0 || telemetryStats.totalBonusPoints > 0) && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 space-y-5">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Bandwidth Impact</h3>
          </div>

          {/* Main Impact Display - Net in center circle */}
          <div className="flex items-center justify-between gap-4">
            {/* Penalties - Left */}
            <div className="flex-1 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5">
                <Minus className="w-4 h-4 text-red-400" />
                <span className="text-xs font-medium text-red-400 uppercase tracking-wide">Penalties</span>
              </div>
              <div className="text-3xl font-bold text-red-400">
                -{telemetryStats.totalPenaltyPoints.toFixed(1)}
              </div>
              {/* Penalty breakdown */}
              <div className="space-y-1 pt-2">
                <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-lg border border-red-500/20">
                  <span className="text-sm font-semibold text-red-300">{telemetryStats.offenseCount}</span>
                  <span className="text-xs text-zinc-400">offense{telemetryStats.offenseCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Net Impact - Center Circle */}
            <div className="flex-shrink-0">
              <div className={`w-28 h-28 rounded-full flex flex-col items-center justify-center border-4 ${
                (telemetryStats.totalBonusPoints - telemetryStats.totalPenaltyPoints) >= 0 
                  ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.3)]' 
                  : 'border-red-500/50 bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
              }`}>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Net</span>
                <span className={`text-2xl font-bold ${
                  (telemetryStats.totalBonusPoints - telemetryStats.totalPenaltyPoints) >= 0 
                    ? 'text-emerald-400' 
                    : 'text-red-400'
                }`}>
                  {(telemetryStats.totalBonusPoints - telemetryStats.totalPenaltyPoints) >= 0 ? '+' : ''}
                  {(telemetryStats.totalBonusPoints - telemetryStats.totalPenaltyPoints).toFixed(1)}
                </span>
                <span className="text-[10px] text-zinc-500">impact</span>
              </div>
            </div>

            {/* Bonuses - Right */}
            <div className="flex-1 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">Bonuses</span>
              </div>
              <div className="text-3xl font-bold text-emerald-400">
                +{telemetryStats.totalBonusPoints.toFixed(1)}
              </div>
              {/* Bonus breakdown */}
              <div className="space-y-1 pt-2">
                {telemetryStats.resetRitualsCompleted > 0 && (
                  <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <span className="text-sm font-semibold text-emerald-300">{telemetryStats.resetRitualsCompleted}</span>
                    <span className="text-xs text-zinc-400">reset{telemetryStats.resetRitualsCompleted !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {telemetryStats.interventionReturnedCount > 0 && (
                  <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                    <span className="text-sm font-semibold text-cyan-300">{telemetryStats.interventionReturnedCount}</span>
                    <span className="text-xs text-zinc-400">return{telemetryStats.interventionReturnedCount !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {telemetryStats.flowAchievedCount > 0 && (
                  <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <span className="text-sm font-semibold text-purple-300">{telemetryStats.flowAchievedCount}</span>
                    <span className="text-xs text-zinc-400">flow{telemetryStats.flowAchievedCount !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Intervention Response */}
          {telemetryStats.interventionCount > 0 && (
            <div className="pt-4 border-t border-zinc-800 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Intervention Response</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <span className="text-sm text-zinc-400">Returned to work</span>
                  <span className="text-lg font-bold text-emerald-400">{telemetryStats.interventionReturnedCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <span className="text-sm text-zinc-400">Proceeded anyway</span>
                  <span className="text-lg font-bold text-amber-400">{telemetryStats.interventionProceededCount}</span>
                </div>
              </div>
            </div>
          )}

          {/* Category Breakdown */}
          {Object.keys(telemetryStats.offensesByCategory).length > 0 && (
            <div className="pt-4 border-t border-zinc-800 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Offenses by Category</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(telemetryStats.offensesByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, count]) => (
                    <div 
                      key={category}
                      className="px-3 py-2 bg-zinc-800/80 rounded-lg border border-zinc-700/50 flex items-center gap-2"
                    >
                      <span className="text-sm text-zinc-300">{category.replace(/_/g, ' ')}</span>
                      <span className="px-2 py-0.5 bg-red-500/20 rounded text-sm font-bold text-red-400">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

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
