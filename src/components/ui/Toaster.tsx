import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useStore } from '../../store/store'
import { Button } from './Button'
import { cx } from './cx'

/**
 * TOAST — moved from bottom-centre to top-right.
 *
 * Bottom-centre is the most website-native placement available: it sits in
 * the thumb zone of a marketing page and directly under the content the user
 * was reading. Top-right tucks it beside the controls that caused it.
 *
 * This is presentation only — the store, the toast shape and the undo action
 * are unchanged.
 */
export const Toaster: React.FC = () => {
  const toasts = useStore((s) => s.toasts)
  const dismiss = useStore((s) => s.dismissToast)
  if (!toasts.length) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed right-4 top-4 z-[60] flex flex-col items-end gap-2"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} text={t.text} action={t.action} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  )
}

/** Enter and exit are paired, so a toast leaves as deliberately as it arrives. */
const ToastItem: React.FC<{
  text: string
  action?: { label: string; run: () => void }
  onDismiss: () => void
}> = ({ text, action, onDismiss }) => {
  const [leaving, setLeaving] = useState(false)

  const run = () => {
    action?.run()
    onDismiss()
  }

  const exit = () => {
    setLeaving(true)
    window.setTimeout(onDismiss, 140)
  }

  useEffect(() => {
    if (!action) {
      const t = window.setTimeout(exit, 4000)
      return () => window.clearTimeout(t)
    }
    // Actionable toasts stay until resolved — undo must not race a timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className={cx(
        'pointer-events-auto flex items-center gap-3 rounded-full border border-line bg-surface py-1.5 pl-4 pr-1.5',
        leaving ? 'animate-overlay-out' : 'animate-overlay-in',
      )}
    >
      <span className="text-label text-paper">{text}</span>
      {action && (
        <Button size="sm" variant="secondary" onClick={run} className="h-7">
          {action.label}
        </Button>
      )}
      {!action && (
        <button
          type="button"
          onClick={exit}
          aria-label="Dismiss"
          className="coarse-hit flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors duration-instant ease-standard hover:bg-bubble hover:text-paper"
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}
