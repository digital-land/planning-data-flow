import { useEffect, useRef, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { getIssueTypeSummary } from '../../services/pipelineInternalApi'
import type { IssueTypeSummary } from '../../services/pipelineInternalApi'
import ApiInfo from '../ApiInfo'

const API_ENDPOINT = '/performance/issue_type_summary?resource={resource}'

export type TaskSummaryNodeData = {
  label: string
  resource_hash?: string
}

const SEVERITY_COLOUR: Record<string, { bg: string; text: string }> = {
  error:   { bg: 'rgba(239,68,68,0.12)',   text: '#ef4444' },
  warning: { bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b' },
  info:    { bg: 'rgba(59,130,246,0.12)',  text: '#3b82f6' },
}

export default function TaskSummaryNode({ data, selected }: NodeProps) {
  const { label, resource_hash } = data as TaskSummaryNodeData

  const [issues, setIssues] = useState<IssueTypeSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!resource_hash) {
      setIssues([])
      setError(null)
      return
    }

    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)
    setIssues([])

    getIssueTypeSummary({ resource: resource_hash })
      .then(({ items }) => {
        setIssues(items)
        if (!items.length) setError('No issues found for this resource.')
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name !== 'AbortError') setError(e.message)
      })
      .finally(() => setLoading(false))

    return () => abortRef.current?.abort()
  }, [resource_hash])

  return (
    <div
      style={{
        background: 'var(--node-bg)',
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
          {issues.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
              {issues.length} type{issues.length !== 1 ? 's' : ''}
            </span>
          )}
          <ApiInfo url={API_ENDPOINT} source="pipeline" />
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

      {issues.length > 0 && (
        <div className="nodrag nowheel" style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
          {issues.map((issue, i) => {
            const severity = issue.severity ?? 'info'
            const colours = SEVERITY_COLOUR[severity] ?? SEVERITY_COLOUR.info
            return (
              <div
                key={i}
                style={{
                  background: colours.bg,
                  border: `1px solid ${colours.text}`,
                  borderRadius: 5,
                  padding: '5px 8px',
                  fontSize: 11,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{issue.issue_type}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: colours.text, whiteSpace: 'nowrap' }}>
                    {severity}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                  <span>field: <span style={{ fontFamily: 'ui-monospace, monospace', color: 'var(--text)' }}>{issue.field ?? '—'}</span></span>
                  <span>{issue.count_issues} occurrence{(issue.count_issues ?? 0) !== 1 ? 's' : ''}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Handle type="target" id="top" position={Position.Top} />
      <Handle type="source" position={Position.Right} />
      <Handle type="source" id="bottom" position={Position.Bottom} />
    </div>
  )
}
