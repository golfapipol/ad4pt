import { type Node, type Edge } from "reactflow"

// Mermaid node shape mappings for different flowchart node types
const MERMAID_NODE_SHAPES = {
  startNode: (label: string) => `([${label}])`,     // Oval/Stadium shape for start
  endNode: (label: string) => `([${label}])`,       // Oval/Stadium shape for end
  processNode: (label: string) => `[${label}]`,     // Rectangle for process
  decisionNode: (label: string) => `{${label}}`,    // Diamond for decision
  connectorNode: (label: string) => `((${label || '•'}))`, // Circle for connector
} as const

// Interface for Mermaid conversion options
export interface MermaidConversionOptions {
  includeTitle?: boolean
  includeDescription?: boolean
  direction?: 'TD' | 'TB' | 'BT' | 'RL' | 'LR'
  theme?: string
}

// Interface for flowchart metadata
export interface FlowchartMetadata {
  title?: string
  description?: string
}

/**
 * Converts ReactFlow nodes and edges to Mermaid.js flowchart syntax
 */
export function convertToMermaid(
  nodes: Node[],
  edges: Edge[],
  metadata?: FlowchartMetadata,
  options: MermaidConversionOptions = {}
): string {
  const {
    includeTitle = true,
    includeDescription = true,
    direction = 'TD',
    theme
  } = options

  // Start building the Mermaid diagram
  let mermaidCode = `flowchart ${direction}\n`

  // Add title if provided and enabled
  if (includeTitle && metadata?.title) {
    mermaidCode = `---\ntitle: ${metadata.title}\n---\n${mermaidCode}`
  }

  // Handle empty flowchart case
  if (nodes.length === 0) {
    mermaidCode += '    %% Empty flowchart\n'
    return mermaidCode
  }

  // Convert nodes to Mermaid syntax
  const nodeDefinitions = new Set<string>()
  const nodeIdMap = new Map<string, string>()

  // Create sanitized node IDs and collect node definitions
  nodes.forEach((node, index) => {
    const sanitizedId = sanitizeNodeId(node.id)
    nodeIdMap.set(node.id, sanitizedId)
    
    const nodeLabel = getNodeLabel(node)
    const mermaidShape = getMermaidShape(node.type, nodeLabel)
    
    nodeDefinitions.add(`    ${sanitizedId}${mermaidShape}`)
  })

  // Add node definitions to the diagram
  nodeDefinitions.forEach(definition => {
    mermaidCode += definition + '\n'
  })

  // Convert edges to Mermaid connections
  if (edges.length > 0) {
    mermaidCode += '\n'
    
    edges.forEach(edge => {
      const sourceId = nodeIdMap.get(edge.source)
      const targetId = nodeIdMap.get(edge.target)
      
      if (sourceId && targetId) {
        const connection = createMermaidConnection(edge, sourceId, targetId, nodes)
        mermaidCode += `    ${connection}\n`
      }
    })
  }

  // Add description as a comment if provided and enabled
  if (includeDescription && metadata?.description) {
    mermaidCode += `\n    %% ${metadata.description}\n`
  }

  // Add theme configuration if specified
  if (theme) {
    mermaidCode += `\n%%{init: {'theme':'${theme}'}}%%\n`
  }

  return mermaidCode
}

/**
 * Sanitizes node IDs to be valid Mermaid identifiers
 */
function sanitizeNodeId(id: string): string {
  // Replace invalid characters with underscores and ensure it starts with a letter
  const sanitized = id.replace(/[^a-zA-Z0-9_]/g, '_')
  return sanitized.match(/^[a-zA-Z]/) ? sanitized : `node_${sanitized}`
}

/**
 * Extracts the appropriate label from a node
 */
function getNodeLabel(node: Node): string {
  const data = node.data
  
  // Handle different node types and their label properties
  if (data?.label) {
    return data.label
  }
  
  // Fallback based on node type
  switch (node.type) {
    case 'startNode':
      return data?.nodeType === 'end' ? 'End' : 'Start'
    case 'endNode':
      return 'End'
    case 'processNode':
      return 'Process'
    case 'decisionNode':
      return 'Decision?'
    case 'connectorNode':
      return data?.label || '•'
    default:
      return 'Node'
  }
}

/**
 * Gets the appropriate Mermaid shape for a node type and label
 */
function getMermaidShape(nodeType: string | undefined, label: string): string {
  const escapedLabel = escapeLabel(label)
  
  switch (nodeType) {
    case 'startNode':
    case 'endNode':
      return MERMAID_NODE_SHAPES.startNode(escapedLabel)
    case 'processNode':
      return MERMAID_NODE_SHAPES.processNode(escapedLabel)
    case 'decisionNode':
      return MERMAID_NODE_SHAPES.decisionNode(escapedLabel)
    case 'connectorNode':
      return MERMAID_NODE_SHAPES.connectorNode(escapedLabel)
    default:
      // Default to rectangle for unknown types
      return `[${escapedLabel}]`
  }
}

/**
 * Escapes special characters in labels for Mermaid syntax
 */
function escapeLabel(label: string): string {
  // Escape quotes and special characters that could break Mermaid syntax
  return label
    .replace(/"/g, '#quot;')
    .replace(/'/g, '#apos;')
    .replace(/\n/g, '<br/>')
    .replace(/\r/g, '')
    .trim()
}

/**
 * Creates a Mermaid connection string from an edge
 */
function createMermaidConnection(
  edge: Edge,
  sourceId: string,
  targetId: string,
  nodes: Node[]
): string {
  // Find source node to determine connection type
  const sourceNode = nodes.find(node => node.id === edge.source)
  
  // Handle decision node connections with labels
  if (sourceNode?.type === 'decisionNode') {
    const edgeLabel = getDecisionEdgeLabel(edge, sourceNode)
    if (edgeLabel) {
      return `${sourceId} -->|${edgeLabel}| ${targetId}`
    }
  }
  
  // Handle regular connections
  if (edge.label) {
    const escapedLabel = escapeLabel(String(edge.label))
    return `${sourceId} -->|${escapedLabel}| ${targetId}`
  }
  
  // Default arrow connection
  return `${sourceId} --> ${targetId}`
}

/**
 * Gets the appropriate label for decision node edges
 */
function getDecisionEdgeLabel(edge: Edge, sourceNode: Node): string | null {
  const data = sourceNode.data
  
  // Map source handle to appropriate label
  if (edge.sourceHandle === 'decision-yes') {
    return data?.yesLabel || 'Yes'
  } else if (edge.sourceHandle === 'decision-no') {
    return data?.noLabel || 'No'
  }
  
  return null
}

/**
 * Validates if a flowchart can be converted to Mermaid
 */
export function validateFlowchartForMermaid(nodes: Node[], edges: Edge[]): {
  isValid: boolean
  warnings: string[]
  errors: string[]
} {
  const warnings: string[] = []
  const errors: string[] = []
  
  // Check for empty flowchart
  if (nodes.length === 0) {
    warnings.push('Flowchart is empty')
  }
  
  // Check for disconnected nodes
  const connectedNodeIds = new Set<string>()
  edges.forEach(edge => {
    connectedNodeIds.add(edge.source)
    connectedNodeIds.add(edge.target)
  })
  
  const disconnectedNodes = nodes.filter(node => !connectedNodeIds.has(node.id))
  if (disconnectedNodes.length > 0) {
    warnings.push(`${disconnectedNodes.length} disconnected node(s) found`)
  }
  
  // Check for nodes with very long labels
  nodes.forEach(node => {
    const label = getNodeLabel(node)
    if (label.length > 50) {
      warnings.push(`Node "${node.id}" has a very long label (${label.length} characters)`)
    }
  })
  
  // // Check for circular references (basic check)
  // const hasCircularReference = detectCircularReferences(nodes, edges)
  // if (hasCircularReference) {
  //   warnings.push('Potential circular references detected in flowchart')
  // }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors
  }
}

/**
 * Basic circular reference detection
 */
function detectCircularReferences(nodes: Node[], edges: Edge[]): boolean {
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  
  // Build adjacency list
  const adjacencyList = new Map<string, string[]>()
  nodes.forEach(node => {
    adjacencyList.set(node.id, [])
  })
  
  edges.forEach(edge => {
    const neighbors = adjacencyList.get(edge.source) || []
    neighbors.push(edge.target)
    adjacencyList.set(edge.source, neighbors)
  })
  
  // DFS to detect cycles
  function hasCycle(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) {
      return true
    }
    
    if (visited.has(nodeId)) {
      return false
    }
    
    visited.add(nodeId)
    recursionStack.add(nodeId)
    
    const neighbors = adjacencyList.get(nodeId) || []
    for (const neighbor of neighbors) {
      if (hasCycle(neighbor)) {
        return true
      }
    }
    
    recursionStack.delete(nodeId)
    return false
  }
  
  // Check each node for cycles
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (hasCycle(node.id)) {
        return true
      }
    }
  }
  
  return false
}

/**
 * Generates a preview of the Mermaid code with syntax highlighting hints
 */
export function generateMermaidPreview(mermaidCode: string): {
  code: string
  lineCount: number
  characterCount: number
} {
  return {
    code: mermaidCode,
    lineCount: mermaidCode.split('\n').length,
    characterCount: mermaidCode.length
  }
}