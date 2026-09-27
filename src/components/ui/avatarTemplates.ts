/**
 * AVATAR TEMPLATES — the colour system behind a Manager's fallback PFP.
 *
 * A Manager without an uploaded photo used to render as the same grey
 * initial everywhere: every identity read as a placeholder, and there was
 * no way to tell Managers apart at a glance. A template replaces that grey
 * disc with a gradient, resolved in two steps:
 *
 *   1. an explicit template id chosen at creation time (stored on the
 *      Manager, or on the onboarding draft), else
 *   2. a deterministic pick hashed from the Manager's id — so existing
 *      Managers get a stable, unique colour with no persisted migration.
 *
 * An uploaded photo always wins over the template.
 */
export interface AvatarTemplate {
  id: string
  from: string
  to: string
}

export const AVATAR_TEMPLATES: AvatarTemplate[] = [
  { id: 'violet', from: '#7c3aed', to: '#ec4899' },
  { id: 'ocean', from: '#2563eb', to: '#06b6d4' },
  { id: 'ember', from: '#ea580c', to: '#f43f5e' },
  { id: 'forest', from: '#059669', to: '#14b8a6' },
  { id: 'sunrise', from: '#d97706', to: '#dc2626' },
  { id: 'indigo', from: '#4f46e5', to: '#8b5cf6' },
  { id: 'lagoon', from: '#0891b2', to: '#3b82f6' },
  { id: 'candy', from: '#db2777', to: '#f97316' },
]

/** FNV-1a — tiny, stable across sessions, good spread over 8 buckets. */
const hash = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

export const templateById = (id?: string) => AVATAR_TEMPLATES.find((t) => t.id === id)

/** Always returns a template: an explicit id wins, else hash the fallback key. */
export const resolveAvatarTemplate = (
  id: string | undefined,
  fallbackKey: string,
): AvatarTemplate =>
  templateById(id) ??
  AVATAR_TEMPLATES[hash(fallbackKey || 'manager') % AVATAR_TEMPLATES.length]

/** CSS gradient for a template. */
export const templateGradient = (t: AvatarTemplate) =>
  `linear-gradient(135deg, ${t.from}, ${t.to})`
