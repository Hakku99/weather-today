import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { createWeatherService, type WeatherService } from './services/weather'
import { parseWeather } from './helpers/weatherData'
import { WeatherError } from './services/errors'
import { deferred, fullWeather, johor, locationPayload, singapore } from './test/weatherFixtures'
import type { Location, Weather } from './types/weather'

const fixtureService = () => createWeatherService({ apiKey: 'fixture-only', fetcher: vi.fn<typeof fetch>()
  .mockResolvedValueOnce(new Response(JSON.stringify([locationPayload(johor)])))
  .mockResolvedValueOnce(new Response(JSON.stringify(fullWeather()))) })

describe('weather search UI', () => {
  it('starts without requesting a default location', () => {
    const service: WeatherService = { findLocations: vi.fn(), getWeather: vi.fn() }
    render(<App service={service} />)
    expect(screen.getByRole('heading', { name: "Today's Weather" })).toBeVisible()
    expect(screen.getByText('Search for a city to see its current weather.')).toBeVisible()
    expect(service.findLocations).not.toHaveBeenCalled()
  })
  it.each(['Johor', 'Johor, Malaysia', 'Johor, MY'])('loads all required fields for %s by Enter', async (value) => {
    const user = userEvent.setup()
    render(<App service={fixtureService()} />)
    const input = screen.getByRole('textbox', { name: 'City, Country' })
    expect(input).toHaveAccessibleDescription(/Enter a city, optionally/)
    await user.type(input, `${value}{Enter}`)
    await screen.findByRole('heading', { name: 'Current weather' })
    for (const field of ['Johor Bahru, MY', '29°C', '30°C', '26°C', 'Clouds', 'overcast clouds', '82%']) expect(screen.getByText(field)).toBeVisible()
    expect(screen.getByText(/UTC\+08:00/)).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('Weather loaded for Johor Bahru, MY.')
    expect(screen.getByRole('status')).not.toHaveTextContent('unavailable')
    expect(document.querySelector('.weather-art')).toHaveAttribute('src', expect.stringContaining('sun.png'))
    expect(input).toHaveValue(value)
  })
  it('validates before fetching and clears stale errors on correction', async () => {
    const user = userEvent.setup()
    const service: WeatherService = { findLocations: vi.fn(), getWeather: vi.fn() }
    render(<App service={service} />)
    const input = screen.getByRole('textbox')
    await user.type(input, 'Johor,{Enter}')
    expect(input).toBeInvalid()
    expect(input).toHaveAccessibleDescription(/Enter a country after the comma/)
    expect(service.findLocations).not.toHaveBeenCalled()
    await user.type(input, ' MY')
    expect(input).not.toBeInvalid()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
  it('keeps input selectable/read-only while loading; Clear aborts and focuses input', async () => {
    const user = userEvent.setup()
    const pending = deferred<Location[]>()
    let signal: AbortSignal | undefined
    const service: WeatherService = { findLocations: vi.fn((_query, received) => { signal = received; return pending.promise }), getWeather: vi.fn() }
    render(<App service={service} />)
    const input = screen.getByRole('textbox')
    await user.type(input, 'Johor{Enter}')
    expect(input).toHaveAttribute('readonly')
    expect(input).not.toBeDisabled()
    expect(input).toHaveAccessibleDescription(/Use Clear to cancel/)
    expect(screen.getByRole('button', { name: 'Searching...' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('Finding locations...')
    await user.type(input, 'ignored')
    expect(input).toHaveValue('Johor')
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(signal?.aborted).toBe(true)
    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
    await act(async () => pending.resolve([johor]))
    expect(service.getWeather).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
  it('uses an explicitly selected non-first location and focuses stable Clear', async () => {
    const user = userEvent.setup()
    const pending = deferred<Weather>()
    const service: WeatherService = { findLocations: vi.fn().mockResolvedValue([johor, singapore]), getWeather: vi.fn(() => pending.promise) }
    render(<App service={service} />)
    const input = screen.getByRole('textbox')
    await user.type(input, 'City{Enter}')
    const choice = await screen.findByRole('button', { name: /Singapore, SG/ })
    expect(input).not.toHaveAttribute('readonly')
    expect(service.getWeather).not.toHaveBeenCalled()
    await user.click(choice)
    expect(service.getWeather).toHaveBeenCalledTimes(1)
    expect(service.getWeather).toHaveBeenCalledWith(singapore, expect.any(AbortSignal))
    expect(screen.getByRole('button', { name: 'Clear' })).toHaveFocus()
    expect(screen.queryByRole('heading', { name: 'Choose a location' })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Fetching weather for Singapore, SG...')
    await act(async () => pending.resolve(parseWeather(fullWeather(), singapore)))
    expect(screen.getByText('Singapore, SG')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Clear' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.queryByRole('heading', { name: 'Current weather' })).not.toBeInTheDocument()
  })
  it('invalidates candidates on input edit without fetching', async () => {
    const user = userEvent.setup()
    const service: WeatherService = { findLocations: vi.fn().mockResolvedValue([johor, singapore]), getWeather: vi.fn() }
    render(<App service={service} />)
    await user.type(screen.getByRole('textbox'), 'City{Enter}')
    await screen.findByRole('heading', { name: 'Choose a location' })
    await user.type(screen.getByRole('textbox'), ' new')
    expect(screen.queryByRole('heading', { name: 'Choose a location' })).not.toBeInTheDocument()
    expect(service.findLocations).toHaveBeenCalledTimes(1)
    expect(service.getWeather).not.toHaveBeenCalled()
  })
  it('shows each auxiliary fallback and one partial-data notice', async () => {
    const user = userEvent.setup()
    const weather = parseWeather({ main: { temp: 0 }, weather: [{ main: 'Clouds' }] }, johor)
    const service: WeatherService = { findLocations: vi.fn().mockResolvedValue([johor]), getWeather: vi.fn().mockResolvedValue(weather) }
    render(<App service={service} />)
    await user.type(screen.getByRole('textbox'), 'Johor{Enter}')
    await screen.findByRole('heading', { name: 'Current weather' })
    expect(screen.getByText('0°C')).toBeVisible()
    expect(screen.getAllByText('N/A')).toHaveLength(3)
    expect(screen.getByText('Description unavailable')).toBeVisible()
    expect(screen.getByText('Observation time unavailable')).toBeVisible()
    expect(screen.getAllByText(/Some weather details are unavailable/)).toHaveLength(1)
  })
  it.each([false, true])('retains result feedback through edits and clears it with Clear (partial=%s)', async (partial) => {
    const user = userEvent.setup()
    const payload = { ...fullWeather(), timezone: partial ? undefined : fullWeather().timezone }
    const service: WeatherService = { findLocations: vi.fn().mockResolvedValue([johor]),
      getWeather: vi.fn().mockResolvedValue(parseWeather(payload, johor)) }
    render(<App service={service} />)
    const input = screen.getByRole('textbox')
    await user.type(input, 'Johor{Enter}')
    await screen.findByRole('heading', { name: 'Current weather' })
    const feedback = screen.getByRole('status').textContent
    for (const value of ['Singapore', 'Singapore, SG', '']) {
      await user.clear(input)
      if (value) await user.type(input, value)
      expect(screen.getByRole('status').textContent).toBe(feedback)
      expect(screen.getByText('Johor Bahru, MY')).toBeVisible()
      expect(screen.queryAllByText(/Some weather details are unavailable/)).toHaveLength(partial ? 1 : 0)
    }
    expect(service.findLocations).toHaveBeenCalledTimes(1)
    expect(service.getWeather).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.queryByRole('heading', { name: 'Current weather' })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    expect(input).toHaveFocus()
  })
  it('replaces retained partial feedback with progress and a complete new result', async () => {
    const user = userEvent.setup()
    const nextLocations = deferred<Location[]>()
    const service: WeatherService = {
      findLocations: vi.fn().mockResolvedValueOnce([johor]).mockReturnValueOnce(nextLocations.promise),
      getWeather: vi.fn().mockResolvedValueOnce(parseWeather({ ...fullWeather(), timezone: undefined }, johor))
        .mockResolvedValueOnce(parseWeather(fullWeather(), singapore)),
    }
    render(<App service={service} />)
    const input = screen.getByRole('textbox')
    await user.type(input, 'Johor{Enter}')
    await screen.findByRole('heading', { name: 'Current weather' })
    await user.clear(input)
    await user.type(input, 'Singapore')
    expect(screen.getByRole('status')).toHaveTextContent('Some weather details are unavailable.')
    await user.click(screen.getByRole('button', { name: 'Search' }))
    expect(screen.getByRole('status')).toHaveTextContent('Finding locations...')
    expect(screen.queryByRole('heading', { name: 'Current weather' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Some weather details are unavailable/)).not.toBeInTheDocument()
    await act(async () => nextLocations.resolve([singapore]))
    await screen.findByText('Singapore, SG')
    expect(screen.getByRole('status')).toHaveTextContent('Weather loaded for Singapore, SG.')
    expect(screen.queryByText(/Some weather details are unavailable/)).not.toBeInTheDocument()
  })
  it('removes stale weather on failure, retains input, and releases controls', async () => {
    const user = userEvent.setup()
    const service: WeatherService = { findLocations: vi.fn().mockResolvedValue([johor]), getWeather: vi.fn()
      .mockResolvedValueOnce(parseWeather(fullWeather(), johor)).mockRejectedValueOnce(new WeatherError('Weather request failed.')) }
    render(<App service={service} />)
    const input = screen.getByRole('textbox')
    await user.type(input, 'Johor{Enter}')
    await screen.findByRole('heading', { name: 'Current weather' })
    await user.click(screen.getByRole('button', { name: 'Search' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Weather request failed.'))
    expect(screen.queryByRole('heading', { name: 'Current weather' })).not.toBeInTheDocument()
    expect(input).toHaveValue('Johor')
    expect(input).not.toHaveAttribute('readonly')
    expect(screen.getByRole('button', { name: 'Search' })).toBeEnabled()
    await user.type(input, ' new')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    expect(service.getWeather).toHaveBeenCalledTimes(2)
  })
  it('Clear during response processing prevents a late commit and preserves replacement success', async () => {
    const user = userEvent.setup()
    const body = deferred<unknown>()
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify([locationPayload(johor)])))
      .mockResolvedValueOnce({ ok: true, json: () => body.promise } as Response)
      .mockResolvedValueOnce(new Response(JSON.stringify([locationPayload(singapore)])))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...fullWeather(), main: { ...fullWeather().main, temp: 15 } })))
    render(<App service={createWeatherService({ apiKey: 'fixture-only', fetcher })} />)
    const input = screen.getByRole('textbox')
    await user.type(input, 'Johor{Enter}')
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(fetcher.mock.calls[1]?.[1]?.signal?.aborted).toBe(true)
    await user.type(input, 'Singapore{Enter}')
    await screen.findByText('Singapore, SG')
    await act(async () => body.resolve(fullWeather()))
    expect(screen.getByText('15°C')).toBeVisible()
    expect(screen.queryByText('29°C')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Weather loaded for Singapore, SG.')
  })
})
