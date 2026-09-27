import React from 'react'
import { Outlet, useLocation, useParams } from 'react-router-dom'
import { ManagerSidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { PreviewPane } from '../preview/PreviewPane'
import { useReturnSignal, useVibingSession, closeHandoff } from '../vibing/session'
import { useStore } from '../../store/store'

/**
 * Workspace:
 *   [Manager sidebar 288][TopBar + main][Preview + Vibing CTA]
 *
 * One sidebar owns search, the Manager list and each Manager's projects —
 * the old 64px identity rail and its overlay drawer are gone; below the
 * `lg` breakpoint the sidebar becomes a slide-over with a scrim instead.
 *
 * `100dvh` rather than `100vh`: on mobile the latter is taller than the
 * viewport once browser chrome is accounted for, which pushed the composer
 * under the URL bar.
 *
 * Canvas is a true full-bleed mode — the right panel hides there. On every
 * other project screen the right panel is visible: Preview above, with the
 * Vibing CTA as the last block beneath it.
 */

/**
 * Notes the return from an external tab back into the Manager conversation.
 *
 * Mounted here rather than inside the right panel so it keeps working when
 * Canvas hides the panel. The only signal used is Architect regaining
 * visibility or focus — we never claim anything about what happened in the
 * other tab, because cross-origin that cannot be known.
 */
const ReturnNotice: React.FC = () => {
  const { projectId = '' } = useParams()
  const signal = useReturnSignal()
  const { handoff } = useVibingSession()
  const pushManagerMessage = useStore((s) => s.pushManagerMessage)
  const last = React.useRef(0)

  React.useEffect(() => {
    if (!signal || !handoff || signal === last.current) return
    last.current = signal
    const name = handoff.link.source
    const what = name === 'youtube' ? 'YouTube' : name === 'reels' ? 'Reels' : 'TikTok'
    pushManagerMessage(
      projectId,
      `${what} opened in a new tab. Come back whenever — your project is where you left it.`,
      'text',
    )
    closeHandoff()
  }, [signal, handoff, projectId, pushManagerMessage])

  return null
}

export const AppShell: React.FC = () => {
  const { pathname } = useLocation()
  const isCanvas = pathname.endsWith('/canvas')
  const hasProject = pathname.startsWith('/p/')
  const showRightPanel = !isCanvas && hasProject

  return (
    <div className="relative flex h-[100dvh] w-screen overflow-hidden bg-ink">
      <ManagerSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
          {showRightPanel && <PreviewPane />}
        </div>
      </div>
      <ReturnNotice />
    </div>
  )
}
