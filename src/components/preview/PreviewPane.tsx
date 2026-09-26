import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../../store/store'
import { agentById, CHANNELS } from '../../store/roster'
import { buildDoc } from './docTemplate'
import { Button, IconButton } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { cx } from '../ui/cx'
import { VibingChooser, BrainrotLifecycle } from '../vibing/VibingChooser'
import { MusicPlayer } from '../vibing/MusicPlayer'
import { useVibingSession } from '../vibing/session'
import { Monitor, Tablet, Smartphone, RotateCw, ExternalLink, Copy, Check, Sparkles, AlertTriangle } from 'lucide-react'

export const PreviewPane: React.FC = () => {
  const { projectId = '' } = useParams()
  const navigate = useNavigate()
  const project = useStore((s) => s.projects.find((p) => p.id === projectId))
  const build = useStore((s) => s.builds[projectId])
  const preview = useStore((s) => s.previews[projectId])
  const setViewport = useStore((s) => s.setViewport)
  const retryBuild = useStore((s) => s.retryBuild)
  const startBuild = useStore((s) => s.startBuild)
  const session = useVibingSession()

  const mode = build?.state ?? 'idle'
  const revealed = preview?.revealed ?? 0
  const viewport = preview?.viewport ?? 'desktop'
  const [copied, setCopied] = useState(false)

  const doc = useMemo(
    () => (project ? buildDoc(project.previewTemplateId, revealed, project.name) : ''),
    [project, revealed],
  )

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(t)
  }, [copied])

  const widths = { desktop: '100%', tablet: '720px', mobile: '390px' }

  return (
    <aside className="preview-pane flex h-full w-[36%] min-w-[340px] max-w-[520px] shrink-0 flex-col border-l border-line bg-ink">
      <div className="preview-block flex min-h-0 flex-1 flex-col">
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line px-3">
          <span className="text-[12px] font-medium text-muted">Preview</span>
          {mode !== 'idle' && (
            <span className="rounded-full border border-line px-1.5 py-0.5 text-[10px] text-muted">
              {mode === 'building' ? 'Building' : mode === 'live' ? 'Live' : 'Error'}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1">
            {(['desktop', 'tablet', 'mobile'] as const).map((v) => {
              const Icon = v === 'desktop' ? Monitor : v === 'tablet' ? Tablet : Smartphone
              return (
                <IconButton key={v} label={`${v} viewport`} onClick={() => setViewport(projectId, v)}
                  className={cx(viewport === v && 'bg-surface text-paper')}>
                  <Icon size={14} />
                </IconButton>
              )
            })}
          </div>
        </div>

      {mode === 'building' && build && <AgentProgress build={build} />}

      {/*
       * THE WELL — the only contained viewport in the panel.
       *
       * The old markup wrapped the iframe in `h-full overflow-y-auto` AND gave
       * the iframe `min-h-[520px]` inside an auto-height frame. The percentage
       * height could not resolve, so the iframe rendered at its 520px minimum
       * and the wrapper scrolled to reveal it — two scrollbars stacked, one for
       * Architect's chrome and one for the generated document.
       *
       * Now the height chain terminates properly: this element is `flex-1
       * min-h-0`, the frame below it inherits a definite height, and the iframe
       * fills that height exactly. Nothing here scrolls. Only the generated
       * document inside the iframe scrolls, which is the correct behaviour.
       *
       * The border and radius are gone as well: the Preview is a device
       * surface, not a card sitting inside a card.
       */}
      <div
        role="region"
        aria-label="Preview"
        className="relative flex min-h-0 flex-1 items-stretch justify-center overflow-hidden bg-ink"
      >
        {mode === 'idle' && (
          <div className="flex h-full w-full items-center justify-center">
            <EmptyState
              icon={<Sparkles size={18} />}
              title="Nothing built yet"
              body="Describe what you want in Manager chat and your team will build it here."
              actionLabel="Start building"
              onAction={() => startBuild(projectId)}
            />
          </div>
        )}
        {mode === 'error' && (
          <div className="flex h-full w-full items-center justify-center">
            <EmptyState
              icon={<AlertTriangle size={18} />}
              title="Preview could not start"
              body={build?.failedReason || 'Something interrupted the build. Retrying usually fixes it.'}
              actionLabel="Retry build"
              onAction={() => retryBuild(projectId)}
              secondaryLabel="View build log"
              onSecondary={() => navigate(`/p/${projectId}/deploy`)}
            />
          </div>
        )}
        {(mode === 'building' || mode === 'live') && (
          <div
            className="relative h-full overflow-hidden"
            style={{ width: widths[viewport], maxWidth: '100%' }}
          >
            <iframe
              title="Preview"
              srcDoc={doc}
              className="h-full w-full border-0 bg-ink"
              sandbox="allow-scripts"
            />
          </div>
        )}
      </div>

      <div className="flex h-9 shrink-0 items-center gap-2 border-t border-line px-3">
        {mode === 'live' ? (
          <>
            {/* `whitespace-nowrap` matters here: these two labels were wrapping
                to two lines inside a 32px control at narrow pane widths, and
                the host string is what should give up space, not the actions. */}
            <Button size="sm" className="whitespace-nowrap" onClick={() => navigate(`/demo/${projectId}`)}>
              <ExternalLink size={13} /> Open site
            </Button>
            <Button size="sm" variant="ghost" className="whitespace-nowrap" onClick={() => { navigator.clipboard?.writeText(`${project?.name ?? 'app'}.architect.app`); setCopied(true) }}>
              {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy link'}
            </Button>
            <span className="ml-auto min-w-0 truncate text-right font-mono text-[10px] text-muted">{project?.previewTemplateId}-preview.architect.app</span>
          </>
        ) : mode === 'building' ? (
          <span className="flex items-center gap-2 text-[12px] text-muted">
            <RotateCw size={12} className="animate-spin" /> {build?.currentTask}
          </span>
        ) : (
          <span className="text-[12px] text-muted">Preview is idle</span>
        )}
      </div>
      </div>

      {/*
       * The utility area. `shrink-0` means it takes exactly the height its
       * content needs and Preview absorbs the rest — Vibing yields first by
       * construction, rather than via a percentage that fights the layout.
       */}
      {session.phase === 'music' && <MusicPlayer />}

      <div className="vibing-panel flex h-10 shrink-0 items-center justify-end border-t border-line px-3">
        <BrainrotLifecycle projectId={projectId} />
        <VibingChooser projectId={projectId} />
      </div>
    </aside>
  )
}

/**
 * Per-agent progress: Backend 60% · Frontend 20% · AI 40%
 *
 * Flattened from a bordered card into a single hairline row. It sits directly
 * above the viewport, and every pixel it does not spend on itself is a pixel
 * the generated UI gets.
 */
const AgentProgress: React.FC<{ build: NonNullable<ReturnType<typeof useStore.getState>['builds'][string]> }> = ({ build }) => {
  const active = CHANNELS.filter((c) => (build.progress[c.id] ?? 0) > 0)
  const done = build.tasks.filter((t) => t.status === 'done').length
  const pct = (done / Math.max(1, build.tasks.length)) * 100
  return (
    <div className="shrink-0 border-b border-line px-3 py-2">
      <div className="flex items-center gap-3">
        <span className="truncate text-[11px] text-muted">{build.currentTask}</span>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          {active.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1.5 text-[11px] text-muted">
              <span className={cx('h-1.5 w-1.5 rounded-full', build.progress[c.id] >= 100 ? 'bg-accent' : 'animate-typingPulse bg-muted')} />
              {agentById(c.id).short}
              <span className="tabular font-medium text-paper">{build.progress[c.id]}%</span>
            </span>
          ))}
        </div>
      </div>
      <div className="mt-1.5 h-px w-full overflow-hidden rounded-full bg-bubble">
        <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
