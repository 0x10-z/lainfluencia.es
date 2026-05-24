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
  return text.replace(re, '<mark style="background:rgba(192,57,43,0.3);color:#ece8df;">$1</mark>')
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
      subtitle: ev.description.slice(0, 90) + '…',
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

  const results = query.trim().length >= 2 ? fuse.search(query).slice(0, 7) : []

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const TYPE_COLOR = { event: 'var(--red)', entity: 'var(--blue2)' }
  const TYPE_LABEL = { event: 'Evento', entity: 'Actor' }

  return (
    <div ref={wrapRef} className="nav-search-wrap">
      <span className="nav-search-icon" style={{ fontSize: '0.7rem', color: 'var(--txt3)' }}>⌕</span>
      <input
        type="search"
        className="nav-search-input"
        placeholder="Buscar archivo…"
        value={query}
        onInput={e => { setQuery((e.target as HTMLInputElement).value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); setQuery('') } }}
      />
      {open && query.trim().length >= 2 && (
        <div className="nav-search-dropdown">
          {results.length === 0 ? (
            <div style={{
              padding: '1.2rem 1.5rem',
              fontFamily: 'var(--fm)', fontSize: '0.6rem',
              color: 'var(--txt3)', letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Sin resultados — {query}
            </div>
          ) : (
            <>
              <div style={{
                padding: '0.5rem 1.5rem',
                fontFamily: 'var(--fm)', fontSize: '0.48rem',
                color: 'var(--txt3)', letterSpacing: '0.15em',
                textTransform: 'uppercase',
                borderBottom: '1px solid var(--line)',
              }}>
                {results.length} resultado{results.length !== 1 ? 's' : ''}
              </div>
              {results.map(r => (
                <a
                  key={r.item.id}
                  href={r.item.href}
                  onClick={() => { setOpen(false); setQuery('') }}
                  style={{
                    display: 'block',
                    padding: '0.85rem 1.5rem',
                    textDecoration: 'none',
                    borderBottom: '1px solid var(--line)',
                    borderLeft: `2px solid ${TYPE_COLOR[r.item.type]}`,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <div style={{
                    fontFamily: 'var(--fm)', fontSize: '0.46rem',
                    textTransform: 'uppercase', letterSpacing: '0.12em',
                    color: TYPE_COLOR[r.item.type],
                    marginBottom: '0.3rem',
                  }}>
                    {TYPE_LABEL[r.item.type]}
                  </div>
                  <div
                    style={{ fontFamily: "'Playfair Display',serif", fontSize: '0.9rem', fontWeight: 700, color: 'var(--txt)', marginBottom: '0.2rem', lineHeight: 1.2 }}
                    dangerouslySetInnerHTML={{ __html: highlight(r.item.title, query) }}
                  />
                  <div
                    style={{ fontFamily: 'var(--fm)', fontSize: '0.58rem', color: 'var(--txt3)', lineHeight: 1.4 }}
                    dangerouslySetInnerHTML={{ __html: highlight(r.item.subtitle, query) }}
                  />
                </a>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
