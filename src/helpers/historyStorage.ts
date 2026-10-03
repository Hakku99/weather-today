import { finite, record, validLocation } from './weatherData'
import type { Location } from '../types/weather'

export type HistoryEvent = { id: string; location: Location; completedAt: string }
export type HistoryState = { records: HistoryEvent[]; warning: string }
export type HistoryMutation = { type: 'append'; event: HistoryEvent } | { type: 'remove'; id: string }
export const HISTORY_KEY = 'weather-today.history'
export const HISTORY_UNAVAILABLE = 'History storage is unavailable. Changes are kept only for this session and may be lost on refresh.'
export const HISTORY_SAVING = 'Saving history changes. Keep this page open until saving finishes.'
const damaged = 'Some saved history could not be restored. Weather search is still available.'

function parseEvent(value: unknown): HistoryEvent | null {
  const data = record(value)
  const source = record(data.location)
  if (typeof data.id !== 'string' || !data.id.trim()
    || typeof data.completedAt !== 'string') return null
  const date = new Date(data.completedAt)
  if (!finite(date.getTime()) || date.toISOString() !== data.completedAt) return null
  if (typeof source.city !== 'string' || typeof source.countryCode !== 'string'
    || !finite(source.latitude) || !finite(source.longitude)
    || (source.state !== undefined && (typeof source.state !== 'string' || !source.state.trim()))) return null
  const location: Location = {
    city: source.city.trim(), countryCode: source.countryCode,
    latitude: source.latitude, longitude: source.longitude,
    ...(typeof source.state === 'string' ? { state: source.state.trim() } : {}),
  }
  return validLocation(location) ? { id: data.id, location, completedAt: data.completedAt } : null
}

export function decodeHistory(raw: string | null): HistoryState {
  if (raw === null) return { records: [], warning: '' }
  try {
    const data = record(JSON.parse(raw))
    if (data.version !== 1 || !Array.isArray(data.records)) return { records: [], warning: damaged }
    const records: HistoryEvent[] = []
    const ids = new Set<string>()
    let rejected = false
    for (const value of data.records) {
      const event = parseEvent(value)
      if (!event || ids.has(event.id)) { rejected = true; continue }
      ids.add(event.id)
      records.push(event)
    }
    // The saved array owns event order; wall-clock changes must not reorder it.
    return { records, warning: rejected ? damaged : '' }
  } catch { return { records: [], warning: damaged } }
}

export function loadHistory(): HistoryState & { readFailed: boolean } {
  try { return { ...decodeHistory(window.localStorage.getItem(HISTORY_KEY)), readFailed: false } }
  catch { return { records: [], warning: HISTORY_UNAVAILABLE, readFailed: true } }
}

export function saveHistory(records: HistoryEvent[]): string {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify({ version: 1, records }))
    return ''
  } catch { return HISTORY_UNAVAILABLE }
}

export function applyHistoryMutations(records: HistoryEvent[], mutations: HistoryMutation[]): HistoryEvent[] {
  return mutations.reduce((current, mutation) => {
    if (mutation.type === 'remove') return current.filter(event => event.id !== mutation.id)
    // A retried append must not duplicate or move an event already saved.
    return current.some(event => event.id === mutation.event.id) ? current : [mutation.event, ...current]
  }, records)
}

export function formatHistoryTime(completedAt: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    hour12: true, timeZoneName: 'short',
  }).format(new Date(completedAt))
}
