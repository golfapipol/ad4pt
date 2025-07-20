"use client"

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react"
import ReactFlow, {
  type Edge,
  type Node,
  addEdge,
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow"
import "reactflow/dist/style.css"

import { FlowchartSidebar } from "./FlowchartSidebar"
import { StartNode } from "./nodes/StartNode"
import { ProcessNode } from "./nodes/ProcessNode"
import { DecisionNode } from "./nodes/DecisionNode"
import { ConnectorNode } from "./nodes/ConnectorNode"

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

// Define node types for ReactFlow
const nodeTypes = {
  startNode: StartNode,
  endNode: StartNode, // StartNode handles both start and end types
  processNode: ProcessNode,
  decisionNode: DecisionNode,
  connectorNode: ConnectorNode,
}

function FlowchartContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [isDragOver, setIsDragOver] = useState(false)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()
  let nodeId = useRef(0)

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

  // Handle node updates from within node components
  const onNodeUpdate = useCallback((id: string, updates: object) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    )
  }, [setNodes])

  // Handle drag over for drop zone
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  // Handle drag enter to show drop zone feedback
  const onDragEnter = useCallback((event: DragEvent) => {
    event.preventDefault()
    const type = event.dataTransfer.types.includes("application/reactflow")
    if (type) {
      setIsDragOver(true)
    }
  }, [])

  // Handle drag leave to hide drop zone feedback
  const onDragLeave = useCallback((event: DragEvent) => {
    event.preventDefault()
    // Only hide feedback if we're leaving the drop zone entirely
    if (!event.currentTarget.contains(event.relatedTarget as Element)) {
      setIsDragOver(false)
    }
  }, [])

  // Handle drop to create new nodes
  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()
      setIsDragOver(false)

      const type = event.dataTransfer.getData("application/reactflow")
      const nodeDataString = event.dataTransfer.getData("application/json")
      
      if (!type || !nodeDataString) {
        return
      }

      let nodeData
      try {
        nodeData = JSON.parse(nodeDataString)
      } catch (error) {
        console.error("Failed to parse node data:", error)
        return
      }

      if (reactFlowWrapper.current) {
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        })

        const newNode: Node = {
          id: `${type}-${nodeId.current++}`,
          type,
          position,
          data: {
            ...nodeData,
            onUpdate: onNodeUpdate,
          },
        }

        setNodes((nodes) => nodes.concat(newNode))
      }
    },
    [screenToFlowPosition, setNodes, onNodeUpdate]
  )

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown as unknown as EventListener)
    return () => {
      document.removeEventListener("keydown", onKeyDown as unknown as EventListener)
    }
  }, [onKeyDown])

  return (
    <div className="flex h-full">
      {/* Flowchart Sidebar */}
      <FlowchartSidebar />

      {/* Main Canvas */}
      <div 
        className={`flex-1 relative min-w-0 transition-colors ${
          isDragOver ? "bg-blue-50" : ""
        }`}
        ref={reactFlowWrapper}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
      >
        {/* Drop zone indicator */}
        {isDragOver && (
          <div className="absolute inset-4 border-2 border-dashed border-blue-400 bg-blue-50/50 rounded-lg flex items-center justify-center z-10 pointer-events-none">
            <div className="text-blue-600 text-lg font-medium">
              Drop node here to add to flowchart
            </div>
          </div>
        )}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
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
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  )
}