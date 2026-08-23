import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Camera, Calendar, Sparkles, AlertCircle, Loader2, CheckCircle2, Lock } from 'lucide-react'
import { API_BASE_URL } from '../context/AuthContext'

export const PublicEventView = () => {
  const { slug } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPublicEvent = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/events/public/${slug}`)
        if (res.status === 404) {
          setError('Event not found')
          return
        }
        if (!res.ok) throw new Error('Failed to load event')
        const data = await res.json()
        setEvent(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPublicEvent()
  }, [slug])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <p className="text-sm font-medium">Loading event details...</p>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">{error || 'Event Not Found'}</h2>
        <p className="text-xs text-slate-400">Please check the event URL or scan a valid event QR code.</p>
        <Link to="/" className="inline-block bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
          Go Home
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8 text-center">
      {/* Event Branding Badge */}
      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Official Event Gallery</span>
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white">{event.name}</h1>

        <div className="flex items-center justify-center space-x-4 text-xs text-slate-400">
          <span className="flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(event.created_at).toLocaleDateString()}</span>
          </span>
          <span>•</span>
          <span className="font-mono">{event.processed_count} photos indexed</span>
        </div>
      </div>

      {/* Readiness Card */}
      <div className="glass-card p-8 border-brand-500/30 max-w-lg mx-auto space-y-4">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
          {event.is_ready ? <CheckCircle2 className="w-8 h-8" /> : <Loader2 className="w-8 h-8 animate-spin text-amber-400" />}
        </div>

        <h3 className="text-xl font-bold text-white">
          {event.is_ready ? 'Event Photos Ready' : 'Event Processing in Progress'}
        </h3>

        <p className="text-xs text-slate-400 leading-relaxed">
          {event.is_ready
            ? 'The photographer has uploaded and indexed event photographs. Guest face-recognition matching will be enabled shortly.'
            : 'The photographer is currently uploading and indexing event photographs. Check back soon!'}
        </p>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-center space-x-2 text-xs text-slate-500">
          <Lock className="w-3.5 h-3.5" />
          <span>Guest Selfie Matching Opening Soon</span>
        </div>
      </div>
    </div>
  )
}
