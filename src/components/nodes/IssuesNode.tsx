import { useEffect, useRef, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { queryIssues } from '../../services/datasette'
import type { Issue } from '../../services/datasette'
import ApiInfo from '../ApiInfo'

const API_ENDPOINT = '/{dataset}/issue?_sort=rowid&resource__exact={resource}'

export type IssuesNodeData = {
  label: string
  resource_hash?: string
  dataset?: string
}

export default function IssuesNode({ data, selected }: NodeProps) {
  const { label, resource_hash, dataset } = data as IssuesNodeData

  const [issues, setIssues] = useState<Issue[]>([])
  const [total, setTotal] = useState(0)
  const [truncated, setTruncated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!resource_hash || !dataset) {
      setIssues([])
      setError(null)
      return
    }

    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)
    setIssues([])

    queryIssues(resource_hash, dataset)
      .then(({ items, truncated: t, total: n }) => {
        setIssues(items)
        setTruncated(t)
        setTotal(n)
        if (!items.length) setError('No issues found for this resource.')
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name !== 'AbortError') setError(e.message)
      })
      .finally(() => setLoading(false))

    return () => abortRef.current?.abort()
  }, [resource_hash, dataset])

  return (
    <div
      style={{
        background: 'rgba(239,68,68,0.06)',
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
              {total}{truncated ? '+' : ''} issues
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

      {issues.length > 0 && (
        <div className="nodrag nowheel" style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 600, overflowY: 'auto' }}>
          {issues.map((issue, i) => (
            <div
              key={i}
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '4px 6px',
                fontSize: 11,
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {Object.entries(issue).map(([key, value]) => (
                    <tr key={key}>
                      <td style={{ padding: '1px 6px 1px 0', color: 'var(--text-muted)', whiteSpace: 'nowrap', verticalAlign: 'top', fontWeight: 500, fontSize: 10 }}>
                        {key}
                      </td>
                      <td style={{ padding: '1px 0', color: value === '' || value === null ? 'var(--text-muted)' : 'var(--text)', wordBreak: 'break-all', fontSize: 10, fontStyle: value === '' || value === null ? 'italic' : 'normal' }}>
                        {value === '' ? 'empty' : value === null ? 'null' : String(value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      <Handle type="target" id="top" position={Position.Top} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
