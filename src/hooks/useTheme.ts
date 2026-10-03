import { useState } from 'react'

export type Theme = 'light' | 'dark'
export const THEME_KEY = 'weather-today.theme.v1'
const unavailable = 'Theme preference could not be saved. It will apply for this session only.'

function readPreference(): { theme: Theme; warning: string } {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    return { theme: saved === 'dark' ? 'dark' : 'light', warning: '' }
  } catch {
    return { theme: 'light', warning: unavailable }
  }
}

export function useTheme() {
  const [preference, setPreference] = useState(readPreference)

  function choose(theme: Theme) {
    let warning = ''
    try { localStorage.setItem(THEME_KEY, theme) } catch { warning = unavailable }
    setPreference({ theme, warning })
  }

  return { ...preference, choose }
}
