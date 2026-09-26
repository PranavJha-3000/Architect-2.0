import React from 'react'
import { cx } from './cx'

/**
 * ROW — the single list-row primitive.
 *
 * The codebase previously had six near-identical row implementations (project
 * rows, conversation rows, file rows, commit rows, deployment rows, archived
 * rows) that disagreed on height, padding and radius. Sibling rows of
 * different heights inside one scroll container is one of the most visible
 * signals of a product that was assembled rather than designed.
 *
 * One implementation, two heights:
 *   two-line  56px — title + preview   (conversations, projects, commits)
 *   one-line  44px — title only        (files, deployments, archives)
 *
 * Hover-revealed actions are focusable AND become visible on focus, so they
 * are reachable by keyboard without being invisible while focused.
 */

export const Row: React.FC<{
  /** Primary line. */
  title: React.ReactNode
  /** Secondary line — omitted renders the one-line variant. */
  preview?: React.ReactNode
  /** Leading glyph: an avatar, an icon, or null. */
  leading?: React.ReactNode
  /** Trailing slot: timestamp, badge, unread dot. */
  trailing?: React.ReactNode
  /** Right-aligned actions, revealed on hover and on keyboard focus. */
  actions?: React.ReactNode
  active?: boolean
  onClick?: () => void
  className?: string
  titleClassName?: string
  /** Accessible label when the visible title is not descriptive enough. */
  ariaLabel?: string
}> = ({
  title,
  preview,
  leading,
  trailing,
  actions,
  active,
  onClick,
  className,
  titleClassName,
  ariaLabel,
}) => {
  const interactive = !!onClick
  const Tag = interactive ? 'button' : 'div'

  return (
    <div className={cx('group relative flex items-center', className)}>
      <Tag
        {...(interactive ? { type: 'button' as const, onClick } : {})}
        aria-current={active ? 'true' : undefined}
        aria-label={ariaLabel}
        className={cx(
          'flex min-w-0 flex-1 items-center gap-2.5 rounded-sm text-left',
          preview ? 'h-14 px-2' : 'h-11 px-2',
          // Reserve the action slot so revealing it never covers the timestamp.
          actions ? 'pr-8' : null,
          'transition-colors duration-instant ease-standard',
          interactive && 'hover:bg-surface/60',
          active && 'bg-surface',
        )}
      >
        {leading}

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-1.5">
            <span
              className={cx(
                'truncate text-label',
                active ? 'font-medium text-paper' : 'text-paper',
                titleClassName,
              )}
            >
              {title}
            </span>
          </span>

          {preview && (
            <span className="mt-0.5 block truncate text-meta text-muted">{preview}</span>
          )}
        </span>

        {trailing && <span className="ml-auto flex shrink-0 items-center gap-1.5">{trailing}</span>}
      </Tag>

      {/*
        Actions sit outside the button so they are independently focusable and
        do not trigger row navigation. `focus-within` keeps them visible when a
        child receives keyboard focus.
      */}
      {actions && (
        <span
          className={cx(
            'absolute right-1.5 flex shrink-0 items-center gap-0.5',
            'opacity-0 transition-opacity duration-instant ease-standard',
            'group-hover:opacity-100 group-focus-within:opacity-100',
          )}
        >
          {actions}
        </span>
      )}
    </div>
  )
}

/** The unread marker. A 2px dot — a numeric badge is noise at list density. */
export const UnreadDot: React.FC<{ className?: string }> = ({ className }) => (
  <span aria-label="Unread" role="img" className={cx('h-2 w-2 shrink-0 rounded-full bg-accent', className)} />
)
