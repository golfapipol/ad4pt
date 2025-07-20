import { useState } from "react"
import { type NodeProps, Handle, Position } from "reactflow"
import { Play, Square } from "lucide-react"

interface StartNodeData {
  label: string
  nodeType: 'start' | 'end'
  backgroundColor?: string
  textColor?: string
  onUpdate?: (id: string, updates: object) => void
}

export function StartNode({ data, selected }: NodeProps<StartNodeData>) {
  const [isEditing, setIsEditing] = useState(false)
  const [label, setLabel] = useState(data.label || (data.nodeType === 'start' ? 'Start' : 'End'))

  const handleLabelUpdate = () => {
    setIsEditing(false)
    data.onUpdate?.(data.id, { label })
  }

  const isStart = data.nodeType === 'start'
  const backgroundColor = data.backgroundColor || (isStart ? 'bg-green-100' : 'bg-red-100')
  const textColor = data.textColor || (isStart ? 'text-green-700' : 'text-red-700')
  const borderColor = selected 
    ? 'border-blue-500' 
    : (isStart ? 'border-green-300' : 'border-red-300')

  return (
    <div
      className={`px-6 py-4 border-2 rounded-full shadow-md min-w-[120px] text-center ${backgroundColor} ${textColor} ${borderColor}`}
      style={{
        backgroundColor: data.backgroundColor,
        color: data.textColor,
      }}
    >
      {/* Start nodes only have source handles, End nodes only have target handles */}
      {isStart ? (
        <Handle type="source" position={Position.Bottom} id="start-output" />
      ) : (
        <Handle type="target" position={Position.Top} id="end-input" />
      )}
      
      <div className="flex items-center justify-center gap-2 mb-1">
        {isStart ? (
          <Play className="w-4 h-4" />
        ) : (
          <Square className="w-4 h-4" />
        )}
        <span className="text-xs font-medium opacity-75">
          {isStart ? 'Start' : 'End'}
        </span>
      </div>
      
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
              setLabel(data.label || (data.nodeType === 'start' ? 'Start' : 'End'))
              setIsEditing(false)
            }
          }}
          className="w-full bg-transparent border-none outline-none font-medium text-center"
          autoFocus
        />
      ) : (
        <div 
          className="font-medium cursor-text" 
          onDoubleClick={() => setIsEditing(true)}
        >
          {label}
        </div>
      )}
    </div>
  )
}