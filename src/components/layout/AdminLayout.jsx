import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const navigation = [
    { 
      name: 'Verification Requests', 
      path: '/admin/verifications', 
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
    },
  ]

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Sign out error:', err)
    }
    window.location.href = '/admin/login'
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-dark-950 flex">
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
          bg-dark-900/95 backdrop-blur-xl border-r border-dark-800/50
          flex flex-col h-screen
          transform transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
          w-64
          relative
        `}
      >
        {/* Collapse/Expand Tab */}
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
        <div className="flex items-center justify-between h-16 px-4 border-b border-dark-800/50 flex-shrink-0">
          <Link 
            to="/admin/verifications" 
            className={`flex items-center group ${sidebarCollapsed ? 'lg:justify-center lg:w-full' : 'space-x-3'}`}
            onClick={() => setSidebarOpen(false)}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center shadow-lg shadow-primary-900/50 group-hover:shadow-glow transition-all duration-300 flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div>
                <span className="text-xl font-display font-bold text-gradient block leading-none">Admin</span>
                <span className="text-xs text-dark-400">SkillSwap</span>
              </div>
            )}
          </Link>
          
          {/* Close button for mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg text-dark-400 hover:text-dark-100 hover:bg-dark-800/50 transition-colors flex-shrink-0"
            title="Close menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-hidden">
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
                  ? 'bg-primary-950/30 text-primary-400 border border-primary-800/50'
                  : 'text-dark-400 hover:text-dark-100 hover:bg-dark-800/50'
                }
              `}
              title={sidebarCollapsed ? item.name : ''}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {!sidebarCollapsed && <span className="lg:inline">{item.name}</span>}
              
              {/* Tooltip for collapsed state */}
              {sidebarCollapsed && (
                <div className="hidden lg:block absolute left-full ml-2 px-3 py-2 bg-dark-800 text-dark-100 text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-dark-700">
                  {item.name}
                </div>
              )}
            </Link>
          ))}
        </nav>

        {/* Sign Out Section */}
        {!sidebarCollapsed && (
          <div className="border-t border-dark-800/50 p-4 space-y-3 flex-shrink-0">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-dark-400 hover:text-error-400 hover:bg-error-950/30 transition-all duration-300"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        )}

        {/* Collapsed Sign Out */}
        {sidebarCollapsed && (
          <div className="hidden lg:flex flex-col border-t border-dark-800/50 py-3 space-y-2 flex-shrink-0">
            <button
              onClick={handleSignOut}
              className="flex justify-center p-3 mx-3 rounded-lg text-dark-400 hover:text-error-400 hover:bg-error-950/30 transition-all duration-300 group relative"
              title="Sign Out"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-3 py-2 bg-dark-800 text-dark-100 text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-dark-700">
                Sign Out
              </div>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Top Bar (Mobile only - hamburger menu) */}
        <div className="lg:hidden bg-dark-900/50 backdrop-blur-xl border-b border-dark-800/50 sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-dark-400 hover:text-dark-100 hover:bg-dark-800/50 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-lg font-display font-bold text-gradient">Admin</span>
            </div>

            <div className="w-10" />
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

