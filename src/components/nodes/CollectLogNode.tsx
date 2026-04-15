import { useEffect, useRef, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { queryCollectLog } from '../../services/datasette'
import type { LogEntry } from '../../services/datasette'
import ApiInfo from '../ApiInfo'

const API_ENDPOINT = '/digital-land/log?resource={hash}'

export type CollectLogNodeData = {
  label: string
  resource_hash?: string
}

const STATUS_COLOR: Record<string, string> = {
  '200': '#10b981',
  '301': '#f59e0b',
  '302': '#f59e0b',
  '404': '#ef4444',
  '403': '#ef4444',
  '500': '#ef4444',
}

export default function CollectLogNode({ data, selected }: NodeProps) {
  const { label, resource_hash } = data as CollectLogNodeData

  const [entries, setEntries] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!resource_hash) {
      setEntries([])
      setError(null)
      return
    }

    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)
    setEntries([])

    queryCollectLog(resource_hash)
      .then(setEntries)
      .catch((e: unknown) => {
        if (e instanceof Error && e.name !== 'AbortError') setError(e.message)
      })
      .finally(() => setLoading(false))

    return () => abortRef.current?.abort()
  }, [resource_hash])

  return (
    <div
      style={{
        background: 'rgba(239,68,68,0.06)', // light red = datasette-backed node
        border: `2px solid ${selected ? 'var(--node-selected)' : '#f59e0b'}`,
        borderRadius: 8,
        padding: '10px 14px',
        width: 340,
        boxShadow: selected ? '0 0 0 3px rgba(59,130,246,0.2)' : '0 1px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <strong style={{ fontSize: 13, color: 'var(--text)' }}>{label}</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {entries.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
              {entries.length} entries
            </span>
          )}
          <ApiInfo url={API_ENDPOINT} source="datasette" />
        </div>
      </div>

      {!resource_hash && (
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
          Waiting for resource hash…
        </p>
      )}

      {loading && (
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Loading…</p>
      )}

      {error && (
        <p style={{ margin: 0, fontSize: 11, color: '#ef4444' }}>{error}</p>
      )}

      {entries.length > 0 && (
        <div className="nodrag nowheel" style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 200, overflowY: 'auto' }}>
          {entries.map((entry) => {
            const statusColor = STATUS_COLOR[String(entry.status)] ?? '#94a3b8'
            return (
              <div
                key={entry.rowid}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '44px 1fr auto',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  padding: '4px 6px',
                  fontSize: 11,
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    color: statusColor,
                    background: `${statusColor}1a`,
                    borderRadius: 3,
                    padding: '1px 4px',
                    textAlign: 'center',
                  }}
                >
                  {entry.status}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.content_type?.split(';')[0]}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: 10, whiteSpace: 'nowrap' }}>
                  {String(entry.entry_date).replace('T', ' ').slice(0, 16)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
