import { useState, useEffect } from 'react'

interface FilterState {
  caso: string
  tipo: string
  impactoMin: number
}

interface FilterBarProps {
  onFilter: (f: FilterState) => void
  tipos: string[]
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  contract: 'Contrato',
  judicial: 'Judicial',
  political: 'Político',
  police_operation: 'Op. policial',
  investigation: 'Investigación',
  scandal: 'Escándalo',
  trial: 'Juicio',
  corruption: 'Corrupción',
  context: 'Contexto',
  money_transfer: 'Transferencia',
}

export default function FilterBar({ onFilter, tipos }: FilterBarProps) {
  const [caso, setCaso] = useState('todos')
  const [tipo, setTipo] = useState('todos')
  const [impactoMin, setImpactoMin] = useState(1)

  useEffect(() => {
    onFilter({ caso, tipo, impactoMin })
  }, [caso, tipo, impactoMin])

  const selectStyle = {
    background: 'var(--bg2)',
    border: '1px solid var(--line2)',
    color: 'var(--txt2)',
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '0.75rem',
    padding: '6px 10px',
    cursor: 'pointer',
    appearance: 'none' as const,
    outline: 'none',
  }

  const labelStyle = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '0.68rem',
    color: 'var(--txt3)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    marginBottom: '4px',
    display: 'block',
  }

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
      padding: '1rem 0',
      borderBottom: '1px solid var(--line)',
      marginBottom: '0',
      alignItems: 'end',
    }}>
      <div>
        <label style={labelStyle}>Caso</label>
        <select value={caso} onChange={e => setCaso((e.target as HTMLSelectElement).value)} style={selectStyle}>
          <option value="todos">Todos</option>
          <option value="dp-77-24">Zapatero</option>
          <option value="caso-koldo">Koldo</option>
        </select>
      </div>

      <div>
        <label style={labelStyle}>Tipo</label>
        <select value={tipo} onChange={e => setTipo((e.target as HTMLSelectElement).value)} style={selectStyle}>
          <option value="todos">Todos</option>
          {tipos.map(t => (
            <option key={t} value={t}>{EVENT_TYPE_LABELS[t] ?? t}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Impacto mínimo: {impactoMin}</label>
        <input
          type="range"
          min={1}
          max={5}
          value={impactoMin}
          onChange={e => setImpactoMin(Number((e.target as HTMLInputElement).value))}
          style={{
            width: '120px',
            accentColor: 'var(--red)',
            display: 'block',
          }}
        />
      </div>

      {(caso !== 'todos' || tipo !== 'todos' || impactoMin > 1) && (
        <button
          onClick={() => { setCaso('todos'); setTipo('todos'); setImpactoMin(1) }}
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.72rem',
            color: 'var(--txt3)',
            background: 'none',
            border: '1px solid var(--line)',
            padding: '6px 12px',
            cursor: 'pointer',
            letterSpacing: '0.04em',
          }}
        >
          Limpiar filtros ✕
        </button>
      )}
    </div>
  )
}
