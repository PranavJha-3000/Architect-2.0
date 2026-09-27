import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../../store/store'
import { cx } from '../ui/cx'
import { Row, UnreadDot } from '../ui/Row'
import { Identity } from '../ui/Identity'
import { SectionLabel } from '../ui/Surface'
import { Popover, MenuItem } from '../ui/Popover'
import { Search, Pin, PinOff, Plus, Archive, MoreHorizontal, ChevronDown } from 'lucide-react'
import { AddManagerModal } from './AddManagerModal'
import type { Manager, Project } from '../../store/types'

/**
 * COLUMN 0 — the Manager sidebar, 288px.
 *
 * One sidebar owns search, the Manager list and each Manager's projects.
 * It replaces the old pair of a 64px icon rail plus an overlay drawer —
 * two separate surfaces for what is one navigation decision.
 *
 * The interaction mirrors Telegram topics: clicking a Manager expands its
 * project list inline, and the row itself shrinks to just the PFP while
 * expanded (the list carries the context, labelled by the Manager name).
 * Clicking the PFP collapses the section again.
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

/** Legacy rows may have no managerId — they belong to the active Manager. */
const ownsProject = (p: Project, m: Manager, activeManagerId: string) =>
  p.managerId ? p.managerId === m.id : m.id === activeManagerId

export const ManagerSidebar: React.FC = () => {
  const { projectId = '' } = useParams()
  const navigate = useNavigate()
  const projects = useStore((s) => s.projects)
  const managers = useStore((s) => s.managers)
  const threads = useStore((s) => s.threads)
  const activeManagerId = useStore((s) => s.activeManagerId)
  const expandedManagerId = useStore((s) => s.expandedManagerId)
  const setExpandedManagerId = useStore((s) => s.setExpandedManagerId)
  const setActiveManager = useStore((s) => s.setActiveManager)
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const setSidebarOpen = useStore((s) => s.setSidebarOpen)
  const togglePin = useStore((s) => s.togglePin)
  const archiveProject = useStore((s) => s.archiveProject)
  const createProject = useStore((s) => s.createProject)
  const restoreProject = useStore((s) => s.restoreProject)
  const pushToast = useStore((s) => s.pushToast)
  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  // Switching Manager always opens its section — the same one-click flow as
  // tapping a Telegram group. A manual collapse (null) survives until the
  // next switch, so collapsing does not immediately fight this effect.
  useEffect(() => {
    if (activeManagerId) setExpandedManagerId(activeManagerId)
  }, [activeManagerId, setExpandedManagerId])

  const q = query.trim().toLowerCase()

  /** Flat cross-Manager results while a query is active. */
  const searchHits = useMemo(() => {
    if (!q) return null
    const managerHits = managers.filter((m) =>
      (m.nickname || 'the manager').toLowerCase().includes(q),
    )
    const projectHits = projects.filter(
      (p) =>
        !p.archived &&
        (p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)),
    )
    return { managerHits, projectHits }
  }, [q, managers, projects])

  const openProject = (p: Project) => {
    setQuery('')
    if (p.managerId && p.managerId !== activeManagerId) setActiveManager(p.managerId)
    setExpandedManagerId(p.managerId || activeManagerId)
    setSidebarOpen(false)
    navigate(`/p/${p.id}`)
    window.setTimeout(() => {
      document.querySelector<HTMLTextAreaElement>('[data-chat-composer]')?.focus()
    }, 60)
  }

  /** One section open at a time; clicking the open one collapses it. */
  const toggleManager = (m: Manager) => {
    if (expandedManagerId === m.id) {
      setExpandedManagerId(null)
      return
    }
    if (m.id !== activeManagerId) setActiveManager(m.id)
    setExpandedManagerId(m.id)
  }

  const newProject = () => {
    const id = createProject()
    setSidebarOpen(false)
    navigate(`/p/${id}`)
  }

  const doArchive = (p: Project) => {
    archiveProject(p.id)
    if (p.id === projectId) navigate('/home')
    pushToast(`Archived “${p.name}”`, {
      label: 'Undo',
      run: () => restoreProject(p.id),
    })
  }

  const projectRow = (p: Project) => (
    <ProjectRow
      key={p.id}
      p={p}
      active={p.id === projectId}
      unread={threads[`${p.id}:manager`]?.unread ?? 0}
      onOpen={() => openProject(p)}
      onTogglePin={() => togglePin(p.id)}
      onArchive={() => doArchive(p)}
    />
  )

  /** One Manager = one accordion section: row when closed, PFP when open. */
  const renderManagerSection = (m: Manager) => {
    const mine = projects
      .filter((p) => !p.archived && ownsProject(p, m, activeManagerId))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.lastMessageAt - a.lastMessageAt)
    const unread = mine.reduce((n, p) => n + (threads[`${p.id}:manager`]?.unread ?? 0), 0)
    const latest = mine[0]
    const label = m.nickname || 'The Manager'
    const expanded = expandedManagerId === m.id
    const pinned = mine.filter((p) => p.pinned)
    const rest = mine.filter((p) => !p.pinned)

    return (
      <div key={m.id} className="mb-1">
        {expanded ? (
          /* Expanded: the row shrinks to the PFP — the list below is the
             context now, so a full name row would only duplicate it. */
          <button
            type="button"
            onClick={() => setExpandedManagerId(null)}
            aria-label={`Collapse ${label}`}
            aria-expanded="true"
            title={label}
            className="coarse-hit flex h-9 w-full items-center rounded-sm px-1 transition-colors duration-instant ease-standard hover:bg-surface/60"
          >
            <Identity managerId={m.id} size="md" className="ring-1 ring-accent/50" />
            <ChevronDown size={14} className="ml-auto text-muted" aria-hidden />
          </button>
        ) : (
          <Row
            active={m.id === activeManagerId}
            onClick={() => toggleManager(m)}
            leading={<Identity managerId={m.id} size="md" />}
            title={label}
            preview={latest ? latest.name : 'No projects yet'}
            trailing={
              <>
                {latest && (
                  <span className="tabular text-[11px] text-muted">
                    {relStamp(latest.lastMessageAt)}
                  </span>
                )}
                {unread > 0 && <UnreadDot />}
                <ChevronDown size={14} className="text-muted" aria-hidden />
              </>
            }
            ariaLabel={`${label} — show projects`}
          />
        )}

        {expanded && (
          <div className="motion-safe:animate-rise pb-1">
            <SectionLabel>{label}</SectionLabel>
            <div className="space-y-0.5">
              {pinned.map((p) => projectRow(p))}
              {rest.map((p) => projectRow(p))}
            </div>
            {mine.length === 0 && (
              <p className="px-2.5 py-3 text-center text-meta leading-relaxed text-muted">
                No projects yet.
              </p>
            )}
            <button
              type="button"
              onClick={newProject}
              className="mt-1 flex h-8 w-full items-center justify-center gap-1.5 rounded-sm border border-line bg-surface text-label font-medium text-paper transition-colors duration-instant ease-standard hover:bg-bubble"
            >
              <Plus size={14} /> New project
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Mobile scrim — the sidebar is an overlay below the lg breakpoint
          and a docked column above it (see `.manager-sidebar` in index.css
          plus the `lg:` overrides below). */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/60 transition-opacity duration-instant lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <aside
        aria-label="Managers"
        className={cx(
          'manager-sidebar absolute inset-y-0 left-0 z-40 flex h-full w-72 shrink-0 flex-col border-r border-line bg-sidebar',
          'transition-transform duration-enter ease-standard',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:static lg:z-auto lg:translate-x-0',
        )}
      >
        {/* Search + add: one field, one action — Grok's sidebar header. */}
        <div className="flex items-center gap-2 px-3 pb-2 pt-3">
          <div className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-sm bg-surface px-2.5">
            <Search size={13} className="shrink-0 text-muted" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search managers and projects"
              className="min-w-0 flex-1 bg-transparent text-label text-paper placeholder:text-faint focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            title="Add Manager"
            aria-label="Add Manager"
            className="coarse-hit flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-colors duration-instant ease-standard hover:bg-surface hover:text-paper"
          >
            <Plus size={15} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-2 pb-2">
          {searchHits ? (
            <>
              {searchHits.managerHits.length === 0 && searchHits.projectHits.length === 0 && (
                <p className="px-2 py-6 text-center text-meta leading-relaxed text-muted">
                  No matches.
                </p>
              )}
              {searchHits.managerHits.length > 0 && (
                <>
                  <SectionLabel>Managers</SectionLabel>
                  <div className="space-y-0.5">
                    {searchHits.managerHits.map((m) => (
                      <Row
                        key={m.id}
                        onClick={() => {
                          setQuery('')
                          toggleManager(m)
                        }}
                        leading={<Identity managerId={m.id} size="md" />}
                        title={m.nickname || 'The Manager'}
                        preview="Manager"
                        ariaLabel={`${m.nickname || 'The Manager'} — show projects`}
                      />
                    ))}
                  </div>
                </>
              )}
              {searchHits.projectHits.length > 0 && (
                <>
                  <SectionLabel className={searchHits.managerHits.length ? 'mt-2' : undefined}>
                    Projects
                  </SectionLabel>
                  <div className="space-y-0.5">
                    {searchHits.projectHits.map((p) => {
                      const ownerName =
                        managers.find((m) => m.id === p.managerId)?.nickname || 'The Manager'
                      return (
                        <Row
                          key={p.id}
                          active={p.id === projectId}
                          onClick={() => openProject(p)}
                          leading={<Identity managerId={p.managerId} size="sm" />}
                          title={p.name}
                          preview={
                            <>
                              <span className="text-faint">{ownerName} · </span>
                              {p.lastMessage || p.description || 'No messages yet'}
                            </>
                          }
                          trailing={
                            <span className="tabular text-[11px] text-muted">
                              {relStamp(p.lastMessageAt)}
                            </span>
                          }
                          ariaLabel={p.name}
                        />
                      )
                    })}
                  </div>
                </>
              )}
            </>
          ) : managers.length === 0 ? (
            <p className="px-2 py-6 text-center text-meta leading-relaxed text-muted">
              No Managers yet — use + to add one.
            </p>
          ) : (
            managers.map((m) => renderManagerSection(m))
          )}
        </div>
      </aside>

      <AddManagerModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  )
}

/**
 * PROJECT ROW — the same `Row` primitive as every other list.
 *
 * Pin and overflow actions are genuinely keyboard reachable: they sit
 * outside the row button (so they don't trigger navigation) and become
 * visible on `focus-within` as well as hover.
 */
const ProjectRow: React.FC<{
  p: Project
  active: boolean
  unread: number
  onOpen: () => void
  onTogglePin: () => void
  onArchive: () => void
}> = ({ p, active, unread, onOpen, onTogglePin, onArchive }) => (
  <Row
    active={active}
    onClick={onOpen}
    leading={<Identity managerId={p.managerId} size="sm" />}
    title={
      <span className="flex items-center gap-1.5">
        <span className="truncate">{p.name}</span>
        {p.pinned && <Pin size={11} className="shrink-0 text-muted" aria-label="Pinned" />}
      </span>
    }
    preview={p.lastMessage || 'No messages yet'}
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

