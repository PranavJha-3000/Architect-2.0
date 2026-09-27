import React from 'react'
import { ArrowRight } from 'lucide-react'
import { ASSETS } from '../../assets'
import { COPY } from './landingCopy'
import { SectionHead, MockShell, CommitRow } from './Primitives'
import { Reveal } from './Reveal'

export const CanvasSection: React.FC = () => (
  <section className="border-t border-line">
    <div className="mx-auto max-w-6xl px-6 py-20 md:px-8 md:py-28">
      <Reveal>
        <SectionHead eyebrow={COPY.canvas.eyebrow} title={COPY.canvas.title} body={COPY.canvas.body} />
      </Reveal>
      <Reveal>
        <MockShell url="architect.app/p/portal — UI Head" className="mt-10">
          <div className="grid md:grid-cols-2">
            <div className="border-b border-line p-4 md:border-b-0 md:border-r">
              <p className="text-[11px] text-faint">Imported screenshot</p>
              <div className="mt-2 rounded-[6px] border border-line bg-ink p-3">
                <div className="h-5 w-2/5 rounded-[4px] bg-bubble" aria-hidden />
                <div className="mt-2 grid grid-cols-2 gap-2" aria-hidden>
                  <div className="h-12 rounded-[4px] bg-bubble" />
                  <div className="h-12 rounded-[4px] bg-bubble" />
                </div>
                <div className="mt-2 h-7 w-1/3 rounded-full bg-action" aria-hidden />
              </div>
            </div>
            <div className="p-4">
              <p className="text-[11px] text-faint">Editable regions</p>
              <div className="mt-2 rounded-[6px] border border-line bg-ink p-3">
                <p className="text-[12px] font-medium text-paper">Header</p>
                <div className="mt-2 rounded-[6px] border border-muted/40 p-2">
                  <p className="text-[11px] text-paper">Invoice table</p>
                  <p className="text-[10px] text-faint">Selected — width 100%, padding 12</p>
                </div>
                <p className="mt-2 text-[11px] text-muted">Apply routes to Frontend — code stays in sync.</p>
              </div>
            </div>
          </div>
        </MockShell>
      </Reveal>
    </div>
  </section>
)

export const ShipSection: React.FC = () => (
  <section id="github" className="scroll-mt-16 border-t border-line">
    <div className="mx-auto max-w-6xl px-6 py-20 md:px-8 md:py-28">
      <Reveal>
        <SectionHead eyebrow={COPY.ship.eyebrow} title={COPY.ship.title} body={COPY.ship.body} />
      </Reveal>
      <Reveal>
        <div className="mt-8 flex flex-wrap items-center gap-2 font-mono text-[12px] text-muted" aria-label="Ship chain">
          {COPY.ship.chain.map((c, i) => (
            <React.Fragment key={c}>
              {i > 0 && <ArrowRight size={13} className="text-faint" aria-hidden />}
              <span
                className={
                  i === 0
                    ? 'rounded-full bg-accent px-3 py-1 font-sans font-medium text-white'
                    : i === COPY.ship.chain.length - 1
                      ? 'rounded-full border border-line px-3 py-1 text-paper'
                      : 'rounded-full border border-line px-3 py-1'
                }
              >
                {c}
              </span>
            </React.Fragment>
          ))}
        </div>
      </Reveal>
      <Reveal delay={60}>
        <MockShell url="architect.app/p/portal — github + deploy" className="mt-8">
          <div>
            <CommitRow hash="c41ad0" message="Portal v3 — client messages" meta="Manager · via GitHub · simulated" status="success" />
            <div className="flex items-center gap-2 border-t border-line px-3 py-2.5">
              <img src={ASSETS.icons.github} alt="" aria-hidden className="brand-icon h-3.5 w-3.5" />
              <span className="font-mono text-[10px] text-faint">main · deploy log ✓ Live at portal-v3.architect.app</span>
            </div>
          </div>
        </MockShell>
        <p className="mt-3 max-w-2xl text-meta leading-relaxed text-faint">{COPY.ship.honesty}</p>
      </Reveal>
    </div>
  </section>
)
