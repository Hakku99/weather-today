import { useCallback, useEffect, useRef, useState } from 'react'
import {
  applyHistoryMutations, HISTORY_KEY, HISTORY_SAVING, HISTORY_UNAVAILABLE, loadHistory, saveHistory,
  type HistoryEvent, type HistoryMutation,
} from '../helpers/historyStorage'
import type { Location } from '../types/weather'

export function useHistory() {
  // Read only on initialization; never write an empty list during mount/StrictMode replay.
  const [state, setState] = useState(loadHistory)
  const current = useRef(state)
  const pending = useRef<HistoryMutation[]>([])
  const mounted = useRef(false)
  const lockRequests = useRef(new Set<AbortController>())

  const publish = useCallback((next: typeof state) => {
    current.current = next
    if (mounted.current) setState(next)
  }, [])

  useEffect(() => {
    mounted.current = true
    const requests = lockRequests.current
    function restore(event: StorageEvent) {
      if (current.current.readFailed || (event.key !== HISTORY_KEY && event.key !== null)) return
      try { if (event.storageArea !== window.localStorage) return }
      catch { publish({ ...current.current, warning: HISTORY_UNAVAILABLE }); return }
      // Read the latest value instead of replaying potentially delayed event snapshots.
      const saved = loadHistory()
      if (saved.readFailed) { publish({ ...current.current, warning: HISTORY_UNAVAILABLE }); return }
      publish({ ...saved, records: applyHistoryMutations(saved.records, pending.current),
        warning: pending.current.length ? current.current.warning : saved.warning })
    }
    window.addEventListener('storage', restore)
    return () => {
      mounted.current = false
      for (const request of requests) request.abort()
      window.removeEventListener('storage', restore)
    }
  }, [publish])

  const persist = useCallback(async (mutations: HistoryMutation[]) => {
    if (current.current.readFailed) return
    const controller = new AbortController()
    lockRequests.current.add(controller)
    // Another suspended tab must not leave saving feedback pending indefinitely.
    const timeout = setTimeout(() => controller.abort(), 2_000)
    try {
      if (!navigator.locks?.request) throw new Error('History locking unavailable')
      await navigator.locks.request(HISTORY_KEY, { signal: controller.signal }, () => {
        if (!mounted.current) return
        // Each action has its own queue position, preserving interleaved tab order.
        const batch = pending.current.filter(mutation => mutations.includes(mutation))
        if (!batch.length) return
        const saved = loadHistory()
        if (saved.readFailed) { publish({ ...current.current, warning: HISTORY_UNAVAILABLE }); return }
        const records = applyHistoryMutations(saved.records, batch)
        const warning = saveHistory(records)
        if (!warning) pending.current = pending.current.filter(mutation => !batch.includes(mutation))
        publish({ ...saved, records: applyHistoryMutations(records, pending.current),
          warning: warning || (pending.current.length ? HISTORY_SAVING : '') })
      })
    } catch {
      if (mounted.current && pending.current.some(mutation => mutations.includes(mutation))) {
        publish({ ...current.current, warning: HISTORY_UNAVAILABLE })
      }
    } finally {
      clearTimeout(timeout)
      lockRequests.current.delete(controller)
    }
  }, [publish])

  function commit(mutation: HistoryMutation) {
    pending.current = [...pending.current, mutation]
    publish({ ...current.current, records: applyHistoryMutations(current.current.records, [mutation]),
      warning: current.current.readFailed ? current.current.warning : HISTORY_SAVING })
    // A failed initial read must never overwrite unseen saved records.
    void persist(pending.current)
  }

  function append(location: Location) {
    const event: HistoryEvent = {
      id: crypto.randomUUID(), location: { ...location }, completedAt: new Date().toISOString(),
    }
    commit({ type: 'append', event })
  }

  function remove(id: string) {
    if (current.current.records.some(event => event.id === id)) commit({ type: 'remove', id })
  }

  return { ...state, append, remove }
}
