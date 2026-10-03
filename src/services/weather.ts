import type { SearchQuery } from '../helpers/parseSearchQuery'
import { parseLocations, parseWeather, validLocation } from '../helpers/weatherData'
import type { Location, Weather } from '../types/weather'
import { invalidResponse, RequestCancelled, responseError, WeatherError } from './errors'

export type WeatherService = {
  findLocations: (query: SearchQuery, signal: AbortSignal) => Promise<Location[]>
  getWeather: (location: Location, signal: AbortSignal) => Promise<Weather>
}

type ServiceOptions = { apiKey?: string; fetcher?: typeof fetch; timeoutMs?: number }

export function createWeatherService(options: ServiceOptions = {}): WeatherService {
  const timeoutMs = options.timeoutMs ?? 15_000

  async function request(path: string, parameters: Record<string, string>, signal: AbortSignal): Promise<unknown> {
    const apiKey = (options.apiKey ?? import.meta.env.VITE_OPENWEATHER_API_KEY ?? '').trim()
    if (!apiKey) throw new WeatherError('Weather search is not configured. Set VITE_OPENWEATHER_API_KEY in .env.local and restart the app.')
    if (signal.aborted) throw new RequestCancelled()
    const url = new URL(path, 'https://api.openweathermap.org')
    url.search = new URLSearchParams({ ...parameters, appid: apiKey }).toString()
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    let cancel: () => void = () => {}
    const interrupted = new Promise<never>((_, reject) => {
      cancel = () => {
        controller.abort()
        reject(new RequestCancelled())
      }
      signal.addEventListener('abort', cancel, { once: true })
      timer = setTimeout(() => {
        controller.abort()
        reject(new WeatherError('The weather request timed out. Please try again.'))
      }, timeoutMs)
    })
    try {
      const work = (async () => {
        const response = await (options.fetcher ?? fetch)(url, { signal: controller.signal })
        if (!response.ok) throw responseError(response.status)
        try { return await response.json() as unknown } catch { throw invalidResponse() }
      })()
      return await Promise.race([work, interrupted])
    } catch (error) {
      if (error instanceof WeatherError || error instanceof RequestCancelled) throw error
      throw new WeatherError('Unable to connect to OpenWeather. Check your connection and try again.')
    } finally {
      clearTimeout(timer)
      signal.removeEventListener('abort', cancel)
    }
  }

  return {
    async findLocations(query, signal) {
      const q = query.countryCode ? `${query.city},${query.countryCode}` : query.city
      const data = await request('/geo/1.0/direct', { q, limit: '5' }, signal)
      if (signal.aborted) throw new RequestCancelled()
      return parseLocations(data, query.countryCode)
    },
    async getWeather(location, signal) {
      if (!validLocation(location)) throw invalidResponse()
      const data = await request('/data/2.5/weather', {
        lat: String(location.latitude), lon: String(location.longitude), units: 'metric', lang: 'en',
      }, signal)
      if (signal.aborted) throw new RequestCancelled()
      return parseWeather(data, location)
    },
  }
}

export const weatherService = createWeatherService()
