import { useState } from 'react'

export type ApiSource = 'datasette' | 'pipeline' | 'platform'

const SOURCE_LABEL: Record<ApiSource, string> = {
  datasette: 'Datasette',
  pipeline: 'Pipeline Internal API',
  platform: 'Planning Data Platform API',
}

const SOURCE_COLOR: Record<ApiSource, { bg: string; text: string }> = {
  datasette: { bg: 'rgba(239,68,68,0.12)', text: '#b91c1c' },
  pipeline:  { bg: 'rgba(59,130,246,0.12)', text: '#1d4ed8' },
  platform:  { bg: 'rgba(16,185,129,0.12)', text: '#065f46' },
}

type Props = {
  url: string
  source: ApiSource
}

export default function ApiInfo({ url, source }: Props) {
  const [open, setOpen] = useState(false)
  const { bg, text } = SOURCE_COLOR[source]

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="nodrag"
        onClick={() => setOpen((v) => !v)}
        title="API endpoint"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          fontSize: 13,
          color: 'var(--text-muted)',
          lineHeight: 1,
        }}
      >
        ⓘ
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '6px 8px',
            fontSize: 10,
            color: 'var(--text)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            width: 260,
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-muted)' }}>API endpoint</p>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                background: bg,
                color: text,
                padding: '2px 5px',
                borderRadius: 3,
                whiteSpace: 'nowrap',
              }}
            >
              {SOURCE_LABEL[source]}
            </span>
          </div>
          <code style={{ fontSize: 10 }}>{url}</code>
        </div>
      )}
    </div>
  )
}
