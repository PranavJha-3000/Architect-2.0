import React from 'react'
import { useParams } from 'react-router-dom'
import { useStore } from '../../store/store'
import { cx } from './cx'
import { AVATAR_TEMPLATES, resolveAvatarTemplate, templateGradient } from './avatarTemplates'
import { Shuffle } from 'lucide-react'

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
  // The onboarding draft is consulted only BEFORE setup ends (no Manager yet);
  // once Managers exist, a missing field resolves locally — never to another
  // Manager's photo, template or nickname.
  const draft = !owner && !active

  const avatar =
    owner?.avatar ||
    (!ownerId ? active?.avatar : undefined) ||
    (draft ? onboarding.managerAvatar : undefined)
  const templateId =
    owner?.templateId ??
    (!ownerId ? active?.templateId : undefined) ??
    (draft ? onboarding.managerTemplate : undefined)
  const label =
    name ||
    owner?.nickname ||
    (!ownerId ? active?.nickname : undefined) ||
    (draft ? onboarding.managerNickname : undefined) ||
    'The Manager'

  const { box, text } = SIZES[size]

  // No uploaded photo → a gradient template, keyed by the same resolution
  // order as the avatar so a Manager's colour is stable across sessions
  // without any persisted migration.
  const template = avatar
    ? null
    : resolveAvatarTemplate(templateId, ownerId || activeManagerId || 'onboarding')

  return (
    <span
      className={cx(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        box,
        text,
        className,
      )}
      style={template ? { background: templateGradient(template) } : undefined}
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
        <span className="font-semibold text-white" aria-hidden>
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

/**
 * TEMPLATE PICKER — the Manager PFP chooser.
 *
 * "Auto" keeps the deterministic hash, so every Manager gets a different
 * colour for free; the swatches pin an explicit choice. An uploaded photo
 * always wins over the template, so picking a colour never blocks upload.
 */
export const AvatarTemplatePicker: React.FC<{
  value: string
  onChange: (id: string) => void
  className?: string
}> = ({ value, onChange, className }) => (
  <div className={cx('flex flex-col items-center gap-2', className)}>
    <p className="text-[11px] font-medium uppercase tracking-wider text-muted">PFP template</p>
    <div className="flex flex-wrap justify-center gap-2" role="radiogroup" aria-label="PFP template">
      <button
        type="button"
        role="radio"
        aria-checked={value === ''}
        aria-label="Auto colour"
        title="Auto — a unique colour per Manager"
        onClick={() => onChange('')}
        className={cx(
          'flex h-7 w-7 items-center justify-center rounded-full border transition-colors duration-instant ease-standard',
          value === ''
            ? 'border-accent text-paper'
            : 'border-line bg-surface text-muted hover:text-paper',
        )}
      >
        <Shuffle size={12} aria-hidden />
      </button>
      {AVATAR_TEMPLATES.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={value === t.id}
          aria-label={`${t.id} template`}
          title={t.id}
          onClick={() => onChange(t.id)}
          className={cx(
            'h-7 w-7 rounded-full transition-transform duration-instant ease-standard hover:scale-110',
            value === t.id ? 'ring-2 ring-accent ring-offset-2 ring-offset-ink' : 'ring-1 ring-line',
          )}
          style={{ background: templateGradient(t) }}
        />
      ))}
    </div>
  </div>
)
