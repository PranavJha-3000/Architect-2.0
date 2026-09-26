import React from 'react'
import { cx } from '../ui/cx'
import { ONBOARDING_STEPS } from '../../store/types'

/** Four quiet segments. Filled up to the current step — no numbers, no chrome. */
export const OnboardingProgress: React.FC<{ step: string; className?: string }> = ({ step, className }) => {
  const current = Math.max(0, ONBOARDING_STEPS.indexOf(step as never))
  return (
    <div className={cx('flex items-center gap-1.5', className)} role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={current + 1}>
      {ONBOARDING_STEPS.map((s, i) => (
        <span
          key={s}
          className="h-[3px] w-7 rounded-full transition-colors duration-300"
          style={{ background: i <= current ? 'var(--grok-text-main)' : 'var(--grok-action-btn)' }}
        />
      ))}
    </div>
  )
}
