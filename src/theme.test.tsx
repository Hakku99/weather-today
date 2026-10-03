import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { THEME_KEY } from './hooks/useTheme'
import { parseWeather } from './helpers/weatherData'
import { deferred, fullWeather, johor } from './test/weatherFixtures'
import type { WeatherService } from './services/weather'
import type { Weather } from './types/weather'

describe('theme preference', () => {
  it.each([null, 'broken', '"dark"', 'light'])('defaults safely to light for %s', (value) => {
    if (value !== null) localStorage.setItem(THEME_KEY, value)
    render(<App />)
    expect(screen.getByRole('main')).toHaveAttribute('data-theme', 'light')
    expect(screen.getByRole('button', { name: 'Toggle dark mode' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('restores dark, switches both ways, and retains successful weather/history/input', async () => {
    localStorage.setItem(THEME_KEY, 'dark')
    const user = userEvent.setup()
    const service: WeatherService = { findLocations: vi.fn().mockResolvedValue([johor]),
      getWeather: vi.fn().mockResolvedValue(parseWeather(fullWeather(), johor)) }
    render(<App service={service} />)
    expect(screen.getByRole('main')).toHaveAttribute('data-theme', 'dark')
    await user.type(screen.getByRole('textbox'), 'Johor{Enter}')
    await screen.findByText(/^Weather loaded for /)
    const row = document.querySelector('[data-history-id]')
    await user.click(screen.getByRole('button', { name: 'Toggle dark mode' }))
    expect(localStorage.getItem(THEME_KEY)).toBe('light')
    expect(screen.getByRole('textbox')).toHaveValue('Johor')
    expect(screen.getByRole('region', { name: 'Current weather' })).toBeInTheDocument()
    expect(document.querySelector('[data-history-id]')).toBe(row)
    await user.click(screen.getByRole('button', { name: 'Toggle dark mode' }))
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')
    expect(service.getWeather).toHaveBeenCalledTimes(1)
  })

  it('switches during networking without cancelling or releasing the search controls', async () => {
    const user = userEvent.setup()
    const response = deferred<Weather>()
    const service: WeatherService = { findLocations: vi.fn().mockResolvedValue([johor]), getWeather: vi.fn(() => response.promise) }
    render(<App service={service} />)
    await user.type(screen.getByRole('textbox'), 'Johor{Enter}')
    await waitFor(() => expect(service.getWeather).toHaveBeenCalledTimes(1))
    await user.click(screen.getByRole('button', { name: 'Toggle dark mode' }))
    expect(screen.getByRole('main')).toHaveAttribute('data-theme', 'dark')
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly')
    expect(screen.getByRole('button', { name: 'Searching...' })).toBeDisabled()
    expect(vi.mocked(service.getWeather).mock.calls[0]?.[1].aborted).toBe(false)
    await act(async () => response.resolve(parseWeather(fullWeather(), johor)))
    expect(screen.getByRole('main')).toHaveAttribute('data-theme', 'dark')
    expect(screen.getByRole('button', { name: 'Search' })).toBeEnabled()
  })

  it('keeps session switching usable when preference writes fail', async () => {
    const user = userEvent.setup()
    render(<App />)
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Denied', 'SecurityError') })
    try {
      await user.click(screen.getByRole('button', { name: 'Toggle dark mode' }))
      expect(screen.getByRole('main')).toHaveAttribute('data-theme', 'dark')
      expect(screen.getByRole('status')).toHaveTextContent('Theme preference could not be saved.')
      await user.click(screen.getByRole('button', { name: 'Toggle dark mode' }))
      expect(screen.getByRole('main')).toHaveAttribute('data-theme', 'light')
    } finally { write.mockRestore() }
  })

  it('does not crash when the initial preference read fails', () => {
    const read = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Denied', 'SecurityError') })
    try {
      render(<App />)
      expect(screen.getByRole('main')).toHaveAttribute('data-theme', 'light')
      expect(screen.getByRole('status')).toHaveTextContent('Theme preference could not be saved.')
    } finally { read.mockRestore() }
  })
})
