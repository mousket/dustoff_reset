// src/lib/parking-lot-storage.ts
// Bridge between legacy storage API and tauriBridge

import { tauriBridge } from './tauri-bridge'
import type { ParkingLotItem } from './tauri-types'

// Full item type for UI components (matches panel expectations)
export interface ParkingLotItemFull {
  id: string
  text: string
  timestamp: number
  status: 'OPEN' | 'COMPLETED' | 'DELETED'
  itemStatus?: 'new' | 'in-progress' | 'done'
  category?: 'task' | 'idea' | 'reminder' | 'distraction'
  tags: string[]
  action?: 'next-session' | 'keep' | 'delete'
  sessionId?: string | null
  createdAt: string
  updatedAt: string
}

// Convert from Tauri type to full UI type
function convertToFull(item: ParkingLotItem): ParkingLotItemFull {
  const dateStr = new Date(item.timestamp).toISOString()
  return {
    id: item.id,
    text: item.text,
    timestamp: item.timestamp,
    status: item.status as 'OPEN' | 'COMPLETED' | 'DELETED',
    itemStatus: item.itemStatus as 'new' | 'in-progress' | 'done' | undefined,
    category: item.category as 'task' | 'idea' | 'reminder' | 'distraction' | undefined,
    tags: item.tags || [],
    action: item.action as 'next-session' | 'keep' | 'delete' | undefined,
    sessionId: item.sessionId,
    createdAt: dateStr,
    updatedAt: dateStr,
  }
}

// Cache for synchronous access (populated asynchronously)
let cachedItems: ParkingLotItemFull[] = []

// Initialize cache
async function refreshCache(): Promise<ParkingLotItemFull[]> {
  try {
    const items = await tauriBridge.getActiveParkingLotItems()
    cachedItems = items.map(convertToFull)
    return cachedItems
  } catch (error) {
    console.error('Failed to refresh parking lot cache:', error)
    return cachedItems
  }
}

// Start loading on import
refreshCache()

/**
 * Get all active parking lot items (synchronous, uses cache)
 * Note: Returns cached data. Call refreshParkingLotCache() to update.
 */
export function getActiveParkingLotItems(): ParkingLotItemFull[] {
  return cachedItems
}

/**
 * Refresh the parking lot cache from Tauri
 */
export async function refreshParkingLotCache(): Promise<ParkingLotItemFull[]> {
  return refreshCache()
}

/**
 * Add a new parking lot item
 */
export async function addParkingLotItem(text: string): Promise<ParkingLotItemFull> {
  const item = await tauriBridge.addParkingLotItem(text)
  await refreshCache()
  return convertToFull(item)
}

/**
 * Update a parking lot item (general update)
 */
export async function updateParkingLotItem(
  id: string, 
  updates: { 
    text?: string
    status?: 'OPEN' | 'COMPLETED' | 'DELETED'
    itemStatus?: 'new' | 'in-progress' | 'done'
    action?: 'next-session' | 'keep' | 'delete'
    category?: 'task' | 'idea' | 'reminder' | 'distraction'
    tags?: string[]
  }
): Promise<void> {
  await tauriBridge.updateParkingLotItem(id, updates)
  await refreshCache()
}

/**
 * Edit parking lot item text
 */
export async function editParkingLotItemText(id: string, text: string): Promise<void> {
  await tauriBridge.updateParkingLotItem(id, { text })
  await refreshCache()
}

/**
 * Update parking lot item status (new/in-progress/done)
 */
export async function updateParkingLotItemStatus(
  id: string, 
  itemStatus: 'new' | 'in-progress' | 'done'
): Promise<void> {
  await tauriBridge.updateParkingLotItem(id, { itemStatus })
  await refreshCache()
}

/**
 * Complete a parking lot item (sets status to COMPLETED)
 */
export async function completeParkingLotItem(id: string): Promise<void> {
  await tauriBridge.updateParkingLotItem(id, { 
    status: 'COMPLETED',
    itemStatus: 'done'
  })
  await refreshCache()
}

/**
 * Delete a parking lot item
 */
export async function deleteParkingLotItem(id: string): Promise<void> {
  await tauriBridge.deleteParkingLotItem(id)
  await refreshCache()
}

/**
 * Get items marked for next session
 */
export async function getNextSessionItems(): Promise<ParkingLotItemFull[]> {
  const items = await tauriBridge.getNextSessionItems()
  return items.map(convertToFull)
}

/**
 * Mark item for next session
 */
export async function markForNextSession(id: string): Promise<void> {
  await tauriBridge.updateParkingLotItem(id, { action: 'next-session' })
  await refreshCache()
}

/**
 * Keep item (remove next-session action)
 */
export async function keepItem(id: string): Promise<void> {
  await tauriBridge.updateParkingLotItem(id, { action: 'keep' })
  await refreshCache()
}

/**
 * Set item category
 */
export async function setItemCategory(
  id: string, 
  category: 'task' | 'idea' | 'reminder' | 'distraction'
): Promise<void> {
  await tauriBridge.updateParkingLotItem(id, { category })
  await refreshCache()
}
