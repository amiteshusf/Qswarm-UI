import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

import type { SessionDetail } from '@/api/schemas'
import { ExecutionStatusBadge } from '@/components/patterns/status-badges'
import { friendlyValidationLabel } from '@/features/sessions/session-lifecycle'
import { cn } from '@/lib/utils'

type Props = {
  session: SessionDetail
}

export function ValidationSummaryPanel({ session }: Props) {
  const latest = session.executions[session.executions.length - 1]
  const passed = latest?.status === 'passed'
  const failed = latest?.status === 'failed'
  const running = latest?.status === 'running'

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'rounded-xl border p-4',
          passed && 'border-status-succeeded/30 bg-status-succeeded/8',
          failed && 'border-destructive/30 bg-destructive/8',
          running && 'border-status-running/30 bg-status-running/8',
          !passed && !failed && !running && 'border-border/60 bg-muted/15',
        )}
      >
        <div className="mb-2 flex items-center gap-2">
          {passed ? (
            <CheckCircle2 className="text-status-succeeded size-5" />
          ) : failed ? (
            <XCircle className="text-destructive size-5" />
          ) : running ? (
            <Loader2 className="text-status-running size-5 animate-spin" />
          ) : null}
          <p className="font-medium">
            {passed
              ? 'Validation passed'
              : failed
                ? 'Validation failed'
                : running
                  ? 'Validation in progress'
                  : 'Validation result'}
          </p>
        </div>
        <p className="text-sm leading-relaxed">
          {session.latestExecutionSummary ??
            'No validation results yet. Start automation or wait for the agent to finish.'}
        </p>
      </div>

      {session.executions.length > 1 ? (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Previous runs
          </p>
          {session.executions.slice(0, -1).map((ex) => (
            <div
              key={ex.id}
              className="border-border/50 flex items-center justify-between rounded-lg border bg-surface-raised px-3 py-2 text-sm"
            >
              <span>{friendlyValidationLabel(ex.roundNumber)}</span>
              <ExecutionStatusBadge status={ex.status} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
