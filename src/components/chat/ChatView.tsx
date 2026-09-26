import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useStore } from '../../store/store'
import { agentById, CHANNEL_EMPTY } from '../../store/roster'
import { STARTER_SUGGESTIONS } from '../../store/scripts'
import type { ChannelId } from '../../store/types'
import { EmptyState } from '../ui/EmptyState'
import { MessageBubble, ActivityLine, TypingRow } from './MessageBubble'
import { buildChatRows, isLastInTurn } from './grouping'
import { cx } from '../ui/cx'
import { Send, Hash, ArrowDown } from 'lucide-react'

/** How close to the bottom still counts as "following the conversation". */
const STICKY_PX = 96

/** The composer grows to five lines, then scrolls internally. */
const MAX_COMPOSER_LINES = 5

export const ChatView: React.FC<{ mode: 'manager' | 'channel' | 'dm'; channelId?: ChannelId; agentId?: string }> = ({ mode, channelId, agentId }) => {
  const { projectId = '' } = useParams()
  const threadKey = mode === 'manager' ? 'manager' : mode === 'dm' ? `dm:${agentId}` : channelId!
  const thread = useStore((s) => s.threads[`${projectId}:${threadKey}`])
  const project = useStore((s) => s.projects.find((p) => p.id === projectId))
  const managerSend = useStore((s) => s.managerSend)
  const channelSend = useStore((s) => s.channelSend)
  const dmSend = useStore((s) => s.dmSend)
  const readThread = useStore((s) => s.readThread)
  const managerRoute = useStore((s) => s.managerRoute)
  const [text, setText] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const [atBottom, setAtBottom] = useState(true)
  const [showJump, setShowJump] = useState(false)

  const isChannel = mode === 'channel'
  const isDm = mode === 'dm'
  const counterpart = isDm ? agentId! : isChannel ? channelId! : 'manager'
  const isActive = thread?.active ?? true
  const isBriefing = project?.planState === 'briefing'
  const showSuggestions = mode === 'manager' && isBriefing && (thread?.messages.length ?? 0) <= 1

  const messages = useMemo(
    () => thread?.messages.filter((m) => m.kind !== 'system') ?? [],
    [thread?.messages],
  )
  const rows = useMemo(() => buildChatRows(messages), [messages])

  useEffect(() => {
    if (thread) readThread(thread.id)
  }, [thread?.id, thread?.messages.length])

  /**
   * BOTTOM-AWARE AUTOSCROLL
   *
   * This scrolled on every message, so reading back through history and
   * receiving a reply yanked you to the bottom mid-sentence. Now the view
   * follows the conversation only when the user is already near it; anyone
   * reading history keeps their position and gets a quiet jump affordance.
   */
  const scrollToBottom = useCallback((smooth: boolean) => {
    const el = scrollRef.current
    if (!el) return
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ top: el.scrollHeight, behavior: smooth && !reduce ? 'smooth' : 'auto' })
  }, [])

  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    const near = distance <= STICKY_PX
    setAtBottom(near)
    setShowJump(!near)
  }, [])

  // Runs before paint so new content never flashes at the wrong offset.
  useLayoutEffect(() => {
    if (atBottom) scrollToBottom(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, thread?.typing])

  /** Composer auto-grows to five lines, then scrolls internally. */
  useLayoutEffect(() => {
    const el = composerRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 22 * MAX_COMPOSER_LINES)}px`
  }, [text])

  const submit = (value?: string) => {
    const v = (value ?? text).trim()
    if (!v || !isActive) return
    if (mode === 'manager') managerSend(projectId, v)
    else if (isDm) dmSend(projectId, agentId!, v)
    else channelSend(projectId, channelId!, v)
    setText('')
    // Sending is an explicit act, so always return to the newest message.
    requestAnimationFrame(() => scrollToBottom(true))
  }

  if (isChannel && !isActive) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          icon={<Hash size={18} />}
          title={CHANNEL_EMPTY}
          body="Ask The Manager to route work here and this conversation will start."
          actionLabel={`Bring in ${agentById(channelId!).name}`}
          onAction={() => managerRoute(projectId, [channelId!])}
        />
      </div>
    )
  }

  const canSend = !!text.trim() && isActive

  /**
   * The typing indicator joins the last turn rather than starting its own, so
   * a reply arriving straight after the Manager spoke does not repeat the
   * avatar and name.
   */
  const lastRow = rows[rows.length - 1]
  const typingStartsGroup = !lastRow || lastRow.kind !== 'message' || lastRow.startsGroup

  const placeholder = isDm
    ? `Message ${agentById(agentId!).name} privately…`
    : mode === 'manager'
      ? 'Message The Manager…'
      : `Message ${agentById(channelId!).name}…`

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-ink">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-5 pt-6"
      >
        <div className="mx-auto max-w-[720px] pb-6">
          {rows.map((row, i) =>
            row.kind === 'activity' ? (
              <ActivityLine key={`act-${i}`} agents={row.agents} count={row.count} />
            ) : (
              <MessageBubble
                key={row.message.id}
                message={row.message}
                startsGroup={row.startsGroup}
                lastInGroup={isLastInTurn(rows, i)}
              />
            ),
          )}

          {/* Typing continues the current turn when the same author spoke last. */}
          {thread?.typing && (
            <TypingRow
              authorId={counterpart}
              startsGroup={typingStartsGroup}
            />
          )}

          {showSuggestions && (
            <div className="mb-5 ml-10 flex flex-wrap gap-1.5">
              {STARTER_SUGGESTIONS.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => submit(s)}
                  className={cx(
                    'coarse-hit inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-meta transition-colors duration-instant ease-standard',
                    i === 0 && 'border-accent/40 bg-accent/15 text-[#4da2ff] hover:bg-accent/25',
                    i === 1 && 'border-accentPurple/40 bg-accentPurple/15 text-accentPurpleSoft hover:bg-accentPurple/25',
                    i === 2 && 'border-line bg-surface text-paper hover:bg-bubble',
                  )}
                >
                  <span
                    aria-hidden
                    className={cx(
                      'h-1.5 w-1.5 rounded-full',
                      i === 0 && 'bg-[#4da2ff]',
                      i === 1 && 'bg-accentPurpleSoft',
                      i === 2 && 'bg-muted',
                    )}
                  />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Jump affordance — only while reading history. */}
      {showJump && (
        <button
          type="button"
          onClick={() => {
            scrollToBottom(true)
            setShowJump(false)
            setAtBottom(true)
          }}
          aria-label="Jump to latest message"
          title="Jump to latest message"
          className="coarse-hit absolute bottom-[84px] left-1/2 z-10 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-surface text-muted transition-colors duration-instant ease-standard hover:text-paper"
        >
          <ArrowDown size={14} aria-hidden />
        </button>
      )}

      <div className="shrink-0 border-t border-line bg-ink px-5 pb-5 pt-2">
        <div className="mx-auto max-w-[720px]">
          <div className="flex items-end gap-2 rounded-2xl border border-line bg-input p-2 transition-colors duration-instant ease-standard focus-within:border-accent/60">
            <textarea
              ref={composerRef}
              data-chat-composer
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  submit()
                }
              }}
              rows={1}
              placeholder={placeholder}
              aria-label={placeholder}
              className="max-h-[110px] min-h-[24px] flex-1 resize-none bg-transparent py-1 text-body leading-relaxed text-paper placeholder:text-faint focus:outline-none"
            />
            <button
              type="button"
              onClick={() => submit()}
              disabled={!canSend}
              aria-label="Send message"
              title="Send"
              className={cx(
                'coarse-hit flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                'transition-colors duration-instant ease-standard',
                canSend ? 'bg-accent text-white hover:bg-accentHover' : 'bg-surface text-faint',
              )}
            >
              <Send size={14} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
