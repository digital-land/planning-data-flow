import { useEffect, useRef, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { getEndpointDatasetSummary } from '../../services/pipelineInternalApi'
import type { EndpointDatasetSummary } from '../../services/pipelineInternalApi'
import ApiInfo from '../ApiInfo'

const API_ENDPOINT = '/performance/endpoint_dataset_summary?endpoint_url=…'

export type EndpointHealthData = {
  label: string
  endpoint_url?: string
}

const SHOW_FIELDS: { key: string; label: string }[] = [
  { key: 'resource', label: 'Resource hash' },
  { key: 'latest_status', label: 'Latest status' },
  { key: 'latest_exception', label: 'Latest exception' },
  { key: 'latest_log_entry_date', label: 'Latest log entry' },
]

const STATUS_COLOR: Record<string, string> = {
  '200': '#10b981',
  '404': '#ef4444',
  '403': '#ef4444',
  '500': '#ef4444',
}

export default function EndpointHealthNode({ data, selected }: NodeProps) {
  const { label, endpoint_url } = data as EndpointHealthData

  const [result, setResult] = useState<EndpointDatasetSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!endpoint_url) {
      setResult(null)
      setError(null)
      return
    }

    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)
    setResult(null)

    getEndpointDatasetSummary({ endpoint_url })
      .then((response) => {
        setResult(response.items[0] ?? null)
        if (!response.items[0]) setError('No health data found.')
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name !== 'AbortError') setError(e.message)
      })
      .finally(() => setLoading(false))

    return () => abortRef.current?.abort()
  }, [endpoint_url])

  const status = result?.latest_status ? String(result.latest_status) : null
  const statusColor = status ? (STATUS_COLOR[status] ?? '#f59e0b') : 'var(--text-muted)'

  return (
    <div
      style={{
        background: 'var(--node-bg)',
        border: `2px solid ${selected ? 'var(--node-selected)' : '#3b82f6'}`,
        borderRadius: 8,
        padding: '10px 14px',
        width: 280,
        boxShadow: selected ? '0 0 0 3px rgba(59,130,246,0.2)' : '0 1px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <strong style={{ fontSize: 13, color: 'var(--text)' }}>{label}</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {status && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: statusColor,
                background: `${statusColor}1a`,
                padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              {status}
            </span>
          )}
          <ApiInfo url={API_ENDPOINT} source="pipeline" />
        </div>
      </div>

      {!endpoint_url && (
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
          Waiting for endpoint URL…
        </p>
      )}

      {loading && (
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Loading…</p>
      )}

      {error && (
        <p style={{ margin: 0, fontSize: 11, color: '#ef4444' }}>{error}</p>
      )}

      {result && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <tbody>
            {SHOW_FIELDS.map(({ key, label: fieldLabel }) => (
              <tr key={key}>
                <td
                  style={{
                    padding: '3px 6px 3px 0',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    verticalAlign: 'top',
                    fontWeight: 500,
                  }}
                >
                  {fieldLabel}
                </td>
                <td style={{ padding: '3px 0', color: 'var(--text)', wordBreak: 'break-all' }}>
                  {String((result as Record<string, unknown>)[key] ?? '—')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Handle type="target" id="top" position={Position.Top} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
