import React from 'react'
import { Dialog, ConfirmDialog } from './Dialog'

/**
 * The dialog implementation now lives in `ui/Dialog.tsx`, which adds the
 * focus trap, Escape handling, scroll lock, focus restoration, `role="dialog"`
 * and exit animation that this component never had.
 *
 * These re-exports keep every existing import site working; they are deleted
 * once Phase 6 repoints the tool surfaces at `ui/Dialog` directly.
 */
export { Dialog as Modal, ConfirmDialog }

