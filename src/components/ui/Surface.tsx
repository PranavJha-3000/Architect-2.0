import React from 'react'
import { cx } from './cx'

/**
 * SURFACES — inputs and the two remaining display primitives.
 *
 * `Card`, `Badge` and `StatusPill` were removed: they had no call sites, and
 * `Card`/`Badge` existed only to add a border, which is the thing this
 * redesign is removing. A raised object is now expressed by its plane value.
 */

/** Text input. 40px, one focus recipe, no direct style mutation. */
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className,
  ...rest
}) => (
  <input
    {...rest}
    className={cx(
      'h-10 w-full rounded-sm border border-line bg-input px-3 text-body text-paper',
      'placeholder:text-faint transition-colors duration-instant ease-standard',
      'hover:border-line focus:border-accent/60',
      className,
    )}
  />
)

/** Multi-line input. */
export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  className,
  ...rest
}) => (
  <textarea
    {...rest}
    className={cx(
      'w-full resize-none rounded-sm border border-line bg-input px-3 py-2.5 text-body text-paper',
      'placeholder:text-faint transition-colors duration-instant ease-standard',
      'hover:border-line focus:border-accent/60',
      className,
    )}
  />
)

/**
 * SECTION LABEL — the only place a `micro` uppercase label may appear.
 * Previously `SectionLabel` rendered at 60% opacity, which measured roughly
 * #464649 on the drawer background and was effectively invisible.
 */
export const SectionLabel: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => (
  <p
    className={cx(
      'px-2.5 pb-1 pt-2 text-micro font-semibold uppercase tracking-[0.06em] text-muted',
      className,
    )}
  >
    {children}
  </p>
)

