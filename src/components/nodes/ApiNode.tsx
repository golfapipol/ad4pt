import { useState } from "react"
import { type NodeProps, Handle, Position } from "reactflow"
import { Globe, Plus, Trash2 } from "lucide-react"

export function ApiNode({ id, data, selected }: NodeProps) {
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

  const handleHeaderChange = (
    index: number,
    field: "key" | "value",
    value: string,
    type: "request" | "response"
  ) => {
    const headersField = type === "request" ? "requestHeaders" : "responseHeaders"
    const oldHeaders = payload[headersField] || []
    const newHeaders = [...oldHeaders]
    newHeaders[index] = { ...newHeaders[index], [field]: value }
    handleUpdate(`payload.${headersField}`, newHeaders)
  }

  const addHeader = (type: "request" | "response") => {
    const headersField = type === "request" ? "requestHeaders" : "responseHeaders"
    const oldHeaders = payload[headersField] || []
    const newHeaders = [...oldHeaders, { key: "", value: "" }]
    handleUpdate(`payload.${headersField}`, newHeaders)
  }

  const removeHeader = (index: number, type: "request" | "response") => {
    const headersField = type === "request" ? "requestHeaders" : "responseHeaders"
    const oldHeaders = payload[headersField] || []
    const newHeaders = oldHeaders.filter((_: any, i: number) => i !== index)
    handleUpdate(`payload.${headersField}`, newHeaders)
  }

  return (
    <div
      className={`px-4 py-3 bg-white border-2 rounded-lg shadow-md min-w-[300px] ${
        selected ? "border-blue-500" : "border-gray-300"
      } bg-purple-100 text-purple-700`}
    >
      <Handle type="target" position={Position.Top} id="another-type" />
      <div className="flex items-center gap-2 mb-2">
        <Globe className="w-4 h-4" />
        <span className="text-xs font-medium opacity-75">API</span>
      </div>
      {isEditing ? (
        <input
          value={label || "API"}
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
          {label || "API"}
        </div>
      )}

      {/* New Fields */}
      <div className="nodrag mt-2 pt-2 border-t border-purple-200 space-y-2">
        {/* Request Section */}
        <div>
          <div className="text-xs font-bold mb-1">Request</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1">
              <label className="w-14 font-medium opacity-75">URL:</label>
              <input
                type="text"
                value={payload.url || ""}
                onChange={(e) => handleUpdate("payload.url", e.target.value)}
                className="w-full bg-purple-50 border border-purple-200 rounded px-1 py-0.5 text-xs"
                placeholder="/api/v1/users"
              />
            </div>
            <div className="flex items-center gap-1">
              <label className="w-14 font-medium opacity-75">Method:</label>
              <select
                value={payload.method || "GET"}
                onChange={(e) => handleUpdate("payload.method", e.target.value)}
                className="w-full bg-purple-50 border border-purple-200 rounded px-1 py-0.5 text-xs"
              >
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>DELETE</option>
                <option>PATCH</option>
              </select>
            </div>
            <div>
              <label className="block font-medium opacity-75 mb-0.5">Headers:</label>
              <div className="space-y-1">
                {(payload.requestHeaders || []).map((header: { key: string; value: string }, index: number) => (
                  <div key={index} className="flex items-center gap-1">
                    <input
                      type="text"
                      value={header.key}
                      onChange={(e) => handleHeaderChange(index, "key", e.target.value, "request")}
                      className="w-full bg-purple-50 border border-purple-200 rounded px-1 py-0.5 text-xs"
                      placeholder="Key"
                    />
                    <input
                      type="text"
                      value={header.value}
                      onChange={(e) => handleHeaderChange(index, "value", e.target.value, "request")}
                      className="w-full bg-purple-50 border border-purple-200 rounded px-1 py-0.5 text-xs"
                      placeholder="Value"
                    />
                    <button onClick={() => removeHeader(index, "request")} className="p-1 text-purple-400 hover:text-purple-600">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => addHeader("request")} className="mt-1 flex items-center gap-1 text-xs text-purple-500 hover:text-purple-700">
                <Plus className="w-3 h-3" /> Add Header
              </button>
            </div>
            <div>
              <label className="block font-medium opacity-75 mb-0.5">Body:</label>
              <textarea
                value={payload.requestBody || ""}
                onChange={(e) => handleUpdate("payload.requestBody", e.target.value)}
                className="w-full bg-purple-50 border border-purple-200 rounded px-1 py-0.5 text-xs h-16"
                placeholder='{ "data": "example" }'
              />
            </div>
          </div>
        </div>

        {/* Response Section */}
        <div>
          <div className="text-xs font-bold mt-2 mb-1 pt-2 border-t border-purple-200">Response</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1">
              <label className="w-14 font-medium opacity-75">Status:</label>
              <input
                type="text"
                value={payload.status || "200"}
                onChange={(e) => handleUpdate("payload.status", e.target.value)}
                className="w-full bg-purple-50 border border-purple-200 rounded px-1 py-0.5 text-xs"
                placeholder="200"
              />
            </div>
            <div>
              <label className="block font-medium opacity-75 mb-0.5">Headers:</label>
              <div className="space-y-1">
                {(payload.responseHeaders || []).map((header: { key: string; value: string }, index: number) => (
                  <div key={index} className="flex items-center gap-1">
                    <input
                      type="text"
                      value={header.key}
                      onChange={(e) => handleHeaderChange(index, "key", e.target.value, "response")}
                      className="w-full bg-purple-50 border border-purple-200 rounded px-1 py-0.5 text-xs"
                      placeholder="Key"
                    />
                    <input
                      type="text"
                      value={header.value}
                      onChange={(e) => handleHeaderChange(index, "value", e.target.value, "response")}
                      className="w-full bg-purple-50 border border-purple-200 rounded px-1 py-0.5 text-xs"
                      placeholder="Value"
                    />
                    <button onClick={() => removeHeader(index, "response")} className="p-1 text-purple-400 hover:text-purple-600">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => addHeader("response")} className="mt-1 flex items-center gap-1 text-xs text-purple-500 hover:text-purple-700">
                <Plus className="w-3 h-3" /> Add Header
              </button>
            </div>
            <div>
              <label className="block font-medium opacity-75 mb-0.5">Body:</label>
              <textarea
                value={payload.responseBody || ""}
                onChange={(e) => handleUpdate("payload.responseBody", e.target.value)}
                className="w-full bg-purple-50 border border-purple-200 rounded px-1 py-0.5 text-xs h-16"
                placeholder='{ "message": "Success" }'
              />
            </div>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} id="another-type" />
    </div>
  )
}
