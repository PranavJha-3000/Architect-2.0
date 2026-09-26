import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useStore } from '../../store/store'
import { Button } from '../ui/Button'
import { Input } from '../ui/Surface'
import { EmptyState } from '../ui/EmptyState'
import { Modal } from '../ui/Modal'
import { cx } from '../ui/cx'
import { ASSETS } from '../../assets'
import { GitCommitHorizontal, GitBranch, AlertTriangle, Upload, Loader2, Check, ExternalLink } from 'lucide-react'

const GitHubMark: React.FC<{ size?: number; light?: boolean }> = ({ size = 16, light = true }) => (
  <img
    src={ASSETS.icons.github}
    alt=""
    aria-hidden
    width={size}
    height={size}
    className={light ? 'brand-icon shrink-0' : 'brand-icon-ink shrink-0'}
  />
)

export const GitHubView: React.FC = () => {
  const { projectId = '' } = useParams()
  const project = useStore((s) => s.projects.find((p) => p.id === projectId))
  const gh = useStore((s) => s.github[projectId])
  const connect = useStore((s) => s.connectGithub)
  const commitBuild = useStore((s) => s.commitBuild)
  const createConflict = useStore((s) => s.createConflict)
  const resolveConflict = useStore((s) => s.resolveConflict)
  const onboarding = useStore((s) => s.onboarding)
  // Onboarding may already have connected a GitHub account + repo.
  const onboardGh = onboarding.integrations.github
  const [repo, setRepo] = useState(
    onboardGh.detail || (project ? project.name.toLowerCase().replace(/\s+/g, '-') : ''),
  )
  const accountLabel = onboardGh.connected ? onboardGh.account : ''
  const [connecting, setConnecting] = useState(false)
  const [resolveOpen, setResolveOpen] = useState(false)

  if (!gh?.connected) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-card border border-line bg-surface p-6 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-ink text-paper">
            <GitHubMark size={18} />
          </div>
          <h2 className="text-[15px] font-semibold text-paper">Connect GitHub</h2>
          {accountLabel && (
            <p className="mt-1 text-[12px] text-muted">Connected during setup as {accountLabel}</p>
          )}
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            Link a repository so your team can commit builds and you can keep version history.
          </p>
          <Input className="mt-5" value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="repository-name" />
          <Button
            className="mt-3 w-full"
            disabled={!repo.trim() || connecting}
            onClick={() => {
              setConnecting(true)
              setTimeout(() => { connect(projectId, repo.trim()); setConnecting(false) }, 1100)
            }}
          >
            {connecting ? <Loader2 size={14} className="animate-spin" /> : <GitHubMark size={14} light={false} />} Connect GitHub
          </Button>
          <p className="mt-3 text-[11px] text-muted/70">Simulated connection for this demo. No real account is accessed.</p>
        </div>
      </div>
    )
  }


  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-3xl p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold text-paper">
              <GitHubMark size={16} /> {gh.account} / {gh.repo}
            </h2>
            <p className="mt-0.5 flex items-center gap-2 text-[12px] text-muted">
              <GitBranch size={12} /> {gh.branch} · {gh.commits.length} commits
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => createConflict(projectId)} title="Simulate a push conflict">
              <AlertTriangle size={13} /> Simulate conflict
            </Button>
            <Button size="sm" onClick={() => commitBuild(projectId)}>
              <Upload size={13} /> Commit build
            </Button>
          </div>
        </div>

        {gh.push.conflict && (
          <div className="mt-5 rounded-card border border-muted/40 bg-surface p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-muted" />
              <div className="min-w-0 flex-1">
                <h3 className="text-[13px] font-semibold text-paper">Push conflict on {gh.branch}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">
                  Your local build and the remote have both moved on. Nothing is lost — choose which version to keep.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-[6px] border border-line bg-ink p-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted">Your local build</p>
                    <p className="mt-1 text-[12px] text-paper">{gh.push.localSummary}</p>
                  </div>
                  <div className="rounded-[6px] border border-line bg-ink p-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted">Remote {gh.branch}</p>
                    <p className="mt-1 text-[12px] text-paper">{gh.push.remoteSummary}</p>
                  </div>
                </div>
                <Button size="sm" className="mt-3" onClick={() => setResolveOpen(true)}>Resolve conflict</Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <h3 className="mb-3 text-[11px] uppercase tracking-wider text-muted">Commit history</h3>
          {gh.commits.length === 0 ? (
            <EmptyState icon={<GitCommitHorizontal size={18} />} title="No commits yet" body="Commit your first build to start tracking history." actionLabel="Commit build" onAction={() => commitBuild(projectId)} />
          ) : (
            <div className="overflow-hidden rounded-card border border-line">
              {gh.commits.map((c, i) => (
                <div key={c.id} className={cx('flex items-center gap-3 p-3.5', i > 0 && 'border-t border-line', i === 0 && 'bg-surface')}>
                  <GitCommitHorizontal size={15} className="shrink-0 text-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-paper">{c.message}</p>
                    <p className="mt-0.5 text-[11px] text-muted">{c.author} · {new Date(c.ts).toLocaleString()}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-line bg-ink px-2 py-0.5 font-mono text-[10px] text-muted">{c.hash}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
        title="Resolve conflict"
        description="Pick one version. Architect will create a new commit so history stays readable."
        footer={<Button variant="ghost" onClick={() => setResolveOpen(false)}>Cancel</Button>}
      >
        <div className="space-y-2">
          <button
            onClick={() => { resolveConflict(projectId, 'local'); setResolveOpen(false) }}
            className="flex w-full items-start gap-3 rounded-card border border-line bg-ink p-3 text-left transition-colors hover:bg-bubble"
          >
            <Check size={15} className="mt-0.5 shrink-0 text-muted" />
            <span>
              <span className="block text-[13px] text-paper">Keep my local build</span>
              <span className="mt-0.5 block text-[11px] text-muted">Your build wins. The remote change is rebased underneath.</span>
            </span>
          </button>
          <button
            onClick={() => { resolveConflict(projectId, 'remote'); setResolveOpen(false) }}
            className="flex w-full items-start gap-3 rounded-card border border-line bg-ink p-3 text-left transition-colors hover:bg-bubble"
          >
            <ExternalLink size={15} className="mt-0.5 shrink-0 text-muted" />
            <span>
              <span className="block text-[13px] text-paper">Accept {gh.branch}</span>
              <span className="mt-0.5 block text-[11px] text-muted">Your build is rebased on top of the remote version.</span>
            </span>
          </button>
        </div>
      </Modal>
    </div>
  )
}
