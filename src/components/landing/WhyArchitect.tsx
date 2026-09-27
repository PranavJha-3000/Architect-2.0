import React from 'react'
import { COPY } from './landingCopy'
import { SectionHead, MockShell, ChatBubble, ActivityRow } from './Primitives'
import { Reveal } from './Reveal'

export const WhyArchitect: React.FC = () => (
  <section id="product" className="mx-auto max-w-6xl scroll-mt-16 px-6 py-20 md:px-8 md:py-28">
    <Reveal>
      <SectionHead eyebrow={COPY.why.eyebrow} title={COPY.why.title} body={COPY.why.body} />
    </Reveal>
    <div className="mt-10 grid gap-10 md:grid-cols-2 md:items-start">
      <Reveal>
        <dl className="space-y-0 divide-y divide-line border-y border-line">
          {COPY.why.points.map((p) => (
            <div key={p.k} className="py-4">
              <dt className="text-label font-semibold text-paper">{p.k}</dt>
              <dd className="mt-1 text-body leading-relaxed text-muted">{p.v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-meta leading-relaxed text-faint">
          Manager in the center. Frontend, Backend, AI / ML, QA, DevOps around the work — handed off in chat, not wired in a diagram.
        </p>
      </Reveal>
      <Reveal delay={80}>
        <MockShell url="architect.app/p/streak-tracker — Manager">
          <div className="space-y-2.5 p-4">
            <ChatBubble from="manager" name="Manager">
              Streak API needs a home. Backend, take the storage and the weekly rollup.
            </ChatBubble>
            <ActivityRow>Manager routed work to #backend</ActivityRow>
            <ChatBubble from="agent" name="Backend">
              Done — streaks persist, rollup returns 7 days. Handing to QA.
            </ChatBubble>
            <ActivityRow>Manager routed work to #qa</ActivityRow>
            <ChatBubble from="agent" name="QA">
              14 cases pass, empty-week edge covered. Ready to ship.
            </ChatBubble>
            <ChatBubble from="manager" name="Manager">
              Reviewed. Preview is live — check it, then we commit.
            </ChatBubble>
          </div>
        </MockShell>
      </Reveal>
    </div>
  </section>
)
