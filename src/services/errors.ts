export class WeatherError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WeatherError'
  }
}

export class RequestCancelled extends Error {
  constructor() {
    super('Request cancelled')
    this.name = 'RequestCancelled'
  }
}

export function responseError(status: number): WeatherError {
  if (status === 401 || status === 403) {
    return new WeatherError('OpenWeather rejected the API key. Check your local key and its access, then try again.')
  }
  if (status === 404) return new WeatherError('No weather was found for that location. Try another city or country.')
  if (status === 429) return new WeatherError('OpenWeather request limit reached. Please wait before trying again.')
  if (status >= 500) return new WeatherError('OpenWeather is temporarily unavailable. Please try again later.')
  return new WeatherError('OpenWeather could not process this search. Check the location and try again.')
}

export const invalidResponse = () => new WeatherError('OpenWeather returned invalid data. Please try again.')
