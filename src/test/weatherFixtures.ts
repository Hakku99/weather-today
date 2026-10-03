import type { Location } from '../types/weather'

export const johor: Location = { city: 'Johor Bahru', countryCode: 'MY', state: 'Johor', latitude: 1.4927, longitude: 103.7414 }
export const singapore: Location = { city: 'Singapore', countryCode: 'SG', latitude: 1.2897, longitude: 103.8501 }
export const locationPayload = (location: Location) => ({
  name: location.city, country: location.countryCode, state: location.state, lat: location.latitude, lon: location.longitude,
})
export const fullWeather = () => ({
  main: { temp: 28.6, temp_min: 26.2, temp_max: 30.1, humidity: 82 },
  weather: [{ main: 'Clouds', description: 'overcast clouds', icon: '04d' }],
  dt: 1_791_000_000,
  timezone: 28_800,
})

export function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
