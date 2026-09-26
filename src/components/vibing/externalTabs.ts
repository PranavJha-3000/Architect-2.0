/**
 * Tracked external handoffs for the Vibing panel (Instagram / YouTube).
 *
 * - Open: new browser tab via `window.open(url, '_blank')` with
 *   `win.opener = null` — the noopener-equivalent safe behavior (a
 *   `'noopener'` features string would return `null`, leaving no handle to
 *   track, so Close could never work).
 * - Close: only ever closes a window this app opened for that exact key.
 *   Never closes arbitrary user tabs. Browser refusal (cross-origin) fails
 *   silently so Architect is never affected. Never touches `window.location`,
 *   so the app never navigates away from the current project.
 */
const handles = new Map<string, Window | null>()

/** Notified whenever a tracked window is opened or observed closed. */
type Listener = (keys: string[]) => void
const listeners = new Set<Listener>()

/** Shared poll. One interval for the whole app, not one per component. */
let pollId: number | null = null

function emit(): void {
  const keys = [...handles.keys()]
  listeners.forEach((l) => l(keys))
}

/** Read `closed` on every handle and drop the ones the user has closed. */
function poll(): void {
  let changed = false
  for (const [key, w] of [...handles]) {
    if (w && w.closed) {
      handles.delete(key)
      changed = true
    }
  }
  if (changed) emit()
}

function ensurePolling(): void {
  if (pollId !== null || typeof window === 'undefined') return
  pollId = window.setInterval(poll, 1000)
}

/** Subscribe to open/close changes. Returns an unsubscribe function. */
export function onExternalChange(fn: Listener): () => void {
  listeners.add(fn)
  ensurePolling()
  fn([...handles.keys()])
  return () => {
    listeners.delete(fn)
    if (listeners.size === 0 && pollId !== null) {
      clearInterval(pollId)
      pollId = null
    }
  }
}

/**
 * Open `url` in a new tab (default) or a named popup window.
 *
 * Returns whether a window was actually obtained. A popup blocker makes
 * `window.open` return null; callers must not then claim a window was opened.
 *
 * Brainrot windows use a named target + features (`width=420,height=800`)
 * so they open as a small standalone window (CHAD-style) instead of a full
 * tab, and the returned handle stays closable via `closeExternal`.
 */
export function openExternal(key: string, url: string, target = '_blank', features?: string, keepOpener = false): boolean {
  closeExternal(key) // never accumulate duplicate windows per key
  const w = window.open(url, target, features)
  if (w) {
    if (!keepOpener) {
      try {
        w.opener = null
      } catch {
        // Ignore: window still opened, handle simply won't allow Close.
      }
    }
    try {
      w.focus()
    } catch {
      // Ignore: focus is best-effort.
    }
  }
  handles.set(key, w ?? null)
  ensurePolling()
  emit()
  return w !== null
}

/** Attempt to close the window this app opened for `key`. Graceful no-op otherwise. */
export function closeExternal(key: string): void {
  const w = handles.get(key)
  handles.delete(key)
  if (w) {
    try {
      if (!w.closed) w.close()
    } catch {
      // Browser refused programmatic closing — fail silently.
    }
  }
  emit()
}

/** Keys currently tracked (used to restore Done state on component remount). */
export function openedKeys(prefix?: string): string[] {
  return [...handles.keys()].filter((k) => (prefix ? k.startsWith(prefix) : true))
}

/**
 * Return-to-Architect detection.
 *
 * The only two signals observable across a cross-origin tab handoff are
 * `window.closed` and Architect regaining focus/visibility. We never infer
 * whether the user finished watching — that cannot be known cross-origin and
 * must not be claimed.
 */
type ReturnListener = () => void
const returnListeners = new Set<ReturnListener>()
let returnBound = false

function bindReturnListeners(): void {
  if (returnBound || typeof document === 'undefined') return
  returnBound = true
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) returnListeners.forEach((l) => l())
  })
  window.addEventListener('focus', () => returnListeners.forEach((l) => l()))
}

/** Fires when Architect becomes visible or focused again. */
export function onReturnToArchitect(fn: ReturnListener): () => void {
  returnListeners.add(fn)
  bindReturnListeners()
  return () => {
    returnListeners.delete(fn)
  }
}
