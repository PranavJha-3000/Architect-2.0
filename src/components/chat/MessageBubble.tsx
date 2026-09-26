import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { agentById } from '../../store/roster'
import type { Message } from '../../store/types'
import { Identity, SpecialistIdentity } from '../ui/Identity'
import { cx } from '../ui/cx'
import { PlanCard, StrategyCard, BuildCard } from './Cards'
import { displayName } from './grouping'
import { ArrowUpRight } from 'lucide-react'

/**
 * MESSAGE BUBBLE
 *
 * Bubbles are borderless. A 1px hairline on every bubble is what made a
 * twelve-message thread read as a stack of cards rather than a conversation;
 * separation is carried by the plane value alone — incoming on #18181b,
 * yours on #26262a, both sitting directly on the #121214 canvas.
 *
 * Identity (avatar + name) appears once per turn, not once per message. The
 * timestamp is revealed on hover or keyboard focus rather than occupying a
 * permanent row above every bubble.
 */

const clockTime = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

/**
 * Group width. A message column running the full 720px measure turned every
 * bubble into a full-bleed filled panel — which is exactly the "stack of
 * cards" read the redesign is removing. Capping the line length at 560px also
 * keeps the measure comfortable to read.
 */
const GROUP_WIDTH = 'max-w-[min(560px,100%)]'

export const MessageBubble: React.FC<{
  message: Message
  /** False for every message after the first in a turn. */
  startsGroup: boolean
  /** Adds the larger gap that separates one author group from the next. */
  lastInGroup: boolean
}> = ({ message, startsGroup, lastInGroup }) => {
  const { projectId = '' } = useParams()
  const navigate = useNavigate()
  const isUser = message.authorId === 'user'
  const isManager = message.authorId === 'manager'
  const agent = agentById(message.authorId)

  // Yours: right-aligned, no avatar, no name. The bubble is the whole object.
  if (isUser) {
    return (
      <div className={cx('group flex justify-end', lastInGroup ? 'mb-5' : 'mb-1.5')}>
        <div className="max-w-[min(560px,78%)]">
          <div className="rounded-2xl bg-bubble px-3.5 py-2.5 text-body leading-relaxed text-paper">
            {message.text}
          </div>
          {/* Hover-revealed so a short reply leaves no permanent gap. */}
          <p className="mt-1 pr-1 text-right text-micro text-muted opacity-0 transition-opacity duration-instant ease-standard group-hover:opacity-100 group-focus-within:opacity-100">
            {clockTime(message.ts)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cx('group flex items-start gap-3', lastInGroup ? 'mb-5' : 'mb-1.5')}>
      {/*
        The gutter is always present, so text never shifts horizontally when a
        turn starts or ends — the column stays put and only the avatar appears.
      */}
      <div className="w-7 shrink-0">
        {startsGroup &&
          (isManager ? <Identity size="sm" /> : <SpecialistIdentity name={agent.name} size="sm" />)}
      </div>

      <div className="min-w-0 flex-1">
        {startsGroup && (
          <div className="mb-1.5 flex items-baseline gap-2">
            <span className="text-label font-semibold text-paper">
              {displayName(message.authorId)}
            </span>
          </div>
        )}

        {message.text && (
          <div className={cx(GROUP_WIDTH, 'rounded-xl border border-line bg-surface px-3.5 py-2.5 text-body leading-relaxed text-paper')}>
            {message.text}
            {/* Hover-revealed, matching yours. */}
            <span className="ml-2 -translate-y-px align-middle text-micro text-muted opacity-0 transition-opacity duration-instant ease-standard group-hover:opacity-100 group-focus-within:opacity-100">
              {clockTime(message.ts)}
            </span>
          </div>
        )}

        {/* Routed chips sit directly against the message that carried them. */}
        {message.routedTo && message.routedTo.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {message.routedTo.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => navigate(`/p/${projectId}/thread/${ch}`)}
                className="coarse-hit inline-flex items-center gap-1 rounded-full bg-surface py-1 pl-2.5 pr-2 text-meta text-paper transition-colors duration-instant ease-standard hover:bg-bubble"
              >
                {agentById(ch).name}
                <ArrowUpRight size={10} className="text-muted" aria-hidden />
                <span className="sr-only">— open conversation</span>
              </button>
            ))}
          </div>
        )}

        {/* Cards are functional objects attached to a message, not a second
            message: a different plane (#18181b) with a #2c2c32 border and a
            tighter radius than the bubble above, so the two can never be mistaken for each other. */}
        {message.card && (
          <div className={cx(GROUP_WIDTH, message.text ? 'mt-2' : 'mt-1')}>
            {message.card.type === 'plan' && <PlanCard card={message.card} />}
            {message.card.type === 'strategy' && <StrategyCard card={message.card} />}
            {message.card.type === 'build' && <BuildCard card={message.card} />}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * ACTIVITY LINE
 *
 * Agent-to-agent chatter, rendered as background activity rather than as a
 * dimmed message. No avatar, no bubble, no glyph, no "overheard" label — you
 * can see the team working, and that is all you need to know.
 *
 * Names the agents involved. The recipient is NOT derived: `Message` records
 * no recipient, so a run by one agent reads `Frontend` and a run by several
 * reads `Frontend · Backend` — stating who was involved without claiming who
 * was talking to whom.
 */
export const ActivityLine: React.FC<{ agents: string[]; count: number }> = ({ agents, count }) => (
  <div className="mb-5 flex items-center gap-3" role="separator" aria-label="Team activity">
    <span className="h-px flex-1 bg-line" aria-hidden />
    <span className="shrink-0 text-micro text-muted">
      {agents.join(' · ')}
      {count > 1 && <span className="sr-only">, {count} messages</span>}
    </span>
    <span className="h-px flex-1 bg-line" aria-hidden />
  </div>
)

/**
 * TYPING INDICATOR
 * Three dots, no bubble. A bordered, pulsing pill around a loading state is
 * the most over-animated thing a chat can do — and it was rendered exactly
 * like a message.
 */
export const TypingRow: React.FC<{ authorId: string; startsGroup: boolean }> = ({
  authorId,
  startsGroup,
}) => {
  const isManager = authorId === 'manager'
  const name = displayName(authorId)
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="w-7 shrink-0">
        {startsGroup &&
          (isManager ? <Identity size="sm" /> : <SpecialistIdentity name={name} size="sm" />)}
      </div>
      <div className="flex items-center gap-3 pt-1">
        {startsGroup && <span className="text-label font-semibold text-paper">{name}</span>}
        <span className="flex items-center gap-1" role="status" aria-label={`${name} is typing`}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="motion-safe:animate-pulse h-1.5 w-1.5 rounded-full bg-muted"
              style={{ animationDelay: `${i * 0.16}s` }}
            />
          ))}
        </span>
      </div>
    </div>
  )
}
