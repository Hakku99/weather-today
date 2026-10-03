import { expect, test } from '@playwright/test'
import { fullWeather } from '../../src/test/weatherFixtures'

test.beforeEach(async ({ page }) => {
  await page.route('https://api.openweathermap.org/**', async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname.includes('/geo/')) {
      const [city, country] = (url.searchParams.get('q') ?? '').split(',')
      await route.fulfill({ json: [{ name: city, country: country ?? (city === 'Singapore' ? 'SG' : 'MY'), lat: 1, lon: 103 }] })
    } else await route.fulfill({ json: fullWeather() })
  })
})

test('searches all accepted forms by click/Enter without page navigation', async ({ page }) => {
  await page.goto('/')
  let navigations = 0
  let weatherRequests = 0
  page.on('request', request => { if (new URL(request.url()).pathname === '/data/2.5/weather') weatherRequests++ })
  page.on('framenavigated', () => navigations++)
  const input = page.getByRole('textbox', { name: 'City, Country' })
  await expect(input).toHaveAttribute('placeholder', 'Enter a city, e.g. Johor, MY')
  let submissions = 0
  for (const [query, location] of [['Johor', 'Johor, MY'], ['Johor, Malaysia', 'Johor, MY'],
    ['Johor, MY', 'Johor, MY'], ['  Kuala   Lumpur , my ', 'Kuala Lumpur, MY'],
    ['Seoul, Korea, Republic of', 'Seoul, KR'], ['Singapore', 'Singapore, SG']] as const) {
    const previousFeedback = await page.getByRole('status').textContent()
    await input.fill(query)
    await expect(page.getByRole('status')).toHaveText(previousFeedback ?? '')
    if (query === 'Johor') await page.getByRole('button', { name: 'Search', exact: true }).click()
    else await input.press('Enter')
    await expect(page.locator('.weather-panel')).toHaveAttribute('data-phase', 'success')
    await expect.poll(() => weatherRequests).toBe(++submissions)
    await expect(page.getByRole('status')).toHaveText(`Weather loaded for ${location}.`)
    await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeEnabled()
    await expect(input).toHaveValue(query)
    await expect(input).toHaveAttribute('aria-invalid', 'false')
  }
  expect(navigations).toBe(0)
})

test('rejects invalid qualifiers without requesting; keyboard correction/Reset work', async ({ page }) => {
  await page.goto('/')
  let requests = 0
  page.on('request', request => { if (request.url().startsWith('https://api.openweathermap.org/')) requests++ })
  const input = page.getByRole('textbox', { name: 'City, Country' })
  for (const query of ['', ', MY', 'Johor,', 'Johor,,MY', 'Johor, Unknown', 'Austin, TX, US']) {
    await input.fill(query)
    await input.press('Enter')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByRole('status')).not.toBeEmpty()
  }
  expect(requests).toBe(0)
  await input.fill('Johor, MY')
  await expect(page.getByRole('status')).toBeEmpty()
  await input.press('Tab')
  await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status')).toContainText('Weather loaded for Johor, MY.')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Reset' })).toBeFocused()
  await page.keyboard.press('Space')
  await expect(input).toHaveValue('')
  await expect(input).toBeFocused()
  await expect(page.getByRole('status')).toBeEmpty()
  await expect(page.locator('.weather-location dd')).toHaveText('Search a city')
})
