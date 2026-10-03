import { afterEach, describe, expect, it, vi } from 'vitest'
import { createWeatherService } from './weather'
import { RequestCancelled } from './errors'
import { deferred, fullWeather, johor, locationPayload } from '../test/weatherFixtures'

afterEach(() => vi.useRealTimers())
const signal = () => new AbortController().signal
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status })

describe('OpenWeather requests', () => {
  it('encodes city/country and fetches coordinate-based weather in Celsius', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(json([locationPayload(johor)])).mockResolvedValueOnce(json(fullWeather()))
    const service = createWeatherService({ apiKey: 'fixture-only', fetcher })
    await expect(service.findLocations({ city: 'Kuala Lumpur', countryCode: 'MY' }, signal())).resolves.toEqual([johor])
    await service.getWeather(johor, signal())
    const geo = new URL(String(fetcher.mock.calls[0]?.[0]))
    expect(geo.origin).toBe('https://api.openweathermap.org')
    expect(geo.pathname).toBe('/geo/1.0/direct')
    expect(geo.searchParams.get('q')).toBe('Kuala Lumpur,MY')
    expect(geo.searchParams.get('limit')).toBe('5')
    const weather = new URL(String(fetcher.mock.calls[1]?.[0]))
    expect(weather.pathname).toBe('/data/2.5/weather')
    expect(weather.searchParams.get('lat')).toBe('1.4927')
    expect(weather.searchParams.get('lon')).toBe('103.7414')
    expect(weather.searchParams.get('units')).toBe('metric')
    expect(weather.searchParams.has('q')).toBe(false)
  })
  it('rejects missing configuration and invalid locations before fetching', async () => {
    const fetcher = vi.fn<typeof fetch>()
    const service = createWeatherService({ apiKey: '', fetcher })
    await expect(service.findLocations({ city: 'Johor' }, signal())).rejects.toThrow('not configured')
    await expect(service.getWeather({ ...johor, longitude: 181 }, signal())).rejects.toThrow('invalid data')
    expect(fetcher).not.toHaveBeenCalled()
  })
  it.each([[401, 'API key'], [403, 'API key'], [404, 'No weather'], [429, 'limit reached'], [500, 'temporarily unavailable'], [503, 'temporarily unavailable'], [400, 'could not process']])('handles HTTP %s with sanitized guidance', async (status, message) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ message: '<secret provider detail>' }, Number(status)))
    const service = createWeatherService({ apiKey: 'fixture-only', fetcher })
    await expect(service.findLocations({ city: 'Johor' }, signal())).rejects.toThrow(String(message))
  })
  it('handles offline and malformed JSON without exposing request details', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValueOnce(new Error('secret URL')).mockResolvedValueOnce(new Response('{broken'))
    const service = createWeatherService({ apiKey: 'fixture-only', fetcher })
    await expect(service.findLocations({ city: 'Johor' }, signal())).rejects.toThrow('Check your connection')
    await expect(service.findLocations({ city: 'Johor' }, signal())).rejects.toThrow('invalid data')
  })
  it('times out through stalled body processing and aborts the transport', async () => {
    vi.useFakeTimers()
    const body = deferred<unknown>()
    const response = { ok: true, json: () => body.promise } as Response
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response)
    const promise = createWeatherService({ apiKey: 'fixture-only', fetcher, timeoutMs: 50 }).findLocations({ city: 'Johor' }, signal())
    const assertion = expect(promise).rejects.toThrow('timed out')
    await vi.advanceTimersByTimeAsync(50)
    await assertion
    expect(fetcher.mock.calls[0]?.[1]?.signal?.aborted).toBe(true)
    body.resolve([])
  })
  it('cancels before headers and after headers even if the transport ignores abort', async () => {
    for (const afterHeaders of [false, true]) {
      const waiting = deferred<unknown>()
      const response = { ok: true, json: () => waiting.promise } as Response
      const fetcher = vi.fn<typeof fetch>()
      if (afterHeaders) fetcher.mockResolvedValue(response)
      else fetcher.mockImplementation(async () => { await waiting.promise; return json([]) })
      const controller = new AbortController()
      const request = createWeatherService({ apiKey: 'fixture-only', fetcher }).findLocations({ city: 'Johor' }, controller.signal)
      const assertion = expect(request).rejects.toBeInstanceOf(RequestCancelled)
      await Promise.resolve()
      controller.abort()
      await assertion
      waiting.resolve([])
    }
  })
})
