import { useState } from 'react'
import type { Event, Entity, Source } from '../types'
import { formatDate, getCaseClass, getEventTypeLabel, getImpactLabel, getImpactColor, getSourceById, getEntityById } from '../utils'

interface Props {
  events: Event[]
  entities: Entity[]
  sources: Source[]
  tipos: string[]
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  contract: 'Contrato', judicial: 'Judicial', political: 'Político',
  police_operation: 'Op. policial', investigation: 'Investigación',
  scandal: 'Escándalo', trial: 'Juicio', corruption: 'Corrupción',
  context: 'Contexto', money_transfer: 'Transferencia',
}

const CASE_COLORS: Record<string, string> = {
  'dp-77-24': 'var(--red)',
  'caso-koldo': 'var(--blue)',
}

const STATUS_COLOR: Record<string, string> = {
  true: 'var(--green)',
  partial: 'var(--gold)',
  false: 'var(--txt3)',
}

function getBorderColor(cases: string[]): string {
  if (cases.includes('dp-77-24') && cases.includes('caso-koldo')) return 'var(--gold)'
  if (cases.includes('dp-77-24')) return 'var(--red)'
  if (cases.includes('caso-koldo')) return 'var(--blue)'
  return 'var(--line2)'
}

export default function CronologiaClient({ events, entities, sources, tipos }: Props) {
  const [caso, setCaso] = useState('todos')
  const [tipo, setTipo] = useState('todos')
  const [impactoMin, setImpactoMin] = useState(1)
  const [openId, setOpenId] = useState<string | null>(null)

  const filtered = events.filter(ev => {
    if (caso !== 'todos' && !ev.cases.includes(caso)) return false
    if (tipo !== 'todos' && ev.type !== tipo) return false
    if (ev.impact < impactoMin) return false
    return true
  })

  const sel = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '0.75rem',
    padding: '6px 10px',
    background: 'var(--bg2)',
    border: '1px solid var(--line)',
    color: 'var(--txt)',
    cursor: 'pointer',
    outline: 'none',
    borderRadius: '0',
  } as React.CSSProperties

  const lbl = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '0.65rem',
    color: 'var(--txt3)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    marginBottom: '4px',
    display: 'block',
  }

  return (
    <>
      {/* Barra de filtros */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid var(--line)', marginBottom: '1px', alignItems: 'flex-end' }}>
        <div>
          <label style={lbl}>Caso</label>
          <select value={caso} onChange={e => setCaso(e.target.value)} style={sel}>
            <option value="todos">Todos</option>
            <option value="dp-77-24">Zapatero</option>
            <option value="caso-koldo">Koldo</option>
          </select>
        </div>
        <div>
          <label style={lbl}>Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} style={sel}>
            <option value="todos">Todos</option>
            {tipos.map(t => <option key={t} value={t}>{EVENT_TYPE_LABELS[t] ?? t}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Impacto mínimo: {impactoMin}</label>
          <input
            type="range" min={1} max={5} value={impactoMin}
            onChange={e => setImpactoMin(Number(e.target.value))}
            style={{ width: '120px', accentColor: 'var(--red)', display: 'block' }}
          />
        </div>
        {(caso !== 'todos' || tipo !== 'todos' || impactoMin > 1) && (
          <button
            onClick={() => { setCaso('todos'); setTipo('todos'); setImpactoMin(1) }}
            style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.72rem', color: 'var(--txt2)', background: 'var(--bg3)', border: '1px solid var(--line)', padding: '6px 12px', cursor: 'pointer' }}
          >
            Limpiar ✕
          </button>
        )}
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.72rem', color: 'var(--txt3)', marginLeft: 'auto', alignSelf: 'flex-end', paddingBottom: '6px' }}>
          {filtered.length} evento{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Lista de eventos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--line)' }}>
        {filtered.map(ev => {
          const isOpen = openId === ev.id
          const borderColor = getBorderColor(ev.cases)
          const impactColor = getImpactColor(ev.impact)
          const verifiedStr = String(ev.verified)
          const verifiedColor = STATUS_COLOR[verifiedStr] ?? 'var(--txt3)'
          const verifiedIcon = ev.verified === true ? '✓' : ev.verified === 'partial' ? '~' : '?'
          const evSources = ev.sources.map(id => getSourceById(id, sources)).filter(Boolean) as Source[]
          const evEntities = ev.entities.map(id => getEntityById(id, entities)).filter(Boolean) as Entity[]

          return (
            <article
              key={ev.id}
              style={{
                background: 'var(--bg2)',
                borderLeft: `3px solid ${borderColor}`,
                borderBottom: '1px solid var(--line)',
                opacity: ev.pending ? 0.7 : 1,
              }}
            >
              {/* Cabecera — siempre visible */}
              <div
                style={{ padding: '1rem 1.25rem', cursor: 'pointer' }}
                onClick={() => setOpenId(isOpen ? null : ev.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <time
                      dateTime={ev.date}
                      style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.78rem', color: 'var(--txt3)', whiteSpace: 'nowrap' }}
                    >
                      {formatDate(ev.date, ev.date_precision)}
                      {ev.pending && <span style={{ color: 'var(--gold)', marginLeft: '6px', fontSize: '0.65rem' }}>PENDIENTE</span>}
                    </time>
                    <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.65rem', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {EVENT_TYPE_LABELS[ev.type] ?? ev.type}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.7rem', color: verifiedColor }} title={ev.verified === true ? 'Verificado' : ev.verified === 'partial' ? 'Parcial' : 'Pendiente'}>
                      {verifiedIcon}
                    </span>
                    <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.65rem', color: 'var(--txt3)' }}>
                      {isOpen ? '▴' : '▾'}
                    </span>
                  </div>
                </div>

                <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.15rem', fontWeight: 700, color: 'var(--txt)', margin: '0 0 0.6rem', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                  {ev.title}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {/* Impact bar */}
                  <div style={{ display: 'flex', gap: '3px', alignItems: 'center', color: impactColor }}>
                    {[1,2,3,4,5].map(i => (
                      <span key={i} style={{ width: '7px', height: '7px', background: i <= ev.impact ? impactColor : 'var(--line2)', display: 'block' }} />
                    ))}
                    <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.68rem', color: impactColor, marginLeft: '4px' }}>
                      {getImpactLabel(ev.impact)}
                    </span>
                  </div>
                  <span style={{ color: 'var(--line2)' }}>|</span>
                  {ev.cases.map(c => (
                    <span key={c} style={{
                      fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.62rem', fontWeight: 500,
                      letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 8px',
                      borderRadius: '999px', border: `1px solid ${CASE_COLORS[c] ?? 'var(--line2)'}`,
                      color: CASE_COLORS[c] ?? 'var(--txt3)',
                    }}>
                      {c === 'dp-77-24' ? 'Zapatero' : 'Koldo'}
                    </span>
                  ))}
                </div>
              </div>

              {/* Detalle expandido */}
              {isOpen && (
                <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--line)' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--txt2)', lineHeight: 1.65, margin: '0 0 1rem' }}>
                    {ev.description}
                  </p>

                  {ev.notes && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--txt3)', fontStyle: 'italic', margin: '0 0 1rem', padding: '0.5rem 0.75rem', borderLeft: '2px solid var(--line2)' }}>
                      {ev.notes}
                    </p>
                  )}

                  {evEntities.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.68rem', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.5rem' }}>
                        Actores
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {evEntities.map(ent => (
                          <a key={ent.id} href={`/personajes/${ent.id}`} style={{ fontSize: '0.78rem', color: 'var(--txt2)', border: '1px solid var(--line2)', padding: '3px 8px', textDecoration: 'none' }}>
                            {ent.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {evSources.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.68rem', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.5rem' }}>
                        Fuentes
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {evSources.map(src => {
                          const badge = src.type === 'judicial_order' ? 'jud'
                            : src.subtype === 'UDEF' ? 'udef'
                            : src.subtype === 'UCO' ? 'uco'
                            : src.type === 'press' || src.type === 'fact_check' ? 'press'
                            : src.type === 'official' ? 'official' : 'ref'
                          const badgeColors: Record<string, [string, string]> = {
                            jud: ['rgba(192,57,43,0.15)', 'var(--red)'],
                            udef: ['rgba(26,95,158,0.15)', 'var(--blue2)'],
                            uco: ['rgba(91,163,217,0.15)', 'var(--blue2)'],
                            press: ['rgba(154,149,137,0.15)', 'var(--txt2)'],
                            official: ['rgba(184,150,12,0.15)', 'var(--gold)'],
                            ref: ['rgba(74,71,64,0.3)', 'var(--txt3)'],
                          }
                          const [bg, fg] = badgeColors[badge] ?? ['transparent', 'var(--txt3)']
                          const label = src.subtype ?? (src.type === 'judicial_order' ? 'Auto' : src.type === 'police_report' ? 'Informe' : src.type === 'press' ? 'Prensa' : src.type)
                          return (
                            <span key={src.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.62rem', padding: '2px 6px', background: bg, color: fg, border: `1px solid ${fg}40`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {label}
                              </span>
                              {src.url
                                ? <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--txt2)', borderBottom: '1px solid var(--line2)', textDecoration: 'none' }}>
                                    {src.title} <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>↗</span>
                                  </a>
                                : <span style={{ fontSize: '0.8rem', color: 'var(--txt3)' }}>{src.title}</span>
                              }
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <a href={`/eventos/${ev.id}`} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.72rem', color: 'var(--blue2)', textDecoration: 'none', letterSpacing: '0.03em' }}>
                    Ver página completa →
                  </a>
                </div>
              )}
            </article>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--txt3)', fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.85rem' }}>
          No hay eventos con los filtros seleccionados.
        </div>
      )}
    </>
  )
}
