import type { Theme } from '../hooks/useTheme'

export default function ThemeToggle({ theme, onChange }: { theme: Theme; onChange: (theme: Theme) => void }) {
  const dark = theme === 'dark'
  const nextTheme = dark ? 'light' : 'dark'

  return (
    <div className="theme-toggle">
      <button type="button" aria-label="Toggle dark mode" title={`Switch to ${nextTheme} theme`}
        aria-pressed={dark} onClick={() => onChange(nextTheme)}>
        <span className={`theme-icon theme-icon-${theme}`} aria-hidden="true" />
      </button>
    </div>
  )
}
