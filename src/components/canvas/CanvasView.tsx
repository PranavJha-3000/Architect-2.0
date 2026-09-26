import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../../store/store'
import { agentById } from '../../store/roster'
import type { CanvasEl } from '../../store/types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Surface'
import { EmptyState } from '../ui/EmptyState'
import { cx } from '../ui/cx'
import { Upload, PenLine, Check, Loader2, Image as ImageIcon, ArrowRight, Layers } from 'lucide-react'

const ANALYSIS = ['Reading the image…', 'Detecting regions…', 'Inferring hierarchy…', 'Building editable elements…']

const E = (id: string, type: CanvasEl['type'], x: number, y: number, w: number, h: number, text: string, color: string, radius: number, fontSize: number, fontWeight: number): CanvasEl =>
  ({ id, type, x, y, w, h, text, color, radius, fontSize, fontWeight, children: [] })

const makeScreenshotLayout = (): CanvasEl[] => [
  E('e1', 'nav', 24, 20, 500, 40, 'Dashboard', '#18181b', 8, 13, 600),
  E('e2', 'text', 24, 84, 260, 30, 'Your overview', '#18181b', 0, 22, 650),
  E('e3', 'button', 400, 86, 124, 34, 'New entry', '#007aff', 999, 12, 550),
  E('e4', 'card', 24, 136, 232, 92, 'Current streak', '#18181b', 8, 12, 500),
  E('e5', 'card', 284, 136, 232, 92, 'Best streak', '#18181b', 8, 12, 500),
  E('e6', 'divider', 24, 252, 492, 1, '', '#2c2c32', 0, 0, 0),
  E('e7', 'text', 24, 272, 180, 24, 'This week', '#18181b', 0, 14, 600),
  E('e8', 'image', 24, 308, 492, 92, 'Heatmap', '#18181b', 8, 11, 400),
]

const makeSketchLayout = (): CanvasEl[] => [
  E('s1', 'frame', 40, 28, 180, 90, 'Header', '#18181b', 8, 11, 500),
  E('s2', 'frame', 40, 148, 420, 120, 'Content block', '#18181b', 8, 11, 500),
  E('s3', 'frame', 40, 300, 200, 80, 'Card', '#18181b', 8, 11, 500),
  E('s4', 'frame', 260, 300, 200, 80, 'Card', '#18181b', 8, 11, 500),
  E('s5', 'text', 40, 420, 240, 26, 'Primary action', '#18181b', 0, 13, 600),
]

export const CanvasView: React.FC = () => {
  const { projectId = '' } = useParams()
  const project = useStore((s) => s.projects.find((p) => p.id === projectId))
  const doc = useStore((s) => s.canvas[projectId])
  const initCanvas = useStore((s) => s.initCanvas)
  const selectElement = useStore((s) => s.selectElement)
  const updateElement = useStore((s) => s.updateElement)
  const pushToast = useStore((s) => s.pushToast)
  const managerRoute = useStore((s) => s.managerRoute)
  const [mode, setMode] = useState<'idle' | 'analyzing'>('idle')
  const [step, setStep] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!doc) initCanvas(projectId, 'blank', project ? makeScreenshotLayout() : [])
  }, [doc, projectId])

  const selected = useMemo(() => doc?.elements.find((e) => e.id === doc.selectedId) ?? null, [doc])

  const analyze = (kind: 'screenshot' | 'sketch') => {
    setMode('analyzing')
    setStep(0)
    let i = 0
    const t = setInterval(() => {
      i += 1
      setStep(i)
      if (i >= ANALYSIS.length) {
        clearInterval(t)
        const els = kind === 'screenshot' ? makeScreenshotLayout() : makeSketchLayout()
        useStore.setState((st) => ({
          canvas: { ...st.canvas, [projectId]: { projectId, elements: els, selectedId: null, source: kind, analyzing: false } },
        }))
        setMode('idle')
        pushToast(kind === 'screenshot' ? 'Screenshot converted to editable UI' : 'Sketch interpreted into UI regions')
      }
    }, 620)
  }

  const hasElements = (doc?.elements.length ?? 0) > 0

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-5">
          <div>
            <h2 className="text-[14px] font-semibold text-paper">UI Head · Canvas</h2>
            <p className="text-[11px] text-muted">Select any element to edit it live</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload size={13} /> From screenshot
            </Button>
            <Button size="sm" variant="secondary" onClick={() => analyze('sketch')}>
              <PenLine size={13} /> From sketch
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { if (e.target.files?.length) analyze('screenshot') }}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto scrollbar-thin bg-ink p-8">
          {mode === 'analyzing' ? (
            <div className="mx-auto mt-16 max-w-sm rounded-card border border-line bg-surface p-6">
              <div className="mb-4 flex items-center gap-3">
                <Loader2 size={16} className="animate-spin text-muted" />
                <p className="text-[13px] text-paper">Converting to editable UI…</p>
              </div>
              {ANALYSIS.map((label, i) => (
                <div key={label} className="flex items-center gap-2.5 py-1.5">
                  {i < step ? <Check size={12} className="text-muted" /> : <span className="h-3 w-3" />}
                  <span className={cx('text-[12px]', i <= step ? 'text-paper' : 'text-muted/50')}>{label}</span>
                </div>
              ))}
            </div>
          ) : !hasElements ? (
            <EmptyState
              icon={<ImageIcon size={18} />}
              title="Start from a blank canvas"
              body="Upload a screenshot or pick a sketch and UI Head will turn it into elements you can edit."
              actionLabel="From screenshot"
              onAction={() => fileRef.current?.click()}
              secondaryLabel="From sketch"
              onSecondary={() => analyze('sketch')}
            />
          ) : (
            <div className="mx-auto w-fit">
              <div className="mb-3 flex items-center gap-2 text-[11px] text-muted">
                <Layers size={12} /> {doc?.elements.length} elements · {doc?.source === 'sketch' ? 'from sketch' : doc?.source === 'screenshot' ? 'from screenshot' : 'blank'}
              </div>
              <div className="relative rounded-card border border-line bg-surface p-6" style={{ width: 560, minHeight: 460 }}>
                {doc?.elements.map((el) => (
                  <CanvasNode key={el.id} el={el} selected={doc.selectedId === el.id} onSelect={() => selectElement(projectId, el.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-64 shrink-0 overflow-y-auto scrollbar-thin border-l border-line p-4">
        <h3 className="mb-3 text-[11px] uppercase tracking-wider text-muted">Properties</h3>
        {!selected ? (
          <p className="text-[12px] leading-relaxed text-muted">
            Select an element on the canvas to edit its text, size, colour and shape.
          </p>
        ) : (
          <div className="space-y-3">
            <Field label="Text">
              <Input value={selected.text} onChange={(e) => updateElement(projectId, selected.id, { text: e.target.value })} className="h-9 text-[12px]" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Size W">
                <Input type="number" value={selected.w} onChange={(e) => updateElement(projectId, selected.id, { w: Number(e.target.value) })} className="h-9 text-[12px]" />
              </Field>
              <Field label="Size H">
                <Input type="number" value={selected.h} onChange={(e) => updateElement(projectId, selected.id, { h: Number(e.target.value) })} className="h-9 text-[12px]" />
              </Field>
            </div>
            <Field label="Font size">
              <Input type="number" value={selected.fontSize} onChange={(e) => updateElement(projectId, selected.id, { fontSize: Number(e.target.value) })} className="h-9 text-[12px]" />
            </Field>
            <Field label="Radius">
              <Input type="number" value={selected.radius} onChange={(e) => updateElement(projectId, selected.id, { radius: Number(e.target.value) })} className="h-9 text-[12px]" />
            </Field>
            <Field label="Fill">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 shrink-0 rounded-[6px] border border-line" style={{ background: selected.color }} />
                <Input value={selected.color} onChange={(e) => updateElement(projectId, selected.id, { color: e.target.value })} className="h-9 font-mono text-[11px]" />
              </div>
            </Field>
            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                pushToast('Changes applied to the live preview')
                managerRoute(projectId, ['frontend'])
              }}
            >
              Apply changes <ArrowRight size={13} />
            </Button>
            <p className="text-[11px] leading-relaxed text-muted/80">
              Applying routes the update to {agentById('frontend').name} so the code stays in sync.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted">{label}</span>
    {children}
  </label>
)

const CanvasNode: React.FC<{ el: CanvasEl; selected: boolean; onSelect: () => void }> = ({ el, selected, onSelect }) => (
  <button
    onClick={onSelect}
    className={cx(
      'absolute flex flex-col justify-center text-left transition-colors',
      selected && 'outline outline-2 outline-offset-2 outline-muted',
    )}
    style={{
      left: el.x, top: el.y, width: el.w, minHeight: el.h,
      background: el.color, borderRadius: Math.min(el.radius, 999),
      padding: el.type === 'button' ? '0 16px' : 10,
      color: el.color === '#18181b' ? '#e4e4e7' : '#ffffff',
      fontSize: Math.max(10, el.fontSize), fontWeight: el.fontWeight,
    }}
  >
    {el.type === 'image' ? (
      <span className="flex h-full w-full items-center justify-center gap-2 text-[11px] text-muted">
        <ImageIcon size={14} /> {el.text}
      </span>
    ) : el.type === 'divider' ? null : (
      <span className="truncate">{el.text}</span>
    )}
  </button>
)
