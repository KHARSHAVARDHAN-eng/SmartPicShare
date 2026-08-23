import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export const LandingFooter = () => {
  const { user, signInWithGoogle } = useAuth()

  return (
    <footer className="bg-ivory-50 border-t border-warm-200 py-12">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left Wordmark */}
        <div className="flex items-center space-x-2">
          <span className="font-serif text-xl font-bold tracking-tight text-charcoal-950">
            SmartSharePhoto
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-charcoal-900 inline-block"></span>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-8 text-xs font-semibold uppercase tracking-widest text-charcoal-700">
          <a href="#how-it-works" className="hover:text-charcoal-950 transition-colors">
            How It Works
          </a>
          <a href="#photographers" className="hover:text-charcoal-950 transition-colors">
            For Photographers
          </a>
          {user ? (
            <Link to="/dashboard" className="hover:text-charcoal-950 transition-colors">
              Dashboard
            </Link>
          ) : (
            <button onClick={signInWithGoogle} className="hover:text-charcoal-950 transition-colors">
              Sign In
            </button>
          )}
        </div>

        {/* Right Copyright */}
        <div className="text-xs font-mono text-charcoal-600">
          © {new Date().getFullYear()} SmartSharePhoto. All rights reserved.
        </div>

      </div>
    </footer>
  )
}
