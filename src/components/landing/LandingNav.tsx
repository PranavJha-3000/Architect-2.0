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
      <nav className="ml-auto hidden items-center gap-5 text-[13px] text-muted md:flex" aria-label="Landing">
        <a href="#product" className="transition-colors duration-instant hover:text-paper">{COPY.nav.product}</a>
        <a href="#how" className="transition-colors duration-instant hover:text-paper">{COPY.nav.how}</a>
        <a href="#github" className="transition-colors duration-instant hover:text-paper">{COPY.nav.github}</a>
        <a href="#docs" className="transition-colors duration-instant hover:text-paper">{COPY.nav.docs}</a>
      </nav>
      <Link
        to="/signup"
        className="ml-auto inline-flex h-8 items-center rounded-full bg-accent px-4 text-[13px] font-medium text-white transition-colors duration-instant hover:bg-accentHover md:ml-0"
      >
        {COPY.nav.start}
      </Link>
    </div>
  </header>
)
