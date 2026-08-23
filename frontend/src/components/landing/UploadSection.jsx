import React from 'react'

export const UploadSection = () => {
  return (
    <section className="py-24 md:py-32 bg-ivory-50 border-b border-warm-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Editorial Photo Arrangement */}
          <div className="lg:col-span-6 relative order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="aspect-[3/4] border border-warm-300 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=600&q=80"
                    alt="Event photography portrait 1"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="aspect-square border border-warm-300 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=600&q=80"
                    alt="Event photography detail"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-8">
                <div className="aspect-square border border-warm-300 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80"
                    alt="Event photography crowd"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="aspect-[3/4] border border-warm-300 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=600&q=80"
                    alt="Event photography portrait 2"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Copy & Messaging */}
          <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-warm-700 block">
              Section 02 — Batch Processing
            </span>

            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-charcoal-950 uppercase tracking-tight leading-none">
              Upload Once. <br />
              Index Everything.
            </h2>

            <p className="text-base text-charcoal-600 font-light leading-relaxed">
              Photographers drag and drop up to 150 high-resolution event photographs. SmartSharePhoto processes facial features automatically in the background, making every photo instantly searchable without manual tagging or folder sorting.
            </p>

            <div className="pt-4 grid grid-cols-2 gap-6 border-t border-warm-200 text-xs uppercase tracking-widest font-mono">
              <div>
                <span className="block text-2xl font-serif font-bold text-charcoal-950">150</span>
                <span className="text-charcoal-600 text-[10px]">Photos per Event</span>
              </div>
              <div>
                <span className="block text-2xl font-serif font-bold text-charcoal-950">Automated</span>
                <span className="text-charcoal-600 text-[10px]">Face Indexing</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
