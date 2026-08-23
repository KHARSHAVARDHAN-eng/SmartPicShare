import React from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const HeroSection = () => {
  const { user, signInWithGoogle } = useAuth()

  const handleAction = async () => {
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

  return (
    <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32 bg-ivory-50 border-b border-warm-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-end">
          
          {/* Left Column: Oversized Editorial Typography & CTAs */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest text-warm-700 bg-ivory-200/80 px-3.5 py-1.5 border border-warm-300/80">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Event Photo Intelligence</span>
            </div>

            <div className="space-y-2">
              <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-black text-charcoal-950 tracking-tightest leading-[0.95] uppercase">
                Your <br />
                Moments. <br />
                <span className="italic font-normal text-charcoal-700">Found.</span>
              </h1>
            </div>

            <p className="text-base sm:text-lg text-charcoal-600 max-w-xl font-light leading-relaxed">
              Stop searching through hundreds of event photos. SmartSharePhoto uses advanced face recognition to instantly present the exact moments you appear in.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={handleAction}
                className="inline-flex items-center justify-center space-x-3 bg-charcoal-950 hover:bg-charcoal-800 text-ivory-50 text-xs font-semibold uppercase tracking-widest px-8 py-4 border border-charcoal-950 transition-all shadow-md group"
              >
                <span>Find Your Photos</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#photographers"
                className="inline-flex items-center justify-center text-xs font-semibold uppercase tracking-widest text-charcoal-800 hover:text-charcoal-950 px-8 py-4 border border-warm-300 hover:border-charcoal-950 transition-all"
              >
                For Photographers
              </a>
            </div>
          </div>

          {/* Right Column: Editorial Photography Composition */}
          <div className="lg:col-span-5 relative">
            <div className="relative z-10 border border-warm-300 bg-ivory-100 p-3 shadow-xl">
              <div className="aspect-[4/5] overflow-hidden bg-warm-100 relative">
                <img
                  src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=85"
                  alt="High fashion wedding event photography"
                  className="w-full h-full object-cover filter contrast-[1.03] grayscale-[10%] hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/40 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-ivory-50 text-[11px] font-mono tracking-wider flex justify-between items-center uppercase">
                  <span>Gallery Snapshot</span>
                  <span>150 Photos Indexed</span>
                </div>
              </div>
            </div>

            {/* Overlapping Secondary Accent Image */}
            <div className="hidden sm:block absolute -bottom-8 -left-10 z-20 w-48 border border-warm-300 bg-ivory-50 p-2 shadow-2xl">
              <div className="aspect-square bg-warm-200 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80"
                  alt="Event guest detail photo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
