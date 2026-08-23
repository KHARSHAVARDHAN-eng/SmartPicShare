import React from 'react'
import { ArrowRight, Camera, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const PhotographerSection = () => {
  const { user, signInWithGoogle } = useAuth()

  const handleCreateEventClick = async () => {
    if (user) {
      window.location.href = '/dashboard'
    } else {
      try {
        await signInWithGoogle()
      } catch (err) {
        console.error(err)
      }
    }
  }

  const features = [
    'Up to 150 photos per event gallery',
    'Automated ONNX face detection & 512-dim embedding extraction',
    'Printable QR code generator for live event venues',
    'Custom event URL slug creation',
    'Privacy-first event isolation & signed image URLs',
  ]

  return (
    <section id="photographers" className="py-24 md:py-32 bg-ivory-50 border-b border-warm-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Copy & Benefits */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest text-warm-700 bg-ivory-200 px-3 py-1 border border-warm-300">
              <Camera className="w-3.5 h-3.5" />
              <span>Section 06 — Professional Workflow</span>
            </div>

            <h2 className="font-serif text-4xl sm:text-6xl font-bold text-charcoal-950 uppercase tracking-tight leading-none">
              For Photographers. <br />
              <span className="italic font-normal text-charcoal-700">Upload Once. Share Everywhere.</span>
            </h2>

            <p className="text-base text-charcoal-600 font-light leading-relaxed max-w-xl">
              Elevate your event delivery workflow. Instead of sending raw drive links or manually tagging clients, upload your event gallery once and let SmartSharePhoto handle guest distribution automatically.
            </p>

            <div className="space-y-3 pt-2">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center space-x-3 text-xs sm:text-sm text-charcoal-800 font-light">
                  <div className="w-4 h-4 bg-charcoal-950 text-ivory-50 flex items-center justify-center rounded-full text-[10px]">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <button
                onClick={handleCreateEventClick}
                className="inline-flex items-center space-x-3 bg-charcoal-950 hover:bg-charcoal-800 text-ivory-50 text-xs font-semibold uppercase tracking-widest px-8 py-4 border border-charcoal-950 transition-all shadow-md group"
              >
                <span>Create an Event</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Column: High Quality Photography Asset */}
          <div className="lg:col-span-5">
            <div className="border border-warm-300 bg-ivory-100 p-3 shadow-xl">
              <div className="aspect-[4/5] bg-warm-200 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1000&q=85"
                  alt="Professional Photographer with camera"
                  className="w-full h-full object-cover filter contrast-[1.03]"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
