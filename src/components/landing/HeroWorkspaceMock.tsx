import React from 'react'
import { cx } from '../ui/cx'
import { ChatBubble, ActivityRow, ProgressRow } from './Primitives'

/** Mini heatmap preview cell grid. */
const Heatmap: React.FC<{ filled: number }> = ({ filled }) => (
  <div className="grid grid-cols-7 gap-1" aria-hidden>
    {Array.from({ length: 21 }).map((_, i) => (
      <span
        key={i}
        className={cx('h-3 rounded-[3px] transition-colors duration-shift', i < filled ? 'bg-accent' : 'bg-bubble')}
      />
    ))}
  </div>
)

export const HeroWorkspaceMock: React.FC<{ showProgress: boolean; filled: number }> = ({ showProgress, filled }) => (
  <div className="grid md:grid-cols-[210px_minmax(0,1fr)_300px]">
    <div className="hidden border-r border-line p-3 md:block">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white">M</span>
        <div className="min-w-0">
          <p className="truncate text-[12px] font-medium text-paper">streak-team</p>
          <p className="flex items-center gap-1 truncate text-[10px] text-faint">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />6 online · Manager + 5 specialists
          </p>
        </div>
      </div>
      <p className="px-1 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.06em] text-faint">Channels</p>
      {['frontend', 'backend', 'ai-ml', 'qa', 'devops'].map((c) => (
        <p key={c} className="rounded-[6px] px-2 py-1 font-mono text-[11px] text-muted">
          <span className="text-faint">#</span>
          {c}
        </p>
      ))}
    </div>
    <div className="min-w-0 space-y-2.5 border-r border-line p-4">
      <ChatBubble from="user" name="You">
        Habit tracker with streaks and a weekly heatmap. Simple, fast.
      </ChatBubble>
      <ChatBubble from="manager" name="Manager">
        Plan ready — 4 steps, 3 specialists. Frontend starts on the heatmap.
      </ChatBubble>
      <ActivityRow>Manager routed work to #frontend</ActivityRow>
      <div className={cx('transition-opacity duration-enter', showProgress ? 'opacity-100' : 'opacity-0')}>
        <ChatBubble from="agent" name="Frontend">
          Heatmap built — cells fill as streaks land. Ready in Preview.
        </ChatBubble>
      </div>
      <div className="flex items-center gap-2 rounded-md border border-line bg-ink px-3 py-2">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
        <p className="text-[11px] text-muted">Plan: Scope, Heatmap UI, Streak API, QA pass</p>
      </div>
    </div>
    <div className="min-w-0 bg-ink">
      <ProgressRow
        items={[{ short: 'FE', pct: showProgress ? 80 : 20 }, { short: 'BE', pct: showProgress ? 40 : 10 }]}
        task={showProgress ? 'Building heatmap…' : 'Planning…'}
      />
      <div className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-semibold text-paper">Streaks</p>
          <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">Live</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-[6px] border border-line bg-surface p-2.5">
            <p className="text-[10px] text-faint">Current</p>
            <p className="tabular text-[16px] font-semibold text-paper">12 days</p>
          </div>
          <div className="rounded-[6px] border border-line bg-surface p-2.5">
            <p className="text-[10px] text-faint">Best</p>
            <p className="tabular text-[16px] font-semibold text-paper">31 days</p>
          </div>
        </div>
        <p className="mb-2 mt-3 text-[11px] text-muted">This week</p>
        <Heatmap filled={filled} />
      </div>
    </div>
  </div>
)
