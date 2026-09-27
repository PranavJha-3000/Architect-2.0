import React from 'react'
import { cx } from '../ui/cx'

/** Small uppercase eyebrow — micro only, muted. */
export const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-micro font-semibold uppercase tracking-[0.08em] text-faint">{children}</p>
)

export const SectionHead: React.FC<{ eyebrow: string; title: string; body?: string }> = ({ eyebrow, title, body }) => (
  <div className="max-w-2xl">
    <Eyebrow>{eyebrow}</Eyebrow>
    <h2 className="mt-3 text-[26px] font-semibold leading-[32px] tracking-tight text-paper md:text-[32px] md:leading-[38px]">
      {title}
    </h2>
    {body && <p className="mt-3 max-w-xl text-body leading-relaxed text-muted">{body}</p>}
  </div>
)

/** Browser/app frame used by every product mock on the page. `glass` is opt-in
 * and used by the hero only — other scenes stay opaque so translucent
 * surfaces never stack (Apple §12 legibility rule). */
export const MockShell: React.FC<{ url: string; children: React.ReactNode; className?: string; glass?: boolean }> = ({
  url,
  children,
  className,
  glass,
}) => (
  <div className={cx('overflow-hidden rounded-sm border border-line', glass ? 'glass-frame' : 'bg-surface', className)}>
    <div className="flex items-center gap-2 border-b border-line px-3 py-2">
      <span className="flex gap-1" aria-hidden>
        <i className="h-2 w-2 rounded-full bg-action" />
        <i className="h-2 w-2 rounded-full bg-action" />
        <i className="h-2 w-2 rounded-full bg-action" />
      </span>
      <span className="min-w-0 flex-1 truncate text-center font-mono text-[10px] text-faint">{url}</span>
      <span className="w-8" />
    </div>
    {children}
  </div>
)

/** Chat bubble in landing mocks — mirrors workspace grouping. */
export const ChatBubble: React.FC<{ from: 'user' | 'manager' | 'agent'; name: string; children: React.ReactNode }> = ({
  from,
  name,
  children,
}) => (
  <div className={cx('flex gap-2', from === 'user' && 'flex-row-reverse')}>
    <span
      aria-hidden
      className={cx(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold',
        from === 'user' ? 'bg-action text-paper' : from === 'manager' ? 'bg-accent text-white' : 'bg-accentPurple/25 text-accentPurpleSoft',
      )}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
    <div className={cx('max-w-[85%] rounded-md px-3 py-2 text-[12px] leading-relaxed', from === 'user' ? 'bg-bubble text-paper' : 'bg-ink text-paper')}>
      <p className="mb-0.5 text-[10px] font-medium text-muted">{name}</p>
      <div>{children}</div>
    </div>
  </div>
)

/** Activity / handoff line (routed to #frontend pattern). */
export const ActivityRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center justify-center gap-2 py-1 text-[11px] text-faint">
    <span className="h-px w-6 bg-line" aria-hidden />
    <span className="whitespace-nowrap">{children}</span>
    <span className="h-px w-6 bg-line" aria-hidden />
  </div>
)

/** Per-agent progress row — same visual recipe as PreviewPane AgentProgress. */
export const ProgressRow: React.FC<{ items: { short: string; pct: number }[]; task: string }> = ({ items, task }) => (
  <div className="border-b border-line px-3 py-2">
    <div className="flex items-center gap-3">
      <span className="truncate text-[11px] text-muted">{task}</span>
      <div className="ml-auto flex shrink-0 items-center gap-3">
        {items.map((c) => (
          <span key={c.short} className="inline-flex items-center gap-1.5 text-[11px] text-muted">
            <span className={cx('h-1.5 w-1.5 rounded-full', c.pct >= 100 ? 'bg-accent' : 'bg-muted')} aria-hidden />
            {c.short}
            <span className="tabular font-medium text-paper">{c.pct}%</span>
          </span>
        ))}
      </div>
    </div>
    <div className="mt-1.5 h-px w-full overflow-hidden rounded-full bg-bubble">
      <div
        className="h-full rounded-full bg-accent transition-all duration-shift ease-standard"
        style={{ width: `${Math.round(items.reduce((a, b) => a + b.pct, 0) / Math.max(1, items.length))}%` }}
      />
    </div>
  </div>
)

/** Commit / deploy status row. */
export const CommitRow: React.FC<{ hash: string; message: string; meta: string; status?: string }> = ({
  hash,
  message,
  meta,
  status,
}) => (
  <div className="flex items-center gap-3 p-3">
    <span className="rounded-full border border-line bg-ink px-2 py-0.5 font-mono text-[10px] text-muted">{hash}</span>
    <div className="min-w-0 flex-1">
      <p className="truncate text-[13px] text-paper">{message}</p>
      <p className="mt-0.5 text-[11px] text-muted">{meta}</p>
    </div>
    {status && (
      <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">{status}</span>
    )}
  </div>
)
