
import type React from "react"
import { useState } from "react"
import type { ParkingLotCaptureProps } from "./types"

export function ParkingLotCapturePanel({
  isOpen,
  onClose,
  onAddItem,
  currentItems = [],
  maxItems = 5,
}: ParkingLotCaptureProps) {
  const [input, setInput] = useState("")

  if (!isOpen) return null

  const handleAdd = () => {
    if (input.trim() && currentItems.length < maxItems) {
      onAddItem(input.trim())
      setInput("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAdd()
    }
  }

  const remainingSlots = maxItems - currentItems.length

  return (
    <div className="w-[380px] rounded-3xl bg-[#0a0f0d]/55 backdrop-blur-xl border border-emerald-500/30 shadow-2xl overflow-hidden">
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm text-emerald-400 uppercase tracking-wider">CAPTURE YOUR THOUGHTS</h3>
            <p className="text-xs text-zinc-400 mt-1">let them go and come back to the present</p>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors text-xs"
          >
            ✕
          </button>
        </div>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a thought, task, or idea... (Press Enter to add)"
          className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          disabled={currentItems.length >= maxItems}
        />

        {currentItems.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Your Parking Lot</div>
            <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
              {currentItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-2 px-3 py-2 bg-zinc-900/40 border border-zinc-800/50 rounded-lg text-sm text-zinc-300"
                >
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span className="flex-1">{item.text}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-500 text-center">
              {remainingSlots > 0 ? `${remainingSlots} slots remaining` : "Parking lot full"}
            </p>
          </div>
        )}

        {currentItems.length === 0 && (
          <div className="py-6 text-center">
            <p className="text-xs text-zinc-500">No items in parking lot yet</p>
          </div>
        )}

        {/* Limit Warning */}
        {currentItems.length >= maxItems && (
          <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-xs text-amber-400">Parking lot is full. Process these items during your next session.</p>
          </div>
        )}
      </div>
    </div>
  )
}
