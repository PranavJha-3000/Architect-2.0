import React from 'react'
import { cx } from './cx'

/**
 * STATUS DOT — the single "something is happening" indicator in the product.
 *
 * Previously five unrelated things (typing, build state, Vibing activity,
 * Reels playback, per-agent progress) each reimplemented a pulse keyframe.
 * They now all use this, so "pulsing" means exactly one thing.
 *
 * `static` renders a filled dot with no animation — used under
 * prefers-reduced-motion, and for states that are active but not moving.
 */
export const StatusDot: React.FC<{
  /** false renders nothing at all, so callers can drop it inline. */
  active?: boolean
  size?: 'sm' | 'md'
  static?: boolean
  className?: string
  label?: string
}> = ({ active = true, size = 'sm', static: still, className, label }) => {
  if (!active) return null
  const dim = size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2'
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cx(
        'shrink-0 rounded-full bg-accent',
        dim,
        !still && 'motion-safe:animate-pulse',
        className,
      )}
    />
  )
}