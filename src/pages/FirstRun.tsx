import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/store'
import { AccountMenu } from '../components/shell/AccountMenu'
import { Identity } from '../components/ui/Identity'
import { EmptyState } from '../components/ui/EmptyState'
import { cx } from '../components/ui/cx'

/**
 * Shown only when the user has no active projects. Deliberately NOT a project
 * list — the project list only ever exists inside the Manager conversation list.
 */
export const FirstRun: React.FC<{ inline?: boolean }> = ({ inline }) => {
  const navigate = useNavigate()
  const createProject = useStore((s) => s.createProject)
  const setManagerViewMode = useStore((s) => s.setManagerViewMode)

  const start = () => {
    const id = createProject()
    setManagerViewMode('conversations')
    navigate(`/p/${id}`)
  }

  return (
    <div className={cx('flex overflow-hidden bg-ink', inline ? 'h-full w-full' : 'h-screen w-screen')}>
      <div className="relative flex min-w-0 flex-1 items-center justify-center p-6">
        {!inline && (
          <div className="absolute right-4 top-4">
            <AccountMenu />
          </div>
        )}
        <EmptyState
          icon={<Identity size="lg" />}
          title="No projects yet"
          body="Start a conversation with The Manager and tell it what you want to build."
          actionLabel="New project"
          onAction={start}
        />
      </div>
    </div>
  )
}
