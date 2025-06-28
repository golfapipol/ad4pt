"use client"

import { useCallback, useEffect, useState } from "react"
import ReactFlow, {
  type Node,
  type Edge,
  addEdge,
  Background,
  type Connection,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from "reactflow"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trash2, Menu, X, Workflow, User, Globe, Settings, Cog, Database, Shield } from "lucide-react"
import { ApiNode } from "./nodes/ApiNode"
import { BusinessFlowNode } from "./nodes/BusinessFlowNode"
import { ControllerNode } from "./nodes/ControllerNode"
import { CustomerActionNode } from "./nodes/CustomerActionNode"
import { GatewayNode } from "./nodes/GatewayNode"
import { RepositoryNode } from "./nodes/RepositoryNode"
import { ServiceNode } from "./nodes/ServiceNode"

// Suppress ResizeObserver error
const suppressResizeObserverError = () => {
  const handleError = (e: ErrorEvent) => {
    if (e.message === "ResizeObserver loop completed with undelivered notifications.") {
      e.stopImmediatePropagation()
    }
  }

  window.addEventListener("error", handleError)

  return () => {
    window.removeEventListener("error", handleError)
  }
}

// Node creation tools
const NODE_TOOLS = [
  { type: "businessFlow", icon: Workflow, label: "Business Flow", color: "bg-blue-100 text-blue-700" },
  { type: "customerAction", icon: User, label: "Customer Action", color: "bg-green-100 text-green-700" },
  { type: "api", icon: Globe, label: "API", color: "bg-purple-100 text-purple-700" },
  { type: "controller", icon: Settings, label: "Controller", color: "bg-orange-100 text-orange-700" },
  { type: "service", icon: Cog, label: "Service", color: "bg-red-100 text-red-700" },
  { type: "repository", icon: Database, label: "Repository", color: "bg-yellow-100 text-yellow-700" },
  { type: "gateway", icon: Shield, label: "Gateway", color: "bg-indigo-100 text-indigo-700" },
]


const nodeTypes = {
  businessFlow: BusinessFlowNode,
  customerAction: CustomerActionNode,
  api: ApiNode,
  controller: ControllerNode,
  service: ServiceNode,
  repository: RepositoryNode,
  gateway: GatewayNode,
}

export default function InteractiveBoard() {
  // Suppress ResizeObserver errors globally
  useEffect(() => {
    const cleanup = suppressResizeObserverError()
    return () => {
      cleanup()
    }
  }, [])

  return (
    <div className="w-full h-screen bg-gray-50">
      <ReactFlowProvider>
        <BoardContent />
      </ReactFlowProvider>
    </div>
  )
}

function BoardContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  const createNode = useCallback(
    (type: string) => {
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
        data: {
          nodeType: type,
          label: NODE_TOOLS.find((tool) => tool.type === type)?.label || type,
          onUpdate: (id: string, updates: any) => {
            setNodes((nodes) =>
              nodes.map((node) => (node.id === id ? { ...node, data: { ...node.data, ...updates } } : node)),
            )
          },
        },
      }
      setNodes((nodes) => [...nodes, newNode])
    },
    [setNodes],
  )

  const deleteSelectedNodes = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => !node.selected))
    setEdges((edges) =>
      edges.filter((edge) => {
        const sourceSelected = nodes.find((n) => n.id === edge.source)?.selected
        const targetSelected = nodes.find((n) => n.id === edge.target)?.selected
        return !sourceSelected && !targetSelected
      }),
    )
  }, [setNodes, setEdges, nodes])

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div
        className={`${sidebarCollapsed ? "w-16" : "w-80"} bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden flex-shrink-0`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            {!sidebarCollapsed && <h2 className="text-lg font-semibold">Interactive Board</h2>}
            <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2">
              {sidebarCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </Button>
          </div>

          {!sidebarCollapsed && (
            <>
              {/* Node Tools */}
              <Card className="p-4 mb-4">
                <h3 className="font-medium mb-3">Add Nodes</h3>
                <div className="grid grid-cols-1 gap-2">
                  {NODE_TOOLS.map((tool) => (
                    <Button
                      key={tool.type}
                      variant="outline"
                      size="sm"
                      onClick={() => createNode(tool.type)}
                      className={`${tool.color} border-current justify-start`}
                    >
                      <tool.icon className="w-4 h-4 mr-2" />
                      {tool.label}
                    </Button>
                  ))}
                </div>
              </Card>

              {/* Actions */}
              <Card className="p-4">
                <h3 className="font-medium mb-3">Actions</h3>
                <div className="space-y-2">
                  <Button variant="destructive" size="sm" onClick={deleteSelectedNodes} className="w-full">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                </div>
              </Card>

              {/* Stats */}
              <div className="mt-4 text-xs text-gray-500">
                <p>Total Nodes: {nodes.length}</p>
                <p>Total Edges: {edges.length}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Board */}
      <div className="flex-1 relative min-w-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          minZoom={0.1}
          maxZoom={2}
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap
            nodeStrokeColor={(n) => {
              const nodeType = n.data?.nodeType
              const config = NODE_TOOLS.find((tool) => tool.type === nodeType)
              return config ? "#374151" : "#6b7280"
            }}
            nodeColor={(n) => {
              const nodeType = n.data?.nodeType
              const config = NODE_TOOLS.find((tool) => tool.type === nodeType)
              if (!config) return "#f3f4f6"

              if (config.color.includes("blue")) return "#dbeafe"
              if (config.color.includes("green")) return "#d1fae5"
              if (config.color.includes("purple")) return "#e9d5ff"
              if (config.color.includes("orange")) return "#fed7aa"
              if (config.color.includes("red")) return "#fecaca"
              if (config.color.includes("yellow")) return "#fef3c7"
              if (config.color.includes("indigo")) return "#e0e7ff"
              return "#f3f4f6"
            }}
            position="top-right"
          />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  )
}
