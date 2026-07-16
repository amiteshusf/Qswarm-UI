import { CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'

type HealthItem = {
  label: string
  ready: boolean
  detail: string
  href: string
}

export function SetupHealthStrip({
  items,
  className,
}: {
  items: HealthItem[]
  className?: string
}) {
  const readyCount = items.filter((i) => i.ready).length
  const allReady = readyCount === items.length

  return (
    <div
      className={cn(
        'border-border/70 bg-surface-raised rounded-xl border p-4',
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {allReady ? (
            <CheckCircle2 className="text-status-succeeded size-4" />
          ) : (
            <AlertCircle className="text-status-awaiting size-4" />
          )}
          <p className="text-sm font-medium">
            {allReady ? 'Automation setup complete' : 'Setup readiness'}
          </p>
        </div>
        <span className="text-muted-foreground text-xs tabular-nums">
          {readyCount}/{items.length} ready
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'hover:border-swarm/30 flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors',
              item.ready
                ? 'border-status-succeeded/25 bg-status-succeeded/5'
                : 'border-border/60 bg-muted/20',
            )}
          >
            {item.ready ? (
              <CheckCircle2 className="text-status-succeeded mt-0.5 size-4 shrink-0" />
            ) : (
              <Circle className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-muted-foreground truncate text-xs">{item.detail}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
