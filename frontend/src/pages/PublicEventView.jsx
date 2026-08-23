import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Camera,
  Calendar,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Download,
  CheckSquare,
  Square,
  RotateCcw,
  X,
  ExternalLink,
  Lock,
  UserCheck,
} from 'lucide-react'
import { useAuth, API_BASE_URL } from '../context/AuthContext'

export const PublicEventView = () => {
  const { slug } = useParams()
  const { user, signInWithGoogle, fetchWithAuth } = useAuth()
  const selfieInputRef = useRef(null)

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Selfie & Matching State
  const [selfieFile, setSelfieFile] = useState(null)
  const [selfiePreview, setSelfiePreview] = useState(null)
  const [matching, setMatching] = useState(false)
  const [matchError, setMatchError] = useState(null)
  const [matchResults, setMatchResults] = useState(null)

  // Gallery Selection & Lightbox State
  const [selectedPhotoIds, setSelectedPhotoIds] = useState(new Set())
  const [activeLightboxImage, setActiveLightboxImage] = useState(null)

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

  const handleSelfieSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setMatchError(null)
    if (file.size > 5 * 1024 * 1024) {
      setMatchError('Selfie size exceeds 5 MB limit. Please select a smaller photo.')
      return
    }

    setSelfieFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setSelfiePreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handlePerformMatch = async () => {
    if (!selfieFile || !event) return

    try {
      setMatching(true)
      setMatchError(null)

      const formData = new FormData()
      formData.append('file', selfieFile)

      const res = await fetchWithAuth(`/api/v1/events/${event.id}/match`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error?.message || 'Failed to match selfie')
      }

      const data = await res.json()
      setMatchResults(data)
      // Pre-select all matched photos for quick download
      setSelectedPhotoIds(new Set(data.matches.map((m) => m.photo_id)))
    } catch (err) {
      setMatchError(err.message)
    } finally {
      setMatching(false)
    }
  }

  const toggleSelectPhoto = (photoId, e) => {
    e.stopPropagation()
    const next = new Set(selectedPhotoIds)
    if (next.has(photoId)) {
      next.delete(photoId)
    } else {
      next.add(photoId)
    }
    setSelectedPhotoIds(next)
  }

  const handleDownloadSingle = (url, filename, e) => {
    if (e) e.stopPropagation()
    const a = document.createElement('a')
    a.href = url
    a.download = filename || 'smartsharephoto.jpg'
    a.target = '_blank'
    a.click()
  }

  const handleDownloadSelected = () => {
    if (!matchResults) return
    const selectedMatches = matchResults.matches.filter((m) => selectedPhotoIds.has(m.photo_id))
    selectedMatches.forEach((m, idx) => {
      setTimeout(() => {
        handleDownloadSingle(m.url, m.original_filename)
      }, idx * 300)
    })
  }

  const resetSelfieSearch = () => {
    setSelfieFile(null)
    setSelfiePreview(null)
    setMatchResults(null)
    setMatchError(null)
    setSelectedPhotoIds(new Set())
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <p className="text-sm font-medium">Getting event details ready...</p>
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
        <p className="text-xs text-slate-400">Please verify the URL or scan your event QR code again.</p>
        <Link to="/" className="inline-block bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
          Go Home
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Event Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Event Gallery</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{event.name}</h1>

        <div className="flex items-center justify-center space-x-3 text-xs text-slate-400">
          <span className="flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(event.created_at).toLocaleDateString()}</span>
          </span>
          <span>•</span>
          <span className="font-mono">{event.processed_count} photos indexed</span>
        </div>
      </div>

      {/* Unauthenticated View */}
      {!user ? (
        <div className="glass-card p-8 max-w-md mx-auto text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-brand-500/10 text-brand-400 mx-auto flex items-center justify-center">
            <Camera className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Find Your Event Photos</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sign in with Google and submit a clear selfie to instantly unlock your personal photo gallery.
            </p>
          </div>

          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-slate-100 text-slate-900 font-semibold px-6 py-3 rounded-xl shadow-xl transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      ) : matchResults ? (
        /* Personal Gallery View */
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-4">
            <div>
              <h2 className="text-xl font-bold text-white">Your Personal Gallery</h2>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                {matchResults.match_count} photos found matching your face
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={resetSelfieSearch}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Another Selfie</span>
              </button>

              {matchResults.match_count > 0 && (
                <button
                  onClick={handleDownloadSelected}
                  disabled={selectedPhotoIds.size === 0}
                  className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-lg shadow-brand-600/20 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Selected ({selectedPhotoIds.size})</span>
                </button>
              )}
            </div>
          </div>

          {/* Matches Grid */}
          {matchResults.match_count === 0 ? (
            <div className="glass-card p-12 text-center max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">No Matching Photos Found</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                We found photos that look like you, but none in this event yet. Try uploading another selfie with good lighting!
              </p>
              <button
                onClick={resetSelfieSearch}
                className="inline-flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Upload Different Selfie</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {matchResults.matches.map((photo) => {
                const isSelected = selectedPhotoIds.has(photo.photo_id)

                return (
                  <div
                    key={photo.photo_id}
                    onClick={() => setActiveLightboxImage(photo.url)}
                    className={`group relative aspect-square bg-slate-900 rounded-xl overflow-hidden border cursor-pointer shadow-md transition-all ${
                      isSelected ? 'border-brand-500 ring-2 ring-brand-500/30' : 'border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.original_filename}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Selection Checkbox */}
                    <button
                      onClick={(e) => toggleSelectPhoto(photo.photo_id, e)}
                      className="absolute top-2.5 left-2.5 text-white drop-shadow-md transition-transform hover:scale-110"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-brand-500 fill-brand-500/20" />
                      ) : (
                        <Square className="w-5 h-5 text-white/80 hover:text-white" />
                      )}
                    </button>

                    {/* Similarity Pill */}
                    <span className="absolute bottom-2.5 left-2.5 bg-slate-950/80 backdrop-blur-md text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/20">
                      {Math.round(photo.similarity * 100)}% match
                    </span>

                    {/* Single Download Icon */}
                    <button
                      onClick={(e) => handleDownloadSingle(photo.url, photo.original_filename, e)}
                      title="Download Photo"
                      className="absolute bottom-2.5 right-2.5 p-1.5 bg-slate-950/80 backdrop-blur-md text-slate-300 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-slate-800"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* Selfie Capture & Upload Step */
        <div className="glass-card p-8 max-w-md mx-auto text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-brand-500/10 text-brand-400 mx-auto flex items-center justify-center">
            <Camera className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-white">Upload a Clear Selfie</h3>
            <p className="text-xs text-slate-400 mt-1">Upload or snap a selfie with only your face visible</p>
          </div>

          {matchError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs text-left">
              {matchError}
            </div>
          )}

          {selfiePreview ? (
            <div className="space-y-4">
              <div className="w-40 h-40 mx-auto rounded-full overflow-hidden border-2 border-brand-500 shadow-xl relative">
                <img src={selfiePreview} alt="Selfie preview" className="w-full h-full object-cover" />
              </div>

              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => {
                    setSelfieFile(null)
                    setSelfiePreview(null)
                  }}
                  disabled={matching}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 rounded-lg border border-slate-800 transition-colors"
                >
                  Change Photo
                </button>

                <button
                  onClick={handlePerformMatch}
                  disabled={matching}
                  className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-5 py-2 rounded-lg shadow-lg shadow-brand-600/20 transition-all disabled:opacity-50"
                >
                  {matching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Scanning face...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Find My Photos</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => selfieInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-8 cursor-pointer transition-colors group"
            >
              <Camera className="w-8 h-8 text-slate-500 group-hover:text-brand-400 mx-auto mb-2 transition-colors" />
              <span className="text-xs font-semibold text-white block">Tap to Upload or Take Selfie</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Supports JPEG, PNG, WEBP up to 5 MB</span>
            </div>
          )}

          <input
            ref={selfieInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="user"
            onChange={handleSelfieSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Full-screen Lightbox Modal */}
      {activeLightboxImage && (
        <div
          onClick={() => setActiveLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveLightboxImage(null)}
              className="absolute top-4 right-4 text-white p-2 rounded-full bg-slate-950/60 hover:bg-slate-950 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={activeLightboxImage} alt="Enlarged view" className="max-w-full max-h-[85vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  )
}
