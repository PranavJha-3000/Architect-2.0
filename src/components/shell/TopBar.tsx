import React from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../../store/store'
import { agentById } from '../../store/roster'
import type { ChannelId } from '../../store/types'
import { Identity } from '../ui/Identity'
import { AccountMenu } from './AccountMenu'
import { Popover, MenuItem } from '../ui/Popover'
import { StatusDot } from '../ui/StatusDot'
import { UiDemoVideoDialog } from '../canvas/UiDemoVideoDialog'
import { Code2, Rocket, Palette, ArrowLeft, Lock, MoreHorizontal } from 'lucide-react'
import { ASSETS } from '../../assets'

const GitHubToolIcon: React.FC = () => (
  <img src={ASSETS.icons.github} alt="" aria-hidden className="brand-icon h-4 w-4" />
)

const TOOLS: { to: string; label: string; icon: React.ReactNode }[] = [
  { to: 'canvas', label: 'UI Head', icon: <Palette size={16} /> },
  { to: 'code', label: 'Code', icon: <Code2 size={16} /> },
  { to: 'github', label: 'GitHub', icon: <GitHubToolIcon /> },
  { to: 'deploy', label: 'Deploy', icon: <Rocket size={16} /> },
]

/**
 * The conversation header: who you are talking to, plus the tools that sit
 * around the conversation.
 *
 * The four tool buttons previously had no active state at all — switching to
 * Code or GitHub left the bar looking exactly as it did in Manager chat, so
 * there was no way to see which surface you were in. They now carry
 * `aria-current` and a persistent fill.
 *
 * "Message privately" used to be a filled, bordered pill in the same row as
 * five ghost icon buttons, so it outweighed every other control. It is now one
 * item in an overflow menu, and all six controls carry equal weight.
 */
export const TopBar: React.FC<{ title?: string; subtitle?: string; onBack?: () => void }> = ({
  title, subtitle, onBack,
}) => {
  const { projectId = '' } = useParams()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  // Selectors return STABLE references. Returning a freshly-built array or
  // object from a Zustand selector makes `getSnapshot` report a change on
  // every render, which React resolves by looping until it throws
  // "Maximum update depth exceeded" — the whole app stops rendering.
  // So: select the raw slice, and derive below.
  const projects = useStore((s) => s.projects)
  const threads = useStore((s) => s.threads)
  const project = projectId ? projects.find((p) => p.id === projectId) : undefined
  const managerThread = threads[`${projectId}:manager`]

  const parts = pathname.split('/')
  const threadIdx = parts.indexOf('thread')
  const channelId = threadIdx === -1 ? null : parts[threadIdx + 1]
  const dmIdx = parts.indexOf('dm')
  const dmAgent = dmIdx === -1 ? null : parts[dmIdx + 1]
  const channelThread = channelId ? threads[`${projectId}:${channelId}`] : null
  const team = project?.team

  const name =
    title ??
    (dmAgent
      ? agentById(dmAgent).name
      : channelId && channelThread
        ? agentById(channelId).name
        : 'The Manager')
  const sub =
    subtitle ??
    (dmAgent
      ? 'Private · only you can see this'
      : channelId && channelThread
        ? 'Specialist · part of this team'
        : (project?.name ?? 'Project'))

  // A private DM is only offered to specialists the Manager has introduced.
  const canDm = !!dmAgent || (!!channelId && !!team && team.includes(channelId as ChannelId))
  const backTo = dmAgent ? `/p/${projectId}/thread/${dmAgent}` : `/p/${projectId}`
  const hasProject = !!project

  /** The tool matching the current route, if any. */
  const activeTool = TOOLS.find((t) => pathname.endsWith(`/${t.to}`))?.to ?? null

  /** UI Head teaser: pressing the UI Head button always shows the demo video first. */
  const [demoOpen, setDemoOpen] = React.useState(false)

  const handleToolClick = (to: string) => {
    if (!project) return
    if (to === 'canvas') {
      setDemoOpen(true)
      return
    }
    navigate(`/p/${project.id}/${to}`)
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-2.5 border-b border-line bg-ink px-3">
      {onBack || dmAgent ? (
        <button
          type="button"
          onClick={() => (onBack ? onBack() : navigate(backTo))}
          title={dmAgent ? 'Back to conversation' : 'Back'}
          aria-label={dmAgent ? 'Back to conversation' : 'Back'}
          className="coarse-hit flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-instant ease-standard hover:bg-surface hover:text-paper"
        >
          <ArrowLeft size={16} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => useStore.getState().toggleProjectDrawer()}
          title="Open projects"
          aria-label="Open projects"
          className="flex shrink-0 items-center rounded-full transition-transform duration-instant ease-standard active:scale-95"
        >
          <Identity managerId={project?.managerId} size="md" />
        </button>
      )}

      <div className="min-w-0">
        <h1 className="flex items-center gap-1.5 truncate text-label font-semibold text-paper">
          {name}
          <StatusDot
            active={!!managerThread?.typing}
            label={managerThread?.typing ? 'Manager is typing' : undefined}
          />
        </h1>
        <p className="truncate text-meta leading-tight text-muted">{sub}</p>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-0.5">
        {hasProject &&
          TOOLS.map((t) => {
            const active = activeTool === t.to
            return (
              <button
                key={t.to}
                type="button"
                title={t.label}
                aria-label={t.label}
                aria-current={active ? 'page' : undefined}
                onClick={() => handleToolClick(t.to)}
                className={
                  'coarse-hit flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-instant ease-standard ' +
                  (active
                    ? 'bg-surface text-paper'
                    : 'text-muted hover:bg-surface hover:text-paper')
                }
              >
                {t.icon}
              </button>
            )
          })}

        {/* Overflow: secondary conversation actions, weighted identically to the
            tools so nothing in this bar competes for attention. */}
        {hasProject && canDm && !dmAgent && channelId && (
          <Popover
            label="Conversation actions"
            trigger={(p) => (
              <button
                type="button"
                title="More actions"
                aria-label="More actions"
                {...p}
                className="coarse-hit flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors duration-instant ease-standard hover:bg-surface hover:text-paper"
              >
                <MoreHorizontal size={16} />
              </button>
            )}
          >
            <MenuItem
              icon={<Lock size={14} />}
              label="Message privately"
              onClick={() => navigate(`/p/${projectId}/dm/${channelId}`)}
            />
          </Popover>
        )}

        <div className="ml-0.5">
          <AccountMenu />
        </div>
      </div>

      {hasProject && project && (
        <UiDemoVideoDialog
          open={demoOpen}
          onClose={() => setDemoOpen(false)}
          onOpenCanvas={() => {
            setDemoOpen(false)
            navigate(`/p/${project.id}/canvas`)
          }}
        />
      )}
    </header>
  )
}
