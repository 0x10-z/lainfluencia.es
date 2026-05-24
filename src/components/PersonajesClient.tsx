import { useState } from 'react'
import type { Entity } from '../types'

interface Props {
  entities: Entity[]
}

const TYPE_LABELS: Record<string, string> = {
  person:      'Persona',
  company:     'Empresa',
  institution: 'Institución',
  account:     'Cuenta',
}

const TYPE_ICONS: Record<string, string> = {
  person:      '◈',
  company:     '◻',
  institution: '⬡',
  account:     '◇',
}

const STATUS_LABELS: Record<string, string> = {
  investigated: 'Investigado',
  accused:      'Acusado',
  convicted:    'Condenado',
  acquitted:    'Absuelto',
  witness:      'Testigo',
  judge:        'Juez',
  prosecutor:   'Fiscal',
  lawyer:       'Abogado',
  unknown:      'Desconocido',
}

const STATUS_COLORS: Record<string, string> = {
  investigated: '#e67e22',
  accused:      'var(--red)',
  convicted:    '#8b0000',
  acquitted:    'var(--green)',
  witness:      'var(--txt3)',
  judge:        'var(--gold)',
  prosecutor:   'var(--blue2)',
  lawyer:       'var(--txt2)',
  unknown:      'var(--txt3)',
}

function openSidebar(id: string) {
  window.openDetailSidebar?.('entity', id)
}

export default function PersonajesClient({ entities }: Props) {
  const [tipo, setTipo]     = useState('todos')
  const [estado, setEstado] = useState('todos')
  const [query, setQuery]   = useState('')

  const tipos    = [...new Set(entities.map(e => e.type))]
  const estados  = [...new Set(entities.map(e => e.status).filter(Boolean))]

  const filtered = entities.filter(e => {
    if (tipo !== 'todos' && e.type !== tipo) return false
    if (estado !== 'todos' && e.status !== estado) return false
    if (query) {
      const q = query.toLowerCase()
      return (
        e.name.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q) ||
        e.aliases.some(a => a.toLowerCase().includes(q)) ||
        e.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    return true
  })

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
          <label style={lblStyle}>Búsqueda</label>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="nombre, rol, alias…"
            style={{
              ...selStyle,
              borderRadius: '999px',
              padding: '0.35rem 0.9rem',
              width: '160px',
              background: 'var(--card)',
            }}
          />
        </div>
        <div>
          <label style={lblStyle}>Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} style={selStyle}>
            <option value="todos">Todos</option>
            {tipos.map(t => <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>)}
          </select>
        </div>
        <div>
          <label style={lblStyle}>Estado procesal</label>
          <select value={estado} onChange={e => setEstado(e.target.value)} style={selStyle}>
            <option value="todos">Todos</option>
            {estados.map(s => <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>)}
          </select>
        </div>
        {(tipo !== 'todos' || estado !== 'todos' || query) && (
          <button
            onClick={() => { setTipo('todos'); setEstado('todos'); setQuery('') }}
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
          {filtered.length} actor{filtered.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* ── GRID ── */}
      {filtered.length === 0 ? (
        <div style={{ padding: '5rem 3vw', fontFamily: 'var(--fm)', fontSize: '0.65rem', color: 'var(--txt3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Sin resultados para los filtros seleccionados.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '0',
          borderLeft: '1px solid var(--line)',
        }}>
          {filtered.map(entity => {
            const statusColor = STATUS_COLORS[entity.status] ?? 'var(--txt3)'
            const statusLabel = STATUS_LABELS[entity.status] ?? entity.status

            return (
              <article
                key={entity.id}
                onClick={() => openSidebar(entity.id)}
                style={{
                  borderRight: '1px solid var(--line)',
                  borderBottom: '1px solid var(--line)',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  position: 'relative',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg2)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
              >
                {/* Cabecera: foto + nombre + status */}
                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                  {/* Foto / icono */}
                  <EntityThumb entity={entity} />

                  {/* Nombre + status */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <span style={{
                        fontFamily: 'var(--fm)', fontSize: '0.44rem', letterSpacing: '0.08em',
                        textTransform: 'uppercase', padding: '0.12rem 0.5rem',
                        borderRadius: '999px', border: `1px solid ${statusColor}`,
                        color: statusColor, flexShrink: 0,
                      }}>
                        {statusLabel}
                      </span>
                      <span style={{
                        fontFamily: 'var(--fm)', fontSize: '0.44rem', letterSpacing: '0.08em',
                        textTransform: 'uppercase', color: 'var(--txt3)',
                      }}>
                        {TYPE_LABELS[entity.type] ?? entity.type}
                      </span>
                    </div>
                    <h3 style={{
                      fontFamily: 'var(--ft)', fontSize: '0.95rem', fontWeight: 700,
                      color: 'var(--txt)', lineHeight: 1.2, letterSpacing: '-0.01em', margin: 0,
                    }}>
                      {entity.name}
                    </h3>
                  </div>
                </div>

                {/* Rol */}
                <p style={{
                  fontFamily: 'var(--fb)', fontSize: '0.75rem', color: 'var(--txt3)',
                  lineHeight: 1.4, margin: 0,
                }}>
                  {entity.role}
                </p>

                {/* Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: 'auto', paddingTop: '0.4rem' }}>
                  {entity.tags.slice(0, 2).map(tag => (
                    <span key={tag} style={{
                      fontFamily: 'var(--fm)', fontSize: '0.44rem', letterSpacing: '0.08em',
                      textTransform: 'uppercase', padding: '0.12rem 0.45rem',
                      borderRadius: '999px', border: '1px solid var(--line2)', color: 'var(--txt3)',
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Alias si hay */}
                {entity.aliases.length > 0 && (
                  <div style={{ fontFamily: 'var(--fm)', fontSize: '0.46rem', color: 'var(--txt3)', letterSpacing: '0.06em' }}>
                    alias: {entity.aliases.join(', ')}
                  </div>
                )}

                <div style={{ fontFamily: 'var(--fm)', fontSize: '0.46rem', color: 'var(--txt3)', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'right' }}>
                  ver ficha →
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EntityThumb({ entity }: { entity: Entity }) {
  const isRound = entity.type === 'person'
  const [src, setSrc] = useState(`/personas/${entity.id}.jpg`)

  return (
    <div style={{
      width: '52px', height: '52px', flexShrink: 0,
      borderRadius: isRound ? '50%' : '8px',
      overflow: 'hidden',
      background: 'var(--bg3)', border: '1px solid var(--line)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {src ? (
        <img
          src={src}
          alt={entity.name}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={() => setSrc('')}
        />
      ) : (
        <span style={{ fontSize: '1.4rem', color: 'var(--txt3)' }}>{TYPE_ICONS[entity.type]}</span>
      )}
    </div>
  )
}
