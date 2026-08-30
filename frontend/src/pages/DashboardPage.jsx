import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Calendar, Image as ImageIcon, QrCode, Trash2, ArrowRight, Loader2, Sparkles, X, Search } from 'lucide-react'
import { useAuth, getPublicMediaUrl } from '../context/AuthContext'
import { QRCodeModal } from '../components/QRCodeModal'


export const DashboardPage = () => {
  const { fetchWithAuth } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Create Event Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [eventName, setEventName] = useState('')
  const [creating, setCreating] = useState(false)

  // QR Modal State
  const [selectedQREvent, setSelectedQREvent] = useState(null)

  // Deletion Progress State
  const [deletingId, setDeletingId] = useState(null)


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
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (deletingId) return

    try {
      setDeletingId(eventId)

      const res = await fetchWithAuth(`/api/v1/events/${eventId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        let errMsg = 'Failed to delete event'
        try {
          const errData = await res.json()
          errMsg = errData.error?.message || errMsg
        } catch (_) {}
        throw new Error(errMsg)
      }

      // Backend deletion verified successful! Remove event from state & reload
      setEvents((prev) => prev.filter((evt) => evt.id !== eventId))
      await loadEvents()
    } catch (err) {
      alert(`Delete Error: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }




  const filteredEvents = events.filter((evt) =>
    evt.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Dashboard Top Section Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-sans">
              Event Galleries
            </h1>
            <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 font-mono">
              {events.length} {events.length === 1 ? 'Event' : 'Events'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Upload photos, manage galleries, and generate QR codes for guests.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {events.length > 0 && (
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all w-48 sm:w-64"
              />
            </div>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition-all group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-center justify-between shadow-sm">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Loading events...
          </p>
        </div>
      ) : events.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-sm space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-900 mx-auto flex items-center justify-center border border-slate-200/80">
            <ImageIcon className="w-8 h-8 text-slate-700" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900">No Events Created Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Create your first photo event to start uploading event photographs and generating guest QR codes.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wider px-6 py-3 rounded-xl shadow-sm hover:shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Event</span>
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        /* Search No Results */
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md mx-auto text-slate-500 space-y-2">
          <p className="text-sm font-semibold text-slate-800">No matching events found</p>
          <p className="text-xs text-slate-500">Try adjusting your search query "{searchQuery}"</p>
        </div>
      ) : (
        /* Events Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group relative"
            >
              <div className="space-y-4">
                {/* Event Cover Banner / Thumbnail */}
                <div className="aspect-[16/9] bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden relative p-4 flex flex-col justify-between text-white shadow-sm">
                  {event.cover_photo_url && (
                    <img
                      src={getPublicMediaUrl(event.cover_photo_url)}
                      alt={event.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 z-0"
                    />
                  )}
                  {event.cover_photo_url && (
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-slate-950/40 z-0" />
                  )}

                  <div className="flex items-center justify-between relative z-10">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${
                        event.is_ready
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-md'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-400/30 backdrop-blur-md'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      {event.is_ready ? 'Ready for Guests' : 'Processing Photos'}
                    </span>

                    <button
                      disabled={deletingId === event.id}
                      onClick={(e) => handleDeleteEvent(event.id, e)}
                      title="Delete Event"
                      className="text-slate-300 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors disabled:opacity-50"
                    >
                      {deletingId === event.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="relative z-10">
                    <span className="text-[11px] font-mono text-slate-200 block uppercase tracking-wider font-semibold drop-shadow-sm">
                      {event.photo_count} / {event.max_photos} Photos
                    </span>
                  </div>
                </div>


                {/* Card Main Info */}
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-slate-800 transition-colors line-clamp-1">
                    {event.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Created {new Date(event.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedQREvent(event)}
                  className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5 text-slate-800" />
                  <span>QR Code</span>
                </button>

                <Link
                  to={`/events/${event.id}`}
                  className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs"
                >
                  <span>Manage Gallery</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 max-w-md w-full p-6 rounded-2xl shadow-2xl relative text-slate-900">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-1">Create Event Gallery</h3>
            <p className="text-xs text-slate-500 mb-6">
              Enter event name. You can upload up to 150 photos per gallery.
            </p>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Event Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Tech Conference 2026"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-slate-900 transition-colors"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Create Gallery</span>
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
