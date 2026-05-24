import { useState } from 'react'
import type { Event } from '../types'
import { formatDate, getImpactLabel, getImpactColor, getCaseColor } from '../utils'

interface Props {
  events: Event[]
  tipos: string[]
}

const TYPE_LABELS: Record<string, string> = {
  contract: 'Contrato', judicial: 'Judicial', political: 'Político',
  police_operation: 'Operación policial', investigation: 'Investigación',
  scandal: 'Escándalo', trial: 'Juicio oral', corruption: 'Corrupción',
  context: 'Contexto', money_transfer: 'Transferencia',
}

const CASE_LABELS: Record<string, string> = {
  'dp-77-24': 'Zapatero',
  'caso-koldo': 'Koldo',
}

function getAccentColor(cases: string[]): string {
  if (cases.includes('dp-77-24') && cases.includes('caso-koldo')) return 'var(--gold)'
  if (cases.includes('dp-77-24')) return 'var(--red)'
  if (cases.includes('caso-koldo')) return 'var(--blue2)'
  return 'var(--line2)'
}

function getYear(date: string) { return date.slice(0, 4) }

function openSidebar(id: string) {
  window.openDetailSidebar?.('event', id)
}

export default function CronologiaClient({ events, tipos }: Props) {
  const [caso, setCaso] = useState('todos')
  const [tipo, setTipo] = useState('todos')
  const [impactoMin, setImpactoMin] = useState(1)

  const filtered = events.filter(ev => {
    if (caso !== 'todos' && !ev.cases.includes(caso)) return false
    if (tipo !== 'todos' && ev.type !== tipo) return false
    if (ev.impact < impactoMin) return false
    return true
  })

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
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    padding: '0.35rem 0.8rem',
    background: 'var(--card)',
    border: '1px solid var(--line2)',
    borderRadius: '999px',
    color: 'var(--txt2)',
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
    marginBottom: '0.35rem',
    display: 'block',
  }

  return (
    <div>
      {/* ── FILTROS ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '1.5rem',
        padding: '1.2rem 3vw',
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
              fontFamily: 'var(--fm)', fontSize: '0.52rem', letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--txt3)',
              background: 'transparent', border: '1px solid var(--line2)',
              borderRadius: '999px', padding: '0.35rem 0.8rem', cursor: 'pointer',
            }}
          >
            Limpiar ✕
          </button>
        )}
        <span style={{ fontFamily: 'var(--fm)', fontSize: '0.5rem', letterSpacing: '0.08em', color: 'var(--txt3)', marginLeft: 'auto', textTransform: 'uppercase' }}>
          {filtered.length} hecho{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── TIMELINE ── */}
      {byYear.length === 0 ? (
        <div style={{ padding: '5rem 3vw', fontFamily: 'var(--fm)', fontSize: '0.65rem', color: 'var(--txt3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Sin hechos documentados para los filtros seleccionados.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr' }}>

          {/* Año nav — sticky */}
          <div style={{ borderRight: '1px solid var(--line)', background: 'var(--bg2)' }}>
            <div style={{ position: 'sticky', top: '100px' }}>
              {byYear.map(({ year, items }) => (
                <div
                  key={year}
                  style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--line)', cursor: 'pointer', transition: 'background 0.15s' }}
                  onClick={() => document.getElementById(`year-${year}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg3)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
                >
                  <div style={{ fontFamily: 'var(--ft)', fontSize: '1.75rem', fontWeight: 900, color: 'var(--line2)', lineHeight: 1, marginBottom: '0.2rem' }}>
                    {year}
                  </div>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: '0.46rem', color: 'var(--txt3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {items.length} hecho{items.length !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Eventos */}
          <div>
            {byYear.map(({ year, items }) => (
              <div key={year}>
                <div id={`year-${year}`} style={{ height: 0 }} />
                {items.map(ev => {
                  const accent = getAccentColor(ev.cases)
                  const impColor = getImpactColor(ev.impact)

                  return (
                    <article
                      key={ev.id}
                      onClick={() => openSidebar(ev.id)}
                      style={{
                        borderBottom: '1px solid var(--line)',
                        borderLeft: `3px solid ${accent}`,
                        opacity: ev.pending ? 0.7 : 1,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        display: 'grid',
                        gridTemplateColumns: '80px 1fr',
                        gap: '1.25rem',
                        padding: '1.5rem 2rem',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg2)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
                    >
                      {/* Fecha */}
                      <div style={{ paddingTop: '0.15rem', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'var(--fm)', fontSize: '0.8rem', fontWeight: 500, color: accent, lineHeight: 1.2 }}>
                          {formatDate(ev.date, ev.date_precision)}
                        </div>
                        {ev.pending && (
                          <div style={{ fontFamily: 'var(--fm)', fontSize: '0.44rem', color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '0.25rem' }}>
                            pendiente
                          </div>
                        )}
                      </div>

                      {/* Contenido */}
                      <div>
                        {/* Pills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.55rem' }}>
                          <span style={{
                            fontFamily: 'var(--fm)', fontSize: '0.46rem', letterSpacing: '0.08em',
                            textTransform: 'uppercase', padding: '0.15rem 0.55rem',
                            borderRadius: '999px', border: '1px solid var(--line2)', color: 'var(--txt3)',
                          }}>
                            {TYPE_LABELS[ev.type] ?? ev.type}
                          </span>
                          {ev.cases.map(c => (
                            <span key={c} style={{
                              fontFamily: 'var(--fm)', fontSize: '0.46rem', letterSpacing: '0.08em',
                              textTransform: 'uppercase', padding: '0.15rem 0.55rem',
                              borderRadius: '999px', border: `1px solid ${getCaseColor(c)}`, color: getCaseColor(c),
                            }}>
                              {CASE_LABELS[c] ?? c}
                            </span>
                          ))}
                        </div>

                        {/* Título */}
                        <h3 style={{
                          fontFamily: 'var(--ft)', fontSize: '1rem', fontWeight: 700,
                          color: 'var(--txt)', lineHeight: 1.25, letterSpacing: '-0.01em',
                          marginBottom: '0.6rem',
                        }}>
                          {ev.title}
                        </h3>

                        {/* Impacto */}
                        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                          {[1,2,3,4,5].map(n => (
                            <span key={n} style={{
                              width: '14px', height: '3px',
                              borderRadius: '2px',
                              background: n <= ev.impact ? impColor : 'var(--line2)',
                              display: 'block',
                            }} />
                          ))}
                          <span style={{ fontFamily: 'var(--fm)', fontSize: '0.48rem', color: impColor, marginLeft: '5px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            {getImpactLabel(ev.impact)}
                          </span>
                        </div>
                      </div>

                      {/* Indicador de apertura */}
                      <div style={{ gridColumn: '2', textAlign: 'right', fontFamily: 'var(--fm)', fontSize: '0.5rem', color: 'var(--txt3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.3rem' }}>
                        ver ficha →
                      </div>
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
