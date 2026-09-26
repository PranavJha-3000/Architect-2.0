import React from 'react'
import { Check, ChevronRight } from 'lucide-react'
import { cx } from '../ui/cx'

/** Connected ✓ state. Neutral only — a white check, never a colour fill. */
export const ConnectionStatus: React.FC<{ connected: boolean; connectedLabel?: string; onDisconnect?: () => void; detail?: string }> = ({
  connected,
  connectedLabel,
  onDisconnect,
  detail,
}) => {
  if (!connected) return null
  return (
    <div className="flex min-w-0 flex-col items-end gap-0.5 text-right">
      <button
        type="button"
        onClick={onDisconnect}
        title="Disconnect"
        className="inline-flex items-center gap-1.5 rounded-full px-1.5 py-0.5 text-[12px] font-medium text-white transition-colors hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full" style={{ background: 'var(--grok-action-btn)' }}>
          <Check size={9} className="text-white" strokeWidth={3} />
        </span>
        {connectedLabel ?? 'Connected'}
      </button>
      {detail && (
        <span className="max-w-[160px] truncate text-[11px]" style={{ color: 'var(--grok-text-muted)' }}>
          {detail}
        </span>
      )}
    </div>
  )
}

/** Compact integration card — small, premium, monochrome. */
export const IntegrationCard: React.FC<{
  name: string
  icon?: string
  description: string
  connected: boolean
  account?: string
  detail?: string
  primary?: boolean
  recommended?: boolean
  onConnect: () => void
  onDisconnect: () => void
}> = ({ name, icon, description, connected, account, detail, primary, recommended, onConnect, onDisconnect }) => (
  <div
    className={cx(
      'flex w-full items-center gap-4 rounded-[10px] px-4 py-3.5 text-left transition-colors',
      connected ? 'bg-white/[0.04]' : 'bg-white/[0.02] hover:bg-white/[0.05]',
    )}
    style={{ border: `1px solid ${connected ? 'var(--grok-line)' : 'transparent'}` }}
  >
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px]"
      style={{ background: 'var(--grok-action-btn)' }}
    >
      {icon ? (
        <img src={icon} alt="" aria-hidden className="brand-icon h-[18px] w-[18px]" />
      ) : (
        <span className="text-[12px] font-semibold" style={{ color: 'var(--grok-text-main)' }}>
          {name.slice(0, 1)}
        </span>
      )}
    </span>

    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <span className="text-[14px] font-medium text-white">{name}</span>
        {primary && !connected && (
          <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ background: 'var(--grok-action-btn)', color: 'var(--grok-text-muted)' }}>
            Primary
          </span>
        )}
        {recommended && !connected && (
          <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ background: 'var(--grok-action-btn)', color: 'var(--grok-text-muted)' }}>
            Recommended
          </span>
        )}
      </div>
      <p className="mt-0.5 text-[12px] leading-relaxed" style={{ color: 'var(--grok-text-muted)' }}>
        {description}
      </p>
    </div>

    {connected ? (
      <ConnectionStatus connected connectedLabel={account || 'Connected'} detail={detail} onDisconnect={onDisconnect} />
    ) : (
      <button
        type="button"
        onClick={onConnect}
        className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        style={{ border: '1px solid var(--grok-line)' }}
      >
        Connect <ChevronRight size={13} />
      </button>
    )}
  </div>
)
