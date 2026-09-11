import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../supabaseClient'
import { AuthModal } from '../components/auth/AuthModal'

const AuthContext = createContext({})

const envApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
export const API_BASE_URL = envApiUrl.replace('localhost:8000', '127.0.0.1:8000')

const DEV_JWT_SECRET = 'dev-secret-key-change-in-production-min-32-chars'

/**
 * Generates a valid HS256 JWT token using Web Crypto API for local development & offline testing.
 * Compatible with FastAPI backend verify_supabase_jwt().
 */
async function generateDevJwt(payload, secret = DEV_JWT_SECRET) {
  const header = { alg: 'HS256', typ: 'JWT' }

  const base64UrlEncode = (str) => {
    return btoa(str)
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const dataToSign = `${encodedHeader}.${encodedPayload}`

  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(dataToSign))
  const signatureArray = Array.from(new Uint8Array(signature))
  const signatureBase64 = base64UrlEncode(String.fromCharCode.apply(null, signatureArray))

  return `${dataToSign}.${signatureBase64}`
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState('signin') // 'signin' or 'signup'

  const openAuthModal = (mode = 'signin') => {
    setAuthModalMode(mode)
    setIsAuthModalOpen(true)
  }

  const closeAuthModal = () => {
    setIsAuthModalOpen(false)
  }

  useEffect(() => {
    const initAuth = async () => {
      // 1. Check local storage for active Dev Session first
      const storedDevSession = localStorage.getItem('smartpicshare_dev_session')
      if (storedDevSession) {
        try {
          const parsed = JSON.parse(storedDevSession)
          if (parsed?.access_token && parsed?.user) {
            setSession(parsed)
            setUser(parsed.user)
            setLoading(false)
            return
          }
        } catch (e) {
          localStorage.removeItem('smartpicshare_dev_session')
        }
      }

      // 2. Check Supabase session if configured
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
            localStorage.removeItem('smartpicshare_dev_session')
          } else {
            const devSess = localStorage.getItem('smartpicshare_dev_session')
            if (!devSess) {
              setSession(null)
              setUser(null)
            }
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
        'Supabase authentication is not configured yet. You can use Email Sign Up or Instant Demo Access.'
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
        err.message || 'Google OAuth failed. Please try Email Sign Up or Demo Mode.'
      )
    }
  }

  // Email & Password Sign Up
  const signUpWithEmail = async (email, password, fullName) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        })
        if (error) throw error
        if (data.session) {
          setSession(data.session)
          setUser(data.user)
          localStorage.removeItem('smartpicshare_dev_session')
          return data
        }
      } catch (err) {
        console.warn('Supabase signUp error, falling back to Dev session:', err)
      }
    }

    // Fallback or Dev mode Sign Up
    return await signInAsDemo(email, fullName)
  }

  // Email & Password Sign In
  const signInWithEmail = async (email, password) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        if (data.session) {
          setSession(data.session)
          setUser(data.user)
          localStorage.removeItem('smartpicshare_dev_session')
          return data
        }
      } catch (err) {
        console.warn('Supabase signInWithPassword error, falling back to Dev session:', err)
      }
    }

    // Fallback or Dev mode Sign In
    const nameFromEmail = email.split('@')[0].replace(/[._]/g, ' ')
    const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1)
    return await signInAsDemo(email, formattedName)
  }

  // Instant Dev / Demo Login
  const signInAsDemo = async (email = 'photographer@smartsharephoto.com', fullName = 'Demo Photographer') => {
    // Generate deterministic or fixed UUID for consistent dev user
    const devUserId = '11111111-2222-3333-4444-555555555555'
    const now = Math.floor(Date.now() / 1000)

    const payload = {
      sub: devUserId,
      email: email,
      role: 'authenticated',
      aud: 'authenticated',
      iat: now,
      exp: now + 30 * 24 * 60 * 60, // 30 days
      user_metadata: {
        full_name: fullName,
        email: email,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
      },
    }

    const token = await generateDevJwt(payload)

    const devUser = {
      id: devUserId,
      email: email,
      user_metadata: payload.user_metadata,
      role: 'authenticated',
    }

    const devSession = {
      access_token: token,
      token_type: 'bearer',
      user: devUser,
    }

    setSession(devSession)
    setUser(devUser)
    localStorage.setItem('smartpicshare_dev_session', JSON.stringify(devSession))

    return devSession
  }

  // Sign Out
  const signOut = async () => {
    localStorage.removeItem('smartpicshare_dev_session')
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

    if (!token) {
      const storedDevSession = localStorage.getItem('smartpicshare_dev_session')
      if (storedDevSession) {
        try {
          const parsed = JSON.parse(storedDevSession)
          token = parsed?.access_token
        } catch (e) {}
      }
    }

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
        authModalMode,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        signInAsDemo,
        signOut,
        fetchWithAuth,
      }}
    >
      {children}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        initialMode={authModalMode}
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
