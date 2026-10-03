import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useWeatherSearch } from './useWeatherSearch'
import type { WeatherService } from '../services/weather'
import { WeatherError } from '../services/errors'
import { parseWeather } from '../helpers/weatherData'
import { deferred, fullWeather, johor, singapore } from '../test/weatherFixtures'
import type { Location, Weather } from '../types/weather'

afterEach(() => vi.useRealTimers())

describe('query ownership', () => {
  it.each(['success', 'error'] as const)('ignores old geocoding %s while a replacement loads', async (outcome) => {
    const old = deferred<Location[]>()
    const newer = deferred<Location[]>()
    const service: WeatherService = { findLocations: vi.fn().mockReturnValueOnce(old.promise).mockReturnValueOnce(newer.promise),
      getWeather: vi.fn().mockResolvedValue(parseWeather(fullWeather(), singapore)) }
    const { result } = renderHook(() => useWeatherSearch(service))
    act(() => result.current.change('Johor'))
    let first!: Promise<void>
    act(() => { first = result.current.search() })
    act(() => { result.current.clear(); result.current.change('Singapore') })
    let second!: Promise<void>
    act(() => { second = result.current.search() })
    await act(async () => {
      if (outcome === 'success') old.resolve([johor])
      else old.reject(new WeatherError('Old error'))
      await first
    })
    expect(result.current.loading).toBe(true)
    expect(result.current.state.message).toBe('Finding locations...')
    expect(service.getWeather).not.toHaveBeenCalled()
    await act(async () => { newer.resolve([singapore]); await second })
    expect(result.current.state.weather?.location).toEqual(singapore)
  })
  it.each(['success', 'error'] as const)('ignores old weather %s after replacement success', async (outcome) => {
    const old = deferred<Weather>()
    const service: WeatherService = { findLocations: vi.fn().mockResolvedValue([johor]),
      getWeather: vi.fn().mockReturnValueOnce(old.promise).mockResolvedValueOnce(parseWeather(fullWeather(), singapore)) }
    const { result } = renderHook(() => useWeatherSearch(service))
    act(() => result.current.change('Johor'))
    let first!: Promise<void>
    await act(async () => { first = result.current.search(); await Promise.resolve() })
    act(() => { result.current.clear(); result.current.change('Singapore') })
    await act(async () => { await result.current.search() })
    await act(async () => {
      if (outcome === 'success') old.resolve(parseWeather(fullWeather(), johor))
      else old.reject(new WeatherError('Old error'))
      await first
    })
    expect(result.current.state.weather?.location).toEqual(singapore)
    expect(result.current.loading).toBe(false)
    expect(result.current.state.message).not.toContain('Old')
  })
  it('locks selection synchronously and rejects stale candidates', async () => {
    const pending = deferred<Weather>()
    const service: WeatherService = { findLocations: vi.fn().mockResolvedValue([johor, singapore]), getWeather: vi.fn(() => pending.promise) }
    const { result } = renderHook(() => useWeatherSearch(service))
    act(() => result.current.change('City'))
    await act(async () => { await result.current.search() })
    act(() => {
      expect(result.current.select(singapore)).toBe(true)
      expect(result.current.select(singapore)).toBe(false)
      expect(result.current.select(johor)).toBe(false)
      void result.current.search()
      result.current.change('ignored edit')
    })
    expect(service.getWeather).toHaveBeenCalledTimes(1)
    expect(service.findLocations).toHaveBeenCalledTimes(1)
    expect(result.current.input).toBe('City')
    act(() => result.current.clear())
    act(() => expect(result.current.select(singapore)).toBe(false))
    await act(async () => pending.resolve(parseWeather(fullWeather(), singapore)))
    expect(result.current.state.weather).toBeNull()
  })
  it('keeps candidate waiting untimed and invalidates on edits/replacement', async () => {
    vi.useFakeTimers()
    const service: WeatherService = { findLocations: vi.fn().mockResolvedValue([johor, singapore]), getWeather: vi.fn() }
    const { result } = renderHook(() => useWeatherSearch(service))
    act(() => result.current.change('City'))
    await act(async () => { await result.current.search() })
    await act(async () => vi.advanceTimersByTimeAsync(60_000))
    expect(result.current.state.phase).toBe('choosing')
    act(() => result.current.change('City new'))
    act(() => expect(result.current.select(johor)).toBe(false))
    expect(service.getWeather).not.toHaveBeenCalled()
    await act(async () => { await result.current.search() })
    act(() => result.current.change('Johor,'))
    await act(async () => { await result.current.search() })
    expect(result.current.state.invalid).toBe(true)
    expect(result.current.state.candidates).toEqual([])
    expect(service.findLocations).toHaveBeenCalledTimes(2)
  })
  it('aborts on unmount and discards late results', async () => {
    const pending = deferred<Location[]>()
    const find = vi.fn<WeatherService['findLocations']>(() => pending.promise)
    const service: WeatherService = { findLocations: find, getWeather: vi.fn() }
    const { result, unmount } = renderHook(() => useWeatherSearch(service))
    act(() => result.current.change('Johor'))
    let request!: Promise<void>
    act(() => { request = result.current.search() })
    unmount()
    expect(find.mock.calls[0]?.[1].aborted).toBe(true)
    await act(async () => { pending.resolve([johor]); await request })
    expect(service.getWeather).not.toHaveBeenCalled()
  })
})
