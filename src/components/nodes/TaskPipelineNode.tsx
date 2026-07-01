import { useEffect, useRef, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { getTasks } from '../../services/planningDataApi'
import type { Task } from '../../services/planningDataApi'
import ApiInfo from '../ApiInfo'

const API_ENDPOINT = 'https://www.planning.data.gov.uk/task/?organisation={organisation}&dataset={dataset}'

export type TaskPipelineNodeData = {
  label: string
  organisation?: string
  dataset?: string
  endpoint_hash?: string
  resource_hash?: string
}

const SEVERITY_COLOUR: Record<string, { bg: string; text: string }> = {
  error:   { bg: 'rgba(239,68,68,0.12)',   text: '#ef4444' },
  warning: { bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b' },
  info:    { bg: 'rgba(59,130,246,0.12)',  text: '#3b82f6' },
}

export default function TaskPipelineNode({ data, selected }: NodeProps) {
  const { label, organisation, dataset, endpoint_hash, resource_hash } = data as TaskPipelineNodeData

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const ready = !!(organisation && dataset)

  useEffect(() => {
    if (!ready) {
      setTasks([])
      setError(null)
      return
    }

    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)
    setTasks([])

    getTasks({ organisation: organisation!, dataset: dataset! })
      .then((res) => {
        setTasks(res.tasks ?? [])
        if (!(res.tasks ?? []).length) setError('No tasks found for this organisation / dataset.')
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name !== 'AbortError') setError(e.message)
      })
      .finally(() => setLoading(false))

    return () => abortRef.current?.abort()
  }, [organisation, dataset, ready])

  // Tasks that share the endpoint hash but have a different resource hash than what
  // the Endpoint node resolved — these indicate a stale or unexpected resource.
  const mismatchedTasks = tasks.filter(
    (t) => endpoint_hash && t.endpoint === endpoint_hash && resource_hash && t.resource !== resource_hash,
  )

  return (
    <div
      style={{
        background: 'var(--node-bg)',
        border: `2px solid ${selected ? 'var(--node-selected)' : '#ec4899'}`,
        borderRadius: 8,
        padding: '10px 14px',
        width: 360,
        boxShadow: selected ? '0 0 0 3px rgba(59,130,246,0.2)' : '0 1px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <strong style={{ fontSize: 13, color: 'var(--text)' }}>{label}</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {tasks.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </span>
          )}
          <ApiInfo url={API_ENDPOINT} source="platform" />
        </div>
      </div>

      {mismatchedTasks.length > 0 && (
        <div
          style={{
            marginBottom: 8,
            padding: '6px 8px',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid #ef4444',
            borderRadius: 5,
            fontSize: 11,
            color: '#ef4444',
            fontWeight: 600,
          }}
        >
          ⚠ {mismatchedTasks.length} task{mismatchedTasks.length !== 1 ? 's' : ''} reference this endpoint
          but a different resource hash — the resource may have changed since these tasks were created.
        </div>
      )}

      {!ready && (
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
          Waiting for organisation and dataset…
        </p>
      )}

      {loading && (
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Loading…</p>
      )}

      {error && !loading && (
        <p style={{ margin: 0, fontSize: 11, color: '#ef4444' }}>{error}</p>
      )}

      {tasks.length > 0 && (
        <div className="nodrag nowheel" style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 260, overflowY: 'auto' }}>
          {tasks.map((task) => {
            const severity = task.severity ?? 'info'
            const colours = SEVERITY_COLOUR[severity] ?? SEVERITY_COLOUR.info
            const isResourceMismatch =
              endpoint_hash && task.endpoint === endpoint_hash && resource_hash && task.resource !== resource_hash
            return (
              <div
                key={task.reference}
                style={{
                  background: colours.bg,
                  border: `1px solid ${isResourceMismatch ? '#ef4444' : colours.text}`,
                  borderRadius: 5,
                  padding: '5px 8px',
                  fontSize: 11,
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{task.details.issue_type}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: colours.text, whiteSpace: 'nowrap' }}>
                    {severity}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>
                  <span>field: <span style={{ fontFamily: 'ui-monospace, monospace', color: 'var(--text)' }}>{task.details.field || '—'}</span></span>
                  <span>{task.details.count} occurrence{task.details.count !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'ui-monospace, monospace', color: 'var(--text-muted)' }}>
                    {task.resource.slice(0, 12)}…
                  </span>
                  {isResourceMismatch && (
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>resource mismatch</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Handle type="target" id="right" position={Position.Right} />
    </div>
  )
}
