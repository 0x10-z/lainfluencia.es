import { useState } from 'react'
import type { Event, Entity, Source } from '../types'
import { formatDate, getEventTypeLabel, getImpactLabel, getImpactColor, getSourceById, getEntityById } from '../utils'

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

function getLineColor(cases: string[]): string {
  if (cases.includes('dp-77-24') && cases.includes('caso-koldo')) return 'var(--gold)'
  if (cases.includes('dp-77-24')) return 'var(--red)'
  if (cases.includes('caso-koldo')) return 'var(--blue)'
  return 'var(--line2)'
}

function getYear(date: string) {
  return date.slice(0, 4)
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
    fontFamily: "'DM Mono', monospace",
    fontSize: '0.75rem',
    padding: '5px 10px',
    background: 'var(--bg2)',
    border: '1px solid var(--line)',
    color: 'var(--txt)',
    cursor: 'pointer',
    outline: 'none',
    borderRadius: '3px',
  } as React.CSSProperties

  const lbl = {
    fontFamily: "'DM Mono', monospace",
    fontSize: '0.6rem',
    color: 'var(--txt3)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    marginBottom: '4px',
    display: 'block',
  }

  // Agrupar por año para mostrar separadores
  const byYear: { year: string; items: Event[] }[] = []
  for (const ev of filtered) {
    const y = getYear(ev.date)
    const last = byYear[byYear.length - 1]
    if (!last || last.year !== y) byYear.push({ year: y, items: [ev] })
    else last.items.push(ev)
  }

  return (
    <>
      {/* Barra de filtros */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '1rem 0 1.25rem', borderBottom: '1px solid var(--line)', marginBottom: '2rem', alignItems: 'flex-end' }}>
        <div>
          <label style={lbl}>Caso</label>
          <select value={caso} onChange={e => setCaso(e.target.value)} style={sel}>
            <option value="todos">Todos los casos</option>
            <option value="dp-77-24">Zapatero</option>
            <option value="caso-koldo">Koldo</option>
          </select>
        </div>
        <div>
          <label style={lbl}>Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} style={sel}>
            <option value="todos">Todos los tipos</option>
            {tipos.map(t => <option key={t} value={t}>{EVENT_TYPE_LABELS[t] ?? t}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Impacto mínimo: {impactoMin}</label>
          <input
            type="range" min={1} max={5} value={impactoMin}
            onChange={e => setImpactoMin(Number(e.target.value))}
            style={{ width: '100px', accentColor: 'var(--red)', display: 'block', marginTop: '6px' }}
          />
        </div>
        {(caso !== 'todos' || tipo !== 'todos' || impactoMin > 1) && (
          <button
            onClick={() => { setCaso('todos'); setTipo('todos'); setImpactoMin(1) }}
            style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.7rem', color: 'var(--txt3)', background: 'transparent', border: '1px solid var(--line)', padding: '5px 10px', cursor: 'pointer', borderRadius: '3px' }}
          >
            Limpiar ✕
          </button>
        )}
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.7rem', color: 'var(--txt3)', marginLeft: 'auto', alignSelf: 'flex-end', paddingBottom: '2px' }}>
          {filtered.length} evento{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Timeline */}
      {byYear.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--txt3)', fontFamily: "'DM Mono',monospace", fontSize: '0.85rem' }}>
          No hay eventos con los filtros seleccionados.
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '56px' }}>
          {/* Línea vertical continua */}
          <div style={{ position: 'absolute', left: '20px', top: '6px', bottom: '6px', width: '2px', background: 'var(--line)' }} />

          {byYear.map(({ year, items }) => (
            <div key={year}>
              {/* Separador de año */}
              <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                <div style={{
                  position: 'absolute', left: '-44px', top: '0',
                  width: '28px', height: '28px',
                  background: 'var(--bg)', border: '2px solid var(--line)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'DM Mono',monospace", fontSize: '0.55rem', color: 'var(--txt3)',
                  fontWeight: 500, letterSpacing: '0.02em',
                  zIndex: 2,
                }} />
                <span style={{
                  fontFamily: "'DM Mono',monospace", fontSize: '0.78rem',
                  fontWeight: 700, color: 'var(--txt2)', letterSpacing: '0.04em',
                  display: 'block', paddingTop: '4px',
                }}>
                  {year}
                </span>
              </div>

              {/* Eventos del año */}
              {items.map(ev => {
                const isOpen = openId === ev.id
                const lineColor = getLineColor(ev.cases)
                const impactColor = getImpactColor(ev.impact)
                const verifiedStr = String(ev.verified)
                const verifiedColor = STATUS_COLOR[verifiedStr] ?? 'var(--txt3)'
                const verifiedIcon = ev.verified === true ? '✓' : ev.verified === 'partial' ? '~' : '?'
                const evSources = ev.sources.map(id => getSourceById(id, sources)).filter(Boolean) as Source[]
                const evEntities = ev.entities.map(id => getEntityById(id, entities)).filter(Boolean) as Entity[]

                return (
                  <div key={ev.id} style={{ position: 'relative', marginBottom: '10px' }}>
                    {/* Punto del timeline */}
                    <div style={{
                      position: 'absolute', left: '-44px', top: '18px',
                      width: '10px', height: '10px',
                      borderRadius: '50%',
                      border: `2px solid ${lineColor}`,
                      background: ev.impact >= 4 ? lineColor : 'var(--card)',
                      zIndex: 2,
                    }} />
                    {/* Conector horizontal */}
                    <div style={{
                      position: 'absolute', left: '-34px', top: '22px',
                      width: '34px', height: '1px',
                      background: 'var(--line2)',
                    }} />

                    {/* Tarjeta del evento */}
                    <article style={{
                      background: 'var(--card)',
                      border: `1px solid var(--line)`,
                      borderLeft: `3px solid ${lineColor}`,
                      borderRadius: '5px',
                      overflow: 'hidden',
                      opacity: ev.pending ? 0.7 : 1,
                    }}>
                      {/* Cabecera — siempre visible */}
                      <div
                        style={{ padding: '0.85rem 1.1rem', cursor: 'pointer' }}
                        onClick={() => setOpenId(isOpen ? null : ev.id)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                            <time
                              dateTime={ev.date}
                              style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.72rem', color: 'var(--txt3)', whiteSpace: 'nowrap' }}
                            >
                              {formatDate(ev.date, ev.date_precision)}
                              {ev.pending && <span style={{ color: 'var(--gold)', marginLeft: '6px', fontSize: '0.62rem' }}>PENDIENTE</span>}
                            </time>
                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {EVENT_TYPE_LABELS[ev.type] ?? ev.type}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.7rem', color: verifiedColor }} title={ev.verified === true ? 'Verificado' : ev.verified === 'partial' ? 'Parcial' : 'Pendiente'}>
                              {verifiedIcon}
                            </span>
                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', color: 'var(--txt3)', transition: 'transform 0.15s', display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'none' }}>
                              ▸
                            </span>
                          </div>
                        </div>

                        <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', fontWeight: 700, color: 'var(--txt)', margin: '0 0 0.5rem', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                          {ev.title}
                        </h3>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {/* Impact */}
                          <div style={{ display: 'flex', gap: '2px', alignItems: 'center', color: impactColor }}>
                            {[1,2,3,4,5].map(i => (
                              <span key={i} style={{ width: '6px', height: '6px', background: i <= ev.impact ? impactColor : 'var(--line2)', display: 'block', borderRadius: '1px' }} />
                            ))}
                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.62rem', color: impactColor, marginLeft: '3px' }}>
                              {getImpactLabel(ev.impact)}
                            </span>
                          </div>
                          {ev.cases.map(c => (
                            <span key={c} style={{
                              fontFamily: "'DM Mono',monospace", fontSize: '0.58rem', fontWeight: 500,
                              letterSpacing: '0.06em', textTransform: 'uppercase', padding: '1px 7px',
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
                        <div style={{ padding: '1rem 1.1rem', borderTop: '1px solid var(--line)', background: 'var(--bg2)' }}>
                          <p style={{ fontSize: '0.88rem', color: 'var(--txt2)', lineHeight: 1.65, margin: '0 0 1rem' }}>
                            {ev.description}
                          </p>

                          {ev.notes && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--txt3)', fontStyle: 'italic', margin: '0 0 1rem', padding: '0.5rem 0.75rem', borderLeft: '2px solid var(--line2)' }}>
                              {ev.notes}
                            </p>
                          )}

                          {evEntities.length > 0 && (
                            <div style={{ marginBottom: '0.85rem' }}>
                              <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.65rem', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.4rem' }}>
                                Actores
                              </p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                {evEntities.map(ent => (
                                  <a key={ent.id} href={`/personajes/${ent.id}`} style={{ fontSize: '0.75rem', color: 'var(--txt2)', border: '1px solid var(--line)', padding: '2px 8px', textDecoration: 'none', borderRadius: '3px', background: 'var(--card)' }}>
                                    {ent.name}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {evSources.length > 0 && (
                            <div style={{ marginBottom: '0.85rem' }}>
                              <p style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.65rem', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.4rem' }}>
                                Fuentes
                              </p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {evSources.map(src => {
                                  const badge = src.type === 'judicial_order' ? 'jud'
                                    : src.subtype === 'UDEF' ? 'udef'
                                    : src.subtype === 'UCO' ? 'uco'
                                    : src.type === 'press' || src.type === 'fact_check' ? 'press'
                                    : src.type === 'official' ? 'official' : 'ref'
                                  const badgeColors: Record<string, [string, string]> = {
                                    jud: ['var(--red-bg)', 'var(--red)'],
                                    udef: ['var(--blue-bg)', 'var(--blue)'],
                                    uco: ['var(--blue-bg)', 'var(--blue)'],
                                    press: ['var(--bg3)', 'var(--txt2)'],
                                    official: ['var(--gold-bg)', 'var(--gold)'],
                                    ref: ['var(--bg3)', 'var(--txt3)'],
                                  }
                                  const [bg, fg] = badgeColors[badge] ?? ['transparent', 'var(--txt3)']
                                  const label = src.subtype ?? (src.type === 'judicial_order' ? 'Auto' : src.type === 'police_report' ? 'Informe' : src.type === 'press' ? 'Prensa' : src.type)
                                  return (
                                    <span key={src.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', padding: '2px 6px', background: bg, color: fg, border: `1px solid ${fg}40`, textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '3px' }}>
                                        {label}
                                      </span>
                                      {src.url
                                        ? <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', color: 'var(--txt2)', borderBottom: '1px solid var(--line2)', textDecoration: 'none' }}>
                                            {src.title} <span style={{ fontSize: '0.62rem', opacity: 0.6 }}>↗</span>
                                          </a>
                                        : <span style={{ fontSize: '0.78rem', color: 'var(--txt3)' }}>{src.title}</span>
                                      }
                                    </span>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          <a href={`/eventos/${ev.id}`} style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.7rem', color: 'var(--txt2)', textDecoration: 'none', letterSpacing: '0.03em', borderBottom: '1px solid var(--line2)' }}>
                            Ver página completa →
                          </a>
                        </div>
                      )}
                    </article>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
