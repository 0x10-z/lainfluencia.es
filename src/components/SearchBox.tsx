import { useState, useMemo } from 'react'
import Fuse from 'fuse.js'
import type { Event, Entity } from '../types'

interface SearchItem {
  type: 'event' | 'entity'
  id: string
  title: string
  subtitle: string
  href: string
}

interface Props {
  events: Event[]
  entities: Entity[]
}

function highlight(text: string, query: string): string {
  if (!query) return text
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(re, '<mark style="background:rgba(192,57,43,0.25);color:var(--txt);">$1</mark>')
}

export default function SearchBox({ events, entities }: Props) {
  const [query, setQuery] = useState('')

  const items: SearchItem[] = useMemo(() => [
    ...events.map(ev => ({
      type: 'event' as const,
      id: ev.id,
      title: ev.title,
      subtitle: ev.description.slice(0, 100) + '…',
      href: `/eventos/${ev.id}`,
    })),
    ...entities.map(en => ({
      type: 'entity' as const,
      id: en.id,
      title: en.name,
      subtitle: en.role,
      href: `/personajes/${en.id}`,
    })),
  ], [])

  const fuse = useMemo(() => new Fuse(items, {
    keys: ['title', 'subtitle'],
    threshold: 0.35,
    includeMatches: true,
  }), [items])

  const results = query.trim().length >= 2 ? fuse.search(query).slice(0, 12) : []

  const TYPE_LABEL = { event: 'Evento', entity: 'Personaje' }
  const TYPE_COLOR = { event: 'var(--blue2)', entity: 'var(--gold)' }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ position: 'relative', marginBottom: '1px' }}>
        <input
          type="search"
          placeholder="Buscar eventos, personas, empresas…"
          value={query}
          onInput={e => setQuery((e.target as HTMLInputElement).value)}
          autoFocus
          style={{
            width: '100%',
            background: 'var(--bg2)',
            border: '1px solid var(--line2)',
            color: 'var(--txt)',
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '1.1rem',
            padding: '0.9rem 1rem',
            outline: 'none',
          }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{
              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', fontSize: '1rem',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {query.trim().length >= 2 && (
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.7rem', color: 'var(--txt3)', padding: '0.5rem 0', marginBottom: '0.5rem' }}>
          {results.length} resultado{results.length !== 1 ? 's' : ''} para "{query}"
        </div>
      )}

      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--line)' }}>
          {results.map(r => (
            <a
              key={r.item.id}
              href={r.item.href}
              style={{
                display: 'block',
                background: 'var(--bg2)',
                padding: '0.9rem 1.25rem',
                textDecoration: 'none',
                borderLeft: `3px solid ${TYPE_COLOR[r.item.type]}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <span style={{
                  fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.62rem', textTransform: 'uppercase',
                  letterSpacing: '0.06em', color: TYPE_COLOR[r.item.type],
                }}>
                  {TYPE_LABEL[r.item.type]}
                </span>
              </div>
              <div
                style={{ fontSize: '0.95rem', color: 'var(--txt)', fontWeight: 600, marginBottom: '3px' }}
                dangerouslySetInnerHTML={{ __html: highlight(r.item.title, query) }}
              />
              <div
                style={{ fontSize: '0.8rem', color: 'var(--txt3)', lineHeight: 1.4 }}
                dangerouslySetInnerHTML={{ __html: highlight(r.item.subtitle, query) }}
              />
            </a>
          ))}
        </div>
      )}

      {query.trim().length >= 2 && results.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--txt3)', fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.85rem' }}>
          Sin resultados para "{query}"
        </div>
      )}
    </div>
  )
}
