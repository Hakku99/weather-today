import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { HtmlTagDescriptor, Plugin } from 'vite'

// Public site identity: update this URL when moving the production domain.
export const site = {
  name: "Today's Weather",
  title: "Today's Weather — Current Weather by City",
  description: 'Search current weather by city and country. View temperature, humidity and observation time, with saved search history and light and dark themes.',
  url: 'https://weather-today-pi.vercel.app/',
  language: 'en',
  images: {
    favicon: 'favicon.png',
    ico: 'favicon.ico',
    apple: 'apple-touch-icon.png',
    share: 'share.png',
  },
  imageAlt: 'Sun behind clouds with rain',
  shareSize: 512,
} as const

const assetPath = (name: string) => `/assets/seo/${name}`
const robots = `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap.xml', site.url).href}\n`
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${site.url}</loc></url>\n</urlset>\n`
const crawlFiles = {
  '/robots.txt': { content: robots, type: 'text/plain; charset=utf-8' },
  '/sitemap.xml': { content: sitemap, type: 'application/xml; charset=utf-8' },
}

function headTags(): HtmlTagDescriptor[] {
  const shareUrl = new URL(assetPath(site.images.share), site.url).href
  const metadata = [
    { name: 'description', content: site.description },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: site.name },
    { property: 'og:title', content: site.title },
    { property: 'og:description', content: site.description },
    { property: 'og:url', content: site.url },
    { property: 'og:image', content: shareUrl },
    { property: 'og:image:type', content: 'image/png' },
    { property: 'og:image:width', content: String(site.shareSize) },
    { property: 'og:image:height', content: String(site.shareSize) },
    { property: 'og:image:alt', content: site.imageAlt },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: site.title },
    { name: 'twitter:description', content: site.description },
    { name: 'twitter:image', content: shareUrl },
    { name: 'twitter:image:alt', content: site.imageAlt },
  ]
  return [
    { tag: 'title', children: site.title },
    ...metadata.map(attrs => ({ tag: 'meta', attrs })),
    { tag: 'link', attrs: { rel: 'canonical', href: site.url } },
    { tag: 'link', attrs: { rel: 'icon', type: 'image/x-icon', sizes: '16x16 32x32 48x48', href: assetPath(site.images.ico) } },
    { tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '96x96', href: assetPath(site.images.favicon) } },
    { tag: 'link', attrs: { rel: 'apple-touch-icon', sizes: '180x180', href: assetPath(site.images.apple) } },
    {
      tag: 'script',
      attrs: { type: 'application/ld+json' },
      children: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'WebSite',
        name: site.name, url: site.url, description: site.description, inLanguage: site.language,
      }).replaceAll('<', '\\u003c'),
    },
  ].map(tag => ({ ...tag, injectTo: 'head' }))
}

export function seoPlugin(): Plugin {
  const sourceDirectory = new URL('../assets/seo/', import.meta.url)
  return {
    name: 'weather-site-metadata',
    // Insert after Vite asset processing so these emitted URLs stay stable.
    transformIndexHtml: { order: 'post', handler: () => headTags() },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = request.url?.split('?')[0]
        const file = pathname === '/robots.txt' || pathname === '/sitemap.xml' ? crawlFiles[pathname] : undefined
        if (!file || (request.method !== 'GET' && request.method !== 'HEAD')) return next()
        response.setHeader('Content-Type', file.type)
        response.end(request.method === 'HEAD' ? undefined : file.content)
      })
    },
    buildStart() {
      for (const filename of Object.values(site.images)) {
        this.addWatchFile(fileURLToPath(new URL(filename, sourceDirectory)))
      }
    },
    generateBundle() {
      for (const filename of Object.values(site.images)) {
        this.emitFile({ type: 'asset', fileName: assetPath(filename).slice(1), source: readFileSync(new URL(filename, sourceDirectory)) })
      }
      for (const [pathname, file] of Object.entries(crawlFiles)) {
        this.emitFile({ type: 'asset', fileName: pathname.slice(1), source: file.content })
      }
    },
  }
}
