import hero from '../../assets/sun.png'
import { formatTemperature } from '../helpers/weatherData'
import type { Weather } from '../types/weather'

export default function WeatherCard({ weather }: { weather: Weather }) {
  return (
    <section aria-labelledby="weather-heading">
      <h2 id="weather-heading">Current weather</h2>
      <img className="weather-art" src={hero} alt="" width="162" />
      <p>{weather.location.city}, {weather.location.countryCode}</p>
      {weather.location.state && <p>{weather.location.state}</p>}
      <dl>
        <dt>Temperature</dt><dd>{formatTemperature(weather.temperature)}</dd>
        <dt>High</dt><dd>{formatTemperature(weather.maximum)}</dd>
        <dt>Low</dt><dd>{formatTemperature(weather.minimum)}</dd>
        <dt>Condition</dt><dd>{weather.category}</dd>
        <dt>Description</dt><dd>{weather.description ?? 'Description unavailable'}</dd>
        <dt>Humidity</dt><dd>{weather.humidity === null ? 'N/A' : `${weather.humidity}%`}</dd>
        <dt>Observation time</dt><dd>{weather.observation ?? 'Observation time unavailable'}</dd>
      </dl>
      <p>High and low are the observed range from the current weather report.</p>
    </section>
  )
}
