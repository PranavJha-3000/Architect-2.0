import React, { useEffect, useRef, useState } from 'react'
import { Popover } from '../ui/Popover'
import { cx } from '../ui/cx'
import { Instagram, Youtube, Music2, Film, X } from 'lucide-react'
import type { VibingSource } from './links'
import { classifyLink } from './links'
import { useVibingSession, beginChoosing, chooseSource, cancel, handoff, openBrainrot, closeBrainrot, sourceLabel } from './session'
import { useStore } from '../../store/store'

const SOURCES: { id: VibingSource; label: string; icon: React.ReactNode }[] = [
  { id: 'reels', label: 'Reels', icon: <Instagram size={13} /> },
  { id: 'tiktok', label: 'TikTok', icon: <Film size={13} /> },
  { id: 'youtube', label: 'YouTube', icon: <Youtube size={13} /> },
  { id: 'music', label: 'Music', icon: <Music2 size={13} /> },
]

/**
 * VIBING CHOOSER
 *
 * A compact chooser anchored to the Vibing control, opening upward because the
 * control sits at the bottom edge of the right panel.
 *
 * It is the ONLY input surface for the capability. The Manager conversation
 * mirrors each step as plain transcript text; it never accepts input here, so
 * there is exactly one way to act and no duplicated affordance.
 *
 * A link pasted before a source is named is classified locally and opens
 * directly. Anything unrecognised keeps this chooser open with the text intact
 * so the user can name the source instead of losing what they typed.
 */
export const VibingChooser: React.FC<{ projectId: string }> = ({ projectId }) => {
  const session = useVibingSession()
  const pushManagerMessage = useStore((s) => s.pushManagerMessage)
  const pushUserMessage = useStore((s) => s.pushUserMessage)
  const [url, setUrl] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const awaiting = session.phase === 'awaiting-link'

  // The paste field only exists in the awaiting-link phase, so focus it then.
  useEffect(() => {
    if (awaiting) inputRef.current?.focus()
  }, [awaiting])

  const say = (text: string) => pushManagerMessage(projectId, text, 'text')
  const me = (text: string) => pushUserMessage(projectId, text)

  const pick = (source: VibingSource) => {
    if (session.brainrot) closeBrainrot()
    me(sourceLabel(source))
    chooseSource(source)
    if (source === 'music') {
      say('Turning the music on.')
      return
    }
    // CHAD-style: the feed window opens immediately on source pick, so Reels /
    // TikTok are already playing while work runs. A pasted link then replaces
    // that window with the exact video.
    const feed = openBrainrot(source)
    if (feed === 'blocked') {
      say('Your browser blocked that window. Allow pop-ups for Architect, then pick again. You can also paste a link.')
      return
    }
    say('Opening your feed — paste a link for a specific video, or vibe while work runs.')
  }

  const submit = (raw: string) => {
    const value = raw.trim()
    if (!value) return
    me(value)
    const result = handoff(value)

    if (result === 'unrecognised') {
      // Keep the chooser open and the text with it.
      say("I don't recognise that link. Which source is it?")
      return
    }
    if (result === 'blocked') {
      // A popup blocker returns no window. Say so rather than claim an opening.
      say('Your browser blocked that tab. Allow pop-ups for Architect, then try again.')
      return
    }
    setUrl('')
    const link = classifyLink(value)!
    const name = sourceLabel(link.source)
    if (result === 'queued') {
      say(`${name} is queued below the preview.`)
      return
    }
    if (session.brainrot) closeBrainrot()
    say(link.kind === 'playlist' ? `Opening ${name} playlist…` : `Opening ${name}…`)
  }

  return (
    <div className="flex items-center gap-1.5">
      {session.brainrot && (
        <span className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-line bg-surface px-2 text-[11px] text-muted">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" aria-hidden />
          {sourceLabel(session.brainrot.source)} playing
          <button
            type="button"
            onClick={() => closeBrainrot()}
            title="Close feed window"
            aria-label="Close feed window"
            className="coarse-hit flex h-5 w-5 items-center justify-center rounded-full text-muted transition-colors duration-instant ease-standard hover:text-paper"
          >
            <X size={11} />
          </button>
        </span>
      )}
    <Popover
      side="top"
      align="end"
      label="Vibing"
      menuClassName="w-[280px] p-1.5"
      trigger={(p) => (
        <button
          {...p}
          type="button"
          onClick={() => {
            p.onClick()
            // Pressing Vibing is the first conversational turn.
            if (session.phase === 'idle') {
              beginChoosing()
              say('What should I open?')
            }
          }}
          className={cx(
            'coarse-hit inline-flex h-9 items-center gap-2 rounded-sm border px-4 text-[13px] font-medium',
            'transition-colors duration-instant ease-standard',
            session.phase === 'idle'
              ? 'border-line bg-surface text-paper hover:bg-bubble'
              : 'border-accent/50 bg-surface text-paper hover:bg-bubble',
          )}
        >
          <Film size={14} className="text-accent" aria-hidden />
          Vibing
        </button>
      )}
    >
      <p className="px-1.5 pb-1.5 pt-1 text-[11px] text-muted">
        {awaiting ? 'Paste a link.' : 'What are we doing?'}
      </p>

      <div role="group" aria-label="Source" className="flex flex-wrap gap-0.5">
        {SOURCES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => pick(s.id)}
            className="inline-flex h-7 items-center gap-1 rounded-sm px-1.5 text-[12px] text-paper transition-colors duration-instant ease-standard hover:bg-bubble"
          >
            <span className="text-muted" aria-hidden>
              {s.icon}
            </span>
            {s.label}
          </button>
        ))}
      </div>

      <div className="mx-1.5 my-1.5 h-px bg-lineSoft" />

      <input
        ref={inputRef}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            submit(url)
          }
          if (e.key === 'Escape') {
            e.stopPropagation()
            cancel()
          }
        }}
        placeholder="paste a link…"
        aria-label="Paste a link"
        className="h-7 w-full rounded-sm border border-line bg-input px-2 text-[12px] text-paper placeholder:text-faint focus:outline-none"
      />
    </Popover>
    </div>
  )
}

/**
 * Watches the build lifecycle and closes the brainrot feed window the moment
 * work finishes (CHAD behavior: the window lives only while work runs).
 * Mounted next to the chooser so it works whenever the right panel is visible.
 */
export const BrainrotLifecycle: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { brainrot } = useVibingSession()
  const buildState = useStore((s) => s.builds[projectId]?.state)
  const pushManagerMessage = useStore((s) => s.pushManagerMessage)
  const doneRef = useRef(false)

  useEffect(() => {
    doneRef.current = false
  }, [projectId])

  useEffect(() => {
    if (!brainrot) return
    if (buildState !== 'live' && buildState !== 'error') return
    if (doneRef.current) return
    doneRef.current = true
    const wasOpen = closeBrainrot()
    pushManagerMessage(
      projectId,
      buildState === 'live'
        ? 'Build is done — closed your feed. Back to work.'
        : 'Build hit an error — closed your feed so you can take a look.',
      'text',
    )
    void wasOpen
  }, [brainrot, buildState, projectId, pushManagerMessage])

  return null
}
