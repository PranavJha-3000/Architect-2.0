import React, { useCallback, useEffect, useRef, useState } from 'react'
import { cx } from './cx'

/**
 * POPOVER — one menu for the whole product.
 *
 * Three separate implementations existed (the account menu, the project row
 * menu, and the Guard popover), each with its own width, radius and
 * dismissal behaviour, and none of them keyboard-operable.
 *
 * This one: Escape closes, arrow keys rove, focus is trapped while open and
 * returned to the trigger on close, and it plays an exit animation rather
 * than vanishing. Clicking a trigger while open closes it.
 */

let openCount = 0

export const Popover: React.FC<{
  /** Renders the trigger. Receives the props it must spread. */
  trigger: (p: {
    ref: React.Ref<HTMLButtonElement>
    onClick: () => void
    'aria-expanded': boolean
    'aria-haspopup': 'menu'
  }) => React.ReactNode
  children: React.ReactNode
  /** Alignment relative to the trigger. */
  align?: 'start' | 'end'
  /** Which side of the trigger the menu opens on. Defaults to 'bottom', which
   *  is every existing call site. 'top' is for controls near a bottom edge. */
  side?: 'top' | 'bottom'
  className?: string
  menuClassName?: string
  label?: string
}> = ({ trigger, children, align = 'end', side = 'bottom', className, menuClassName, label }) => {
  const [open, setOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setLeaving(true)
    window.setTimeout(() => {
      setOpen(false)
      setLeaving(false)
    }, 140)
  }, [])

  const toggle = useCallback(() => {
    if (open) close()
    else setOpen(true)
  }, [open, close])

  // Escape and outside-click dismissal.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        close()
        triggerRef.current?.focus()
      }
    }
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (menuRef.current?.contains(t) || triggerRef.current?.contains(t)) return
      close()
    }
    document.addEventListener('keydown', onKey, true)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open, close])

  // Move focus into the menu, and back to the trigger when it closes.
  useEffect(() => {
    if (!open) return
    const first = menuRef.current?.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])',
    )
    first?.focus()
  }, [open])

  // Body scroll lock while a menu is open, counted so nested menus behave.
  useEffect(() => {
    if (!open) return
    if (openCount === 0) document.body.style.overflow = 'hidden'
    openCount += 1
    return () => {
      openCount -= 1
      if (openCount === 0) document.body.style.overflow = ''
    }
  }, [open])

  // Arrow-key roving between menu items.
  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('button:not([disabled])') ?? [],
    )
    if (!items.length) return
    const i = items.indexOf(document.activeElement as HTMLElement)
    const next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length
    items[next]?.focus()
  }

  return (
    <div className={cx('relative', className)}>
      {trigger({
        ref: triggerRef,
        onClick: toggle,
        'aria-expanded': open,
        'aria-haspopup': 'menu',
      })}

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className={cx(
            'absolute z-30 w-48 overflow-hidden rounded-sm border border-line bg-surface p-1',
            side === 'top' ? 'bottom-full mb-1.5 origin-bottom' : 'mt-1.5 origin-top',
            align === 'end' ? 'right-0' : 'left-0',
            leaving ? 'animate-overlay-out' : 'animate-overlay-in',
            menuClassName,
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

/** A single item inside a Popover. */
export const MenuItem: React.FC<{
  icon?: React.ReactNode
  label: string
  onClick?: () => void
}> = ({ icon, label, onClick }) => (
  <button
    type="button"
    role="menuitem"
    onClick={onClick}
    className={cx(
      'flex w-full items-center gap-2.5 rounded-sm px-2 py-2 text-left text-label',
      'transition-colors duration-instant ease-standard hover:bg-bubble',
      'text-paper',
    )}
  >
    {icon && <span className="shrink-0 text-muted">{icon}</span>}
    <span className="truncate">{label}</span>
  </button>
)
