import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  ClipboardCheck,
  GitBranch,
  Plus,
  Workflow,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { useDashboard, useRepoConnections, useSettings } from '@/api/hooks'
import { MetricTile } from '@/components/patterns/metric-tile'
import { PageHeader } from '@/components/patterns/page-header'
import { QueryErrorAlert } from '@/components/patterns/query-error'
import { SectionBlock } from '@/components/patterns/section-block'
import { SessionStatusBadge } from '@/components/patterns/status-badges'
import { SetupHealthStrip } from '@/components/patterns/setup-health'
import { LinkButton } from '@/components/ui/link-button'
import { Skeleton } from '@/components/ui/skeleton'
import { needsAttention, isActivePipeline } from '@/lib/workflow'
import { cn } from '@/lib/utils'

export function DashboardPage() {
  const dashboard = useDashboard()
  const repos = useRepoConnections()
  const settings = useSettings()

  const repoName = (id: string) =>
    repos.data?.find((r) => r.id === id)?.displayName ??
    repos.data?.find((r) => r.id === id)?.repoName ??
    id

  const awaiting = dashboard.data?.sessionCounts.awaiting_review ?? 0
  const active =
    (dashboard.data?.sessionCounts.running ?? 0) +
    (dashboard.data?.sessionCounts.queued ?? 0) +
    (dashboard.data?.sessionCounts.revising ?? 0)

  const reviewSessions =
    dashboard.data?.recentSessions.filter((s) => s.status === 'awaiting_review') ??
    []
  const activeSessions =
    dashboard.data?.recentSessions.filter((s) => isActivePipeline(s.status)) ??
    []

  const repoCount =
    dashboard.data?.repositoryConnectionCount ?? repos.data?.length ?? 0
  const policyCount = dashboard.data?.branchPolicyCount ?? 0
  const copilotReady = settings.data?.copilotAgentEnabled ?? false

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Operations"
        title="Control overview"
        description="What needs your attention right now — sessions in review, active runs, and automation readiness."
        actions={
          <div className="flex flex-wrap gap-2">
            <LinkButton variant="outline" to="/sessions?status=awaiting_review">
              <ClipboardCheck className="size-4" />
              Review queue
            </LinkButton>
            <LinkButton to="/sessions">
              <Plus className="size-4" />
              New session
            </LinkButton>
          </div>
        }
      />

      {dashboard.isError ? (
        <QueryErrorAlert
          error={dashboard.error}
          onRetry={() => void dashboard.refetch()}
        />
      ) : null}

      {dashboard.isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : null}

      {dashboard.data ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 md:grid-cols-3"
        >
          <MetricTile
            label="Needs review"
            value={awaiting}
            hint="Sessions waiting for human approval"
            icon={ClipboardCheck}
            variant={awaiting > 0 ? 'attention' : 'default'}
          />
          <MetricTile
            label="Active pipeline"
            value={active}
            hint="Queued, running, or revising"
            icon={Zap}
            variant={active > 0 ? 'active' : 'default'}
          />
          <MetricTile
            label="Completed"
            value={dashboard.data.sessionCounts.succeeded ?? 0}
            hint="Successful session outcomes"
            icon={Workflow}
            variant="success"
          />
        </motion.div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-3">
          <SectionBlock
            title="Review queue"
            description="Sessions that need a decision before PR creation."
            actions={
              awaiting > 0 ? (
                <LinkButton variant="ghost" size="sm" to="/sessions?status=awaiting_review">
                  View all
                  <ArrowRight className="size-4" />
                </LinkButton>
              ) : null
            }
          >
            {dashboard.isLoading ? (
              <Skeleton className="h-32 rounded-xl" />
            ) : reviewSessions.length === 0 ? (
              <div className="border-border/60 bg-muted/15 text-muted-foreground rounded-xl border border-dashed px-6 py-10 text-center text-sm">
                No sessions awaiting review.{' '}
                <Link to="/sessions" className="text-swarm font-medium hover:underline">
                  Open sessions
                </Link>{' '}
                to start a new run.
              </div>
            ) : (
              <div className="space-y-2">
                {reviewSessions.map((s) => (
                  <SessionRow
                    key={s.id}
                    id={s.id}
                    title={s.sourceLabel ?? s.sourceRef}
                    subtitle={`${repoName(s.repoConnectionId)} · ${s.engine}`}
                    status={s.status}
                    time={s.updatedAt ?? s.createdAt}
                    highlight
                  />
                ))}
              </div>
            )}
          </SectionBlock>

          <SectionBlock
            title="Active runs"
            description="Sessions currently executing or being revised."
            actions={
              <LinkButton variant="ghost" size="sm" to="/sessions?status=running">
                View running
              </LinkButton>
            }
          >
            {dashboard.isLoading ? (
              <Skeleton className="h-24 rounded-xl" />
            ) : activeSessions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No active pipeline sessions.</p>
            ) : (
              <div className="space-y-2">
                {activeSessions.map((s) => (
                  <SessionRow
                    key={s.id}
                    id={s.id}
                    title={s.sourceLabel ?? s.sourceRef}
                    subtitle={`${repoName(s.repoConnectionId)} · ${s.engine}`}
                    status={s.status}
                    time={s.updatedAt ?? s.createdAt}
                  />
                ))}
              </div>
            )}
          </SectionBlock>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <SectionBlock title="Quick actions">
            <div className="grid gap-2">
              <LinkButton to="/sessions" className="justify-start">
                <Plus className="size-4" />
                Create session
              </LinkButton>
              <LinkButton variant="outline" to="/repo-connections/new" className="justify-start">
                <GitBranch className="size-4" />
                Connect repository
              </LinkButton>
              <LinkButton variant="outline" to="/branch-policies/new" className="justify-start">
                Add branch policy
              </LinkButton>
            </div>
          </SectionBlock>

          <SetupHealthStrip
            items={[
              {
                label: 'Repositories',
                ready: repoCount > 0,
                detail: repoCount > 0 ? `${repoCount} connected` : 'None connected',
                href: '/repo-connections',
              },
              {
                label: 'Branch policies',
                ready: policyCount > 0,
                detail: policyCount > 0 ? `${policyCount} defined` : 'No policies yet',
                href: '/branch-policies',
              },
              {
                label: 'Coding engine',
                ready: copilotReady,
                detail: copilotReady
                  ? 'Copilot agent enabled'
                  : (settings.data?.codingProvider ?? 'Check deployment'),
                href: '/settings',
              },
            ]}
          />

          {dashboard.data?.environment ? (
            <div className="border-border/60 bg-surface-raised text-muted-foreground rounded-xl border px-4 py-3 text-xs">
              <span className="text-foreground font-medium">Environment</span>{' '}
              · {dashboard.data.environment}
              {dashboard.data.applicationName
                ? ` · ${dashboard.data.applicationName}`
                : ''}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function SessionRow({
  id,
  title,
  subtitle,
  status,
  time,
  highlight,
}: {
  id: string
  title: string
  subtitle: string
  status: Parameters<typeof SessionStatusBadge>[0]['status']
  time: string
  highlight?: boolean
}) {
  return (
    <Link
      to={`/sessions/${id}`}
      className={cn(
        'border-border/70 bg-surface-raised hover:border-swarm/35 flex flex-col gap-2 rounded-xl border p-4 transition-all hover:shadow-sm sm:flex-row sm:items-center sm:justify-between',
        highlight && needsAttention(status) && 'border-status-awaiting/35 ring-1 ring-status-awaiting/15',
      )}
    >
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="text-muted-foreground truncate text-xs">{subtitle}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <SessionStatusBadge status={status} />
        <span className="text-muted-foreground text-xs tabular-nums">
          {formatDistanceToNow(new Date(time), { addSuffix: true })}
        </span>
      </div>
    </Link>
  )
}
