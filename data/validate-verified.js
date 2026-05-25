/**
 * Valida la coherencia del campo `verified` en events.json.
 *
 * Criterio:
 *   true     → debe tener ≥1 fuente primaria (judicial_order | police_report | official)
 *   partial  → puede tener fuentes de prensa; warning si NINGUNA es primaria
 *   false    → aceptable sin fuente primaria; warning si tiene fuente primaria (debería subir)
 *
 * Uso:
 *   node data/validate-verified.js          # solo valida
 *   node data/validate-verified.js --fix    # corrige automáticamente los errores
 */

const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')

const fix = process.argv.includes('--fix')

const root = join(__dirname, '..')
const eventsPath = join(root, 'src/data/events.json')
const eventsFile = JSON.parse(readFileSync(eventsPath, 'utf8'))
const events  = eventsFile.events
const sources = JSON.parse(readFileSync(join(root, 'src/data/sources.json'), 'utf8')).sources

const PRIMARY_TYPES = new Set(['judicial_order', 'police_report', 'official'])

function primaryCount(sourceIds) {
  return sourceIds.filter(id => {
    const src = sources.find(s => s.id === id)
    return src && PRIMARY_TYPES.has(src.type)
  }).length
}

function pressOnly(sourceIds) {
  return sourceIds.length > 0 && sourceIds.every(id => {
    const src = sources.find(s => s.id === id)
    return src && !PRIMARY_TYPES.has(src.type)
  })
}

let errors = 0
let warnings = 0

console.log('\n── Validación de campo verified ──────────────────────────────\n')

for (const ev of events) {
  const primary = primaryCount(ev.sources)
  const onlyPress = pressOnly(ev.sources)
  const label = `${ev.id} · "${ev.title.slice(0, 60)}"`

  if (ev.verified === true) {
    if (primary < 1) {
      if (fix) {
        ev.verified = 'partial'
        console.log(`🔧 FIXED   ${label}`)
        console.log(`   verified: true → partial (sin fuente primaria)`)
      } else {
        console.log(`❌ ERROR   ${label}`)
        console.log(`   verified:true pero ninguna fuente primaria (judicial_order | police_report | official)`)
        console.log(`   Fuentes: ${ev.sources.join(', ') || '(ninguna)'}`)
      }
      console.log()
      errors++
    }
  } else if (ev.verified === 'partial') {
    if (primary === 0 && onlyPress) {
      console.log(`⚠️  WARNING ${label}`)
      console.log(`   verified:partial pero todas las fuentes son prensa (ninguna primaria)`)
      console.log(`   Fuentes: ${ev.sources.join(', ')}`)
      console.log()
      warnings++
    }
  } else if (ev.verified === false) {
    if (primary >= 1) {
      console.log(`⚠️  WARNING ${label}`)
      console.log(`   verified:false pero tiene ${primary} fuente(s) primaria(s) — considera subir a partial`)
      console.log(`   Fuentes: ${ev.sources.join(', ')}`)
      console.log()
      warnings++
    }
  }
}

if (fix && errors > 0) {
  writeFileSync(eventsPath, JSON.stringify(eventsFile, null, 2))
  console.log(`💾 events.json actualizado\n`)
}

const ok = events.length - errors - warnings
console.log(`── Resultado ──────────────────────────────────────────────────`)
console.log(`   Total eventos : ${events.length}`)
console.log(`   ✅ Correctos  : ${ok}`)
console.log(`   ⚠️  Warnings   : ${warnings}`)
if (fix)
  console.log(`   🔧 Corregidos : ${errors}`)
else
  console.log(`   ❌ Errores    : ${errors}`)
console.log()

if (!fix && errors > 0) process.exit(1)
