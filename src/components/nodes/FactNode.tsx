import { useState, useEffect, useRef } from 'react'
import { Handle, Position, useReactFlow } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { getFact } from '../../services/planningDataApi'
import type { Fact, FactResource } from '../../services/planningDataApi'
import ApiInfo from '../ApiInfo'

const API_ENDPOINT = '/fact/{hash}.json?dataset={dataset}'

export type FactNodeData = {
  label: string
  dataset?: string
  fact_hashes?: string[]
  selected_fact?: string
  entity?: number
}

const OMIT = new Set(['reference-entity', 'resources'])

const FIELD_LABELS: Record<string, string> = {
  fact: 'Fact hash',
  entity: 'Entity',
  field: 'Field',
  value: 'Value',
  'entity-name': 'Entity name',
  'entity-prefix': 'Prefix',
  'entity-reference': 'Reference',
  'earliest-entry-date': 'First seen',
  'latest-entry-date': 'Last seen',
  'latest-resource': 'Latest resource',
}

export default function FactNode({ id, data, selected }: NodeProps) {
  const { label, dataset, selected_fact } = data as FactNodeData
  const { updateNodeData } = useReactFlow()

  const [result, setResult] = useState<Fact | null>(null)
  const [resources, setResources] = useState<FactResource[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!selected_fact || !dataset) {
      setResult(null)
      setResources([])
      setError(null)
      updateNodeData(id, { entity: undefined })
      return
    }

    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)
    setResult(null)
    setResources([])

    getFact(selected_fact, dataset)
      .then((fact) => {
        setResult(fact)
        updateNodeData(id, { entity: fact.entity })
        try {
          setResources(JSON.parse(fact.resources) as FactResource[])
        } catch {
          // empty or malformed
        }
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name !== 'AbortError') setError(e.message)
      })
      .finally(() => setLoading(false))

    return () => abortRef.current?.abort()
  }, [selected_fact, dataset, id, updateNodeData])

  return (
    <div
      style={{
        background: 'var(--node-bg)',
        border: `2px solid ${selected ? 'var(--node-selected)' : '#10b981'}`,
        borderRadius: 8,
        padding: '10px 14px',
        width: 340,
        boxShadow: selected ? '0 0 0 3px rgba(59,130,246,0.2)' : '0 1px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <strong style={{ fontSize: 13, color: 'var(--text)' }}>{label}</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {dataset && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>{dataset}</span>
          )}
          <ApiInfo url={API_ENDPOINT} source="platform" />
        </div>
      </div>

      {!selected_fact && (
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
          Select a fact in the Facts node…
        </p>
      )}

      {selected_fact && (
        <>
          <div style={{ marginBottom: 8, fontSize: 10, fontFamily: 'ui-monospace, monospace', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selected_fact}
          </div>

          {loading && <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Loading…</p>}
          {error && <p style={{ margin: 0, fontSize: 11, color: '#ef4444' }}>{error}</p>}

          {result && (
            <>
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

              {resources.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Resources ({resources.length})
                  </p>
                  <div className="nodrag nowheel" style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 120, overflowY: 'auto' }}>
                    {resources.map((r) => (
                      <div key={r.resource} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, padding: '3px 6px', fontSize: 10 }}>
                        <span style={{ fontFamily: 'ui-monospace, monospace', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.resource}
                        </span>
                        <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{r.entry_date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
