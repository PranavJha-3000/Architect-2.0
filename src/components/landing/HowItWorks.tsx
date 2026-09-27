import React from 'react'
import { COPY } from './landingCopy'
import { SectionHead, MockShell, ProgressRow, CommitRow } from './Primitives'
import { Reveal } from './Reveal'

const Artifact: React.FC<{ step: string }> = ({ step }) => {
  if (step === '01')
    return (
      <div className="rounded-sm border border-line bg-ink p-3">
        <p className="text-[11px] text-faint">Describe</p>
        <p className="mt-1 rounded-md bg-bubble px-3 py-2 text-[12px] text-paper">
          Client portal for my studio — invoices, files, messages.
        </p>
      </div>
    )
  if (step === '02')
    return (
      <div className="rounded-sm border border-line bg-ink p-3">
        <p className="text-[11px] text-faint">Build plan · Balanced</p>
        <p className="mt-1 text-[12px] text-paper">Scope, Portal UI, Invoices API, QA pass, Deploy</p>
        <p className="mt-1 text-[11px] text-muted">Frontend, Backend, QA · ~4 min build</p>
      </div>
    )
  if (step === '03')
    return (
      <div className="overflow-hidden rounded-sm border border-line bg-ink">
        <ProgressRow
          items={[{ short: 'FE', pct: 70 }, { short: 'BE', pct: 45 }, { short: 'QA', pct: 20 }]}
          task="Building portal…"
        />
        <p className="px-3 py-2 text-[11px] text-muted">Frontend on invoices table · Backend on auth</p>
      </div>
    )
  return (
    <div className="overflow-hidden rounded-sm border border-line bg-ink">
      <CommitRow hash="a3f9c1" message="Portal v2 — invoices + files" meta="Manager · just now" status="success" />
      <p className="border-t border-line px-3 py-2 font-mono text-[10px] text-faint">portal-v2.architect.app</p>
    </div>
  )
}

export const HowItWorks: React.FC = () => (
  <section id="how" className="scroll-mt-16 border-t border-line">
    <div className="mx-auto max-w-6xl px-6 py-20 md:px-8 md:py-28">
      <Reveal>
        <SectionHead eyebrow={COPY.how.eyebrow} title={COPY.how.title} />
      </Reveal>
      <ol className="mt-10 divide-y divide-line border-y border-line">
        {COPY.how.steps.map((s, i) => (
          <li key={s.n} className="grid gap-5 py-7 md:grid-cols-[1fr_1fr] md:items-center md:gap-10">
            <Reveal>
              <p className="tabular font-mono text-[11px] text-faint">{s.n}</p>
              <h3 className="mt-1 text-title font-semibold text-paper">{s.label}</h3>
              <p className="mt-1.5 max-w-md text-body leading-relaxed text-muted">{s.desc}</p>
            </Reveal>
            <Reveal delay={60}>
              <MockShell url={`architect.app — ${s.label.toLowerCase()}`}>
                <div className="p-3">
                  <Artifact step={s.n} />
                </div>
              </MockShell>
              <p className="mt-2 hidden text-[11px] text-faint md:block">Step {i + 1} of 4</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </div>
  </section>
)
