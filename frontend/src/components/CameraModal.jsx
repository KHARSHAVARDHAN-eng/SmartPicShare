import React, { useEffect, useRef, useState } from 'react'
import { Camera, X, RefreshCw, Check, AlertCircle, Upload } from 'lucide-react'

export const CameraModal = ({ isOpen, onClose, onCapture, onSwitchToUpload }) => {
  const videoRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [cameraError, setCameraError] = useState(null)
  const [capturedPreview, setCapturedPreview] = useState(null)
  const [capturedFile, setCapturedFile] = useState(null)

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }

  const startCamera = async () => {
    setCameraError(null)
    setCapturedPreview(null)
    setCapturedFile(null)

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error('Camera access error:', err)
      let msg = 'Could not access camera. Please check browser permissions.'
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. You can enable permissions or upload a photo file instead.'
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera device found. Please upload a photo file instead.'
      }
      setCameraError(msg)
    }
  }

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen])

  // Attach stream to video element when stream or videoRef becomes available
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream, capturedPreview])

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  const handleTakeSnapshot = () => {
    if (!videoRef.current) return

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Draw mirrored for natural selfie view
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    setCapturedPreview(dataUrl)

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' })
          setCapturedFile(file)
        }
      },
      'image/jpeg',
      0.92
    )

    stopCamera()
  }

  const handleRetake = () => {
    startCamera()
  }

  const handleUsePhoto = () => {
    if (capturedFile && capturedPreview) {
      onCapture(capturedFile, capturedPreview)
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white border border-slate-200 max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden relative text-slate-900 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Take Guest Selfie</h3>
              <p className="text-[11px] text-slate-500">Center your face in good lighting</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="p-6 flex-1 flex flex-col items-center justify-center bg-slate-950 min-h-[300px] relative">
          {cameraError ? (
            <div className="text-center space-y-4 max-w-xs p-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 mx-auto flex items-center justify-center border border-red-500/20">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
              <button
                onClick={() => {
                  handleClose()
                  if (onSwitchToUpload) onSwitchToUpload()
                }}
                className="inline-flex items-center space-x-2 bg-white text-slate-900 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Photo File Instead</span>
              </button>
            </div>
          ) : capturedPreview ? (
            /* Captured Preview Step */
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center shadow-inner">
              <img src={capturedPreview} alt="Captured selfie" className="w-full h-full object-cover" />
            </div>
          ) : (
            /* Live Camera Stream */
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-white/20 rounded-xl m-4 flex items-center justify-center">
                <div className="w-44 h-56 rounded-full border-2 border-white/40 border-dashed" />
              </div>
            </div>
          )}
        </div>

        {/* Action Controls Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between">
          {cameraError ? (
            <button
              onClick={handleClose}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
            >
              Cancel
            </button>
          ) : capturedPreview ? (
            <>
              <button
                onClick={handleRetake}
                className="flex items-center space-x-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retake Photo</span>
              </button>

              <button
                onClick={handleUsePhoto}
                className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-6 py-2.5 rounded-xl shadow-sm transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Use This Photo</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  handleClose()
                  if (onSwitchToUpload) onSwitchToUpload()
                }}
                className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Upload File</span>
              </button>

              <button
                onClick={handleTakeSnapshot}
                disabled={!stream}
                className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-6 py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Selfie</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
