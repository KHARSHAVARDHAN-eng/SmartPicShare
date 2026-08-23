import React from 'react'

export const GallerySection = () => {
  const galleryPhotos = [
    {
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=85',
      caption: 'Evening Reception Gala',
    },
    {
      url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=85',
      caption: 'Main Stage Keynote',
    },
    {
      url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=85',
      caption: 'Outdoor Cocktail Hour',
    },
    {
      url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=85',
      caption: 'Celebration Afterparty',
    },
  ]

  return (
    <section id="gallery" className="py-24 md:py-32 bg-ivory-100/70 border-b border-warm-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 space-y-16">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-warm-700 block">
            Section 05 — Curated Output
          </span>
          <h2 className="font-serif text-4xl sm:text-6xl font-bold text-charcoal-950 uppercase tracking-tight">
            Your Moments. <br />
            All In One Place.
          </h2>
          <p className="text-sm sm:text-base text-charcoal-600 font-light">
            Skip scrolling through hundreds of irrelevant photos. Only matching photos are delivered directly to your device.
          </p>
        </div>

        {/* Photography Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {galleryPhotos.map((photo, idx) => (
            <div
              key={idx}
              className="group border border-warm-300 bg-ivory-50 p-2 overflow-hidden hover:border-charcoal-950 transition-all"
            >
              <div className="aspect-[3/4] overflow-hidden bg-warm-200 relative">
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter contrast-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="absolute bottom-3 left-3 text-ivory-50 text-[10px] font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  {photo.caption}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
