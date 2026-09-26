import React from 'react'
import { cx } from '../ui/cx'
import { ArrowLeft, ArrowRight } from 'lucide-react'

/** Neutral pill controls, on the shared workspace palette. Focus is a soft white ring. */
const base =
  'inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-[14px] font-medium transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-35 disabled:pointer-events-none'

const variants = {
  primary: 'bg-accent text-white hover:bg-accentHover',
  secondary: 'text-paper hover:bg-white/8',
  tertiary: 'text-muted hover:text-paper',
} as const

export const OnboardingNav: React.FC<{
  onNext?: () => void
  onBack?: () => void
  nextLabel?: string
  showBack?: boolean
  onSkip?: () => void
  skipLabel?: string
  children?: React.ReactNode
}> = ({ onNext, onBack, nextLabel = 'Next', showBack, onSkip, skipLabel = 'Skip for now', children }) => (
  <div className="flex w-full items-center gap-3">
    {showBack && onBack && (
      <button type="button" onClick={onBack} className={cx(base, variants.secondary)}>
        <ArrowLeft size={15} /> Back
      </button>
    )}
    {onSkip && (
      <button type="button" onClick={onSkip} className={cx(base, variants.tertiary)}>
        {skipLabel}
      </button>
    )}
    {children}
    {onNext && (
      <button type="button" onClick={onNext} className={cx(base, variants.primary, 'ml-auto')}>
        {nextLabel} <ArrowRight size={15} />
      </button>
    )}
  </div>
)
