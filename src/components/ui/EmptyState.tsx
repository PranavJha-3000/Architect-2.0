import React from 'react'
import { Button } from './Button'

/**
 * EMPTY STATE — one scale, everywhere.
 *
 * Previously: a 44px bordered circle, a semibold title, a two-line body and up
 * to two buttons — rendered in eight places, including inside a 340px preview
 * well and inside a bordered card inside a page (three levels of containment).
 *
 * Now: a 48px glyph, a title, ONE line of body and at most one primary action.
 * It is never nested inside a bordered card.
 */
export const EmptyState: React.FC<{
  icon?: React.ReactNode
  title: string
  body: string
  actionLabel?: string
  onAction?: () => void
  secondaryLabel?: string
  onSecondary?: () => void
}> = ({ icon, title, body, actionLabel, onAction, secondaryLabel, onSecondary }) => (
  <div className="flex flex-col items-center justify-center px-6 py-8 text-center">
    {icon && (
      <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted">
        {icon}
      </div>
    )}
    <h3 className="text-title font-semibold text-paper">{title}</h3>
    <p className="mt-1.5 max-w-[34ch] text-body leading-relaxed text-muted">{body}</p>
    {(actionLabel || secondaryLabel) && (
      <div className="mt-5 flex items-center gap-2">
        {actionLabel && onAction && (
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
        {secondaryLabel && onSecondary && (
          <Button size="sm" variant="ghost" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        )}
      </div>
    )}
  </div>
)
