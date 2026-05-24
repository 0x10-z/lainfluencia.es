import { useState, useMemo, useRef, useEffect } from 'react'
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
  return text.replace(re, '<mark style="background:rgba(168,35,24,0.2);color:var(--txt);">$1</mark>')
}

export default function NavSearch({ events, entities }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const items: SearchItem[] = useMemo(() => [
    ...events.map(ev => ({
      type: 'event' as const,
      id: ev.id,
      title: ev.title,
      subtitle: ev.description.slice(0, 80) + '…',
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
  }), [items])

  const results = query.trim().length >= 2 ? fuse.search(query).slice(0, 8) : []

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const TYPE_LABEL = { event: 'Evento', entity: 'Personaje' }
  const TYPE_COLOR = { event: 'var(--blue)', entity: 'var(--gold)' }

  return (
    <div ref={wrapRef} className="nav-search-wrap">
      <span className="nav-search-icon">⌕</span>
      <input
        type="search"
        className="nav-search-input"
        placeholder="Buscar…"
        value={query}
        onInput={e => { setQuery((e.target as HTMLInputElement).value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); setQuery('') } }}
      />
      {open && query.trim().length >= 2 && (
        <div className="nav-search-dropdown">
          {results.length === 0 ? (
            <div style={{ padding: '1rem 1.25rem', fontFamily: "'DM Mono',monospace", fontSize: '0.75rem', color: 'var(--txt3)' }}>
              Sin resultados para "{query}"
            </div>
          ) : (
            results.map(r => (
              <a
                key={r.item.id}
                href={r.item.href}
                onClick={() => { setOpen(false); setQuery('') }}
                style={{
                  display: 'block',
                  padding: '0.65rem 1rem',
                  textDecoration: 'none',
                  borderBottom: '1px solid var(--line2)',
                  borderLeft: `3px solid ${TYPE_COLOR[r.item.type]}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <span style={{
                    fontFamily: "'DM Mono',monospace", fontSize: '0.58rem',
                    textTransform: 'uppercase' as const, letterSpacing: '0.06em',
                    color: TYPE_COLOR[r.item.type],
                  }}>
                    {TYPE_LABEL[r.item.type]}
                  </span>
                </div>
                <div
                  style={{ fontSize: '0.88rem', color: 'var(--txt)', fontWeight: 600, marginBottom: '1px' }}
                  dangerouslySetInnerHTML={{ __html: highlight(r.item.title, query) }}
                />
                <div
                  style={{ fontSize: '0.75rem', color: 'var(--txt3)', lineHeight: 1.3 }}
                  dangerouslySetInnerHTML={{ __html: highlight(r.item.subtitle, query) }}
                />
              </a>
            ))
          )}
        </div>
      )}
    </div>
  )
}
