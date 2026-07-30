import { useEffect, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'

// Primitivas leves de UI (sem UI-kit pesado), estilizadas pelos tokens.

export function IconButton({
  children,
  label,
  onClick,
  active,
  disabled,
  className = '',
}: {
  children: ReactNode
  label: string
  onClick?: () => void
  active?: boolean
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`inline-grid place-items-center h-9 w-9 rounded-[10px] text-[var(--text-muted)] transition-colors duration-150 hover:bg-[var(--surface-2)] hover:text-[var(--text)] disabled:opacity-40 disabled:cursor-default ${
        active ? 'bg-[var(--primary-soft)] text-[var(--primary)]' : ''
      } ${className}`}
    >
      {children}
    </button>
  )
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150 ${
        checked ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
      }`}
    >
      <span
        className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-150"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  )
}

export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  return (
    <span className="relative inline-flex group">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded-md bg-[var(--text)] px-2 py-1 text-[12px] font-medium text-[var(--surface)] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 z-50"
      >
        {content}
      </span>
    </span>
  )
}

export function Menu({
  trigger,
  children,
  align = 'right',
}: {
  trigger: ReactNode
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div
          className={`absolute z-50 mt-1 min-w-[180px] rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-[var(--shadow-lg)] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

export function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: ReactNode
  onClick?: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[14px] font-medium transition-colors duration-150 hover:bg-[var(--surface-2)] ${
        danger ? 'text-[var(--danger)]' : 'text-[var(--text)]'
      }`}
    >
      {children}
    </button>
  )
}

export function Dialog({
  open,
  onClose,
  children,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  size?: 'md' | 'lg' | 'xl'
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  const w = size === 'xl' ? 'max-w-[920px]' : size === 'lg' ? 'max-w-[640px]' : 'max-w-[480px]'
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full ${w} max-h-[88vh] overflow-auto rounded-[16px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-[8px] text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  )
}

export function PanelLabel({ children }: { children: ReactNode }) {
  return (
    <span className="block text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--text-muted)]">
      {children}
    </span>
  )
}
