import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { COPY } from './landingCopy'
import { Eyebrow, MockShell } from './Primitives'
import { HeroWorkspaceMock } from './HeroWorkspaceMock'

export const Hero: React.FC = () => {
  const [step, setStep] = useState(2)
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    let i = 2
    const t = setInterval(() => {
      i = (i + 1) % 3
      setStep(i)
    }, 2600)
    return () => clearInterval(t)
  }, [])
  const show = step >= 1
  const filled = step === 0 ? 5 : step === 1 ? 10 : 14

  return (
    <section className="mx-auto max-w-6xl px-6 pb-16 pt-16 md:px-8 md:pb-24 md:pt-24">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow>{COPY.hero.eyebrow}</Eyebrow>
        <h1 className="mt-4 text-balance text-[34px] font-semibold leading-[40px] tracking-tight text-paper md:text-[48px] md:leading-[54px]">
          Vibe coding feels like <span className="text-accentRed">a group chat.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-body leading-relaxed text-muted">{COPY.hero.sub}</p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/signup"
            className="inline-flex h-10 w-full items-center justify-center rounded-full bg-accent px-6 text-label font-medium text-white transition-all duration-instant ease-standard hover:bg-accentHover active:scale-[0.98] sm:w-auto"
          >
            {COPY.hero.primary}
          </Link>
        </div>
        <p className="mt-5 font-mono text-[10px] tracking-wide text-faint">{COPY.hero.meta}</p>
      </div>
      <MockShell url="architect.app/p/streak-tracker" glass className="mx-auto mt-12 max-w-5xl">
        <HeroWorkspaceMock showProgress={show} filled={filled} />
      </MockShell>
    </section>
  )
}
