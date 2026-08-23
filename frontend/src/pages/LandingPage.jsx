import React from 'react'
import { LandingNav } from '../components/landing/LandingNav'
import { HeroSection } from '../components/landing/HeroSection'
import { HowItWorksSection } from '../components/landing/HowItWorksSection'
import { UploadSection } from '../components/landing/UploadSection'
import { ShareSection } from '../components/landing/ShareSection'
import { FindYourselfSection } from '../components/landing/FindYourselfSection'
import { GallerySection } from '../components/landing/GallerySection'
import { PhotographerSection } from '../components/landing/PhotographerSection'
import { FinalCTASection } from '../components/landing/FinalCTASection'
import { LandingFooter } from '../components/landing/LandingFooter'

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-ivory-50 text-charcoal-900 font-sans antialiased selection:bg-charcoal-950 selection:text-ivory-50">
      <LandingNav />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <UploadSection />
        <ShareSection />
        <FindYourselfSection />
        <GallerySection />
        <PhotographerSection />
        <FinalCTASection />
      </main>
      <LandingFooter />
    </div>
  )
}
