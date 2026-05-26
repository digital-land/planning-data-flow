import type { Node, Edge } from '@xyflow/react'

// Node width is 340px; COL stride of 400px gives a 60px gap between pipeline nodes.
const COL = 400
const TOP = 100

export const initialNodes: Node[] = [
  {
    id: 'endpoint-1',
    type: 'endpoint',
    position: { x: 0, y: TOP - 350 },
    data: { label: 'Endpoint' },
  },
  {
    id: 'endpoint-health-1',
    type: 'endpointHealth',
    position: { x: 0, y: TOP + 280 },
    data: { label: 'Endpoint Health' },
  },
  {
    id: 'resource-1',
    type: 'resource',
    position: { x: 0, y: TOP + 560 },
    data: { label: 'Resources' },
  },
  {
    id: 'process-collect',
    type: 'process',
    position: { x: COL * 1, y: TOP },
    data: { label: 'Collect' },
  },
  {
    id: 'task-summary-1',
    type: 'taskSummary',
    position: { x: COL * 4, y: TOP + 280 },
    data: { label: 'Task Summary' },
  },
  {
    id: 'issues-1',
    type: 'issues',
    position: { x: COL * 4, y: TOP + 720 },
    data: { label: 'Issues Log' },
  },
  {
    id: 'column-field-1',
    type: 'columnField',
    position: { x: COL * 4 + 360, y: TOP + 720 },
    data: { label: 'Column Field Log' },
  },
  {
    id: 'collect-log-1',
    type: 'collectLog',
    position: { x: COL * 2, y: TOP },
    data: { label: 'Collect Log' },
  },
  {
    id: 'convert-status-1',
    type: 'convertStatus',
    position: { x: COL * 3, y: TOP },
    data: { label: 'Convert Status' },
  },
  {
    id: 'process-transform',
    type: 'process',
    position: { x: COL * 4, y: TOP },
    data: { label: 'Transform' },
  },
  {
    id: 'facts-1',
    type: 'facts',
    position: { x: COL * 5, y: TOP },
    data: { label: 'Facts' },
  },
  {
    id: 'fact-1',
    type: 'fact',
    position: { x: COL * 6, y: TOP },
    data: { label: 'Fact' },
  },
  {
    id: 'entity-1',
    type: 'entity',
    position: { x: COL * 7, y: TOP },
    data: { label: 'Entity' },
  },
]

export const initialEdges: Edge[] = [
  { id: 'e-endpoint-health', source: 'endpoint-1', sourceHandle: 'bottom', target: 'endpoint-health-1', targetHandle: 'top' },
  { id: 'e-endpoint-resource', source: 'endpoint-1', target: 'resource-1', animated: true },
  { id: 'e-resource-collect', source: 'resource-1', target: 'process-collect', animated: true },
  { id: 'e-collect-log', source: 'process-collect', target: 'collect-log-1', animated: true },
  { id: 'e-transform-task-summary', source: 'process-transform', sourceHandle: 'bottom', target: 'task-summary-1', targetHandle: 'top', animated: true },
  { id: 'e-task-summary-issues', source: 'task-summary-1', sourceHandle: 'bottom', target: 'issues-1', targetHandle: 'top', animated: true },
  { id: 'e-task-summary-column-field', source: 'task-summary-1', sourceHandle: 'bottom', target: 'column-field-1', targetHandle: 'top', animated: true },
  { id: 'e-collect-log-status', source: 'collect-log-1', target: 'convert-status-1', animated: true },
  { id: 'e-convert-transform', source: 'convert-status-1', target: 'process-transform', animated: true },
  { id: 'e-transform-facts', source: 'process-transform', target: 'facts-1', animated: true },
  { id: 'e-facts-fact', source: 'facts-1', target: 'fact-1', animated: true },
  { id: 'e-fact-entity', source: 'fact-1', target: 'entity-1', animated: true },
]
