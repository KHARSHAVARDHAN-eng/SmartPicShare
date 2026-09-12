import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../supabaseClient'
import { AuthModal } from '../components/auth/AuthModal'

const AuthContext = createContext({})

const envApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
export const API_BASE_URL = envApiUrl.replace('localhost:8000', '127.0.0.1:8000')

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const openAuthModal = () => {
    setIsAuthModalOpen(true)
  }

  const closeAuthModal = () => {
    setIsAuthModalOpen(false)
  }

  useEffect(() => {
    const initAuth = async () => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            setSession(session)
            setUser(session.user)
          }
        } catch (err) {
          console.warn('Supabase getSession error:', err)
        }

        // Listen to Auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session) {
            setSession(session)
            setUser(session.user)
          } else {
            setSession(null)
            setUser(null)
          }
          setLoading(false)
        })

        setLoading(false)
        return () => subscription?.unsubscribe()
      }

      setLoading(false)
    }

    initAuth()
  }, [])

  // Google OAuth Sign In
  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error(
        'Supabase authentication is not configured yet. Please configure Supabase environment variables.'
      )
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      })
      if (error) throw error
    } catch (err) {
      console.error('Supabase OAuth error:', err)
      throw new Error(
        err.message || 'Google OAuth failed.'
      )
    }
  }

  // Sign Out
  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut()
      } catch (e) {
        console.warn('Supabase signOut warning:', e)
      }
    }
    setSession(null)
    setUser(null)
  }

  // Helper fetch wrapper that injects Authorization Bearer token
  const fetchWithAuth = async (endpoint, options = {}) => {
    let token = session?.access_token

    if (!token && isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.auth.getSession()
        token = data.session?.access_token
      } catch (e) {
        console.warn('Failed to retrieve active session from Supabase:', e)
      }
    }

    const headers = {
      ...(options.headers || {}),
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    let candidateUrls = []
    if (endpoint.startsWith('http')) {
      candidateUrls.push(endpoint)
      if (endpoint.includes('localhost:8000')) {
        candidateUrls.push(endpoint.replace('localhost:8000', '127.0.0.1:8000'))
      }
    } else {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
      candidateUrls.push(cleanEndpoint)
      candidateUrls.push(`http://127.0.0.1:8000${cleanEndpoint}`)
      candidateUrls.push(`http://localhost:8000${cleanEndpoint}`)
    }

    let lastError = null
    for (const url of candidateUrls) {
      try {
        const response = await fetch(url, { ...options, headers })
        if (response.status === 401) {
          console.warn('Session expired or unauthorized request')
        }
        return response
      } catch (err) {
        lastError = err
      }
    }

    throw lastError || new TypeError('Failed to fetch')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isSupabaseConfigured,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signOut,
        fetchWithAuth,
      }}
    >
      {children}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
      />
    </AuthContext.Provider>
  )
}

export const getPublicMediaUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  const baseUrl = API_BASE_URL
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

export const useAuth = () => useContext(AuthContext)

