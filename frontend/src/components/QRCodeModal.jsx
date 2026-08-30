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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 max-w-md w-full p-6 rounded-2xl shadow-2xl relative text-center text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-900 mx-auto flex items-center justify-center mb-3 border border-slate-200">
          <QrIcon className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-1">{event.name}</h3>
        <p className="text-xs text-slate-500 mb-6">Scan QR code or share link for guests</p>

        {/* Printable QR Code Display */}
        <div className="bg-slate-50 p-4 rounded-2xl inline-block border border-slate-200 shadow-sm mb-6">
          <QRCodeSVG
            id="event-qr-code"
            value={publicUrl}
            size={220}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* Action Controls */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-left">
            <span className="text-xs text-slate-700 truncate flex-1 font-mono">{publicUrl}</span>
            <button
              onClick={handleCopyLink}
              className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-xs"
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
            className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download Printable QR (PNG)</span>
          </button>
        </div>
      </div>
    </div>
  )
}
