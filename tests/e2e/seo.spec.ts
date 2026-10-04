import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

const canonical = 'https://weather-today-pi.vercel.app/'
const title = "Today's Weather — Current Weather by City"

// Crawlers and link unfurlers must receive metadata without running React.
test.use({ javaScriptEnabled: false })

test('serves complete, consistent homepage metadata without JavaScript', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(title)
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Search current weather by city and country/)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical)
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', canonical)
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title)
  const image = `${canonical}assets/seo/share.png`
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', image)
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', image)
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary')
  const data = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText())
  expect(data).toMatchObject({ '@type': 'WebSite', name: "Today's Weather", url: canonical, inLanguage: 'en' })
  await expect(page.locator('head title')).toHaveCount(1)
  await expect(page.locator('meta[name="description"]')).toHaveCount(1)
})

test('serves the declared square icons and share image at stable URLs', async ({ page, request }) => {
  await page.goto('/')
  await expect(page.locator('link[rel="icon"][type="image/png"]')).toHaveAttribute('href', '/assets/seo/favicon.png')
  await expect(page.locator('link[rel="icon"][type="image/x-icon"]')).toHaveAttribute('href', '/assets/seo/favicon.ico')
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/assets/seo/apple-touch-icon.png')
  for (const [filename, size] of [['favicon.png', 96], ['apple-touch-icon.png', 180], ['share.png', 512]] as const) {
    const response = await request.get(`/assets/seo/${filename}`)
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('image/png')
    const body = await response.body()
    expect(body.equals(readFileSync(`assets/seo/${filename}`))).toBe(true)
    expect(body.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
    expect([body.readUInt32BE(16), body.readUInt32BE(20)]).toEqual([size, size])
  }
  const ico = await request.get('/assets/seo/favicon.ico')
  expect(ico.status()).toBe(200)
  const body = await ico.body()
  expect(body.equals(readFileSync('assets/seo/favicon.ico'))).toBe(true)
  expect(body.readUInt16LE(2)).toBe(1)
  expect(body.readUInt16LE(4)).toBe(3)
  expect([0, 1, 2].map(index => [body[6 + index * 16], body[7 + index * 16]])).toEqual([[16, 16], [32, 32], [48, 48]])
})

test('serves crawl files with the production homepage and correct content types', async ({ request }) => {
  const robots = await request.get('/robots.txt')
  expect(robots.status()).toBe(200)
  expect(robots.headers()['content-type']).toContain('text/plain')
  expect(await robots.text()).toBe(`User-agent: *\nAllow: /\n\nSitemap: ${canonical}sitemap.xml\n`)
  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.status()).toBe(200)
  expect(sitemap.headers()['content-type']).toContain('application/xml')
  const xml = await sitemap.text()
  expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')
  expect(xml.match(/<loc>(.*?)<\/loc>/g)).toEqual([`<loc>${canonical}</loc>`])
  for (const pathname of ['/robots.txt', '/sitemap.xml']) {
    const head = await request.head(pathname)
    expect(head.status()).toBe(200)
    expect(await head.body()).toHaveLength(0)
  }
})
