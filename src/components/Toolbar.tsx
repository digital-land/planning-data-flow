import { useEndpointUrl } from '../context/EndpointUrlContext'

const LEGEND = [
  { color: '#10b981', label: 'Data Source' },
  { color: '#f59e0b', label: 'Process' },
  { color: '#8b5cf6', label: 'Data Store' },
  { color: '#ef4444', label: 'Output' }
]

const MODE_TABS = [
  { id: 'endpoint', label: 'Endpoint search', disabled: false },
  { id: 'entity',   label: 'Entity search',   disabled: true  },
]

export default function Toolbar() {
  const { endpointUrl, setEndpointUrl } = useEndpointUrl()

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '10px 16px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}
    >
      <strong style={{ fontSize: 15, color: 'var(--text)', whiteSpace: 'nowrap' }}>Planning Data Flow Map</strong>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: 3, flexShrink: 0 }}>
        {MODE_TABS.map((tab) => (
          <button
            key={tab.id}
            disabled={tab.disabled}
            style={{
              padding: '4px 10px',
              fontSize: 12,
              borderRadius: 4,
              border: 'none',
              cursor: tab.disabled ? 'not-allowed' : 'default',
              background: !tab.disabled ? 'var(--surface)' : 'transparent',
              color: tab.disabled ? 'var(--text-muted)' : 'var(--text)',
              fontWeight: !tab.disabled ? 600 : 400,
              boxShadow: !tab.disabled ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              opacity: tab.disabled ? 0.5 : 1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Paste endpoint URL…"
        value={endpointUrl}
        onChange={(e) => setEndpointUrl(e.target.value)}
        style={{
          flex: 1,
          maxWidth: 520,
          margin: '0 auto',
          padding: '6px 10px',
          fontSize: 12,
          border: '1px solid var(--node-border)',
          borderRadius: 5,
          background: 'var(--bg)',
          color: 'var(--text)',
          outline: 'none',
        }}
      />

      <div style={{ display: 'flex', gap: 16, marginLeft: 'auto' }}>
        {LEGEND.map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: color,
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
      </div>
    </header>
  )
}
