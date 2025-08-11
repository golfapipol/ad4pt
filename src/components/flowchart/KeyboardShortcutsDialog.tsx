import { useState, useEffect } from "react"
import { X, Keyboard } from "lucide-react"
import { Button } from "@/components/ui/button"

interface KeyboardShortcut {
  category: string
  shortcuts: {
    keys: string[]
    description: string
  }[]
}

const keyboardShortcuts: KeyboardShortcut[] = [
  {
    category: "Selection & Navigation",
    shortcuts: [
      { keys: ["Ctrl", "A"], description: "Select all nodes and edges" },
      { keys: ["Ctrl", "Click"], description: "Multi-select nodes/edges" },
      { keys: ["Shift", "Drag"], description: "Box select multiple items" },
      { keys: ["Esc"], description: "Deselect all items" },
      { keys: ["Tab"], description: "Navigate between interactive elements" },
      { keys: ["Shift", "Tab"], description: "Navigate backwards" },
      { keys: ["Enter"], description: "Activate focused element" },
      { keys: ["Space"], description: "Activate buttons and controls" },
    ]
  },
  {
    category: "Editing",
    shortcuts: [
      { keys: ["Delete"], description: "Delete selected nodes/edges" },
      { keys: ["Backspace"], description: "Delete selected nodes/edges" },
      { keys: ["Double-click"], description: "Edit node labels" },
      { keys: ["Enter"], description: "Confirm text editing" },
      { keys: ["Esc"], description: "Cancel text editing" },
    ]
  },
  {
    category: "Zoom & Pan",
    shortcuts: [
      { keys: ["Ctrl", "+"], description: "Zoom in" },
      { keys: ["Ctrl", "-"], description: "Zoom out" },
      { keys: ["Ctrl", "0"], description: "Reset zoom to 100%" },
      { keys: ["Ctrl", "F"], description: "Fit flowchart to view" },
      { keys: ["Ctrl", "Shift", "C"], description: "Center view on flowchart" },
      { keys: ["Ctrl", "Wheel"], description: "Smooth zoom with mouse wheel" },
      { keys: ["Ctrl", "Shift", "↑"], description: "Pan up" },
      { keys: ["Ctrl", "Shift", "↓"], description: "Pan down" },
      { keys: ["Ctrl", "Shift", "←"], description: "Pan left" },
      { keys: ["Ctrl", "Shift", "→"], description: "Pan right" },
    ]
  },
  {
    category: "Application",
    shortcuts: [
      { keys: ["Ctrl", "S"], description: "Save flowchart" },
      { keys: ["Ctrl", "N"], description: "New flowchart" },
      { keys: ["Ctrl", "E"], description: "Export to Mermaid" },
      { keys: ["F1"], description: "Show keyboard shortcuts help" },
      { keys: ["?"], description: "Show keyboard shortcuts help" },
    ]
  }
]

interface KeyboardShortcutsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function KeyboardShortcutsDialog({ isOpen, onClose }: KeyboardShortcutsDialogProps) {
  const [focusedIndex, setFocusedIndex] = useState(0)

  // Handle keyboard navigation within the dialog
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          onClose()
          break
        case "Tab":
          event.preventDefault()
          // Focus management is handled by the close button
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus the close button when dialog opens
      const closeButton = document.querySelector('[data-keyboard-shortcuts-close]') as HTMLElement
      if (closeButton) {
        closeButton.focus()
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Keyboard className="w-6 h-6 text-blue-600" />
            <h2 id="keyboard-shortcuts-title" className="text-xl font-semibold text-gray-900">
              Keyboard Shortcuts
            </h2>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="p-2"
            data-keyboard-shortcuts-close
            aria-label="Close keyboard shortcuts dialog"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {keyboardShortcuts.map((category, categoryIndex) => (
              <div key={category.category} className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                  {category.category}
                </h3>
                <div className="space-y-3">
                  {category.shortcuts.map((shortcut, shortcutIndex) => (
                    <div 
                      key={`${categoryIndex}-${shortcutIndex}`}
                      className="flex items-center justify-between gap-4"
                    >
                      <span className="text-sm text-gray-700 flex-1">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono text-gray-800 min-w-[2rem] text-center">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-gray-400 text-xs">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Additional Tips */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Accessibility Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use Tab to navigate between interactive elements</li>
              <li>• Screen readers will announce node types and connections</li>
              <li>• All actions are available via keyboard shortcuts</li>
              <li>• Focus indicators show which element is currently selected</li>
              <li>• Use arrow keys to navigate within dropdown menus</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <Button onClick={onClose} className="px-6">
            Got it
          </Button>
        </div>
      </div>
    </div>
  )
}