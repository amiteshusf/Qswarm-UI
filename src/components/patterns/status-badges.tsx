import { Badge } from '@/components/ui/badge'
import type { SessionStatus } from '@/api/schemas'
import {
  getFriendlyStatusLabel,
  type SessionContext,
} from '@/features/sessions/session-lifecycle'
import { cn } from '@/lib/utils'

const styles: Record<
  SessionStatus,
  { dot: string; className: string }
> = {
  draft: {
    dot: 'bg-muted-foreground/50',
    className: 'border-border/60 bg-muted/50 text-muted-foreground',
  },
  plan_ready: {
    dot: 'bg-status-awaiting',
    className:
      'border-status-awaiting/30 bg-status-awaiting/12 text-[color:var(--status-awaiting)]',
  },
  queued: {
    dot: 'bg-muted-foreground',
    className: 'border-border/60 bg-secondary/80 text-secondary-foreground',
  },
  running: {
    dot: 'bg-status-running animate-pulse',
    className:
      'border-status-running/25 bg-status-running/10 text-[color:var(--status-running)]',
  },
  awaiting_review: {
    dot: 'bg-status-awaiting',
    className:
      'border-status-awaiting/30 bg-status-awaiting/12 text-[color:var(--status-awaiting)] font-medium',
  },
  revising: {
    dot: 'bg-status-revising animate-pulse',
    className:
      'border-status-revising/25 bg-status-revising/10 text-[color:var(--status-revising)]',
  },
  succeeded: {
    dot: 'bg-status-succeeded',
    className:
      'border-status-succeeded/25 bg-status-succeeded/10 text-[color:var(--status-succeeded)]',
  },
  failed: {
    dot: 'bg-status-failed',
    className:
      'border-status-failed/25 bg-destructive/10 text-destructive',
  },
  cancelled: {
    dot: 'bg-muted-foreground/40',
    className: 'border-border/60 bg-muted/40 text-muted-foreground line-through',
  },
}

export function SessionStatusBadge({
  status,
  workflowStatus,
  prExternalUrl,
  planApproved,
  className,
  showDot = true,
  friendly = true,
}: {
  status: SessionStatus
  workflowStatus?: string
  prExternalUrl?: string | null
  planApproved?: boolean
  className?: string
  showDot?: boolean
  /** Use business-friendly labels (default). Set false for raw API status names. */
  friendly?: boolean
}) {
  const s = styles[status] ?? styles.draft
  const label = friendly
    ? getFriendlyStatusLabel({ status, workflowStatus, prExternalUrl, planApproved })
    : status.replace(/_/g, ' ')

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        s.className,
        className,
      )}
    >
      {showDot ? (
        <span className={cn('size-1.5 shrink-0 rounded-full', s.dot)} />
      ) : null}
      {label}
    </Badge>
  )
}

const execStyles: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
  running: {
    label: 'In progress',
    className: 'bg-status-running/12 text-[color:var(--status-running)]',
  },
  passed: {
    label: 'Passed',
    className: 'bg-status-succeeded/12 text-[color:var(--status-succeeded)]',
  },
  failed: { label: 'Failed', className: 'bg-destructive/12 text-destructive' },
  skipped: { label: 'Skipped', className: 'bg-muted text-muted-foreground' },
}

export function ExecutionStatusBadge({ status }: { status: string }) {
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

export type { SessionContext }
