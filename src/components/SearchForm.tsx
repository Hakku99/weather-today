import { useId, type RefObject } from 'react'

type SearchFormProps = {
  value: string
  feedback: string
  invalid: boolean
  loading: boolean
  searching: boolean
  storageWarning: string
  input: RefObject<HTMLInputElement | null>
  clearButton: RefObject<HTMLButtonElement | null>
  onChange: (value: string) => void
  onSearch: () => void
  onClear: () => void
}

export default function SearchForm({ value, feedback, invalid, loading, searching, storageWarning, input, clearButton, onChange, onSearch, onClear }: SearchFormProps) {
  const id = useId()

  return (
    <form
      aria-label="Weather search"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        onSearch()
      }}
    >
      <label htmlFor={id}>City, Country</label>
      <div className="search-controls">
        <input
          ref={input}
          id={id}
          name="location"
          type="text"
          required
          readOnly={loading}
          value={value}
          placeholder="Johor, MY"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          aria-invalid={invalid}
          aria-describedby={`${id}-help ${id}-feedback${loading ? ` ${id}-progress` : ''}`}
          onChange={(event) => onChange(event.target.value)}
        />
        <button type="submit" className="search-submit" disabled={loading}>
          {searching && <span className="search-indicator" aria-hidden="true" />}
          {searching ? 'Searching...' : 'Search'}
        </button>
        <button
          ref={clearButton}
          type="button"
          onClick={() => {
            onClear()
            input.current?.focus()
          }}
        >
          Clear
        </button>
      </div>
      <p id={`${id}-help`}>Enter a city, optionally followed by a comma and country name or code.</p>
      <p id={`${id}-progress`} className="search-guidance">{loading ? 'Search in progress. Use Clear to cancel.' : ''}</p>
      <p id={`${id}-feedback`} className="search-feedback" role="status" aria-atomic="true">
        {feedback}{storageWarning && <span className="storage-warning">{storageWarning}</span>}
      </p>
    </form>
  )
}
