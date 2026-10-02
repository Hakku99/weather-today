import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('application entry', () => {
  it('mounts a semantic React page in the DOM test environment', () => {
    render(<App />)
    expect(screen.getByRole('main')).toContainElement(
      screen.getByRole('heading', { name: "Today's Weather", level: 1 }),
    )
  })
})
