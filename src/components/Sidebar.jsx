import { LayoutDashboard, BookOpen, Search, MessageSquare, Menu, X, UserPlus, ChevronLeft, ChevronRight, User, LogOut, Inbox } from 'lucide-react'
import { useState } from 'react'

const Sidebar = ({ activeView, setActiveView, isCollapsed, setIsCollapsed, onLogout, unreadNotifications = 0, pendingRequestsCount = 0 }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'onboarding', label: 'Skill Onboarding', icon: UserPlus },
    { id: 'skills', label: 'My Skills', icon: BookOpen },
    { id: 'explorer', label: 'Match Explorer', icon: Search },
    { id: 'requests', label: 'Swap Requests', icon: Inbox, badge: pendingRequestsCount },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadNotifications },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  const handleMenuClick = (id) => {
    setActiveView(id)
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Button - Fixed position that doesn't interfere with content */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-[100] p-2 rounded-lg shadow-lg"
        style={{ backgroundColor: '#27496A', borderColor: '#27496A' }}
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Menu className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full border-r border-gray-200 flex flex-col z-40 transform transition-all duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-64'}`}
        style={{ backgroundColor: '#27496A' }}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          {!isCollapsed && (
            <div>
              <h1 className="text-2xl font-bold text-white">Skill Swap AI</h1>
              <p className="text-sm text-gray-300 mt-1">Connect. Learn. Grow.</p>
            </div>
          )}
          {isCollapsed && (
            <div className="text-white font-bold text-xl">SS</div>
          )}
          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors text-white"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
        
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeView === item.id
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleMenuClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-white bg-opacity-20 text-white'
                        : 'text-gray-200 hover:bg-white hover:bg-opacity-10'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? item.label : ''}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="font-medium flex-1 text-left">{item.label}</span>
                    )}
                    {item.badge && item.badge > 0 && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full min-w-[20px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-200 hover:bg-white hover:bg-opacity-10 ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="font-medium">Logout</span>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar

