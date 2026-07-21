import { formatDistanceToNow } from 'date-fns'
import { ArrowLeft } from 'lucide-react'

import type { SessionBrief, SessionDetail } from '@/api/schemas'
import { SessionStatusBadge } from '@/components/patterns/status-badges'
import { WorkflowStrip } from '@/components/patterns/workflow-strip'
import { LinkButton } from '@/components/ui/link-button'
import { buildActionContext } from '@/features/sessions/session-actions'
import { getHeroSummary } from '@/features/sessions/session-lifecycle'

type Props = {
  session: SessionDetail
  brief?: SessionBrief | null
  repoName: string
}

export function RunHeroSummary({ session, brief, repoName }: Props) {
  const actionCtx = buildActionContext(session, brief)

  return (
    <div className="border-border/70 bg-surface-raised space-y-4 rounded-2xl border p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <p className="text-swarm text-xs font-semibold tracking-widest uppercase">
            {actionCtx.status === 'draft' ||
            actionCtx.status === 'plan_ready' ||
            actionCtx.planApproved === false
              ? 'Plan workspace'
              : 'Review workspace'}
          </p>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
            {session.sourceLabel ?? session.sourceRef}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <SessionStatusBadge
              status={actionCtx.status}
              workflowStatus={actionCtx.workflowStatus}
              prExternalUrl={actionCtx.prExternalUrl}
              planApproved={actionCtx.planApproved}
            />
            <span className="text-muted-foreground text-xs">
              {repoName} · {session.engine}
            </span>
          </div>
          <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
            {getHeroSummary(actionCtx)}
          </p>
          <p className="text-muted-foreground text-xs">
            Updated{' '}
            {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
          </p>
        </div>
        <LinkButton variant="ghost" size="sm" to="/sessions" className="shrink-0 gap-1">
          <ArrowLeft className="size-4" />
          All runs
        </LinkButton>
      </div>
      <WorkflowStrip
        status={actionCtx.status}
        workflowStatus={actionCtx.workflowStatus}
        prExternalUrl={actionCtx.prExternalUrl}
        planApproved={actionCtx.planApproved}
      />
    </div>
  )
}
