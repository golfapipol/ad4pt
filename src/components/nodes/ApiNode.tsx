import { useState } from "react"
import { type NodeProps, Handle, Position } from "reactflow"
import { Globe, Plus, Trash2 } from "lucide-react"

// Helper function to convert headers array to JSON string
const headersToJson = (headers: { key: string; value: string }[]) => {
  return JSON.stringify(
    headers.reduce((obj, item) => {
      if (item.key) {
        obj[item.key] = item.value
      }
      return obj
    }, {} as Record<string, string>),
    null,
    2
  )
}

export function ApiNode({ data, selected }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [label, setLabel] = useState(data.label || "API")

  // New fields state
  const [url, setUrl] = useState(data.url || "")
  const [method, setMethod] = useState(data.method || "GET")
  const [requestHeaders, setRequestHeaders] = useState(data.requestHeaders || [{ key: "", value: "" }])
  const [requestBody, setRequestBody] = useState(data.requestBody || "")
  const [status, setStatus] = useState(data.status || "200")
  const [responseHeaders, setResponseHeaders] = useState(data.responseHeaders || [{ key: "", value: "" }])
  const [responseBody, setResponseBody] = useState(data.body || "")

  const handleUpdate = (field: string, value: any) => {
    data.onUpdate?.(data.id, { [field]: value })
  }

  const handleHeaderChange = (
    index: number,
    field: "key" | "value",
    value: string,
    type: "request" | "response"
  ) => {
    const headers = type === "request" ? [...requestHeaders] : [...responseHeaders]
    headers[index][field] = value
    if (type === "request") {
      setRequestHeaders(headers)
      handleUpdate("requestHeaders", headers)
    } else {
      setResponseHeaders(headers)
      handleUpdate("responseHeaders", headers)
    }
  }

  const addHeader = (type: "request" | "response") => {
    if (type === "request") {
      const newHeaders = [...requestHeaders, { key: "", value: "" }]
      setRequestHeaders(newHeaders)
      handleUpdate("requestHeaders", newHeaders)
    } else {
      const newHeaders = [...responseHeaders, { key: "", value: "" }]
      setResponseHeaders(newHeaders)
      handleUpdate("responseHeaders", newHeaders)
    }
  }

  const removeHeader = (index: number, type: "request" | "response") => {
    if (type === "request") {
      const newHeaders = requestHeaders.filter((_, i) => i !== index)
      setRequestHeaders(newHeaders)
      handleUpdate("requestHeaders", newHeaders)
    } else {
      const newHeaders = responseHeaders.filter((_, i) => i !== index)
      setResponseHeaders(newHeaders)
      handleUpdate("responseHeaders", newHeaders)
    }
  }

  return (
    <div
      className={`px-4 py-3 bg-white border-2 rounded-lg shadow-md min-w-[300px] ${
        selected ? "border-blue-500" : "border-gray-300"
      } bg-purple-100 text-purple-700`}
    >
      <Handle type="target" position={Position.Top} id="another-type" />
      <Handle type="target" position={Position.Left} id="same-type" />
      <div className="flex items-center gap-2 mb-2">
        <Globe className="w-4 h-4" />
        <span className="text-xs font-medium opacity-75">API</span>
      </div>
      {isEditing ? (
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => {
            setIsEditing(false)
            handleUpdate("label", label)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setIsEditing(false)
              handleUpdate("label", label)
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
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={() => handleUpdate("url", url)}
                className="w-full bg-purple-50 border border-purple-200 rounded px-1 py-0.5 text-xs"
                placeholder="/api/v1/users"
              />
            </div>
            <div className="flex items-center gap-1">
              <label className="w-14 font-medium opacity-75">Method:</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                onBlur={() => handleUpdate("method", method)}
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
                {requestHeaders.map((header, index) => (
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
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                onBlur={() => handleUpdate("requestBody", requestBody)}
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
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                onBlur={() => handleUpdate("status", status)}
                className="w-full bg-purple-50 border border-purple-200 rounded px-1 py-0.5 text-xs"
                placeholder="200"
              />
            </div>
            <div>
              <label className="block font-medium opacity-75 mb-0.5">Headers:</label>
              <div className="space-y-1">
                {responseHeaders.map((header, index) => (
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
                value={responseBody}
                onChange={(e) => setResponseBody(e.target.value)}
                onBlur={() => handleUpdate("body", responseBody)}
                className="w-full bg-purple-50 border border-purple-200 rounded px-1 py-0.5 text-xs h-16"
                placeholder='{ "message": "Success" }'
              />
            </div>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} id="same-type" />
      <Handle type="source" position={Position.Bottom} id="another-type" />
    </div>
  )
}
