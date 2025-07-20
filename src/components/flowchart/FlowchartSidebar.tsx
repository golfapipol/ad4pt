import { useState, type DragEvent } from "react"
import { Play, Settings, HelpCircle, Circle, Square } from "lucide-react"

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

interface FlowchartSidebarProps {
  onNodeDragStart?: (event: DragEvent, nodeType: string, nodeData: any) => void
}

export function FlowchartSidebar({ onNodeDragStart }: FlowchartSidebarProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null)

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

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Flowchart Editor</h2>
        <p className="text-sm text-gray-600 mt-1">
          Drag nodes onto the canvas to build your flowchart
        </p>
      </div>

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

      {/* Instructions */}
      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Instructions</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Drag nodes from the palette to the canvas</li>
          <li>• Double-click nodes to edit labels</li>
          <li>• Connect nodes by dragging from handles</li>
          <li>• Press Delete to remove selected items</li>
        </ul>
      </div>
    </div>
  )
}