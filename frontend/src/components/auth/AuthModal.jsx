import React, { useState } from 'react'
import { Camera, X, Mail, Lock, User, Sparkles, AlertCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const AuthModal = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const [mode, setMode] = useState(initialMode) // 'signin' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    signInAsDemo,
    isSupabaseConfigured,
  } = useAuth()

  if (!isOpen) return null

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setIsSubmitting(true)

    try {
      if (mode === 'signup') {
        if (!fullName.trim()) {
          throw new Error('Please enter your full name.')
        }
        await signUpWithEmail(email, password, fullName)
      } else {
        await signInWithEmail(email, password)
      }
      onClose()
    } catch (err) {
      console.error('Auth error:', err)
      setErrorMsg(err.message || 'Authentication failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setErrorMsg('')
    setIsSubmitting(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      console.error('Google Sign-In Error:', err)
      setErrorMsg(
        err.message || 'Failed to connect to Google OAuth. You can use Demo Instant Login below.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDemoSignIn = async (demoEmail, demoName) => {
    setErrorMsg('')
    setIsSubmitting(true)
    try {
      await signInAsDemo(demoEmail || 'photographer@smartsharephoto.com', demoName || 'Demo Photographer')
      onClose()
    } catch (err) {
      console.error('Demo Sign-In Error:', err)
      setErrorMsg('Failed to log in with Demo mode.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md bg-white border border-slate-200 shadow-2xl overflow-hidden rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-950 px-6 py-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <Camera className="w-4 h-4" />
            </div>
            <span className="font-serif text-lg font-bold tracking-tight text-white">
              SmartSharePhoto
            </span>
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'signup'
              ? 'Sign up to create events and share AI galleries.'
              : 'Sign in to access your photographer dashboard.'}
          </p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => {
              setMode('signin')
              setErrorMsg('')
            }}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
              mode === 'signin'
                ? 'bg-white text-slate-950 border-b-2 border-slate-950'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup')
              setErrorMsg('')
            }}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
              mode === 'signup'
                ? 'bg-white text-slate-950 border-b-2 border-slate-950'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="photographer@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Processing...' : mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider absolute">
              OR
            </span>
          </div>

          {/* OAuth & Instant Demo Login Options */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 border border-slate-300 hover:bg-slate-50 text-slate-800 font-medium text-xs rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Instant Demo Login Button */}
            <button
              type="button"
              onClick={() => handleDemoSignIn('photographer@smartsharephoto.com', 'Demo Photographer')}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Instant Demo Photographer Access</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
