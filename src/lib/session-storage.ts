// src/lib/session-storage.ts
// Bridge between legacy session storage API and tauriBridge

import { tauriBridge } from './tauri-bridge'
import type { SessionRecord, ReflectionObject } from './tauri-types'

// Re-export types for backwards compatibility
export type { SessionRecord, ReflectionObject } from './tauri-types'

/**
 * Save a reflection to storage
 */
export async function saveReflection(reflection: ReflectionObject): Promise<void> {
  await tauriBridge.saveReflection(reflection)
}

/**
 * Get a reflection by session ID
 */
export async function getReflection(sessionId: string): Promise<ReflectionObject | null> {
  return tauriBridge.getReflection(sessionId)
}

/**
 * Save a session to storage
 */
export async function saveSession(session: SessionRecord): Promise<void> {
  await tauriBridge.saveSession(session)
}

/**
 * Get a session by ID
 */
export async function getSession(sessionId: string): Promise<SessionRecord | null> {
  return tauriBridge.getSession(sessionId)
}

/**
 * Get all sessions, optionally filtered by date range
 */
export async function getAllSessions(
  startDate?: string, 
  endDate?: string
): Promise<SessionRecord[]> {
  return tauriBridge.getAllSessions(startDate, endDate)
}

/**
 * Get the most recent session
 */
export async function getLatestSession(): Promise<SessionRecord | null> {
  const sessions = await tauriBridge.getAllSessions()
  if (sessions.length === 0) return null
  // Sessions are ordered by started_at DESC from backend
  return sessions[0]
}

/**
 * Generate a new session ID
 */
export async function generateSessionId(): Promise<string> {
  return tauriBridge.generateUuid()
}

/**
 * Create a new session record with defaults
 */
export function createSessionRecord(params: {
  mode: 'Zen' | 'Flow' | 'Legend'
  plannedDurationMinutes: number
  intention?: string
}): SessionRecord {
  return {
    sessionId: '', // Will be set by caller using generateSessionId()
    startedAt: new Date().toISOString(),
    endedAt: null,
    plannedDurationMinutes: params.plannedDurationMinutes,
    actualDurationMinutes: null,
    mode: params.mode,
    intention: params.intention || null,
    victoryLevel: null,
    flowEfficiency: null,
    longestStreakMinutes: 0,
    distractionAttempts: 0,
    interventionsUsed: 0,
    endReason: null,
    endSubReason: null,
    timelineBlocks: [],
    distractionEvents: [],
    interventionEvents: [],
    whitelistedApps: [],
    whitelistedTabs: [],
  }
}
