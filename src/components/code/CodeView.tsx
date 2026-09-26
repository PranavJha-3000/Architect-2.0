import React, { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useStore } from '../../store/store'
import { filesFor } from './codeFiles'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { cx } from '../ui/cx'
import { FileCode2, ShieldCheck, ShieldAlert, ChevronDown, RotateCw, Sparkles, Folder, File } from 'lucide-react'

/** Minimal token highlighter — keywords/strings/comments, no heavy dependency. */
const highlight = (line: string) => {
  const parts = line.split(/('[^']*'|"[^"]*"|`[^`]*`|\/\/.*$|\b(?:import|from|export|default|const|let|var|function|return|async|await|try|catch|finally|if|else|for|while|type|interface|extends|new|typeof|throw|class|as|in|of|null|true|false|undefined)\b)/g)
  return parts.map((p, i) => {
    let cls = ''
    if (/^('|"|`)/.test(p)) cls = 'text-muted'
    else if (/^\/\//.test(p)) cls = 'text-muted/70'
    else if (/^(import|from|export|default|const|let|var|function|return|async|await|try|catch|finally|if|else|for|while|type|interface|extends|new|typeof|throw|class|as|in|of|null|true|false|undefined)$/.test(p)) cls = 'text-paper'
    return <span key={i} className={cls}>{p}</span>
  })
}

export const CodeView: React.FC = () => {
  const { projectId = '' } = useParams()
  const project = useStore((s) => s.projects.find((p) => p.id === projectId))
  const guard = useStore((s) => s.guards[projectId])
  const runGuard = useStore((s) => s.runGuard)
  const activeFile = useStore((s) => s.activeFile[projectId])
  const setActiveFile = useStore((s) => s.setActiveFile)
  const [openCheck, setOpenCheck] = useState<string | null>(null)
  const [explain, setExplain] = useState(false)

  const files = useMemo(() => filesFor(project?.previewTemplateId ?? 'streaks'), [project])
  const current = files.find((f) => f.path === activeFile) ?? files[0]
  const advisories = guard?.checks.filter((c) => c.status === 'advisory').length ?? 0

  if (!current) {
    return <EmptyState icon={<FileCode2 size={18} />} title="No code yet" body="Start a build and the generated files will appear here." actionLabel="Open Manager" />
  }


  return (
    <div className="flex h-full min-h-0">
      <div className="w-56 shrink-0 overflow-y-auto scrollbar-thin border-r border-line p-2">
        {files.map((f) => (
          <button
            key={f.path}
            onClick={() => { setActiveFile(projectId, f.path); setExplain(false) }}
            className={cx(
              'mb-0.5 flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left font-mono text-[11px] transition-colors',
              f.path === current.path ? 'bg-surface text-paper' : 'text-muted hover:bg-surface/60 hover:text-paper',
            )}
          >
            {f.path.includes('/') ? <Folder size={12} className="shrink-0" /> : <File size={12} className="shrink-0" />}
            <span className="truncate">{f.path.split('/').pop()}</span>
          </button>
        ))}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-5">
          <div className="min-w-0">
            <h2 className="truncate font-mono text-[12px] text-paper">{current.path}</h2>
            <p className="text-[11px] text-muted">{project?.framework}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setExplain((v) => !v)}>
              <Sparkles size={13} /> Explain file
            </Button>
            {guard ? <GuardBadge guard={guard} projectId={projectId} onReScan={() => runGuard(projectId)} open={openCheck} setOpen={setOpenCheck} /> : (
              <Button size="sm" variant="secondary" onClick={() => runGuard(projectId)}>
                <ShieldCheck size={13} /> Run Guard
              </Button>
            )}
          </div>
        </div>

        {explain && (
          <div className="shrink-0 border-b border-line bg-surface px-5 py-3">
            <p className="text-[12px] leading-relaxed text-muted">
              <span className="font-medium text-paper">What this file does: </span>
              {current.path.split('/').pop()} is part of the {project?.name} build. It wires the interface to the data layer and handles the three states that matter — loading, error and empty. The error path is handled explicitly rather than swallowed, which is why Guard passes it.
            </p>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-auto scrollbar-thin bg-ink p-4">
          <pre className="font-mono text-[12px] leading-relaxed">
            <code>
              {current.content.split('\n').map((line, i) => (
                <div key={i} className="flex">
                  <span className="mr-4 inline-block w-8 shrink-0 select-none text-right text-muted/40">{i + 1}</span>
                  <span>{highlight(line)}</span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </div>
  )
}

const GuardBadge: React.FC<{
  guard: NonNullable<ReturnType<typeof useStore.getState>['guards'][string]>
  projectId: string
  onReScan: () => void
  open: string | null
  setOpen: (v: string | null) => void
}> = ({ guard, onReScan, open, setOpen }) => {
  const advisories = guard.checks.filter((c) => c.status === 'advisory').length
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(open ? null : '__badge__')}
        className={cx(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
          advisories > 0 ? 'border-muted/40 text-paper' : 'border-line text-paper',
        )}
      >
        {advisories > 0 ? <ShieldAlert size={12} className="text-muted" /> : <ShieldCheck size={12} className="text-muted" />}
        Guard: {advisories > 0 ? `${advisories} advisor${advisories > 1 ? 'ies' : 'y'}` : 'Passing'}
        <ChevronDown size={11} className="text-muted" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-30 w-80 animate-fadeUp rounded-card border border-line bg-ink p-2">
          {guard.checks.map((c) => (
            <div key={c.id} className="rounded-[6px]">
              <button
                onClick={() => setOpen(open === c.id ? null : c.id)}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-[12px] text-paper transition-colors hover:bg-surface"
              >
                <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', c.status === 'pass' ? 'bg-muted' : 'bg-muted')} />
                <span className="flex-1">{c.label}</span>
                <span className="text-[10px] text-muted">{c.status === 'pass' ? 'pass' : 'advisory'}</span>
              </button>
              {open === c.id && <p className="px-2 pb-2 pl-6 text-[11px] leading-relaxed text-muted">{c.detail}</p>}
            </div>
          ))}
          <p className="mt-1 border-t border-line px-2 pt-2 text-[10px] text-muted/80">Advisory findings never block your build.</p>
          <button
            onClick={onReScan}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-[6px] border border-line px-2 py-1.5 text-[11px] text-muted transition-colors hover:bg-surface hover:text-paper"
          >
            <RotateCw size={11} className={guard.scanning ? 'animate-spin' : ''} /> Re-scan
          </button>
        </div>
      )}
    </div>
  )
}
