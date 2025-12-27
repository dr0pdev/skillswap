import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/layout/Layout'

// Auth pages
import Login from './components/auth/Login'
import Signup from './components/auth/SignupWithOTP' // Using OTP-based signup
import AuthCallback from './components/auth/AuthCallback'

// App pages
import Dashboard from './pages/Dashboard'
import Skills from './pages/Skills'
import Browse from './pages/Browse'
import ProposeSwap from './pages/ProposeSwap'
import FindSwaps from './pages/FindSwaps'
import MySwaps from './pages/MySwaps'
import Profile from './pages/Profile'

import './App.css'

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/skills"
            element={
              <ProtectedRoute>
                <Layout>
                  <Skills />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/browse"
            element={
              <ProtectedRoute>
                <Layout>
                  <Browse />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/propose-swap"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProposeSwap />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/find-swaps"
            element={
              <ProtectedRoute>
                <Layout>
                  <FindSwaps />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-swaps"
            element={
              <ProtectedRoute>
                <Layout>
                  <MySwaps />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  </Router>
</ErrorBoundary>
  )
}

export default App
