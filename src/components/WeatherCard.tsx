import { useId } from 'react'
import { formatTemperature } from '../helpers/weatherData'
import type { Weather } from '../types/weather'

export default function WeatherCard({ weather }: { weather: Weather | null }) {
  const temperature = weather ? formatTemperature(weather.temperature) : '--°'
  const longTemperature = temperature.length >= 5
  const observationId = useId()
  const observation = weather?.observation ?? null
  const observationDisplay = weather ? weather.observationDisplay ?? 'Observation time unavailable' : '--'

  return (
    <section className="weather-summary" aria-labelledby="weather-heading">
      <h2 id="weather-heading" className="sr-only">Current weather</h2>
      <dl className={`weather-values${longTemperature ? ' weather-values-long' : ''}`}>
        <div className={`weather-temperature${longTemperature ? ' weather-temperature-long' : ''}`}><dt className="sr-only">Temperature</dt><dd>{temperature}</dd></div>
        <div className="weather-range">
          <dt><abbr title="Observed high">H</abbr>:</dt><dd>{weather ? formatTemperature(weather.maximum) : '--°'}</dd>
          <dt><abbr title="Observed low">L</abbr>:</dt><dd>{weather ? formatTemperature(weather.minimum) : '--°'}</dd>
        </div>
        <div className="weather-location"><dt className="sr-only">Location</dt><dd>{weather ? `${weather.location.city}, ${weather.location.countryCode}` : 'Search a city'}</dd></div>
        <div className="weather-observation"><dt className="sr-only">Observation time</dt><dd title={observation ?? undefined} aria-describedby={observation ? observationId : undefined}>{observationDisplay}</dd></div>
        <div className="weather-humidity"><dt>Humidity:</dt><dd>{weather ? weather.humidity === null ? 'N/A' : `${weather.humidity}%` : '--%'}</dd></div>
        <div className="weather-condition"><dt className="sr-only">Condition</dt><dd>{weather?.category ?? '--'}</dd></div>
      </dl>
      {observation && <span id={observationId} className="sr-only">{observation}</span>}
    </section>
  )
}
