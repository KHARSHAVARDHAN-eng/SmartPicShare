import React from 'react'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const FinalCTASection = () => {
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
    <section className="py-28 md:py-40 bg-charcoal-950 text-ivory-50 border-b border-charcoal-800 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-12 text-center space-y-10 relative z-10">
        
        <span className="text-xs font-semibold uppercase tracking-widest text-warm-300 block">
          Section 07 — Final Call
        </span>

        <h2 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tightest leading-[0.95]">
          Your Moments. <br />
          <span className="italic font-normal text-ivory-300">Waiting For You.</span>
        </h2>

        <p className="text-sm sm:text-base text-charcoal-300 font-light max-w-xl mx-auto leading-relaxed">
          Join photographers and attendees using SmartSharePhoto for effortless event photo discovery.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleAction}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 bg-ivory-50 hover:bg-ivory-200 text-charcoal-950 text-xs font-semibold uppercase tracking-widest px-10 py-4.5 border border-ivory-50 transition-all shadow-xl group"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <a
            href="#photographers"
            className="w-full sm:w-auto inline-flex items-center justify-center text-xs font-semibold uppercase tracking-widest text-ivory-200 hover:text-white px-10 py-4.5 border border-charcoal-700 hover:border-ivory-50 transition-all"
          >
            I'm a Photographer
          </a>
        </div>

      </div>
    </section>
  )
}
