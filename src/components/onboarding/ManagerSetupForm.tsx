import React, { useState } from 'react'
import { useStore } from '../../store/store'
import { ManagerAvatarUploader } from './ManagerAvatarUploader'
import { AvatarTemplatePicker } from '../ui/Identity'
import { OnboardingNav } from './OnboardingNav'
import { cx } from '../ui/cx'

/**
 * Screen 4. The canonical name is always "The Manager"; the nickname is an
 * optional display layer on top of it. The PFP is either an uploaded photo
 * or one of the gradient templates — never a bare grey initial.
 */
export const ManagerSetupForm: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const onboarding = useStore((s) => s.onboarding)
  const setManagerAvatar = useStore((s) => s.setManagerAvatar)
  const setManagerNickname = useStore((s) => s.setManagerNickname)
  const setManagerTemplate = useStore((s) => s.setManagerTemplate)
  const completeOnboarding = useStore((s) => s.completeOnboarding)
  const prevOnboardingStep = useStore((s) => s.prevOnboardingStep)
  const [nickname, setNickname] = useState(onboarding.managerNickname)

  const finish = () => {
    setManagerNickname(nickname.trim())
    completeOnboarding()
    onDone()
  }

  return (
    <div className="flex w-full flex-col items-center">
      <h1 className="text-[28px] font-semibold tracking-tight text-white sm:text-[32px]">Meet The Manager</h1>
      <p className="mt-2.5 max-w-[40ch] text-[14px] leading-relaxed" style={{ color: 'var(--grok-text-muted)' }}>
        The Manager coordinates your AI engineering team.
      </p>

      <div className="mt-8">
        <ManagerAvatarUploader value={onboarding.managerAvatar} onChange={setManagerAvatar} />
      </div>

      <AvatarTemplatePicker
        className="mt-5"
        value={onboarding.managerTemplate ?? ''}
        onChange={setManagerTemplate}
      />

      {/* Canonical identity, with the optional nickname layered underneath. */}
      <div className="mt-6 text-center">
        <p className="text-[16px] font-semibold text-white">The Manager</p>
        {nickname.trim() && (
          <p className="mt-0.5 text-[13px]" style={{ color: 'var(--grok-text-muted)' }}>
            {nickname.trim()}
          </p>
        )}
      </div>

      <div className="mt-6 w-full max-w-[300px] text-left">
        <label
          htmlFor="manager-nickname"
          className="mb-2 block text-[11px] font-medium uppercase tracking-wider"
          style={{ color: 'var(--grok-text-muted)' }}
        >
          Nickname <span className="normal-case tracking-normal opacity-70">(optional)</span>
        </label>
        <input
          id="manager-nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="e.g. Atlas"
          maxLength={24}
          className={cx(
            'h-11 w-full rounded-full px-4 text-[14px] text-white transition-colors',
            'placeholder:text-[var(--grok-text-muted)] focus:outline-none',
          )}
          style={{ background: 'var(--grok-search-input)', border: '1px solid var(--grok-line)' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.32)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--grok-line)' }}
        />
      </div>

      <div className="mt-9 w-full max-w-[300px]">
        <OnboardingNav
          showBack
          onBack={prevOnboardingStep}
          onNext={finish}
          nextLabel="Get started"
        />
      </div>
    </div>
  )
}
