import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import type { Entity, Relation } from '../types'

interface Props {
  entities: Entity[]
  relations: Relation[]
}

interface Node extends d3.SimulationNodeDatum {
  id: string
  name: string
  type: Entity['type']
  cases: string[]
  role: string
  status?: string
}

interface Link extends d3.SimulationLinkDatum<Node> {
  id: string
  label: string
  type: string
  verified: boolean | 'partial'
  amount?: { value: number; currency: string; approximate: boolean }
}

// Color por tipo de entidad
const NODE_COLOR: Record<string, string> = {
  person:      '#9c1f10',
  company:     '#143460',
  institution: '#134a28',
  account:     '#6b5006',
}

// Color por tipo de relación
const LINK_COLOR: Record<string, string> = {
  pays:              '#6b5006',   // gold — dinero
  transfers:         '#6b5006',
  controls:          '#9c1f10',   // red — control
  coordinates:       '#9c1f10',
  influences:        '#c0392b',
  employs:           '#1e5490',   // blue — laboral
  advises:           '#1e5490',
  investigates:      '#134a28',   // green — judicial
  imputes:           '#134a28',
  produces_documents:'#7a7264',   // grey
  awards_contract:   '#6b5006',
}

function nodeRadius(node: Node): number {
  if (node.id === 'zapatero')     return 22
  if (node.id === 'abalos')       return 18
  if (node.id === 'koldo-garcia') return 16
  if (node.id === 'aldama')       return 15
  if (node.type === 'institution') return 11
  if (node.type === 'company')     return 12
  if (node.type === 'account')     return 9
  return 10
}

export default function GraphD3({ entities, relations }: Props) {
  const svgRef    = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [activeType, setActiveType] = useState<string | null>(null)

  useEffect(() => {
    const svg = d3.select(svgRef.current!)
    const W = svgRef.current!.clientWidth  || 900
    const H = svgRef.current!.clientHeight || 600

    svg.selectAll('*').remove()

    const nodes: Node[] = entities.map(e => ({
      id: e.id, name: e.name, type: e.type,
      cases: e.cases, role: e.role, status: e.status,
    }))

    const nodeMap = new Map(nodes.map(n => [n.id, n]))

    const links: Link[] = relations
      .filter(r => nodeMap.has(r.from) && nodeMap.has(r.to))
      .filter(r => !activeType || r.type === activeType)
      .map(r => ({
        source: r.from, target: r.to,
        id: r.id, label: r.label, type: r.type,
        verified: r.verified, amount: r.amount,
      }))

    // Arrowhead por color de tipo
    const defs = svg.append('defs')
    const arrowColors = [...new Set(links.map(l => LINK_COLOR[l.type] ?? '#4a4740'))]
    arrowColors.forEach(color => {
      const safeId = color.replace('#', 'arrow-')
      defs.append('marker')
        .attr('id', safeId)
        .attr('viewBox', '0 -4 8 8')
        .attr('refX', 24).attr('refY', 0)
        .attr('markerWidth', 5).attr('markerHeight', 5)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-4L8,0L0,4')
        .attr('fill', color)
    })

    // Clip paths para fotos
    nodes.forEach(d => {
      defs.append('clipPath')
        .attr('id', `clip-${d.id}`)
        .append('circle')
        .attr('r', nodeRadius(d))
    })

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 5])
      .on('zoom', e => g.attr('transform', e.transform.toString()))
    svg.call(zoom)

    const g = svg.append('g')

    // Simulación
    const sim = d3.forceSimulation<Node>(nodes)
      .force('link',    d3.forceLink<Node, Link>(links).id(d => d.id).distance(110).strength(0.35))
      .force('charge',  d3.forceManyBody().strength(-320))
      .force('center',  d3.forceCenter(W / 2, H / 2))
      .force('collide', d3.forceCollide<Node>().radius(d => nodeRadius(d) + 14))
      .force('x',       d3.forceX<Node>(W / 2).strength(0.05))
      .force('y',       d3.forceY<Node>(H / 2).strength(0.04))

    // Links
    const link = g.append('g').selectAll('line')
      .data(links).join('line')
      .attr('stroke', d => LINK_COLOR[d.type] ?? '#4a4740')
      .attr('stroke-opacity', 0.65)
      .attr('stroke-width', d => d.amount?.value ? 2.5 : 1.5)
      .attr('stroke-dasharray', d => d.verified === 'partial' ? '5,3' : d.verified === false ? '2,4' : null)
      .attr('marker-end', d => {
        const color = LINK_COLOR[d.type] ?? '#4a4740'
        return `url(#${color.replace('#', 'arrow-')})`
      })

    // Link hover — label flotante
    link
      .on('mouseenter', (event, d) => {
        const t = tooltipRef.current; if (!t) return
        const amt = d.amount?.value
          ? `\n${d.amount.approximate ? '~' : ''}${d.amount.value.toLocaleString('es-ES')} ${d.amount.currency}`
          : ''
        t.innerHTML = `<span style="font-weight:600">${d.label}</span>${amt ? `<br><span style="color:var(--gold)">${amt.trim()}</span>` : ''}`
        t.style.display = 'block'
        t.style.left = (event.pageX + 14) + 'px'
        t.style.top  = (event.pageY - 10) + 'px'
        d3.select(event.currentTarget as SVGLineElement).attr('stroke-opacity', 1).attr('stroke-width', 3)
      })
      .on('mousemove', event => {
        const t = tooltipRef.current; if (!t) return
        t.style.left = (event.pageX + 14) + 'px'
        t.style.top  = (event.pageY - 10) + 'px'
      })
      .on('mouseleave', (event, d) => {
        const t = tooltipRef.current; if (t) t.style.display = 'none'
        d3.select(event.currentTarget as SVGLineElement)
          .attr('stroke-opacity', 0.65)
          .attr('stroke-width', d.amount?.value ? 2.5 : 1.5)
      })

    // Nodos
    const node = g.append('g').selectAll<SVGGElement, Node>('g')
      .data(nodes).join('g')
      .style('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, Node>()
          .on('start', (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
          .on('drag',  (event, d) => { d.fx = event.x; d.fy = event.y })
          .on('end',   (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null })
      )

    // Círculo de fondo
    node.append('circle')
      .attr('r', d => nodeRadius(d))
      .attr('fill', d => NODE_COLOR[d.type] + '18')
      .attr('stroke', d => NODE_COLOR[d.type])
      .attr('stroke-width', d => d.id === 'zapatero' ? 2.5 : 1.5)

    // Foto
    node.append('image')
      .attr('href', d => `/personas/${d.id}.jpg`)
      .attr('x', d => -nodeRadius(d))
      .attr('y', d => -nodeRadius(d))
      .attr('width',  d => nodeRadius(d) * 2)
      .attr('height', d => nodeRadius(d) * 2)
      .attr('clip-path', d => `url(#clip-${d.id})`)
      .attr('preserveAspectRatio', 'xMidYMid slice')
      .on('error', function() { d3.select(this).remove() })

    // Icono de tipo si no hay foto (se superpone, se elimina si la imagen carga)
    node.append('text')
      .text(d => ({ person: '◉', company: '▣', institution: '⬡', account: '◈' }[d.type] ?? '●'))
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('font-size', d => nodeRadius(d) * 0.9 + 'px')
      .attr('fill', d => NODE_COLOR[d.type])
      .attr('opacity', 0.5)
      .attr('pointer-events', 'none')

    // Etiqueta de nombre
    node.append('text')
      .text(d => d.name.split(' ').slice(0, 2).join(' '))
      .attr('dy', d => nodeRadius(d) + 11)
      .attr('text-anchor', 'middle')
      .attr('font-family', "'IBM Plex Mono', monospace")
      .attr('font-size', '8.5px')
      .attr('fill', '#7a7264')
      .attr('pointer-events', 'none')

    // Hover nodo
    node
      .on('mouseenter', (event, d) => {
        const t = tooltipRef.current; if (!t) return
        t.innerHTML = `
          <div style="font-weight:700;font-size:0.82rem;color:var(--txt);margin-bottom:3px;">${d.name}</div>
          <div style="font-size:0.7rem;color:var(--txt3);font-family:'IBM Plex Mono',monospace;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">${d.type}</div>
          <div style="font-size:0.75rem;color:var(--txt2);line-height:1.4;">${d.role}</div>
        `
        t.style.display = 'block'
        t.style.left = (event.pageX + 14) + 'px'
        t.style.top  = (event.pageY - 10) + 'px'
        d3.select(event.currentTarget as SVGGElement).select('circle')
          .attr('stroke-width', 3).attr('fill', (d: any) => NODE_COLOR[d.type] + '35')
      })
      .on('mousemove', event => {
        const t = tooltipRef.current; if (!t) return
        t.style.left = (event.pageX + 14) + 'px'
        t.style.top  = (event.pageY - 10) + 'px'
      })
      .on('mouseleave', (event, d) => {
        const t = tooltipRef.current; if (t) t.style.display = 'none'
        d3.select(event.currentTarget as SVGGElement).select('circle')
          .attr('stroke-width', d.id === 'zapatero' ? 2.5 : 1.5)
          .attr('fill', NODE_COLOR[d.type] + '18')
      })
      .on('click', (_, d) => window.openDetailSidebar?.('entity', d.id))

    sim.on('tick', () => {
      link
        .attr('x1', d => (d.source as Node).x!)
        .attr('y1', d => (d.source as Node).y!)
        .attr('x2', d => (d.target as Node).x!)
        .attr('y2', d => (d.target as Node).y!)
      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    return () => { sim.stop() }
  }, [entities, relations, activeType])

  const linkTypes = [...new Set(relations.map(r => r.type))]
  const TYPE_LABEL: Record<string, string> = {
    pays: 'Pagos', transfers: 'Transferencias', controls: 'Control',
    coordinates: 'Coordinación', influences: 'Influencia', employs: 'Empleo',
    advises: 'Asesoría', investigates: 'Investigación', imputes: 'Imputación',
    produces_documents: 'Documentos', awards_contract: 'Contrato',
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Filtros de tipo de relación */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.35rem',
        padding: '0.65rem 1rem', borderBottom: '1px solid var(--line)',
        background: 'var(--bg2)', flexShrink: 0,
      }}>
        <button
          onClick={() => setActiveType(null)}
          style={{
            fontFamily: 'var(--fm)', fontSize: '0.48rem', letterSpacing: '0.08em',
            textTransform: 'uppercase', padding: '0.2rem 0.65rem',
            borderRadius: '999px', cursor: 'pointer',
            border: activeType === null ? '1px solid var(--txt2)' : '1px solid var(--line2)',
            background: activeType === null ? 'var(--txt)' : 'transparent',
            color: activeType === null ? 'var(--bg)' : 'var(--txt3)',
          }}
        >Todos</button>
        {linkTypes.map(t => (
          <button key={t} onClick={() => setActiveType(activeType === t ? null : t)} style={{
            fontFamily: 'var(--fm)', fontSize: '0.48rem', letterSpacing: '0.08em',
            textTransform: 'uppercase', padding: '0.2rem 0.65rem',
            borderRadius: '999px', cursor: 'pointer',
            border: `1px solid ${activeType === t ? LINK_COLOR[t] ?? 'var(--line2)' : 'var(--line2)'}`,
            background: activeType === t ? (LINK_COLOR[t] ?? 'transparent') + '22' : 'transparent',
            color: activeType === t ? (LINK_COLOR[t] ?? 'var(--txt3)') : 'var(--txt3)',
          }}>
            {TYPE_LABEL[t] ?? t}
          </button>
        ))}
      </div>

      {/* SVG */}
      <svg
        ref={svgRef}
        style={{ flex: 1, width: '100%', background: 'var(--bg)', display: 'block' }}
      />

      {/* Tooltip */}
      <div ref={tooltipRef} style={{
        display: 'none', position: 'fixed',
        background: 'var(--card)', border: '1px solid var(--line)',
        padding: '8px 12px', pointerEvents: 'none',
        zIndex: 500, maxWidth: '240px',
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: '0.8rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        borderRadius: '4px',
      }} />
    </div>
  )
}
