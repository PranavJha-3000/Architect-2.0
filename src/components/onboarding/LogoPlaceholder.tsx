import React from 'react'
import { cx } from '../ui/cx'
import { ASSETS } from '../../assets'

/**
 * Brand lockup. Renders the real LYZR AI logo asset — the white mark on
 * dark surfaces. Every brand consumer goes through this one component.
 */
export const LogoPlaceholder: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cx('flex items-center', className)}>
    <img
      src={ASSETS.logos.white}
      alt="Lyzr AI"
      className="h-7 w-7 shrink-0 rounded-[7px]"
    />
  </div>
)
