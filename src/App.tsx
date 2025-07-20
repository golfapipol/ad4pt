import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import Board from './components/Board'
import FlowchartEditor from './components/flowchart/FlowchartEditor'
import { Button } from './components/ui/button'
import { Workflow, Grid3X3 } from 'lucide-react'

function Navigation() {
  const location = useLocation()
  
  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-gray-900">AD4PT</h1>
        <div className="flex space-x-2">
          <Button
            variant={location.pathname === '/' ? 'default' : 'outline'}
            size="sm"
            asChild
          >
            <Link to="/" className="flex items-center">
              <Grid3X3 className="w-4 h-4 mr-2" />
              Interactive Board
            </Link>
          </Button>
          <Button
            variant={location.pathname === '/flowchart' ? 'default' : 'outline'}
            size="sm"
            asChild
          >
            <Link to="/flowchart" className="flex items-center">
              <Workflow className="w-4 h-4 mr-2" />
              Flowchart Editor
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}

function App() {
  return (
    <Router>
      <div className="h-screen flex flex-col">
        <Navigation />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Board />} />
            <Route path="/flowchart" element={<FlowchartEditor />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
