import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, LogOut, LayoutDashboard, User as UserIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export const Navbar = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (err) {
      console.error('Failed to sign out:', err)
    }
  }

  const userName = user?.user_metadata?.full_name || user?.email || 'User'

  return (
    <nav className="glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Wordmark & Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:bg-slate-800 transition-colors">
              <Camera className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-serif text-xl font-bold tracking-tight text-slate-900">
                SmartSharePhoto
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900 inline-block"></span>
            </div>
          </Link>

          {/* Right Navigation & Profile */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-900" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>

                <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
                  <div className="flex items-center space-x-2">
                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt={userName}
                        className="w-8 h-8 rounded-full border border-slate-200 object-cover shadow-sm"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="hidden md:inline-block text-xs font-medium text-slate-800 max-w-[140px] truncate">
                      {userName}
                    </span>
                  </div>

                  <button
                    onClick={handleSignOut}
                    title="Sign Out"
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Sign Out"
                  >
                    <LogOut className="w-4.5 h-4.5" />
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/"
                className="text-xs font-semibold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
