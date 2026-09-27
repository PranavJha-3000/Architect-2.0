import React from 'react'
import { ASSETS } from '../../assets'
import { COPY } from './landingCopy'
import { SectionHead, MockShell, ChatBubble, ActivityRow, ProgressRow, CommitRow } from './Primitives'
import { Reveal } from './Reveal'

const SceneA = () => (
  <div className="space-y-2.5 p-4">
    <ChatBubble from="user" name="You">Price board for indie game launches.</ChatBubble>
    <ChatBubble from="manager" name="Manager">Scoped: feed, filters, price history. Lean team — Frontend + Backend.</ChatBubble>
    <ActivityRow>Manager routed work to #frontend, #backend</ActivityRow>
  </div>
)

const SceneB = () => (
  <div className="p-4">
    <div className="rounded-[6px] border border-line bg-ink p-3">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-semibold text-paper">Launch board</p>
        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-white">New entry</span>
      </div>
      <div className="mt-2 rounded-[6px] border border-muted/40 p-2">
        <p className="text-[11px] text-paper">Price feed</p>
        <p className="text-[10px] text-faint">Selected region — drag to resize</p>
      </div>
      <p className="mt-2 text-[11px] text-muted">Canvas: screenshot converted to editable UI.</p>
    </div>
  </div>
)

const SceneC = () => (
  <div>
    <ProgressRow items={[{ short: 'FE', pct: 100 }, { short: 'QA', pct: 60 }]} task="Preview updating…" />
    <div className="flex items-center gap-2 p-4">
      {['Desktop', 'Tablet', 'Mobile'].map((v, i) => (
        <span
          key={v}
          className={
            i === 0
              ? 'rounded-full bg-accent px-3 py-1 text-[11px] font-medium text-white'
              : 'rounded-full border border-line px-3 py-1 text-[11px] text-muted'
          }
        >
          {v}
        </span>
      ))}
      <span className="ml-auto rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">Live</span>
    </div>
  </div>
)

const SceneD = () => (
  <div>
    <div className="border-b border-line bg-ink p-3 font-mono text-[11px] leading-relaxed">
      <p><span className="text-faint">1 </span><span className="text-paper">import</span> <span className="text-muted">feed from './feed'</span></p>
      <p><span className="text-faint">2 </span><span className="text-muted">// loading, error and empty states handled</span></p>
      <p><span className="text-faint">3 </span><span className="text-paper">export default</span> <span className="text-muted">launchBoard</span></p>
    </div>
    <CommitRow hash="7bd2e4" message="Launch board v1 — feed + filters" meta="via GitHub · simulated" status="success" />
    <div className="flex items-center gap-2 border-t border-line px-3 py-2.5">
      <img src={ASSETS.icons.github} alt="" aria-hidden className="brand-icon h-3.5 w-3.5" />
      <span className="font-mono text-[10px] text-faint">launch-board-v1.architect.app · deploy log ✓ Live</span>
    </div>
  </div>
)

const SCENES: { body: React.ReactNode }[] = [{ body: <SceneA /> }, { body: <SceneB /> }, { body: <SceneC /> }, { body: <SceneD /> }]

export const ProductScenes: React.FC = () => (
  <section className="border-t border-line">
    <div className="mx-auto max-w-6xl px-6 py-20 md:px-8 md:py-28">
      <Reveal>
        <SectionHead eyebrow={COPY.scenes.eyebrow} title={COPY.scenes.title} />
      </Reveal>
      <div className="mt-10 space-y-14">
        {COPY.scenes.items.map((s, i) => (
          <div key={s.k} className="grid gap-5 md:grid-cols-[280px_minmax(0,1fr)] md:items-start md:gap-10">
            <Reveal>
              <p className="font-mono text-[11px] text-faint">{s.k}</p>
              <h3 className="mt-1 text-title font-semibold text-paper">{s.title}</h3>
              <p className="mt-1.5 text-body leading-relaxed text-muted">{s.desc}</p>
            </Reveal>
            <Reveal delay={60}>
              <MockShell url={`architect.app — ${s.title.toLowerCase()}`}>{SCENES[i].body}</MockShell>
            </Reveal>
          </div>
        ))}
      </div>
    </div>
  </section>
)
