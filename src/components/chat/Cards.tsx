import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useStore } from '../../store/store'
import { agentById } from '../../store/roster'
import { STRATEGY_BLURB } from '../../store/scripts'
import type { BuildCardData, PlanCardData, StrategyCardData, Strategy } from '../../store/types'
import { cx } from '../ui/cx'
import { Progress } from '../ui/Progress'
import { Button } from '../ui/Button'
import { Check, Pencil, Hammer, ChevronDown } from 'lucide-react'

/**
 * CARDS
 *
 * A card is a functional object attached to a message — a plan you can revise,
 * a build you can watch. It deliberately does NOT look like the message it
 * hangs from: the bubble is #26262a at 18px radius, the card is #18181b at
 * 12px with a #2c2c32 border. Different plane, different shape, so the two can never be confused and
 * the thread never reads as a pile of identical rounded rectangles.
 *
 * No decorative rows. A "Flow: Plan → Build → Review → Preview → Ship" strip
 * described the product's own process back to the user for no benefit.
 */

/** Shared card shell — elevated system container on the chat canvas. */
const Shell: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cx('overflow-hidden rounded-xl border border-line bg-surface', className)}>{children}</div>
)

const CardLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-micro font-semibold uppercase tracking-[0.06em] text-muted">{children}</span>
)
/** Plan, rendered as a message inside the Manager conversation. */
export const PlanCard: React.FC<{ card: PlanCardData }> = ({ card }) => {
  const { projectId = '' } = useParams()
  const requestRevision = useStore((s) => s.requestRevision)
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState('')

  const submit = () => {
    const v = note.trim()
    if (!v) return
    requestRevision(projectId, v)
    setNote('')
    setEditing(false)
  }

  return (
    <Shell>
      <div className="flex items-center justify-between px-4 pt-3">
        <CardLabel>Plan</CardLabel>
        {card.revision > 1 && (
          <span className="tabular text-micro text-muted">rev {card.revision}</span>
        )}
      </div>

      <div className="px-4 pb-3 pt-2.5">
        <h3 className="text-label font-semibold text-paper">{card.title}</h3>

        <p className="mt-2.5">
          <CardLabel>Core experience</CardLabel>
        </p>
        <ul className="mt-1.5 space-y-0.5">
          {card.features.map((f) => (
            <li key={f} className="flex gap-2.5 text-meta leading-relaxed text-paper">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-muted" aria-hidden />
              {f}
            </li>
          ))}
        </ul>

        <p className="mt-2.5">
          <CardLabel>Team</CardLabel>
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {card.team.map((t) => (
            <span key={t} className="rounded-full border border-accentPurple/30 bg-accentPurple/15 px-2 py-0.5 text-micro text-accentPurpleSoft">
              {agentById(t).name}
            </span>
          ))}
        </div>
      </div>

      {editing ? (
        <div className="border-t border-line px-4 py-3">
          <input
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
              if (e.key === 'Escape') setEditing(false)
            }}
            placeholder="e.g. add a sentiment analysis agent"
            className="h-9 w-full rounded-sm border border-line bg-input px-3 text-label text-paper placeholder:text-faint"
          />
          <div className="mt-2.5 flex gap-2">
            <Button size="sm" onClick={submit} disabled={!note.trim()}>
              Request
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 border-t border-line px-4 py-2.5">
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)} className="coarse-hit">
            <Pencil size={12} /> Adjust
          </Button>
          <Button
            size="sm"
            className="coarse-hit ml-auto"
            onClick={() => useStore.getState().managerSend(projectId, 'start building')}
          >
            <Hammer size={12} /> Start building
          </Button>
        </div>
      )}
    </Shell>
  )
}

/**
 * Strategy picker, also inline.
 *
 * The "Recommended" badge is gone entirely, with nothing replacing it. A
 * second badge competing with the radio mark made the control read as a
 * marketing panel rather than a choice; the selected state already says
 * which option is active.
 */
export const StrategyCard: React.FC<{ card: StrategyCardData }> = ({ card }) => {
  const { projectId = '' } = useParams()
  const chooseStrategy = useStore((s) => s.chooseStrategy)
  const chosen = card.options.find((o) => o === card.selected)

  return (
    <Shell>
      <div className="px-4 pt-3">
        <CardLabel>Approach</CardLabel>
      </div>

      <div className="mt-1.5 px-1.5 pb-1.5">
        {card.options.map((o) => {
          const active = o === card.selected
          const label = o.charAt(0).toUpperCase() + o.slice(1)
          return (
            <button
              key={o}
              type="button"
              onClick={() => chooseStrategy(projectId, o)}
              aria-pressed={active}
              className={cx(
                'flex w-full items-center gap-3 rounded-sm px-2.5 py-2 text-left',
                'transition-colors duration-instant ease-standard',
                active ? 'bg-bubble' : 'hover:bg-bubble/60',
              )}
            >
              <span
                className={cx(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                  active ? 'bg-accent' : 'border border-line',
                )}
              >
                {active && <Check size={9} className="text-white" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cx(
                    'block text-label',
                    active ? 'font-medium text-paper' : 'text-paper',
                  )}
                >
                  {label}
                </span>
                <span className="mt-0.5 block text-meta text-muted">{STRATEGY_BLURB[o]}</span>
              </span>
            </button>
          )
        })}
      </div>

      {chosen && (
        <div className="flex items-center justify-end border-t border-line px-4 py-2.5">
          <Button
            size="sm"
            className="coarse-hit"
            onClick={() => useStore.getState().managerSend(projectId, 'start building')}
          >
            <Hammer size={12} /> Start building
          </Button>
        </div>
      )}
    </Shell>
  )
}

/** Compact build status, inline. Collapsed by default. */
export const BuildCard: React.FC<{ card: BuildCardData }> = ({ card }) => {
  const [open, setOpen] = useState(false)
  const live = card.state === 'live'
  const active = Object.entries(card.progress).filter(([, v]) => v > 0)
  const overall = active.length ? Math.round(active.reduce((a, [, v]) => a + v, 0) / active.length) : 0

  return (
    <Shell>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-instant ease-standard hover:bg-bubble/40"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <CardLabel>Build</CardLabel>
            <span className="truncate text-label text-paper">{card.task}</span>
          </div>
          {/* The shared Progress primitive animates on the X axis only, so
              several agents updating at once never force layout. */}
          <Progress
            className="mt-2"
            value={live ? 100 : overall}
            label="Overall build progress"
          />
        </div>
        <span className="tabular shrink-0 text-meta text-muted">
          {live ? 'Live' : `${overall}%`}
        </span>
        <ChevronDown
          size={14}
          aria-hidden
          className={cx(
            'shrink-0 text-muted transition-transform duration-instant ease-standard',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="space-y-2 border-t border-line px-4 py-3">
          {active.length === 0 && <p className="text-meta text-muted">Waiting for the first specialist.</p>}
          {active.map(([id, v]) => (
            <div key={id} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-meta text-muted">{agentById(id).name}</span>
              <Progress className="flex-1" value={v} thickness={2} label={`${agentById(id).name} progress`} />
              <span className="tabular w-9 shrink-0 text-right text-meta text-muted">{v}%</span>
            </div>
          ))}
        </div>
      )}
    </Shell>
  )
}
