import { useEffect, useRef } from 'react'
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
  status: string
}

interface Link extends d3.SimulationLinkDatum<Node> {
  id: string
  label: string
  type: string
  verified: boolean | 'partial'
}

function nodeColor(node: Node): string {
  const hasZ = node.cases.includes('dp-77-24')
  const hasK = node.cases.includes('caso-koldo')
  if (hasZ && hasK) return '#b8960c'
  if (hasZ) return '#c0392b'
  if (hasK) return '#1a5f9e'
  return '#4a4740'
}

function nodeRadius(node: Node): number {
  if (node.id === 'zapatero') return 20
  if (node.id === 'abalos') return 18
  if (node.id === 'koldo-garcia') return 16
  if (node.id === 'aldama') return 15
  if (node.type === 'institution') return 10
  if (node.type === 'company') return 11
  return 9
}

export default function GraphD3({ entities, relations }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const svg = d3.select(svgRef.current!)
    const W = svgRef.current!.clientWidth || 900
    const H = svgRef.current!.clientHeight || 600

    svg.selectAll('*').remove()

    const nodes: Node[] = entities.map(e => ({
      id: e.id, name: e.name, type: e.type,
      cases: e.cases, role: e.role, status: e.status,
    }))

    const nodeMap = new Map(nodes.map(n => [n.id, n]))

    const links: Link[] = relations
      .filter(r => nodeMap.has(r.from) && nodeMap.has(r.to))
      .map(r => ({
        source: r.from, target: r.to,
        id: r.id, label: r.label, type: r.type, verified: r.verified,
      }))

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', e => g.attr('transform', e.transform.toString()))

    svg.call(zoom)

    const g = svg.append('g')

    // Defs: arrowhead
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', '#2d2d2d')

    // Simulación
    const sim = d3.forceSimulation<Node>(nodes)
      .force('link', d3.forceLink<Node, Link>(links).id(d => d.id).distance(90).strength(0.4))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collide', d3.forceCollide<Node>().radius(d => nodeRadius(d) + 12))
      // Separación suave por caso: Zapatero a la izquierda, Koldo a la derecha
      .force('x', d3.forceX<Node>(d => {
        const hasZ = d.cases.includes('dp-77-24')
        const hasK = d.cases.includes('caso-koldo')
        if (hasZ && !hasK) return W * 0.3
        if (hasK && !hasZ) return W * 0.7
        return W * 0.5
      }).strength(0.06))
      .force('y', d3.forceY<Node>(H / 2).strength(0.04))

    // Links
    const link = g.append('g').selectAll('line')
      .data(links).join('line')
      .attr('stroke', d => d.verified === true ? '#2d2d2d' : d.verified === 'partial' ? '#2a2a1a' : '#1f1f1f')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', d => d.verified === 'partial' ? '4,3' : null)
      .attr('marker-end', 'url(#arrow)')

    // Nodos
    const node = g.append('g').selectAll('g')
      .data(nodes).join('g')
      .style('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, Node>()
          .on('start', (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart()
            d.fx = d.x; d.fy = d.y
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
          .on('end', (event, d) => {
            if (!event.active) sim.alphaTarget(0)
            d.fx = null; d.fy = null
          })
      )

    node.append('circle')
      .attr('r', d => nodeRadius(d))
      .attr('fill', d => nodeColor(d) + '33')
      .attr('stroke', d => nodeColor(d))
      .attr('stroke-width', 1.5)

    node.append('text')
      .text(d => d.name.split(' ').slice(0, 2).join(' '))
      .attr('dy', d => nodeRadius(d) + 12)
      .attr('text-anchor', 'middle')
      .attr('font-family', "'DM Mono', monospace")
      .attr('font-size', '9px')
      .attr('fill', '#9a9589')
      .attr('pointer-events', 'none')

    // Tooltip hover
    node
      .on('mouseenter', (event, d) => {
        const t = tooltipRef.current
        if (!t) return
        t.style.display = 'block'
        t.innerHTML = `
          <div style="font-weight:700;font-size:0.85rem;color:var(--txt);margin-bottom:4px;">${d.name}</div>
          <div style="font-size:0.75rem;color:var(--txt2);margin-bottom:4px;">${d.role}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${d.cases.map(c => `<span style="font-size:0.62rem;padding:2px 6px;border-radius:999px;border:1px solid ${c === 'dp-77-24' ? 'var(--red)' : 'var(--blue)'};color:${c === 'dp-77-24' ? 'var(--red)' : 'var(--blue2)'};">${c === 'dp-77-24' ? 'Zapatero' : 'Koldo'}</span>`).join('')}
          </div>
        `
        t.style.left = (event.pageX + 12) + 'px'
        t.style.top = (event.pageY - 10) + 'px'
        d3.select(event.currentTarget).select('circle').attr('stroke-width', 2.5)
      })
      .on('mousemove', event => {
        const t = tooltipRef.current
        if (!t) return
        t.style.left = (event.pageX + 12) + 'px'
        t.style.top = (event.pageY - 10) + 'px'
      })
      .on('mouseleave', event => {
        const t = tooltipRef.current
        if (t) t.style.display = 'none'
        d3.select(event.currentTarget).select('circle').attr('stroke-width', 1.5)
      })
      .on('click', (_, d) => {
        window.location.href = `/personajes/${d.id}`
      })

    sim.on('tick', () => {
      link
        .attr('x1', d => (d.source as Node).x!)
        .attr('y1', d => (d.source as Node).y!)
        .attr('x2', d => (d.target as Node).x!)
        .attr('y2', d => (d.target as Node).y!)
      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    return () => { sim.stop() }
  }, [entities, relations])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        ref={svgRef}
        style={{ width: '100%', height: '100%', background: 'var(--bg2)', display: 'block' }}
      />
      <div
        ref={tooltipRef}
        style={{
          display: 'none',
          position: 'fixed',
          background: 'var(--bg)',
          border: '1px solid var(--line2)',
          padding: '10px 14px',
          pointerEvents: 'none',
          zIndex: 200,
          maxWidth: '260px',
          fontFamily: "'DM Sans', sans-serif",
        }}
      />
    </div>
  )
}
