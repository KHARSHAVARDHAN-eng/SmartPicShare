import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Copy, Check, Download, QrCode as QrIcon } from 'lucide-react'

export const QRCodeModal = ({ event, onClose }) => {
  const [copied, setCopied] = useState(false)

  if (!event) return null

  const publicUrl = `${window.location.origin}/event/${event.slug}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadQR = () => {
    const svgElement = document.getElementById('event-qr-code')
    if (!svgElement) return

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = 400
      canvas.height = 400
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 20, 20, 360, 360)

      const pngFile = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.download = `${event.slug}-qr.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-card max-w-md w-full p-6 relative border border-slate-800 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-full bg-brand-500/10 text-brand-500 mx-auto flex items-center justify-center mb-3">
          <QrIcon className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">{event.name}</h3>
        <p className="text-xs text-slate-400 mb-6">Scan QR code or share link for guests</p>

        {/* Printable QR Code Display */}
        <div className="bg-white p-4 rounded-xl inline-block shadow-xl mb-6">
          <QRCodeSVG
            id="event-qr-code"
            value={publicUrl}
            size={220}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-left">
            <span className="text-xs text-slate-400 truncate flex-1 font-mono">{publicUrl}</span>
            <button
              onClick={handleCopyLink}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={handleDownloadQR}
            className="w-full flex items-center justify-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-lg shadow-brand-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Download Printable QR (PNG)</span>
          </button>
        </div>
      </div>
    </div>
  )
}
