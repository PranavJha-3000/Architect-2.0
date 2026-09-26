import React from 'react'
import { useParams } from 'react-router-dom'
import { useStore } from '../../store/store'
import { cx } from './cx'

/**
 * IDENTITY — the one component that renders a Manager's face.
 *
 * Previously eight files imported `ManagerAvatar` from a layout module, and
 * that component only ever drew an initial letter — so a Manager whose avatar
 * was uploaded in onboarding showed their photo in the rail but a bare letter
 * in the chat header and in every message bubble. One component now always
 * renders the image when one exists, with a single initials fallback.
 *
 * Resolution order is explicit and shallow:
 *   explicit managerId → the project's owning Manager → the active Manager
 *   → the onboarding draft (so the workspace is coherent before setup ends).
 */

export type IdentitySize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/** One ladder for every avatar in the product. */
const SIZES: Record<IdentitySize, { box: string; text: string }> = {
  xs: { box: 'h-6 w-6', text: 'text-[9px]' },
  sm: { box: 'h-7 w-7', text: 'text-[10px]' },
  md: { box: 'h-8 w-8', text: 'text-[11px]' },
  lg: { box: 'h-10 w-10', text: 'text-[12px]' },
  xl: { box: 'h-12 w-12', text: 'text-[14px]' },
}

/** Agent initials are a different token size, so they get their own ladder. */
const AGENT_SIZES: Record<IdentitySize, string> = {
  xs: 'h-6 w-6 text-[9px]',
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-8 w-8 text-[11px]',
  lg: 'h-10 w-10 text-[12px]',
  xl: 'h-12 w-12 text-[14px]',
}

const initials = (name: string) => (name.trim()[0] ?? 'M').toUpperCase()

export const Identity: React.FC<{
  /** Resolves the project owner when omitted. */
  managerId?: string
  size?: IdentitySize
  /** Overrides the derived name — used for aria labels. */
  name?: string
  className?: string
}> = ({ managerId, size = 'md', name, className }) => {
  const { projectId = '' } = useParams()
  const onboarding = useStore((s) => s.onboarding)
  const managers = useStore((s) => s.managers)
  const activeManagerId = useStore((s) => s.activeManagerId)
  const projectOwnerId = useStore((s) => s.projects.find((p) => p.id === projectId)?.managerId)

  const ownerId = managerId ?? projectOwnerId
  const owner = ownerId ? managers.find((m) => m.id === ownerId) : undefined
  const active = activeManagerId ? managers.find((m) => m.id === activeManagerId) : undefined

  const avatar = owner?.avatar || (!ownerId ? active?.avatar : undefined) || onboarding.managerAvatar
  const label =
    name ||
    owner?.nickname ||
    (!ownerId ? active?.nickname : undefined) ||
    onboarding.managerNickname ||
    'The Manager'

  const { box, text } = SIZES[size]

  return (
    <span
      className={cx(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-action',
        box,
        text,
        className,
      )}
    >
      {avatar ? (
        <img
          src={avatar}
          alt=""
          aria-hidden
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <span className="font-semibold text-paper" aria-hidden>
          {initials(label)}
        </span>
      )}
    </span>
  )
}

/**
 * SPECIALIST IDENTITY — the agent counterpart. Agents have no uploaded photo,
 * so this is always initials on the control colour. Keeping it separate from
 * `Identity` means the two can never drift apart in sizing.
 */
export const SpecialistIdentity: React.FC<{
  name: string
  size?: IdentitySize
  className?: string
}> = ({ name, size = 'sm', className }) => (
  <span
    aria-hidden
    className={cx(
      'flex shrink-0 items-center justify-center rounded-full bg-action font-semibold text-paper',
      AGENT_SIZES[size],
      className,
    )}
  >
    {name.slice(0, 2).toUpperCase()}
  </span>
)
