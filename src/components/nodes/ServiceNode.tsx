import { useState } from "react"
import { type NodeProps, Handle, Position } from "reactflow"
import { Cog } from "lucide-react"

export function ServiceNode({ id, data, selected }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const { label,payload = {} } = data

  const handleUpdate = (field: string, value: any) => {
    if (field.startsWith("payload.")) {
      const payloadField = field.substring("payload.".length)
      const newPayload = { ...payload, [payloadField]: value }
      data.onUpdate?.(id, { payload: newPayload })
    } else {
      data.onUpdate?.(id, { [field]: value })
    }
  }

  return (
    <div
      className={`px-4 py-3 bg-white border-2 rounded-lg shadow-md min-w-[300px] ${
        selected ? "border-blue-500" : "border-gray-300"
      } bg-red-100 text-red-700`}
    >
      <Handle type="target" position={Position.Top} id="another-type" />
      <Handle type="target" position={Position.Left} id="same-type" />
      <div className="flex items-center gap-2 mb-2">
        <Cog className="w-4 h-4" />
        <span className="text-xs font-medium opacity-75">Service</span>
      </div>
      {isEditing ? (
        <input
          value={label || "Service"}
          onChange={(e) => handleUpdate("label", e.target.value)}
          onBlur={() => {
            setIsEditing(false)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setIsEditing(false)
            }
          }}
          className="w-full bg-transparent border-none outline-none font-medium"
          autoFocus
        />
      ) : (
        <div className="font-medium cursor-text" onDoubleClick={() => setIsEditing(true)}>
          {label || "Service"}
        </div>
      )}

      {/* New Fields */}
      <div className="nodrag mt-2 pt-2 border-t border-red-200 space-y-2">
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1">
            <label className="w-24 font-medium opacity-75">Service Name:</label>
            <input
              type="text"
              value={payload.serviceName || ""}
              onChange={(e) => handleUpdate("serviceName", e.target.value)}
              className="w-full bg-red-50 border border-red-200 rounded px-1 py-0.5 text-xs"
              placeholder="NewService"
            />
          </div>
          <div>
            <label className="block font-medium opacity-75 mb-0.5">Description:</label>
            <textarea
              value={payload.description || ""}
              onChange={(e) => handleUpdate("description", e.target.value)}
              className="w-full bg-red-50 border border-red-200 rounded px-1 py-0.5 text-xs h-16"
              placeholder="This service handles business logic."
            />
          </div>
          <div>
            <label className="block font-medium opacity-75 mb-0.5">Dependencies:</label>
            <textarea
              value={payload.dependencies || ""}
              onChange={(e) => handleUpdate("dependencies", e.target.value)}
              className="w-full bg-red-50 border border-red-200 rounded px-1 py-0.5 text-xs h-12"
              placeholder="e.g., ApiService, Logger"
            />
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} id="same-type" />
      <Handle type="source" position={Position.Bottom} id="another-type" />
    </div>
  )
}
