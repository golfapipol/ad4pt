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
import { Trash2, Menu, X, Workflow, User, Globe, Cog, Database, Shield } from "lucide-react"
import { ApiNode } from "./nodes/ApiNode"
import { BusinessFlowNode } from "./nodes/BusinessFlowNode"
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
  { type: "service", icon: Cog, label: "Service", color: "bg-red-100 text-red-700" },
  { type: "repository", icon: Database, label: "Repository", color: "bg-yellow-100 text-yellow-700" },
  { type: "gateway", icon: Shield, label: "Gateway", color: "bg-indigo-100 text-indigo-700" },
]


const nodeTypes = {
  businessFlow: BusinessFlowNode,
  customerAction: CustomerActionNode,
  api: ApiNode,
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

  const handleNodeUpdate = useCallback(
    (id: string, updates: any) => {
      setNodes((nds) =>
        nds.map((node) => (node.id === id ? { ...node, data: { ...node.data, ...updates } } : node)),
      )
    },
    [setNodes],
  )

  const onConnect = useCallback(
    (connection: Edge | Connection) => {
      const sourceNode = nodes.find((node) => node.id === connection.source)
      const targetNode = nodes.find((node) => node.id === connection.target)

      if (!sourceNode || !targetNode) return

      const sourceType = sourceNode.type
      const targetType = targetNode.type

      const connectionRules: Record<string, string[]> = {
        businessFlow: ["customerAction"],
        customerAction: ["api"],
        api: ["service", "repository"],
        service: ["repository", "gateway"],
      }

      if (connectionRules[sourceType] && connectionRules[sourceType].includes(targetType)) {
        setEdges((eds) => addEdge(connection, eds))
      } else if (sourceType === targetType) {
        setEdges((eds) => addEdge(connection, eds))
      }
    },
    [nodes, setEdges],
  )

  const createNode = useCallback(
    (type: string) => {
      const basePayload = {
        label: NODE_TOOLS.find((tool) => tool.type === type)?.label || type,
      }

      let specificPayload = {}
      switch (type) {
        case "api":
          specificPayload = {
            url: "/api/v1/",
            method: "GET",
            requestHeaders: [{ key: "Content-Type", value: "application/json" }],
            requestBody: JSON.stringify({ data: "example" }, null, 2),
            responseStatus: "200",
            responseHeaders: [{ key: "Content-Type", value: "application/json" }],
            responseBody: JSON.stringify({ message: "Success" }, null, 2),
          }
          break
        case "service":
          specificPayload = {
            serviceName: "NewService",
            description: "This service handles business logic.",
            dependencies: [],
          }
          break
        case "repository":
          specificPayload = {
            databaseType: "PostgreSQL",
            schema: "schema",
            tableName: "users",
            query: "SELECT * FROM users;",
          }
          break
        case "businessFlow":
          specificPayload = {
            description: "This flow outlines a core business process.",
          }
          break
        case "customerAction":
          specificPayload = {
            action: "User clicks a button",
            description: "A customer performs an action.",
          }
          break
        case "gateway":
          specificPayload = {
            url: "/api/v1/",
            method: "GET",
            requestHeaders: [{ key: "Content-Type", value: "application/json" }],
            requestBody: JSON.stringify({ data: "example" }, null, 2),
            responseStatus: "200",
            responseHeaders: [{ key: "Content-Type", value: "application/json" }],
            responseBody: JSON.stringify({ message: "Success" }, null, 2),
          
          }
          break
        // Add other cases as needed
      }

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
        data: {
          nodeType: type,
          label: NODE_TOOLS.find((tool) => tool.type === type)?.label || type,
          onUpdate: handleNodeUpdate,
          payload: { ...basePayload, ...specificPayload },
        },
      }
      setNodes((nodes) => [...nodes, newNode])
    },
    [setNodes, handleNodeUpdate],
  )

  const deleteSelected = useCallback(() => {
    setEdges((eds) => eds.filter((edge) => !edge.selected))
    setNodes((nodes) => nodes.filter((node) => !node.selected))
  }, [nodes, edges, setNodes, setEdges])

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Prevent deletion when an input field is focused
      const activeElement = document.activeElement
      if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
        return
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        deleteSelected()
      }
    },
    [deleteSelected],
  )

  const handleExport = () => {
    const data = {
      nodes,
      edges,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "board-state.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const contents = e.target?.result as string
        try {
          const { nodes: importedNodes, edges } = JSON.parse(contents)
          const nodesWithUpdater = importedNodes.map((n: Node) => ({
            ...n,
            data: { ...n.data, onUpdate: handleNodeUpdate },
          }))
          setNodes(nodesWithUpdater)
          setEdges(edges)
        } catch (error) {
          console.error("Error parsing imported file:", error)
          // Handle error appropriately, e.g., show a notification
        }
      }
      reader.readAsText(file)
    }
  }

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown as unknown as EventListener)
    return () => {
      document.removeEventListener("keydown", onKeyDown as unknown as EventListener)
    }
  }, [onKeyDown])

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
              {/* Import/Export */}
              <Card className="p-4 mb-4">
                <h3 className="font-medium mb-3">Manage Board</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    Export
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <label htmlFor="import-file" className="cursor-pointer">
                      Import
                      <input type="file" id="import-file" accept=".json" onChange={handleImport} className="hidden" />
                    </label>
                  </Button>
                </div>
              </Card>

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
                  <Button variant="destructive" size="sm" onClick={deleteSelected} className="w-full">
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
          onKeyDown={onKeyDown}
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
