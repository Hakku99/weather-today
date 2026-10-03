import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

// jsdom has no Web Locks implementation. Real cross-tab locking is exercised by E2E.
beforeEach(() => {
  Object.defineProperty(navigator, 'locks', { configurable: true, value: {
    request: <T>(name: string, _options: LockOptions, callback: LockGrantedCallback<T>) =>
      Promise.resolve(callback({ name, mode: 'exclusive' })),
  } })
})

afterEach(() => { cleanup(); localStorage.clear() })
