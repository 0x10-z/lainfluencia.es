import type { Entity, Event, Relation, Source } from './types'

export function getEntityPhoto(entity: Entity): string | null {
  if (entity.photo) return entity.photo
  // Busca jpg o svg en public/personas/
  // En build time Astro sirve /personas/{id}.jpg o .svg
  return `/personas/${entity.id}.jpg`
}

const MONTHS_ES = [
  'ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.',
  'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.',
]

export function formatDate(date: string, precision: string): string {
  if (precision === 'year') return date.slice(0, 4)
  const [year, month, day] = date.split('-').map(Number)
  if (precision === 'month') return `${MONTHS_ES[month - 1]} ${year}`
  return `${day} ${MONTHS_ES[month - 1]} ${year}`
}


export function getEntityById(id: string, entities: Entity[]): Entity | undefined {
  return entities.find(e => e.id === id)
}

export function getSourceById(id: string, sources: Source[]): Source | undefined {
  return sources.find(s => s.id === id)
}

export function getSourceBadgeType(source: Source): string {
  if (source.type === 'judicial_order') return 'jud'
  if (source.type === 'police_report') {
    const sub = source.subtype?.toUpperCase() ?? ''
    if (sub === 'UDEF') return 'udef'
    if (sub === 'UCO') return 'uco'
    return 'pol'
  }
  if (source.type === 'press' || source.type === 'fact_check') return 'press'
  if (source.type === 'official') return 'official'
  return 'ref'
}

export function getEventsByEntity(entityId: string, events: Event[]): Event[] {
  return events.filter(ev => ev.entities.includes(entityId))
}

export function getRelationsByEntity(entityId: string, relations: Relation[]): Relation[] {
  return relations.filter(r => r.from === entityId || r.to === entityId)
}

export function getImpactLabel(impact: number): string {
  const labels: Record<number, string> = {
    5: '⚡ Crítico',
    4: 'Alto',
    3: 'Medio',
    2: 'Bajo',
    1: 'Marginal',
  }
  return labels[impact] ?? 'Desconocido'
}

export function getImpactColor(impact: number): string {
  if (impact === 5) return 'var(--red)'
  if (impact === 4) return '#c0621a'
  if (impact === 3) return 'var(--gold)'
  if (impact === 2) return 'var(--green)'
  return 'var(--txt3)'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    investigated: 'Investigado',
    accused: 'Acusado',
    convicted: 'Condenado',
    acquitted: 'Absuelto',
    witness: 'Testigo',
    judge: 'Juez',
    prosecutor: 'Fiscal',
    lawyer: 'Abogado',
    unknown: 'Desconocido',
  }
  return labels[status] ?? status
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    investigated: '#e67e22',
    accused: 'var(--red)',
    convicted: '#8b0000',
    acquitted: 'var(--green)',
    witness: 'var(--txt3)',
    judge: 'var(--gold)',
    prosecutor: 'var(--blue2)',
    lawyer: 'var(--txt2)',
    unknown: 'var(--txt3)',
  }
  return colors[status] ?? 'var(--txt3)'
}

export function getEventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    contract: 'Contrato',
    judicial: 'Judicial',
    political: 'Político',
    police_operation: 'Operación policial',
    investigation: 'Investigación',
    scandal: 'Escándalo',
    trial: 'Juicio',
    corruption: 'Corrupción',
    context: 'Contexto',
    money_transfer: 'Transferencia',
  }
  return labels[type] ?? type
}

export function getSourceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    judicial_order: 'Auto judicial',
    police_report: 'Informe policial',
    press: 'Prensa',
    fact_check: 'Verificación',
    reference: 'Referencia',
    official: 'Oficial',
  }
  return labels[type] ?? type
}
