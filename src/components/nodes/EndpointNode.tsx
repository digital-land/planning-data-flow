import { useState, useEffect, useRef } from 'react'
import { Handle, Position, useReactFlow } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { getDatasetResourceMapping } from '../../services/pipelineInternalApi'
import type { DatasetResourceMapping } from '../../services/pipelineInternalApi'
import ApiInfo from '../ApiInfo'
import { useEndpointUrl } from '../../context/EndpointUrlContext'

const API_ENDPOINT = '/performance/dataset_resource_mapping?endpoint_url=…'

export type EndpointData = {
  label: string
  endpoint_url?: string
  endpoint_hash?: string
  resource_hash?: string
  dataset?: string
  organisation?: string
}

const OMIT_FIELDS = new Set(['__index_level_0__', 'latest_log_entry_date'])

const FIELD_LABELS: Record<string, string> = {
  organisation: 'Organisation',
  organisation_name: 'Organisation name',
  cohort: 'Cohort',
  dataset: 'Dataset',
  collection: 'Collection',
  pipeline: 'Pipeline',
  endpoint: 'Endpoint hash',
  endpoint_url: 'Endpoint URL',
  resource: 'Resource hash',
  resource_start_date: 'Resource start',
  resource_end_date: 'Resource end',
  mapping_field: 'Mapping fields',
  non_mapping_field: 'Non-mapping fields',
}

export default function EndpointNode({ id, data, selected }: NodeProps) {
  const { label } = data as EndpointData
  const { updateNodeData } = useReactFlow()
  const { endpointUrl, setEndpointUrl } = useEndpointUrl()

  const [result, setResult] = useState<DatasetResourceMapping | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Write the current URL into node data so connected nodes can read it
  useEffect(() => {
    updateNodeData(id, { endpoint_url: endpointUrl.trim() || undefined })
  }, [id, endpointUrl, updateNodeData])

  useEffect(() => {
    if (!endpointUrl.trim()) {
      setResult(null)
      setError(null)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)
      setResult(null)
      try {
        const response = await getDatasetResourceMapping({ endpoint_url: endpointUrl.trim() })
        const item = response.items[0] ?? null
        setResult(item)
        if (!item) {
          setError('No results found for this endpoint URL.')
        } else {
          updateNodeData(id, {
            endpoint_url: endpointUrl.trim(),
            endpoint_hash: item.endpoint as string | undefined,
            resource_hash: item.resource as string | undefined,
            dataset: item.dataset as string | undefined,
            organisation: item.organisation as string | undefined,
          })
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Request failed')
      } finally {
        setLoading(false)
      }
    }, 600)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [endpointUrl])

  return (
    <div
      style={{
        background: 'var(--node-bg)',
        border: `2px solid ${selected ? 'var(--node-selected)' : '#10b981'}`,
        borderRadius: 8,
        padding: '10px 14px',
        width: 320,
        boxShadow: selected ? '0 0 0 3px rgba(59,130,246,0.2)' : '0 1px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <strong style={{ fontSize: 13, color: 'var(--text)' }}>{label}</strong>
        <ApiInfo url={API_ENDPOINT} source="pipeline" />
      </div>

      <div style={{ position: 'relative' }}>
        <input
          className="nodrag"
          type="text"
          placeholder="Paste endpoint URL…"
          value={endpointUrl}
          onChange={(e) => setEndpointUrl(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '6px 30px 6px 8px',
            fontSize: 11,
            border: '1px solid var(--node-border)',
            borderRadius: 5,
            background: 'var(--bg)',
            color: 'var(--text)',
            outline: 'none',
          }}
        />
        {loading && (
          <span
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 13,
              animation: 'spin 0.8s linear infinite',
              display: 'inline-block',
            }}
          >
            ⏳
          </span>
        )}
      </div>

      {error && (
        <p style={{ margin: '6px 0 0', fontSize: 11, color: '#ef4444' }}>{error}</p>
      )}

      {result && (
        <table style={{ marginTop: 10, width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <tbody>
            {Object.entries(result)
              .filter(([key]) => !OMIT_FIELDS.has(key))
              .map(([key, value]) => (
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
                    {FIELD_LABELS[key] ?? key}
                  </td>
                  <td style={{ padding: '3px 0', color: 'var(--text)', wordBreak: 'break-all' }}>
                    {String(value ?? '—')}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <Handle type="source" id="bottom" position={Position.Bottom} />

      <style>{`
        @keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }
      `}</style>
    </div>
  )
}
