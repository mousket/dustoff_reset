
import { useState } from "react"
import { X, Copy, Check } from "lucide-react"
import type { ParkingLotItemFull } from "@/lib/parking-lot-storage"

interface ParkingLotHarvestPanelProps {
  isOpen: boolean
  items: ParkingLotItemFull[]
  onComplete: (
    harvestedItems: Array<{
      id: string
      category: "task" | "idea" | "reminder" | "distraction"
      tags: string[]
      action: "next-session" | "keep" | "delete"
    }>,
  ) => void
  onSkip: () => void
}

export function ParkingLotHarvestPanel({ isOpen, items, onComplete, onSkip }: ParkingLotHarvestPanelProps) {
  const [harvestData, setHarvestData] = useState<
    Record<
      string,
      {
        category: "task" | "idea" | "reminder" | "distraction"
        tags: string[]
        action: "next-session" | "keep" | "delete"
      }
    >
  >({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  if (!isOpen) return null

  const handleCategoryChange = (itemId: string, category: "task" | "idea" | "reminder" | "distraction") => {
    setHarvestData((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        category,
        tags: prev[itemId]?.tags || [],
        action: prev[itemId]?.action || "keep",
      },
    }))
  }

  const handleTagToggle = (itemId: string, tag: string) => {
    setHarvestData((prev) => {
      const current = prev[itemId] || { category: "task", tags: [], action: "keep" }
      const tags = current.tags.includes(tag) ? current.tags.filter((t) => t !== tag) : [...current.tags, tag]
      return {
        ...prev,
        [itemId]: { ...current, tags },
      }
    })
  }

  const handleActionChange = (itemId: string, action: "next-session" | "keep" | "delete") => {
    setHarvestData((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        category: prev[itemId]?.category || "task",
        tags: prev[itemId]?.tags || [],
        action,
      },
    }))
  }

  const handleCopyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error("[v0] Failed to copy to clipboard", err)
    }
  }

  const handleComplete = () => {
    const harvested = items.map((item) => ({
      id: item.id,
      category: harvestData[item.id]?.category || "task",
      tags: harvestData[item.id]?.tags || [],
      action: harvestData[item.id]?.action || "keep",
    }))
    onComplete(harvested)
  }

  const availableTags = ["urgent", "follow-up", "research", "creative", "admin", "personal"]

  return (
    <div className="relative w-full max-w-6xl max-h-[80vh] overflow-y-auto rounded-2xl bg-[#0a0f0d]/55 backdrop-blur-xl border border-zinc-700 shadow-2xl p-8 space-y-6">
      <button onClick={onSkip} className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors z-10">
        <X className="w-5 h-5" />
      </button>

      <div>
        <h2 className="text-sm text-emerald-400 uppercase tracking-wider">Parking Lot Harvest</h2>
        <p className="text-xs text-zinc-500 mt-1">Categorize and decide what to do with items from this session.</p>
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-zinc-400 text-sm">No items to harvest. You stayed focused!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const data = harvestData[item.id] || { category: "task", tags: [], action: "keep" }
            return (
              <div key={item.id} className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/30 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-white text-sm flex-1">{item.text}</p>
                  <button
                    onClick={() => handleCopyToClipboard(item.text, item.id)}
                    className="text-zinc-400 hover:text-emerald-400 transition-colors p-1"
                    title="Copy to clipboard"
                  >
                    {copiedId === item.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Category</p>
                  <div className="flex gap-2">
                    {(["task", "idea", "reminder", "distraction"] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => handleCategoryChange(item.id, cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          data.category === cat
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
                        }`}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Tags (Optional)</p>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleTagToggle(item.id, tag)}
                        className={`px-2 py-1 rounded text-xs transition-all ${
                          data.tags.includes(tag)
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                            : "bg-zinc-800/50 text-zinc-500 border border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Action</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleActionChange(item.id, "next-session")}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        data.action === "next-session"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
                      }`}
                      title="Auto-show in next session's parking lot selection"
                    >
                      Add to Next Session
                    </button>
                    <button
                      onClick={() => handleActionChange(item.id, "keep")}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        data.action === "keep"
                          ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                          : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
                      }`}
                      title="Keep available in parking lot (manual selection)"
                    >
                      Keep in List
                    </button>
                    <button
                      onClick={() => handleActionChange(item.id, "delete")}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        data.action === "delete"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
                      }`}
                      title="Permanently remove from parking lot"
                    >
                      Delete
                    </button>
                  </div>
                  {/* Explanation text */}
                  <p className="text-xs text-zinc-400 mt-1">
                    {data.action === "next-session" && "Will auto-appear in next session"}
                    {data.action === "keep" && "Stays available for manual selection"}
                    {data.action === "delete" && "Will be removed permanently"}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onSkip}
          className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          Skip
        </button>
        <button
          onClick={handleComplete}
          className="px-6 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-zinc-300 uppercase tracking-wider rounded-2xl transition-all duration-200 border border-emerald-500/30 backdrop-blur-sm text-sm font-medium"
        >
          Complete Harvest
        </button>
      </div>
    </div>
  )
}
