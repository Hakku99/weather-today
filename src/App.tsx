import { useRef } from 'react'
import SearchForm from './components/SearchForm'
import WeatherCard from './components/WeatherCard'
import SearchHistory from './components/SearchHistory'
import { useHistory } from './hooks/useHistory'
import { useTheme } from './hooks/useTheme'
import ThemeToggle from './components/ThemeToggle'
import hero from '../assets/sun.png'
import { useWeatherSearch } from './hooks/useWeatherSearch'
import { weatherService, type WeatherService } from './services/weather'
import './styles/interaction.css'

export default function App({ service = weatherService }: { service?: WeatherService }) {
  const history = useHistory()
  const theme = useTheme()
  const search = useWeatherSearch(service, history.append)
  const clearButton = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLInputElement>(null)

  return (
    <main className="weather-app" data-theme={theme.theme}>
      <div className="weather-layout">
        <SearchForm
          value={search.input}
          feedback={search.state.message}
          announcement={search.state.announcement}
          invalid={search.state.invalid}
          loading={search.loading}
          searching={search.loading && search.state.replayId === null}
          storageWarning={history.warning}
          themeWarning={theme.warning}
          themeControl={<ThemeToggle theme={theme.theme} onChange={theme.choose} />}
          input={input}
          clearButton={clearButton}
          onChange={search.change}
          onSearch={() => { void search.search() }}
          onClear={search.clear}
        />
        <div className="weather-panel" data-phase={search.state.phase}>
          <img className="weather-art" src={hero} alt="" width="648" height="655" draggable="false" />
          <h1>Today's Weather</h1>
          <WeatherCard weather={search.state.weather} />
          {search.state.phase === 'choosing' && (
            <section className="location-choice" aria-labelledby="location-choice">
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
          <SearchHistory records={history.records} loading={search.loading} replayId={search.state.replayId}
            input={input} onReplay={(event) => { search.replay(event) }} onDelete={history.remove} />
        </div>
      </div>
    </main>
  )
}
