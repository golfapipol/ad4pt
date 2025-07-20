import { useState } from "react"
import { type NodeProps, Handle, Position } from "reactflow"
import { Settings } from "lucide-react"

interface ProcessNodeData {
  label: string
  description?: string
  backgroundColor?: string
  textColor?: string
  onUpdate?: (id: string, updates: object) => void
}

export function ProcessNode({ data, selected }: NodeProps<ProcessNodeData>) {
  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [label, setLabel] = useState(data.label || "Process")
  const [description, setDescription] = useState(data.description || "")

  const handleLabelUpdate = () => {
    setIsEditingLabel(false)
    data.onUpdate?.(data.id, { label })
  }

  const handleDescriptionUpdate = () => {
    setIsEditingDescription(false)
    data.onUpdate?.(data.id, { description })
  }

  const backgroundColor = data.backgroundColor || 'bg-blue-100'
  const textColor = data.textColor || 'text-blue-700'
  const borderColor = selected ? 'border-blue-500' : 'border-blue-300'

  return (
    <div
      className={`px-4 py-3 border-2 rounded-lg shadow-md min-w-[160px] ${backgroundColor} ${textColor} ${borderColor}`}
      style={{
        backgroundColor: data.backgroundColor,
        color: data.textColor,
      }}
    >
      {/* Input handle */}
      <Handle type="target" position={Position.Top} id="process-input" />
      
      <div className="flex items-center gap-2 mb-2">
        <Settings className="w-4 h-4" />
        <span className="text-xs font-medium opacity-75">Process</span>
      </div>
      
      {/* Main label */}
      {isEditingLabel ? (
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleLabelUpdate}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleLabelUpdate()
            }
            if (e.key === "Escape") {
              setLabel(data.label || "Process")
              setIsEditingLabel(false)
            }
          }}
          className="w-full bg-transparent border-none outline-none font-medium mb-1"
          autoFocus
        />
      ) : (
        <div 
          className="font-medium cursor-text mb-1" 
          onDoubleClick={() => setIsEditingLabel(true)}
        >
          {label}
        </div>
      )}
      
      {/* Description field */}
      {isEditingDescription ? (
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleDescriptionUpdate}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleDescriptionUpdate()
            }
            if (e.key === "Escape") {
              setDescription(data.description || "")
              setIsEditingDescription(false)
            }
          }}
          className="w-full bg-transparent border-none outline-none text-sm opacity-75 resize-none"
          rows={2}
          placeholder="Add description..."
          autoFocus
        />
      ) : (
        <div 
          className="text-sm opacity-75 cursor-text min-h-[1rem]" 
          onDoubleClick={() => setIsEditingDescription(true)}
        >
          {description || (
            <span className="italic text-xs opacity-50">Double-click to add description</span>
          )}
        </div>
      )}
      
      {/* Output handle */}
      <Handle type="source" position={Position.Bottom} id="process-output" />
    </div>
  )
}