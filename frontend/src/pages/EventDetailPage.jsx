import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  QrCode,
  Copy,
  Check,
  ArrowLeft,
  Loader2,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { QRCodeModal } from '../components/QRCodeModal'

export const EventDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fetchWithAuth } = useAuth()
  const fileInputRef = useRef(null)

  const [event, setEvent] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Upload State
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [uploadError, setUploadError] = useState(null)

  // Modal States
  const [showQR, setShowQR] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [copied, setCopied] = useState(false)

  const loadEventData = async () => {
    try {
      const [evtRes, photosRes] = await Promise.all([
        fetchWithAuth(`/api/v1/events/${id}`),
        fetchWithAuth(`/api/v1/events/${id}/photos`),
      ])

      if (evtRes.status === 404) {
        setError('Event not found')
        return
      }

      if (!evtRes.ok) throw new Error('Failed to load event')
      const evtData = await evtRes.json()
      setEvent(evtData)

      if (photosRes.ok) {
        const photosData = await photosRes.json()
        setPhotos(photosData)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEventData()
    // Poll metrics every 6 seconds to update background processing statuses
    const interval = setInterval(loadEventData, 6000)
    return () => clearInterval(interval)
  }, [id])

  const handleCopyLink = () => {
    if (!event) return
    const publicUrl = `${window.location.origin}/event/${event.slug}`
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    setUploadError(null)

    // 1. Client-side validation: Format & Size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxSize = 10 * 1024 * 1024 // 10MB

    const validFiles = []
    for (const f of selectedFiles) {
      if (!allowedTypes.includes(f.type)) {
        setUploadError(`Invalid file format '${f.name}'. Only JPEG, PNG, WEBP are allowed.`)
        return
      }
      if (f.size > maxSize) {
        setUploadError(`File '${f.name}' exceeds 10 MB limit.`)
        return
      }
      validFiles.push(f)
    }

    // 2. Client-side validation: Max 150 photos per event
    const currentCount = photos.length
    if (currentCount + validFiles.length > 150) {
      setUploadError(
        `Cannot upload ${validFiles.length} photos. Current count: ${currentCount}/150. Maximum limit is 150 photos per event.`
      )
      return
    }

    // 3. Perform batch upload to backend
    try {
      setUploading(true)
      setUploadProgress({
        selected: validFiles.length,
        status: 'Uploading to cloud storage...',
      })

      const formData = new FormData()
      validFiles.forEach((file) => formData.append('files', file))

      const res = await fetchWithAuth(`/api/v1/events/${id}/photos`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error?.message || 'Failed to upload photos')
      }

      await loadEventData()
      setUploadProgress({
        selected: validFiles.length,
        status: 'Upload complete! Processing face embeddings...',
      })
      setTimeout(() => setUploadProgress(null), 3000)
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeletePhoto = async (photoId, e) => {
    e.stopPropagation()
    if (!confirm('Delete this photo?')) return

    try {
      const res = await fetchWithAuth(`/api/v1/photos/${photoId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete photo')
      setPhotos(photos.filter((p) => p.id !== photoId))
      await loadEventData()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDeleteEvent = async () => {
    if (!confirm('Are you sure you want to delete this event and all uploaded photos?')) return

    try {
      const res = await fetchWithAuth(`/api/v1/events/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete event')
      navigate('/dashboard')
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <p className="text-sm font-medium">Loading event management details...</p>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">{error || 'Event Not Found'}</h2>
        <Link to="/dashboard" className="inline-flex items-center space-x-2 text-sm text-brand-400 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    )
  }

  const publicUrl = `${window.location.origin}/event/${event.slug}`

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Events</span>
        </Link>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowQR(true)}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors"
          >
            <QrCode className="w-4 h-4 text-brand-400" />
            <span>Generate QR</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Link' : 'Share Link'}</span>
          </button>

          <button
            onClick={handleDeleteEvent}
            title="Delete Event"
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{event.name}</h1>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                event.is_ready
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {event.is_ready ? 'Event Ready for Guests' : 'Processing Faces'}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400 mt-2">
            <span>Public URL:</span>
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="text-brand-400 hover:underline inline-flex items-center space-x-1 font-mono"
            >
              <span>{publicUrl}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Upload Trigger Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={photos.length >= 150 || uploading}
          className="flex items-center justify-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg shadow-brand-600/20 transition-all hover:scale-[1.02] disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Photos</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Status Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <span className="text-xs text-slate-400 block mb-1">Total Photos</span>
          <span className="text-2xl font-bold text-white font-mono">{photos.length} / 150</span>
        </div>

        <div className="glass-card p-4">
          <span className="text-xs text-slate-400 block mb-1">Indexed Faces</span>
          <span className="text-2xl font-bold text-emerald-400 font-mono">{event.processed_count}</span>
        </div>

        <div className="glass-card p-4">
          <span className="text-xs text-slate-400 block mb-1">Pending</span>
          <span className="text-2xl font-bold text-amber-400 font-mono">{event.pending_count}</span>
        </div>

        <div className="glass-card p-4">
          <span className="text-xs text-slate-400 block mb-1">Failed</span>
          <span className="text-2xl font-bold text-red-400 font-mono">{event.failed_count}</span>
        </div>
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm flex items-center justify-between">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Progress Indicator */}
      {uploadProgress && (
        <div className="glass-card p-4 border-brand-500/30 bg-brand-500/5 flex items-center space-x-3">
          <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
          <div className="flex-1">
            <span className="text-xs font-medium text-brand-300 block">{uploadProgress.status}</span>
            <span className="text-[10px] text-slate-400">Processing {uploadProgress.selected} photos in background</span>
          </div>
        </div>
      )}

      {/* Photo Grid Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Event Photographs</h2>
          <span className="text-xs text-slate-400">Click photo to enlarge</span>
        </div>

        {photos.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-12 text-center cursor-pointer transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-slate-900 text-slate-400 group-hover:text-brand-400 mx-auto flex items-center justify-center mb-3 transition-colors">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white">Drag & drop or click to upload photos</p>
            <p className="text-xs text-slate-500 mt-1">Supports JPEG, PNG, WEBP up to 10MB (Max 150 photos)</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedImage(photo.public_url)}
                className="group relative aspect-square bg-slate-900 rounded-xl overflow-hidden border border-slate-800 cursor-pointer shadow-md hover:border-slate-600 transition-all"
              >
                <img
                  src={photo.public_url}
                  alt={photo.original_filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Status Overlay Badge */}
                <div className="absolute top-2 left-2">
                  {photo.processing_status === 'PROCESSED' && (
                    <span className="bg-slate-950/80 backdrop-blur-md text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Indexed
                    </span>
                  )}
                  {photo.processing_status === 'PENDING' && (
                    <span className="bg-slate-950/80 backdrop-blur-md text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center border border-amber-500/20">
                      <Clock className="w-3 h-3 mr-1 animate-spin" />
                      Processing
                    </span>
                  )}
                  {photo.processing_status === 'FAILED' && (
                    <span className="bg-slate-950/80 backdrop-blur-md text-red-400 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center border border-red-500/20">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Failed
                    </span>
                  )}
                </div>

                {/* Delete Hover Action */}
                <button
                  onClick={(e) => handleDeletePhoto(photo.id, e)}
                  title="Delete Photo"
                  className="absolute bottom-2 right-2 p-1.5 bg-slate-950/80 backdrop-blur-md text-slate-400 hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-slate-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQR && <QRCodeModal event={event} onClose={() => setShowQR(false)} />}

      {/* Lightbox Image Preview Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-800">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white p-2 rounded-full bg-slate-950/60 hover:bg-slate-950 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={selectedImage} alt="Enlarged view" className="max-w-full max-h-[85vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  )
}
