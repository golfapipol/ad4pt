import { type Node, type Edge } from "reactflow"

export interface FlowchartData {
  id: string
  title: string
  description?: string
  nodes: Node[]
  edges: Edge[]
  createdAt: Date
  updatedAt: Date
  version: string
}

export interface FlowchartMetadata {
  title: string
  description: string
  createdAt: Date
  updatedAt: Date
}

const STORAGE_KEY = "flowchart-editor-data"
const CURRENT_VERSION = "1.0.0"

// Error types for better error handling
export class FlowchartStorageError extends Error {
  constructor(message: string, cause?: Error) {
    super(message, { cause })
    this.name = "FlowchartStorageError"
  }
}

// Check if localStorage is available
function isLocalStorageAvailable(): boolean {
  try {
    const test = "__localStorage_test__"
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

// Generate unique ID for flowcharts
function generateId(): string {
  return `flowchart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Serialize dates for storage
function serializeFlowchartData(data: FlowchartData): string {
  return JSON.stringify({
    ...data,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  })
}

// Deserialize dates from storage
function deserializeFlowchartData(jsonString: string): FlowchartData {
  const data = JSON.parse(jsonString)
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  }
}

// Save flowchart data to localStorage
export function saveFlowchartData(
  nodes: Node[],
  edges: Edge[],
  metadata: FlowchartMetadata,
  existingId?: string
): FlowchartData {
  if (!isLocalStorageAvailable()) {
    throw new FlowchartStorageError("localStorage is not available in this browser")
  }

  try {
    const flowchartData: FlowchartData = {
      id: existingId || generateId(),
      title: metadata.title,
      description: metadata.description,
      nodes,
      edges,
      createdAt: existingId ? metadata.createdAt : new Date(),
      updatedAt: new Date(),
      version: CURRENT_VERSION,
    }

    const serializedData = serializeFlowchartData(flowchartData)
    
    // Check storage quota
    const currentSize = new Blob([serializedData]).size
    if (currentSize > 5 * 1024 * 1024) { // 5MB limit
      throw new FlowchartStorageError("Flowchart data is too large to save (exceeds 5MB)")
    }

    localStorage.setItem(STORAGE_KEY, serializedData)
    return flowchartData
  } catch (error) {
    if (error instanceof FlowchartStorageError) {
      throw error
    }
    
    if (error instanceof Error && error.name === "QuotaExceededError") {
      throw new FlowchartStorageError("Storage quota exceeded. Please clear some space and try again.")
    }
    
    throw new FlowchartStorageError("Failed to save flowchart data", error as Error)
  }
}

// Load flowchart data from localStorage
export function loadFlowchartData(): FlowchartData | null {
  if (!isLocalStorageAvailable()) {
    console.warn("localStorage is not available in this browser")
    return null
  }

  try {
    const storedData = localStorage.getItem(STORAGE_KEY)
    if (!storedData) {
      return null
    }

    const flowchartData = deserializeFlowchartData(storedData)
    
    // Validate data structure
    if (!flowchartData.id || !flowchartData.version || !Array.isArray(flowchartData.nodes) || !Array.isArray(flowchartData.edges)) {
      throw new FlowchartStorageError("Invalid flowchart data structure")
    }

    // Handle version compatibility
    if (flowchartData.version !== CURRENT_VERSION) {
      console.warn(`Flowchart data version mismatch. Expected ${CURRENT_VERSION}, got ${flowchartData.version}`)
      // For now, we'll try to load it anyway, but in the future we might need migration logic
    }

    return flowchartData
  } catch (error) {
    if (error instanceof FlowchartStorageError) {
      throw error
    }
    
    console.error("Failed to load flowchart data:", error)
    // Clear corrupted data
    localStorage.removeItem(STORAGE_KEY)
    throw new FlowchartStorageError("Failed to load flowchart data. The stored data may be corrupted.", error as Error)
  }
}

// Clear flowchart data from localStorage
export function clearFlowchartData(): void {
  if (!isLocalStorageAvailable()) {
    throw new FlowchartStorageError("localStorage is not available in this browser")
  }

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    throw new FlowchartStorageError("Failed to clear flowchart data", error as Error)
  }
}

// Check if there's saved flowchart data
export function hasSavedFlowchartData(): boolean {
  if (!isLocalStorageAvailable()) {
    return false
  }

  try {
    return localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}

// Auto-save functionality with debouncing
let autoSaveTimeout: NodeJS.Timeout | null = null

export function autoSaveFlowchartData(
  nodes: Node[],
  edges: Edge[],
  metadata: FlowchartMetadata,
  existingId?: string,
  delay: number = 2000
): Promise<FlowchartData> {
  return new Promise((resolve, reject) => {
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }

    // Set new timeout for auto-save
    autoSaveTimeout = setTimeout(() => {
      try {
        const savedData = saveFlowchartData(nodes, edges, metadata, existingId)
        resolve(savedData)
      } catch (error) {
        reject(error)
      }
    }, delay)
  })
}

// Export flowchart data to file
export function exportFlowchartToFile(data: FlowchartData): void {
  try {
    const serializedData = serializeFlowchartData(data)
    const blob = new Blob([serializedData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement("a")
    link.href = url
    link.download = `${data.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_flowchart.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  } catch (error) {
    throw new FlowchartStorageError("Failed to export flowchart to file", error as Error)
  }
}

// Import flowchart data from file
export function importFlowchartFromFile(file: File): Promise<FlowchartData> {
  return new Promise((resolve, reject) => {
    if (!file.type.includes("json")) {
      reject(new FlowchartStorageError("Invalid file type. Please select a JSON file."))
      return
    }

    const reader = new FileReader()
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const flowchartData = deserializeFlowchartData(content)
        
        // Validate imported data
        if (!flowchartData.id || !Array.isArray(flowchartData.nodes) || !Array.isArray(flowchartData.edges)) {
          throw new FlowchartStorageError("Invalid flowchart file format")
        }
        
        resolve(flowchartData)
      } catch (error) {
        reject(new FlowchartStorageError("Failed to import flowchart file", error as Error))
      }
    }
    
    reader.onerror = () => {
      reject(new FlowchartStorageError("Failed to read flowchart file"))
    }
    
    reader.readAsText(file)
  })
}

// Create a new empty flowchart with optional template
export function createNewFlowchart(template?: 'empty' | 'basic' | 'decision'): FlowchartData {
  const now = new Date()
  const baseFlowchart: FlowchartData = {
    id: generateId(),
    title: "New Flowchart",
    description: "",
    nodes: [],
    edges: [],
    createdAt: now,
    updatedAt: now,
    version: CURRENT_VERSION,
  }

  // Add template nodes if specified
  switch (template) {
    case 'basic':
      baseFlowchart.title = "Basic Process Flow"
      baseFlowchart.nodes = [
        {
          id: 'start-0',
          type: 'startNode',
          position: { x: 250, y: 50 },
          data: {
            label: 'Start',
            nodeType: 'start',
            backgroundColor: '#dcfce7',
            textColor: '#15803d'
          }
        },
        {
          id: 'process-1',
          type: 'processNode',
          position: { x: 200, y: 150 },
          data: {
            label: 'Process Step',
            description: '',
            backgroundColor: '#dbeafe',
            textColor: '#1d4ed8'
          }
        },
        {
          id: 'end-2',
          type: 'endNode',
          position: { x: 250, y: 250 },
          data: {
            label: 'End',
            nodeType: 'end',
            backgroundColor: '#fee2e2',
            textColor: '#dc2626'
          }
        }
      ]
      baseFlowchart.edges = [
        {
          id: 'e-start-0-process-1',
          source: 'start-0',
          target: 'process-1',
          type: 'default',
          animated: false,
          style: { stroke: '#374151', strokeWidth: 2 },
          markerEnd: { type: 'arrowclosed', color: '#374151', width: 20, height: 20 }
        },
        {
          id: 'e-process-1-end-2',
          source: 'process-1',
          target: 'end-2',
          type: 'default',
          animated: false,
          style: { stroke: '#374151', strokeWidth: 2 },
          markerEnd: { type: 'arrowclosed', color: '#374151', width: 20, height: 20 }
        }
      ]
      break

    case 'decision':
      baseFlowchart.title = "Decision Flow"
      baseFlowchart.nodes = [
        {
          id: 'start-0',
          type: 'startNode',
          position: { x: 250, y: 50 },
          data: {
            label: 'Start',
            nodeType: 'start',
            backgroundColor: '#dcfce7',
            textColor: '#15803d'
          }
        },
        {
          id: 'decision-1',
          type: 'decisionNode',
          position: { x: 200, y: 150 },
          data: {
            label: 'Decision?',
            yesLabel: 'Yes',
            noLabel: 'No',
            backgroundColor: '#fef3c7',
            textColor: '#d97706'
          }
        },
        {
          id: 'process-2',
          type: 'processNode',
          position: { x: 100, y: 250 },
          data: {
            label: 'Yes Path',
            description: '',
            backgroundColor: '#dbeafe',
            textColor: '#1d4ed8'
          }
        },
        {
          id: 'process-3',
          type: 'processNode',
          position: { x: 300, y: 250 },
          data: {
            label: 'No Path',
            description: '',
            backgroundColor: '#dbeafe',
            textColor: '#1d4ed8'
          }
        },
        {
          id: 'end-4',
          type: 'endNode',
          position: { x: 250, y: 350 },
          data: {
            label: 'End',
            nodeType: 'end',
            backgroundColor: '#fee2e2',
            textColor: '#dc2626'
          }
        }
      ]
      baseFlowchart.edges = [
        {
          id: 'e-start-0-decision-1',
          source: 'start-0',
          target: 'decision-1',
          type: 'default',
          animated: false,
          style: { stroke: '#374151', strokeWidth: 2 },
          markerEnd: { type: 'arrowclosed', color: '#374151', width: 20, height: 20 }
        },
        {
          id: 'e-decision-1-process-2',
          source: 'decision-1',
          target: 'process-2',
          type: 'default',
          animated: false,
          style: { stroke: '#374151', strokeWidth: 2 },
          markerEnd: { type: 'arrowclosed', color: '#374151', width: 20, height: 20 },
          label: 'Yes'
        },
        {
          id: 'e-decision-1-process-3',
          source: 'decision-1',
          target: 'process-3',
          type: 'default',
          animated: false,
          style: { stroke: '#374151', strokeWidth: 2 },
          markerEnd: { type: 'arrowclosed', color: '#374151', width: 20, height: 20 },
          label: 'No'
        },
        {
          id: 'e-process-2-end-4',
          source: 'process-2',
          target: 'end-4',
          type: 'default',
          animated: false,
          style: { stroke: '#374151', strokeWidth: 2 },
          markerEnd: { type: 'arrowclosed', color: '#374151', width: 20, height: 20 }
        },
        {
          id: 'e-process-3-end-4',
          source: 'process-3',
          target: 'end-4',
          type: 'default',
          animated: false,
          style: { stroke: '#374151', strokeWidth: 2 },
          markerEnd: { type: 'arrowclosed', color: '#374151', width: 20, height: 20 }
        }
      ]
      break

    case 'empty':
    default:
      // Empty flowchart - no additional setup needed
      break
  }

  return baseFlowchart
}