import React from 'react'
import { useStore } from '../../store/store'
import { ImportWizard } from '../import/ImportWizard'
import { ArchivedModal } from './ArchivedModal'
import { Popover, MenuItem } from '../ui/Popover'
import { FolderInput, Archive, LogOut } from 'lucide-react'

/**
 * Account menu — the last of the three bespoke menu implementations, now on
 * the shared `Popover`, so it gains Escape handling, arrow-key navigation,
 * focus restoration and an exit animation.
 *
 * The avatar previously used `hover:opacity-90`, an opacity change in a
 * product where every other control changes its background value. It is now
 * the standard control-fill hover.
 */
export const AccountMenu: React.FC = () => {
  const user = useStore((s) => s.user)
  const signOut = useStore((s) => s.signOut)
  const [importOpen, setImportOpen] = React.useState(false)
  const [archivedOpen, setArchivedOpen] = React.useState(false)

  const label = user?.name || user?.email || 'Account'

  return (
    <>
      <Popover
        label="Account"
        trigger={(p) => (
          <button
            type="button"
            title={label}
            aria-label={label}
            {...p}
            className="coarse-hit flex h-8 w-8 items-center justify-center rounded-full bg-action text-label font-semibold text-paper transition-colors duration-instant ease-standard hover:bg-bubble"
          >
            {(user?.name || user?.email || 'U').slice(0, 1).toUpperCase()}
          </button>
        )}
      >
        <MenuItem
          icon={<FolderInput size={14} />}
          label="Import project"
          onClick={() => setImportOpen(true)}
        />
        <MenuItem
          icon={<Archive size={14} />}
          label="Archived"
          onClick={() => setArchivedOpen(true)}
        />
        <MenuItem icon={<LogOut size={14} />} label="Sign out" onClick={() => signOut()} />
      </Popover>

      {importOpen && <ImportWizard open={importOpen} onClose={() => setImportOpen(false)} />}
      {archivedOpen && <ArchivedModal open={archivedOpen} onClose={() => setArchivedOpen(false)} />}
    </>
  )
}
