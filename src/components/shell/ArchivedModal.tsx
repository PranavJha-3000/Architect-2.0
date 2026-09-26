import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/store'
import { Modal, ConfirmDialog } from '../ui/Modal'
import { relStamp } from './Sidebar'
import { RotateCcw, Trash2 } from 'lucide-react'

/**
 * Archived projects, reached from the rail account menu. Extracted from the old
 * Conversations page, which no longer exists. Restore and Delete reuse the
 * existing store actions unchanged.
 */
export const ArchivedModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const navigate = useNavigate()
  const projects = useStore((s) => s.projects)
  const restoreProject = useStore((s) => s.restoreProject)
  const deleteProject = useStore((s) => s.deleteProject)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const archived = projects.filter((p) => p.archived)
  const target = projects.find((p) => p.id === confirmDelete)

  return (
    <>
      <Modal open={open} onClose={onClose} title="Archived" description="Archived conversations stay here and can be restored." width="max-w-md">
        {archived.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-muted">Nothing archived.</p>
        ) : (
          <div className="-mx-2 space-y-0.5">
            {archived.map((p) => (
              <div key={p.id} className="group flex items-center gap-2 rounded-[8px] px-2 py-1.5 transition-colors hover:bg-surface">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="truncate text-[13px] text-paper">{p.name}</span>
                    <span className="ml-auto shrink-0 text-[10px] text-muted">{relStamp(p.lastMessageAt)}</span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-muted">
                    <span className="text-muted/70">The Manager · </span>
                    {p.lastMessage || 'No messages yet'}
                  </p>
                </div>
                <button
                  onClick={() => { restoreProject(p.id); onClose(); navigate(`/p/${p.id}`) }}
                  title="Restore"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-bubble hover:text-paper"
                >
                  <RotateCcw size={13} />
                </button>
                <button
                  onClick={() => setConfirmDelete(p.id)}
                  title="Delete"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-bubble hover:text-paper"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {target && (
        <ConfirmDialog
          open
          onClose={() => setConfirmDelete(null)}
          title={`Delete “${target.name}”?`}
          body="This removes the conversation permanently."
          confirmLabel="Delete"
          onConfirm={() => { deleteProject(target.id); setConfirmDelete(null) }}
        />
      )}
    </>
  )
}
