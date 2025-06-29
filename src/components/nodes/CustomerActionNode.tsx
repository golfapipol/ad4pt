import { useState } from "react"
import { type NodeProps, Handle, Position } from "reactflow"
import { User } from "lucide-react"

export function CustomerActionNode({ id, data, selected }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const { label, payload = {} } = data

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
      } bg-green-100 text-green-700`}
    >
      <Handle type="target" position={Position.Top} id="another-type" />
      <Handle type="target" position={Position.Left} id="same-type" />
      <div className="flex items-center gap-2 mb-2">
        <User className="w-4 h-4" />
        <span className="text-xs font-medium opacity-75">Customer Action</span>
      </div>
      {isEditing ? (
        <input
          value={label || "Customer Action"}
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
          {label || "Customer Action"}
        </div>
      )}

      {/* New Fields */}
      <div className="nodrag mt-2 pt-2 border-t border-green-200 space-y-2">
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1">
            <label className="w-24 font-medium opacity-75">Action Type:</label>
            <select
              value={payload.actionType || "navigate"}
              onChange={(e) => handleUpdate("payload.actionType", e.target.value)}
              className="w-full bg-green-50 border border-green-200 rounded px-1 py-0.5 text-xs"
            >
              <option value="navigate">Navigate</option>
              <option value="click">Click</option>
              <option value="type">Type</option>
              <option value="selectOption">Select Option</option>
              <option value="see">See</option>
            </select>
          </div>

          {payload.actionType === "navigate" && (
            <div className="flex items-center gap-1">
              <label className="w-24 font-medium opacity-75">URL:</label>
              <input
                type="text"
                value={payload.url || ""}
                onChange={(e) => handleUpdate("payload.url", e.target.value)}
                className="w-full bg-green-50 border border-green-200 rounded px-1 py-0.5 text-xs"
                placeholder="https://example.com"
              />
            </div>
          )}

          {(payload.actionType === "click" ||
            payload.actionType === "type" ||
            payload.actionType === "selectOption") && (
            <div className="flex items-center gap-1">
              <label className="w-24 font-medium opacity-75">Selector:</label>
              <input
                type="text"
                value={payload.selector || ""}
                onChange={(e) => handleUpdate("payload.selector", e.target.value)}
                className="w-full bg-green-50 border border-green-200 rounded px-1 py-0.5 text-xs"
                placeholder="#submit-button"
              />
            </div>
          )}

          {payload.actionType === "type" && (
            <div className="flex items-center gap-1">
              <label className="w-24 font-medium opacity-75">Text:</label>
              <input
                type="text"
                value={payload.text || ""}
                onChange={(e) => handleUpdate("payload.text", e.target.value)}
                className="w-full bg-green-50 border border-green-200 rounded px-1 py-0.5 text-xs"
                placeholder="Hello, world!"
              />
            </div>
          )}

          {payload.actionType === "selectOption" && (
            <div className="flex items-center gap-1">
              <label className="w-24 font-medium opacity-75">Value:</label>
              <input
                type="text"
                value={payload.value || ""}
                onChange={(e) => handleUpdate("payload.value", e.target.value)}
                className="w-full bg-green-50 border border-green-200 rounded px-1 py-0.5 text-xs"
                placeholder="option-1"
              />
            </div>
          )}

          {payload.actionType === "see" && (
            <div className="flex items-center gap-1">
              <label className="w-24 font-medium opacity-75">See:</label>
              <textarea
                value={payload.value || ""}
                onChange={(e) => handleUpdate("payload.value", e.target.value)}
                className="w-full bg-green-50 border border-purple-200 rounded px-1 py-0.5 text-xs h-16"
                placeholder='Form was submit successful'
              />
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} id="same-type" />
      <Handle type="source" position={Position.Bottom} id="another-type" />
    </div>
  )
}
