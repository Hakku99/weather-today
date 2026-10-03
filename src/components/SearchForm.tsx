import { useId, type ReactNode, type RefObject } from 'react'

type SearchFormProps = {
  value: string
  feedback: string
  announcement: string
  invalid: boolean
  loading: boolean
  searching: boolean
  storageWarning: string
  themeWarning: string
  themeControl: ReactNode
  input: RefObject<HTMLInputElement | null>
  clearButton: RefObject<HTMLButtonElement | null>
  onChange: (value: string) => void
  onSearch: () => void
  onClear: () => void
}

export default function SearchForm({ value, feedback, announcement, invalid, loading, searching, storageWarning, themeWarning, themeControl, input, clearButton, onChange, onSearch, onClear }: SearchFormProps) {
  const id = useId()
  const placeholder = 'Enter a city, e.g. Johor, MY'
  const hasVisibleFeedback = Boolean(feedback || storageWarning || themeWarning)

  return (
    <form
      aria-label="Weather search"
      className="search-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        onSearch()
      }}
    >
      <div className="search-controls">
        <div className="search-field">
          <label htmlFor={id}>City, Country</label>
          <input
            ref={input}
            id={id}
            name="location"
            type="text"
            required
            readOnly={loading}
            value={value}
            placeholder={placeholder}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            aria-invalid={invalid}
            aria-describedby={`${id}-feedback`}
            onChange={(event) => onChange(event.target.value)}
          />
          <span className="search-placeholder" aria-hidden="true">{placeholder}</span>
        </div>
        <button type="submit" className="search-submit" disabled={loading}
          aria-label={searching ? 'Searching...' : 'Search'} title="Search">
          {searching ? <span className="search-indicator" aria-hidden="true" /> : <span className="main-search-icon" aria-hidden="true" />}
          <span className={searching ? 'action-caption' : 'sr-only'}>{searching ? 'Searching...' : 'Search'}</span>
        </button>
      </div>
      <div className="search-utility">
        <button
          ref={clearButton}
          className="search-reset"
          type="button"
          onClick={() => {
            onClear()
            input.current?.focus()
          }}
        >
          <span className="reset-icon" aria-hidden="true" />
          <span>Reset</span>
        </button>
        {themeControl}
      </div>
      <p id={`${id}-feedback`} className="search-feedback" data-visible={hasVisibleFeedback} role="status" aria-atomic="true">
        {announcement && <span className="sr-only">{announcement}{' '}</span>}
        {feedback}{storageWarning && <span className="storage-warning">{storageWarning}</span>}
        {themeWarning && <span className="storage-warning">{themeWarning}</span>}
      </p>
    </form>
  )
}
