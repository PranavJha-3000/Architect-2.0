import { agentById } from '../../store/roster'
import type { Message } from '../../store/types'

/**
 * CHAT GROUPING
 *
 * The Manager thread is the hero surface, and it was reading as a stack of
 * disconnected cards: every message repeated an avatar, a name and a
 * timestamp, so a twelve-message conversation rendered thirty-six pieces of
 * identity for twelve pieces of content. Alongside that, agent-to-agent
 * chatter rendered as dimmed message bubbles with an "overheard" label and a
 * CornerDownRight glyph — which made background activity look like something
 * the user was being told.
 *
 * This module turns a flat message array into the rows the conversation
 * actually contains: author turns, and quiet activity lines for chatter.
 *
 * It is pure and takes no store access, so the grouping rules live in one
 * place and can be reasoned about independently of rendering.
 */

/**
 * How long a pause breaks a turn. Five minutes is the convention every
 * messaging product uses: long enough that a burst of messages reads as one
 * utterance, short enough that a reply an hour later opens a fresh block.
 */
export const GROUP_WINDOW_MS = 5 * 60 * 1000

export const isUserMessage = (m: Message) => m.authorId === 'user'

/**
 * Agent-to-agent chatter. It is in the thread, but it is not addressed to
 * you — it is background activity, not conversation with you.
 */
export const isActivity = (m: Message) => !isUserMessage(m) && !m.addressedToUser

/** Display name. The Manager is spoken about as "The Manager" in the UI. */
export const displayName = (authorId: string) =>
  authorId === 'manager' ? 'The Manager' : agentById(authorId).name

export type ChatRow =
  | { kind: 'message'; message: Message; startsGroup: boolean }
  | { kind: 'activity'; agents: string[]; count: number }

/** Distinct authors, in the order they first spoke, for an activity run. */
const runAgents = (run: Message[], all: Message[]): string[] => {
  const seen: string[] = []
  const push = (n: string) => {
    if (!seen.includes(n)) seen.push(n)
  }
  for (const m of run) push(displayName(m.authorId))

  /*
   * The Manager directing a specialist is the common case, and on its own the
   * line would read only "The Manager" — which hides the fact that a
   * specialist is on the other side. So when the run does not already mention
   * someone, the specialist the run is bracketed by is added: both of those
   * facts come from the data, and neither is a recipient being invented.
   */
  if (run.every((m) => m.authorId === 'manager')) {
    const at = all.indexOf(run[0])
    for (let k = at - 1; k >= 0; k--) {
      if (!isActivity(all[k])) {
        push(displayName(all[k].authorId))
        break
      }
    }
    for (let k = at + run.length; k < all.length; k++) {
      if (!isActivity(all[k])) {
        push(displayName(all[k].authorId))
        break
      }
    }
  }

  return seen
}

/**
 * Collapse a message list into author turns plus activity lines.
 *
 * A turn starts when the author changes, when the gap exceeds the window,
 * when a card appears, or after any activity line. Your own messages are
 * never grouped — each is its own utterance, right-aligned.
 *
 * Consecutive activity messages collapse into ONE line naming the agents
 * involved. The recipient is deliberately NOT derived: `Message` records no
 * recipient, so a run by one agent reads `Frontend`, and a run by several
 * reads `Frontend · Backend`. That states who was involved without asserting
 * who was talking to whom, which the data cannot support.
 */
export const buildChatRows = (messages: Message[]): ChatRow[] => {
  const rows: ChatRow[] = []
  let i = 0

  while (i < messages.length) {
    const m = messages[i]

    if (isActivity(m)) {
      const run: Message[] = []
      while (i < messages.length && isActivity(messages[i])) {
        run.push(messages[i])
        i += 1
      }
      rows.push({ kind: 'activity', agents: runAgents(run, messages), count: run.length })
      continue
    }

    const prev = messages[i - 1]
    const startsGroup =
      isUserMessage(m) ||
      prev == null ||
      isUserMessage(prev) ||
      isActivity(prev) ||
      prev.authorId !== m.authorId ||
      m.ts - prev.ts > GROUP_WINDOW_MS

    rows.push({ kind: 'message', message: m, startsGroup })

    // Absorb the rest of this turn so the run shares one avatar and name.
    i += 1
    while (i < messages.length) {
      const n = messages[i]
      if (
        !isUserMessage(n) &&
        !isActivity(n) &&
        n.authorId === m.authorId &&
        n.ts - messages[i - 1].ts <= GROUP_WINDOW_MS
      ) {
        rows.push({ kind: 'message', message: n, startsGroup: false })
        i += 1
      } else break
    }
  }

  return rows
}

/**
 * True when this row ends its turn — the next row opens a new one, or is an
 * activity line. Used to add the larger gap that separates author groups.
 */
export const isLastInTurn = (rows: ChatRow[], index: number) => {
  const next = rows[index + 1]
  return !next || next.kind === 'activity' || next.startsGroup
}