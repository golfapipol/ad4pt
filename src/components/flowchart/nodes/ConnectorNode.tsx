import { useState } from "react"
import { type NodeProps, Handle, Position } from "reactflow"
import { Circle } from "lucide-react"

interface ConnectorNodeData {
  label?: string
  backgroundColor?: string
  textColor?: string
  onUpdate?: (id: string, updates: object) => void
}

export function ConnectorNode({ data, selected }: NodeProps<ConnectorNodeData>) {
  const [isEditing, setIsEditing] = useState(false)
  const [label, setLabel] = useState(data.label || "")

  const handleLabelUpdate = () => {
    setIsEditing(false)
    data.onUpdate?.(data.id, { label })
  }

  const backgroundColor = data.backgroundColor || 'bg-gray-200'
  const textColor = data.textColor || 'text-gray-700'
  const borderColor = selected ? 'border-blue-500' : 'border-gray-400'

  return (
    <div className="relative flex flex-col items-center">
      {/* Small circular connector */}
      <div
        className={`w-8 h-8 border-2 rounded-full shadow-sm ${backgroundColor} ${borderColor} flex items-center justify-center`}
        style={{
          backgroundColor: data.backgroundColor,
        }}
      >
        {/* Input handle */}
        <Handle 
          type="target" 
          position={Position.Left} 
          id="connector-input"
          style={{ left: '-8px' }}
        />
        
        {/* Output handle */}
        <Handle 
          type="source" 
          position={Position.Right} 
          id="connector-output"
          style={{ right: '-8px' }}
        />
        
        {/* Small dot indicator */}
        <Circle className="w-3 h-3 fill-current opacity-60" />
      </div>
      
      {/* Optional label below the connector */}
      {(label || isEditing) && (
        <div className="mt-1">
          {isEditing ? (
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={handleLabelUpdate}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLabelUpdate()
                }
                if (e.key === "Escape") {
                  setLabel(data.label || "")
                  setIsEditing(false)
                }
              }}
              className={`w-16 bg-transparent border-none outline-none text-xs text-center ${textColor}`}
              style={{ color: data.textColor }}
              placeholder="Label"
              autoFocus
            />
          ) : (
            <div 
              className={`text-xs cursor-text text-center ${textColor} min-w-[2rem]`}
              style={{ color: data.textColor }}
              onDoubleClick={() => setIsEditing(true)}
            >
              {label}
            </div>
          )}
        </div>
      )}
      
      {/* Add label prompt when no label exists */}
      {!label && !isEditing && (
        <div 
          className="mt-1 text-xs opacity-40 cursor-text text-center"
          onDoubleClick={() => setIsEditing(true)}
        >
          •
        </div>
      )}
    </div>
  )
}