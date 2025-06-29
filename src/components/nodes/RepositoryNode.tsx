import { useState } from "react"
import { type NodeProps, Handle, Position } from "reactflow"
import { Database } from "lucide-react"

export function RepositoryNode({ id, data, selected }: NodeProps) {
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
      } bg-yellow-100 text-yellow-700`}
    >
      <Handle type="target" position={Position.Top} id="another-type" />
      <Handle type="target" position={Position.Left} id="same-type" />
      <div className="flex items-center gap-2 mb-2">
        <Database className="w-4 h-4" />
        <span className="text-xs font-medium opacity-75">Repository</span>
      </div>
      {isEditing ? (
        <input
          value={label || "Repository"}
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
          {label || "Repository"}
        </div>
      )}

      {/* New Fields */}
      <div className="nodrag mt-2 pt-2 border-t border-yellow-200 space-y-2">
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1">
            <label className="w-20 font-medium opacity-75">Type:</label>
            <select
              value={payload.databaseType || "PostgreSQL"}
              onChange={(e) => handleUpdate("payload.database", e.target.value)}
              className="w-full bg-yellow-50 border border-yellow-200 rounded px-1 py-0.5 text-xs"
            >
              <option>PostgreSQL</option>
              <option>MongoDB</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <label className="w-20 font-medium opacity-75">Schema:</label>
            <input
              type="text"
              value={payload.schema || ""}
              onChange={(e) => handleUpdate("payload.schema", e.target.value)}
              className="w-full bg-yellow-50 border border-yellow-200 rounded px-1 py-0.5 text-xs"
              placeholder="schema"
            />
          </div>
          <div className="flex items-center gap-1">
            <label className="w-20 font-medium opacity-75">Action:</label>
            <select
              value={payload.action || "select"}
              onChange={(e) => handleUpdate("payload.action", e.target.value)}
              className="w-full bg-yellow-50 border border-yellow-200 rounded px-1 py-0.5 text-xs"
            >
              <option>select</option>
              <option>insert/update</option>
              <option>delete</option>
            </select>
          </div>
          <div>
            <label className="block font-medium opacity-75 mb-0.5">Query:</label>
            <textarea
              value={payload.query || ""}
              onChange={(e) => handleUpdate("payload.query", e.target.value)}
              className="w-full bg-yellow-50 border border-yellow-200 rounded px-1 py-0.5 text-xs h-24"
              placeholder="SELECT * FROM users;"
            />
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} id="same-type" />
      <Handle type="source" position={Position.Bottom} id="another-type" />
    </div>
  )
}
