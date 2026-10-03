import { useRef, type RefObject } from 'react'
import { formatHistoryTime, type HistoryEvent } from '../helpers/historyStorage'

type Props = {
  records: HistoryEvent[]
  loading: boolean
  replayId: string | null
  input: RefObject<HTMLInputElement | null>
  onReplay: (event: HistoryEvent) => void
  onDelete: (id: string) => void
}

export default function SearchHistory({ records, loading, replayId, input, onReplay, onDelete }: Props) {
  const list = useRef<HTMLUListElement>(null)

  function remove(event: HistoryEvent, index: number) {
    const rows = list.current?.children
    const row = rows?.[index]
    if (row?.contains(document.activeElement)) {
      const action = (document.activeElement as HTMLElement).dataset.action ?? 'delete'
      const neighbor = rows?.[index + 1] ?? rows?.[index - 1]
      const next = neighbor?.querySelector<HTMLButtonElement>(`button[data-action="${action}"]`)
      if (next && !next.disabled) next.focus()
      else input.current?.focus()
    }
    onDelete(event.id)
  }

  return (
    <section aria-labelledby="history-heading" className="search-history">
      <h2 id="history-heading">Search History</h2>
      {records.length === 0 ? <p>No Record</p> : (
        <ul ref={list} className="history-list">
          {records.map((event, index) => {
            const label = `${event.location.city}, ${event.location.countryCode}`
            const replaying = loading && replayId === event.id
            return (
              <li key={event.id} data-history-id={event.id} className="history-row">
                <div className="history-details">
                  <span>{label}</span>
                  {event.location.state && <small>{event.location.state}</small>}
                  <time dateTime={event.completedAt}>{formatHistoryTime(event.completedAt)}</time>
                </div>
                <div className="history-actions">
                  <button type="button" data-action="replay" disabled={loading}
                    aria-label={`Search again for ${label}`} onClick={() => onReplay(event)}>
                    {replaying && <span className="search-indicator" aria-hidden="true" />}
                    {replaying ? 'Searching...' : 'Search again'}
                  </button>
                  <button type="button" data-action="delete" aria-label={`Delete record for ${label}`}
                    onClick={() => remove(event, index)}>Delete</button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
