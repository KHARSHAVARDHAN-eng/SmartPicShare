import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../supabaseClient'

const AuthContext = createContext({})

const envApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
export const API_BASE_URL = envApiUrl.replace('localhost:8000', '127.0.0.1:8000')


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    // 1. Fetch active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch((err) => {
      console.warn('Supabase getSession error:', err)
      setLoading(false)
    })

    // 2. Listen to Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription?.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured || !supabase) {
      const msg = 'Supabase authentication is not configured yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.'
      alert(msg)
      console.warn(msg)
      return
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) {
      console.error('Supabase OAuth error:', error)
      alert(`Authentication failed: ${error.message}`)
      throw error
    }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured || !supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

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

    const primaryUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`

    try {
      const response = await fetch(primaryUrl, { ...options, headers })
      if (response.status === 401) {
        console.warn('Session expired or unauthorized request')
      }
      return response
    } catch (err) {
      if (err instanceof TypeError && primaryUrl.includes('localhost:8000')) {
        const fallbackUrl = primaryUrl.replace('localhost:8000', '127.0.0.1:8000')
        console.warn(`Primary fetch to ${primaryUrl} failed. Retrying with fallback ${fallbackUrl}...`)
        const response = await fetch(fallbackUrl, { ...options, headers })
        return response
      }
      throw err
    }
  }


  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isSupabaseConfigured,
        signInWithGoogle,
        signOut,
        fetchWithAuth,
      }}
    >
      {children}
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

