
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
    <div className="relative w-full max-w-6xl max-h-[80vh] overflow-y-auto rounded-2xl bg-[#0a0f0d]/55 backdrop-blur-xl border border-zinc-700 shadow-2xl p-5 space-y-4">
      <button onClick={onDone} className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors z-10">
        <X className="w-4 h-4" />
      </button>

      <div>
        <h2 className="text-base font-bold text-emerald-400 uppercase tracking-wider">The Game Tape</h2>
        <p className="text-[10px] text-zinc-500 mt-0.5">Session performance review</p>
      </div>

      {/* Timeline Section - compact */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-cyan-400" />
            <h3 className="text-[10px] text-zinc-500 uppercase tracking-wider">Timeline</h3>
          </div>
          <div className="flex gap-3 text-[10px]">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-emerald-500" />
              <span className="text-zinc-500">Flow</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-cyan-600" />
              <span className="text-zinc-500">Work</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-red-500" />
              <span className="text-zinc-500">Distracted</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-slate-600" />
              <span className="text-zinc-500">Reset</span>
            </div>
          </div>
        </div>

        <div className="h-8 rounded overflow-hidden flex bg-slate-950">
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
          <span className="text-[10px] text-zinc-600">0m</span>
          <span className="text-[10px] text-zinc-600">{totalDuration}m</span>
        </div>
      </div>

      {/* Session Mode Badge - inline */}
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${colors.bg}/20 border ${colors.border}/40`}>
        <div className={`w-1.5 h-1.5 rounded-full ${colors.bg}`} />
        <span className={`text-xs font-medium ${colors.text}`}>{session.mode} Mode</span>
      </div>

      {/* Metrics Grid - compact with tooltips */}
      <div className="grid grid-cols-5 gap-2">
        <div 
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-2.5 cursor-help transition-all hover:border-zinc-700"
          title="Percentage of time you were in a focused flow state (bandwidth > 70 sustained)"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Flow</span>
          </div>
          <div className="text-lg font-bold text-white">{session.flowEfficiency ?? 0}%</div>
        </div>

        <div 
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-2.5 cursor-help transition-all hover:border-zinc-700"
          title="Longest continuous period of focused work without distractions"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Streak</span>
          </div>
          <div className="text-lg font-bold text-white">{session.longestStreakMinutes}m</div>
        </div>

        <div 
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-2.5 cursor-help transition-all hover:border-zinc-700"
          title="Times you switched to distracting apps or websites during the session"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Distractions</span>
          </div>
          <div className="text-lg font-bold text-white">{session.distractionAttempts}</div>
        </div>

        <div 
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-2.5 cursor-help transition-all hover:border-zinc-700"
          title="Number of intervention screens shown (Delay Gate or Block Screen)"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3 h-3 text-purple-400" />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Interventions</span>
          </div>
          <div className="text-lg font-bold text-white">{session.interventionsUsed}</div>
        </div>

        <div 
          className={`bg-zinc-900/50 border rounded-lg p-2.5 cursor-help transition-all hover:border-zinc-700 ${colors.border}/30`}
          title="Your achievement level based on session completion percentage and distraction resistance"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <div className={`w-2 h-2 rounded-full ${colors.bg}`} />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Victory</span>
          </div>
          <div className={`text-lg font-bold ${colors.text}`}>{session.victoryLevel}</div>
        </div>
      </div>

      {/* Telemetry Breakdown Section - Always show */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Bandwidth Impact</h3>
        </div>

        {/* Main Impact Display - Net in center circle */}
        <div className="flex items-center justify-between gap-3">
          {/* Penalties - Left */}
          <div className="flex-1 text-center space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Minus className="w-3 h-3 text-red-400" />
              <span className="text-[10px] font-medium text-red-400 uppercase tracking-wide">Penalties</span>
            </div>
            <div className="text-xl font-bold text-red-400">
              -{(telemetryStats?.totalPenaltyPoints ?? 0).toFixed(1)}
            </div>
            {/* Penalty breakdown */}
            {(telemetryStats?.offenseCount ?? 0) > 0 && (
              <div className="flex items-center justify-center gap-1.5 px-2 py-1 bg-red-500/10 rounded border border-red-500/20">
                <span className="text-xs font-semibold text-red-300">{telemetryStats?.offenseCount}</span>
                <span className="text-[10px] text-zinc-500">offense{(telemetryStats?.offenseCount ?? 0) !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Net Impact - Center Circle */}
          <div className="flex-shrink-0">
            <div className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-2 ${
              ((telemetryStats?.totalBonusPoints ?? 0) - (telemetryStats?.totalPenaltyPoints ?? 0)) >= 0 
                ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                : 'border-red-500/50 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
            }`}>
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Net</span>
              <span className={`text-lg font-bold ${
                ((telemetryStats?.totalBonusPoints ?? 0) - (telemetryStats?.totalPenaltyPoints ?? 0)) >= 0 
                  ? 'text-emerald-400' 
                  : 'text-red-400'
              }`}>
                {((telemetryStats?.totalBonusPoints ?? 0) - (telemetryStats?.totalPenaltyPoints ?? 0)) >= 0 ? '+' : ''}
                {((telemetryStats?.totalBonusPoints ?? 0) - (telemetryStats?.totalPenaltyPoints ?? 0)).toFixed(1)}
              </span>
            </div>
          </div>

          {/* Bonuses - Right */}
          <div className="flex-1 text-center space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Plus className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wide">Bonuses</span>
            </div>
            <div className="text-xl font-bold text-emerald-400">
              +{(telemetryStats?.totalBonusPoints ?? 0).toFixed(1)}
            </div>
            {/* Bonus breakdown - compact */}
            <div className="flex flex-wrap justify-center gap-1">
              {(telemetryStats?.resetRitualsCompleted ?? 0) > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">
                  <span className="text-xs font-semibold text-emerald-300">{telemetryStats?.resetRitualsCompleted}</span>
                  <span className="text-[10px] text-zinc-500">reset</span>
                </div>
              )}
              {(telemetryStats?.interventionReturnedCount ?? 0) > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-cyan-500/10 rounded border border-cyan-500/20">
                  <span className="text-xs font-semibold text-cyan-300">{telemetryStats?.interventionReturnedCount}</span>
                  <span className="text-[10px] text-zinc-500">return</span>
                </div>
              )}
              {(telemetryStats?.flowAchievedCount ?? 0) > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 rounded border border-purple-500/20">
                  <span className="text-xs font-semibold text-purple-300">{telemetryStats?.flowAchievedCount}</span>
                  <span className="text-[10px] text-zinc-500">flow</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Intervention Response - compact */}
        {(telemetryStats?.interventionCount ?? 0) > 0 && (
          <div className="pt-3 border-t border-zinc-800 space-y-2">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Intervention Response</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-2 bg-emerald-500/10 rounded border border-emerald-500/20">
                <span className="text-xs text-zinc-400">Returned</span>
                <span className="text-sm font-bold text-emerald-400">{telemetryStats?.interventionReturnedCount ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-amber-500/10 rounded border border-amber-500/20">
                <span className="text-xs text-zinc-400">Proceeded</span>
                <span className="text-sm font-bold text-amber-400">{telemetryStats?.interventionProceededCount ?? 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* Category Breakdown - compact */}
        {telemetryStats && Object.keys(telemetryStats.offensesByCategory).length > 0 && (
          <div className="pt-3 border-t border-zinc-800 space-y-2">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Offenses by Category</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(telemetryStats.offensesByCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => (
                  <div 
                    key={category}
                    className="px-2 py-1 bg-zinc-800/80 rounded border border-zinc-700/50 flex items-center gap-1.5"
                  >
                    <span className="text-xs text-zinc-300">{category.replace(/_/g, ' ')}</span>
                    <span className="px-1.5 py-0.5 bg-red-500/20 rounded text-xs font-bold text-red-400">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onDone}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white transition-colors rounded-lg text-xs font-medium"
        >
          Skip
        </button>
        <button
          onClick={onContinueToReflection}
          className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-zinc-300 uppercase tracking-wider rounded-xl transition-all duration-200 border border-emerald-500/30 backdrop-blur-sm text-xs font-medium"
        >
          Reflect
        </button>
      </div>
    </div>
  )
}
