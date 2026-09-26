import React from 'react'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { ASSETS } from '../../assets'
import { ArrowRight, Sparkles } from 'lucide-react'

/**
 * UI HEAD — FUTURE FEATURE PREVIEW
 *
 * Opened every time the TopBar "UI Head" tool button is pressed. Plays
 * `public/assets/UI Demo/UI Video.mp4` as a non-editing teaser; the real
 * editable surface remains CanvasView behind "Open canvas".
 */
export const UiDemoVideoDialog: React.FC<{
  open: boolean
  onClose: () => void
  onOpenCanvas: () => void
}> = ({ open, onClose, onOpenCanvas }) => (
  <Dialog
    open={open}
    onClose={onClose}
    title="UI Head — Preview"
    description="Possible future feature · teaser, nothing here edits your project yet"
    width="max-w-2xl"
    footer={
      <>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
        <Button size="sm" onClick={onOpenCanvas}>
          Open canvas <ArrowRight size={13} />
        </Button>
      </>
    }
  >
    <div className="overflow-hidden rounded-xl border border-line bg-black">
      <video
        key={String(open)}
        src={ASSETS.demo.uiVideo}
        controls
        playsInline
        preload="metadata"
        className="aspect-video w-full bg-black"
        aria-label="UI Head future feature demo video"
      />
    </div>
    <p className="mt-3 flex items-center gap-1.5 text-meta leading-relaxed text-muted">
      <Sparkles size={12} className="shrink-0 text-accentPurple" aria-hidden />
      This is where UI Head is heading — generate and edit screens directly.
      Continue in the canvas to edit elements today.
    </p>
  </Dialog>
)
