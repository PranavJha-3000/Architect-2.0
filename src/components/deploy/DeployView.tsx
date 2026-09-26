import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useStore } from '../../store/store'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { ConfirmDialog } from '../ui/Modal'
import { cx } from '../ui/cx'
import { Rocket, ExternalLink, Copy, Check, RotateCw, AlertTriangle, History, Loader2 } from 'lucide-react'

export const DeployView: React.FC = () => {
  const { projectId = '' } = useParams()
  const navigate = useNavigate()
  const build = useStore((s) => s.builds[projectId])
  const deployments = useStore((s) => s.deployments[projectId]) ?? []
  const deploy = useStore((s) => s.deploy)
  const rollback = useStore((s) => s.rollback)
  const [env, setEnv] = useState<'preview' | 'production'>('preview')
  const [copied, setCopied] = useState(false)
  const [rollbackTo, setRollbackTo] = useState<number | null>(null)
  const logRef = useRef<HTMLDivElement>(null)

  const latest = deployments[0]
  const running = latest?.status === 'running'
  const blocked = !build || build.state === 'idle'

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [latest?.logs.length])

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(t)
  }, [copied])


  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-3xl p-6">
        <h2 className="text-[16px] font-semibold text-paper">Deploy</h2>
        <p className="mt-1 text-[13px] text-muted">Ship your build and keep every version recoverable.</p>

        <div className="mt-5 rounded-card border border-line bg-surface p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-full border border-line bg-ink p-1">
              {(['preview', 'production'] as const).map((e) => (
                <button
                  key={e}
                  onClick={() => setEnv(e)}
                  className={cx('h-7 rounded-full px-3.5 text-[12px] font-medium capitalize transition-colors',
                    env === e ? 'bg-accent text-white' : 'text-muted hover:text-paper')}
                >
                  {e}
                </button>
              ))}
            </div>
            <Button className="ml-auto" onClick={() => deploy(projectId, env, env === 'production')} disabled={blocked || running}>
              {running ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
              {running ? 'Deploying…' : `Deploy to ${env}`}
            </Button>
          </div>
          <p className="mt-2.5 text-[11px] text-muted/80">
            {blocked
              ? 'Deploy needs a successful build first. Open Manager and start building.'
              : 'Production deploys always simulate a failure so the error path is visible. Preview deploys succeed, and Retry always succeeds.'}
          </p>
        </div>

        {latest?.status === 'failed' && (
          <div className="mt-4 rounded-card border border-muted/40 bg-surface p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-muted" />
              <div className="min-w-0 flex-1">
                <h3 className="text-[13px] font-semibold text-paper">v{latest.version} failed to deploy</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{latest.failureReason}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => deploy(projectId, latest.env, false)}>
                    <RotateCw size={13} /> Retry deploy
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/p/${projectId}/code`)}>Inspect code</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {latest?.status === 'success' && (
          <div className="mt-4 rounded-card border border-line bg-surface p-4">
            <div className="flex flex-wrap items-start gap-5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Check size={15} className="text-muted" />
                  <h3 className="text-[13px] font-semibold text-paper">v{latest.version} is live on {latest.env}</h3>
                </div>
                <p className="mt-2 truncate font-mono text-[12px] text-muted">{latest.url}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => navigate(`/demo/${projectId}`)}>
                    <ExternalLink size={13} /> Open site
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard?.writeText(latest.url); setCopied(true) }}>
                    {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy link'}
                  </Button>
                </div>
              </div>
              <div className="shrink-0 rounded-card border border-line bg-white p-2.5">
                <QRCodeSVG value={latest.url} size={104} bgColor="#FFFFFF" fgColor="#121214" level="M" />
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted/80">Scan to open the deployed app from your phone.</p>
          </div>
        )}

        {latest && latest.logs.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-card border border-line">
            <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
              <span className="text-[12px] font-medium text-paper">Build log · v{latest.version}</span>
              {running && <Loader2 size={12} className="animate-spin text-muted" />}
            </div>
            <div ref={logRef} className="max-h-56 overflow-y-auto scrollbar-thin bg-ink p-4 font-mono text-[11px] leading-relaxed">
              {latest.logs.map((l, i) => (
                <p key={i} className={cx(l.startsWith('✓') ? 'text-paper' : l.startsWith('✗') ? 'text-muted' : 'text-muted')}>{l}</p>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <h3 className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
            <History size={12} /> Version history
          </h3>
          {deployments.length === 0 ? (
            <div className="rounded-card border border-line">
              <EmptyState
                icon={<Rocket size={18} />}
                title="No deployments yet"
                body="Deploy your build to get a live URL, a QR code, and a rollback point."
                actionLabel={blocked ? undefined : 'Deploy to preview'}
                onAction={blocked ? undefined : () => deploy(projectId, 'preview', false)}
                secondaryLabel={blocked ? 'Open Manager' : undefined}
                onSecondary={blocked ? () => navigate(`/p/${projectId}`) : undefined}
              />
            </div>
          ) : (
            <div className="overflow-hidden rounded-card border border-line">
              {deployments.map((d, i) => (
                <div key={d.id} className={cx('flex flex-wrap items-center gap-3 p-3.5', i > 0 && 'border-t border-line', i === 0 && 'bg-surface')}>
                  <span className="rounded-full border border-line bg-ink px-2 py-0.5 font-mono text-[10px] text-muted">v{d.version}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-paper">
                      {d.rolledBackFrom ? `Rolled back to v${d.rolledBackFrom}` : d.url || 'Deploying…'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {d.env} · {new Date(d.createdAt).toLocaleString()}
                      {d.rolledBackFrom && ' · rollback'}
                    </p>
                  </div>
                  <span className={cx('rounded-full border px-2 py-0.5 text-[10px]',
                    d.status === 'failed' ? 'border-muted/40 text-paper' : 'border-line text-muted')}>
                    {d.status}
                  </span>
                  {d.status === 'success' && i > 0 && (
                    <Button size="sm" variant="ghost" onClick={() => setRollbackTo(d.version)}>Rollback</Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={rollbackTo !== null}
        onClose={() => setRollbackTo(null)}
        title={`Roll back to v${rollbackTo}`}
        body="The current version stays in history. A new version will be created pointing at the one you choose."
        confirmLabel="Roll back"
        onConfirm={() => rollbackTo !== null && rollback(projectId, rollbackTo)}
      />
    </div>
  )
}

