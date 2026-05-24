/**
 * Descarga fotos de perfil de personajes.
 * Uso: node scripts/fetch-photos.mjs
 *
 * Cadena de fuentes (en orden):
 *   1. Wikidata / Wikimedia Commons  (gratis, sin límite)
 *   2. Google Custom Search API      (gratis hasta 100/día)
 *      Requiere variables de entorno:
 *        GOOGLE_CSE_KEY  — API key de https://console.cloud.google.com
 *        GOOGLE_CSE_CX   — ID del motor en https://programmablesearchengine.google.com
 *        (crea el motor con "Buscar en toda la web" + "Búsqueda de imágenes" activada)
 *   3. Placeholder SVG con iniciales (siempre disponible)
 *
 * Flags:
 *   --force   Re-descarga incluso los que ya existen en disco
 */

import { readFileSync, writeFileSync, existsSync, createWriteStream } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { pipeline } from 'stream/promises'
import sharp from 'sharp'

const __dir  = dirname(fileURLToPath(import.meta.url))
const root   = join(__dir, '..')
const outDir = join(root, 'public', 'personas')
const cachePath = join(root, 'src', 'data', 'photos-cache.json')

const FORCE = process.argv.includes('--force')
const GOOGLE_KEY = process.env.GOOGLE_CSE_KEY
const GOOGLE_CX  = process.env.GOOGLE_CSE_CX

const { entities } = JSON.parse(readFileSync(join(root, 'src', 'data', 'entities.json'), 'utf8'))
const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf8')) : {}

const persons = entities.filter(e => e.cases.includes('dp-77-24'))

console.log(`\n👤 ${persons.length} entidades a procesar`)
if (GOOGLE_KEY && GOOGLE_CX) {
  console.log(`   Google CSE activado como fallback`)
} else {
  console.log(`   ⚠  Google CSE no configurado (GOOGLE_CSE_KEY / GOOGLE_CSE_CX no definidas)`)
}
console.log()

// ── 1. WIKIDATA ───────────────────────────────────────────────────────────────
async function getWikidataImage(name) {
  const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=es&type=item&limit=3&format=json`
  const searchRes = await fetch(searchUrl, {
    headers: { 'User-Agent': 'LaInfluencia/1.0' },
    signal: AbortSignal.timeout(8000),
  })
  if (!searchRes.ok) return null
  const { search = [] } = await searchRes.json()
  if (!search.length) return null

  for (const candidate of search) {
    const entityUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${candidate.id}&props=claims&format=json`
    const entityRes = await fetch(entityUrl, {
      headers: { 'User-Agent': 'LaInfluencia/1.0' },
      signal: AbortSignal.timeout(8000),
    })
    if (!entityRes.ok) continue
    const { entities: ents } = await entityRes.json()
    const p18 = ents?.[candidate.id]?.claims?.['P18']
    if (p18?.[0]?.mainsnak?.datavalue?.value) {
      const url = await getCommonsThumb(p18[0].mainsnak.datavalue.value)
      if (url) return { url, source: 'wikidata' }
    }
  }
  return null
}

async function getCommonsThumb(filename) {
  const normalized = filename.replace(/ /g, '_')
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(normalized)}&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'LaInfluencia/1.0' },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return null
  const data = await res.json()
  const page = Object.values(data.query?.pages ?? {})[0]
  return page?.imageinfo?.[0]?.thumburl ?? page?.imageinfo?.[0]?.url ?? null
}

// ── 2. GOOGLE CUSTOM SEARCH ───────────────────────────────────────────────────
async function getGoogleImage(name, type = 'person') {
  if (!GOOGLE_KEY || !GOOGLE_CX) return null

  const query = type === 'person'
    ? `${name} político España retrato`
    : `${name} España logo`
  const imgType = type === 'person' ? 'face' : 'clipart'
  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(query)}&searchType=image&imgType=${imgType}&imgSize=medium&safe=active&num=3`

  const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    if (res.status === 429) console.log(`\n  ⚠  Google CSE: límite diario alcanzado`)
    else console.log(`\n  ⚠  Google CSE error ${res.status}: ${err?.error?.message ?? ''}`)
    return null
  }

  const data = await res.json()
  const items = data.items ?? []

  // Filtrar por extensión de imagen válida
  const validExtensions = /\.(jpg|jpeg|png|webp)(\?|$)/i
  for (const item of items) {
    const imgUrl = item.link
    if (validExtensions.test(imgUrl)) {
      return { url: imgUrl, source: 'google', pageUrl: item.image?.contextLink }
    }
  }
  return null
}

// ── DESCARGA ──────────────────────────────────────────────────────────────────
async function downloadImage(url, destPath) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; LaInfluencia/1.0)',
      'Accept': 'image/*',
    },
    signal: AbortSignal.timeout(15000),
    redirect: 'follow',
  })
  if (!res.ok) return false
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.startsWith('image/')) return false
  await pipeline(res.body, createWriteStream(destPath))
  return true
}

// ── PLACEHOLDER JPG ───────────────────────────────────────────────────────────
const PALETTES = [
  { bg: [156, 31, 16],  fg: [242, 237, 228] },
  { bg: [20, 52, 96],   fg: [242, 237, 228] },
  { bg: [19, 74, 40],   fg: [242, 237, 228] },
  { bg: [107, 80, 6],   fg: [242, 237, 228] },
  { bg: [54, 48, 37],   fg: [242, 237, 228] },
]

async function makePlaceholderJpg(name, id, destPath) {
  const initials = name
    .split(' ')
    .filter(w => w.length > 2)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')

  const { bg, fg } = PALETTES[id.charCodeAt(0) % PALETTES.length]

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="rgb(${bg.join(',')})"/>
  <text x="100" y="130" font-family="serif" font-size="90" font-weight="900"
    text-anchor="middle" fill="rgb(${fg.join(',')})" opacity="0.9">${initials}</text>
</svg>`

  await sharp(Buffer.from(svg))
    .resize(200, 200)
    .jpeg({ quality: 85 })
    .toFile(destPath)
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
let downloaded = 0, placeholders = 0, skipped = 0

for (const person of persons) {
  const jpgPath = join(outDir, `${person.id}.jpg`)

  if (!FORCE && existsSync(jpgPath)) {
    console.log(`  ⏭  ${person.id} (ya existe)`)
    skipped++
    continue
  }

  process.stdout.write(`  🔍 ${person.name}\n`)

  let result = null

  // 1. Wikidata
  process.stdout.write(`     ├─ Wikidata … `)
  try {
    result = await getWikidataImage(person.name)
    if (result) console.log(`✓`)
    else console.log(`✗`)
  } catch {
    console.log(`✗ (timeout)`)
  }

  // 2. Google CSE (solo si Wikidata falla)
  if (!result && GOOGLE_KEY && GOOGLE_CX) {
    process.stdout.write(`     ├─ Google … `)
    try {
      result = await getGoogleImage(person.name, person.type)
      if (result) console.log(`✓  ${result.url.slice(0, 60)}…`)
      else console.log(`✗`)
    } catch {
      console.log(`✗ (timeout)`)
    }
    await new Promise(r => setTimeout(r, 200))
  }

  // 3. Descargar o generar placeholder JPG
  if (result) {
    process.stdout.write(`     └─ Descargando … `)
    try {
      const ok = await downloadImage(result.url, jpgPath)
      if (ok) {
        cache[person.id] = { source: result.source, url: result.url, pageUrl: result.pageUrl ?? null }
        console.log(`✓ guardada`)
        downloaded++
      } else {
        throw new Error('invalid response')
      }
    } catch (e) {
      console.log(`✗ error: ${e.message} — usando placeholder`)
      await makePlaceholderJpg(person.name, person.id, jpgPath)
      cache[person.id] = { source: 'placeholder' }
      placeholders++
    }
  } else {
    process.stdout.write(`     └─ Placeholder\n`)
    await makePlaceholderJpg(person.name, person.id, jpgPath)
    cache[person.id] = { source: 'placeholder' }
    placeholders++
  }

  await new Promise(r => setTimeout(r, 400))
}

writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8')

console.log(`
✅ Listo
   ${downloaded} fotos descargadas (${[...new Set(Object.values(cache).filter(v=>v).map(v => v.source))].join(', ')})
   ${placeholders} placeholders JPG generados
   ${skipped} ya existían en disco
   Guardadas en: public/personas/

💡 Para forzar re-descarga: node scripts/fetch-photos.mjs --force
`)
