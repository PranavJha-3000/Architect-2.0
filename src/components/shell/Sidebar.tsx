import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../../store/store'
import { agentById } from '../../store/roster'
import { cx } from '../ui/cx'
import { Row, UnreadDot } from '../ui/Row'
import { Identity, SpecialistIdentity } from '../ui/Identity'
import { SectionLabel } from '../ui/Surface'
import { Popover, MenuItem } from '../ui/Popover'
import { Search, Pin, PinOff, Plus, Archive, MoreHorizontal, ArrowLeft } from 'lucide-react'

/**
 * COLUMN 1 — the project / conversation drawer, 288px.
 *
 * Previously this file held two entirely separate list implementations that
 * shared nothing but CSS: project rows were 3 lines at `py-1.5`, conversation
 * rows were 2 lines at `py-2`. Sibling rows of different heights inside one
 * scroll container is one of the clearest signs of a product assembled rather
 * than designed.
 *
 * Both are now the same `Row` primitive at a single 56px, so a project's
 * conversations line up with the project's own row no matter which list you
 * are looking at.
 */

/** iMessage-style "now" / "2m" / "3h" / "2d" stamps. */
export const relStamp = (ts: number) => {
  const d = Date.now() - ts
  if (d < 60000) return 'now'
  if (d < 3600000) return `${Math.floor(d / 60000)}m`
  if (d < 86400000) return `${Math.floor(d / 3600000)}h`
  if (d < 604800000) return `${Math.floor(d / 86400000)}d`
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/* ---------- Drawer header: back affordance + Manager identity ---------- */
export interface DrawerHeaderProps {
  title: string
  sub: string
  showBack: boolean
  backTitle: string
  onBack: () => void
}

export const DrawerHeader: React.FC<DrawerHeaderProps> = ({
  title,
  sub,
  showBack,
  backTitle,
  onBack,
}) => (
  <div className="flex items-center gap-2 px-3 pb-2 pt-3">
    {showBack ? (
      <button
        type="button"
        onClick={onBack}
        title={backTitle}
        aria-label={backTitle}
        className="coarse-hit flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-instant ease-standard hover:bg-surface hover:text-paper"
      >
        <ArrowLeft size={16} />
      </button>
    ) : (
      <Identity size="sm" />
    )}
    <div className="min-w-0 flex-1">
      <h2 className="truncate text-label font-semibold text-paper">{title}</h2>
      <p className="truncate text-meta leading-tight text-muted">{sub}</p>
    </div>
  </div>
)

export const ProjectDrawer: React.FC<{
  open?: boolean
  onClose?: () => void
  restoreFocusRef?: React.RefObject<HTMLElement | null>
}> = ({ open: propOpen, onClose: propOnClose, restoreFocusRef }) => {
  const { projectId = '' } = useParams()
  const navigate = useNavigate()
  const projects = useStore((s) => s.projects)
  const managers = useStore((s) => s.managers)
  const activeManagerId = useStore((s) => s.activeManagerId)
  const threads = useStore((s) => s.threads)
  const storeOpen = useStore((s) => s.projectDrawerOpen)
  const setStoreOpen = useStore((s) => s.setProjectDrawerOpen)
  const togglePin = useStore((s) => s.togglePin)
  const archiveProject = useStore((s) => s.archiveProject)
  const createProject = useStore((s) => s.createProject)
  const restoreProject = useStore((s) => s.restoreProject)
  const pushToast = useStore((s) => s.pushToast)
  const [query, setQuery] = useState('')
  const [leaving, setLeaving] = useState(false)
  const panelRef = React.useRef<HTMLDivElement>(null)

  const isOpen = propOpen ?? storeOpen
  const close = React.useCallback(() => {
    setLeaving(true)
    window.setTimeout(() => {
      setLeaving(false)
      if (propOnClose) propOnClose()
      else setStoreOpen(false)
      restoreFocusRef?.current?.focus()
    }, 140)
  }, [propOnClose, setStoreOpen, restoreFocusRef])

  React.useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        close()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
    }
  }, [isOpen, close])

  const newProject = () => {
    const id = createProject()
    close()
    navigate(`/p/${id}`)
  }

  /** The drawer only ever lists the ACTIVE Manager's projects. */
  const managerProjects = useMemo(
    () => projects.filter((p) => !p.archived && (!p.managerId || p.managerId === activeManagerId)),
    [projects, activeManagerId],
  )
  const manager = managers.find((m) => m.id === activeManagerId)
  const managerName = manager?.nickname || 'The Manager'
  const managerSub = manager?.nickname ? 'The Manager' : 'Projects'

  const q = query.trim().toLowerCase()
  const visibleProjects = useMemo(
    () =>
      managerProjects
        .filter((p) => !q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
        .sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || b.lastMessageAt - a.lastMessageAt),
    [managerProjects, q],
  )
  const pinnedProjects = visibleProjects.filter((p) => p.pinned)
  const restProjects = visibleProjects.filter((p) => !p.pinned)

  const selectProject = (id: string) => {
    setQuery('')
    close()
    navigate(`/p/${id}`)
    window.setTimeout(() => {
      document.querySelector<HTMLTextAreaElement>('[data-chat-composer]')?.focus()
    }, 60)
  }

  const doArchive = (p: { id: string; name: string }) => {
    archiveProject(p.id)
    if (p.id === projectId) navigate('/')
    pushToast(`Archived “${p.name}”`, {
      label: 'Undo',
      run: () => restoreProject(p.id),
    })
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${managerName}'s Projects`}
      className="fixed inset-0 z-40 flex"
    >
      <div
        className="fixed inset-0 bg-ink/60 transition-opacity duration-instant"
        onClick={close}
        aria-hidden
      />

      <aside
        ref={panelRef}
        className={cx(
          'relative z-10 ml-16 flex h-full w-72 shrink-0 flex-col border-r border-line bg-sidebar shadow-none',
          leaving ? 'animate-sheet-out' : 'animate-sheet-in',
        )}
      >
        <DrawerHeader
          title={managerName}
          sub={managerSub}
          showBack={true}
          backTitle="Close projects"
          onBack={close}
        />

        <div className="flex flex-col gap-2 px-3 pb-2">
          <button
            type="button"
            onClick={newProject}
            className="flex h-8 w-full items-center justify-center gap-1.5 rounded-sm border border-line bg-surface text-label font-medium text-paper transition-colors duration-instant ease-standard hover:bg-bubble"
          >
            <Plus size={14} /> New project
          </button>
          {/* A search field is a field, not a second button. Previously this and
              "New project" were two stacked bordered boxes competing equally. */}
          <div className="flex h-8 items-center gap-2 rounded-sm bg-surface px-2.5">
            <Search size={13} className="shrink-0 text-muted" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects"
              aria-label="Search projects"
              className="min-w-0 flex-1 bg-transparent text-label text-paper placeholder:text-faint focus:outline-none"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-2 pb-2">
          {pinnedProjects.length > 0 && (
            <>
              <SectionLabel>Pinned</SectionLabel>
              <div className="space-y-0.5">
                {pinnedProjects.map((p) => (
                  <ProjectRow
                    key={p.id}
                    p={p}
                    active={p.id === projectId}
                    unread={threads[p.id + ':manager']?.unread ?? 0}
                    onOpen={() => selectProject(p.id)}
                    onTogglePin={() => togglePin(p.id)}
                    onArchive={() => doArchive(p)}
                  />
                ))}
              </div>
            </>
          )}
          {restProjects.length > 0 && (
            <>
              <SectionLabel className={cx(pinnedProjects.length > 0 && 'mt-2')}>
                Projects
              </SectionLabel>
              <div className="space-y-0.5">
                {restProjects.map((p) => (
                  <ProjectRow
                    key={p.id}
                    p={p}
                    active={p.id === projectId}
                    unread={threads[p.id + ':manager']?.unread ?? 0}
                    onOpen={() => selectProject(p.id)}
                    onTogglePin={() => togglePin(p.id)}
                    onArchive={() => doArchive(p)}
                  />
                ))}
              </div>
            </>
          )}
          {visibleProjects.length === 0 && (
            <p className="px-2 py-6 text-center text-meta leading-relaxed text-muted">
              {q ? 'No projects match that search.' : 'No projects yet.'}
            </p>
          )}
        </div>
      </aside>
    </div>
  )
}


export const ProjectConversationList: React.FC = () => {
  const { projectId = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const managers = useStore((s) => s.managers)
  const activeManagerId = useStore((s) => s.activeManagerId)
  const projects = useStore((s) => s.projects)
  const threads = useStore((s) => s.threads)
  const setManagerViewMode = useStore((s) => s.setManagerViewMode)

  const currentProject = projects.find(
    (p) => p.id === projectId && !p.archived && (!p.managerId || p.managerId === activeManagerId),
  )
  if (!currentProject) return null

  const pathname = location.pathname
  const isManagerChat = pathname === `/p/${projectId}`
  const threadParts = pathname.split('/thread/')
  const activeChannelId = threadParts.length > 1 ? threadParts[1] : null

  const manager = managers.find((m) => m.id === activeManagerId)
  const managerName = manager?.nickname || 'The Manager'
  const managerSub = manager?.nickname ? 'The Manager' : currentProject.name
  const managerThread = threads[`${projectId}:manager`]
  const unreadManager = managerThread?.unread ?? 0
  const team = currentProject.team || []

  return (
    <aside className="project-drawer flex h-full w-72 shrink-0 flex-col border-r border-line bg-sidebar">
      <DrawerHeader
        title={managerName}
        sub={managerSub}
        showBack
        backTitle="Back to projects"
        onBack={() => setManagerViewMode('projects')}
      />

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-2 pb-2">
        {/* The Manager conversation and the specialists are the same kind of
            thing: a conversation. They now share one row geometry. */}
        <div className="space-y-0.5">
          <Row
            active={isManagerChat}
            onClick={() => navigate(`/p/${projectId}`)}
            leading={<Identity size="sm" />}
            title={currentProject.name}
            preview={
              <>
                <span className="text-faint">The Manager · </span>
                {currentProject.lastMessage || managerThread?.lastPreview || 'No messages yet'}
              </>
            }
            trailing={
              <>
                <span className="tabular text-[11px] text-muted">
                  {relStamp(currentProject.lastMessageAt)}
                </span>
                {unreadManager > 0 && <UnreadDot />}
              </>
            }
            ariaLabel={`Manager conversation for ${currentProject.name}`}
          />
        </div>

        {team.length > 0 && (
          <div className="mt-0.5 space-y-0.5">
            {team.map((ch) => {
              const ag = agentById(ch)
              const chThread = threads[`${projectId}:${ch}`]
              const unread = chThread?.unread ?? 0
              const last = chThread?.messages[chThread.messages.length - 1]

              return (
                <Row
                  key={ch}
                  active={activeChannelId === ch}
                  onClick={() => navigate(`/p/${projectId}/thread/${ch}`)}
                  leading={<SpecialistIdentity name={ag.name} size="sm" />}
                  title={ag.name}
                  preview={chThread?.lastPreview || ag.role}
                  trailing={
                    <>
                      {last && (
                        <span className="tabular text-[11px] text-muted">{relStamp(last.ts)}</span>
                      )}
                      {unread > 0 && <UnreadDot />}
                    </>
                  }
                  ariaLabel={`${ag.name} conversation`}
                />
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}

/**
 * PROJECT ROW — the same `Row` primitive as the conversation list.
 *
 * The third description line is gone: it sat at 55% opacity, below the
 * legibility floor, and competed with the message preview directly above it.
 * The pin control and the overflow menu are now genuinely keyboard reachable —
 * previously the overflow button was `opacity-0` until hover, so it was
 * focusable but invisible while focused.
 */
const ProjectRow: React.FC<{
  p: any
  active: boolean
  unread: number
  onOpen: () => void
  onTogglePin: () => void
  onArchive: () => void
}> = ({ p, active, unread, onOpen, onTogglePin, onArchive }) => (
  <Row
    active={active}
    onClick={onOpen}
    leading={<Identity size="sm" />}
    title={
      <span className="flex items-center gap-1.5">
        <span className="truncate">{p.name}</span>
        {p.pinned && <Pin size={11} className="shrink-0 text-muted" aria-label="Pinned" />}
      </span>
    }
    preview={
      <>
        <span className="text-faint">The Manager · </span>
        {p.lastMessage || 'No messages yet'}
      </>
    }
    trailing={
      <>
        <span className="tabular text-[11px] text-muted">{relStamp(p.lastMessageAt)}</span>
        {unread > 0 && <UnreadDot />}
      </>
    }
    actions={
      <Popover
        label={`${p.name} actions`}
        trigger={(props) => (
          <button
            type="button"
            title="Project actions"
            aria-label={`Actions for ${p.name}`}
            {...props}
            onContextMenu={(e) => {
              e.preventDefault()
              props.onClick()
            }}
            className="coarse-hit flex h-6 w-6 items-center justify-center rounded-full text-muted transition-colors duration-instant ease-standard hover:bg-bubble hover:text-paper"
          >
            <MoreHorizontal size={14} />
          </button>
        )}
      >
        <MenuItem
          icon={p.pinned ? <PinOff size={14} /> : <Pin size={14} />}
          label={p.pinned ? 'Unpin' : 'Pin'}
          onClick={onTogglePin}
        />
        <MenuItem icon={<Archive size={14} />} label="Archive" onClick={onArchive} />
      </Popover>
    }
    ariaLabel={p.name}
  />
)

