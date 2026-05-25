/**
 * Genera src/data/og-cache.json con los metadatos OG de cada fuente de prensa.
 * Los thumbnails se descargan a public/og-thumbs/<id>.jpg
 *
 * Uso:
 *   node scripts/fetch-og.mjs          # solo nuevas entradas
 *   node scripts/fetch-og.mjs --force  # re-descarga todo
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const root  = join(__dir, '..')

const sourcesPath = join(root, 'src', 'data', 'sources.json')
const cachePath   = join(root, 'src', 'data', 'og-cache.json')
const thumbsDir   = join(root, 'public', 'og-thumbs')

const force = process.argv.includes('--force')

mkdirSync(thumbsDir, { recursive: true })

const { sources } = JSON.parse(readFileSync(sourcesPath, 'utf8'))
const existing    = existsSync(cachePath) && !force
  ? JSON.parse(readFileSync(cachePath, 'utf8'))
  : {}

const HOMEPAGE_RE = /^https?:\/\/[^/]+\/?$/
const targets = sources.filter(s =>
  (s.type === 'press' || s.type === 'fact_check') &&
  s.url &&
  !HOMEPAGE_RE.test(s.url.trim())
)

console.log(`\n${targets.length} URLs a procesar${force ? ' (--force: re-descarga todo)' : ''}\n`)

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Accept': 'text/html,application/xhtml+xml',
}

function extractMeta(html, ...props) {
  for (const prop of props) {
    const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i')
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i')
    const m = html.match(re1) ?? html.match(re2)
    if (m?.[1]) return m[1].trim()
  }
  return null
}

async function fetchHTML(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: FETCH_HEADERS,
      redirect: 'follow',
    })
    clearTimeout(timer)
    if (!res.ok) return null
    const reader = res.body.getReader()
    let html = ''
    while (html.length < 60000) {
      const { done, value } = await reader.read()
      if (done) break
      html += new TextDecoder().decode(value)
    }
    reader.cancel()
    return html
  } catch {
    clearTimeout(timer)
    return null
  }
}

async function downloadThumb(imageUrl, id) {
  const destPath = join(thumbsDir, `${id}.jpg`)
  // Skip if already downloaded and not forcing
  if (!force && existsSync(destPath)) return `/og-thumbs/${id}.jpg`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        ...FETCH_HEADERS,
        'Accept': 'image/webp,image/apng,image/*,*/*',
        // Spoof Referer as the article page to bypass hotlink protection
        'Referer': imageUrl,
      },
      redirect: 'follow',
    })
    clearTimeout(timer)
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    if (buf.byteLength < 1000) return null // too small — probably an error page
    writeFileSync(destPath, Buffer.from(buf))
    return `/og-thumbs/${id}.jpg`
  } catch {
    clearTimeout(timer)
    return null
  }
}

const cache = { ...existing }
let fetched = 0, skipped = 0, failed = 0

for (const src of targets) {
  if (cache[src.id] && !force) {
    console.log(`  ⏭  ${src.id} (ya en caché)`)
    skipped++
    continue
  }
  process.stdout.write(`  ⬇  ${src.id} … `)
  const html = await fetchHTML(src.url)
  if (!html) {
    cache[src.id] = null
    console.log('✗ sin respuesta')
    failed++
    continue
  }

  const og = {
    image:       extractMeta(html, 'og:image', 'twitter:image'),
    title:       extractMeta(html, 'og:title', 'twitter:title'),
    description: extractMeta(html, 'og:description', 'description', 'twitter:description'),
    siteName:    extractMeta(html, 'og:site_name'),
    localThumb:  null,
  }

  if (og.image) {
    const localPath = await downloadThumb(og.image, src.id)
    og.localThumb = localPath
  }

  if (og.title || og.image) {
    cache[src.id] = og
    const thumbStatus = og.localThumb ? '📷' : og.image ? '🔗' : '—'
    console.log(`✓ ${thumbStatus} ${og.title?.slice(0, 55) ?? ''}`)
    fetched++
  } else {
    cache[src.id] = null
    console.log('✗ sin datos')
    failed++
  }

  await new Promise(r => setTimeout(r, 350))
}

writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8')

console.log(`\n✅ Listo — ${fetched} nuevas, ${skipped} en caché, ${failed} sin datos`)
console.log(`   Cache:    src/data/og-cache.json`)
console.log(`   Thumbs:   public/og-thumbs/\n`)
