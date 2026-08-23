import React from 'react'
import { Camera, Sparkles, ArrowRight } from 'lucide-react'

export const FindYourselfSection = () => {
  return (
    <section className="py-24 md:py-32 bg-ivory-50 border-b border-warm-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 text-center space-y-12">
        
        <div className="max-w-3xl mx-auto space-y-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-warm-700 block">
            Section 04 — Guest Experience
          </span>

          <h2 className="font-serif text-5xl sm:text-7xl font-extrabold text-charcoal-950 uppercase tracking-tight leading-none">
            Find Yourself.
          </h2>

          <p className="text-base sm:text-lg text-charcoal-600 font-light leading-relaxed">
            Take a clear selfie on your phone. SmartSharePhoto analyzes your facial features and presents a tailored gallery containing only photographs where you appear.
          </p>
        </div>

        {/* 3 Step Visual Concept */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
          <div className="border border-warm-300 bg-ivory-100 p-6 space-y-4">
            <div className="w-10 h-10 bg-charcoal-950 text-ivory-50 flex items-center justify-center font-mono text-sm font-bold">
              01
            </div>
            <h3 className="font-serif text-xl font-bold text-charcoal-950 uppercase">Snap a Selfie</h3>
            <p className="text-xs text-charcoal-600 font-light leading-relaxed">
              Use your mobile camera or upload an existing photo. Only your face is needed.
            </p>
          </div>

          <div className="border border-warm-300 bg-ivory-100 p-6 space-y-4">
            <div className="w-10 h-10 bg-charcoal-950 text-ivory-50 flex items-center justify-center font-mono text-sm font-bold">
              02
            </div>
            <h3 className="font-serif text-xl font-bold text-charcoal-950 uppercase">Instant Match</h3>
            <p className="text-xs text-charcoal-600 font-light leading-relaxed">
              Our vision engine matches your facial features against the event's photograph index.
            </p>
          </div>

          <div className="border border-warm-300 bg-ivory-100 p-6 space-y-4">
            <div className="w-10 h-10 bg-charcoal-950 text-ivory-50 flex items-center justify-center font-mono text-sm font-bold">
              03
            </div>
            <h3 className="font-serif text-xl font-bold text-charcoal-950 uppercase">Your Gallery</h3>
            <p className="text-xs text-charcoal-600 font-light leading-relaxed">
              View, select, and download high-resolution copies of your moments directly.
            </p>
          </div>
        </div>

      </div>
    </section>
  )
}
