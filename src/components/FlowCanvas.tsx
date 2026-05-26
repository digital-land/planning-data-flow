import { useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useNodes,
  useEdges,
  addEdge,
} from '@xyflow/react'
import type { Connection } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { initialNodes, initialEdges } from '../data/initialGraph'
import EndpointNode from './nodes/EndpointNode'
import EndpointHealthNode from './nodes/EndpointHealthNode'
import ProcessNode from './nodes/ProcessNode'
import ResourceNode from './nodes/ResourceNode'
import CollectLogNode from './nodes/CollectLogNode'
import ConvertStatusNode from './nodes/ConvertStatusNode'
import FactsNode from './nodes/FactsNode'
import FactNode from './nodes/FactNode'
import EntityNode from './nodes/EntityNode'
import IssuesNode from './nodes/IssuesNode'
import TaskSummaryNode from './nodes/TaskSummaryNode'
import ColumnFieldNode from './nodes/ColumnFieldNode'

const nodeTypes = {
  endpoint: EndpointNode,
  endpointHealth: EndpointHealthNode,
  process: ProcessNode,
  resource: ResourceNode,
  collectLog: CollectLogNode,
  convertStatus: ConvertStatusNode,
  facts: FactsNode,
  fact: FactNode,
  entity: EntityNode,
  issues: IssuesNode,
  taskSummary: TaskSummaryNode,
  columnField: ColumnFieldNode,
}

/**
 * Two propagation rules:
 * 1. Endpoint-specific: push endpoint_url → endpointHealth, endpoint_hash+resource_hash → resource
 * 2. Generic: any node carrying resource_hash propagates it one hop downstream.
 *    This lets resource_hash flow through process nodes to reach collectLog etc.
 *    Equality guards on every update prevent infinite render loops.
 */
function GraphSyncer() {
  const nodes = useNodes()
  const edges = useEdges()
  const { updateNodeData } = useReactFlow()

  useEffect(() => {
    // 1. Endpoint-specific propagation
    for (const source of nodes.filter((n) => n.type === 'endpoint')) {
      const { endpoint_url, endpoint_hash, resource_hash } = source.data as {
        endpoint_url?: string
        endpoint_hash?: string
        resource_hash?: string
      }

      for (const edge of edges.filter((e) => e.source === source.id)) {
        const target = nodes.find((n) => n.id === edge.target)
        if (!target) continue

        if (target.type === 'endpointHealth') {
          const current = (target.data as { endpoint_url?: string }).endpoint_url
          if (current !== endpoint_url) updateNodeData(target.id, { endpoint_url })
        }

        if (target.type === 'resource') {
          const d = target.data as { endpoint_hash?: string; resource_hash?: string }
          if (d.endpoint_hash !== endpoint_hash || d.resource_hash !== resource_hash) {
            updateNodeData(target.id, { endpoint_hash, resource_hash })
          }
        }
      }
    }

    // 2. Generic: propagate resource_hash, dataset, and fact_hashes one hop downstream.
    //    selected_fact is only propagated when the source node explicitly has it set,
    //    so upstream nodes (which have selected_fact=undefined) never overwrite a
    //    selection the user made on a downstream node.
    for (const source of nodes) {
      const d = source.data as { resource_hash?: string; dataset?: string; fact_hashes?: string[]; selected_fact?: string; entity?: number }
      const { resource_hash, dataset, fact_hashes, selected_fact, entity } = d
      if (!resource_hash && !dataset && !fact_hashes?.length && !selected_fact && entity == null) continue

      for (const edge of edges.filter((e) => e.source === source.id)) {
        const target = nodes.find((n) => n.id === edge.target)
        if (!target) continue
        const td = target.data as { resource_hash?: string; dataset?: string; fact_hashes?: string[]; selected_fact?: string; entity?: number }
        const hashesChanged = JSON.stringify(td.fact_hashes) !== JSON.stringify(fact_hashes)
        const baseChanged = td.resource_hash !== resource_hash || td.dataset !== dataset || hashesChanged
        const selectedFactChanged = selected_fact !== undefined && td.selected_fact !== selected_fact
        // Fact nodes own the entity value — always propagate it (including undefined to clear).
        // Other node types use "only if set" to avoid overwriting a downstream entity.
        const propagateEntity = source.type === 'fact'
        const entityChanged = propagateEntity ? td.entity !== entity : (entity != null && td.entity !== entity)

        if (baseChanged || selectedFactChanged || entityChanged) {
          const updates: Record<string, unknown> = { resource_hash, dataset, fact_hashes }
          if (selected_fact !== undefined) updates.selected_fact = selected_fact
          if (propagateEntity) updates.entity = entity
          else if (entity != null) updates.entity = entity
          updateNodeData(target.id, updates)
        }
      }
    }
  }, [nodes, edges, updateNodeData])

  return null
}

export default function FlowCanvas() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  )

  return (
    <div style={{ flex: 1 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <GraphSyncer />
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
      </ReactFlow>
    </div>
  )
}
