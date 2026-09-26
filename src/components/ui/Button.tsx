import React from 'react'
import { cx } from './cx'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md'

/**
 * iMessage-inspired dark mode. `primary` is the blue CTA (#007AFF on white);
 * `secondary` is the elevated card; `ghost` stays neutral.
 *
 * Every variant shares one hover recipe (a background value step, never an
 * opacity change) and one focus ring, so the product has exactly one feel.
 * `lg` was removed: a 48px control in a 360px column reads as a marketing
 * page rather than an application.
 */
const styles: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accentHover border border-transparent',
  secondary: 'bg-surface text-paper hover:bg-bubble border border-line',
  ghost: 'bg-transparent text-muted hover:text-paper hover:bg-surface border border-transparent',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-label',
  md: 'h-10 px-4 text-label',
}

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
> = ({ variant = 'primary', size = 'md', className, ...rest }) => (
  <button
    {...rest}
    className={cx(
      'inline-flex items-center justify-center gap-2 rounded-full font-medium',
      'transition-all duration-instant ease-standard active:scale-[0.98]',
      'disabled:pointer-events-none disabled:opacity-40',
      styles[variant],
      sizes[size],
      className,
    )}
  />
)

/**
 * Icon-only control. 32px target, 16px glyph. `coarse-hit` expands the hit
 * area to 44px on touch devices without changing the visual size.
 */
export const IconButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }
> = ({ label, className, ...rest }) => (
  <button
    aria-label={label}
    title={label}
    {...rest}
    className={cx(
      'coarse-hit inline-flex h-8 w-8 items-center justify-center rounded-full text-muted',
      'transition-colors duration-instant ease-standard hover:bg-surface hover:text-paper',
      className,
    )}
  />
)
