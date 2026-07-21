import {
  ClipboardList,
  ExternalLink,
  GitPullRequest,
  Loader2,
  Play,
  ShieldCheck,
} from 'lucide-react'

import type { SessionBrief, SessionDetail } from '@/api/schemas'
import {
  buildActionContext,
  primaryActionLabel,
  sessionActionHints,
} from '@/features/sessions/session-actions'
import {
  getNextStepHeading,
  getNextStepMessage,
} from '@/features/sessions/session-lifecycle'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  session: SessionDetail
  brief?: SessionBrief | null
  repoName: string
  repoId: string
  preparePlanPending: boolean
  approvePlanPending: boolean
  startPending: boolean
  approvePending: boolean
  createPrPending: boolean
  onPreparePlan: () => void
  onApprovePlan: () => void
  onStart: () => void
  onApprove: () => void
  onCreatePr: () => void
  onScrollToPlanComposer?: () => void
  className?: string
}

export function ActionRail({
  session,
  brief,
  repoName,
  repoId,
  preparePlanPending,
  approvePlanPending,
  startPending,
  approvePending,
  createPrPending,
  onPreparePlan,
  onApprovePlan,
  onStart,
  onApprove,
  onCreatePr,
  onScrollToPlanComposer,
  className,
}: Props) {
  const actionCtx = buildActionContext(session, brief)
  const hints = sessionActionHints(actionCtx)
  const heading = getNextStepHeading(actionCtx)
  const message = getNextStepMessage(actionCtx)
  const primary = hints.primaryAction

  const primaryPending =
    (primary === 'prepare_plan' && preparePlanPending) ||
    (primary === 'approve_plan' && approvePlanPending) ||
    (primary === 'start_automation' && startPending) ||
    (primary === 'approve' && approvePending) ||
    (primary === 'create_pr' && createPrPending)

  const decisionLabel = hints.isPlanPhase ? 'Plan decision' : 'Your decision'

  return (
    <aside
      className={cn(
        'border-border/70 bg-surface-raised space-y-4 rounded-2xl border p-5 shadow-sm',
        className,
      )}
    >
      <div>
        <p className="text-swarm text-xs font-semibold tracking-widest uppercase">
          {decisionLabel}
        </p>
        <p className="text-foreground mt-2 text-sm font-medium leading-snug">
          {heading}
        </p>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          {message}
        </p>
      </div>

      {primary ? (
        <div className="flex flex-col gap-2">
          {primary === 'prepare_plan' ? (
            <Button
              className="bg-swarm text-swarm-foreground hover:bg-swarm/90 w-full gap-2"
              disabled={preparePlanPending}
              onClick={onPreparePlan}
            >
              {primaryPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ClipboardList className="size-4" />
              )}
              {primaryActionLabel(primary)}
            </Button>
          ) : null}

          {primary === 'approve_plan' ? (
            <Button
              className="bg-swarm text-swarm-foreground hover:bg-swarm/90 w-full gap-2"
              disabled={approvePlanPending}
              onClick={onApprovePlan}
            >
              {primaryPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
              {primaryActionLabel(primary)}
            </Button>
          ) : null}

          {primary === 'start_automation' ? (
            <Button
              className="bg-swarm text-swarm-foreground hover:bg-swarm/90 w-full gap-2"
              disabled={startPending}
              onClick={onStart}
            >
              {primaryPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
              {primaryActionLabel(primary)}
            </Button>
          ) : null}

          {primary === 'approve' ? (
            <Button
              className="bg-swarm text-swarm-foreground hover:bg-swarm/90 w-full gap-2"
              disabled={approvePending}
              onClick={onApprove}
            >
              {primaryPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
              {primaryActionLabel(primary)}
            </Button>
          ) : null}

          {primary === 'create_pr' ? (
            <Button
              className="bg-swarm text-swarm-foreground hover:bg-swarm/90 w-full gap-2"
              disabled={createPrPending || !repoId}
              onClick={onCreatePr}
            >
              <GitPullRequest className="size-4" />
              {primaryActionLabel(primary)}
            </Button>
          ) : null}

          {primary === 'open_pr' && session.prExternalUrl ? (
            <a
              href={session.prExternalUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-swarm text-swarm-foreground hover:bg-swarm/90 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium"
            >
              <ExternalLink className="size-4" />
              {primaryActionLabel(primary)}
            </a>
          ) : null}

          {hints.canRequestPlanRevision ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={onScrollToPlanComposer}
            >
              Request plan changes
            </Button>
          ) : null}
        </div>
      ) : hints.isWaiting &&
        (hints.stage === 'running' || hints.stage === 'revising') ? (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="text-swarm size-4 animate-spin" />
          Automation in progress…
        </div>
      ) : null}

      {hints.canRevise && hints.isOutputReviewPhase ? (
        <p className="text-muted-foreground border-border/50 border-t pt-3 text-xs leading-relaxed">
          To request <strong>output</strong> changes, use the review conversation
          composer below — type naturally, like ChatGPT.
        </p>
      ) : null}

      <div className="border-border/50 space-y-2 border-t pt-3 text-xs">
        <MetaLine label="Repository" value={repoName} />
        <MetaLine label="Engine" value={session.engine} mono />
        {session.prExternalUrl ? (
          <MetaLine label="Pull request" value="Created" />
        ) : null}
      </div>
    </aside>
  )
}

function MetaLine({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('text-right font-medium', mono && 'font-mono')}>
        {value}
      </span>
    </div>
  )
}
