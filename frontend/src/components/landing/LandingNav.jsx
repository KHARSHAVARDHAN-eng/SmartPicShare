import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, ArrowUpRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const LandingNav = () => {
  const { user, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignIn = async () => {
    if (user) {
      navigate('/dashboard')
    } else {
      try {
        await signInWithGoogle()
      } catch (err) {
        console.error('Sign in failed:', err)
      }
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-ivory-50/90 backdrop-blur-md border-b border-warm-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Left: Brand Wordmark */}
          <Link to="/" className="group flex items-center space-x-2">
            <span className="font-serif text-2xl font-bold tracking-tight text-charcoal-950 group-hover:opacity-80 transition-opacity">
              SmartSharePhoto
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-charcoal-900 inline-block"></span>
          </Link>

          {/* Center/Right Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-10 text-xs font-semibold uppercase tracking-widest text-charcoal-700">
            <a href="#how-it-works" className="hover:text-charcoal-950 transition-colors">
              How It Works
            </a>
            <a href="#photographers" className="hover:text-charcoal-950 transition-colors">
              For Photographers
            </a>
            <a href="#gallery" className="hover:text-charcoal-950 transition-colors">
              Gallery
            </a>
          </nav>

          {/* Right Action CTAs */}
          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <Link
                to="/dashboard"
                className="text-xs font-semibold uppercase tracking-widest text-charcoal-950 hover:underline inline-flex items-center space-x-1"
              >
                <span>Dashboard</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <button
                  onClick={handleSignIn}
                  className="text-xs font-semibold uppercase tracking-widest text-charcoal-700 hover:text-charcoal-950 transition-colors"
                >
                  Sign In
                </button>

                <button
                  onClick={handleSignIn}
                  className="bg-charcoal-950 hover:bg-charcoal-800 text-ivory-50 text-xs font-semibold uppercase tracking-widest px-5 py-3 rounded-none transition-all shadow-sm"
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-charcoal-900 hover:bg-ivory-100 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-warm-200 bg-ivory-50 px-6 py-6 space-y-4 animate-fade-in">
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs font-semibold uppercase tracking-widest text-charcoal-800 py-2 border-b border-warm-200/60"
          >
            How It Works
          </a>
          <a
            href="#photographers"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs font-semibold uppercase tracking-widest text-charcoal-800 py-2 border-b border-warm-200/60"
          >
            For Photographers
          </a>
          <a
            href="#gallery"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-xs font-semibold uppercase tracking-widest text-charcoal-800 py-2 border-b border-warm-200/60"
          >
            Gallery
          </a>

          <div className="pt-2 flex flex-col space-y-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                handleSignIn()
              }}
              className="w-full text-center bg-charcoal-950 text-ivory-50 text-xs font-semibold uppercase tracking-widest py-3.5"
            >
              {user ? 'Go to Dashboard' : 'Get Started'}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
