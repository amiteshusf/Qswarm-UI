import { AlertCircle, FileCode2, GitBranch, Sparkles } from 'lucide-react'

import type { SessionBrief, SessionDetail } from '@/api/schemas'
import { Skeleton } from '@/components/ui/skeleton'
import { sessionActionHints } from '@/features/sessions/session-actions'
import { cn } from '@/lib/utils'

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
  const hints = sessionActionHints(session)
  const showPreRun =
    hints.stage === 'draft' ||
    hints.stage === 'queued' ||
    brief?.automationBrief.available === false

  if (!showPreRun && !brief?.automationBrief.available) return null

  if (isLoading) {
    return <Skeleton className={cn('h-48 w-full rounded-2xl', className)} />
  }

  if (!brief) return null

  const { sourceSummary, setup, automationBrief } = brief
  const repo = setup.repository
  const repoLabel =
    repo?.displayName ??
    (repo?.owner && repo?.name ? `${repo.owner}/${repo.name}` : 'Repository')

  return (
    <div
      className={cn(
        'border-border/70 bg-surface-raised space-y-5 rounded-2xl border p-5 shadow-sm sm:p-6',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="bg-swarm/10 text-swarm flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Sparkles className="size-5" />
        </div>
        <div>
          <p className="text-swarm text-xs font-semibold tracking-widest uppercase">
            Automation plan
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
          {automationBrief.available ? 'What QSwarm will do' : 'Before you start'}
        </p>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {automationBrief.summary ??
            'Start automation to generate a plan from your source case and repository context.'}
        </p>
        {automationBrief.available ? (
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
