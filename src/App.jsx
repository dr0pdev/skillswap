import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import SkillEntry from './components/SkillEntry'
import MySkills from './components/MySkills'
import MatchExplorer from './components/MatchExplorer'
import Messages from './components/Messages'
import Profile from './components/Profile'
import Login from './components/Login'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeView, setActiveView] = useState('onboarding')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
  }

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
      case 'profile':
        return <Profile />
      default:
        return <Dashboard />
    }
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  // Show main app if authenticated
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#9AB7CD' }}>
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onLogout={handleLogout}
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
