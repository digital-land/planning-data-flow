import { useEffect, useRef, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { queryConvertedResource } from '../../services/datasette'
import type { ConvertedResource } from '../../services/datasette'
import ApiInfo from '../ApiInfo'

const API_ENDPOINT = '/digital-land/converted_resource?resource={hash}'

export type ConvertStatusNodeData = {
  label: string
  resource_hash?: string
}

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  success: { bg: 'rgba(16,185,129,0.12)', text: '#065f46', border: '#10b981' },
  error:   { bg: 'rgba(239,68,68,0.12)',  text: '#991b1b', border: '#ef4444' },
  warning: { bg: 'rgba(245,158,11,0.12)', text: '#92400e', border: '#f59e0b' },
}

function getStatusStyle(status: string) {
  return STATUS_STYLE[status.toLowerCase()] ?? { bg: 'rgba(148,163,184,0.12)', text: 'var(--text-muted)', border: '#94a3b8' }
}

export default function ConvertStatusNode({ data, selected }: NodeProps) {
  const { label, resource_hash } = data as ConvertStatusNodeData

  const [result, setResult] = useState<ConvertedResource | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!resource_hash) {
      setResult(null)
      setError(null)
      return
    }

    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)
    setResult(null)

    queryConvertedResource(resource_hash)
      .then((item) => {
        setResult(item)
        if (!item) setError('No conversion record found.')
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name !== 'AbortError') setError(e.message)
      })
      .finally(() => setLoading(false))

    return () => abortRef.current?.abort()
  }, [resource_hash])

  const status = result?.status ? String(result.status) : null
  const statusStyle = status ? getStatusStyle(status) : null

  return (
    <div
      style={{
        background: 'rgba(239,68,68,0.06)', // light red = datasette-backed node
        border: `2px solid ${selected ? 'var(--node-selected)' : '#f59e0b'}`,
        borderRadius: 8,
        padding: '10px 14px',
        width: 220,
        boxShadow: selected ? '0 0 0 3px rgba(59,130,246,0.2)' : '0 1px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <strong style={{ fontSize: 13, color: 'var(--text)' }}>{label}</strong>
        <ApiInfo url={API_ENDPOINT} source="datasette" />
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

      {status && statusStyle && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span
            style={{
              display: 'inline-block',
              fontSize: 12,
              fontWeight: 600,
              background: statusStyle.bg,
              color: statusStyle.text,
              border: `1px solid ${statusStyle.border}`,
              borderRadius: 5,
              padding: '3px 10px',
            }}
          >
            {status}
          </span>
          {result?.elapsed && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {parseFloat(result.elapsed).toFixed(2)}s
            </span>
          )}
        </div>
      )}

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
