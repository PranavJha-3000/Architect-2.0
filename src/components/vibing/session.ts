/**
 * VIBING SESSION
 *
 * Transient, module-local state for the Vibing capability. Deliberately NOT in
 * the zustand store: the store is persisted to localStorage, and this holds
 * `Window` handles and live interaction phase, neither of which should ever be
 * serialised. The existing `externalTabs.ts` module is the same precedent.
 *
 * Survives Preview unmounts (Canvas hides the right panel) and route changes
 * within the session, so returning to Architect always resumes mid-flow.
 */
import { useEffect, useState } from 'react'
import type { VibingSource, ClassifiedLink } from './links'
import { classifyLink, FEED_URLS } from './links'
import { openExternal, closeExternal, onExternalChange, onReturnToArchitect } from './externalTabs'

/** `awaiting-link` is the only phase that needs the paste field. */
export type VibingPhase = 'idle' | 'choosing' | 'awaiting-link' | 'music'

export interface Handoff {
  key: string
  link: ClassifiedLink
  openedAt: number
}

export interface BrainrotWindow {
  source: Exclude<VibingSource, 'music'>
  openedAt: number
}

interface Session {
  phase: VibingPhase
  /** The source the user picked before being asked for a link. */
  pending: VibingSource | null
  handoff: Handoff | null
  /** CHAD-style feed window (Reels / TikTok / Shorts) open while work runs. */
  brainrot: BrainrotWindow | null
  /** Links we recognised but cannot play locally — shown as queued. */
  queued: ClassifiedLink[]
}

const initial: Session = { phase: 'idle', pending: null, handoff: null, brainrot: null, queued: [] }

let state: Session = initial
const listeners = new Set<() => void>()

function set(patch: Partial<Session>): void {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

const HANDOFF_KEY = 'vibing:handoff'
const BRAINROT_KEY = 'vibing:brainrot'
const BRAINROT_FEATURES = 'width=420,height=800,menubar=no,toolbar=no,location=yes,status=no'

/** The user pressed Vibing. Music is a local mode and needs no link. */
export function beginChoosing(): void {
  set({ phase: 'choosing', pending: null })
}

/** The user picked a source in the chooser. */
export function chooseSource(source: VibingSource): void {
  if (source === 'music') {
    set({ phase: 'music', pending: null })
    return
  }
  set({ phase: 'awaiting-link', pending: source })
}

export function cancel(): void {
  set({ phase: 'idle', pending: null })
}

/** A link that classifies but cannot be played: recognised, never faked. */
export function queueLink(link: ClassifiedLink): void {
  if (state.queued.some((q) => q.url === link.url)) return
  set({ queued: [...state.queued, link] })
}

export function clearQueue(): void {
  set({ queued: [] })
}

/** Outcome of a handoff attempt, so the caller never claims more happened. */
export type HandoffResult = 'opened' | 'queued' | 'blocked' | 'unrecognised'

/** Outcome of opening the CHAD-style feed window while work runs. */
export type BrainrotResult = 'opened' | 'blocked' | 'already-open'

/**
 * Open the brainrot feed window for `source` (CHAD-style: small standalone
 * window with the Reels / TikTok / Shorts feed). Stays open while work runs
 * and is closed by `closeBrainrot` when the build finishes. Popup blockers
 * return `blocked` so the caller can say so instead of claiming an opening.
 */
export function openBrainrot(source: Exclude<VibingSource, 'music'>): BrainrotResult {
  if (state.brainrot && state.brainrot.source === source) return 'already-open'
  if (state.brainrot) closeExternal(BRAINROT_KEY)
  const opened = openExternal(BRAINROT_KEY, FEED_URLS[source], BRAINROT_KEY, BRAINROT_FEATURES, true)
  if (!opened) return 'blocked'
  set({ brainrot: { source, openedAt: Date.now() } })
  return 'opened'
}

/**
 * Close the brainrot feed window. Safe no-op when nothing is open or the
 * user already closed it. Returns whether session state claimed a window.
 */
export function closeBrainrot(): boolean {
  const had = state.brainrot !== null
  closeExternal(BRAINROT_KEY)
  if (had) set({ brainrot: null })
  return had
}

/** Clear brainrot session state when the user closes the window themselves. */
function syncBrainrotWithWindows(keys: string[]): void {
  if (state.brainrot && !keys.includes(BRAINROT_KEY)) {
    set({ brainrot: null })
  }
}

if (typeof window !== 'undefined') {
  onExternalChange(syncBrainrotWithWindows)
}

/**
 * Hand off a classified link to a new tab.
 *
 * Distinguishes "the tab opened" from "the browser blocked it" and from "I do
 * not recognise this link", because the first is the only one we may report as
 * an opening. A blocked popup returns no window, and reporting success there
 * would be a claim we cannot support.
 */
export function handoff(input: string): HandoffResult {
  const link = classifyLink(input)
  if (!link) return 'unrecognised'
  if (link.source === 'music') {
    queueLink(link)
    set({ phase: 'music', pending: null })
    return 'queued'
  }
  const opened = openExternal(HANDOFF_KEY, link.url)
  if (!opened) {
    // Leave the phase alone so the user can retry without retyping.
    return 'blocked'
  }
  set({ phase: 'idle', pending: null, handoff: { key: HANDOFF_KEY, link, openedAt: Date.now() } })
  return 'opened'
}

export function closeHandoff(): void {
  closeExternal(HANDOFF_KEY)
  set({ handoff: null })
}

const SOURCE_LABEL: Record<VibingSource, string> = {
  reels: 'Reels',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  music: 'Music',
}

export const sourceLabel = (s: VibingSource): string => SOURCE_LABEL[s]

/* ---------------------------------------------------------------- hooks --- */

/** Reactive session state. */
export function useVibingSession(): Session {
  const [snap, setSnap] = useState(state)
  useEffect(() => subscribe(() => setSnap(state)), [])
  return snap
}

/**
 * Increments each time Architect regains visibility or focus, so a consumer can
 * note the return in chat once. Never used to infer that anything was watched.
 */
export function useReturnSignal(): number {
  const [n, setN] = useState(0)
  useEffect(() => onReturnToArchitect(() => setN((v) => v + 1)), [])
  return n
}
