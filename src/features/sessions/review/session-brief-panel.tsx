import type { SessionBrief, SessionDetail } from '@/api/schemas'
import { Skeleton } from '@/components/ui/skeleton'
import {
  buildActionContext,
  sessionActionHints,
} from '@/features/sessions/session-actions'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle2, FileCode2, GitBranch, Sparkles } from 'lucide-react'

type Props = {
  brief?: SessionBrief | null
  session: SessionDetail
  isLoading?: boolean
  className?: string
}

export function SessionBriefPanel({
  brief,
  session,
  isLoading,
  className,
}: Props) {
  const actionCtx = buildActionContext(session, brief)
  const hints = sessionActionHints(actionCtx)

  if (!hints.isPlanPhase && !brief?.automationBrief.available) return null

  if (isLoading) {
    return <Skeleton className={cn('h-48 w-full rounded-2xl', className)} />
  }

  if (!brief) return null

  const { sourceSummary, setup, automationBrief, sessionState } = brief
  const repo = setup.repository
  const repoLabel =
    repo?.displayName ??
    (repo?.owner && repo?.name ? `${repo.owner}/${repo.name}` : 'Repository')

  const planReady = automationBrief.available
  const planApproved = sessionState.planApproved === true

  return (
    <div
      className={cn(
        'border-border/70 bg-surface-raised space-y-5 rounded-2xl border p-5 shadow-sm sm:p-6',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="bg-swarm/10 text-swarm flex size-10 shrink-0 items-center justify-center rounded-xl">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="text-swarm text-xs font-semibold tracking-widest uppercase">
              {hints.isPlanPhase ? 'Automation plan' : 'Run context'}
            </p>
            <h2 className="text-foreground mt-1 text-lg font-semibold">
              {sourceSummary.sourceTitle ?? sourceSummary.sourceReference}
            </h2>
            {sourceSummary.objective ? (
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                {sourceSummary.objective}
              </p>
            ) : null}
          </div>
        </div>
        {hints.isPlanPhase ? (
          <PlanStatusBadge planReady={planReady} planApproved={planApproved} />
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <InfoTile
          icon={GitBranch}
          label="Repository"
          value={repoLabel}
          detail={
            setup.branchPolicy?.branchPattern
              ? `Branch: ${setup.branchPolicy.branchPattern}`
              : repo?.defaultBranch
                ? `Default: ${repo.defaultBranch}`
                : undefined
          }
        />
        <InfoTile
          icon={FileCode2}
          label="Engine"
          value={setup.engine}
          detail={setup.workspaceConfigured ? 'Workspace ready' : 'Not started'}
        />
        <InfoTile
          icon={Sparkles}
          label="Source"
          value={sourceSummary.caseId ?? sourceSummary.sourceReference}
          detail={sourceSummary.sourceSystem}
        />
      </div>

      <div className="border-border/60 bg-muted/15 rounded-xl border p-4">
        <p className="text-sm font-medium">
          {planReady ? 'What QSwarm will do' : 'Before you prepare a plan'}
        </p>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {automationBrief.summary ??
            (planReady
              ? 'Review the automation plan below before approving.'
              : 'Prepare a plan to see what QSwarm will automate from your source case and repository context.')}
        </p>
        {planReady ? (
          <ul className="text-muted-foreground mt-3 space-y-1.5 text-xs">
            {automationBrief.frameworkType ? (
              <li>
                <span className="text-foreground font-medium">Framework:</span>{' '}
                {automationBrief.frameworkType}
              </li>
            ) : null}
            {automationBrief.targetTestFile ? (
              <li>
                <span className="text-foreground font-medium">Target file:</span>{' '}
                <code className="font-mono">{automationBrief.targetTestFile}</code>
              </li>
            ) : null}
            {automationBrief.filesToModify?.length ? (
              <li>
                <span className="text-foreground font-medium">Files to touch:</span>{' '}
                {automationBrief.filesToModify.join(', ')}
              </li>
            ) : null}
            {automationBrief.actionOnTargetTestFile ? (
              <li>
                <span className="text-foreground font-medium">Action:</span>{' '}
                {automationBrief.actionOnTargetTestFile}
              </li>
            ) : null}
            {automationBrief.planVersion ? (
              <li>
                <span className="text-foreground font-medium">Plan version:</span>{' '}
                {automationBrief.planVersion}
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>

      {sourceSummary.missingInformation?.length ? (
        <div className="border-status-awaiting/25 bg-status-awaiting/8 flex gap-2 rounded-lg border px-3 py-2 text-xs">
          <AlertCircle className="text-status-awaiting mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Missing from source</p>
            <p className="text-muted-foreground mt-0.5">
              {sourceSummary.missingInformation.join(' · ')}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function PlanStatusBadge({
  planReady,
  planApproved,
}: {
  planReady: boolean
  planApproved: boolean
}) {
  if (planApproved) {
    return (
      <span className="border-status-succeeded/30 bg-status-succeeded/10 text-status-succeeded inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
        <CheckCircle2 className="size-3.5" />
        Plan approved
      </span>
    )
  }
  if (planReady) {
    return (
      <span className="border-status-awaiting/30 bg-status-awaiting/10 text-status-awaiting inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
        <AlertCircle className="size-3.5" />
        Awaiting plan approval
      </span>
    )
  }
  return (
    <span className="border-border/60 bg-muted/40 text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
      Plan not prepared
    </span>
  )
}

function InfoTile({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  detail?: string
}) {
  return (
    <div className="border-border/50 rounded-lg border bg-surface px-3 py-2.5">
      <div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide">
        <Icon className="size-3" />
        {label}
      </div>
      <p className="text-sm font-medium">{value}</p>
      {detail ? (
        <p className="text-muted-foreground mt-0.5 text-xs">{detail}</p>
      ) : null}
    </div>
  )
}
