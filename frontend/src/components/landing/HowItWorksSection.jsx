import React from 'react'

export const HowItWorksSection = () => {
  const steps = [
    {
      number: '01',
      title: 'UPLOAD',
      description: "Photographers upload the event photos once. SmartSharePhoto automatically indexes faces across up to 150 high-resolution images.",
      image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80',
    },
    {
      number: '02',
      title: 'SHARE',
      description: 'Display a single QR code or distribute one custom event link. Every attendee receives instant access to the event landing page.',
      image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=80',
    },
    {
      number: '03',
      title: 'FIND YOURSELF',
      description: 'Guests snap or upload a single selfie. SmartSharePhoto scans the event embeddings and presents their personal photo gallery instantly.',
      image: '/images/find-yourself.png',
    },
  ]

  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-ivory-100/70 border-b border-warm-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-16">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-warm-300 pb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-warm-700 block mb-2">
              Process & Clarity
            </span>
            <h2 className="font-serif text-4xl sm:text-6xl font-bold text-charcoal-950 uppercase tracking-tight">
              How It Works
            </h2>
          </div>
          <p className="text-xs font-mono uppercase tracking-widest text-charcoal-600 mt-4 md:mt-0">
            Three Steps to Personal Galleries
          </p>
        </div>

        {/* 3 Step Editorial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step) => (
            <div key={step.number} className="group border border-warm-300 bg-ivory-50 p-6 flex flex-col justify-between hover:border-charcoal-950 transition-all">
              <div className="space-y-6">
                <div className="aspect-[4/3] bg-warm-100 overflow-hidden relative">
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 bg-charcoal-950 text-ivory-50 font-serif text-lg font-bold px-3 py-1">
                    {step.number}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-serif text-2xl font-bold text-charcoal-950 uppercase tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed font-light">
                    {step.description}
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-warm-200 text-[10px] font-mono uppercase tracking-widest text-charcoal-400">
                Step {step.number} of 03
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
