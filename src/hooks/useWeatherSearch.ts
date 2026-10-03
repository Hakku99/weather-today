import { useEffect, useRef, useState } from 'react'
import { parseSearchQuery } from '../helpers/parseSearchQuery'
import { RequestCancelled, WeatherError } from '../services/errors'
import type { WeatherService } from '../services/weather'
import type { Location, Weather } from '../types/weather'

type SearchState = {
  phase: 'idle' | 'loading' | 'choosing' | 'success' | 'error'
  message: string
  invalid: boolean
  weather: Weather | null
  candidates: Location[]
}
type Query = { controller: AbortController; busy: boolean; candidates: Location[] }
const initial: SearchState = { phase: 'idle', message: '', invalid: false, weather: null, candidates: [] }

export function useWeatherSearch(service: WeatherService) {
  const [input, setInput] = useState('')
  const [state, setState] = useState(initial)
  const active = useRef<Query | null>(null)

  function invalidate() {
    const old = active.current
    active.current = null
    old?.controller.abort()
  }

  useEffect(() => () => {
    const old = active.current
    active.current = null
    old?.controller.abort()
  }, [service])

  function fail(query: Query, error: unknown) {
    if (active.current !== query) return
    active.current = null
    setState(error instanceof RequestCancelled ? initial : {
      ...initial, phase: 'error', message: error instanceof WeatherError ? error.message : 'Unable to complete the search. Please try again.',
    })
  }

  async function fetchWeather(query: Query, location: Location) {
    if (active.current !== query) return
    query.busy = true
    query.candidates = []
    setState({ ...initial, phase: 'loading', message: `Fetching weather for ${location.city}, ${location.countryCode}...` })
    try {
      const weather = await service.getWeather(location, query.controller.signal)
      if (active.current !== query) return
      active.current = null
      setState({ ...initial, phase: 'success', weather, message: `Weather loaded for ${location.city}, ${location.countryCode}.${weather.partial ? ' Some weather details are unavailable.' : ''}` })
    } catch (error) { fail(query, error) }
  }

  async function search() {
    // Lock synchronously, before React rerenders, to block rapid submissions.
    if (active.current?.busy) return
    invalidate()
    const parsed = parseSearchQuery(input)
    if (!parsed.ok) {
      setState({ ...initial, phase: 'error', invalid: true, message: parsed.error })
      return
    }
    const query: Query = { controller: new AbortController(), busy: true, candidates: [] }
    active.current = query
    setState({ ...initial, phase: 'loading', message: 'Finding locations...' })
    try {
      const locations = await service.findLocations(parsed.query, query.controller.signal)
      if (active.current !== query) return
      const only = locations.length === 1 ? locations[0] : undefined
      if (only) await fetchWeather(query, only)
      else {
        query.busy = false
        query.candidates = locations
        setState({ ...initial, phase: 'choosing', candidates: locations, message: 'Choose a location. Select a matching city and country below.' })
      }
    } catch (error) { fail(query, error) }
  }

  function select(location: Location): boolean {
    const query = active.current
    if (!query || query.busy || !query.candidates.includes(location)) return false
    void fetchWeather(query, location)
    return true
  }

  function change(value: string) {
    if (active.current?.busy) return
    setInput(value)
    if (active.current) {
      invalidate()
      setState(initial)
    } else {
      setState((previous) => ({
        ...previous,
        message: previous.phase === 'success' ? previous.message : '',
        invalid: false,
      }))
    }
  }

  function clear() {
    invalidate()
    setInput('')
    setState(initial)
  }

  return { input, state, search, select, change, clear, loading: state.phase === 'loading' }
}
