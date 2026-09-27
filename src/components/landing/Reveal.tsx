import React, { useEffect, useRef, useState } from 'react'
import { cx } from '../ui/cx'

/**
 * Reveal — restrained scroll reveal for the landing page only.
 * IntersectionObserver adds the existing `animate-rise` (rise 180ms standard).
 * Respects prefers-reduced-motion: renders visible immediately.
 */
export const Reveal: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({
  children,
  className,
  delay = 0,
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true)
            io.disconnect()
          }
        })
      },
      { threshold: 0.12 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cx(
        'transition-all duration-enter ease-standard',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-[6px] opacity-0',
        className,
      )}
    >
      {children}
    </div>
  )
}
