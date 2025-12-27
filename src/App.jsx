import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import SkillEntry from './components/SkillEntry'
import MySkills from './components/MySkills'
import MatchExplorer from './components/MatchExplorer'
import Messages from './components/Messages'
import Profile from './components/Profile'
import Login from './components/Login'
import SwapRequests from './components/SwapRequests'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeView, setActiveView] = useState('onboarding')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [swapRequests, setSwapRequests] = useState([])
  const [notifications, setNotifications] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setSwapRequests([])
    setNotifications([])
  }

  // Request management functions
  const handleSendSwapRequest = (matchData) => {
    const newRequest = {
      id: Date.now(),
      type: 'sent',
      toId: matchData.id,
      toName: matchData.name,
      yourSkill: 'Python Programming', // This would come from user profile
      theirSkill: matchData.offerSkill,
      status: 'pending',
      createdAt: new Date().toISOString(),
      message: `I'd like to swap ${matchData.offerSkill} for Python Programming`
    }

    // Create corresponding received request for the other user (simulated)
    const receivedRequest = {
      id: Date.now() + 1,
      type: 'received',
      fromId: matchData.id,
      fromName: matchData.name,
      yourSkill: matchData.offerSkill,
      theirSkill: 'Python Programming',
      status: 'pending',
      createdAt: new Date().toISOString(),
      message: `I'd like to swap ${matchData.offerSkill} for Python Programming`
    }

    setSwapRequests(prev => [...prev, newRequest, receivedRequest])
    
    // Add notification
    setNotifications(prev => [...prev, {
      id: Date.now(),
      type: 'request_sent',
      message: `Swap request sent to ${matchData.name}`,
      timestamp: new Date().toISOString(),
      read: false
    }])

    return newRequest
  }

  const handleAcceptRequest = (requestId) => {
    setSwapRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        // Also update the corresponding sent request
        const correspondingRequest = prev.find(r => 
          r.type === 'sent' && 
          r.toId === req.fromId && 
          r.status === 'pending'
        )
        if (correspondingRequest) {
          const updatedCorresponding = { ...correspondingRequest, status: 'accepted' }
          return req.id === requestId ? { ...req, status: 'accepted' } : updatedCorresponding
        }
        return { ...req, status: 'accepted' }
      }
      // Update corresponding sent request if this is a received request
      if (req.type === 'sent' && req.toId === prev.find(r => r.id === requestId)?.fromId && req.status === 'pending') {
        return { ...req, status: 'accepted' }
      }
      return req
    }))

    const request = swapRequests.find(r => r.id === requestId)
    if (request) {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'request_accepted',
        message: `${request.fromName} accepted your swap request`,
        timestamp: new Date().toISOString(),
        read: false
      }])
    }
  }

  const handleDeclineRequest = (requestId) => {
    setSwapRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        // Also update the corresponding sent request
        const correspondingRequest = prev.find(r => 
          r.type === 'sent' && 
          r.toId === req.fromId && 
          r.status === 'pending'
        )
        if (correspondingRequest) {
          const updatedCorresponding = { ...correspondingRequest, status: 'declined' }
          return req.id === requestId ? { ...req, status: 'declined' } : updatedCorresponding
        }
        return { ...req, status: 'declined' }
      }
      // Update corresponding sent request if this is a received request
      if (req.type === 'sent' && req.toId === prev.find(r => r.id === requestId)?.fromId && req.status === 'pending') {
        return { ...req, status: 'declined' }
      }
      return req
    }))
  }

  const handleCancelRequest = (requestId) => {
    setSwapRequests(prev => prev.filter(req => req.id !== requestId))
  }

  const handleMessageClick = (userId) => {
    setActiveConversation(userId)
    setActiveView('messages')
  }

  // Get unread notifications count
  const unreadNotifications = notifications.filter(n => !n.read).length
  const pendingRequestsCount = swapRequests.filter(r => r.type === 'received' && r.status === 'pending').length

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard 
          swapRequests={swapRequests}
          pendingRequestsCount={pendingRequestsCount}
          notifications={notifications}
        />
      case 'onboarding':
        return <SkillEntry />
      case 'skills':
        return <MySkills />
      case 'explorer':
        return <MatchExplorer 
          onSendSwapRequest={handleSendSwapRequest}
          sentRequestIds={swapRequests.filter(r => r.type === 'sent').map(r => r.toId)}
        />
      case 'messages':
        return <Messages 
          activeConversationId={activeConversation}
          swapRequests={swapRequests}
        />
      case 'profile':
        return <Profile />
      case 'requests':
        return <SwapRequests
          requests={swapRequests}
          onAcceptRequest={handleAcceptRequest}
          onDeclineRequest={handleDeclineRequest}
          onCancelRequest={handleCancelRequest}
          onMessageClick={handleMessageClick}
        />
      default:
        return <Dashboard 
          swapRequests={swapRequests}
          pendingRequestsCount={pendingRequestsCount}
          notifications={notifications}
        />
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
        unreadNotifications={unreadNotifications}
        pendingRequestsCount={pendingRequestsCount}
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
