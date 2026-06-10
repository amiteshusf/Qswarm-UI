import { Badge } from '@/components/ui/badge'
import type { SessionStatus } from '@/api/schemas'
import { cn } from '@/lib/utils'

const styles: Record<
  SessionStatus,
  { label: string; className: string }
> = {
  draft: {
    label: 'Draft',
    className:
      'border-transparent bg-muted text-muted-foreground',
  },
  queued: {
    label: 'Queued',
    className: 'border-transparent bg-secondary text-secondary-foreground',
  },
  running: {
    label: 'Running',
    className:
      'border-transparent bg-primary/15 text-primary',
  },
  awaiting_review: {
    label: 'Awaiting review',
    className:
      'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400',
  },
  revising: {
    label: 'Revising',
    className:
      'border-transparent bg-violet-500/15 text-violet-700 dark:text-violet-300',
  },
  succeeded: {
    label: 'Succeeded',
    className:
      'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  },
  failed: {
    label: 'Failed',
    className:
      'border-transparent bg-destructive/15 text-destructive',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'border-transparent bg-muted text-muted-foreground line-through',
  },
}

export function SessionStatusBadge({
  status,
  className,
}: {
  status: SessionStatus
  className?: string
}) {
  const s = styles[status]
  return (
    <Badge
      variant="outline"
      className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', s.className, className)}
    >
      {s.label}
    </Badge>
  )
}

const execStyles: Record<
  string,
  { label: string; className: string }
> = {
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
  running: { label: 'Running', className: 'bg-primary/15 text-primary' },
  passed: { label: 'Passed', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  failed: { label: 'Failed', className: 'bg-destructive/15 text-destructive' },
  skipped: { label: 'Skipped', className: 'bg-muted text-muted-foreground' },
}

export function ExecutionStatusBadge({
  status,
}: {
  status: string
}) {
  const s = execStyles[status] ?? execStyles.pending
  return (
    <Badge
      variant="outline"
      className={cn('rounded-full px-2 py-0 text-[11px] font-medium', s.className)}
    >
      {s.label}
    </Badge>
  )
}
