import { useState } from "react"
import { type NodeProps, Handle, Position } from "reactflow"
import { HelpCircle } from "lucide-react"

interface DecisionNodeData {
  label: string
  yesLabel?: string
  noLabel?: string
  backgroundColor?: string
  textColor?: string
  onUpdate?: (id: string, updates: object) => void
}

// Extend NodeProps to include id
interface DecisionNodeProps extends NodeProps<DecisionNodeData> {
  id: string
}

export function DecisionNode({ data, selected, id }: DecisionNodeProps) {
  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const [isEditingYes, setIsEditingYes] = useState(false)
  const [isEditingNo, setIsEditingNo] = useState(false)
  const [label, setLabel] = useState(data.label || "Decision?")
  const [yesLabel, setYesLabel] = useState(data.yesLabel || "Yes")
  const [noLabel, setNoLabel] = useState(data.noLabel || "No")

  const handleLabelUpdate = () => {
    setIsEditingLabel(false)
    data.onUpdate?.(id, { label })
  }

  const handleYesLabelUpdate = () => {
    setIsEditingYes(false)
    data.onUpdate?.(id, { yesLabel })
  }

  const handleNoLabelUpdate = () => {
    setIsEditingNo(false)
    data.onUpdate?.(id, { noLabel })
  }

  const backgroundColor = data.backgroundColor || 'bg-yellow-100'
  const textColor = data.textColor || 'text-yellow-700'
  const borderColor = selected ? 'border-blue-500' : 'border-yellow-300'

  return (
    <div 
      className="relative"
      role="button"
      tabIndex={0}
      aria-label={`Decision node: ${label}. Yes option: ${yesLabel}. No option: ${noLabel}. Double-click to edit.`}
      aria-describedby={`${id}-description`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setIsEditingLabel(true)
        }
      }}
    >
      {/* Diamond shape using CSS transform */}
      <div
        className={`w-32 h-32 border-2 shadow-md transform rotate-45 ${backgroundColor} ${borderColor}`}
        style={{
          backgroundColor: data.backgroundColor,
        }}
      >
        {/* Input handle at top */}
        <Handle 
          type="target" 
          position={Position.Top} 
          id="decision-input"
          style={{ 
            top: '-8px', 
            left: '50%', 
            transform: 'translateX(-50%) rotate(-45deg)' 
          }}
        />
        
        {/* Yes output handle at right */}
        <Handle 
          type="source" 
          position={Position.Right} 
          id="decision-yes"
          style={{ 
            right: '-8px', 
            top: '50%', 
            transform: 'translateY(-50%) rotate(-45deg)' 
          }}
        />
        
        {/* No output handle at bottom */}
        <Handle 
          type="source" 
          position={Position.Bottom} 
          id="decision-no"
          style={{ 
            bottom: '-8px', 
            left: '50%', 
            transform: 'translateX(-50%) rotate(-45deg)' 
          }}
        />
      </div>
      
      {/* Content container - positioned absolutely to avoid rotation */}
      <div 
        className={`absolute inset-0 flex flex-col items-center justify-center ${textColor} pointer-events-none`}
        style={{ color: data.textColor }}
      >
        <div className="flex items-center gap-1 mb-1 pointer-events-auto">
          <HelpCircle className="w-3 h-3" />
          <span className="text-xs font-medium opacity-75">Decision</span>
        </div>
        
        {/* Main decision label */}
        {isEditingLabel ? (
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleLabelUpdate}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleLabelUpdate()
              }
              if (e.key === "Escape") {
                setLabel(data.label || "Decision?")
                setIsEditingLabel(false)
              }
            }}
            className="w-20 bg-transparent border-none outline-none font-medium text-center text-xs pointer-events-auto focus:ring-2 focus:ring-blue-500 focus:ring-inset"
            autoFocus
            aria-label="Edit decision node label"
          />
        ) : (
          <div 
            className="font-medium cursor-text text-xs text-center pointer-events-auto px-1" 
            onDoubleClick={() => setIsEditingLabel(true)}
          >
            {label}
          </div>
        )}
      </div>
      
      {/* Yes label - positioned near right handle */}
      <div className="absolute -right-8 top-1/2 transform -translate-y-1/2">
        {isEditingYes ? (
          <input
            value={yesLabel}
            onChange={(e) => setYesLabel(e.target.value)}
            onBlur={handleYesLabelUpdate}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleYesLabelUpdate()
              }
              if (e.key === "Escape") {
                setYesLabel(data.yesLabel || "Yes")
                setIsEditingYes(false)
              }
            }}
            className={`w-12 bg-transparent border-none outline-none text-xs text-center ${textColor} focus:ring-2 focus:ring-blue-500 focus:ring-inset`}
            style={{ color: data.textColor }}
            autoFocus
            aria-label="Edit yes branch label"
          />
        ) : (
          <div 
            className={`text-xs cursor-text text-center ${textColor}`}
            style={{ color: data.textColor }}
            onDoubleClick={() => setIsEditingYes(true)}
          >
            {yesLabel}
          </div>
        )}
      </div>
      
      {/* No label - positioned near bottom handle */}
      <div className="absolute left-1/2 -bottom-6 transform -translate-x-1/2">
        {isEditingNo ? (
          <input
            value={noLabel}
            onChange={(e) => setNoLabel(e.target.value)}
            onBlur={handleNoLabelUpdate}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleNoLabelUpdate()
              }
              if (e.key === "Escape") {
                setNoLabel(data.noLabel || "No")
                setIsEditingNo(false)
              }
            }}
            className={`w-12 bg-transparent border-none outline-none text-xs text-center ${textColor} focus:ring-2 focus:ring-blue-500 focus:ring-inset`}
            style={{ color: data.textColor }}
            autoFocus
            aria-label="Edit no branch label"
          />
        ) : (
          <div 
            className={`text-xs cursor-text text-center ${textColor}`}
            style={{ color: data.textColor }}
            onDoubleClick={() => setIsEditingNo(true)}
          >
            {noLabel}
          </div>
        )}
      </div>
      
      {/* Hidden description for screen readers */}
      <div id={`${id}-description`} className="sr-only">
        Decision node in flowchart. This represents a decision point with two possible outcomes: {yesLabel} (right path) and {noLabel} (bottom path).
      </div>
    </div>
  )
}