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

  return (
    <nav className="glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
              SmartSharePhoto
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-brand-500" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>

                <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user.user_metadata?.full_name || 'User'}
                      className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}

                  <button
                    onClick={handleSignOut}
                    title="Sign Out"
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/"
                className="text-sm font-medium bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg transition-colors shadow-md shadow-brand-600/20"
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
