
import { useState } from "react"
import type { MidSessionIntelligenceTestPanelProps } from "./types"

export function MidSessionIntelligenceTestPanel({
  isOpen,
  onClose,
  onBandwidthChange,
  onSetBandwidth,
  onSimulateTabSwitch,
  onSimulateAppSwitch,
  onSimulateTabBurst,
  onSimulateAppBurst,
  onSimulateSustainedFocus,
  onSimulateBreathReset,
  onSimulateWalkReset,
  onSimulateDumpReset,
  onTriggerFriction,
  onTriggerFocusSlipping,
  onTriggerNonWhitelistedApp,
  onTriggerTabSwitching,
  onResetSessionState,
  onForceEnterFlow,
  onForceExitFlow,
  onResetFlowState,
  onSimulateInterruption,
  currentBandwidth,
  sessionMode,
  flowState,
}: MidSessionIntelligenceTestPanelProps) {
  const [bandwidthInput, setBandwidthInput] = useState(75)
  const [customFocusMinutes, setCustomFocusMinutes] = useState(1)

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    bandwidth: true,
    switching: false,
    flow: false,
    reset: false,
    intervention: false,
    detection: false,
    demo: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const handleResetCalibration = () => {
    localStorage.removeItem("hcos_calibration_data")
    window.location.reload()
  }

  if (!isOpen) return null

  return (
    <div className="w-[700px] rounded-2xl bg-[#0a0f0d]/55 backdrop-blur-xl border border-zinc-700 shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-thin text-emerald-400 uppercase tracking-wider">Mid-Session Intelligence Test</h2>
          <p className="text-xs text-zinc-500 mt-1">Comprehensive bandwidth engine validation</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${sessionMode === "Zen" ? "bg-emerald-500" : sessionMode === "Flow" ? "bg-cyan-500" : "bg-red-500"}`}
            />
            <span className="text-sm text-zinc-400">
              Mode: <span className="font-medium text-white">{sessionMode}</span>
            </span>
          </div>
          <div className="text-sm text-zinc-400">
            Bandwidth: <span className="font-mono font-bold text-emerald-400">{currentBandwidth}</span>
          </div>
        </div>
      </div>

      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("bandwidth")}
          className="w-full px-4 py-3 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors flex items-center justify-between"
        >
          <p className="text-xs text-zinc-400 uppercase tracking-wider">A. Bandwidth Controls</p>
          <span className="text-zinc-500">{expandedSections.bandwidth ? "▼" : "▶"}</span>
        </button>
        {expandedSections.bandwidth && (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onBandwidthChange(5)}
                className="px-4 py-3 rounded-lg border border-emerald-700 bg-emerald-900/30 hover:bg-emerald-900/50 text-sm text-emerald-400 transition-colors"
              >
                +5 Bandwidth
              </button>
              <button
                onClick={() => onBandwidthChange(-5)}
                className="px-4 py-3 rounded-lg border border-red-700 bg-red-900/30 hover:bg-red-900/50 text-sm text-red-400 transition-colors"
              >
                -5 Bandwidth
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={bandwidthInput}
                  onChange={(e) => setBandwidthInput(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-mono text-emerald-400 w-12 text-right">{bandwidthInput}</span>
              </div>
              <button
                onClick={() => onSetBandwidth(bandwidthInput)}
                className="w-full px-3 py-2 rounded bg-zinc-800/50 hover:bg-zinc-700/50 text-xs text-zinc-300 border border-zinc-700 transition-colors"
              >
                Set Bandwidth (0-100)
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("switching")}
          className="w-full px-4 py-3 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors flex items-center justify-between"
        >
          <p className="text-xs text-zinc-400 uppercase tracking-wider">B. Context Switching Simulation</p>
          <span className="text-zinc-500">{expandedSections.switching ? "▼" : "▶"}</span>
        </button>
        {expandedSections.switching && (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onSimulateTabSwitch}
                className="px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50 text-sm text-zinc-300 transition-colors text-left"
              >
                <div className="font-medium">Simulate Tab Switch</div>
                <div className="text-xs text-zinc-500 mt-1">-2 bandwidth</div>
              </button>
              <button
                onClick={onSimulateAppSwitch}
                className="px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50 text-sm text-zinc-300 transition-colors text-left"
              >
                <div className="font-medium">Simulate App Switch</div>
                <div className="text-xs text-zinc-500 mt-1">-4 bandwidth</div>
              </button>
              <button
                onClick={onSimulateTabBurst}
                className="px-4 py-3 rounded-lg border border-orange-700 bg-orange-900/30 hover:bg-orange-900/50 text-sm text-orange-400 transition-colors text-left"
              >
                <div className="font-medium">Tab Burst</div>
                <div className="text-xs text-orange-300/60 mt-1">6 switches in 60s (-5 penalty)</div>
              </button>
              <button
                onClick={onSimulateAppBurst}
                className="px-4 py-3 rounded-lg border border-orange-700 bg-orange-900/30 hover:bg-orange-900/50 text-sm text-orange-400 transition-colors text-left"
              >
                <div className="font-medium">App Burst</div>
                <div className="text-xs text-orange-300/60 mt-1">4 switches in 60s (-6 penalty)</div>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("flow")}
          className="w-full px-4 py-3 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors flex items-center justify-between"
        >
          <p className="text-xs text-zinc-400 uppercase tracking-wider">C. Flow Simulation</p>
          <span className="text-zinc-500">{expandedSections.flow ? "▼" : "▶"}</span>
        </button>
        {expandedSections.flow && (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onSimulateSustainedFocus(1)}
                className="px-4 py-3 rounded-lg border border-blue-700 bg-blue-900/30 hover:bg-blue-900/50 text-sm text-blue-400 transition-colors text-left"
              >
                <div className="font-medium">1 Minute Focus</div>
                <div className="text-xs text-blue-300/60 mt-1">+1 bandwidth (cap 95)</div>
              </button>
              <button
                onClick={() => onSimulateSustainedFocus(12)}
                className="px-4 py-3 rounded-lg border border-purple-700 bg-purple-900/30 hover:bg-purple-900/50 text-sm text-purple-400 transition-colors text-left"
              >
                <div className="font-medium">12 Minutes Focus</div>
                <div className="text-xs text-purple-300/60 mt-1">Auto-flow trigger</div>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("reset")}
          className="w-full px-4 py-3 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors flex items-center justify-between"
        >
          <p className="text-xs text-zinc-400 uppercase tracking-wider">D. Reset Ritual Simulation</p>
          <span className="text-zinc-500">{expandedSections.reset ? "▼" : "▶"}</span>
        </button>
        {expandedSections.reset && (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={onSimulateBreathReset}
                className="px-4 py-3 rounded-lg border border-cyan-700 bg-cyan-900/30 hover:bg-cyan-900/50 text-sm text-cyan-400 transition-colors text-left"
              >
                <div className="font-medium">Breath Reset</div>
                <div className="text-xs text-cyan-300/60 mt-1">+5 bandwidth</div>
              </button>
              <button
                onClick={onSimulateWalkReset}
                className="px-4 py-3 rounded-lg border border-teal-700 bg-teal-900/30 hover:bg-teal-900/50 text-sm text-teal-400 transition-colors text-left"
              >
                <div className="font-medium">Walk Reset</div>
                <div className="text-xs text-teal-300/60 mt-1">+7.5 bandwidth</div>
              </button>
              <button
                onClick={onSimulateDumpReset}
                className="px-4 py-3 rounded-lg border border-indigo-700 bg-indigo-900/30 hover:bg-indigo-900/50 text-sm text-indigo-400 transition-colors text-left"
              >
                <div className="font-medium">Dump Reset</div>
                <div className="text-xs text-indigo-300/60 mt-1">+6 bandwidth</div>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("intervention")}
          className="w-full px-4 py-3 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors flex items-center justify-between"
        >
          <p className="text-xs text-zinc-400 uppercase tracking-wider">E. Intervention Simulation</p>
          <span className="text-zinc-500">{expandedSections.intervention ? "▼" : "▶"}</span>
        </button>
        {expandedSections.intervention && (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onTriggerFriction}
                className="px-4 py-3 rounded-lg border border-yellow-700 bg-yellow-900/30 hover:bg-yellow-900/50 text-sm text-yellow-400 transition-colors text-left"
              >
                <div className="font-medium">Trigger Friction</div>
                <div className="text-xs text-yellow-300/60 mt-1">-5 bandwidth</div>
              </button>
              <button
                onClick={onTriggerFocusSlipping}
                className="px-4 py-3 rounded-lg border border-red-700 bg-red-900/30 hover:bg-red-900/50 text-sm text-red-400 transition-colors text-left"
              >
                <div className="font-medium">Focus Slipping</div>
                <div className="text-xs text-red-300/60 mt-1">-10 bandwidth</div>
              </button>
              <button
                onClick={onTriggerNonWhitelistedApp}
                className="px-4 py-3 rounded-lg border border-orange-700 bg-orange-900/30 hover:bg-orange-900/50 text-sm text-orange-400 transition-colors text-left"
              >
                <div className="font-medium">Non-Whitelisted App</div>
                <div className="text-xs text-orange-300/60 mt-1">-12 first / -6 repeat</div>
              </button>
              <button
                onClick={onTriggerTabSwitching}
                className="px-4 py-3 rounded-lg border border-amber-700 bg-amber-900/30 hover:bg-amber-900/50 text-sm text-amber-400 transition-colors text-left"
              >
                <div className="font-medium">Tab Switching</div>
                <div className="text-xs text-amber-300/60 mt-1">-2 normal / -5 burst</div>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("detection")}
          className="w-full px-4 py-3 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors flex items-center justify-between"
        >
          <p className="text-xs text-zinc-400 uppercase tracking-wider">F. Flow Detection Engine</p>
          <span className="text-zinc-500">{expandedSections.detection ? "▼" : "▶"}</span>
        </button>
        {expandedSections.detection && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={onForceEnterFlow}
                className="px-4 py-3 rounded-lg border border-emerald-700 bg-emerald-900/30 hover:bg-emerald-900/50 text-sm text-emerald-400 transition-colors text-left"
              >
                <div className="font-medium">Force Enter Flow</div>
                <div className="text-xs text-emerald-300/60 mt-1">Manual trigger</div>
              </button>
              <button
                onClick={onForceExitFlow}
                className="px-4 py-3 rounded-lg border border-red-700 bg-red-900/30 hover:bg-red-900/50 text-sm text-red-400 transition-colors text-left"
              >
                <div className="font-medium">Force Exit Flow</div>
                <div className="text-xs text-red-300/60 mt-1">Manual exit</div>
              </button>
              <button
                onClick={onResetFlowState}
                className="px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50 text-sm text-zinc-300 transition-colors text-left"
              >
                <div className="font-medium">Reset Flow State</div>
                <div className="text-xs text-zinc-500 mt-1">Clear all</div>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onSimulateSustainedFocus(1)}
                className="px-4 py-3 rounded-lg border border-blue-700 bg-blue-900/30 hover:bg-blue-900/50 text-sm text-blue-400 transition-colors text-left"
              >
                <div className="font-medium">1 Minute Focus</div>
                <div className="text-xs text-blue-300/60 mt-1">+1 bandwidth (cap 95)</div>
              </button>
              <button
                onClick={() => onSimulateSustainedFocus(12)}
                className="px-4 py-3 rounded-lg border border-purple-700 bg-purple-900/30 hover:bg-purple-900/50 text-sm text-purple-400 transition-colors text-left"
              >
                <div className="font-medium">12 Minutes Focus</div>
                <div className="text-xs text-purple-300/60 mt-1">Auto-flow trigger</div>
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={customFocusMinutes}
                  onChange={(e) => setCustomFocusMinutes(Number(e.target.value))}
                  className="flex-1 px-3 py-2 bg-zinc-900/50 border border-zinc-700 rounded text-zinc-300 text-sm"
                  placeholder="Minutes"
                />
                <button
                  onClick={() => onSimulateSustainedFocus(customFocusMinutes)}
                  className="px-4 py-2 rounded bg-zinc-800/50 hover:bg-zinc-700/50 text-xs text-zinc-300 border border-zinc-700 transition-colors"
                >
                  Simulate N Minutes
                </button>
              </div>
            </div>

            <p className="text-xs text-zinc-500 uppercase tracking-wider mt-4">Flow Interruptions</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onSimulateInterruption("tab")}
                className="px-4 py-3 rounded-lg border border-orange-700 bg-orange-900/30 hover:bg-orange-900/50 text-sm text-orange-400 transition-colors text-left"
              >
                <div className="font-medium">Tab Switch</div>
                <div className="text-xs text-orange-300/60 mt-1">Breaks flow</div>
              </button>
              <button
                onClick={() => onSimulateInterruption("app")}
                className="px-4 py-3 rounded-lg border border-orange-700 bg-orange-900/30 hover:bg-orange-900/50 text-sm text-orange-400 transition-colors text-left"
              >
                <div className="font-medium">App Switch</div>
                <div className="text-xs text-orange-300/60 mt-1">Breaks flow</div>
              </button>
              <button
                onClick={() => onSimulateInterruption("intervention")}
                className="px-4 py-3 rounded-lg border border-yellow-700 bg-yellow-900/30 hover:bg-yellow-900/50 text-sm text-yellow-400 transition-colors text-left"
              >
                <div className="font-medium">Intervention</div>
                <div className="text-xs text-yellow-300/60 mt-1">Breaks flow</div>
              </button>
              <button
                onClick={() => onSimulateInterruption("parking-lot")}
                className="px-4 py-3 rounded-lg border border-amber-700 bg-amber-900/30 hover:bg-amber-900/50 text-sm text-amber-400 transition-colors text-left"
              >
                <div className="font-medium">Parking Lot</div>
                <div className="text-xs text-amber-300/60 mt-1">Breaks flow</div>
              </button>
            </div>

            {flowState && (
              <div className="p-4 rounded-lg bg-zinc-900/70 border border-zinc-800 space-y-2">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">Flow Debug State</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Sustained Focus:</span>
                    <span className="font-mono text-zinc-300">{flowState.sustainedFocusMinutes} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Flow Eligible:</span>
                    <span className={`font-mono ${flowState.flowEligible ? "text-emerald-400" : "text-red-400"}`}>
                      {flowState.flowEligible ? "YES" : "NO"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Flow Triggered:</span>
                    <span className={`font-mono ${flowState.flowTriggered ? "text-emerald-400" : "text-zinc-500"}`}>
                      {flowState.flowTriggered ? "YES" : "NO"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Flow Active:</span>
                    <span className={`font-mono ${flowState.flowActive ? "text-emerald-400" : "text-zinc-500"}`}>
                      {flowState.flowActive ? "YES" : "NO"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Celebration:</span>
                    <span
                      className={`font-mono ${flowState.flowCelebrationTriggered ? "text-purple-400" : "text-zinc-500"}`}
                    >
                      {flowState.flowCelebrationTriggered ? "YES" : "NO"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Streak Minutes:</span>
                    <span className="font-mono text-cyan-400">{flowState.flowStreakMinutes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Conditions Valid:</span>
                    <span className={`font-mono ${flowState.conditionsValid ? "text-emerald-400" : "text-red-400"}`}>
                      {flowState.conditionsValid ? "YES" : "NO"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Current Bandwidth:</span>
                    <span className="font-mono text-emerald-400">{currentBandwidth}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection("demo")}
          className="w-full px-4 py-3 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors flex items-center justify-between"
        >
          <p className="text-xs text-zinc-400 uppercase tracking-wider">G. Demo Controls</p>
          <span className="text-zinc-500">{expandedSections.demo ? "▼" : "▶"}</span>
        </button>
        {expandedSections.demo && (
          <div className="p-4 space-y-3">
            <button
              onClick={handleResetCalibration}
              className="w-full px-4 py-3 rounded-lg border border-violet-700 bg-violet-900/30 hover:bg-violet-900/50 text-sm text-violet-400 transition-colors text-left"
            >
              <div className="font-medium">Reset Calibration</div>
              <div className="text-xs text-violet-300/60 mt-1">Clear today's calibration and reload page</div>
            </button>
            <p className="text-xs text-zinc-500 italic">Use this to demo the calibration flow multiple times</p>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-zinc-800">
        <button
          onClick={onResetSessionState}
          className="w-full p-4 rounded-lg border-2 border-red-600/50 bg-red-900/30 hover:bg-red-900/50 hover:border-red-500 transition-all group"
        >
          <div className="text-center">
            <div className="text-sm font-bold text-red-400 group-hover:text-red-300 transition-colors">
              Reset Session State
            </div>
            <div className="text-xs text-zinc-400">Clear all timers, counters, and history</div>
          </div>
        </button>
      </div>
    </div>
  )
}
