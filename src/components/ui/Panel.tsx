import React from 'react'
import { cx } from './cx'

/**
 * PANEL — the shared workbench frame.
 *
 * Four tool surfaces each built their own header: two used a 56px bar, two
 * used a 16px centred document title, and all four disagreed on padding. One
 * 44px header, one content region, everywhere.
 */
export const PanelHeader: React.FC<{
  title: React.ReactNode
  meta?: React.ReactNode
  /** Right-aligned actions. Fixed slot so controls never shift between views. */
  actions?: React.ReactNode
  className?: string
}> = ({ title, meta, actions, className }) => (
  <div
    className={cx(
      'flex h-11 shrink-0 items-center gap-3 border-b border-line px-4',
      className,
    )}
  >
    <div className="min-w-0 flex-1">
      <h2 className="truncate text-title font-semibold text-paper">{title}</h2>
      {meta && <p className="truncate text-meta leading-tight text-muted">{meta}</p>}
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </div>
)

export const Panel: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => (
  <section className={cx('flex min-h-0 flex-1 flex-col', className)}>{children}</section>
)

/** Scrollable body of a panel. The one place a hairline is always correct. */
export const PanelBody: React.FC<{
  children: React.ReactNode
  className?: string
  /** Constrain the measure so long documents stay readable. */
  measure?: boolean
}> = ({ children, className, measure }) => (
  <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
    <div className={cx(measure && 'mx-auto w-full max-w-[720px] px-4 py-5', className)}>
      {children}
    </div>
  </div>
)
