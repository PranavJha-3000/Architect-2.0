import React from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { ASSETS } from '../../assets'
import { COPY } from './landingCopy'
import { SectionHead } from './Primitives'
import { Reveal } from './Reveal'

export const Trust: React.FC = () => (
  <section id="docs" className="scroll-mt-16 border-t border-line">
    <div className="mx-auto max-w-6xl px-6 py-20 md:px-8 md:py-28">
      <Reveal>
        <SectionHead eyebrow={COPY.trust.eyebrow} title={COPY.trust.title} />
      </Reveal>
      <ul className="mt-10 grid gap-x-10 gap-y-6 md:grid-cols-2">
        {COPY.trust.items.map((t) => (
          <Reveal key={t.t}>
            <li className="flex gap-3">
              <Check size={15} className="mt-1 shrink-0 text-muted" aria-hidden />
              <div>
                <p className="text-label font-semibold text-paper">{t.t}</p>
                <p className="mt-1 text-body leading-relaxed text-muted">{t.d}</p>
              </div>
            </li>
          </Reveal>
        ))}
      </ul>
      <Reveal>
        <p className="mt-8 border-t border-line pt-5 font-mono text-[11px] leading-relaxed text-faint">
          {COPY.trust.nonClaims}
        </p>
      </Reveal>
    </div>
  </section>
)

export const FinalCTA: React.FC = () => (
  <section className="border-t border-line">
    <div className="mx-auto max-w-6xl px-6 py-24 text-center md:px-8 md:py-32">
      <Reveal>
        <h2 className="mx-auto max-w-xl text-[28px] font-semibold leading-[34px] tracking-tight text-paper md:text-[36px] md:leading-[42px]">
          {COPY.final.title}
        </h2>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/signup"
            className="inline-flex h-10 w-full items-center justify-center rounded-full bg-accent px-6 text-label font-medium text-white transition-all duration-instant ease-standard hover:bg-accentHover active:scale-[0.98] sm:w-auto"
          >
            {COPY.final.primary}
          </Link>
          <Link
            to="/home"
            className="inline-flex h-10 w-full items-center justify-center rounded-full border border-line bg-surface px-6 text-label font-medium text-paper transition-colors duration-instant hover:bg-bubble sm:w-auto"
          >
            {COPY.final.secondary}
          </Link>
        </div>
      </Reveal>
    </div>
  </section>
)

export const Footer: React.FC = () => (
  <footer className="border-t border-line">
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 md:flex-row md:items-start md:px-8">
      <div className="flex items-center gap-2.5">
        <img src={ASSETS.logos.white} alt="Lyzr AI" className="h-6 w-6 rounded-[6px]" />
        <div>
          <p className="text-label font-semibold text-paper">{COPY.footer.brand}</p>
          <p className="text-meta text-faint">{COPY.footer.by}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-8 md:ml-auto">
        {COPY.footer.cols.map((c) => (
          <div key={c.h}>
            <p className="text-micro font-semibold uppercase tracking-[0.06em] text-faint">{c.h}</p>
            <ul className="mt-3 space-y-2">
              {c.links.map((l) => (
                <li key={l}>
                  <a href="#top" className="text-[13px] text-muted transition-colors duration-instant hover:text-paper">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </footer>
)
