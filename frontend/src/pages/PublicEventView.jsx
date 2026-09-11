import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Camera,
  Upload,
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
  ShieldCheck,
  Image as ImageIcon,
} from 'lucide-react'
import { useAuth, API_BASE_URL } from '../context/AuthContext'
import { CameraModal } from '../components/CameraModal'

export const PublicEventView = () => {
  const { slug } = useParams()
  const { fetchWithAuth } = useAuth()
  
  const selfieFileInputRef = useRef(null)

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Camera Modal State
  const [isCameraOpen, setIsCameraOpen] = useState(false)

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
      setMatchError('Selfie file size exceeds 5 MB limit. Please select a smaller image.')
      return
    }

    setSelfieFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setSelfiePreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleCameraCapture = (file, previewUrl) => {
    setMatchError(null)
    setSelfieFile(file)
    setSelfiePreview(previewUrl)
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
      // Pre-select all matched photos for quick batch download
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
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
        <p className="text-sm font-medium text-slate-600">Loading guest gallery...</p>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 mx-auto flex items-center justify-center border border-red-200">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">{error || 'Event Not Found'}</h2>
        <p className="text-xs text-slate-500">Please check the URL or rescan the event QR code.</p>
        <Link
          to="/"
          className="inline-block bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          Return Home
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Event Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 text-center space-y-3 shadow-sm relative overflow-hidden">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-slate-900" />
          <span>AI Guest Photo Finder</span>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{event.name}</h1>

        <div className="flex items-center justify-center space-x-4 text-xs text-slate-500">
          <span className="flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{new Date(event.created_at).toLocaleDateString()}</span>
          </span>
          <span>•</span>
          <span className="font-mono font-semibold text-slate-700">{event.photo_count || 0} Total Event Photos</span>
        </div>
      </div>

      {/* Main Guest Selfie Action Container */}
      {matchResults ? (
        /* Personal AI Match Results Gallery */
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900">Your Matched Photos</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Found {matchResults.match_count} photos matching your selfie
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={resetSelfieSearch}
                className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Upload Another Selfie</span>
              </button>

              {matchResults.match_count > 0 && selectedPhotoIds.size > 0 && (
                <button
                  onClick={handleDownloadSelected}
                  className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Selected ({selectedPhotoIds.size})</span>
                </button>
              )}
            </div>
          </div>

          {/* Matches Photo Grid */}
          {matchResults.match_count === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-200">
                <Camera className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">No Matching Photos Found</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  We couldn't match your face with photos in this gallery yet. Make sure your selfie has clear face lighting!
                </p>
              </div>
              <button
                onClick={resetSelfieSearch}
                className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Another Selfie</span>
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
                    className={`group relative aspect-square bg-slate-100 rounded-2xl overflow-hidden border cursor-pointer shadow-sm hover:shadow-md transition-all ${
                      isSelected ? 'border-slate-900 ring-2 ring-slate-900/20' : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.original_filename}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Selection Checkbox Overlay */}
                    <button
                      onClick={(e) => toggleSelectPhoto(photo.photo_id, e)}
                      className="absolute top-2.5 left-2.5 text-white drop-shadow-md transition-transform hover:scale-110"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-slate-900 fill-white" />
                      ) : (
                        <Square className="w-5 h-5 text-white/80 hover:text-white" />
                      )}
                    </button>

                    {/* Similarity Percentage Pill */}
                    <span className="absolute bottom-2.5 left-2.5 bg-slate-900/90 backdrop-blur-md text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/20">
                      {Math.round(photo.similarity * 100)}% match
                    </span>

                    {/* Single Photo Download Button */}
                    <button
                      onClick={(e) => handleDownloadSingle(photo.url, photo.original_filename, e)}
                      title="Download Photo"
                      className="absolute bottom-2.5 right-2.5 p-1.5 bg-slate-900/80 backdrop-blur-md text-slate-200 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-slate-700"
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
        /* Selfie Capture & Photo Choice Card */
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 max-w-lg mx-auto text-center space-y-6 shadow-md relative">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-900 mx-auto flex items-center justify-center border border-slate-200 shadow-xs">
            <Camera className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-extrabold text-slate-900">Find Your Photos</h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Take a selfie with your camera or upload a photo to find every picture of you from this event.
            </p>
          </div>

          {matchError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs text-left shadow-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{matchError}</span>
            </div>
          )}

          {selfiePreview ? (
            /* Selected Selfie Preview & Submission Step */
            <div className="space-y-5 animate-fade-in">
              <div className="w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-slate-900 shadow-xl relative group">
                <img src={selfiePreview} alt="Selfie preview" className="w-full h-full object-cover" />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={resetSelfieSearch}
                  disabled={matching}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Change Photo
                </button>

                <button
                  onClick={handlePerformMatch}
                  disabled={matching}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-6 py-2.5 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
                >
                  {matching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Matching Face with AI...</span>
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
            /* Dual Input Options: Take Selfie (Live Camera) or Upload Photo */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Take Selfie via Live Camera Modal */}
                <button
                  onClick={() => setIsCameraOpen(true)}
                  className="flex flex-col items-center justify-center p-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all shadow-sm group cursor-pointer"
                >
                  <Camera className="w-7 h-7 mb-2 text-slate-200 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-wider">Take Selfie</span>
                  <span className="text-[10px] text-slate-300 mt-0.5">Open Live Webcam</span>
                </button>

                {/* Upload Photo File */}
                <button
                  onClick={() => selfieFileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-2xl transition-all border border-slate-200 group cursor-pointer"
                >
                  <Upload className="w-7 h-7 mb-2 text-slate-700 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-wider">Upload Photo</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Select from Disk</span>
                </button>
              </div>

              {/* Drag and Drop Zone Alternative */}
              <div
                onClick={() => selfieFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/50 rounded-2xl p-5 cursor-pointer transition-colors group"
              >
                <ImageIcon className="w-5 h-5 text-slate-400 group-hover:text-slate-700 mx-auto mb-1 transition-colors" />
                <span className="text-xs font-semibold text-slate-700 block">Or drag & drop photo here</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">JPEG, PNG, WEBP up to 5MB</span>
              </div>
            </div>
          )}

          {/* Hidden File Input for File Upload */}
          <input
            ref={selfieFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleSelfieSelect}
            className="hidden"
          />

          {/* Privacy Security Note */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Selfies are processed instantly and deleted automatically after search</span>
          </div>
        </div>
      )}

      {/* Live Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        onSwitchToUpload={() => selfieFileInputRef.current?.click()}
      />

      {/* Lightbox Modal */}
      {activeLightboxImage && (
        <div
          onClick={() => setActiveLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200 bg-black">
            <button
              onClick={() => setActiveLightboxImage(null)}
              className="absolute top-4 right-4 text-white p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 transition-colors"
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
