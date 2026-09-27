import React from 'react'
import { Link } from 'react-router-dom'
import { ASSETS } from '../../assets'
import { COPY } from './landingCopy'

export const LandingNav: React.FC = () => (
  <header className="glass-nav sticky top-0 z-40 border-b border-line">
    <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6 md:px-8">
      <a href="#top" className="flex items-center gap-2.5">
        <img src={ASSETS.logos.white} alt="Lyzr AI" className="h-6 w-6 rounded-[6px]" />
        <span className="text-label font-semibold tracking-tight text-paper">Architect 2.0</span>
      </a>
      <Link
        to="/signup"
        className="ml-auto inline-flex h-8 items-center rounded-full bg-accent px-4 text-[13px] font-medium text-white transition-colors duration-instant hover:bg-accentHover"
      >
        {COPY.nav.start}
      </Link>
    </div>
  </header>
)
