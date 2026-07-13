// src/hooks/useCalendar.ts
// Calendar awareness: polls upcoming events (read-only, local) and exposes
// the next event with a live minutes-until countdown.
//
// Fails quiet by design: if the user declines the macOS Automation
// permission (or has no events), the hook reports null and stops nagging.

import { useState, useEffect, useRef, useCallback } from 'react'
import { tauriBridge, CalendarEvent } from '@/lib/tauri-bridge'

const POLL_INTERVAL_MS = 5 * 60 * 1000 // matches the Rust-side cache TTL
const TICK_INTERVAL_MS = 30 * 1000     // recompute minutes-until locally

/** Parse AppleScript «class isot» timestamps (usually zone-less = local). */
function parseEventTime(iso: string): Date | null {
  const date = new Date(iso)
  return isNaN(date.getTime()) ? null : date
}

export interface NextEventInfo {
  title: string
  calendar: string
  startsAt: Date
  minutesUntil: number
}

interface UseCalendarProps {
  enabled: boolean
}

export function useCalendar({ enabled }: UseCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [nextEvent, setNextEvent] = useState<NextEventInfo | null>(null)
  const [isAvailable, setIsAvailable] = useState(true)
  const failureCount = useRef(0)

  const refresh = useCallback(async () => {
    try {
      const upcoming = await tauriBridge.getUpcomingEvents(12)
      failureCount.current = 0
      setIsAvailable(true)
      setEvents(upcoming)
    } catch (error) {
      failureCount.current += 1
      console.log('[Calendar] Query failed:', error)
      // Two consecutive failures (e.g. permission denied) → stop polling quietly
      if (failureCount.current >= 2) {
        setIsAvailable(false)
      }
    }
  }, [])

  // Poll while enabled
  useEffect(() => {
    if (!enabled || !isAvailable) return
    refresh()
    const interval = setInterval(refresh, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [enabled, isAvailable, refresh])

  // Recompute the next upcoming event and its countdown
  useEffect(() => {
    const compute = () => {
      const now = Date.now()
      const upcoming = events
        .map(e => ({ event: e, start: parseEventTime(e.startIso) }))
        .filter((x): x is { event: CalendarEvent; start: Date } => x.start !== null && x.start.getTime() > now)
        .sort((a, b) => a.start.getTime() - b.start.getTime())

      if (upcoming.length === 0) {
        setNextEvent(null)
        return
      }
      const { event, start } = upcoming[0]
      setNextEvent({
        title: event.title,
        calendar: event.calendar,
        startsAt: start,
        minutesUntil: Math.round((start.getTime() - now) / 60000),
      })
    }

    compute()
    const tick = setInterval(compute, TICK_INTERVAL_MS)
    return () => clearInterval(tick)
  }, [events])

  return { nextEvent, isAvailable, refresh }
}
