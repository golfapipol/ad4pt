import { useState, useEffect, useRef, type DragEvent } from "react"
import { Play, Settings, HelpCircle, Circle, Square, FileText, Save, CheckCircle, AlertCircle, Clock, Plus, Trash2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MermaidExporter } from "./MermaidExporter"
import { type Node, type Edge } from "reactflow"

interface NodePaletteItem {
  type: string
  label: string
  icon: React.ReactNode
  description: string
  defaultData: any
}

const nodePalette: NodePaletteItem[] = [
  {
    type: "startNode",
    label: "Start",
    icon: <Play className="w-5 h-5" />,
    description: "Start point of the flowchart",
    defaultData: {
      label: "Start",
      nodeType: "start",
      backgroundColor: "#dcfce7",
      textColor: "#15803d"
    }
  },
  {
    type: "processNode", 
    label: "Process",
    icon: <Settings className="w-5 h-5" />,
    description: "Process or action step",
    defaultData: {
      label: "Process",
      description: "",
      backgroundColor: "#dbeafe",
      textColor: "#1d4ed8"
    }
  },
  {
    type: "decisionNode",
    label: "Decision", 
    icon: <HelpCircle className="w-5 h-5" />,
    description: "Decision point with yes/no branches",
    defaultData: {
      label: "Decision?",
      yesLabel: "Yes",
      noLabel: "No", 
      backgroundColor: "#fef3c7",
      textColor: "#d97706"
    }
  },
  {
    type: "endNode",
    label: "End",
    icon: <Square className="w-5 h-5" />,
    description: "End point of the flowchart",
    defaultData: {
      label: "End",
      nodeType: "end",
      backgroundColor: "#fee2e2", 
      textColor: "#dc2626"
    }
  },
  {
    type: "connectorNode",
    label: "Connector",
    icon: <Circle className="w-5 h-5" />,
    description: "Small connector for flow continuity",
    defaultData: {
      label: "",
      backgroundColor: "#f3f4f6",
      textColor: "#374151"
    }
  }
]

interface FlowchartMetadata {
  title: string
  description: string
  createdAt: Date
  updatedAt: Date
}

interface FlowchartSidebarProps {
  onNodeDragStart?: (event: DragEvent, nodeType: string, nodeData: any) => void
  flowchartMetadata?: FlowchartMetadata
  onUpdateMetadata?: (updates: Partial<FlowchartMetadata>) => void
  selectedNodesCount?: number
  selectedEdgesCount?: number
  nodes?: Node[]
  edges?: Edge[]
  saveStatus?: 'saved' | 'saving' | 'error' | 'unsaved'
  saveError?: string | null
  currentFlowchartId?: string
  onManualSave?: () => Promise<void>
  onNewFlowchart?: (template?: 'empty' | 'basic' | 'decision') => void
  onClearFlowchart?: () => void
}

export function FlowchartSidebar({ 
  onNodeDragStart, 
  flowchartMetadata, 
  onUpdateMetadata, 
  selectedNodesCount = 0, 
  selectedEdgesCount = 0, 
  nodes = [], 
  edges = [],
  saveStatus = 'saved',
  saveError = null,
  currentFlowchartId,
  onManualSave,
  onNewFlowchart,
  onClearFlowchart
}: FlowchartSidebarProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [showMermaidExporter, setShowMermaidExporter] = useState(false)
  const [isManualSaving, setIsManualSaving] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showNewFlowchartMenu, setShowNewFlowchartMenu] = useState(false)
  const newFlowchartMenuRef = useRef<HTMLDivElement>(null)

  const handleDragStart = (event: DragEvent, item: NodePaletteItem) => {
    // Set drag data for the drop handler
    event.dataTransfer.setData("application/reactflow", item.type)
    event.dataTransfer.setData("application/json", JSON.stringify(item.defaultData))
    event.dataTransfer.effectAllowed = "move"
    
    // Track which item is being dragged for visual feedback
    setDraggedItem(item.type)
    
    // Call the optional callback
    onNodeDragStart?.(event, item.type, item.defaultData)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  const handleManualSave = async () => {
    if (!onManualSave) return
    
    try {
      setIsManualSaving(true)
      await onManualSave()
    } catch (error) {
      console.error('Manual save failed:', error)
    } finally {
      setIsManualSaving(false)
    }
  }

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saved':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'saving':
        return <Clock className="w-4 h-4 text-blue-600 animate-spin" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'unsaved':
        return <Save className="w-4 h-4 text-orange-600" />
      default:
        return <Save className="w-4 h-4 text-gray-600" />
    }
  }

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saved':
        return 'All changes saved'
      case 'saving':
        return 'Saving changes...'
      case 'error':
        return saveError || 'Save failed'
      case 'unsaved':
        return 'Unsaved changes'
      default:
        return 'Unknown status'
    }
  }

  const getSaveStatusColor = () => {
    switch (saveStatus) {
      case 'saved':
        return 'text-green-600'
      case 'saving':
        return 'text-blue-600'
      case 'error':
        return 'text-red-600'
      case 'unsaved':
        return 'text-orange-600'
      default:
        return 'text-gray-600'
    }
  }

  const handleNewFlowchart = (template: 'empty' | 'basic' | 'decision' = 'empty') => {
    onNewFlowchart?.(template)
    setShowNewFlowchartMenu(false)
  }

  const handleClearFlowchart = () => {
    onClearFlowchart?.()
    setShowClearConfirm(false)
  }

  const hasContent = nodes.length > 0 || edges.length > 0

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (newFlowchartMenuRef.current && !newFlowchartMenuRef.current.contains(event.target as Node)) {
        setShowNewFlowchartMenu(false)
      }
    }

    if (showNewFlowchartMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showNewFlowchartMenu])

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Flowchart Editor</h2>
        <p className="text-sm text-gray-600 mt-1">
          Drag nodes onto the canvas to build your flowchart
        </p>
      </div>

      {/* Save Status */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Save Status</h3>
          {onManualSave && (
            <Button
              onClick={handleManualSave}
              disabled={isManualSaving || saveStatus === 'saving'}
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
            >
              <Save className="w-3 h-3 mr-1" />
              Save
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {getSaveStatusIcon()}
          <span className={`text-xs ${getSaveStatusColor()}`}>
            {getSaveStatusText()}
          </span>
        </div>
        {currentFlowchartId && (
          <div className="text-xs text-gray-500 mt-1">
            ID: {currentFlowchartId.slice(-8)}
          </div>
        )}
      </div>

      {/* New/Clear Flowchart */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Flowchart Actions</h3>
        <div className="space-y-2">
          {/* New Flowchart Dropdown */}
          <div className="relative" ref={newFlowchartMenuRef}>
            <Button
              onClick={() => setShowNewFlowchartMenu(!showNewFlowchartMenu)}
              className="w-full flex items-center justify-between"
              variant="outline"
              size="sm"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Flowchart
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showNewFlowchartMenu ? 'rotate-180' : ''}`} />
            </Button>
            
            {showNewFlowchartMenu && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <button
                  onClick={() => handleNewFlowchart('empty')}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-md"
                >
                  Empty Flowchart
                </button>
                <button
                  onClick={() => handleNewFlowchart('basic')}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-t border-gray-100"
                >
                  Basic Process Flow
                </button>
                <button
                  onClick={() => handleNewFlowchart('decision')}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-t border-gray-100 last:rounded-b-md"
                >
                  Decision Flow
                </button>
              </div>
            )}
          </div>

          {/* Clear Flowchart */}
          {hasContent && (
            <>
              {!showClearConfirm ? (
                <Button
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full flex items-center gap-2"
                  variant="outline"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Flowchart
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-red-600 font-medium">
                    Are you sure? This will delete all nodes and connections.
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleClearFlowchart}
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                    >
                      Yes, Clear
                    </Button>
                    <Button
                      onClick={() => setShowClearConfirm(false)}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Flowchart Metadata */}
      {flowchartMetadata && onUpdateMetadata && (
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Flowchart Details</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Title
              </label>
              <input
                type="text"
                value={flowchartMetadata.title}
                onChange={(e) => onUpdateMetadata({ title: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter flowchart title"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Description
              </label>
              <textarea
                value={flowchartMetadata.description}
                onChange={(e) => onUpdateMetadata({ description: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={2}
                placeholder="Enter flowchart description"
              />
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>Created: {flowchartMetadata.createdAt.toLocaleDateString()}</div>
              <div>Updated: {flowchartMetadata.updatedAt.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Selection Status */}
      {(selectedNodesCount > 0 || selectedEdgesCount > 0) && (
        <div className="p-4 border-b border-gray-100 bg-blue-50">
          <h3 className="text-sm font-medium text-blue-700 mb-2">Selection</h3>
          <div className="text-xs text-blue-600 space-y-1">
            {selectedNodesCount > 0 && (
              <div>• {selectedNodesCount} node{selectedNodesCount !== 1 ? 's' : ''} selected</div>
            )}
            {selectedEdgesCount > 0 && (
              <div>• {selectedEdgesCount} connection{selectedEdgesCount !== 1 ? 's' : ''} selected</div>
            )}
            <div className="text-blue-500 mt-2">Press Delete to remove selected items</div>
          </div>
        </div>
      )}

      {/* Node Palette */}
      <div className="flex-1 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Node Palette</h3>
        <div className="space-y-2">
          {nodePalette.map((item) => (
            <div
              key={item.type}
              draggable
              onDragStart={(event) => handleDragStart(event, item)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                draggedItem === item.type
                  ? "bg-blue-50 border-blue-300 opacity-50"
                  : "bg-gray-50 border-gray-200 cursor-grab hover:bg-gray-100 hover:border-gray-300 active:cursor-grabbing"
              }`}
            >
              <div className="flex-shrink-0 text-gray-600">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">
                  {item.label}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {item.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Section */}
      <div className="p-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Export</h4>
        <Button
          onClick={() => setShowMermaidExporter(true)}
          disabled={nodes.length === 0}
          className="w-full flex items-center gap-2"
          variant="outline"
        >
          <FileText className="w-4 h-4" />
          Export to Mermaid.js
        </Button>
        {nodes.length === 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Add nodes to your flowchart to enable export
          </p>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Instructions</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Drag nodes from the palette to the canvas</li>
          <li>• Double-click nodes to edit labels</li>
          <li>• Connect nodes by dragging from handles</li>
          <li>• Press Delete to remove selected items</li>
        </ul>
        
        <h4 className="text-sm font-medium text-gray-700 mb-2 mt-4">Keyboard Shortcuts</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl+A</kbd> Select all</li>
          <li>• <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl+Click</kbd> Multi-select</li>
          <li>• <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Shift+Drag</kbd> Box select</li>
          <li>• <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Esc</kbd> Deselect all</li>
          <li>• <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Del</kbd> Delete selected</li>
        </ul>
      </div>

      {/* Mermaid Exporter Modal */}
      <MermaidExporter
        isOpen={showMermaidExporter}
        onClose={() => setShowMermaidExporter(false)}
        nodes={nodes}
        edges={edges}
        metadata={flowchartMetadata}
      />
    </div>
  )
}