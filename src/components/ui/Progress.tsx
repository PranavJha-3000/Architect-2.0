import React from 'react'
import { cx } from './cx'

/**
 * PROGRESS — one bar for the whole product.
 *
 * Three implementations existed (BuildCard, AgentProgress, and an inline bar
 * in the deploy log), each nesting a different pair of greys inside the
 * page background. This one is flat: control-colour track, accent fill,
 * scaled on the X axis only.
 *
 * scaleX rather than width means the bar animates on the compositor — a
 * width change forces layout on every frame, which is why the old bars felt
 * heavy when five agents updated at once.
 */
export const Progress: React.FC<{
  /** 0–100. */
  value: number
  className?: string
  /** Height in px. 2 is the default hairline; 3 for prominent bars. */
  thickness?: number
  label?: string
}> = ({ value, className, thickness = 2, label }) => {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cx('w-full overflow-hidden rounded-full bg-action', className)}
      style={{ height: thickness }}
    >
      <div
        className="h-full origin-left rounded-full bg-accent transition-transform duration-shift ease-travel"
        style={{ transform: `scaleX(${clamped / 100})` }}
      />
    </div>
  )
}
