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
  MarkerType,
  type Viewport,
} from "reactflow"
import "reactflow/dist/style.css"

import { FlowchartSidebar } from "./FlowchartSidebar"
import { StartNode } from "./nodes/StartNode"
import { ProcessNode } from "./nodes/ProcessNode"
import { DecisionNode } from "./nodes/DecisionNode"
import { ConnectorNode } from "./nodes/ConnectorNode"
import { 
  saveFlowchartData, 
  loadFlowchartData, 
  autoSaveFlowchartData, 
  clearFlowchartData,
  createNewFlowchart,
  FlowchartStorageError,
  type FlowchartData 
} from "@/lib/flowchartStorage"

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
  const [flowchartMetadata, setFlowchartMetadata] = useState({
    title: "Untitled Flowchart",
    description: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  const [currentFlowchartId, setCurrentFlowchartId] = useState<string | undefined>(undefined)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'unsaved'>('saved')
  const [saveError, setSaveError] = useState<string | null>(null)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition, fitView, zoomIn, zoomOut, zoomTo, getZoom, getViewport, setViewport } = useReactFlow()
  const nodeId = useRef(0)

  // Validate connections for flowchart logic
  const isValidConnection = useCallback((connection: Connection | Edge) => {
    const { source, target } = connection
    
    // Prevent self-connections
    if (source === target) {
      return false
    }
    
    // Check if connection already exists
    const existingConnection = edges.find(
      (edge) => edge.source === source && edge.target === target
    )
    if (existingConnection) {
      return false
    }
    
    // Get source and target nodes
    const sourceNode = nodes.find((node) => node.id === source)
    const targetNode = nodes.find((node) => node.id === target)
    
    if (!sourceNode || !targetNode) {
      return false
    }
    
    // Flowchart-specific validation rules
    // End nodes should not have outgoing connections
    if (sourceNode.data?.nodeType === 'end') {
      return false
    }
    
    // Start nodes should not have incoming connections (except from other start nodes)
    if (targetNode.data?.nodeType === 'start' && sourceNode.data?.nodeType !== 'start') {
      return false
    }
    
    return true
  }, [edges, nodes])

  const onConnect = useCallback(
    (connection: Edge | Connection) => {
      // Validate the connection before adding it
      if (!isValidConnection(connection)) {
        return
      }
      
      // Create edge with enhanced styling
      const newEdge = {
        ...connection,
        type: 'default',
        animated: false,
        style: {
          stroke: '#374151',
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#374151',
          width: 20,
          height: 20,
        },
        // Add hover and selection styles
        className: 'flowchart-edge',
      }
      
      setEdges((eds) => addEdge(newEdge, eds))
      // Update flowchart timestamp when edges are added
      setFlowchartMetadata((prev) => ({
        ...prev,
        updatedAt: new Date(),
      }))
    },
    [setEdges, isValidConnection],
  )

  const deleteSelected = useCallback(() => {
    setEdges((eds) => eds.filter((edge) => !edge.selected))
    setNodes((nodes) => nodes.filter((node) => !node.selected))
    // Update flowchart timestamp when nodes or edges are deleted
    setFlowchartMetadata((prev) => ({
      ...prev,
      updatedAt: new Date(),
    }))
  }, [setNodes, setEdges])

  const selectAll = useCallback(() => {
    setNodes((nodes) => nodes.map((node) => ({ ...node, selected: true })))
    setEdges((edges) => edges.map((edge) => ({ ...edge, selected: true })))
  }, [setNodes, setEdges])

  const deselectAll = useCallback(() => {
    setNodes((nodes) => nodes.map((node) => ({ ...node, selected: false })))
    setEdges((edges) => edges.map((edge) => ({ ...edge, selected: false })))
  }, [setNodes, setEdges])

  // Zoom and pan control functions
  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 300 })
  }, [zoomIn])

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 300 })
  }, [zoomOut])

  const handleZoomToFit = useCallback(() => {
    fitView({ 
      padding: 0.1, 
      duration: 500,
      minZoom: 0.1,
      maxZoom: 1.5
    })
  }, [fitView])

  const handleZoomReset = useCallback(() => {
    zoomTo(1, { duration: 300 })
  }, [zoomTo])

  const handleCenterView = useCallback(() => {
    if (nodes.length === 0) {
      // If no nodes, center at origin
      setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 })
      return
    }

    // Calculate the center of all nodes
    const nodePositions = nodes.map(node => ({
      x: node.position.x,
      y: node.position.y
    }))

    const centerX = nodePositions.reduce((sum, pos) => sum + pos.x, 0) / nodePositions.length
    const centerY = nodePositions.reduce((sum, pos) => sum + pos.y, 0) / nodePositions.length

    // Get current viewport dimensions (approximate)
    const viewportWidth = reactFlowWrapper.current?.clientWidth || 800
    const viewportHeight = reactFlowWrapper.current?.clientHeight || 600

    // Center the view on the calculated center
    const currentZoom = getZoom()
    setViewport({
      x: viewportWidth / 2 - centerX * currentZoom,
      y: viewportHeight / 2 - centerY * currentZoom,
      zoom: currentZoom
    }, { duration: 300 })
  }, [nodes, setViewport, getZoom])

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Prevent actions when an input field is focused
      const activeElement = document.activeElement
      if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
        return
      }

      // Handle keyboard shortcuts
      if (event.key === "Delete" || event.key === "Backspace") {
        deleteSelected()
      } else if (event.key === "a" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        selectAll()
      } else if (event.key === "Escape") {
        deselectAll()
      } else if (event.key === "=" && (event.ctrlKey || event.metaKey)) {
        // Zoom in with Ctrl/Cmd + =
        event.preventDefault()
        handleZoomIn()
      } else if (event.key === "-" && (event.ctrlKey || event.metaKey)) {
        // Zoom out with Ctrl/Cmd + -
        event.preventDefault()
        handleZoomOut()
      } else if (event.key === "0" && (event.ctrlKey || event.metaKey)) {
        // Reset zoom with Ctrl/Cmd + 0
        event.preventDefault()
        handleZoomReset()
      } else if (event.key === "f" && (event.ctrlKey || event.metaKey)) {
        // Fit view with Ctrl/Cmd + F
        event.preventDefault()
        handleZoomToFit()
      } else if (event.key === "c" && (event.ctrlKey || event.metaKey) && event.shiftKey) {
        // Center view with Ctrl/Cmd + Shift + C
        event.preventDefault()
        handleCenterView()
      }
    },
    [deleteSelected, selectAll, deselectAll, handleZoomIn, handleZoomOut, handleZoomReset, handleZoomToFit, handleCenterView],
  )

  // Handle flowchart metadata updates
  const updateFlowchartMetadata = useCallback((updates: Partial<typeof flowchartMetadata>) => {
    setFlowchartMetadata((prev) => ({
      ...prev,
      ...updates,
      updatedAt: new Date(),
    }))
  }, [])

  // Handle node updates from within node components
  const onNodeUpdate = useCallback((id: string, updates: object) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    )
    // Update flowchart timestamp when nodes are modified
    setFlowchartMetadata((prev) => ({
      ...prev,
      updatedAt: new Date(),
    }))
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
        // Update flowchart timestamp when new nodes are added
        setFlowchartMetadata((prev) => ({
          ...prev,
          updatedAt: new Date(),
        }))
      }
    },
    [screenToFlowPosition, setNodes, onNodeUpdate]
  )

  // Auto-save functionality
  const performAutoSave = useCallback(async () => {
    if (nodes.length === 0 && edges.length === 0) {
      // Don't save empty flowcharts
      return
    }

    try {
      setSaveStatus('saving')
      setSaveError(null)
      
      const savedData = await autoSaveFlowchartData(
        nodes,
        edges,
        flowchartMetadata,
        currentFlowchartId
      )
      
      setCurrentFlowchartId(savedData.id)
      setSaveStatus('saved')
    } catch (error) {
      console.error('Auto-save failed:', error)
      setSaveStatus('error')
      setSaveError(error instanceof FlowchartStorageError ? error.message : 'Failed to save flowchart')
    }
  }, [nodes, edges, flowchartMetadata, currentFlowchartId])

  // Load existing flowchart data on mount
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const savedData = loadFlowchartData()
        if (savedData) {
          // Update node data with onUpdate callback
          const nodesWithCallbacks = savedData.nodes.map(node => ({
            ...node,
            data: {
              ...node.data,
              onUpdate: onNodeUpdate,
            }
          }))
          
          setNodes(nodesWithCallbacks)
          setEdges(savedData.edges)
          setFlowchartMetadata({
            title: savedData.title,
            description: savedData.description || "",
            createdAt: savedData.createdAt,
            updatedAt: savedData.updatedAt,
          })
          setCurrentFlowchartId(savedData.id)
          
          // Update nodeId counter to avoid conflicts
          const maxId = Math.max(
            ...savedData.nodes
              .map(node => {
                const match = node.id.match(/-(\d+)$/)
                return match ? parseInt(match[1], 10) : 0
              })
              .filter(id => !isNaN(id))
          )
          nodeId.current = maxId + 1
          
          setSaveStatus('saved')
        }
      } catch (error) {
        console.error('Failed to load flowchart data:', error)
        setSaveError(error instanceof FlowchartStorageError ? error.message : 'Failed to load flowchart')
        setSaveStatus('error')
      }
    }

    loadExistingData()
  }, [setNodes, setEdges, onNodeUpdate])

  // Clear flowchart and create new one
  const createNewFlowchartHandler = useCallback((template: 'empty' | 'basic' | 'decision' = 'empty') => {
    try {
      const newFlowchart = createNewFlowchart(template)
      
      // Update node data with onUpdate callback
      const nodesWithCallbacks = newFlowchart.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onUpdate: onNodeUpdate,
        }
      }))
      
      setNodes(nodesWithCallbacks)
      setEdges(newFlowchart.edges)
      setFlowchartMetadata({
        title: newFlowchart.title,
        description: newFlowchart.description || "",
        createdAt: newFlowchart.createdAt,
        updatedAt: newFlowchart.updatedAt,
      })
      setCurrentFlowchartId(undefined) // New flowchart doesn't have an ID yet
      setSaveStatus('unsaved')
      setSaveError(null)
      
      // Reset node ID counter
      const maxId = Math.max(
        ...newFlowchart.nodes
          .map(node => {
            const match = node.id.match(/-(\d+)$/)
            return match ? parseInt(match[1], 10) : 0
          })
          .filter(id => !isNaN(id))
      )
      nodeId.current = maxId + 1
      
    } catch (error) {
      console.error('Failed to create new flowchart:', error)
      setSaveError('Failed to create new flowchart')
      setSaveStatus('error')
    }
  }, [setNodes, setEdges, onNodeUpdate])

  // Clear current flowchart
  const clearFlowchartHandler = useCallback(() => {
    try {
      clearFlowchartData()
      setNodes([])
      setEdges([])
      setFlowchartMetadata({
        title: "Untitled Flowchart",
        description: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      setCurrentFlowchartId(undefined)
      setSaveStatus('saved')
      setSaveError(null)
      nodeId.current = 0
    } catch (error) {
      console.error('Failed to clear flowchart:', error)
      setSaveError('Failed to clear flowchart')
      setSaveStatus('error')
    }
  }, [setNodes, setEdges])

  // Auto-save when flowchart data changes
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      setSaveStatus('unsaved')
      performAutoSave()
    }
  }, [nodes, edges, flowchartMetadata, performAutoSave])

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown as unknown as EventListener)
    return () => {
      document.removeEventListener("keydown", onKeyDown as unknown as EventListener)
    }
  }, [onKeyDown])

  return (
    <div className="flex h-full">
      {/* Flowchart Sidebar */}
      <FlowchartSidebar 
        flowchartMetadata={flowchartMetadata}
        onUpdateMetadata={updateFlowchartMetadata}
        selectedNodesCount={nodes.filter(node => node.selected).length}
        selectedEdgesCount={edges.filter(edge => edge.selected).length}
        nodes={nodes}
        edges={edges}
        saveStatus={saveStatus}
        saveError={saveError}
        currentFlowchartId={currentFlowchartId}
        onManualSave={performAutoSave}
        onNewFlowchart={createNewFlowchartHandler}
        onClearFlowchart={clearFlowchartHandler}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomToFit={handleZoomToFit}
        onZoomReset={handleZoomReset}
        onCenterView={handleCenterView}
      />

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
          minZoom={0.05}
          maxZoom={4}
          zoomOnScroll={true}
          zoomOnPinch={true}
          zoomOnDoubleClick={false}
          panOnScroll={false}
          panOnScrollSpeed={0.5}
          panOnDrag={[1, 2]}
          selectNodesOnDrag={false}
          attributionPosition="bottom-left"
          onKeyDown={onKeyDown}
          connectionLineStyle={{
            stroke: '#2563eb',
            strokeWidth: 2,
            strokeDasharray: '5,5',
          }}
          multiSelectionKeyCode="Control"
          selectionKeyCode="Shift"
          translateExtent={[[-2000, -2000], [2000, 2000]]}
          nodeExtent={[[-1500, -1500], [1500, 1500]]}
        >
          <Controls />
          <MiniMap position="top-right" />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  )
}