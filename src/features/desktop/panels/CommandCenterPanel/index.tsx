
import { useState } from "react"
import type { CommandCenterPanelProps } from "./types"

export function CommandCenterPanel({
  isOpen,
  onClose,
  onTriggerIntervention,
  onRunSequentialTest,
  onTestResetModal,
  onTriggerFlowCelebration,
  onSetBandwidth,
  sessionMode,
}: CommandCenterPanelProps) {
  const [bandwidthInput, setBandwidthInput] = useState(75)

  if (!isOpen) return null

  const interventions = [
    {
      id: "friction" as const,
      label: "Friction Alert",
      description: "Context switching detected",
    },
    {
      id: "slipping" as const,
      label: "Focus Slipping",
      description: "15min bandwidth decline",
    },
    {
      id: "non-whitelisted" as const,
      label: "Non-Whitelisted App",
      description: "Unauthorized app opened",
    },
    {
      id: "tab-switching" as const,
      label: "Tab Switching",
      description: "Rapid tab changes",
    },
  ]

  return (
    <div className="w-[475px] rounded-2xl bg-[#0a0f0d]/55 backdrop-blur-xl border border-zinc-700 shadow-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-emerald-400">COMMAND CENTER</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${sessionMode === "Zen" ? "bg-emerald-500" : sessionMode === "Flow" ? "bg-cyan-500" : "bg-red-500"}`}
          />
          <span className="text-sm text-zinc-400">
            Current Mode: <span className="font-medium text-white">{sessionMode}</span>
          </span>
        </div>
      </div>

      {onSetBandwidth && (
        <div className="space-y-3 pt-2 border-t border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Bandwidth Control</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="40"
                max="100"
                value={bandwidthInput}
                onChange={(e) => setBandwidthInput(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-mono text-emerald-400 w-12 text-right">{bandwidthInput}</span>
            </div>
            <button
              onClick={() => onSetBandwidth(bandwidthInput)}
              className="w-full px-3 py-2 rounded bg-emerald-800/50 hover:bg-emerald-800/70 text-xs text-emerald-400 border border-emerald-700 transition-colors"
            >
              Set Bandwidth
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-xs text-zinc-500 uppercase tracking-wider">Trigger Interventions</p>
        <div className="grid grid-cols-2 gap-3">
          {interventions.map((intervention) => (
            <button
              key={intervention.id}
              onClick={() => onTriggerIntervention(intervention.id)}
              className="p-3 rounded-lg border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50 hover:border-emerald-500/30 transition-all group"
            >
              <div className="text-left">
                <div className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors mb-1">
                  {intervention.label}
                </div>
                <div className="text-xs text-zinc-500">{intervention.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-zinc-800">
        <button
          onClick={onTestResetModal}
          className="w-full p-4 rounded-lg border-2 border-blue-600/50 bg-blue-900/30 hover:bg-blue-900/50 hover:border-blue-500 transition-all group"
        >
          <div className="text-center">
            <div className="text-sm font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
              Test Reset Modal
            </div>
            <div className="text-xs text-zinc-400">Open reset ritual options</div>
          </div>
        </button>
      </div>

      <div className="pt-2 border-t border-zinc-800">
        <button
          onClick={onTriggerFlowCelebration}
          className="w-full p-4 rounded-lg border-2 border-amber-600/50 bg-amber-900/30 hover:bg-amber-900/50 hover:border-amber-500 transition-all group"
        >
          <div className="text-center">
            <div className="text-sm font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
              Trigger Flow Celebration
            </div>
            <div className="text-xs text-zinc-400">Test flow state achievement overlay</div>
          </div>
        </button>
      </div>
    </div>
  )
}
