/**
 * Busca la página de Wikipedia en español de cada personaje y guarda
 * la URL directamente en src/data/entities.json.
 *
 * Uso: node scripts/fetch-wikipedia.mjs
 * Flags:
 *   --force   Re-busca incluso los que ya tienen wikipedia en el JSON
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const root  = join(__dir, '..')
const dataPath = join(root, 'src', 'data', 'entities.json')

const FORCE = process.argv.includes('--force')

const raw = JSON.parse(readFileSync(dataPath, 'utf8'))
const persons = raw.entities.filter(e => e.type === 'person')

console.log(`\n🔍 ${persons.length} personas a procesar\n`)

async function searchWikipedia(name) {
  // Busca en Wikipedia ES usando la API de búsqueda
  const searchUrl = `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&srlimit=3&format=json&origin=*`
  const res = await fetch(searchUrl, {
    headers: { 'User-Agent': 'LaInfluencia/1.0 (investigacion-periodistica)' },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return null
  const data = await res.json()
  const results = data?.query?.search ?? []
  if (!results.length) return null

  // Verificar que el primer resultado tenga sentido (que el título o snippet contenga el nombre o sea muy similar)
  const nameParts = name.toLowerCase().split(' ').filter(p => p.length > 2)
  for (const result of results) {
    const title = result.title.toLowerCase()
    const snippet = result.snippet.toLowerCase()
    // El título contiene al menos una parte significativa del nombre
    const matches = nameParts.filter(p => title.includes(p) || snippet.includes(p))
    if (matches.length >= 2) {
      const pageTitle = encodeURIComponent(result.title.replace(/ /g, '_'))
      return `https://es.wikipedia.org/wiki/${pageTitle}`
    }
  }

  // Si no hay match fuerte, intentar con búsqueda directa por título exacto
  const exactUrl = `https://es.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(name)}&prop=info&inprop=url&format=json&origin=*`
  const exactRes = await fetch(exactUrl, {
    headers: { 'User-Agent': 'LaInfluencia/1.0 (investigacion-periodistica)' },
    signal: AbortSignal.timeout(8000),
  })
  if (!exactRes.ok) return null
  const exactData = await exactRes.json()
  const pages = Object.values(exactData?.query?.pages ?? {})
  const page = pages[0]
  if (page && page.pageid && page.pageid !== -1) {
    const pageTitle = encodeURIComponent(page.title.replace(/ /g, '_'))
    return `https://es.wikipedia.org/wiki/${pageTitle}`
  }

  return null
}

let found = 0, notFound = 0, skipped = 0

for (const entity of raw.entities) {
  if (entity.type !== 'person') continue

  if (!FORCE && entity.wikipedia) {
    console.log(`  ⏭  ${entity.name} (ya tiene wikipedia)`)
    skipped++
    continue
  }

  process.stdout.write(`  🔍 ${entity.name} … `)

  try {
    const url = await searchWikipedia(entity.name)
    if (url) {
      entity.wikipedia = url
      console.log(`✓  ${url}`)
      found++
    } else {
      console.log(`✗  no encontrado`)
      notFound++
    }
  } catch (e) {
    console.log(`✗  error: ${e.message}`)
    notFound++
  }

  await new Promise(r => setTimeout(r, 300))
}

writeFileSync(dataPath, JSON.stringify(raw, null, 2) + '\n', 'utf8')

console.log(`
✅ Listo
   ${found} URLs de Wikipedia encontradas y guardadas
   ${notFound} personajes sin Wikipedia
   ${skipped} ya tenían URL (usa --force para re-buscar)
   Guardado en: src/data/entities.json
`)
