import React, { useEffect, useState } from 'react'
import { X, ChevronRight, Loader2 } from 'lucide-react'
import { cx } from '../ui/cx'
import type { IntegrationDef } from '../../store/types'

/**
 * Mock setup flow. Walks the integration's phases (e.g. GitHub account → repo)
 * and reports the chosen account + detail back to the caller.
 */
export const IntegrationSetupModal: React.FC<{
  def: IntegrationDef | null
  onClose: () => void
  onConnected: (account: string, detail: string) => void
}> = ({ def, onClose, onConnected }) => {
  const [phase, setPhase] = useState(0)
  const [chosen, setChosen] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (def) { setPhase(0); setChosen([]); setBusy(false) }
  }, [def])

  if (!def) return null
  const current = def.phases[phase]
  const isLast = phase === def.phases.length - 1

  const pick = (optionId: string) => {
    setBusy(true)
    // Simulated network round-trip.
    setTimeout(() => {
      const next = [...chosen, optionId]
      setBusy(false)
      if (isLast) {
        const account = def.phases[0].options.find((o) => o.id === next[0])?.title ?? def.name
        const detail = current.options.find((o) => o.id === optionId)?.title ?? ''
        onConnected(account, detail)
        onClose()
      } else {
        setChosen(next)
        setPhase((p) => p + 1)
      }
    }, 520)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.72)' }} onClick={busy ? undefined : onClose} />
      <div
        className="relative w-full max-w-sm animate-fadeUp rounded-[14px] p-6"
        style={{ background: 'var(--grok-sidebar-bg)', border: '1px solid var(--grok-line)' }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-semibold text-white">{current.title}</h2>
            <p className="mt-1 text-[12px] leading-relaxed" style={{ color: 'var(--grok-text-muted)' }}>
              {current.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 transition-colors hover:bg-white/8"
            style={{ color: 'var(--grok-text-muted)' }}
          >
            <X size={15} />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-1.5">
          {def.phases.map((p, i) => (
            <span
              key={p.key}
              className="h-[3px] flex-1 rounded-full transition-colors duration-300"
              style={{ background: i <= phase ? 'var(--grok-text-main)' : 'var(--grok-action-btn)' }}
            />
          ))}
        </div>

        <div className="space-y-2">
          {current.options.map((o) => (
            <button
              key={o.id}
              type="button"
              disabled={busy}
              onClick={() => pick(o.id)}
              className={cx(
                'flex w-full items-center gap-3 rounded-[10px] px-3.5 py-3 text-left transition-colors',
                busy ? 'pointer-events-none opacity-50' : 'hover:bg-white/[0.06]',
              )}
              style={{ background: 'var(--grok-user-bubble)' }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white" style={{ background: 'var(--grok-action-btn)' }}>
                {o.title.slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] text-white">{o.title}</span>
                <span className="block truncate text-[11px]" style={{ color: 'var(--grok-text-muted)' }}>{o.sub}</span>
              </span>
              {busy ? <Loader2 size={14} className="animate-spin" style={{ color: 'var(--grok-text-muted)' }} /> : <ChevronRight size={14} style={{ color: 'var(--grok-text-muted)' }} />}
            </button>
          ))}
        </div>

        <p className="mt-4 text-[11px]" style={{ color: 'var(--grok-text-muted)', opacity: 0.7 }}>
          Simulated connection for this demo. No real account is accessed.
        </p>
      </div>
    </div>
  )
}
