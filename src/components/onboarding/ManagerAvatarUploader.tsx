import React, { useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { cx } from '../ui/cx'

/**
 * Mock avatar upload: local file picker → data URL preview → remove / reselect.
 * No image processing infrastructure — the data URL is persisted locally.
 */
export const ManagerAvatarUploader: React.FC<{
  value: string
  onChange: (dataUrl: string) => void
  className?: string
}> = ({ value, onChange, className }) => {
  const ref = useRef<HTMLInputElement>(null)

  const handleFile = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => onChange(String(reader.result ?? ''))
    reader.readAsDataURL(file)
  }

  return (
    <div className={cx('flex flex-col items-center gap-3', className)}>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div className="relative">
        {value ? (
          <img
            src={value}
            alt="Manager avatar"
            className="h-24 w-24 rounded-full object-cover"
            style={{ border: '1px solid var(--grok-line)' }}
          />
        ) : (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-full transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            style={{ background: 'var(--grok-search-input)', border: '1px dashed var(--grok-line)' }}
            aria-label="Upload Manager avatar"
          >
            <Upload size={18} style={{ color: 'var(--grok-text-muted)' }} />
            <span className="text-[10px]" style={{ color: 'var(--grok-text-muted)' }}>Upload</span>
          </button>
        )}

        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Remove avatar"
            className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            style={{ background: 'var(--grok-action-btn)' }}
          >
            <X size={12} className="text-white" />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="rounded-full px-3 py-1 text-[12px] transition-colors hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        style={{ color: 'var(--grok-text-muted)' }}
      >
        {value ? 'Choose a different image' : 'Upload image'}
      </button>
    </div>
  )
}
