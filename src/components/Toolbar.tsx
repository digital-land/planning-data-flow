// Add new node types here as the graph grows
const LEGEND = [
  { color: '#10b981', label: 'Data Source' },
  { color: '#f59e0b', label: 'Process' },
  { color: '#8b5cf6', label: 'Data Store' },
  { color: '#ef4444', label: 'Output' }
]

export default function Toolbar() {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '10px 16px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}
    >
      <strong style={{ fontSize: 15, color: 'var(--text)' }}>Planning Data Flow Map</strong>

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
