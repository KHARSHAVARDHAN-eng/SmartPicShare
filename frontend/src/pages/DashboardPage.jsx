import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Calendar, Image as ImageIcon, QrCode, Trash2, ArrowRight, Loader2, Sparkles, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { QRCodeModal } from '../components/QRCodeModal'

export const DashboardPage = () => {
  const { fetchWithAuth } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Create Event Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [eventName, setEventName] = useState('')
  const [creating, setCreating] = useState(false)

  // QR Modal State
  const [selectedQREvent, setSelectedQREvent] = useState(null)

  const loadEvents = async () => {
    try {
      setLoading(true)
      const res = await fetchWithAuth('/api/v1/events')
      if (!res.ok) throw new Error('Failed to fetch events')
      const data = await res.json()
      setEvents(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    if (!eventName.trim()) return

    try {
      setCreating(true)
      const res = await fetchWithAuth('/api/v1/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: eventName.trim() }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error?.message || 'Failed to create event')
      }

      setEventName('')
      setShowCreateModal(false)
      await loadEvents()
    } catch (err) {
      alert(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteEvent = async (eventId, e) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this event and all associated photos?')) return

    try {
      const res = await fetchWithAuth(`/api/v1/events/${eventId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete event')
      await loadEvents()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Photographer Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your event photo galleries and guest access</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-600/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Event</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-sm font-medium">Loading your events...</p>
        </div>
      ) : events.length === 0 ? (
        /* Empty State */
        <div className="glass-card p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-500/10 text-brand-400 mx-auto flex items-center justify-center">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">No Events Created Yet</h3>
          <p className="text-xs text-slate-400">Create your first photo event to start uploading photographs and generating guest QR codes.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-brand-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>
      ) : (
        /* Events Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="glass-card p-6 flex flex-col justify-between hover:border-slate-700 transition-all group relative"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors line-clamp-1">
                      {event.name}
                    </h3>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(event.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteEvent(event.id, e)}
                    title="Delete Event"
                    className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Processing Readiness Badge */}
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      event.is_ready
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {event.is_ready ? 'Ready for Guests' : 'Processing Photos'}
                  </span>

                  <span className="text-xs text-slate-400 font-mono">
                    {event.photo_count} / {event.max_photos} photos
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => setSelectedQREvent(event)}
                  className="flex items-center space-x-1.5 text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <QrCode className="w-4 h-4 text-brand-400" />
                  <span>QR Code</span>
                </button>

                <Link
                  to={`/events/${event.id}`}
                  className="flex items-center space-x-1.5 bg-slate-800 hover:bg-brand-600 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all"
                >
                  <span>Manage Event</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card max-w-md w-full p-6 relative border border-slate-800">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Create Event</h3>
            <p className="text-xs text-slate-400 mb-6">Enter event details. You can upload up to 150 photos.</p>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Event Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Tech Conference 2026"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-brand-600/20 disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Create Event</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {selectedQREvent && (
        <QRCodeModal event={selectedQREvent} onClose={() => setSelectedQREvent(null)} />
      )}
    </div>
  )
}
