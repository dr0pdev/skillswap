import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function Layout({ children }) {
  const { user, profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false) // For mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // For desktop collapse

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'My Skills', path: '/skills', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { name: 'Browse', path: '/browse', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { name: 'Find Swaps', path: '/find-swaps', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
    { name: 'Swap Requests', path: '/my-swaps', icon: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4', badge: 1 },
    { name: 'Messages', path: '/chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', badge: 3 },
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error('Sign out error:', err)
      // Continue with navigation even if signOut had issues
    }
    // Always redirect to login, even if signOut API call failed
    // Use window.location to force full page reload and clear all state
    window.location.href = '/login'
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#9AB7CD' }}>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex flex-col h-screen
          transform transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
          w-64
        `}
        style={{ backgroundColor: '#27496A', borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}
      >
        {/* Collapse/Expand Tab (desktop only, top position) */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex absolute left-full top-20 items-center justify-center w-6 h-12 bg-dark-900/95 backdrop-blur-xl border border-dark-800/50 border-l-0 rounded-r-lg text-dark-400 hover:text-primary-400 hover:bg-dark-800/70 transition-all duration-300 group z-40"
          style={{
            clipPath: 'polygon(0 0, 100% 25%, 100% 75%, 0 100%)'
          }}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg className="w-4 h-4 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d={sidebarCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
            />
          </svg>
        </button>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <Link 
            to="/dashboard" 
            className={`flex items-center group ${sidebarCollapsed ? 'lg:justify-center lg:w-full' : 'space-x-3'}`}
            onClick={() => setSidebarOpen(false)}
          >
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-2xl font-bold text-white">Skill Swap AI</h1>
                <p className="text-sm text-gray-300 mt-0.5">Connect. Learn. Grow.</p>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="text-white font-bold text-xl">SS</div>
            )}
          </Link>
          
          {/* Close button for mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors flex-shrink-0"
            title="Close menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {navigation.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center rounded-lg font-medium transition-all duration-300 group relative
                ${sidebarCollapsed ? 'lg:justify-center lg:px-3' : 'gap-3 px-4'}
                py-3
                ${isActive(item.path)
                  ? 'bg-white/20 text-white'
                  : 'text-gray-200 hover:text-white hover:bg-white/10'
                }
              `}
              title={sidebarCollapsed ? item.name : ''}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {!sidebarCollapsed && (
                <span className="lg:inline flex-1 text-left">{item.name}</span>
              )}
              {item.badge && item.badge > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
              
              {/* Tooltip for collapsed state */}
              {sidebarCollapsed && (
                <div className="hidden lg:block absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-gray-700">
                  {item.name}
                </div>
              )}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        {!sidebarCollapsed && (
          <div className="border-t p-4 space-y-3 flex-shrink-0 lg:block" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            {/* Profile Button */}
            <Link
              to="/profile"
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300
                ${isActive('/profile')
                  ? 'bg-white/20'
                  : 'hover:bg-white/10'
                }
              `}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg flex-shrink-0" style={{ backgroundColor: '#1e3a52' }}>
                {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {profile?.full_name || 'Profile'}
                </p>
                <p className="text-xs text-gray-300 truncate">
                  {user?.email}
                </p>
              </div>
            </Link>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-200 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        )}

        {/* Collapsed User Section (icons only) */}
        {sidebarCollapsed && (
          <div className="hidden lg:flex flex-col border-t py-3 space-y-2 flex-shrink-0" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            {/* Profile Button */}
            <Link
              to="/profile"
              className={`
                flex justify-center p-3 mx-3 rounded-lg transition-all duration-300 group relative
                ${isActive('/profile')
                  ? 'bg-white/20'
                  : 'hover:bg-white/10'
                }
              `}
              title="Profile"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg" style={{ backgroundColor: '#1e3a52' }}>
                {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-gray-700">
                {profile?.full_name || 'Profile'}
              </div>
            </Link>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="flex justify-center p-3 mx-3 rounded-lg text-gray-200 hover:text-white hover:bg-white/10 transition-all duration-300 group relative"
              title="Logout"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-gray-700">
                Logout
              </div>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div 
        className={`flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}
        style={{ minHeight: '100vh' }}
      >
        {/* Top Bar (Mobile only - hamburger menu) */}
        <div className="lg:hidden sticky top-0 z-30" style={{ backgroundColor: '#27496A', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <span className="text-lg font-display font-bold text-white">SkillSwap</span>
            </Link>

            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto" style={{ height: 'calc(100vh)', maxHeight: '100vh' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
