import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyHistoryMutations, decodeHistory, formatHistoryTime, HISTORY_KEY, loadHistory, saveHistory } from './historyStorage'
import { johor } from '../test/weatherFixtures'

const event = (id = 'one', completedAt = '2026-10-03T04:00:00.000Z') => ({ id, location: johor, completedAt })
const encode = (records: unknown[], version = 1) => JSON.stringify({ version, records })
afterEach(() => vi.restoreAllMocks())

describe('history trust boundary', () => {
  it.each([null, encode([])])('accepts empty storage: %s', raw => {
    expect(decodeHistory(raw)).toEqual({ records: [], warning: '' })
  })
  it.each(['{broken', 'null', '[]', '{}', encode([event()], 2), JSON.stringify({ version: 1, records: {} })])(
    'warns on malformed/unsupported envelopes: %s', raw => {
      const state = decodeHistory(raw)
      expect(state.records).toEqual([])
      expect(state.warning).toContain('could not be restored')
    })
  it.each([
    null, {}, { ...event(), id: '' }, { ...event(), completedAt: 'not-a-date' },
    { ...event(), completedAt: '2026-02-30T04:00:00.000Z' },
    { ...event(), location: { ...johor, latitude: 91 } },
    { ...event(), location: { ...johor, longitude: '103' } },
    { ...event(), location: { ...johor, countryCode: 'XX' } },
    { ...event(), location: { ...johor, city: ' ' } },
    { ...event(), location: { ...johor, state: 7 } },
  ])('salvages valid entries without trusting invalid record %#', invalid => {
    const state = decodeHistory(encode([invalid, event('valid')]))
    expect(state.records).toEqual([event('valid')])
    expect(state.warning).not.toBe('')
  })
  it('keeps repeated locations with distinct IDs, deterministic ties, and no five-row cap', () => {
    const records = Array.from({ length: 8 }, (_, index) => event(String(index)))
    expect(decodeHistory(encode(records)).records).toEqual(records)
    const duplicate = decodeHistory(encode([event(), event(), event('other')]))
    expect(duplicate.records.map(row => row.id)).toEqual(['one', 'other'])
    expect(duplicate.warning).not.toBe('')
  })
  it('preserves saved order across clock rollback and strips unrecognized/sensitive fields', () => {
    const raw = encode([{ ...event('old'), apiKey: 'not-a-real-key', weather: {},
      location: { ...johor, unexpected: 'discard' } }, event('new', '2026-10-03T05:00:00.000Z')])
    const state = decodeHistory(raw)
    expect(state.records).toEqual([event('old'), event('new', '2026-10-03T05:00:00.000Z')])
    expect(JSON.stringify(state)).not.toContain('not-a-real-key')
    expect(JSON.stringify(state)).not.toContain('unexpected')
  })
  it('catches denied property access, denied reads, and failed writes', () => {
    const getter = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new DOMException('', 'SecurityError') })
    expect(loadHistory().warning).toContain('only for this session')
    expect(saveHistory([event()])).toContain('only for this session')
    getter.mockRestore()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('', 'SecurityError') })
    expect(loadHistory().records).toEqual([])
    expect(loadHistory().warning).toContain('unavailable')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('', 'QuotaExceededError') })
    expect(saveHistory([event()])).toContain('unavailable')
  })
  it('writes only the versioned history key and formats browser-local labeled time', () => {
    localStorage.setItem('unrelated', 'preserve')
    expect(saveHistory([event()])).toBe('')
    expect(JSON.parse(localStorage.getItem(HISTORY_KEY)!)).toEqual({ version: 1, records: [event()] })
    expect(localStorage.getItem('unrelated')).toBe('preserve')
    expect(formatHistoryTime(event().completedAt)).toBe(new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZoneName: 'short',
    }).format(new Date(event().completedAt)))
  })
  it('retries ID mutations without duplicating, moving, or resurrecting existing records', () => {
    const first = event('first')
    const second = event('second')
    expect(applyHistoryMutations([second, first], [{ type: 'append', event: first }])).toEqual([second, first])
    expect(applyHistoryMutations([first], [
      { type: 'append', event: second }, { type: 'remove', id: first.id }, { type: 'remove', id: first.id },
    ])).toEqual([second])
    expect(applyHistoryMutations([], [{ type: 'append', event: first }, { type: 'remove', id: first.id }])).toEqual([])
  })
})
