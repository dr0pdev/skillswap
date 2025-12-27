import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import SkillEntry from './components/SkillEntry'
import MySkills from './components/MySkills'
import MatchExplorer from './components/MatchExplorer'
import Messages from './components/Messages'
import './App.css'

function App() {
  const [activeView, setActiveView] = useState('onboarding')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />
      case 'onboarding':
        return <SkillEntry />
      case 'skills':
        return <MySkills />
      case 'explorer':
        return <MatchExplorer />
      case 'messages':
        return <Messages />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#9AB7CD' }}>
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      <main
        className={`transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        } pt-4 lg:pt-6 px-4 lg:px-8 pb-8`}
      >
        {renderView()}
      </main>
    </div>
  )
}

export default App
