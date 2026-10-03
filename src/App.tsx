import { useRef } from 'react'
import SearchForm from './components/SearchForm'
import WeatherCard from './components/WeatherCard'
import SearchHistory from './components/SearchHistory'
import { useHistory } from './hooks/useHistory'
import { useWeatherSearch } from './hooks/useWeatherSearch'
import { weatherService, type WeatherService } from './services/weather'
import './styles/interaction.css'

export default function App({ service = weatherService }: { service?: WeatherService }) {
  const history = useHistory()
  const search = useWeatherSearch(service, history.append)
  const clearButton = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLInputElement>(null)

  return (
    <main>
      <h1>Today's Weather</h1>
      <p>Search current weather by city and country.</p>
      <SearchForm
        value={search.input}
        feedback={search.state.message}
        invalid={search.state.invalid}
        loading={search.loading}
        searching={search.loading && search.state.replayId === null}
        storageWarning={history.warning}
        input={input}
        clearButton={clearButton}
        onChange={search.change}
        onSearch={() => { void search.search() }}
        onClear={search.clear}
      />
      {search.state.phase === 'choosing' && (
        <section aria-labelledby="location-choice">
          <h2 id="location-choice">Choose a location</h2>
          <ul>
            {search.state.candidates.map((location) => (
              <li key={`${location.countryCode}:${location.latitude}:${location.longitude}`}>
                <button type="button" onClick={() => {
                  if (search.select(location)) clearButton.current?.focus()
                }}>
                  {location.city}, {location.state ? `${location.state}, ` : ''}{location.countryCode}
                  {' '}({location.latitude}, {location.longitude})
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {search.state.weather ? <WeatherCard weather={search.state.weather} /> : (
        <p>Search for a city to see its current weather.</p>
      )}
      <SearchHistory records={history.records} loading={search.loading} replayId={search.state.replayId}
        input={input} onReplay={(event) => { search.replay(event) }} onDelete={history.remove} />
    </main>
  )
}
