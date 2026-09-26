import React, { useEffect, useRef, useState } from 'react'
import { IconButton } from '../ui/Button'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X, ExternalLink } from 'lucide-react'
import { TRACKS } from './data'
import { useVibingSession, clearQueue, sourceLabel } from './session'

const fmt = (s: number) =>
  `${Math.floor(Math.max(0, s) / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0')}`

/**
 * A slider that is actually operable from the keyboard. The previous version
 * was a click-only div with a `role="slider"` bolted on: no tab stop, no
 * arrow keys, no value text — inaccessible to anyone not using a mouse.
 */
const Slider: React.FC<{
  value: number
  max: number
  onChange: (v: number) => void
  label: string
  valueText: string
  step?: number
  bigStep?: number
}> = ({ value, max, onChange, label, valueText, step = 1, bigStep = 15 }) => {
  const ref = useRef<HTMLDivElement>(null)
  const pct = max > 0 ? (value / max) * 100 : 0

  const onKeyDown = (e: React.KeyboardEvent) => {
    let next: number | null = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = value + step
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = value - step
    else if (e.key === 'PageUp') next = value + bigStep
    else if (e.key === 'PageDown') next = value - bigStep
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = max
    if (next === null) return
    e.preventDefault()
    onChange(Math.max(0, Math.min(max, next)))
  }

  const seekFrom = (clientX: number) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
    onChange(Math.round(ratio * max))
  }

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => seekFrom(e.clientX)}
      className="group relative h-3 cursor-pointer"
    >
      <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 rounded-full bg-action" />
      <div
        className="pointer-events-none absolute left-0 top-1/2 h-px -translate-y-1/2 rounded-full bg-accent"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}


/**
 * MUSIC MODE
 *
 * A compact transport that sits directly below the Preview. Not a card, not a
 * dashboard widget: one hairline separates it from the pane, and it shares the
 * pane's plane.
 *
 * Playback is the existing local mock — a 1s visual timer over static track
 * data. There is no audio element and no streaming. A pasted link is therefore
 * a recognised queue entry that opens on its own platform; it is never
 * extracted, scraped, or faked into playing here.
 */
export const MusicPlayer: React.FC = () => {
  const { queued } = useVibingSession()
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [volume, setVolume] = useState(70)
  const [muted, setMuted] = useState(false)

  const track = TRACKS[index]

  useEffect(() => {
    if (!playing) return
    const t = window.setInterval(() => setPosition((p) => p + 1), 1000)
    return () => window.clearInterval(t)
  }, [playing])

  useEffect(() => {
    if (position >= track.durationSec) {
      setIndex((i) => (i + 1) % TRACKS.length)
      setPosition(0)
    }
  }, [position, track.durationSec])

  const go = (i: number) => {
    setIndex((i + TRACKS.length) % TRACKS.length)
    setPosition(0)
  }

  const nextUp = TRACKS[(index + 1) % TRACKS.length]

  return (
    <div className="shrink-0 border-t border-line px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-[10px] uppercase tracking-[0.06em] text-muted">
          Now Playing
        </span>
        <button
          type="button"
          onClick={clearQueue}
          title="Dismiss queued link"
          aria-label="Dismiss queued link"
          className="coarse-hit ml-auto shrink-0 text-muted transition-colors duration-instant ease-standard hover:text-paper"
        >
          <X size={12} />
        </button>
      </div>

      <div className="mt-0.5 flex items-baseline gap-2">
        <p className="truncate text-[12px] font-medium text-paper">{track.title}</p>
        <p className="shrink-0 truncate text-[11px] text-muted">{track.artist}</p>
      </div>

      <div className="mt-1.5 flex items-center gap-2">
        <span className="tabular w-8 shrink-0 font-mono text-[10px] text-muted">
          {fmt(position)}
        </span>
        <div className="min-w-0 flex-1">
          <Slider
            value={position}
            max={track.durationSec}
            onChange={setPosition}
            label="Seek"
            valueText={`${fmt(position)} of ${fmt(track.durationSec)}`}
            step={5}
            bigStep={15}
          />
        </div>
        <span className="tabular shrink-0 font-mono text-[10px] text-muted">
          {fmt(track.durationSec)}
        </span>
      </div>

      <div className="mt-1 flex items-center gap-1">
        <IconButton label="Previous track" onClick={() => go(index - 1)}>
          <SkipBack size={14} />
        </IconButton>
        <IconButton label={playing ? 'Pause' : 'Play'} onClick={() => setPlaying((p) => !p)}>
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </IconButton>
        <IconButton label="Next track" onClick={() => go(index + 1)}>
          <SkipForward size={14} />
        </IconButton>

        <span className="ml-1.5 hidden min-w-0 flex-1 truncate text-[10px] text-muted min-[361px]:block">
          Next up — {nextUp.title}
        </span>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <IconButton
            label={muted || volume === 0 ? 'Unmute' : 'Mute'}
            onClick={() => setMuted((m) => !m)}
            aria-pressed={muted}
          >
            {muted || volume === 0 ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </IconButton>
          <div className="hidden w-16 min-[361px]:block">
            <Slider
              value={muted ? 0 : volume}
              max={100}
              onChange={(v) => {
                setVolume(v)
                if (v > 0) setMuted(false)
              }}
              label="Volume"
              valueText={`${muted ? 0 : volume}%`}
              step={5}
              bigStep={10}
            />
          </div>
        </div>
      </div>

      {/* A recognised link we cannot play locally. Honest about that. */}
      {queued.map((q) => (
        <div key={q.url} className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted">
          <ExternalLink size={10} aria-hidden className="shrink-0" />
          <span className="truncate">
            Queued — {sourceLabel(q.source)}
            {q.kind === 'playlist' ? ' playlist' : ''}. Opens on {sourceLabel(q.source)}.
          </span>
        </div>
      ))}
    </div>
  )
}
