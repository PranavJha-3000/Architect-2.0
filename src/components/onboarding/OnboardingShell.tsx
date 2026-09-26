import React from 'react'
import { cx } from '../ui/cx'
import { LogoPlaceholder } from './LogoPlaceholder'
import { OnboardingProgress } from './OnboardingProgress'

/**
 * Centered, spacious full-screen frame shared by every onboarding screen.
 * Header (brand + progress) → centered content → footer (navigation).
 */
export const OnboardingShell: React.FC<{
  step: string
  children: React.ReactNode
  footer?: React.ReactNode
  showBrand?: boolean
  showProgress?: boolean
}> = ({ step, children, footer, showBrand = true, showProgress = true }) => (
  <div className="flex min-h-screen flex-col" style={{ background: 'var(--grok-app-bg)' }}>
    <header className="flex items-center justify-between px-6 py-6 sm:px-10">
      {showBrand ? <LogoPlaceholder /> : <span />}
      {showProgress && <OnboardingProgress step={step} />}
    </header>

    <main className={cx('flex flex-1 items-center justify-center px-6 pb-6 sm:px-10')}>
      <div key={step} className="animate-fadeUp flex w-full max-w-[560px] flex-col items-center text-center">
        {children}
      </div>
    </main>

    <footer className="px-6 py-6 sm:px-10">
      <div className="mx-auto w-full max-w-[560px]">{footer}</div>
    </footer>
  </div>
)
