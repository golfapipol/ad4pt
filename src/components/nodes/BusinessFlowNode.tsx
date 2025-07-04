import { useState } from "react"
import { type NodeProps, Handle, Position } from "reactflow"
import { Workflow } from "lucide-react"

export function BusinessFlowNode({ data, selected }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [label, setLabel] = useState(data.label || "Business Flow")

  return (
    <div
      className={`px-4 py-3 bg-white border-2 rounded-lg shadow-md min-w-[140px] ${
        selected ? "border-blue-500" : "border-gray-300"
      } bg-blue-100 text-blue-700`}
    >
      <Handle type="target" position={Position.Top} id="another-type" />
      <Handle type="target" position={Position.Left} id="same-type" />
      <div className="flex items-center gap-2 mb-2">
        <Workflow className="w-4 h-4" />
        <span className="text-xs font-medium opacity-75">Business Flow</span>
      </div>
      {isEditing ? (
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => {
            setIsEditing(false)
            data.onUpdate?.(data.id, { label })
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setIsEditing(false)
              data.onUpdate?.(data.id, { label })
            }
          }}
          className="w-full bg-transparent border-none outline-none font-medium"
          autoFocus
        />
      ) : (
        <div className="font-medium cursor-text" onDoubleClick={() => setIsEditing(true)}>
          {label}
        </div>
      )}
      <Handle type="source" position={Position.Right} id="same-type" />
      <Handle type="source" position={Position.Bottom} id="another-type" />
    </div>
  )
}