import { useEffect, useRef, useState } from 'react'
import { Handle, Position, useReactFlow } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { queryFactResource } from '../../services/datasette'
import type { FactResource } from '../../services/datasette'
import ApiInfo from '../ApiInfo'

const API_ENDPOINT = '/{dataset}/fact_resource?resource__exact={hash}&_sort=rowid'

export type FactsNodeData = {
  label: string
  resource_hash?: string
  dataset?: string
  fact_hashes?: string[]
  selected_fact?: string
}

export default function FactsNode({ id, data, selected }: NodeProps) {
  const { label, resource_hash, dataset, selected_fact } = data as FactsNodeData
  const { updateNodeData } = useReactFlow()

  const [facts, setFacts] = useState<FactResource[]>([])
  const [total, setTotal] = useState<number>(0)
  const [truncated, setTruncated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!resource_hash || !dataset) {
      setFacts([])
      setError(null)
      updateNodeData(id, { fact_hashes: [] })
      return
    }

    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)
    setFacts([])

    queryFactResource(resource_hash, dataset)
      .then(({ items, truncated: t, total: n }) => {
        setFacts(items)
        setTruncated(t)
        setTotal(n)
        if (!items.length) {
          setError('No facts found for this resource.')
        } else {
          updateNodeData(id, { fact_hashes: items.map((f) => f.fact) })
        }
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name !== 'AbortError') setError(e.message)
      })
      .finally(() => setLoading(false))

    return () => abortRef.current?.abort()
  }, [resource_hash, dataset, id, updateNodeData])

  return (
    <div
      style={{
        background: 'rgba(239,68,68,0.06)', // light red = datasette-backed node
        border: `2px solid ${selected ? 'var(--node-selected)' : '#8b5cf6'}`,
        borderRadius: 8,
        padding: '10px 14px',
        width: 340,
        boxShadow: selected ? '0 0 0 3px rgba(59,130,246,0.2)' : '0 1px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <strong style={{ fontSize: 13, color: 'var(--text)' }}>{label}</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {total > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
              {total}{truncated ? '+' : ''} facts
            </span>
          )}
          <ApiInfo url={API_ENDPOINT} source="datasette" />
        </div>
      </div>

      {(!resource_hash || !dataset) && (
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
          Waiting for resource hash and dataset…
        </p>
      )}

      {loading && (
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Loading…</p>
      )}

      {error && (
        <p style={{ margin: 0, fontSize: 11, color: '#ef4444' }}>{error}</p>
      )}

      {facts.length > 0 && (
        <div className="nodrag nowheel" style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 200, overflowY: 'auto' }}>
          {facts.map((f) => (
            <div
              key={f.rowid}
              onPointerDown={() => updateNodeData(id, { selected_fact: f.fact })}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                alignItems: 'center',
                gap: 8,
                background: selected_fact === f.fact ? 'rgba(16,185,129,0.12)' : 'var(--bg)',
                border: `1px solid ${selected_fact === f.fact ? '#10b981' : 'var(--border)'}`,
                borderRadius: 4,
                padding: '4px 6px',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.fact}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: 10, whiteSpace: 'nowrap' }}>
                {f.entry_date}
              </span>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', borderRadius: 3, padding: '1px 4px', whiteSpace: 'nowrap' }}>
                p{f.priority}
              </span>
            </div>
          ))}
        </div>
      )}

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
