#!/usr/bin/env node
/**
 * validate.js — Validador de integridad referencial del modelo de datos
 * La Influencia — Investigación periodística
 *
 * Comprueba que:
 * 1. Todas las entidades referenciadas en events/relations existen en entities.json
 * 2. Todas las fuentes referenciadas en events/relations existen en sources.json
 * 3. Todas las relaciones referenciadas en events existen en relations.json
 * 4. Los IDs son únicos dentro de cada archivo
 * 5. Los casos referenciados existen en cases.json
 *
 * Uso: node validate.js
 */

const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '../src/data');

function load(file) {
  const raw = fs.readFileSync(path.join(DATA, file), 'utf8');
  return JSON.parse(raw);
}

let errors = 0;
let warnings = 0;

function err(msg)  { console.error(`  ❌ ERROR: ${msg}`);   errors++; }
function warn(msg) { console.warn(`  ⚠️  WARN: ${msg}`);   warnings++; }
function ok(msg)   { console.log(`  ✅ ${msg}`); }

console.log('\n🔍 La Influencia — Validador de modelo de datos\n');

// ── Cargar todos los archivos ──
const cases    = load('cases.json').cases;
const entities = load('entities.json').entities;
const relations= load('relations.json').relations;
const events   = load('events.json').events;
const sources  = load('sources.json').sources;

const caseIds    = new Set(cases.map(c => c.id));
const entityIds  = new Set(entities.map(e => e.id));
const relationIds= new Set(relations.map(r => r.id));
const eventIds   = new Set(events.map(e => e.id));
const sourceIds  = new Set(sources.map(s => s.id));

// ── 1. IDs únicos ──
console.log('📋 Comprobando unicidad de IDs...');
[
  ['cases', cases],
  ['entities', entities],
  ['relations', relations],
  ['events', events],
  ['sources', sources],
].forEach(([name, arr]) => {
  const ids = arr.map(x => x.id);
  const dups = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dups.length > 0) {
    err(`IDs duplicados en ${name}.json: ${dups.join(', ')}`);
  } else {
    ok(`${name}.json — IDs únicos (${ids.length})`);
  }
});

// ── 2. Referencias en events ──
console.log('\n📋 Comprobando referencias en events.json...');
events.forEach(ev => {
  // Casos
  (ev.cases || []).forEach(c => {
    if (!caseIds.has(c)) err(`events[${ev.id}] → caso desconocido: '${c}'`);
  });
  // Entidades
  (ev.entities || []).forEach(e => {
    if (!entityIds.has(e)) err(`events[${ev.id}] → entidad desconocida: '${e}'`);
  });
  // Relaciones
  (ev.relations || []).forEach(r => {
    if (!relationIds.has(r)) err(`events[${ev.id}] → relación desconocida: '${r}'`);
  });
  // Fuentes
  (ev.sources || []).forEach(s => {
    if (!sourceIds.has(s)) err(`events[${ev.id}] → fuente desconocida: '${s}'`);
  });
  // Impacto
  if (ev.impact && (ev.impact < 1 || ev.impact > 5)) {
    err(`events[${ev.id}] → impacto fuera de rango [1-5]: ${ev.impact}`);
  }
  // Advertencia: eventos sin fuentes
  if (!ev.sources || ev.sources.length === 0) {
    warn(`events[${ev.id}] — sin fuentes asignadas`);
  }
});
ok(`events.json — ${events.length} eventos comprobados`);

// ── 3. Referencias en relations ──
console.log('\n📋 Comprobando referencias en relations.json...');
relations.forEach(rel => {
  if (!entityIds.has(rel.from)) err(`relations[${rel.id}] → from desconocido: '${rel.from}'`);
  if (!entityIds.has(rel.to))   err(`relations[${rel.id}] → to desconocido: '${rel.to}'`);
  (rel.cases || []).forEach(c => {
    if (!caseIds.has(c)) err(`relations[${rel.id}] → caso desconocido: '${c}'`);
  });
  (rel.sources || []).forEach(s => {
    if (!sourceIds.has(s)) err(`relations[${rel.id}] → fuente desconocida: '${s}'`);
  });
});
ok(`relations.json — ${relations.length} relaciones comprobadas`);

// ── 4. Referencias en entities ──
console.log('\n📋 Comprobando referencias en entities.json...');
entities.forEach(ent => {
  (ent.cases || []).forEach(c => {
    if (!caseIds.has(c)) err(`entities[${ent.id}] → caso desconocido: '${c}'`);
  });
});
ok(`entities.json — ${entities.length} entidades comprobadas`);

// ── 5. Fuentes sin usar ──
console.log('\n📋 Comprobando fuentes sin usar...');
const usedSources = new Set([
  ...events.flatMap(e => e.sources || []),
  ...relations.flatMap(r => r.sources || []),
]);
sources.forEach(s => {
  if (!usedSources.has(s.id)) warn(`sources[${s.id}] — fuente definida pero no referenciada`);
});

// ── 6. Entidades sin eventos ──
console.log('\n📋 Comprobando entidades sin eventos...');
const usedEntities = new Set(events.flatMap(e => e.entities || []));
entities.forEach(ent => {
  if (!usedEntities.has(ent.id)) warn(`entities[${ent.id}] — entidad sin ningún evento asociado`);
});

// ── Resumen ──
console.log('\n' + '─'.repeat(50));
console.log(`📊 RESUMEN:`);
console.log(`   Casos:      ${cases.length}`);
console.log(`   Entidades:  ${entities.length}`);
console.log(`   Relaciones: ${relations.length}`);
console.log(`   Eventos:    ${events.length}`);
console.log(`   Fuentes:    ${sources.length}`);
console.log('─'.repeat(50));

if (errors === 0 && warnings === 0) {
  console.log('\n✨ Modelo de datos válido. Sin errores ni advertencias.\n');
} else {
  if (errors > 0)   console.log(`\n❌ ${errors} error(es) encontrado(s). Corrige antes de publicar.`);
  if (warnings > 0) console.log(`⚠️  ${warnings} advertencia(s). Revisa si son intencionadas.`);
  console.log('');
  if (errors > 0) process.exit(1);
}
