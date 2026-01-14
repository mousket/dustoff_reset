
import { useState, useEffect } from "react"
import {
  getActiveParkingLotItems,
  addParkingLotItem,
  editParkingLotItemText,
  deleteParkingLotItem,
  completeParkingLotItem,
  type ParkingLotItemFull,
} from "@/lib/parking-lot-storage"
import { updateParkingLotItemStatus } from "@/lib/parking-lot-storage"
import type { ParkingLotManagementPanelProps } from "./types"
import { EmeraldStatusSelect } from "@/components/ui/EmeraldSelect"

export function ParkingLotManagementPanel({ isOpen, onClose, onItemsChange }: ParkingLotManagementPanelProps) {
  const [items, setItems] = useState<ParkingLotItemFull[]>([])
  const [newItemText, setNewItemText] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")

  useEffect(() => {
    if (isOpen) {
      const loadedItems = getActiveParkingLotItems()
      setItems(loadedItems)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleAdd = () => {
    if (newItemText.trim()) {
      addParkingLotItem(newItemText.trim())
      setNewItemText("")
      if (onItemsChange) onItemsChange()
      const loadedItems = getActiveParkingLotItems()
      setItems(loadedItems)
    }
  }

  const handleStartEdit = (id: string, text: string) => {
    setEditingId(id)
    setEditText(text)
  }

  const handleSaveEdit = () => {
    if (editingId && editText.trim()) {
      editParkingLotItemText(editingId, editText.trim())
      setEditingId(null)
      setEditText("")
      if (onItemsChange) onItemsChange()
      const loadedItems = getActiveParkingLotItems()
      setItems(loadedItems)
    }
  }

  const handleDelete = (id: string) => {
    deleteParkingLotItem(id)
    if (onItemsChange) onItemsChange()
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleStatusChange = (id: string, status: "new" | "in-progress" | "done") => {
    if (status === "done") {
      completeParkingLotItem(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
    } else {
      updateParkingLotItemStatus(id, status)
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, itemStatus: status } : item)))
    }
    if (onItemsChange) onItemsChange()
  }

  return (
    <div className="w-[380px] rounded-3xl bg-[#0a0f0d]/55 backdrop-blur-xl border border-emerald-500/30 shadow-2xl overflow-hidden">
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm text-emerald-400 uppercase tracking-wider">PARKING LOT</h3>
            <p className="text-xs text-zinc-400 mt-1">manage your captured thoughts</p>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors text-xs"
          >
            ✕
          </button>
        </div>

        {/* Add New Item */}
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd()
          }}
          placeholder="Type a thought, task, or idea... (Press Enter)"
          className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
        />

        {/* Items List - Option 3 Design */}
        {items.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Your Items</div>
            <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-start gap-2 px-3 py-2 bg-zinc-900/40 border border-zinc-800/50 rounded-lg hover:bg-zinc-900/60 transition-all"
                >
                  {/* Status Dropdown */}
                  <EmeraldStatusSelect
                    value={item.itemStatus || "new"}
                    onChange={(val) => handleStatusChange(item.id, val as "new" | "in-progress" | "done")}
                    options={[
                      { value: "new", label: "New" },
                      { value: "in-progress", label: "In Progress" },
                      { value: "done", label: "Done" },
                    ]}
                  />

                  {/* Item Text */}
                  <div className="flex-1 min-w-0">
                    {editingId === item.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit()
                            if (e.key === "Escape") setEditingId(null)
                          }}
                          className="w-full px-2 py-1 bg-zinc-800/60 border border-zinc-700/50 rounded text-xs text-white focus:outline-none focus:border-emerald-500/50"
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={handleSaveEdit}
                            className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded text-xs text-emerald-400 transition-colors"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 bg-zinc-800/60 hover:bg-zinc-700 rounded text-xs text-zinc-400 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-300 break-words">{item.text}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {editingId !== item.id && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(item.id, item.text)}
                        className="p-1.5 rounded hover:bg-zinc-800/60 text-cyan-400 hover:text-cyan-300 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded hover:bg-zinc-800/60 text-red-400 hover:text-red-300 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="py-6 text-center">
            <p className="text-xs text-zinc-500">No items in parking lot yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
