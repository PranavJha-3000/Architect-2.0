import React, { useState } from 'react'
import { useStore } from '../../store/store'
import { INTEGRATIONS } from '../../store/integrations'
import type { IntegrationDef } from '../../store/types'
import { ASSETS } from '../../assets'
import { OnboardingShell } from './OnboardingShell'
import { OnboardingNav } from './OnboardingNav'
import { IntegrationCard } from './IntegrationCard'
import { IntegrationSetupModal } from './IntegrationSetupModal'
import { ManagerSetupForm } from './ManagerSetupForm'

/**
 * Onboarding: AUTH → WELCOME → VIBE CODING → INTEGRATIONS → MANAGER SETUP → WORKSPACE.
 * The current step lives in the persisted store, so a refresh resumes exactly
 * where the user left off.
 */
export const Onboarding: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const onboarding = useStore((s) => s.onboarding)
  const next = useStore((s) => s.nextOnboardingStep)
  const prev = useStore((s) => s.prevOnboardingStep)
  const connect = useStore((s) => s.connectIntegration)
  const disconnect = useStore((s) => s.disconnectIntegration)
  const [setup, setSetup] = useState<IntegrationDef | null>(null)
  const step = onboarding.step

  /* ---------- Screen 1: Welcome ---------- */
  if (step === 'welcome') {
    return (
      <OnboardingShell step="welcome" footer={<OnboardingNav onNext={next} />}>
        <div
          className="flex w-full max-w-[440px] items-center justify-center overflow-hidden rounded-[12px] border p-4"
          style={{ borderColor: 'var(--grok-line)', background: 'var(--grok-sidebar-bg)' }}
        >
          <img
            src={ASSETS.animations.onboardingWelcome}
            alt="The Architect AI assistant mascot"
            className="gif-mono block h-auto w-[180px]"
          />
        </div>
        <h1 className="mt-9 text-[30px] font-semibold tracking-tight text-white sm:text-[36px]">
          Welcome to Architect 2.0
        </h1>
        <p className="mt-3 max-w-[38ch] text-[15px] leading-relaxed" style={{ color: 'var(--grok-text-muted)' }}>
          Build software by talking to your AI engineering team.
        </p>
      </OnboardingShell>
    )
  }

  /* ---------- Screen 2: Vibe coding ---------- */
  if (step === 'vibe') {
    return (
      <OnboardingShell step="vibe" footer={<OnboardingNav showBack onBack={prev} onNext={next} />}>
        <div
          className="flex w-full max-w-[460px] items-center justify-center overflow-hidden rounded-[12px] border p-4"
          style={{ borderColor: 'var(--grok-line)', background: 'var(--grok-sidebar-bg)' }}
        >
          <img
            src={ASSETS.animations.onboardingTeam}
            alt="The AI agent team working together in a group chat"
            className="gif-mono block h-auto w-full max-w-[340px]"
          />
        </div>
        <h1 className="mt-9 text-[30px] font-semibold tracking-tight text-white sm:text-[36px]">
          Vibe coding, as a team.
        </h1>
        <p className="mt-3 max-w-[40ch] text-[15px] leading-relaxed" style={{ color: 'var(--grok-text-muted)' }}>
          Talk to The Manager. Watch specialists build, review, test and ship together.
        </p>
      </OnboardingShell>
    )
  }

  /* ---------- Screen 3: Integrations ---------- */
  if (step === 'integrations') {
    const integrations = onboarding.integrations

    return (
      <OnboardingShell
        step="integrations"
        footer={<OnboardingNav showBack onBack={prev} onNext={next} onSkip={next} nextLabel="Continue" />}
      >
        <h1 className="text-[26px] font-semibold tracking-tight text-white sm:text-[30px]">
          Connect the tools you already use.
        </h1>
        <p className="mt-2.5 text-[14px]" style={{ color: 'var(--grok-text-muted)' }}>
          Bring your existing workflow into Architect.
        </p>

        <div className="mt-8 flex w-full flex-col gap-2">
          {INTEGRATIONS.map((def) => {
            const conn = integrations[def.id]
            return (
              <IntegrationCard
                key={def.id}
                name={def.name}
                icon={ASSETS.icons[def.id]}
                description={def.description}
                connected={conn.connected}
                account={conn.account}
                detail={conn.detail}
                primary={def.primary}
                recommended={def.recommended}
                onConnect={() => setSetup(def)}
                onDisconnect={() => disconnect(def.id)}
              />
            )
          })}
        </div>

        <IntegrationSetupModal
          def={setup}
          onClose={() => setSetup(null)}
          onConnected={(account, detail) => { if (setup) connect(setup.id, account, detail) }}
        />
      </OnboardingShell>
    )
  }

  /* ---------- Screen 4: Manager setup ---------- */
  return (
    <OnboardingShell step="manager" showBrand={false} showProgress>
      <ManagerSetupForm onDone={onDone} />
    </OnboardingShell>
  )
}
