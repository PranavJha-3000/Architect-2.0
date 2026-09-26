import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/store'
import { agentById } from '../../store/roster'
import type { ChannelId, ImportDraft } from '../../store/types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Surface'
import { Modal } from '../ui/Modal'
import { cx } from '../ui/cx'
import { Check, Loader2, FileArchive, ClipboardPaste, Search, Sparkles } from 'lucide-react'
import { ASSETS } from '../../assets'

const ANALYSIS_STEPS = ['Cloning repository…', 'Indexing files…', 'Reading config…', 'Detecting framework…', 'Matching specialists…']

const SOURCES: { type: ImportDraft['sourceType']; label: string; icon: React.ReactNode; placeholder: string }[] = [
  { type: 'github', label: 'GitHub URL', icon: <img src={ASSETS.icons.github} alt="" aria-hidden className="brand-icon h-[14px] w-[14px]" />, placeholder: 'https://github.com/you/your-project' },
  { type: 'zip', label: 'ZIP upload', icon: <FileArchive size={14} />, placeholder: 'project.zip' },
  { type: 'paste', label: 'Paste files', icon: <ClipboardPaste size={14} />, placeholder: 'Paste a file tree or key config' },
]

const DETECTED = {
  react: {
    framework: 'React 18 + Vite + Tailwind',
    stack: ['React 18', 'TypeScript', 'Tailwind', 'Vite'],
    agents: ['frontend', 'backend', 'qa'] as ChannelId[],
    files: 42,
    summary: "I've reviewed your repo — 42 files, React 18 with Vite and Tailwind, routing already set up. Three specialists are ready to work. What would you like to add?",
  },
  next: {
    framework: 'Next.js 14 + Prisma',
    stack: ['Next.js 14', 'App Router', 'Prisma', 'PostgreSQL'],
    agents: ['frontend', 'backend', 'devops', 'qa'] as ChannelId[],
    files: 118,
    summary: "I've reviewed your repo — 118 files, Next.js 14 on the App Router with Prisma and a Postgres schema. Four specialists are ready, including DevOps for the data layer. What should we tackle first?",
  },
}

type Detected = typeof DETECTED[keyof typeof DETECTED]

export const ImportWizard: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const navigate = useNavigate()
  const importProject = useStore((s) => s.importProject)
  const [type, setType] = useState<ImportDraft['sourceType']>('github')
  const [source, setSource] = useState('')
  const [step, setStep] = useState(0)
  const [analysis, setAnalysis] = useState(0)
  const [result, setResult] = useState<Detected | null>(null)

  useEffect(() => {
    if (!open) { setStep(0); setAnalysis(0); setResult(null); setSource('') }
  }, [open])

  const runAnalysis = () => {
    if (!source.trim()) return
    setStep(1)
    setAnalysis(0)
    const t = setInterval(() => {
      setAnalysis((a) => {
        if (a >= ANALYSIS_STEPS.length) {
          clearInterval(t)
          const s = source.toLowerCase()
          setResult(s.includes('next') || s.includes('prisma') ? DETECTED.next : DETECTED.react)
          setStep(2)
          return a
        }
        return a + 1
      })
    }, 650)
  }

  const confirm = () => {
    if (!result) return
    const id = importProject({
      source: source.trim(), sourceType: type, status: 'detected', step: 4,
      detectedFramework: result.framework, detectedStack: result.stack,
      suggestedAgents: result.agents, fileCount: result.files, contextSummary: result.summary, tree: [],
    })
    onClose()
    navigate(`/p/${id}`)
  }

  return (
    <Modal open={open} onClose={onClose} title="Import an existing project" description="Bring in a codebase and Architect will get the team oriented." width="max-w-lg">
      {step === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {SOURCES.map((s) => (
              <button
                key={s.type}
                onClick={() => setType(s.type)}
                className={cx(
                  'flex flex-col items-center gap-1.5 rounded-card border p-3 text-[12px] transition-colors',
                  type === s.type ? 'border-accent/60 bg-surface text-paper' : 'border-line text-muted hover:bg-surface',
                )}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>
          <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder={SOURCES.find((s) => s.type === type)!.placeholder} />
          <p className="text-[11px] text-muted">Try a URL containing “next” or “prisma” to see a different detected stack.</p>
          <Button className="w-full" onClick={runAnalysis} disabled={!source.trim()}>
            <Search size={14} /> Analyse repository
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="py-2">
          {ANALYSIS_STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-3 py-2">
              {i < analysis ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent"><Check size={11} className="text-white" /></span>
              ) : i === analysis ? (
                <Loader2 size={16} className="animate-spin text-muted" />
              ) : (
                <span className="h-5 w-5 rounded-full border border-line" />
              )}
              <span className={cx('text-[13px]', i <= analysis ? 'text-paper' : 'text-muted/50')}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {step === 2 && result && (
        <div className="space-y-4">
          <div className="rounded-card border border-line bg-surface p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted">Detected framework</p>
            <p className="mt-1 text-[14px] font-medium text-paper">{result.framework}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {result.stack.map((s) => (
                <span key={s} className="rounded-full border border-line bg-ink px-2 py-0.5 text-[10px] text-muted">{s}</span>
              ))}
            </div>
            <p className="mt-2.5 text-[11px] text-muted">{result.files} files indexed</p>
          </div>

          <div>
            <p className="mb-2 text-[11px] uppercase tracking-wider text-muted">Specialists assigned</p>
            <div className="flex flex-wrap gap-2">
              {result.agents.map((a) => (
                <span key={a} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] text-paper">
                  <Check size={11} className="text-muted" /> #{a} · {agentById(a).name}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted/80">These channels start active. Others stay empty until Manager brings them in.</p>
          </div>

          <div>
            <p className="mb-2 text-[11px] uppercase tracking-wider text-muted">Manager has context</p>
            <p className="rounded-card border border-line bg-surface p-3 text-[12px] leading-relaxed text-muted">{result.summary}</p>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => { setStep(0); setResult(null) }}>Back</Button>
            <Button className="flex-1" onClick={confirm}>
              <Sparkles size={14} /> Import and open
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

