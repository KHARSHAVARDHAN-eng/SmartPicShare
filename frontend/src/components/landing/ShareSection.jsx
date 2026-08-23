import React from 'react'
import { QrCode, Link as LinkIcon, Smartphone } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

export const ShareSection = () => {
  const sampleUrl = 'https://smartsharephoto.app/event/gala-2026'

  return (
    <section className="py-24 md:py-32 bg-ivory-100/70 border-b border-warm-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Copy */}
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-warm-700 block">
              Section 03 — Distribution
            </span>

            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-charcoal-950 uppercase tracking-tight leading-none">
              One Link. <br />
              One QR Code.
            </h2>

            <p className="text-base text-charcoal-600 font-light leading-relaxed">
              Eliminate bulk drive links and password protected folders. Display a single printable QR code at the event venue or send one public link. Guests scan, sign in, and discover their personal photographs in seconds.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-3 p-3 bg-ivory-50 border border-warm-300">
                <QrCode className="w-5 h-5 text-charcoal-950" />
                <span className="text-xs font-mono uppercase tracking-wider text-charcoal-800">
                  Printable High-Resolution QR Codes
                </span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-ivory-50 border border-warm-300">
                <LinkIcon className="w-5 h-5 text-charcoal-950" />
                <span className="text-xs font-mono uppercase tracking-wider text-charcoal-800">
                  Custom Event Slugs & Direct Sharing
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Elegant QR Code & Smartphone Mockup */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="border border-warm-300 bg-ivory-50 p-8 max-w-sm w-full shadow-2xl text-center space-y-6">
              <div className="border-b border-warm-200 pb-4">
                <span className="text-xs font-serif italic text-charcoal-600 block">Scan to Preview</span>
                <span className="text-sm font-bold uppercase tracking-widest text-charcoal-950">Gala Event Gallery</span>
              </div>

              <div className="bg-white p-6 inline-block border border-warm-200">
                <QRCodeSVG
                  value={sampleUrl}
                  size={180}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="pt-2 text-[10px] font-mono text-charcoal-600 truncate border-t border-warm-200">
                {sampleUrl}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
