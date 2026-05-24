import { useState } from 'react'
import type { Event, Entity, Source } from '../types'
import { formatDate, getImpactLabel, getImpactColor, getSourceById, getEntityById } from '../utils'

interface Props {
  events: Event[]
  entities: Entity[]
  sources: Source[]
  tipos: string[]
}

const TYPE_LABELS: Record<string, string> = {
  contract: 'Contrato', judicial: 'Judicial', political: 'Político',
  police_operation: 'Operación policial', investigation: 'Investigación',
  scandal: 'Escándalo', trial: 'Juicio oral', corruption: 'Corrupción',
  context: 'Contexto', money_transfer: 'Transferencia',
}

const CASE_COLORS: Record<string, string> = {
  'dp-77-24': 'var(--red)',
  'caso-koldo': 'var(--blue2)',
}
const CASE_LABELS: Record<string, string> = {
  'dp-77-24': 'Zapatero',
  'caso-koldo': 'Koldo',
}

const STATUS_COLORS: Record<string, string> = {
  true: 'var(--green)',
  partial: '#b8960c',
  false: 'var(--txt3)',
}

function getAccentColor(cases: string[]): string {
  if (cases.includes('dp-77-24') && cases.includes('caso-koldo')) return 'var(--gold)'
  if (cases.includes('dp-77-24')) return 'var(--red)'
  if (cases.includes('caso-koldo')) return 'var(--blue2)'
  return 'var(--line2)'
}

function getYear(date: string) { return date.slice(0, 4) }

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

  // Agrupar por año
  const byYear: { year: string; items: Event[] }[] = []
  for (const ev of filtered) {
    const y = getYear(ev.date)
    const last = byYear[byYear.length - 1]
    if (!last || last.year !== y) byYear.push({ year: y, items: [ev] })
    else last.items.push(ev)
  }

  const selStyle = {
    fontFamily: 'var(--fm)',
    fontSize: '0.58rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    padding: '0.3rem 0.7rem',
    background: 'transparent',
    border: '1px solid var(--line2)',
    color: 'var(--txt3)',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
  }

  const lblStyle = {
    fontFamily: 'var(--fm)',
    fontSize: '0.48rem',
    color: 'var(--txt3)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.15em',
    marginBottom: '0.4rem',
    display: 'block',
  }

  return (
    <div>
      {/* ── BARRA DE FILTROS ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '2rem',
        padding: '1.5rem 3vw',
        borderBottom: '1px solid var(--line)',
        alignItems: 'flex-end',
        background: 'var(--bg2)',
        position: 'sticky', top: '52px', zIndex: 100,
      }}>
        <div>
          <label style={lblStyle}>Caso</label>
          <select value={caso} onChange={e => setCaso(e.target.value)} style={selStyle}>
            <option value="todos">Todos los casos</option>
            <option value="dp-77-24">D.P. 77/24 — Zapatero</option>
            <option value="caso-koldo">Esp. 003 — Koldo</option>
          </select>
        </div>
        <div>
          <label style={lblStyle}>Tipo de hecho</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} style={selStyle}>
            <option value="todos">Todos</option>
            {tipos.map(t => <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>)}
          </select>
        </div>
        <div>
          <label style={lblStyle}>Impacto mínimo — {impactoMin}/5</label>
          <input
            type="range" min={1} max={5} value={impactoMin}
            onChange={e => setImpactoMin(Number(e.target.value))}
            style={{ width: '90px', accentColor: 'var(--red)', display: 'block', marginTop: '8px' }}
          />
        </div>
        {(caso !== 'todos' || tipo !== 'todos' || impactoMin > 1) && (
          <button
            onClick={() => { setCaso('todos'); setTipo('todos'); setImpactoMin(1) }}
            style={{
              fontFamily: 'var(--fm)', fontSize: '0.52rem', letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--txt3)',
              background: 'transparent', border: '1px solid var(--line2)',
              padding: '0.3rem 0.6rem', cursor: 'pointer',
            }}
          >
            Limpiar filtros ✕
          </button>
        )}
        <span style={{ fontFamily: 'var(--fm)', fontSize: '0.5rem', letterSpacing: '0.1em', color: 'var(--txt3)', marginLeft: 'auto', textTransform: 'uppercase' }}>
          {filtered.length} hecho{filtered.length !== 1 ? 's' : ''} documentado{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── TIMELINE ── */}
      {byYear.length === 0 ? (
        <div style={{
          padding: '5rem 3vw',
          fontFamily: 'var(--fm)', fontSize: '0.65rem',
          color: 'var(--txt3)', letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          Sin hechos documentados para los filtros seleccionados.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr' }}>

          {/* Columna año — sticky nav */}
          <div style={{ borderRight: '1px solid var(--line)', background: 'var(--bg2)' }}>
            <div style={{ position: 'sticky', top: '52px' }}>
              {byYear.map(({ year, items }) => (
                <div
                  key={year}
                  style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}
                  onClick={() => document.getElementById(`year-${year}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg3)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
                >
                  <div style={{
                    fontFamily: 'var(--ft)', fontSize: '2rem', fontWeight: 900,
                    color: 'var(--line2)', lineHeight: 1, marginBottom: '0.25rem',
                    transition: 'color 0.15s',
                  }}>
                    {year}
                  </div>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: '0.48rem', color: 'var(--txt3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {items.length} hecho{items.length !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Columna eventos */}
          <div>
            {byYear.map(({ year, items }) => (
              <div key={year}>
                {/* Anchor para scroll */}
                <div id={`year-${year}`} style={{ height: 0 }} />

                {items.map((ev, idx) => {
                  const isOpen = openId === ev.id
                  const accent = getAccentColor(ev.cases)
                  const impColor = getImpactColor(ev.impact)
                  const verStr = String(ev.verified)
                  const verColor = STATUS_COLORS[verStr] ?? 'var(--txt3)'
                  const verIcon = ev.verified === true ? '✓ verificado' : ev.verified === 'partial' ? '~ parcial' : '? pendiente'
                  const evSources = ev.sources.map(id => getSourceById(id, sources)).filter(Boolean) as Source[]
                  const evEntities = ev.entities.map(id => getEntityById(id, entities)).filter(Boolean) as Entity[]
                  const fd = formatDate(ev.date, ev.date_precision)

                  return (
                    <article
                      key={ev.id}
                      style={{
                        borderBottom: '1px solid var(--line)',
                        borderLeft: `3px solid ${accent}`,
                        opacity: ev.pending ? 0.7 : 1,
                        transition: 'background 0.15s',
                      }}
                    >
                      {/* CABECERA — siempre visible */}
                      <div
                        style={{ padding: '1.8rem 2.5rem', cursor: 'pointer', display: 'grid', gridTemplateColumns: '90px 1fr', gap: '1.5rem' }}
                        onClick={() => setOpenId(isOpen ? null : ev.id)}
                      >
                        {/* Fecha */}
                        <div style={{ paddingTop: '0.2rem' }}>
                          <div style={{ fontFamily: 'var(--fm)', fontSize: '0.95rem', fontWeight: 500, color: accent, lineHeight: 1 }}>
                            {fd}
                          </div>
                          {ev.pending && (
                            <div style={{ fontFamily: 'var(--fm)', fontSize: '0.46rem', color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '0.3rem' }}>
                              pendiente
                            </div>
                          )}
                        </div>

                        {/* Contenido */}
                        <div>
                          {/* Tags */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.7rem', alignItems: 'center' }}>
                            <span style={{
                              fontFamily: 'var(--fm)', fontSize: '0.46rem', letterSpacing: '0.1em',
                              textTransform: 'uppercase', padding: '0.12rem 0.4rem',
                              border: '1px solid var(--line2)', color: 'var(--txt3)',
                            }}>
                              {TYPE_LABELS[ev.type] ?? ev.type}
                            </span>
                            {ev.cases.map(c => (
                              <span key={c} style={{
                                fontFamily: 'var(--fm)', fontSize: '0.46rem', letterSpacing: '0.1em',
                                textTransform: 'uppercase', padding: '0.12rem 0.4rem',
                                border: `1px solid ${CASE_COLORS[c] ?? 'var(--line2)'}`,
                                color: CASE_COLORS[c] ?? 'var(--txt3)',
                              }}>
                                {CASE_LABELS[c] ?? c}
                              </span>
                            ))}
                            <span style={{ fontFamily: 'var(--fm)', fontSize: '0.44rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: verColor, marginLeft: 'auto' }}>
                              {verIcon}
                            </span>
                          </div>

                          {/* Título */}
                          <h3 style={{
                            fontFamily: 'var(--ft)', fontSize: '1.15rem', fontWeight: 700,
                            color: 'var(--txt)', lineHeight: 1.2, letterSpacing: '-0.01em',
                            marginBottom: '0.8rem',
                          }}>
                            {ev.title}
                          </h3>

                          {/* Impacto */}
                          <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                            {[1,2,3,4,5].map(n => (
                              <span key={n} style={{ width: '14px', height: '3px', background: n <= ev.impact ? impColor : 'var(--line2)', display: 'block' }} />
                            ))}
                            <span style={{ fontFamily: 'var(--fm)', fontSize: '0.5rem', color: impColor, marginLeft: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                              {getImpactLabel(ev.impact)}
                            </span>
                          </div>
                        </div>

                        {/* Toggle arrow */}
                        <div style={{
                          gridColumn: '2',
                          textAlign: 'right',
                          fontFamily: 'var(--fm)', fontSize: '0.6rem', color: 'var(--txt3)',
                          marginTop: '0.4rem',
                          transform: isOpen ? 'none' : 'none',
                        }}>
                          <span style={{ display: 'inline-block', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
                        </div>
                      </div>

                      {/* DETALLE EXPANDIDO */}
                      {isOpen && (
                        <div style={{
                          padding: '0 2.5rem 2rem calc(90px + 1.5rem + 2.5rem)',
                          borderTop: '1px solid var(--line)',
                          background: 'var(--bg2)',
                        }}>
                          <p style={{
                            fontFamily: 'var(--fb)', fontSize: '0.88rem',
                            color: 'var(--txt2)', lineHeight: 1.75,
                            margin: '1.5rem 0 1.2rem',
                            maxWidth: '680px',
                          }}>
                            {ev.description}
                          </p>

                          {ev.notes && (
                            <blockquote style={{
                              fontFamily: 'var(--ft)', fontStyle: 'italic',
                              fontSize: '0.85rem', color: 'var(--txt2)',
                              borderLeft: '1px solid var(--line2)',
                              paddingLeft: '1rem', margin: '0 0 1.2rem',
                              lineHeight: 1.65,
                            }}>
                              {ev.notes}
                            </blockquote>
                          )}

                          {evEntities.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                              <div style={{ fontFamily: 'var(--fm)', fontSize: '0.46rem', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
                                Actores implicados
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {evEntities.map(ent => (
                                  <a key={ent.id} href={`/personajes/${ent.id}`} style={{
                                    fontFamily: 'var(--fm)', fontSize: '0.55rem',
                                    color: 'var(--txt3)', border: '1px solid var(--line2)',
                                    padding: '0.2rem 0.55rem', textDecoration: 'none',
                                    letterSpacing: '0.04em', transition: 'color 0.15s',
                                  }}
                                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--txt2)')}
                                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--txt3)')}
                                  >
                                    {ent.name}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {evSources.length > 0 && (
                            <div style={{ marginBottom: '1.2rem' }}>
                              <div style={{ fontFamily: 'var(--fm)', fontSize: '0.46rem', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
                                Fuentes documentales
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {evSources.map(src => {
                                  const isJud = src.type === 'judicial_order'
                                  const isUDEF = src.subtype === 'UDEF'
                                  const isUCO = src.subtype === 'UCO'
                                  const isOfficial = src.type === 'official'
                                  const badgeColor = isJud ? 'var(--gold)'
                                    : isUDEF ? 'var(--red)'
                                    : isUCO ? 'var(--blue2)'
                                    : isOfficial ? 'var(--green)'
                                    : 'var(--line2)'
                                  const badgeTxt = isJud ? 'Auto'
                                    : isUDEF ? 'UDEF'
                                    : isUCO ? 'UCO'
                                    : isOfficial ? 'Oficial' : 'Prensa'
                                  const inner = (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <span style={{
                                        fontFamily: 'var(--fm)', fontSize: '0.44rem',
                                        border: `1px solid ${badgeColor}`,
                                        color: badgeColor, padding: '0.1rem 0.35rem',
                                        textTransform: 'uppercase', letterSpacing: '0.08em',
                                      }}>
                                        {badgeTxt}
                                      </span>
                                      <span style={{ fontFamily: 'var(--fm)', fontSize: '0.58rem', color: 'var(--txt3)' }}>
                                        {src.title}
                                      </span>
                                    </span>
                                  )
                                  return src.url
                                    ? <a key={src.id} href={src.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', borderBottom: '1px solid var(--line2)', paddingBottom: '1px', display: 'inline-flex' }}>{inner}<span style={{ fontFamily: 'var(--fm)', fontSize: '0.55rem', color: 'var(--txt3)', marginLeft: '2px', opacity: 0.6 }}>↗</span></a>
                                    : <span key={src.id}>{inner}</span>
                                })}
                              </div>
                            </div>
                          )}

                          <a href={`/eventos/${ev.id}`} style={{
                            fontFamily: 'var(--fm)', fontSize: '0.52rem',
                            color: 'var(--txt3)', letterSpacing: '0.08em',
                            textTransform: 'uppercase', textDecoration: 'none',
                            borderBottom: '1px solid var(--line2)',
                          }}>
                            Ficha completa del evento →
                          </a>
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
