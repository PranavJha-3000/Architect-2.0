import React from 'react'
import { LandingNav } from '../components/landing/LandingNav'
import { Hero } from '../components/landing/Hero'
import { ProofStrip } from '../components/landing/ProofStrip'
import { WhyArchitect } from '../components/landing/WhyArchitect'
import { HowItWorks } from '../components/landing/HowItWorks'
import { ProductScenes } from '../components/landing/ProductScenes'
import { Specialists } from '../components/landing/Specialists'
import { BuildExperience } from '../components/landing/BuildExperience'
import { CanvasSection, ShipSection } from '../components/landing/CanvasShip'
import { Trust, FinalCTA, Footer } from '../components/landing/TrustFinalFooter'

/**
 * Public landing page — deliberately outside RequireAuth/RequireOnboarded.
 * Self-contained scroll container: the app shell sets body overflow hidden,
 * so this page owns its own scroll (h-[100dvh] overflow-y-auto).
 * Reads no store, writes nothing.
 */
export const Landing: React.FC = () => (
  <div id="top" className="h-[100dvh] overflow-y-auto overflow-x-clip bg-ink text-paper">
    <LandingNav />
    <main>
      <Hero />
      <ProofStrip />
      <WhyArchitect />
      <HowItWorks />
      <ProductScenes />
      <Specialists />
      <BuildExperience />
      <CanvasSection />
      <ShipSection />
      <Trust />
      <FinalCTA />
    </main>
    <Footer />
  </div>
)
