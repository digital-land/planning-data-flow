import { useEffect, useRef, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { queryResourceEndpoints } from '../../services/datasette'
import type { ResourceEndpoint } from '../../services/datasette'
import ApiInfo from '../ApiInfo'

const API_ENDPOINT = '/digital-land/resource_endpoint?endpoint={hash}'

export type ResourceNodeData = {
  label: string
  endpoint_hash?: string
  resource_hash?: string
}

export default function ResourceNode({ data, selected }: NodeProps) {
  const { label, endpoint_hash, resource_hash } = data as ResourceNodeData

  const [resources, setResources] = useState<ResourceEndpoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!endpoint_hash) {
      setResources([])
      setError(null)
      return
    }

    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)
    setResources([])

    queryResourceEndpoints(endpoint_hash)
      .then(setResources)
      .catch((e: unknown) => {
        if (e instanceof Error && e.name !== 'AbortError') setError(e.message)
      })
      .finally(() => setLoading(false))

    return () => abortRef.current?.abort()
  }, [endpoint_hash])

  return (
    <div
      style={{
        background: 'rgba(239,68,68,0.06)', // light red = datasette-backed node
        border: `2px solid ${selected ? 'var(--node-selected)' : '#8b5cf6'}`,
        borderRadius: 8,
        padding: '10px 14px',
        width: 300,
        boxShadow: selected ? '0 0 0 3px rgba(59,130,246,0.2)' : '0 1px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <strong style={{ fontSize: 13, color: 'var(--text)' }}>{label}</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {resources.length > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#8b5cf6',
                background: 'rgba(139,92,246,0.1)',
                padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              {resources.length}
            </span>
          )}
          <ApiInfo url={API_ENDPOINT} source="datasette" />
        </div>
      </div>

      {!endpoint_hash && (
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
          Waiting for endpoint hash…
        </p>
      )}

      {loading && (
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Loading…</p>
      )}

      {error && (
        <p style={{ margin: 0, fontSize: 11, color: '#ef4444' }}>{error}</p>
      )}

      {resources.length > 0 && (
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {resources.map((r) => (
            <li
              key={r.rowid}
              style={{
                fontSize: 10,
                fontFamily: 'ui-monospace, monospace',
                color: r.resource === resource_hash ? '#065f46' : 'var(--text)',
                background: r.resource === resource_hash ? 'rgba(16,185,129,0.12)' : 'var(--bg)',
                border: `1px solid ${r.resource === resource_hash ? '#10b981' : 'var(--border)'}`,
                borderRadius: 4,
                padding: '3px 6px',
                wordBreak: 'break-all',
              }}
            >
              {r.resource}
            </li>
          ))}
        </ul>
      )}

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
