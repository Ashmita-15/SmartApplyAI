import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import Navbar from '@/components/layout/Navbar'
import Landing from '@/pages/Landing'
import Auth from '@/pages/Auth'
import Dashboard from '@/pages/Dashboard'
import Jobs from '@/pages/Jobs'
import Match from '@/pages/Match'
import Tracker from '@/pages/Tracker'
import Profile from '@/pages/Profile'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return user ? children : <Navigate to="/auth" replace />
}

import AppLayout from '@/components/layout/AppLayout'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<><Navbar /><Landing /></>} />
      <Route path="/auth" element={<><Navbar /><Auth /></>} />
      
      {/* Protected Routes with Sidebar Layout */}
      <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/jobs" element={<ProtectedRoute><AppLayout><Jobs /></AppLayout></ProtectedRoute>} />
      <Route path="/match" element={<ProtectedRoute><AppLayout><Match /></AppLayout></ProtectedRoute>} />
      <Route path="/tracker" element={<ProtectedRoute><AppLayout><Tracker /></AppLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  console.log("App component is rendering!");
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(30, 27, 75, 0.95)',
              color: '#e2e8f0',
              border: '1px solid rgba(99,102,241,0.3)',
              backdropFilter: 'blur(16px)',
              borderRadius: '12px',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#86efac', secondary: '#1e1b4b' } },
            error: { iconTheme: { primary: '#fca5a5', secondary: '#1e1b4b' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}
