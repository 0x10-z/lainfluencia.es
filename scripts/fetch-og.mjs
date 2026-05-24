/**
 * Genera src/data/og-cache.json con los metadatos OG de cada fuente de prensa.
 * Uso: node scripts/fetch-og.mjs
 * Corre una sola vez; el resultado se commitea y el build lo usa como datos estáticos.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const root  = join(__dir, '..')

const sourcesPath = join(root, 'src', 'data', 'sources.json')
const cachePath   = join(root, 'src', 'data', 'og-cache.json')

const { sources } = JSON.parse(readFileSync(sourcesPath, 'utf8'))
const existing    = existsSync(cachePath)
  ? JSON.parse(readFileSync(cachePath, 'utf8'))
  : {}

// Solo fuentes de prensa/fact_check con URL específica (no homepages genéricas)
const HOMEPAGE_RE = /^https?:\/\/[^/]+\/?$/
const targets = sources.filter(s =>
  (s.type === 'press' || s.type === 'fact_check') &&
  s.url &&
  !HOMEPAGE_RE.test(s.url.trim())
)

console.log(`\n${targets.length} URLs a procesar (ignorando homepages genéricas)\n`)

function extractMeta(html, ...props) {
  for (const prop of props) {
    // property="og:x" content="..."  o  content="..." property="og:x"
    const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i')
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i')
    const m = html.match(re1) ?? html.match(re2)
    if (m?.[1]) return m[1].trim()
  }
  return null
}

async function fetchOG(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 7000)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    })
    clearTimeout(timer)
    if (!res.ok) return null
    // Leer solo los primeros 50KB — los meta tags siempre están en el <head>
    const reader = res.body.getReader()
    let html = ''
    while (html.length < 50000) {
      const { done, value } = await reader.read()
      if (done) break
      html += new TextDecoder().decode(value)
    }
    reader.cancel()
    return {
      image:       extractMeta(html, 'og:image', 'twitter:image'),
      title:       extractMeta(html, 'og:title', 'twitter:title'),
      description: extractMeta(html, 'og:description', 'description', 'twitter:description'),
      siteName:    extractMeta(html, 'og:site_name'),
    }
  } catch (e) {
    clearTimeout(timer)
    return null
  }
}

const cache = { ...existing }
let fetched = 0, skipped = 0, failed = 0

for (const src of targets) {
  if (cache[src.id]) {
    console.log(`  ⏭  ${src.id} (ya en caché)`)
    skipped++
    continue
  }
  process.stdout.write(`  ⬇  ${src.id} … `)
  const og = await fetchOG(src.url)
  if (og && (og.image || og.title)) {
    cache[src.id] = og
    console.log(`✓ ${og.image ? '[img]' : '[no img]'} ${og.title?.slice(0, 60) ?? ''}`)
    fetched++
  } else {
    cache[src.id] = null
    console.log('✗ sin datos')
    failed++
  }
  // Pequeña pausa para no saturar los servidores
  await new Promise(r => setTimeout(r, 300))
}

writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8')

console.log(`\n✅ Listo — ${fetched} nuevas, ${skipped} en caché, ${failed} sin datos`)
console.log(`   Guardado en: src/data/og-cache.json\n`)
