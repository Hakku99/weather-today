import { expect, test, type Page } from '@playwright/test'
import { THEME_KEY } from '../../src/hooks/useTheme'
import { deferred, fullWeather, johor, locationPayload, singapore } from '../../src/test/weatherFixtures'

const HISTORY_KEY = 'weather-today.history'

async function selectTheme(page: Page, theme: 'Light' | 'Dark') {
  const toggle = page.getByRole('button', { name: 'Toggle dark mode' })
  if (await toggle.getAttribute('aria-pressed') !== String(theme === 'Dark')) await toggle.click()
}

test('weather card preserves approved breakpoints, typography, metadata and optional description', async ({ page }, testInfo) => {
  let temperature = 29.14
  const location = { ...johor, city: 'Gelang Patah' }
  await page.route('https://api.openweathermap.org/**', route => route.fulfill({ json:
    new URL(route.request().url()).pathname.includes('/geo/') ? [locationPayload(location)]
      : { ...fullWeather(), main: { ...fullWeather().main, temp: temperature }, weather: [{ main: 'Clouds' }] } }))
  await page.goto('/')
  await page.getByRole('textbox').fill('Gelang Patah, MY')
  await page.getByRole('textbox').press('Enter')
  const card = page.getByRole('region', { name: 'Current weather' })
  await expect(card).toBeVisible()
  await expect(page.getByRole('status')).not.toContainText('unavailable')
  await expect(card.locator('.weather-description, .weather-region, .weather-note, style')).toHaveCount(0)
  await expect(card.locator('.weather-observation dd')).toHaveText(/^\d{2}-\d{2}-\d{4} \d{2}:\d{2} (am|pm)$/)
  await expect(card.locator('.weather-observation dd')).toHaveAccessibleDescription(/UTC\+08:00/)

  for (const width of [280, 284, 285, 300, 301, 320, 349, 350, 351, 360, 374, 375, 393, 600, 601, 660, 661, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const theme of ['Light', 'Dark'] as const) {
      await selectTheme(page, theme)
      await page.evaluate(() => document.fonts.ready)
      await page.locator('.weather-art').evaluate(async element => {
        await Promise.all(element.getAnimations().map(animation => animation.finished))
      })
      const geometry = await card.evaluate(element => {
        const fields = ['location', 'observation', 'humidity', 'condition'].map(name => {
          const field = element.querySelector<HTMLElement>(`.weather-${name}`)!
          const style = getComputedStyle(field)
          const bounds = field.getBoundingClientRect()
          return { column: style.gridColumnStart, row: style.gridRowStart, top: bounds.top,
            font: style.fontSize, color: style.color, align: style.textAlign }
        })
        const nodes = element.querySelectorAll('.weather-temperature dd, .weather-range dt, .weather-range dd, .weather-location dd, .weather-observation dd, .weather-humidity dt, .weather-humidity dd, .weather-condition dd')
        const rects = Array.from(nodes).flatMap((node, source) => {
          const range = document.createRange()
          range.selectNodeContents(node)
          return Array.from(range.getClientRects()).map(rect => ({ source, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }))
        })
        const overlaps = rects.flatMap((a, index) => rects.slice(index + 1).filter(b => a.source !== b.source
          && a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5)
          .map(b => [a.source, b.source]))
        return { fields, overlaps, columns: getComputedStyle(element.querySelector('.weather-values')!).gridTemplateColumns.split(' ').map(parseFloat),
          temperatureFont: getComputedStyle(element.querySelector('.weather-temperature dd')!).fontSize,
          rangeFont: getComputedStyle(element.querySelector('.weather-range')!).fontSize,
          imageWidth: document.querySelector('.weather-art')!.getBoundingClientRect().width,
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth }
      })
      expect(geometry.overflow).toBe(false)
      expect(geometry.overlaps).toEqual([])
      const font = width <= 660 ? '14px' : '16px'
      expect(geometry.rangeFont).toBe(font)
      expect(geometry.fields.every(field => field.font === font)).toBe(true)
      expect(geometry.fields.every(field => field.color === (theme === 'Light' ? 'rgb(102, 102, 102)' : 'rgb(238, 229, 255)'))).toBe(true)
      expect(geometry.temperatureFont).toBe(width <= 660 ? '50px' : '81px')
      const desktopImageWidth = Math.min(300, Math.max(169.5, Math.min(700, width - 48) - 400))
      expect(geometry.imageWidth).toBeCloseTo(width <= 300 ? 105 : width <= 350 ? 140 : width <= 660 ? 169.5 : desktopImageWidth)
      if (width <= 374) {
        expect(geometry.columns).toHaveLength(1)
        expect(geometry.fields.every(field => field.column === '1' && field.align === 'left')).toBe(true)
        expect(geometry.fields.every((field, index, fields) => index === 0 || field.top > fields[index - 1]!.top)).toBe(true)
      } else if (width <= 660) {
        expect(geometry.columns).toHaveLength(2)
        expect(geometry.columns[0]).toBeCloseTo(geometry.columns[1]!)
        expect(geometry.fields.map(field => [field.column, field.row])).toEqual([['1', '3'], ['2', '3'], ['2', '2'], ['2', '1']])
      } else {
        expect(geometry.fields.map(field => [field.column, field.row])).toEqual([['1', '3'], ['2', '3'], ['3', '3'], ['4', '3']])
      }
      if (testInfo.project.name === 'chromium' && [280, 350, 351, 374, 375, 393, 1440].includes(width)) {
        await page.screenshot({ path: `tmp/weather-card-review/${width}-${theme.toLowerCase()}.png`, fullPage: true })
      }
    }
  }
  for (const width of [280, 375]) {
    await page.setViewportSize({ width, height: 852 })
    for (const value of [-99, 100, -123.45]) {
      temperature = value
      await page.getByRole('textbox').press('Enter')
      await expect(card.getByText(`${Math.round(value)}°C`, { exact: true })).toBeVisible()
      await expect(card.locator('.weather-temperature dd')).toHaveCSS('font-size', '50px')
      expect(await card.locator('.weather-values').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(1)
      expect(await card.locator('.weather-temperature dd').evaluate(element => {
        const range = document.createRange()
        range.selectNodeContents(element)
        return new Set(Array.from(range.getClientRects()).map(rect => rect.top)).size
      })).toBe(1)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    }
  }
})

test('theme switches preserve data and persist after reload', async ({ page }) => {
  await page.route('https://api.openweathermap.org/**', route => route.fulfill({ json:
    new URL(route.request().url()).pathname.includes('/geo/') ? [locationPayload(johor)] : fullWeather() }))
  await page.goto('/')
  await page.getByRole('textbox').fill('Johor, MY')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(page.locator('.weather-panel')).toHaveAttribute('data-phase', 'success')
  const id = await page.locator('[data-history-id]').getAttribute('data-history-id')
  for (const theme of ['Dark', 'Light', 'Dark'] as const) {
    await selectTheme(page, theme)
    await expect(page.getByRole('main')).toHaveAttribute('data-theme', theme.toLowerCase())
    await expect(page.getByRole('textbox')).toHaveValue('Johor, MY')
    await expect(page.locator('[data-history-id]')).toHaveAttribute('data-history-id', id!)
    await expect(page.getByText('29°C', { exact: true })).toBeVisible()
  }
  await page.reload()
  await expect(page.getByRole('main')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByRole('button', { name: 'Toggle dark mode' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('[data-history-id]')).toHaveAttribute('data-history-id', id!)
  await expect(page.locator('.weather-location dd')).toHaveText('Search a city')
})

test('theme preference corruption and write denial keep controls usable', async ({ page }) => {
  await page.addInitScript(({ key }) => {
    localStorage.setItem(key, 'invalid-theme')
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException('Denied', 'SecurityError')
      original.call(this, name, value)
    }
  }, { key: THEME_KEY })
  await page.goto('/')
  await expect(page.getByRole('main')).toHaveAttribute('data-theme', 'light')
  await page.getByRole('button', { name: 'Toggle dark mode' }).click()
  await expect(page.getByRole('main')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByRole('status')).toContainText('Theme preference could not be saved')
  await page.getByRole('button', { name: 'Toggle dark mode' }).click()
  await expect(page.getByRole('main')).toHaveAttribute('data-theme', 'light')
})

test('responsive themes retain geometry, readable data, scrolling, and usable targets', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(({ key, location }) => localStorage.setItem(key, JSON.stringify({ version: 1,
    records: Array.from({ length: 8 }, (_, i) => ({ id: `visual-${i}`, location,
      completedAt: new Date(Date.UTC(2026, 9, 3, 10, i)).toISOString() })) })), { key: HISTORY_KEY, location: johor })
  let long = false
  await page.route('https://api.openweathermap.org/**', route => route.fulfill({ json:
    new URL(route.request().url()).pathname.includes('/geo/') ? [locationPayload(long ? { ...johor,
      city: 'San Fernando del Valle de Catamarca - a very long location name' } : johor)]
      : { ...fullWeather(), ...(long ? { main: { temp: -123.45, humidity: 0 }, weather: [{ main: 'A very long weather category with additional words',
        description: 'A very long weather description that must wrap without hiding controls or any required information.' }], dt: null } : {}) } }))
  await page.goto('/')
  await page.getByRole('textbox').fill('Johor, MY')
  await page.getByRole('textbox').press('Enter')
  await expect(page.locator('.weather-panel')).toHaveAttribute('data-phase', 'success')
  for (const width of [1440, 393, 280, 320, 375, 390, 768, 1280, 852]) {
    await page.setViewportSize({ width, height: width === 393 ? 852 : width === 852 ? 393 : 900 })
    for (const theme of ['Light', 'Dark'] as const) {
      await selectTheme(page, theme)
      await page.evaluate(() => document.fonts.ready)
      const geometry = await page.evaluate(() => {
        const root = document.documentElement
        const image = document.querySelector<HTMLImageElement>('.weather-art')!
        const bounds = image.getBoundingClientRect()
        return { overflow: root.scrollWidth > root.clientWidth, ratio: bounds.width / bounds.height,
          loaded: image.complete && image.naturalWidth === 648, scrolling: root.scrollHeight > root.clientHeight,
          targets: Array.from(document.querySelectorAll('button')).map(button => {
            const rect = button.getBoundingClientRect(); return { width: rect.width, height: rect.height }
          }), background: getComputedStyle(document.querySelector('main')!).backgroundImage }
      })
      expect(geometry.overflow).toBe(false)
      expect(geometry.loaded).toBe(true)
      expect(geometry.ratio).toBeCloseTo(648 / 655, 2)
      expect(geometry.scrolling).toBe(true)
      expect(geometry.targets.every(target => target.width >= 44 && target.height >= 44)).toBe(true)
      expect(geometry.background).toContain(theme === 'Light' ? 'bg-light' : 'bg-dark')
      if (testInfo.project.name === 'chromium' && [1440, 393].includes(width)) {
        await page.evaluate(() => window.scrollTo(0, 0))
        await page.screenshot({ path: `tmp/m3-review/${width}-${theme.toLowerCase()}.png`, fullPage: true })
      }
    }
  }
  long = true
  await page.setViewportSize({ width: 280, height: 740 })
  await page.getByRole('textbox').press('Enter')
  await expect(page.getByText('Observation time unavailable')).toBeVisible()
  await expect(page.getByText('-123°C', { exact: true })).toBeVisible()
  // Check readability as well as overflow: auto tracks previously squeezed the city to one letter per line.
  for (const width of [661, 720, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    const location = await page.locator('.weather-location dd').evaluate(element => ({
      width: element.getBoundingClientRect().width,
      lines: element.getBoundingClientRect().height / parseFloat(getComputedStyle(element).lineHeight),
    }))
    expect(location.width).toBeGreaterThanOrEqual(80)
    expect(location.lines).toBeLessThanOrEqual(10)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  }
  await page.setViewportSize({ width: 280, height: 740 })
  for (const theme of ['Light', 'Dark'] as const) {
    await selectTheme(page, theme)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    // The approved minimum is 280 effective CSS px, including after zoom.
    // CSS zoom is supplementary layout coverage, not native browser zoom proof.
    await page.setViewportSize({ width: 560, height: 740 })
    await page.evaluate(() => { document.documentElement.style.zoom = '2' })
    expect(await page.locator('main').evaluate(element => element.clientWidth)).toBe(280)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    await expect(page.locator('.weather-temperature dd')).toHaveCSS('font-size', '50px')
    const temperatureBounds = await page.locator('.weather-temperature dd').evaluate(element => {
      const range = document.createRange()
      range.selectNodeContents(element)
      const bounds = range.getBoundingClientRect()
      return { left: bounds.left, right: bounds.right, viewport: window.innerWidth }
    })
    expect(temperatureBounds.left).toBeGreaterThanOrEqual(0)
    expect(temperatureBounds.right).toBeLessThanOrEqual(temperatureBounds.viewport)
    await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible()
    if (testInfo.project.name === 'chromium') {
      await page.screenshot({ path: `tmp/m3-review/280-effective-zoom-${theme.toLowerCase()}.png`, fullPage: true })
    }
    await page.evaluate(() => { document.documentElement.style.zoom = '' })
    await page.setViewportSize({ width: 280, height: 740 })
  }
  if (testInfo.project.name === 'chromium') await page.screenshot({ path: 'tmp/m3-review/280-long-dark.png', fullPage: true })
  expect(errors).toEqual([])
})

test('initial, loading, choice, error, and replay controls stay clear and keyboard usable', async ({ page }, testInfo) => {
  let mode = 'full'
  let release = deferred<void>()
  await page.route('https://api.openweathermap.org/**', async route => {
    const geocoding = new URL(route.request().url()).pathname.includes('/geo/')
    if (mode === 'loading' || (mode === 'replay' && !geocoding)) await release.promise
    await route.fulfill(mode === 'error' ? { status: 503, json: {} } : { json: geocoding
      ? [locationPayload(johor), ...(mode === 'choice' ? [locationPayload(singapore)] : [])]
      : fullWeather() }).catch(() => {})
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const width of [280, 320, 393, 1440]) {
    await page.setViewportSize({ width, height: width === 393 ? 852 : 900 })
    for (const theme of ['Light', 'Dark'] as const) {
      await page.goto('/')
      await selectTheme(page, theme)
      await page.evaluate(() => document.fonts.ready)
      const input = page.getByRole('textbox')
      const clear = page.getByRole('button', { name: 'Reset' })
      const before = await clear.boundingBox()
      const capture = async (state: string) => {
        if (testInfo.project.name === 'chromium') {
          await page.screenshot({ path: `tmp/m3-review/${width}-${theme.toLowerCase()}-${state}.png` })
        }
      }
      await capture('initial')
      mode = 'loading'
      release = deferred<void>()
      await input.fill('Johor, MY')
      await input.press('Enter')
      await expect(page.getByRole('status')).toContainText('Finding locations')
      expect(await clear.boundingBox()).toEqual(before)
      await expect(input).toHaveAttribute('readonly')
      await input.focus()
      await input.press('ControlOrMeta+A')
      expect(await input.evaluate((element: HTMLInputElement) => element.selectionEnd! - element.selectionStart!)).toBe(9)
      expect(await page.locator('.search-indicator').evaluate(element => getComputedStyle(element).animationName)).toBe('none')
      const overlap = await page.evaluate(() => {
        const intersects = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
        const caption = document.querySelector('.search-submit .action-caption')!.getBoundingClientRect()
        const title = document.querySelector('.weather-panel h1')!
        const titleRange = document.createRange(); titleRange.selectNodeContents(title)
        return { caption: [...document.querySelectorAll('.search-field, .search-utility button')]
          .some(element => intersects(caption, element.getBoundingClientRect())),
          title: intersects(titleRange.getBoundingClientRect(), document.querySelector('.weather-art')!.getBoundingClientRect()) }
      })
      expect(overlap).toEqual({ caption: false, title: false })
      await capture('loading')
      await clear.click()
      await expect(input).toBeFocused()
      release.resolve()
      mode = 'choice'
      await input.fill('City')
      await input.press('Enter')
      await expect(page.getByRole('button', { name: /Singapore, SG/ })).toBeVisible()
      await expect(input).not.toHaveAttribute('readonly')
      await expect(page.locator('.search-indicator')).toHaveCount(0)
      await capture('choice')
      await clear.click()
      mode = 'error'
      await input.fill('Johor')
      await input.press('Enter')
      await expect(page.getByRole('status')).toContainText('temporarily unavailable')
      await capture('error')
      mode = 'full'
      await input.press('Enter')
      await expect(page.locator('.weather-panel')).toHaveAttribute('data-phase', 'success')
      mode = 'replay'
      release = deferred<void>()
      const row = page.locator('[data-history-id]').first()
      const id = await row.getAttribute('data-history-id')
      await row.getByRole('button', { name: /Search again/ }).click()
      await expect(row.getByText('Searching...', { exact: true })).toBeVisible()
      await expect(page.locator('.search-indicator')).toHaveCount(1)
      await expect(page.locator('.search-submit .search-indicator')).toHaveCount(0)
      await capture('replay')
      await row.getByRole('button', { name: /Delete record/ }).click()
      await expect(page.locator(`[data-history-id="${id}"]`)).toHaveCount(0)
      await expect(page.getByRole('status')).toContainText('Fetching weather')
      await expect(page.locator('.search-indicator')).toHaveCount(0)
      mode = 'full'
      release.resolve()
      await expect(page.locator('.weather-panel')).toHaveAttribute('data-phase', 'success')
      await expect(page.getByRole('status')).not.toContainText('Saving search history')
    }
  }
})
