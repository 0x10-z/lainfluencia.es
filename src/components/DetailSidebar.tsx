import { useState, useEffect, useCallback, useRef } from 'react'
import type { Event, Entity, Relation, Source } from '../types'
import { formatDate, getImpactColor, getImpactLabel, getEventTypeLabel, getStatusColor, getStatusLabel, getSourceById, getEntityById } from '../utils'

interface Props {
  events: Event[]
  entities: Entity[]
  relations: Relation[]
  sources: Source[]
}

type PanelData =
  | { kind: 'event'; item: Event }
  | { kind: 'entity'; item: Entity }
  | null

const TYPE_ICON: Record<string, string> = {
  person: '◉', company: '▣', institution: '⬡', account: '◈',
}
const TYPE_LABEL_ENT: Record<string, string> = {
  person: 'Persona', company: 'Empresa', institution: 'Institución', account: 'Cuenta',
}

// Global state exposed to window so other components can open the sidebar
declare global {
  interface Window {
    openDetailSidebar?: (kind: 'event' | 'entity', id: string) => void
    closeDetailSidebar?: () => void
  }
}

export default function DetailSidebar({ events, entities, relations, sources }: Props) {
  const [history, setHistory] = useState<PanelData[]>([])
  const [visible, setVisible] = useState(false)
  const [animating, setAnimating] = useState(false)

  const panel = history[history.length - 1] ?? null
  const scrollRef = useRef<HTMLDivElement>(null)

  const open = useCallback((kind: 'event' | 'entity', id: string) => {
    const item = kind === 'event'
      ? events.find(e => e.id === id)
      : entities.find(e => e.id === id)
    if (!item) return
    setHistory(prev => [...prev, { kind, item: item as any }])
    setAnimating(true)
    requestAnimationFrame(() => setVisible(true))
  }, [events, entities])

  const goBack = useCallback(() => {
    setHistory(prev => prev.slice(0, -1))
  }, [])

  const close = useCallback(() => {
    setVisible(false)
    setTimeout(() => { setHistory([]); setAnimating(false) }, 320)
  }, [])

  useEffect(() => {
    window.openDetailSidebar = open
    window.closeDetailSidebar = close
    return () => { delete window.openDetailSidebar; delete window.closeDetailSidebar }
  }, [open, close])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [close])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [panel])

  if (!animating) return null

  const mono: React.CSSProperties = { fontFamily: 'var(--fm)' }

  const pill = (color: string, text: string) => (
    <span style={{
      fontFamily: 'var(--fm)', fontSize: '0.48rem', letterSpacing: '0.1em',
      textTransform: 'uppercase', padding: '0.2rem 0.65rem',
      borderRadius: '999px', border: `1px solid ${color}`, color,
      display: 'inline-block',
    }}>{text}</span>
  )

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        style={{
          position: 'fixed', inset: 0, zIndex: 800,
          background: 'rgba(15,14,9,0.35)',
          backdropFilter: 'blur(2px)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
          cursor: 'pointer',
        }}
      />

      {/* Panel */}
      <aside style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(520px, 92vw)',
        zIndex: 900,
        background: 'var(--card)',
        borderLeft: '1px solid var(--line)',
        display: 'flex', flexDirection: 'column',
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
      }}>

        {/* Header del panel */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
          background: 'var(--bg2)',
          gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
            {history.length > 1 && (
              <button
                onClick={goBack}
                style={{
                  background: 'none', border: '1px solid var(--line2)', cursor: 'pointer',
                  color: 'var(--txt3)', fontFamily: 'var(--fm)', fontSize: '0.6rem',
                  padding: '0.25rem 0.6rem', borderRadius: '999px',
                  transition: 'color 0.15s, border-color 0.15s', flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--txt)'; e.currentTarget.style.borderColor = 'var(--txt3)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--txt3)'; e.currentTarget.style.borderColor = 'var(--line2)' }}
              >
                ← volver
              </button>
            )}
            <span style={{ ...mono, fontSize: '0.48rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--txt3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {panel?.kind === 'event' ? 'Evento' : 'Actor'} · Ficha
            </span>
          </div>
          <button
            onClick={close}
            style={{
              background: 'none', border: '1px solid var(--line2)', cursor: 'pointer',
              color: 'var(--txt3)', fontFamily: 'var(--fm)', fontSize: '0.6rem',
              padding: '0.25rem 0.6rem', borderRadius: '999px',
              transition: 'color 0.15s, border-color 0.15s', flexShrink: 0,
            }}
            onMouseEnter={e => { (e.currentTarget).style.color = 'var(--txt)'; (e.currentTarget).style.borderColor = 'var(--line2)' }}
            onMouseLeave={e => { (e.currentTarget).style.color = 'var(--txt3)'; (e.currentTarget).style.borderColor = 'var(--line2)' }}
          >
            esc ✕
          </button>
        </div>

        {/* Contenido scrollable */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {panel?.kind === 'event' && <EventPanel event={panel.item} entities={entities} relations={relations} sources={sources} pill={pill} openPanel={open} />}
          {panel?.kind === 'entity' && <EntityPanel entity={panel.item} events={events} entities={entities} relations={relations} sources={sources} pill={pill} openPanel={open} />}
        </div>

        {/* Footer — enlace a página completa */}
        {panel && (
          <div style={{
            padding: '0.9rem 1.5rem',
            borderTop: '1px solid var(--line)',
            background: 'var(--bg2)',
            flexShrink: 0,
          }}>
            <a
              href={panel.kind === 'event' ? `/eventos/${panel.item.id}` : `/personajes/${panel.item.id}`}
              style={{
                fontFamily: 'var(--fm)', fontSize: '0.52rem',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--txt2)', textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}
            >
              Abrir página completa →
            </a>
          </div>
        )}
      </aside>
    </>
  )
}

/* ─── PANEL DE EVENTO ─────────────────────────────────── */
function EventPanel({ event, entities, relations, sources, pill, openPanel }: {
  event: Event
  entities: Entity[]
  relations: Relation[]
  sources: Source[]
  pill: (color: string, text: string) => React.ReactNode
  openPanel: (kind: 'event' | 'entity', id: string) => void
}) {
  const impColor = getImpactColor(event.impact)
  const verColor = event.verified === true ? 'var(--green)' : event.verified === 'partial' ? 'var(--gold)' : 'var(--txt3)'
  const verLabel = event.verified === true ? '✓ verificado' : event.verified === 'partial' ? '~ parcial' : '? sin verificar'
  const accentColor = 'var(--red)'
  const evEntities = event.entities.map(id => getEntityById(id, entities)).filter(Boolean) as Entity[]
  const evSources = event.sources.map(id => getSourceById(id, sources)).filter(Boolean) as Source[]
  const evRelations = (event.relations ?? []).map(rid => relations.find(r => r.id === rid)).filter(Boolean) as Relation[]

  return (
    <div>
      {/* Fecha + tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontFamily: 'var(--fm)', fontSize: '0.65rem', color: accentColor, letterSpacing: '0.06em' }}>
          {formatDate(event.date, event.date_precision)}
        </span>
        {pill('var(--txt3)', getEventTypeLabel(event.type))}
        {event.pending && pill('var(--gold)', 'pendiente')}
      </div>

      {/* Título */}
      <h2 style={{
        fontFamily: 'var(--ft)', fontSize: '1.3rem', fontWeight: 700,
        color: 'var(--txt)', lineHeight: 1.2, letterSpacing: '-0.01em',
        marginBottom: '0.8rem',
        borderLeft: `3px solid ${accentColor}`, paddingLeft: '0.75rem',
      }}>
        {event.title}
      </h2>

      {/* Impacto */}
      <div style={{ display: 'flex', gap: '3px', alignItems: 'center', marginBottom: '1.2rem' }}>
        {[1,2,3,4,5].map(n => (
          <span key={n} style={{ width: '20px', height: '3px', borderRadius: '2px', background: n <= event.impact ? impColor : 'var(--line2)', display: 'block' }} />
        ))}
        <span
          data-tooltip={`Escala de impacto 1–5:\n1 · Residual — contexto sin consecuencias directas\n2 · Bajo — relevante pero sin mover la instrucción\n3 · Medio — avanza la investigación o genera consecuencias documentadas\n4 · Alto — hito: detención, imputación, contrato clave o registro\n5 · Crítico — punto de inflexión judicial o político del caso`}
          style={{ fontFamily: 'var(--fm)', fontSize: '0.52rem', color: impColor, marginLeft: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}
        >
          {getImpactLabel(event.impact)}
        </span>
        <span
          data-tooltip={
            event.verified === true
              ? '✓ Verificado\nRespaldado por ≥1 documento primario: auto judicial, informe UDEF/UCO, BOE u oficial.'
              : event.verified === 'partial'
              ? '~ Verificación parcial\nSin documento primario, pero corroborado por ≥2 fuentes de prensa independientes.'
              : '? Sin verificar\nSolo 1 fuente o sin contrastar con segunda fuente independiente.'
          }
          style={{ fontFamily: 'var(--fm)', fontSize: '0.52rem', color: verColor, marginLeft: 'auto', letterSpacing: '0.06em' }}
        >
          {verLabel}
        </span>
      </div>

      {/* Descripción */}
      <p style={{ fontFamily: 'var(--fb)', fontSize: '0.88rem', color: 'var(--txt2)', lineHeight: 1.72, marginBottom: '1.2rem' }}>
        {event.description}
      </p>

      {event.notes && (
        <blockquote style={{
          fontFamily: 'var(--ft)', fontStyle: 'italic', fontSize: '0.83rem',
          color: 'var(--txt3)', borderLeft: '2px solid var(--line2)',
          paddingLeft: '0.75rem', marginBottom: '1.2rem', lineHeight: 1.6,
        }}>
          {event.notes}
        </blockquote>
      )}

      {/* Actores */}
      {evEntities.length > 0 && (
        <section style={{ marginBottom: '1.2rem' }}>
          <SectionLabel>Actores · {evEntities.length}</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {evEntities.map(ent => (
              <button
                key={ent.id}
                onClick={() => openPanel('entity', ent.id)}
                style={{
                  fontFamily: 'var(--fm)', fontSize: '0.6rem', letterSpacing: '0.04em',
                  color: 'var(--txt2)', background: 'var(--bg2)',
                  border: '1px solid var(--line2)', borderRadius: '999px',
                  padding: '0.25rem 0.75rem', cursor: 'pointer',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--txt3)'; e.currentTarget.style.color = 'var(--txt)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line2)'; e.currentTarget.style.color = 'var(--txt2)' }}
              >
                {ent.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Relaciones */}
      {evRelations.length > 0 && (
        <section style={{ marginBottom: '1.2rem' }}>
          <SectionLabel>Relaciones documentadas · {evRelations.length}</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {evRelations.map(r => {
              const from = entities.find(e => e.id === r.from)
              const to = entities.find(e => e.id === r.to)
              return (
                <div key={r.id} style={{
                  background: 'var(--bg2)', borderRadius: '8px',
                  padding: '0.7rem 0.85rem', borderLeft: `2px solid var(--red)`,
                  fontSize: '0.78rem',
                }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem' }}>
                    <button onClick={() => openPanel('entity', r.from)} style={linkBtn}>{from?.name ?? r.from}</button>
                    <span style={{ fontFamily: 'var(--fm)', fontSize: '0.52rem', color: 'var(--txt3)', background: 'var(--bg3)', borderRadius: '4px', padding: '0.1rem 0.5rem' }}>{r.label}</span>
                    <button onClick={() => openPanel('entity', r.to)} style={linkBtn}>{to?.name ?? r.to}</button>
                    {r.amount?.value != null && (
                      <span style={{ fontFamily: 'var(--fm)', fontSize: '0.62rem', color: 'var(--gold)', marginLeft: 'auto' }}>
                        {r.amount.approximate ? '~' : ''}{r.amount.value.toLocaleString('es-ES')} {r.amount.currency}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Fuentes */}
      {evSources.length > 0 && (
        <section>
          <SectionLabel>Fuentes · {evSources.length}</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {evSources.map(src => <SourceRow key={src.id} source={src} />)}
          </div>
        </section>
      )}
    </div>
  )
}

/* ─── PANEL DE ENTIDAD ────────────────────────────────── */
function EntityPanel({ entity, events, entities, relations, sources, pill, openPanel }: {
  entity: Entity
  events: Event[]
  entities: Entity[]
  relations: Relation[]
  sources: Source[]
  pill: (color: string, text: string) => React.ReactNode
  openPanel: (kind: 'event' | 'entity', id: string) => void
}) {
  const statusColor = getStatusColor(entity.status)
  const statusLabel = getStatusLabel(entity.status)
  const accentColor = 'var(--red)'

  const entityEvents = events.filter(ev => ev.entities.includes(entity.id))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const entityRelations = relations.filter(r => r.from === entity.id || r.to === entity.id)

  return (
    <div>
      {/* Cabecera: foto + nombre */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <EntityThumbSidebar entity={entity} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontFamily: 'var(--fm)', fontSize: '0.5rem', color: 'var(--txt3)' }}>
              {TYPE_LABEL_ENT[entity.type]}
            </span>
            {pill(statusColor, statusLabel)}
          </div>
          <h2 style={{
            fontFamily: 'var(--ft)', fontSize: '1.2rem', fontWeight: 700,
            color: 'var(--txt)', lineHeight: 1.15, letterSpacing: '-0.01em',
            borderLeft: `3px solid ${accentColor}`, paddingLeft: '0.6rem', margin: 0,
          }}>
            {entity.name}
          </h2>
        </div>
      </div>

      {entity.aliases?.length > 0 && (
        <p style={{ fontFamily: 'var(--fm)', fontSize: '0.6rem', color: 'var(--txt3)', marginBottom: '0.6rem', paddingLeft: '0.6rem' }}>
          También: {entity.aliases.join(', ')}
        </p>
      )}

      {entity.wikipedia && (
        <a
          href={entity.wikipedia}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            fontFamily: 'var(--fm)', fontSize: '0.52rem', letterSpacing: '0.06em',
            color: 'var(--txt3)', textDecoration: 'none',
            border: '1px solid var(--line2)', borderRadius: '999px',
            padding: '0.2rem 0.65rem', marginBottom: '0.9rem',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--txt)'; e.currentTarget.style.borderColor = 'var(--txt3)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--txt3)'; e.currentTarget.style.borderColor = 'var(--line2)' }}
        >
          <span style={{ opacity: 0.7 }}>W</span> Wikipedia ↗
        </a>
      )}

      <p style={{ fontFamily: 'var(--fb)', fontSize: '0.88rem', color: 'var(--txt2)', lineHeight: 1.65, marginBottom: '1rem' }}>
        {entity.role}
      </p>

      {entity.notes && (
        <blockquote style={{
          fontFamily: 'var(--ft)', fontStyle: 'italic', fontSize: '0.83rem',
          color: 'var(--txt3)', borderLeft: '2px solid var(--line2)',
          paddingLeft: '0.75rem', marginBottom: '1.2rem', lineHeight: 1.6,
        }}>
          {entity.notes}
        </blockquote>
      )}

      {entity.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.2rem' }}>
          {entity.tags.map((tag: string) => (
            <span key={tag} style={{
              fontFamily: 'var(--fm)', fontSize: '0.52rem', color: 'var(--txt3)',
              border: '1px solid var(--line2)', borderRadius: '999px',
              padding: '0.18rem 0.6rem', letterSpacing: '0.04em',
            }}>#{tag}</span>
          ))}
        </div>
      )}

      {/* Relaciones */}
      {entityRelations.length > 0 && (
        <section style={{ marginBottom: '1.2rem' }}>
          <SectionLabel>Relaciones · {entityRelations.length}</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {entityRelations.map(r => {
              const isFrom = r.from === entity.id
              const otherId = isFrom ? r.to : r.from
              const other = entities.find(e => e.id === otherId)
              return (
                <div key={r.id} style={{
                  background: 'var(--bg2)', borderRadius: '8px',
                  padding: '0.7rem 0.85rem', borderLeft: `2px solid var(--red)`,
                }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35rem', marginBottom: r.description ? '0.35rem' : 0 }}>
                    {isFrom ? (
                      <>
                        <span style={{ fontFamily: 'var(--fb)', fontSize: '0.78rem', color: 'var(--txt3)' }}>{entity.name}</span>
                        <span style={{ fontFamily: 'var(--fm)', fontSize: '0.5rem', color: 'var(--txt3)', background: 'var(--bg3)', borderRadius: '4px', padding: '0.1rem 0.5rem' }}>{r.label}</span>
                        <button onClick={() => openPanel('entity', otherId)} style={linkBtn}>{other?.name ?? otherId}</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => openPanel('entity', otherId)} style={linkBtn}>{other?.name ?? otherId}</button>
                        <span style={{ fontFamily: 'var(--fm)', fontSize: '0.5rem', color: 'var(--txt3)', background: 'var(--bg3)', borderRadius: '4px', padding: '0.1rem 0.5rem' }}>{r.label}</span>
                        <span style={{ fontFamily: 'var(--fb)', fontSize: '0.78rem', color: 'var(--txt3)' }}>{entity.name}</span>
                      </>
                    )}
                    {r.amount?.value != null && (
                      <span style={{ fontFamily: 'var(--fm)', fontSize: '0.62rem', color: 'var(--gold)', marginLeft: 'auto' }}>
                        {r.amount.approximate ? '~' : ''}{r.amount.value.toLocaleString('es-ES')} {r.amount.currency}
                      </span>
                    )}
                  </div>
                  {r.description && (
                    <p style={{ fontFamily: 'var(--fb)', fontSize: '0.78rem', color: 'var(--txt3)', margin: 0, lineHeight: 1.5 }}>
                      {r.description}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Eventos */}
      {entityEvents.length > 0 && (
        <section>
          <SectionLabel>Aparece en · {entityEvents.length} evento{entityEvents.length !== 1 ? 's' : ''}</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {entityEvents.map(ev => {
              return (
                <button
                  key={ev.id}
                  onClick={() => openPanel('event', ev.id)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    background: 'var(--bg2)', borderRadius: '8px',
                    border: '1px solid var(--line)', borderLeft: `2px solid var(--red)`,
                    padding: '0.7rem 0.85rem', cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg2)')}
                >
                  <div style={{ fontFamily: 'var(--fm)', fontSize: '0.55rem', color: 'var(--red)', marginBottom: '0.25rem', letterSpacing: '0.04em' }}>
                    {formatDate(ev.date, ev.date_precision)}
                  </div>
                  <div style={{ fontFamily: 'var(--ft)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--txt)', lineHeight: 1.25 }}>
                    {ev.title}
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

/* ─── HELPERS ──────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--fm)', fontSize: '0.46rem', color: 'var(--txt3)',
      textTransform: 'uppercase', letterSpacing: '0.15em',
      marginBottom: '0.6rem', paddingBottom: '0.4rem',
      borderBottom: '1px solid var(--line)',
    }}>
      {children}
    </div>
  )
}

function SourceRow({ source }: { source: Source }) {
  const isJud = source.type === 'judicial_order'
  const isUDEF = source.subtype === 'UDEF'
  const isUCO = source.subtype === 'UCO'
  const isOfficial = source.type === 'official'
  const badgeColor = isJud ? 'var(--gold)' : isUDEF ? 'var(--red)' : isUCO ? 'var(--blue2)' : isOfficial ? 'var(--green)' : 'var(--line2)'
  const badgeTxt = isJud ? 'Auto' : isUDEF ? 'UDEF' : isUCO ? 'UCO' : isOfficial ? 'Oficial' : 'Prensa'
  const content = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', width: '100%' }}>
      <span style={{
        fontFamily: 'var(--fm)', fontSize: '0.44rem', border: `1px solid ${badgeColor}`,
        color: badgeColor, padding: '0.1rem 0.4rem', borderRadius: '3px',
        textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0,
      }}>{badgeTxt}</span>
      <span style={{ fontFamily: 'var(--fm)', fontSize: '0.62rem', color: 'var(--txt3)', lineHeight: 1.3 }}>
        {source.title}
      </span>
      {source.url && <span style={{ fontFamily: 'var(--fm)', fontSize: '0.55rem', color: 'var(--txt3)', opacity: 0.5, marginLeft: 'auto', flexShrink: 0 }}>↗</span>}
    </span>
  )
  return source.url
    ? <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', padding: '0.4rem 0.6rem', background: 'var(--bg2)', borderRadius: '6px', textDecoration: 'none', transition: 'background 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg2)')}
      >{content}</a>
    : <div style={{ display: 'flex', padding: '0.4rem 0.6rem', background: 'var(--bg2)', borderRadius: '6px' }}>{content}</div>
}

function EntityThumbSidebar({ entity }: { entity: Entity }) {
  const isRound = entity.type === 'person'
  const [src, setSrc] = useState(`/personas/${entity.id}.jpg`)

  return (
    <div style={{
      width: '64px', height: '64px', flexShrink: 0,
      borderRadius: isRound ? '50%' : '10px',
      overflow: 'hidden',
      background: 'var(--bg3)', border: '1px solid var(--line)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {src ? (
        <img
          src={src}
          alt={entity.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={() => setSrc('')}
        />
      ) : (
        <span style={{ fontSize: '1.8rem', color: 'var(--txt3)' }}>{TYPE_ICON[entity.type]}</span>
      )}
    </div>
  )
}

const linkBtn: React.CSSProperties = {
  fontFamily: 'var(--fb)', fontSize: '0.78rem', fontWeight: 600,
  color: 'var(--txt)', background: 'none', border: 'none',
  cursor: 'pointer', padding: 0, textDecoration: 'none',
  borderBottom: '1px solid var(--line2)',
}
