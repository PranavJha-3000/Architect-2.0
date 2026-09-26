import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/store'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Surface'
import { cx } from '../components/ui/cx'
import { Modal } from '../components/ui/Modal'
import { LogoPlaceholder } from '../components/onboarding/LogoPlaceholder'
import { Loader2, User as UserIcon } from 'lucide-react'

const GOOGLE_ACCOUNTS = [
  { id: 'g1', name: 'Pranav Jha', email: 'pranav.jha@gmail.com', avatar: 'PJ' },
  { id: 'g2', name: 'Pranav (work)', email: 'pranav@studio.dev', avatar: 'PW' },
]

/** Corrections 3 + 4: minimal centered black-canvas auth, mocked Google OAuth. */
export const Auth: React.FC = () => {
  const navigate = useNavigate()
  const signIn = useStore((s) => s.signIn)
  const startOnboarding = useStore((s) => s.startOnboarding)
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [chooser, setChooser] = useState(false)
  const [pending, setPending] = useState(false)

  const finish = (n: string, e: string, method: 'google' | 'password' | 'guest') => {
    signIn({
      id: `u_${e || 'guest'}`, name: n, email: e, avatar: n.slice(0, 2).toUpperCase(),
      persona: 'non-technical', authMethod: method,
    })
    startOnboarding()
    navigate('/onboarding')
  }

  const submit = () => {
    setPending(true)
    setTimeout(() => finish(name || email.split('@')[0] || 'You', email, 'password'), 800)
  }

  const pickGoogle = (acct: typeof GOOGLE_ACCOUNTS[number]) => {
    setChooser(false)
    setPending(true)
    setTimeout(() => finish(acct.name, acct.email, 'google'), 900)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-6">
      <div className="relative w-full max-w-[360px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoPlaceholder />
          <h1 className="mt-6 text-[20px] font-semibold tracking-tight text-paper">Architect 2.0</h1>
          <p className="mt-1.5 text-[13px] text-muted">
            {mode === 'signup' ? 'Build software by talking to a team of agents.' : 'Welcome back. Pick up where you left off.'}
          </p>
        </div>

        <div className="mb-5 flex rounded-full border border-line bg-surface p-1">
          {(['signup', 'signin'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cx(
                'h-8 flex-1 rounded-full text-[13px] font-medium transition-colors',
                mode === m ? 'bg-accent text-white' : 'text-muted hover:text-paper',
              )}
            >
              {m === 'signup' ? 'Sign up' : 'Sign in'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {mode === 'signup' && <Input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />}
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <Button className="mt-4 w-full" onClick={submit} disabled={pending}>
          {pending ? <Loader2 size={15} className="animate-spin" /> : null}
          {mode === 'signup' ? 'Create account' : 'Sign in'}
        </Button>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[11px] text-muted">or</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <Button variant="secondary" className="w-full" onClick={() => setChooser(true)} disabled={pending}>
          <GoogleMark /> Continue with Google
        </Button>

        <button onClick={() => finish('Guest', '', 'guest')} className="mt-4 w-full text-center text-[12px] text-muted transition-colors hover:text-paper">
          or continue as guest
        </button>
      </div>

      <Modal open={chooser} onClose={() => setChooser(false)} title="Choose an account" description="Simulated Google sign-in for this demo." width="max-w-sm">
        <div className="space-y-2">
          {GOOGLE_ACCOUNTS.map((a) => (
            <button
              key={a.id}
              onClick={() => pickGoogle(a)}
              className="flex w-full items-center gap-3 rounded-card border border-line bg-ink px-3 py-2.5 text-left transition-colors hover:bg-bubble"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-bubble text-[11px] font-semibold text-paper">{a.avatar}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] text-paper">{a.name}</span>
                <span className="block truncate text-[11px] text-muted">{a.email}</span>
              </span>
              <UserIcon size={14} className="shrink-0 text-muted" />
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}


/**
 * Monochrome "G" glyph for the mocked Google sign-in.
 *
 * The product palette is strictly monochrome, so the multi-colour brand mark
 * is rendered as a single-tone glyph in the primary text colour. This keeps
 * the sign-in recognisable without introducing blue/green/yellow/red.
 */
const GoogleMark: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
    <path
      fill="#FFFFFF"
      d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.74 2.98-4.31 2.98-7.36zM12 22c2.7 0 4.97-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.59A10 10 0 0 0 12 22zm-5.61-8.09a6 6 0 0 1 0-3.82V7.5H3.04a10 10 0 0 0 0 9zM12 5.94c1.47 0 2.79.5 3.82 1.5l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.5l3.35 2.59C7.18 7.7 9.39 5.94 12 5.94z"
    />
  </svg>
)
