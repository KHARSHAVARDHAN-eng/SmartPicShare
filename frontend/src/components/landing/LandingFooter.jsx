import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export const LandingFooter = () => {
  const { user, signInWithGoogle } = useAuth()

  return (
    <footer className="bg-ivory-50 border-t border-warm-200 py-16">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-8">
        
        {/* Top Row: Wordmark & Navigation Links */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-warm-200">
          <div className="flex items-center space-x-2">
            <span className="font-serif text-2xl font-bold tracking-tight text-charcoal-950">
              SmartSharePhoto
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-charcoal-900 inline-block"></span>
          </div>

          <div className="flex flex-wrap items-center gap-8 text-xs font-semibold uppercase tracking-widest text-charcoal-700">
            <a href="#how-it-works" className="hover:text-charcoal-950 transition-colors">
              How It Works
            </a>
            <a href="#photographers" className="hover:text-charcoal-950 transition-colors">
              For Photographers
            </a>
            <a href="#gallery" className="hover:text-charcoal-950 transition-colors">
              Gallery
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
        </div>

        {/* Bottom Row: Copyright & Creator Credit */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-charcoal-600">
          <div>
            © {new Date().getFullYear()} SmartSharePhoto. All rights reserved.
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span>Crafted by</span>
            <span className="font-semibold text-charcoal-950">Harshavardhan Katabatthina</span>
            <span className="text-warm-300">•</span>
            <a
              href="https://www.linkedin.com/in/harshavardhan-katabatthina/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-charcoal-950 underline transition-colors"
            >
              LinkedIn
            </a>
            <span className="text-warm-300">•</span>
            <a
              href="https://github.com/KHARSHAVARDHAN-eng"
              target="_blank"
              rel="noreferrer"
              className="hover:text-charcoal-950 underline transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>

      </div>
    </footer>
  )
}
