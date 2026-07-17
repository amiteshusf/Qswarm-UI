import { formatDistanceToNow } from 'date-fns'
import { ArrowLeft } from 'lucide-react'

import type { SessionDetail } from '@/api/schemas'
import { SessionStatusBadge } from '@/components/patterns/status-badges'
import { WorkflowStrip } from '@/components/patterns/workflow-strip'
import { LinkButton } from '@/components/ui/link-button'
import { getHeroSummary } from '@/features/sessions/session-lifecycle'

type Props = {
  session: SessionDetail
  repoName: string
}

export function RunHeroSummary({ session, repoName }: Props) {
  return (
    <div className="border-border/70 bg-surface-raised space-y-4 rounded-2xl border p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <p className="text-swarm text-xs font-semibold tracking-widest uppercase">
            Review workspace
          </p>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
            {session.sourceLabel ?? session.sourceRef}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <SessionStatusBadge
              status={session.status}
              workflowStatus={session.workflowStatus}
              prExternalUrl={session.prExternalUrl}
            />
            <span className="text-muted-foreground text-xs">
              {repoName} · {session.engine}
            </span>
          </div>
          <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
            {getHeroSummary(session)}
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
        status={session.status}
        workflowStatus={session.workflowStatus}
        prExternalUrl={session.prExternalUrl}
      />
    </div>
  )
}
