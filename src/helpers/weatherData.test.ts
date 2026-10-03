import { describe, expect, it } from 'vitest'
import { formatObservation, formatTemperature, parseLocations, parseWeather } from './weatherData'
import { fullWeather, johor, locationPayload, singapore } from '../test/weatherFixtures'

describe('location boundary', () => {
  it('validates, deduplicates coordinates, and enforces a supplied country', () => {
    expect(parseLocations([locationPayload(singapore), null, locationPayload(johor), locationPayload(johor)], 'MY')).toEqual([johor])
    expect(() => parseLocations([locationPayload(singapore)], 'MY')).toThrow('requested country')
  })
  it.each([null, {}, [{ name: '', country: 'MY', lat: 1, lon: 2 }],
    [{ name: 'City', country: 'ZZ', lat: 1, lon: 2 }],
    [{ name: 'City', country: 'MY', lat: 91, lon: 2 }],
    [{ name: 'City', country: 'MY', lat: 1, lon: Infinity }],
    [{ name: 'City', country: 'MY', lat: '1', lon: 2 }]])('rejects malformed geocoding %j', (payload) => {
    expect(() => parseLocations(payload)).toThrow('invalid data')
  })
  it('distinguishes no matching location from malformed data', () => {
    expect(() => parseLocations([])).toThrow('No matching location')
  })
})

describe('weather boundary', () => {
  it('retains all complete raw fields and validated geocoding identity', () => {
    const weather = parseWeather(fullWeather(), johor)
    expect(weather).toMatchObject({ location: johor, temperature: 28.6, minimum: 26.2, maximum: 30.1,
      humidity: 82, category: 'Clouds', description: 'overcast clouds', observedAt: 1_791_000_000, utcOffset: 28_800, partial: false })
    expect(weather.observation).toContain('(UTC+08:00)')
    expect(formatTemperature(weather.temperature)).toBe('29°C')
  })
  it.each([undefined, null, '', '20', NaN, Infinity])('rejects invalid current temperature %j', (temperature) => {
    const payload = fullWeather()
    expect(() => parseWeather({ ...payload, main: { ...payload.main, temp: temperature } }, johor)).toThrow('invalid data')
  })
  it.each([undefined, null, '', ' ', 23])('rejects missing/invalid category %j', (category) => {
    expect(() => parseWeather({ ...fullWeather(), weather: [{ main: category }] }, johor)).toThrow('invalid data')
  })
  it('rejects invalid resolved coordinates and missing core objects', () => {
    expect(() => parseWeather(fullWeather(), { ...johor, latitude: NaN })).toThrow('invalid data')
    expect(() => parseWeather({}, johor)).toThrow('invalid data')
  })
  it('keeps valid zero values, UTC, extreme temperatures, and unfamiliar condition/icon data', () => {
    const weather = parseWeather({ main: { temp: 0, temp_min: -100, temp_max: 0, humidity: 0 },
      weather: [{ main: 'Unfamiliar', description: 'readable description', icon: 'unknown' }], dt: 0, timezone: 0 }, johor)
    expect(weather).toMatchObject({ temperature: 0, humidity: 0, utcOffset: 0, observedAt: 0, partial: false })
    expect(weather.observation).toContain('01/01/1970')
    expect(weather.observation).toContain('(UTC)')
  })
  it.each([undefined, null, '', '82', -1, 101, NaN, Infinity])('degrades invalid humidity %j', (humidity) => {
    const payload = fullWeather()
    expect(parseWeather({ ...payload, main: { ...payload.main, humidity } }, johor)).toMatchObject({ humidity: null, partial: true })
  })
  it.each([undefined, null, '', ' ', 45])('degrades invalid description %j', (description) => {
    expect(parseWeather({ ...fullWeather(), weather: [{ main: 'Clouds', description }] }, johor)).toMatchObject({ description: null, partial: true })
  })
  it('handles independent missing bounds and validates raw order before rounding', () => {
    const payload = fullWeather()
    expect(parseWeather({ ...payload, main: { ...payload.main, temp_min: null } }, johor)).toMatchObject({ minimum: null, maximum: 30.1, partial: true })
    expect(parseWeather({ ...payload, main: { ...payload.main, temp_max: '' } }, johor)).toMatchObject({ minimum: 26.2, maximum: null, partial: true })
    expect(parseWeather({ ...payload, main: { ...payload.main, temp_min: 26.2, temp_max: 26.1 } }, johor)).toMatchObject({ minimum: null, maximum: null, partial: true })
    expect(formatTemperature(null)).toBe('N/A')
  })
  it('does not degrade solely for an absent icon', () => {
    expect(parseWeather({ ...fullWeather(), weather: [{ main: 'Clouds', description: 'cloudy' }] }, johor).partial).toBe(false)
  })
})

describe('observation context', () => {
  it.each([undefined, null, '', '0', NaN, Infinity, 8.64e12 + 1, 0.5])('does not invent an observation for %j', (dt) => {
    expect(formatObservation(dt, 0).observation).toBeNull()
  })
  it.each([undefined, null, '', '0', NaN, Infinity, -43201, 50401, 0.5])('labels UTC fallback for offset %j', (offset) => {
    expect(formatObservation(0, offset)).toEqual({ observedAt: 0, utcOffset: null, observation: '01/01/1970, 12:00 am (UTC)' })
    expect(parseWeather({ ...fullWeather(), timezone: offset }, johor).partial).toBe(true)
  })
  it('formats positive/negative/fractional-hour offsets without using browser time', () => {
    expect(formatObservation(0, 19800).observation).toBe('01/01/1970, 05:30 am (UTC+05:30)')
    expect(formatObservation(0, -12600).observation).toBe('31/12/1969, 08:30 pm (UTC-03:30)')
  })
  it('falls back to UTC if adding the offset overflows the date range', () => {
    expect(formatObservation(8.64e12, 3600)).toMatchObject({ utcOffset: null, observation: expect.stringContaining('(UTC)') })
  })
})
