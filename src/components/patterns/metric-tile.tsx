import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export function MetricTile({
  label,
  value,
  hint,
  icon: Icon,
  variant = 'default',
  className,
}: {
  label: string
  value: React.ReactNode
  hint?: string
  icon?: LucideIcon
  variant?: 'default' | 'attention' | 'active' | 'success'
  className?: string
}) {
  const variants = {
    default: 'border-border/60 bg-surface',
    attention: 'border-status-awaiting/30 bg-status-awaiting/5',
    active: 'border-status-running/30 bg-status-running/5',
    success: 'border-status-succeeded/30 bg-status-succeeded/5',
  }

  return (
    <div
      className={cn(
        'rounded-xl border p-5 shadow-sm',
        variants[variant],
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {label}
        </p>
        {Icon ? <Icon className="text-muted-foreground size-4" /> : null}
      </div>
      <p className="text-foreground text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
