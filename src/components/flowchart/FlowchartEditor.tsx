"use client"

import { useCallback, useEffect } from "react"
import ReactFlow, {
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

export default function FlowchartEditor() {
  // Suppress ResizeObserver errors globally
  useEffect(() => {
    const cleanup = suppressResizeObserverError()
    return () => {
      cleanup()
    }
  }, [])

  return (
    <div className="w-full h-full bg-gray-50">
      <ReactFlowProvider>
        <FlowchartContent />
      </ReactFlowProvider>
    </div>
  )
}

function FlowchartContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const onConnect = useCallback(
    (connection: Edge | Connection) => {
      setEdges((eds) => addEdge(connection, eds))
    },
    [setEdges],
  )

  const deleteSelected = useCallback(() => {
    setEdges((eds) => eds.filter((edge) => !edge.selected))
    setNodes((nodes) => nodes.filter((node) => !node.selected))
  }, [setNodes, setEdges])

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

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown as unknown as EventListener)
    return () => {
      document.removeEventListener("keydown", onKeyDown as unknown as EventListener)
    }
  }, [onKeyDown])

  return (
    <div className="flex h-full">
      {/* Sidebar placeholder */}
      <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Flowchart Editor</h2>
          <p className="text-sm text-gray-600">
            Drag and drop flowchart nodes will be available here.
          </p>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative min-w-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
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
          <MiniMap position="top-right" />
          <Background variant="dot" gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  )
}