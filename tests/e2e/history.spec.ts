import { expect, test, type Page } from '@playwright/test'
import type { HistoryEvent } from '../../src/helpers/historyStorage'
import { deferred, fullWeather, johor, locationPayload, singapore } from '../../src/test/weatherFixtures'

const saved = (id = 'original', location = johor): HistoryEvent => ({ id, location, completedAt: '2026-10-02T04:00:00.000Z' })
const HISTORY_KEY = 'weather-today.history'

const historyRows = (page: Page) => page.getByRole('region', { name: 'Search History' }).getByRole('listitem')
const historyIds = (page: Page) => historyRows(page).evaluateAll(elements => elements.map(row => row.getAttribute('data-history-id')))
const persisted = (page: Page) => page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? '{"records":[]}').records as HistoryEvent[], HISTORY_KEY)
async function searchJohor(page: Page) {
  await page.getByRole('textbox').fill('Johor, MY')
  await page.getByRole('textbox').press('Enter')
  await expect(page.getByRole('status')).toContainText('Weather loaded for Johor Bahru, MY.')
}

test('stale tabs preserve other searches and never resurrect deleted IDs on replay', async ({ page, context }) => {
  await context.route('https://api.openweathermap.org/**', route => route.fulfill({ json:
    new URL(route.request().url()).pathname.includes('/geo/') ? [locationPayload(johor)] : fullWeather(),
  }))
  const other = await context.newPage()
  // Deliberately leave this tab stale: correctness must not depend on event delivery.
  await other.addInitScript(() => window.addEventListener('storage', event => event.stopImmediatePropagation()))
  await Promise.all([page.goto('/'), other.goto('/')])
  await searchJohor(page)
  await expect.poll(() => persisted(page)).toHaveLength(1)
  const original = (await persisted(page))[0]!
  await searchJohor(other)
  await expect.poll(() => persisted(other)).toHaveLength(2)
  await expect(historyRows(page)).toHaveCount(2)
  expect((await persisted(other)).some(event => event.id === original.id)).toBe(true)
  await page.locator(`[data-history-id="${original.id}"]`).getByRole('button', { name: /Delete/ }).click()
  await expect.poll(() => persisted(page)).toHaveLength(1)
  await expect(historyRows(other)).toHaveCount(2)
  await other.locator(`[data-history-id="${original.id}"]`).getByRole('button', { name: /Search again/ }).click()
  await expect.poll(() => persisted(other)).toHaveLength(2)
  expect((await persisted(other)).some(event => event.id === original.id)).toBe(false)
  await Promise.all([page.reload(), other.reload()])
  await expect(historyRows(page)).toHaveCount(2)
  await expect(historyRows(other)).toHaveCount(2)
  expect(await historyIds(page)).toEqual(await historyIds(other))
})

test('concurrent tab additions and deletion serialize against the latest saved history', async ({ page, context }) => {
  await context.route('https://api.openweathermap.org/**', route => route.fulfill({ json:
    new URL(route.request().url()).pathname.includes('/geo/') ? [locationPayload(johor)] : fullWeather(),
  }))
  await page.goto('/')
  await page.evaluate(({ key, event }) => localStorage.setItem(key, JSON.stringify({ version: 1, records: [event] })), { key: HISTORY_KEY, event: saved() })
  const other = await context.newPage()
  await Promise.all([page.reload(), other.goto('/')])
  await expect(historyRows(page)).toHaveCount(1)
  await expect(historyRows(other)).toHaveCount(1)
  await page.evaluate(async key => {
    let acquired!: () => void
    const held = new Promise<void>(resolve => { acquired = resolve })
    const testWindow = window as Window & { releaseHistoryLock?: () => void }
    const released = new Promise<void>(resolve => { testWindow.releaseHistoryLock = resolve })
    void navigator.locks.request(key, async () => { acquired(); await released })
    await held
  }, HISTORY_KEY)
  await Promise.all([searchJohor(page), searchJohor(other)])
  await page.locator('[data-history-id="original"]').getByRole('button', { name: /Delete/ }).click()
  expect((await persisted(page)).map(event => event.id)).toEqual(['original'])
  await page.evaluate(() => (window as Window & { releaseHistoryLock?: () => void }).releaseHistoryLock!())
  await expect.poll(() => persisted(page)).toHaveLength(2)
  await expect(historyRows(page)).toHaveCount(2)
  await expect(historyRows(other)).toHaveCount(2)
  const events = await persisted(page)
  expect(new Set(events.map(event => event.id)).size).toBe(2)
  expect(events.some(event => event.id === 'original')).toBe(false)
  await Promise.all([page.reload(), other.reload()])
  await expect(historyRows(page)).toHaveCount(2)
  await expect(historyRows(other)).toHaveCount(2)
  expect(await historyIds(page)).toEqual(events.map(event => event.id))
  expect(await historyIds(other)).toEqual(events.map(event => event.id))
})

test('clock rollback and equal timestamps keep insertion order, IDs, and times after reload', async ({ page }) => {
  await page.route('https://api.openweathermap.org/**', route => route.fulfill({ json:
    new URL(route.request().url()).pathname.includes('/geo/') ? [locationPayload(johor)] : fullWeather(),
  }))
  await page.clock.setFixedTime(new Date('2026-10-03T10:00:00Z'))
  await page.goto('/')
  await searchJohor(page)
  await expect.poll(() => persisted(page)).toHaveLength(1)
  await page.clock.setFixedTime(new Date('2026-10-03T09:59:00Z'))
  await searchJohor(page)
  await expect.poll(() => persisted(page)).toHaveLength(2)
  await searchJohor(page)
  await expect.poll(() => persisted(page)).toHaveLength(3)
  const events = await persisted(page)
  expect(events.map(event => event.completedAt)).toEqual([
    '2026-10-03T09:59:00.000Z', '2026-10-03T09:59:00.000Z', '2026-10-03T10:00:00.000Z',
  ])
  expect(await historyIds(page)).toEqual(events.map(event => event.id))
  await page.reload()
  await expect(historyRows(page)).toHaveCount(3)
  expect(await historyIds(page)).toEqual(events.map(event => event.id))
  expect(await persisted(page)).toEqual(events)
})

test('interleaved completions retain each action queue position across tabs', async ({ page, context }) => {
  await context.route('https://api.openweathermap.org/**', route => route.fulfill({ json:
    new URL(route.request().url()).pathname.includes('/geo/') ? [locationPayload(johor)] : fullWeather(),
  }))
  const other = await context.newPage()
  await Promise.all([page.goto('/'), other.goto('/')])
  await page.evaluate(async key => {
    let acquired!: () => void
    const held = new Promise<void>(resolve => { acquired = resolve })
    const testWindow = window as Window & { releaseHistoryLock?: () => void }
    const released = new Promise<void>(resolve => { testWindow.releaseHistoryLock = resolve })
    void navigator.locks.request(key, async () => { acquired(); await released })
    await held
  }, HISTORY_KEY)
  await searchJohor(page)
  const first = (await historyIds(page))[0]!
  await searchJohor(other)
  const middle = (await historyIds(other))[0]!
  await searchJohor(page)
  await expect(historyRows(page)).toHaveCount(2)
  const last = (await historyIds(page))[0]!
  await page.evaluate(() => (window as Window & { releaseHistoryLock?: () => void }).releaseHistoryLock!())
  await expect.poll(async () => (await persisted(page)).map(event => event.id)).toEqual([last, middle, first])
  await expect.poll(() => historyIds(page)).toEqual([last, middle, first])
  await expect.poll(() => historyIds(other)).toEqual([last, middle, first])
  await page.reload()
  await expect.poll(() => historyIds(page)).toEqual([last, middle, first])
})

test('search, reload, fresh coordinate replay, exact duplicate deletion, and final empty state', async ({ page }) => {
  let geocoding = 0
  let weather = 0
  await page.route('https://api.openweathermap.org/**', async route => {
    const url = new URL(route.request().url())
    if (url.pathname.includes('/geo/')) {
      geocoding++
      return route.fulfill({ json: [locationPayload(johor)] })
    }
    weather++
    expect(url.searchParams.get('lat')).toBe(String(johor.latitude))
    expect(url.searchParams.get('lon')).toBe(String(johor.longitude))
    return route.fulfill({ json: { ...fullWeather(), main: { ...fullWeather().main, temp: weather === 1 ? 29 : 18 } } })
  })
  await page.goto('/')
  const history = page.getByRole('region', { name: 'Search History' })
  const rows = history.getByRole('listitem')
  const input = page.getByRole('textbox')
  await expect(history.getByText('No Record')).toBeVisible()
  await input.fill('Johor, MY')
  await input.press('Enter')
  await expect(rows).toHaveCount(1)
  const originalId = await rows.first().getAttribute('data-history-id')
  const originalTime = await rows.first().locator('time').getAttribute('datetime')
  const originalLabel = await rows.first().locator('time').textContent()
  expect(originalTime).not.toBe(new Date(fullWeather().dt * 1000).toISOString())
  await page.reload()
  await expect(rows).toHaveCount(1)
  await expect(rows.first()).toHaveAttribute('data-history-id', originalId!)
  await expect(rows.first().locator('time')).toHaveAttribute('datetime', originalTime!)
  await expect(rows.first().locator('time')).toHaveText(originalLabel!)
  await expect(page.getByRole('region', { name: 'Current weather' })).toHaveCount(0)
  expect(weather).toBe(1)
  await input.fill('invalid, qualifier')
  await rows.first().getByRole('button', { name: /Search again/ }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('region', { name: 'Current weather' }).getByText('18°C', { exact: true })).toBeVisible()
  await expect(rows).toHaveCount(2)
  expect(weather).toBe(2)
  expect(geocoding).toBe(1)
  await expect(input).toHaveValue('invalid, qualifier')
  expect(await rows.first().getAttribute('data-history-id')).not.toBe(originalId)
  await rows.nth(1).getByRole('button', { name: /Delete/ }).focus()
  await page.keyboard.press('Space')
  await expect(rows).toHaveCount(1)
  await expect(rows.first().getByRole('button', { name: /Delete/ })).toBeFocused()
  await expect(page.getByRole('region', { name: 'Current weather' })).toBeVisible()
  await page.reload()
  await expect(rows).toHaveCount(1)
  expect(await rows.first().getAttribute('data-history-id')).not.toBe(originalId)
  await rows.first().getByRole('button', { name: /Delete/ }).focus()
  await page.keyboard.press('Enter')
  await expect(input).toBeFocused()
  await page.reload()
  await expect(history.getByText('No Record')).toBeVisible()
  expect(weather).toBe(2)
})

for (const outcome of ['success', 'failure', 'cancel'] as const) {
  test(`deleting a pending replay source: ${outcome}`, async ({ page }) => {
    await page.addInitScript(({ key, event }) => {
      if (localStorage.getItem(key) === null) localStorage.setItem(key, JSON.stringify({ version: 1, records: [event] }))
    }, { key: HISTORY_KEY, event: saved() })
    const release = deferred<void>()
    let requests = 0
    await page.route('https://api.openweathermap.org/**', async route => {
      requests++
      expect(new URL(route.request().url()).pathname).toBe('/data/2.5/weather')
      await release.promise
      await route.fulfill(outcome === 'failure' ? { status: 503, json: {} } : { json: fullWeather() }).catch(() => {})
    })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    const history = page.getByRole('region', { name: 'Search History' })
    const replay = history.getByRole('button', { name: /Search again/ })
    await replay.click()
    await expect.poll(() => requests).toBe(1)
    await expect(replay).toBeDisabled()
    await expect(replay).toHaveText('Searching...')
    await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeDisabled()
    await expect(page.locator('.search-indicator')).toHaveCount(1)
    expect(await page.locator('.search-indicator').evaluate(el => getComputedStyle(el).animationName)).toBe('none')
    await replay.evaluate((button: HTMLButtonElement) => { button.click(); button.click() })
    expect(requests).toBe(1)
    await history.getByRole('button', { name: /Delete/ }).click()
    await expect(history.getByText('No Record')).toBeVisible()
    await expect(page.getByRole('status')).toContainText('Fetching weather for Johor Bahru, MY...')
    await expect(page.locator('.search-indicator')).toHaveCount(0)
    await expect(page.getByRole('textbox')).toHaveAttribute('readonly')
    if (outcome === 'cancel') await page.getByRole('button', { name: 'Clear' }).click()
    release.resolve()
    if (outcome === 'success') {
      await expect(history.getByRole('listitem')).toHaveCount(1)
      expect(await history.getByRole('listitem').getAttribute('data-history-id')).not.toBe('original')
      expect(await history.locator('time').getAttribute('datetime')).not.toBe(saved().completedAt)
      await page.getByRole('button', { name: 'Clear' }).click()
      await expect(history.getByRole('listitem')).toHaveCount(1)
    } else {
      if (outcome === 'failure') await expect(page.getByRole('status')).toContainText('temporarily unavailable')
      else await expect(page.getByRole('status')).toBeEmpty()
      await expect(history.getByRole('listitem')).toHaveCount(0)
    }
    await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeEnabled()
    await page.reload()
    await expect(history.getByRole('listitem')).toHaveCount(outcome === 'success' ? 1 : 0)
  })
}

test('replay replaces location choice and long history stays accessible with deterministic equal-time order', async ({ page }) => {
  const events = Array.from({ length: 8 }, (_, index) => saved(String(index), index === 7
    ? { ...singapore, city: 'A very long saved city name with additional regional words for mobile wrapping' } : johor))
  await page.addInitScript(({ key, events }) => localStorage.setItem(key, JSON.stringify({ version: 1, records: events })), { key: HISTORY_KEY, events })
  let weatherRequests = 0
  await page.route('https://api.openweathermap.org/**', async route => {
    const url = new URL(route.request().url())
    if (url.pathname.includes('/geo/')) return route.fulfill({ json: [locationPayload(johor), locationPayload(singapore)] })
    weatherRequests++
    expect(url.searchParams.get('lat')).toBe(String(singapore.latitude))
    return route.fulfill({ json: fullWeather() })
  })
  await page.goto('/')
  const history = page.getByRole('region', { name: 'Search History' })
  const rows = history.getByRole('listitem')
  await expect(rows).toHaveCount(8)
  expect(await rows.evaluateAll(elements => elements.map(row => row.getAttribute('data-history-id')))).toEqual(events.map(event => event.id))
  await page.getByRole('textbox').fill('City')
  await page.getByRole('textbox').press('Enter')
  await expect(page.getByRole('heading', { name: 'Choose a location' })).toBeVisible()
  expect(weatherRequests).toBe(0)
  await rows.nth(7).getByRole('button', { name: /Search again/ }).click()
  await expect(page.getByRole('heading', { name: 'Choose a location' })).toHaveCount(0)
  await expect(rows).toHaveCount(9)
  expect(weatherRequests).toBe(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await rows.nth(4).getByRole('button', { name: /Delete/ }).focus()
  await page.keyboard.press('Space')
  await expect(rows.nth(4).getByRole('button', { name: /Delete/ })).toBeFocused()
  await expect(rows).toHaveCount(8)
})

test('corrupt entries are salvaged, malformed envelopes warn, and hydration never overwrites saved data', async ({ page }) => {
  await page.goto('/')
  const valid = saved()
  for (const raw of ['{broken', JSON.stringify({ version: 9, records: [valid] }), JSON.stringify({ version: 1, records: [valid, { ...valid, id: 'bad', location: { ...johor, latitude: 200 } }] })]) {
    await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key: HISTORY_KEY, raw })
    await page.reload()
    await expect(page.getByRole('status')).toContainText('could not be restored')
    expect(await page.evaluate(key => localStorage.getItem(key), HISTORY_KEY)).toBe(raw)
  }
  await expect(page.getByRole('region', { name: 'Search History' }).getByRole('listitem')).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'Current weather' })).toHaveCount(0)
})

for (const mode of ['denied', 'quota'] as const) {
  test(`storage ${mode} keeps degraded search, replay, and deletion usable with separate warnings`, async ({ page }) => {
    await page.addInitScript(({ key, mode }) => {
      if (mode === 'denied') Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('', 'SecurityError') } })
      else {
        const set = Storage.prototype.setItem
        Storage.prototype.setItem = function (name, value) {
          if (name === key) throw new DOMException('', 'QuotaExceededError')
          return set.call(this, name, value)
        }
      }
    }, { key: HISTORY_KEY, mode })
    await page.route('https://api.openweathermap.org/**', route => route.fulfill({ json:
      new URL(route.request().url()).pathname.includes('/geo/') ? [locationPayload(johor)] : { main: { temp: 0 }, weather: [{ main: 'Clouds' }] },
    }))
    await page.goto('/')
    const history = page.getByRole('region', { name: 'Search History' })
    await page.getByRole('textbox').fill('Johor')
    await page.getByRole('textbox').press('Enter')
    await expect(history.getByRole('listitem')).toHaveCount(1)
    await expect(page.getByRole('status')).toHaveCount(1)
    await expect(page.getByRole('status')).toContainText('Some weather details are unavailable.')
    await expect(page.getByRole('status')).toContainText('only for this session')
    await history.getByRole('button', { name: /Search again/ }).click()
    await expect(history.getByRole('listitem')).toHaveCount(2)
    await page.getByRole('button', { name: 'Clear' }).click()
    await expect(history.getByRole('listitem')).toHaveCount(2)
    await expect(page.getByRole('status')).toContainText('only for this session')
    await history.getByRole('listitem').first().getByRole('button', { name: /Delete/ }).click()
    await expect(history.getByRole('listitem')).toHaveCount(1)
    await history.getByRole('button', { name: /Delete/ }).click()
    await expect(history.getByText('No Record')).toBeVisible()
  })
}
