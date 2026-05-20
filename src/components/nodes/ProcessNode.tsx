import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'

export type ProcessData = {
  label: string
}

export default function ProcessNode({ data, selected }: NodeProps) {
  const { label } = data as ProcessData

  return (
    <div
      style={{
        background: 'var(--node-bg)',
        border: `2px solid ${selected ? 'var(--node-selected)' : '#f59e0b'}`,
        borderRadius: 8,
        padding: '10px 14px',
        minWidth: 160,
        boxShadow: selected ? '0 0 0 3px rgba(59,130,246,0.2)' : '0 1px 4px rgba(0,0,0,0.1)',
      }}
    >
      <strong style={{ fontSize: 13, color: 'var(--text)' }}>{label}</strong>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <Handle type="source" id="bottom" position={Position.Bottom} />
    </div>
  )
}
