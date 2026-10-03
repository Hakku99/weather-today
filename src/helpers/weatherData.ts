import { getAlpha2Codes } from 'i18n-iso-countries'
import { invalidResponse, WeatherError } from '../services/errors'
import type { Location, Weather } from '../types/weather'

export const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
export const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const text = (value: unknown): string | null => typeof value === 'string' && value.trim() ? value.trim() : null
const codes = new Set(Object.keys(getAlpha2Codes()))

export function validLocation(location: Location): boolean {
  return Boolean(text(location.city)) && codes.has(location.countryCode)
    && finite(location.latitude) && Math.abs(location.latitude) <= 90
    && finite(location.longitude) && Math.abs(location.longitude) <= 180
}

export function parseLocations(payload: unknown, requestedCountry?: string): Location[] {
  if (!Array.isArray(payload)) throw invalidResponse()
  if (payload.length === 0) throw new WeatherError('No matching location found. Check the city and country and try again.')
  const valid: Location[] = []
  const seen = new Set<string>()
  for (const item of payload) {
    const data = record(item)
    const city = text(data.name)
    const countryCode = text(data.country)?.toUpperCase()
    if (!city || !countryCode || !finite(data.lat) || !finite(data.lon)) continue
    const state = text(data.state)
    const location: Location = { city, countryCode, latitude: data.lat, longitude: data.lon, ...(state ? { state } : {}) }
    if (!validLocation(location)) continue
    const key = `${countryCode}:${data.lat}:${data.lon}`
    if (!seen.has(key)) {
      valid.push(location)
      seen.add(key)
    }
  }
  if (!valid.length) throw invalidResponse()
  const matches = requestedCountry ? valid.filter((location) => location.countryCode === requestedCountry) : valid
  if (!matches.length) throw new WeatherError('No matching location found in the requested country. Check the city and country.')
  return matches
}

export function formatObservation(timestamp: unknown, offset: unknown): {
  observedAt: number | null; utcOffset: number | null; observation: string | null
} {
  const observedAt = finite(timestamp) && Number.isInteger(timestamp) && Number.isFinite(new Date(timestamp * 1000).getTime()) ? timestamp : null
  // OpenWeather specifies seconds from UTC; accept civil offsets from UTC-12 to UTC+14.
  const utcOffset = finite(offset) && Number.isInteger(offset) && offset >= -43_200 && offset <= 50_400 ? offset : null
  if (observedAt === null) return { observedAt, utcOffset, observation: null }
  const format = (seconds: number) => new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(new Date(seconds * 1000))
  try {
    if (utcOffset !== null) {
      const absolute = Math.abs(utcOffset)
      const hours = String(Math.floor(absolute / 3600)).padStart(2, '0')
      const minutes = String(Math.floor(absolute % 3600 / 60)).padStart(2, '0')
      const seconds = absolute % 60
      const label = utcOffset === 0 ? 'UTC' : `UTC${utcOffset < 0 ? '-' : '+'}${hours}:${minutes}${seconds ? `:${String(seconds).padStart(2, '0')}` : ''}`
      return { observedAt, utcOffset, observation: `${format(observedAt + utcOffset)} (${label})` }
    }
  } catch { /* Fall back to explicit UTC when local conversion cannot be formatted. */ }
  try {
    return { observedAt, utcOffset: null, observation: `${format(observedAt)} (UTC)` }
  } catch {
    return { observedAt, utcOffset: null, observation: null }
  }
}

export function parseWeather(payload: unknown, location: Location): Weather {
  const data = record(payload)
  const main = record(data.main)
  const conditions = Array.isArray(data.weather) ? record(data.weather[0]) : {}
  const category = text(conditions.main)
  if (!validLocation(location) || !finite(main.temp) || !category) throw invalidResponse()
  let minimum = finite(main.temp_min) ? main.temp_min : null
  let maximum = finite(main.temp_max) ? main.temp_max : null
  if (minimum !== null && maximum !== null && maximum < minimum) minimum = maximum = null
  const humidity = finite(main.humidity) && main.humidity >= 0 && main.humidity <= 100 ? main.humidity : null
  const description = text(conditions.description)
  const observation = formatObservation(data.dt, data.timezone)
  return {
    location, temperature: main.temp, category, description, humidity, minimum, maximum, ...observation,
    partial: description === null || humidity === null || minimum === null || maximum === null
      || observation.observation === null || observation.utcOffset === null,
  }
}

export function formatTemperature(value: number | null): string {
  return value === null ? 'N/A' : `${Math.round(value)}°C`
}
