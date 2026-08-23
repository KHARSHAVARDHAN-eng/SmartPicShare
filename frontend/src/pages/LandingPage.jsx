import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Sparkles, ShieldCheck, Zap, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export const LandingPage = () => {
  const { user, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  if (user) {
    navigate('/dashboard')
  }

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle()
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI-Powered Event Photo Sharing</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Effortless Photo Distribution for <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-blue-300">
            Modern Photographers
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg text-slate-400 leading-relaxed">
          Upload up to 150 event photos. SmartSharePhoto automatically detects faces and indexes embeddings so your guests receive personalized galleries instantaneously via QR code.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full sm:w-auto flex items-center justify-center space-x-3 bg-white hover:bg-slate-100 text-slate-900 font-semibold px-8 py-3.5 rounded-xl shadow-xl hover:shadow-2xl transition-all scale-100 hover:scale-[1.02]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span>Sign in with Google</span>
            <ArrowRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Product Feature Highlights */}
        <div className="pt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="glass-card p-6 border-slate-800/80">
            <div className="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center mb-4">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">150 Photos per Event</h3>
            <p className="text-xs text-slate-400">High resolution image upload with real-time background face indexing.</p>
          </div>

          <div className="glass-card p-6 border-slate-800/80">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Instant QR Sharing</h3>
            <p className="text-xs text-slate-400">Print or display a dynamic QR code for instant guest access.</p>
          </div>

          <div className="glass-card p-6 border-slate-800/80">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">100% Privacy First</h3>
            <p className="text-xs text-slate-400">Strict event isolation ensures guests only access their matching photos.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
