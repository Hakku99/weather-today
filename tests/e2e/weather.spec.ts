import { expect, test } from '@playwright/test'
import { deferred, fullWeather, johor, locationPayload, singapore } from '../../src/test/weatherFixtures'

test('renders all real-response fields and the supplied local decorative asset', async ({ page }) => {
  const requests: URL[] = []
  await page.route('https://api.openweathermap.org/**', async route => {
    const url = new URL(route.request().url())
    requests.push(url)
    await route.fulfill({ json: url.pathname.includes('/geo/') ? [locationPayload(johor)] : fullWeather() })
  })
  await page.goto('/')
  await page.getByRole('textbox').fill('Johor, Malaysia')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  const card = page.getByRole('region', { name: 'Current weather' })
  await expect(card).toBeVisible()
  for (const field of ['Johor Bahru, MY', '29°C', '30°C', '26°C', 'Clouds', 'overcast clouds', '82%']) {
    await expect(card.getByText(field, { exact: true })).toBeVisible()
  }
  await expect(card.getByText(/UTC\+08:00/)).toBeVisible()
  await expect(page.getByRole('status')).not.toContainText('unavailable')
  expect(requests[0]?.searchParams.get('q')).toBe('Johor,MY')
  expect(requests[1]?.searchParams.get('units')).toBe('metric')
  expect(requests[1]?.searchParams.get('lat')).toBe(String(johor.latitude))
  const geometry = await card.locator('img').evaluate((image: HTMLImageElement) => ({
    loaded: image.complete && image.naturalWidth > 0, ratio: image.naturalWidth / image.naturalHeight,
  }))
  expect(geometry.loaded).toBe(true)
  expect(geometry.ratio).toBeCloseTo(648 / 655)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('chooses a non-first match by keyboard, invalidates edits, and locks duplicate clicks', async ({ page }) => {
  let weatherRequests = 0
  const release = deferred<void>()
  await page.route('https://api.openweathermap.org/**', async route => {
    const url = new URL(route.request().url())
    if (url.pathname.includes('/geo/')) await route.fulfill({ json: [locationPayload(johor), locationPayload(singapore)] })
    else {
      weatherRequests++
      expect(url.searchParams.get('lat')).toBe(String(singapore.latitude))
      await release.promise
      await route.fulfill({ json: fullWeather() }).catch(() => {})
    }
  })
  await page.goto('/')
  const input = page.getByRole('textbox')
  await input.fill('City')
  await input.press('Enter')
  const choice = page.getByRole('button', { name: /Singapore, SG/ })
  await expect(choice).toBeVisible()
  expect(weatherRequests).toBe(0)
  await expect(input).not.toHaveAttribute('readonly')
  await input.fill('Other city')
  await expect(choice).toHaveCount(0)
  expect(weatherRequests).toBe(0)
  await input.press('Enter')
  await expect(choice).toBeVisible()
  await choice.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Clear' })).toBeFocused()
  await expect(page.getByRole('status')).toContainText('Fetching weather for Singapore, SG')
  await expect.poll(() => weatherRequests).toBe(1)
  await page.getByRole('button', { name: 'Searching...' }).evaluate((button: HTMLButtonElement) => { button.click(); button.click() })
  expect(weatherRequests).toBe(1)
  release.resolve()
  await expect(page.getByText('Singapore, SG', { exact: true })).toBeVisible()
})

test('Clear cancels geocoding and weather, preserves newer loading, and supports reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  let geoRequests = 0
  let weatherRequests = 0
  const geoRelease = deferred<void>()
  const weatherRelease = deferred<void>()
  await page.route('https://api.openweathermap.org/**', async route => {
    const url = new URL(route.request().url())
    if (url.pathname.includes('/geo/')) {
      geoRequests++
      if (geoRequests === 1) await geoRelease.promise
      await route.fulfill({ json: [locationPayload(johor)] }).catch(() => {})
    } else {
      weatherRequests++
      if (weatherRequests === 1) await weatherRelease.promise
      await route.fulfill({ json: fullWeather() }).catch(() => {})
    }
  })
  await page.goto('/')
  const input = page.getByRole('textbox')
  const clear = page.getByRole('button', { name: 'Clear' })
  await input.fill('Johor')
  await input.press('Enter')
  await expect.poll(() => geoRequests).toBe(1)
  await expect(input).toHaveAttribute('readonly')
  await expect(input).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Searching...' })).toBeDisabled()
  await expect(page.getByText('Search in progress. Use Clear to cancel.')).toBeVisible()
  expect(await page.locator('.search-indicator').evaluate(el => getComputedStyle(el).animationName)).toBe('none')
  await clear.click()
  await expect(input).toBeFocused()
  await input.fill('Johor, MY')
  await input.press('Enter')
  await expect.poll(() => weatherRequests).toBe(1)
  geoRelease.resolve()
  await expect(page.getByRole('status')).toContainText('Fetching weather')
  await clear.click()
  await input.fill('Johor, Malaysia')
  await input.press('Enter')
  await expect(page.getByRole('heading', { name: 'Current weather' })).toBeVisible()
  weatherRelease.resolve()
  await expect(page.getByRole('status')).toContainText('Weather loaded for Johor Bahru, MY.')
  expect(weatherRequests).toBe(2)
  await clear.click()
  await expect(page.getByRole('status')).toBeEmpty()
  await expect(page.getByRole('heading', { name: 'Current weather' })).toHaveCount(0)
})

test('reports provider errors, no match/mismatch, malformed data, and degraded fields honestly', async ({ page }) => {
  let mode = 'full'
  let weatherRequests = 0
  await page.route('https://api.openweathermap.org/**', async route => {
    const geo = new URL(route.request().url()).pathname.includes('/geo/')
    if (geo) {
      if (/^http/.test(mode)) return route.fulfill({ status: Number(mode.slice(4)), json: {} })
      if (mode === 'network') return route.abort('failed')
      if (mode === 'empty') return route.fulfill({ json: [] })
      if (mode === 'mismatch') return route.fulfill({ json: [locationPayload(singapore)] })
      if (mode === 'json') return route.fulfill({ body: '{broken', contentType: 'application/json' })
      return route.fulfill({ json: [locationPayload(johor)] })
    }
    weatherRequests++
    const payload = mode === 'core' ? {} : mode === 'partial'
      ? { main: { temp: 0 }, weather: [{ main: 'Clouds' }], dt: 0 } : fullWeather()
    await route.fulfill({ json: payload })
  })
  await page.goto('/')
  const input = page.getByRole('textbox')
  await input.fill('Johor, MY')
  await input.press('Enter')
  await expect(page.getByRole('heading', { name: 'Current weather' })).toBeVisible()
  for (const [scenario, expected] of [['http401', 'API key'], ['http403', 'API key'], ['http404', 'No weather'],
    ['http429', 'limit reached'], ['http503', 'temporarily unavailable'], ['network', 'Check your connection'],
    ['empty', 'No matching location'], ['mismatch', 'requested country'], ['json', 'invalid data'], ['core', 'invalid data']]) {
    mode = scenario!
    await page.getByRole('button', { name: 'Search', exact: true }).click()
    await expect(page.getByRole('status')).toContainText(expected!)
    await expect(page.getByRole('heading', { name: 'Current weather' })).toHaveCount(0)
    await expect(input).toHaveValue('Johor, MY')
    await expect(input).not.toHaveAttribute('readonly')
  }
  expect(weatherRequests).toBe(2)
  mode = 'partial'
  await input.press('Enter')
  await expect(page.getByRole('heading', { name: 'Current weather' })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('Some weather details are unavailable.')
  await expect(page.getByText('0°C', { exact: true })).toBeVisible()
  await expect(page.getByText('Description unavailable')).toBeVisible()
  await expect(page.getByText('N/A', { exact: true })).toHaveCount(3)
  await expect(page.getByText(/01\/01\/1970.*UTC/)).toBeVisible()
})

test('timeout releases read-only controls and permits a fresh search', async ({ page }) => {
  await page.clock.install()
  const release = deferred<void>()
  let requests = 0
  await page.route('https://api.openweathermap.org/**', async route => {
    requests++
    if (requests === 1) {
      await release.promise
      await route.fulfill({ json: [] }).catch(() => {})
    } else await route.fulfill({ json: new URL(route.request().url()).pathname.includes('/geo/') ? [locationPayload(johor)] : fullWeather() })
  })
  await page.goto('/')
  const input = page.getByRole('textbox')
  await input.fill('Johor')
  await input.press('Enter')
  await expect.poll(() => requests).toBe(1)
  await page.clock.fastForward(15_001)
  await expect(page.getByRole('status')).toContainText('timed out')
  await expect(input).not.toHaveAttribute('readonly')
  await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeEnabled()
  release.resolve()
  await input.press('Enter')
  await expect(page.getByRole('heading', { name: 'Current weather' })).toBeVisible()
  await page.getByRole('button', { name: 'Clear' }).click()
  await expect(input).toBeFocused()
  await expect(page.getByRole('status')).toBeEmpty()
})

test('retains the UTC fallback notice while editing and removes it on replacement or Clear', async ({ page }) => {
  let requests = 0
  let weatherRequests = 0
  const nextLocations = deferred<void>()
  await page.route('https://api.openweathermap.org/**', async route => {
    requests++
    if (new URL(route.request().url()).pathname.includes('/geo/')) {
      if (requests === 3) await nextLocations.promise
      const location = requests === 3 ? singapore : johor
      await route.fulfill({ json: [locationPayload(location)] })
    } else {
      weatherRequests++
      await route.fulfill({ json: { ...fullWeather(), timezone: weatherRequests === 2 ? fullWeather().timezone : null } })
    }
  })
  await page.goto('/')
  const input = page.getByRole('textbox')
  const status = page.getByRole('status')
  const card = page.getByRole('region', { name: 'Current weather' })
  const notice = page.getByText(/Some weather details are unavailable/)
  await input.fill('Johor, MY')
  await input.press('Enter')
  await expect(card).toBeVisible()
  await expect(card.getByText(/\(UTC\)/)).toBeVisible()
  for (const value of ['Singapore', 'Singapore, SG', '']) {
    await input.fill(value)
    await expect(notice).toHaveCount(1)
    await expect(status).toContainText('Weather loaded for Johor Bahru, MY.')
    await expect(card.getByText('Johor Bahru, MY')).toBeVisible()
  }
  expect(requests).toBe(2)
  await input.fill('Singapore, SG')
  await input.press('Enter')
  await expect(status).toHaveText('Finding locations...')
  await expect(card).toHaveCount(0)
  await expect(notice).toHaveCount(0)
  nextLocations.resolve()
  await expect(card.getByText('Singapore, SG')).toBeVisible()
  await expect(status).toHaveText('Weather loaded for Singapore, SG.')
  await expect(notice).toHaveCount(0)
  await input.fill('Johor, MY')
  await input.press('Enter')
  await expect(notice).toHaveCount(1)
  await page.getByRole('button', { name: 'Clear' }).click()
  await expect(card).toHaveCount(0)
  await expect(status).toBeEmpty()
  await expect(input).toBeFocused()
})
