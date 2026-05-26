import { useState, useEffect, useRef } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { getEntity } from '../../services/planningDataApi'
import type { Entity } from '../../services/planningDataApi'
import ApiInfo from '../ApiInfo'

const API_ENDPOINT = '/entity/{entity}.json'

export type EntityNodeData = {
  label: string
  entity?: number
}

const OMIT = new Set(['geometry'])

const FIELD_LABELS: Record<string, string> = {
  entity: 'Entity',
  name: 'Name',
  dataset: 'Dataset',
  typology: 'Typology',
  reference: 'Reference',
  prefix: 'Prefix',
  'organisation-entity': 'Organisation',
  point: 'Point',
  quality: 'Quality',
  notes: 'Notes',
  'entry-date': 'Entry date',
  'start-date': 'Start date',
  'end-date': 'End date',
}

export default function EntityNode({ data, selected }: NodeProps) {
  const { label, entity } = data as EntityNodeData

  const [result, setResult] = useState<Entity | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (entity == null) {
      setResult(null)
      setError(null)
      return
    }

    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)
    setResult(null)

    getEntity(entity)
      .then(setResult)
      .catch((e: unknown) => {
        if (e instanceof Error && e.name !== 'AbortError') setError(e.message)
      })
      .finally(() => setLoading(false))

    return () => abortRef.current?.abort()
  }, [entity])

  return (
    <div
      style={{
        background: 'var(--node-bg)',
        border: `2px solid ${selected ? 'var(--node-selected)' : '#ef4444'}`,
        borderRadius: 8,
        padding: '10px 14px',
        width: 340,
        boxShadow: selected ? '0 0 0 3px rgba(59,130,246,0.2)' : '0 1px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <strong style={{ fontSize: 13, color: 'var(--text)' }}>{label}</strong>
        <ApiInfo url={API_ENDPOINT} source="platform" />
      </div>

      {entity == null && (
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
          Waiting for a selected fact…
        </p>
      )}

      {entity != null && loading && (
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Loading…</p>
      )}

      {error && (
        <p style={{ margin: 0, fontSize: 11, color: '#ef4444' }}>{error}</p>
      )}

      {result && (
        <div className="nodrag nowheel" style={{ maxHeight: 300, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <tbody>
              {Object.entries(result)
                .filter(([key]) => !OMIT.has(key))
                .map(([key, value]) => (
                  <tr key={key}>
                    <td style={{ padding: '3px 6px 3px 0', color: 'var(--text-muted)', whiteSpace: 'nowrap', verticalAlign: 'top', fontWeight: 500 }}>
                      {FIELD_LABELS[key] ?? key}
                    </td>
                    <td style={{ padding: '3px 0', color: 'var(--text)', wordBreak: 'break-all' }}>
                      {String(value ?? '—')}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
