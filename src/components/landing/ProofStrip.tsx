import React from 'react'
import { COPY } from './landingCopy'
import { Reveal } from './Reveal'

export const ProofStrip: React.FC = () => (
  <section aria-label="Workflow" className="border-y border-line">
    <div className="mx-auto max-w-6xl overflow-x-auto px-6 md:px-8">
      <ol className="flex min-w-max items-stretch divide-x divide-line">
        {COPY.proof.map((s) => (
          <li key={s.n} className="flex-1 px-5 py-5 first:pl-0 last:pr-0">
            <Reveal>
              <p className="tabular font-mono text-[10px] text-faint">{s.n}</p>
              <p className="mt-1 text-label font-semibold text-paper">{s.label}</p>
              <p className="mt-0.5 whitespace-nowrap text-meta text-muted">{s.desc}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </div>
  </section>
)
