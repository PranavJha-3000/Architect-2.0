import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../../store/store'
import type { Manager } from '../../store/types'
import { cx } from '../ui/cx'
import { Plus } from 'lucide-react'
import { AddManagerModal } from './AddManagerModal'
import { Identity } from '../ui/Identity'

/**
 * COLUMN 0 — the identity rail, 64px.
 *
 * The Manager's face is the protagonist of this product, so it is the one
 * thing in the navigation that is allowed to be larger than its neighbours.
 * Everything else in the rail is deliberately quiet: 40px avatars, 12px
 * names, and a 2px indicator on the leading edge for the active Manager.
 *
 * The indicator is a physical selector rather than a ring. A ring competes
 * with the circle it surrounds — at 40px the eye reads "outlined avatar"
 * rather than "selected avatar", and the selection is lost the moment the
 * rail scrolls.
 */
export const ManagerRail: React.FC<{
  onManagerTriggerRef?: (id: string, el: HTMLButtonElement | null) => void
}> = ({ onManagerTriggerRef }) => {
  const managers = useStore((s) => s.managers)
  const activeManagerId = useStore((s) => s.activeManagerId)
  const setActiveManager = useStore((s) => s.setActiveManager)
  const setManagerViewMode = useStore((s) => s.setManagerViewMode)
  const projectDrawerOpen = useStore((s) => s.projectDrawerOpen)
  const setProjectDrawerOpen = useStore((s) => s.setProjectDrawerOpen)
  const toggleProjectDrawer = useStore((s) => s.toggleProjectDrawer)
  const [addOpen, setAddOpen] = useState(false)

  const onManagerClick = (id: string) => {
    setManagerViewMode('projects')
    if (activeManagerId === id) {
      toggleProjectDrawer()
    } else {
      setActiveManager(id)
      setProjectDrawerOpen(true)
    }
  }

  return (
    <>
      <nav
        aria-label="Managers"
        className="manager-rail flex h-full w-16 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-line bg-ink py-2 scrollbar-thin"
      >
        {managers.map((m) => (
          <RailAvatar
            key={m.id}
            manager={m}
            active={m.id === activeManagerId}
            drawerOpen={projectDrawerOpen && m.id === activeManagerId}
            onSelect={() => onManagerClick(m.id)}
            buttonRef={(el) => onManagerTriggerRef?.(m.id, el)}
          />
        ))}

        {managers.length > 0 && <div className="my-1 h-px w-6 bg-line" aria-hidden />}

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          title="Add Manager"
          aria-label="Add Manager"
          className="group flex w-14 shrink-0 flex-col items-center gap-1"
        >
          {/* A dashed border reads as "unfinished"; a plain circle matching the
              avatar geometry reads as an affordance. */}
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted transition-colors duration-instant ease-standard group-hover:bg-surface group-hover:text-paper">
            <Plus size={16} />
          </span>
          <span className="w-full truncate px-0.5 text-center text-[11px] leading-tight text-muted">
            Add
          </span>
        </button>
      </nav>

      <AddManagerModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  )
}

const RailAvatar: React.FC<{
  manager: Manager
  active: boolean
  drawerOpen: boolean
  onSelect: () => void
  buttonRef?: (el: HTMLButtonElement | null) => void
}> = ({ manager, active, drawerOpen, onSelect, buttonRef }) => {
  const label = manager.nickname || 'The Manager'
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onSelect}
      title={label}
      aria-label={`${label} — ${drawerOpen ? 'Close projects' : 'View projects'}`}
      aria-current={active ? 'true' : undefined}
      aria-haspopup="dialog"
      aria-expanded={drawerOpen}
      className="group relative flex w-14 shrink-0 flex-col items-center gap-1 rounded-sm py-0.5"
    >
      {/* Leading-edge indicator: 2px, animates its own opacity so switching
          Manager reads as a state change rather than a repaint. */}
      <span
        aria-hidden
        className={cx(
          'absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-accent',
          'transition-opacity duration-instant ease-standard',
          active ? 'opacity-100' : 'opacity-0',
        )}
      />

      <Identity
        managerId={manager.id}
        size="lg"
        className={cx(
          'transition-all duration-instant ease-standard',
          active && 'ring-1 ring-accent/50',
          !active && 'group-hover:bg-action/60',
        )}
      />

      <span
        className={cx(
          'w-full truncate px-0.5 text-center text-[11px] leading-tight transition-colors duration-instant ease-standard',
          active ? 'text-paper' : 'text-muted',
        )}
      >
        {label}
      </span>
    </button>
  )
}
