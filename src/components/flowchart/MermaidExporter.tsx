import { useState, useCallback, useEffect } from "react"
import { type Node, type Edge } from "reactflow"
import { X, Copy, Download, CheckCircle, AlertTriangle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  convertToMermaid,
  validateFlowchartForMermaid,
  generateMermaidPreview,
  type FlowchartMetadata,
  type MermaidConversionOptions
} from "@/lib/mermaidConverter"

// Component for displaying formatted Mermaid code with syntax highlighting
function MermaidCodeDisplay({ code }: { code: string }) {
  const lines = code.split('\n')

  const formatLine = (line: string, index: number) => {
    const trimmedLine = line.trim()
    let className = "text-gray-800"

    // Apply basic syntax highlighting based on Mermaid patterns
    if (trimmedLine.startsWith('---')) {
      className = "text-purple-600 font-medium" // Front matter
    } else if (trimmedLine.startsWith('title:')) {
      className = "text-purple-600 font-medium" // Title
    } else if (trimmedLine.startsWith('flowchart')) {
      className = "text-blue-600 font-semibold" // Flowchart declaration
    } else if (trimmedLine.startsWith('%%')) {
      className = "text-green-600 italic" // Comments
    } else if (trimmedLine.includes('-->')) {
      // Connection lines - highlight the arrow separately
      className = "text-orange-600"
    } else if (trimmedLine.match(/^\s*\w+\[.*\]$/)) {
      // Rectangle nodes
      className = "text-indigo-600"
    } else if (trimmedLine.match(/^\s*\w+\{.*\}$/)) {
      // Diamond nodes
      className = "text-pink-600"
    } else if (trimmedLine.match(/^\s*\w+\(\[.*\]\)$/)) {
      // Oval nodes
      className = "text-teal-600"
    } else if (trimmedLine.match(/^\s*\w+\(\(.*\)\)$/)) {
      // Circle nodes
      className = "text-cyan-600"
    }

    // Split line to highlight arrows separately
    const parts = line.split('-->')

    return (
      <div key={index} className="flex">
        <span className="text-gray-400 text-xs w-8 flex-shrink-0 text-right pr-2 select-none">
          {index + 1}
        </span>
        <span className={`${className} font-mono text-sm leading-relaxed`}>
          {parts.length > 1 ? (
            <>
              {parts[0]}
              <span className="text-red-500 font-bold">{'-->'}</span>
              {parts.slice(1).join('-->')}
            </>
          ) : (
            line
          )}
        </span>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white">
      <div className="space-y-1">
        {lines.map(formatLine)}
      </div>
    </div>
  )
}

interface MermaidExporterProps {
  isOpen: boolean
  onClose: () => void
  nodes: Node[]
  edges: Edge[]
  metadata?: FlowchartMetadata
}

export function MermaidExporter({
  isOpen,
  onClose,
  nodes,
  edges,
  metadata
}: MermaidExporterProps) {
  const [mermaidCode, setMermaidCode] = useState("")
  const [copySuccess, setCopySuccess] = useState(false)
  const [conversionOptions, setConversionOptions] = useState<MermaidConversionOptions>({
    includeTitle: true,
    includeDescription: true,
    direction: 'TD'
  })
  const [validation, setValidation] = useState<{
    isValid: boolean
    warnings: string[]
    errors: string[]
  }>({ isValid: true, warnings: [], errors: [] })

  // Generate Mermaid code when component opens or options change
  const generateMermaidCode = useCallback(() => {
    const code = convertToMermaid(nodes, edges, metadata, conversionOptions)
    setMermaidCode(code)

    // Validate the flowchart
    const validationResult = validateFlowchartForMermaid(nodes, edges)
    setValidation(validationResult)
  }, [nodes, edges, metadata, conversionOptions])

  // Generate code when modal opens or dependencies change
  useEffect(() => {
    if (isOpen) {
      generateMermaidCode()
    }
  }, [isOpen, generateMermaidCode])

  // Copy to clipboard functionality
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = mermaidCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }, [mermaidCode])

  // Download as file functionality
  const downloadAsFile = useCallback(() => {
    const blob = new Blob([mermaidCode], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${metadata?.title || 'flowchart'}.mmd`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [mermaidCode, metadata?.title])

  // Handle direction change
  const handleDirectionChange = useCallback((direction: MermaidConversionOptions['direction']) => {
    setConversionOptions(prev => ({ ...prev, direction }))
  }, [])

  // Handle option toggles
  const handleOptionToggle = useCallback((option: keyof MermaidConversionOptions) => {
    setConversionOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }))
  }, [])

  // Get preview statistics
  const preview = generateMermaidPreview(mermaidCode)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Export to Mermaid.js
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Validation Messages */}
          {validation.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                <AlertTriangle className="w-4 h-4" />
                Errors
              </div>
              <ul className="text-sm text-red-600 space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex items-center gap-2 text-yellow-700 font-medium mb-2">
                <AlertTriangle className="w-4 h-4" />
                Warnings
              </div>
              <ul className="text-sm text-yellow-600 space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 flex flex-col min-h-0">
          {/* Export Options */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-3">Export Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Direction Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Direction</label>
                <select
                  value={conversionOptions.direction}
                  onChange={(e) => handleDirectionChange(e.target.value as MermaidConversionOptions['direction'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="TD">Top to Bottom (TD)</option>
                  <option value="TB">Top to Bottom (TB)</option>
                  <option value="BT">Bottom to Top (BT)</option>
                  <option value="RL">Right to Left (RL)</option>
                  <option value="LR">Left to Right (LR)</option>
                </select>
              </div>

              {/* Include Options */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Include</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={conversionOptions.includeTitle}
                      onChange={() => handleOptionToggle('includeTitle')}
                      className="rounded"
                    />
                    <span className="text-sm">Title</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={conversionOptions.includeDescription}
                      onChange={() => handleOptionToggle('includeDescription')}
                      className="rounded"
                    />
                    <span className="text-sm">Description</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Code Preview */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Generated Mermaid Code</h3>
              <div className="text-sm text-gray-500">
                {preview.lineCount} lines • {preview.characterCount} characters
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <div className="h-full border rounded-md bg-gray-50 overflow-hidden">
                <div className="h-full overflow-auto">
                  {mermaidCode ? (
                    <MermaidCodeDisplay code={mermaidCode} />
                  ) : (
                    <div className="p-4 text-gray-500 text-sm font-mono">
                      Generated Mermaid code will appear here...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-gray-500">
              Copy this code to use in Mermaid.js compatible tools
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={downloadAsFile}
                disabled={!mermaidCode.trim()}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button
                onClick={copyToClipboard}
                disabled={!mermaidCode.trim()}
                className="flex items-center gap-2"
              >
                {copySuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}