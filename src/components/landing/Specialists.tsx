import React from 'react'
import { COPY } from './landingCopy'
import { SectionHead } from './Primitives'
import { Reveal } from './Reveal'

export const Specialists: React.FC = () => (
  <section className="border-t border-line">
    <div className="mx-auto max-w-6xl px-6 py-20 md:px-8 md:py-28">
      <Reveal>
        <SectionHead eyebrow={COPY.specialists.eyebrow} title={COPY.specialists.title} body={COPY.specialists.note} />
      </Reveal>
      <Reveal>
        <ul className="mt-10 divide-y divide-line border-y border-line">
          {COPY.specialists.list.map((s) => (
            <li key={s.short} className="flex items-center gap-4 py-4">
              <span
                aria-hidden
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accentPurple/20 text-[11px] font-semibold text-accentPurpleSoft"
              >
                {s.short}
              </span>
              <div className="min-w-0">
                <p className="text-label font-semibold text-paper">{s.name}</p>
                <p className="text-meta text-muted">{s.resp}</p>
              </div>
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  </section>
)
