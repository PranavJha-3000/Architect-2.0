import React, { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { cx } from './cx'

/**
 * DIALOG — one modal for the whole product.
 *
 * Four separate implementations existed (Modal, ConfirmDialog, the
 * integration setup flow, and the Google account chooser). None of them had
 * `role="dialog"`, a focus trap, Escape handling, a scroll lock, or focus
 * restoration — so a keyboard user could tab straight out of an open dialog
 * into the page behind it and never return to their trigger.
 *
 * This one has all of it, and plays an exit animation.
 */

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export const Dialog: React.FC<{
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  width?: string
}> = ({ open, onClose, title, description, children, footer, width = 'max-w-md' }) => {
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)
  const [leaving, setLeaving] = useState(false)

  // Close with an exit animation, then unmount.
  const requestClose = () => {
    setLeaving(true)
    window.setTimeout(() => {
      setLeaving(false)
      onClose()
    }, 140)
  }

  // Remember the trigger, lock scroll, trap focus, restore on close.
  useEffect(() => {
    if (!open) return
    restoreRef.current = document.activeElement as HTMLElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        requestClose()
        return
      }
      if (e.key !== 'Tab') return
      const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
      if (!items.length) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = prevOverflow
      restoreRef.current?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/80"
        onClick={requestClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={cx(
          'relative flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-y-auto rounded-md border border-line bg-surface p-5 scrollbar-thin',
          leaving ? 'animate-overlay-out' : 'animate-overlay-in',
          width,
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="dialog-title" className="text-title font-semibold text-paper">
              {title}
            </h2>
            {description && <p className="mt-1 text-body text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="coarse-hit flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-instant ease-standard hover:bg-bubble hover:text-paper"
          >
            <X size={16} />
          </button>
        </div>

        {children}

        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

/** Confirmation built on Dialog, so it inherits the full a11y behaviour. */
export const ConfirmDialog: React.FC<{
  open: boolean
  onClose: () => void
  title: string
  body: string
  confirmLabel?: string
  onConfirm: () => void
}> = ({ open, onClose, title, body, confirmLabel = 'Confirm', onConfirm }) => (
  <Dialog
    open={open}
    onClose={onClose}
    title={title}
    width="max-w-sm"
    footer={
      <>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-3 py-2 text-label font-medium text-muted transition-colors duration-instant ease-standard hover:text-paper"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm()
            onClose()
          }}
          className="rounded-full bg-accent px-3.5 py-2 text-label font-medium text-white transition-colors duration-instant ease-standard hover:bg-accentHover"
        >
          {confirmLabel}
        </button>
      </>
    }
  >
    <p className="text-body text-muted">{body}</p>
  </Dialog>
)
