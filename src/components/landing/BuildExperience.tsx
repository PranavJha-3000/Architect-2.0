import React from 'react'
import { COPY } from './landingCopy'
import { SectionHead, MockShell, ChatBubble, ProgressRow } from './Primitives'
import { Reveal } from './Reveal'
import { cx } from '../ui/cx'

const CELLS = [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1]

export const BuildExperience: React.FC = () => (
  <section className="border-t border-line">
    <div className="mx-auto max-w-6xl px-6 py-20 md:px-8 md:py-28">
      <Reveal>
        <SectionHead eyebrow={COPY.build.eyebrow} title={COPY.build.title} body={COPY.build.body} />
      </Reveal>
      <Reveal>
        <MockShell url="architect.app/p/meals — building" className="mt-10">
          <div className="grid md:grid-cols-2">
            <div className="min-w-0 space-y-2.5 border-b border-line p-4 md:border-b-0 md:border-r">
              <ChatBubble from="user" name="You">Recipe planner from my grocery list.</ChatBubble>
              <ChatBubble from="manager" name="Manager">Frontend is laying out the week view. Backend is mapping ingredients.</ChatBubble>
              <ProgressRow
                items={[{ short: 'FE', pct: 65 }, { short: 'BE', pct: 45 }]}
                task="Building week view…"
              />
            </div>
            <div className="min-w-0 bg-ink p-4">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold text-paper">Week plan</p>
                <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">Building</span>
              </div>
              <div className="mt-3 space-y-1.5">
                {['Mon — Lentil soup', 'Tue — Veg stir-fry', 'Wed — Pasta al limone', 'Thu — …'].map((d, i) => (
                  <div key={d} className="flex items-center gap-2 rounded-[6px] border border-line bg-surface px-2.5 py-1.5">
                    <span className={cx('h-1.5 w-1.5 rounded-full', i < 3 ? 'bg-accent' : 'animate-pulse bg-muted')} aria-hidden />
                    <p className="text-[12px] text-paper">{d}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-7 gap-1" aria-hidden>
                {CELLS.map((c, i) => (
                  <span key={i} className={cx('h-3 rounded-[3px]', c ? 'bg-accent' : 'bg-bubble')} />
                ))}
              </div>
            </div>
          </div>
        </MockShell>
      </Reveal>
    </div>
  </section>
)
