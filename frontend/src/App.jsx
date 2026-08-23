import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Navbar } from './components/Navbar'
import { LandingPage } from './pages/LandingPage'
import { DashboardPage } from './pages/DashboardPage'
import { EventDetailPage } from './pages/EventDetailPage'
import { PublicEventView } from './pages/PublicEventView'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <span className="text-sm font-medium">Loading session...</span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return children
}

export function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/:id"
                element={
                  <ProtectedRoute>
                    <EventDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/event/:slug" element={<PublicEventView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
