import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  ListChecks,
  PenLine,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAutomationBacklog, useDashboard, useRepoConnections, useStories } from '@/api/hooks'
import type { SessionStatus } from '@/api/schemas'
import { MetricTile } from '@/components/patterns/metric-tile'
import { PageHeader } from '@/components/patterns/page-header'
import { QueryErrorAlert } from '@/components/patterns/query-error'
import { SectionBlock } from '@/components/patterns/section-block'
import { SessionStatusBadge } from '@/components/patterns/status-badges'
import { LinkButton } from '@/components/ui/link-button'
import { Skeleton } from '@/components/ui/skeleton'
import { isActivePipeline, needsAttention } from '@/lib/workflow'
import { cn } from '@/lib/utils'

export function DashboardPage() {
  const dashboard = useDashboard()
  const repos = useRepoConnections()
  const stories = useStories()
  const backlog = useAutomationBacklog({ status: 'not_automated' })

  const repoName = (id: string) =>
    repos.data?.find((r) => r.id === id)?.displayName ??
    repos.data?.find((r) => r.id === id)?.repoName ??
    id

  const awaiting = dashboard.data?.sessionCounts.awaiting_review ?? 0
  const failed = dashboard.data?.sessionCounts.failed ?? 0

  const storyItems = stories.data?.stories ?? []
  const needsAnalysis = storyItems.filter(
    (s) => !s.hasActiveRun && s.readiness !== 'missing_ac',
  )
  const activeDesignRuns = storyItems.filter(
    (s) => s.hasActiveRun && s.activeRunId,
  )
  const automationReady = backlog.data?.items.length ?? 0

  const recent = dashboard.data?.recentSessions ?? []
  const reviewSessions = recent.filter((s) => s.status === 'awaiting_review')
  const activeSessions = recent.filter((s) => isActivePipeline(s.status))
  const failedSessions = recent.filter((s) => s.status === 'failed')
  const publishedSessions = recent.filter((s) => s.status === 'succeeded')

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Operations"
        title="What needs you now"
        description="Prioritized by review decisions, active automation, failures, and recent publishes."
        actions={
          <div className="flex flex-wrap gap-2">
            <LinkButton to="/story-intake">
              <BookOpen className="size-4" />
              Select Jira stories
            </LinkButton>
            <LinkButton variant="outline" to="/automation-backlog">
              <ListChecks className="size-4" />
              Automation backlog
            </LinkButton>
            <LinkButton variant="outline" to="/sessions?status=awaiting_review">
              <ClipboardCheck className="size-4" />
              Review queue
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : null}

      {dashboard.data ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <MetricTile
            label="Stories to design"
            value={needsAnalysis.length}
            hint="Ready for test design"
            icon={BookOpen}
            variant={needsAnalysis.length > 0 ? 'active' : 'default'}
          />
          <MetricTile
            label="Design in progress"
            value={activeDesignRuns.length}
            hint="Test-design runs active"
            icon={PenLine}
            variant={activeDesignRuns.length > 0 ? 'active' : 'default'}
          />
          <MetricTile
            label="Ready to automate"
            value={automationReady}
            hint="Published cases in backlog"
            icon={ListChecks}
            variant={automationReady > 0 ? 'attention' : 'default'}
          />
          <MetricTile
            label="Needs review"
            value={awaiting}
            hint="Automation output awaiting review"
            icon={ClipboardCheck}
            variant={awaiting > 0 ? 'attention' : 'default'}
          />
        </motion.div>
      ) : null}

      <div className="space-y-8">
        <SectionBlock
          title="Stories ready for test design"
          description="Select Jira stories to analyze requirements and generate test cases."
          actions={
            needsAnalysis.length > 0 ? (
              <LinkButton variant="ghost" size="sm" to="/story-intake">
                View all
                <ArrowRight className="size-4" />
              </LinkButton>
            ) : null
          }
        >
          {stories.isLoading ? (
            <Skeleton className="h-24 rounded-xl" />
          ) : needsAnalysis.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No new stories need test design.{' '}
              <Link to="/story-intake" className="text-swarm font-medium hover:underline">
                Browse Story Intake
              </Link>
            </p>
          ) : (
            <StoryList items={needsAnalysis.slice(0, 5)} />
          )}
        </SectionBlock>

        <SectionBlock
          title="Test designs in progress"
          description="Continue reviewing plans, cases, or publication."
          actions={
            <LinkButton variant="ghost" size="sm" to="/test-design">
              View all
            </LinkButton>
          }
        >
          {stories.isLoading ? (
            <Skeleton className="h-20 rounded-xl" />
          ) : activeDesignRuns.length === 0 ? (
            <p className="text-muted-foreground text-sm">No active test-design runs.</p>
          ) : (
            <StoryList items={activeDesignRuns.slice(0, 5)} showRun />
          )}
        </SectionBlock>

        <SectionBlock
          title="Ready for review"
          description="Approve output or request changes before publishing."
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
            <Skeleton className="h-24 rounded-xl" />
          ) : reviewSessions.length === 0 ? (
            <EmptyQueue message="Nothing waiting for review." />
          ) : (
            <RunList
              items={reviewSessions}
              repoName={repoName}
              highlight
            />
          )}
        </SectionBlock>

        <div className="grid gap-8 lg:grid-cols-2">
          <SectionBlock
            title="Running now"
            description="Automation currently executing or revising."
            actions={
              <LinkButton variant="ghost" size="sm" to="/sessions?status=running">
                View all
              </LinkButton>
            }
          >
            {dashboard.isLoading ? (
              <Skeleton className="h-20 rounded-xl" />
            ) : activeSessions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No active runs.</p>
            ) : (
              <RunList items={activeSessions} repoName={repoName} />
            )}
          </SectionBlock>

          <SectionBlock
            title="Needs attention"
            description="Runs that failed validation or orchestration."
            actions={
              failed > 0 ? (
                <LinkButton variant="ghost" size="sm" to="/sessions?status=failed">
                  View all
                </LinkButton>
              ) : null
            }
          >
            {dashboard.isLoading ? (
              <Skeleton className="h-20 rounded-xl" />
            ) : failedSessions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No failed runs recently.</p>
            ) : (
              <RunList items={failedSessions} repoName={repoName} />
            )}
          </SectionBlock>
        </div>

        <SectionBlock
          title="Recently published"
          description="Runs that completed successfully."
          actions={
            <LinkButton variant="ghost" size="sm" to="/sessions">
              All runs
            </LinkButton>
          }
        >
          {dashboard.isLoading ? (
            <Skeleton className="h-20 rounded-xl" />
          ) : publishedSessions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No published runs yet.</p>
          ) : (
            <RunList items={publishedSessions.slice(0, 5)} repoName={repoName} />
          )}
        </SectionBlock>
      </div>
    </div>
  )
}

function StoryList({
  items,
  showRun,
}: {
  items: Array<{
    storyKey: string
    title: string
    activeRunId?: string | null
  }>
  showRun?: boolean
}) {
  return (
    <div className="space-y-2">
      {items.map((s) => (
        <Link
          key={s.storyKey}
          to={
            showRun && s.activeRunId
              ? `/test-design/${s.activeRunId}`
              : '/story-intake'
          }
          className="border-border/70 bg-surface-raised hover:border-swarm/35 flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors"
        >
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold">{s.storyKey}</p>
            <p className="truncate text-sm">{s.title}</p>
          </div>
          {showRun ? (
            <span className="text-muted-foreground shrink-0 text-xs">
              In progress
            </span>
          ) : null}
        </Link>
      ))}
    </div>
  )
}

function EmptyQueue({ message }: { message: string }) {
  return (
    <div className="border-border/60 bg-muted/15 text-muted-foreground rounded-xl border border-dashed px-6 py-8 text-center text-sm">
      {message}{' '}
      <Link to="/sessions" className="text-swarm font-medium hover:underline">
        Start an automation run
      </Link>
    </div>
  )
}

function RunList({
  items,
  repoName,
  highlight,
}: {
  items: Array<{
    id: string
    sourceLabel?: string
    sourceRef: string
    repoConnectionId: string
    engine: string
    status: SessionStatus
    workflowStatus?: string
    createdAt: string
    updatedAt: string
  }>
  repoName: (id: string) => string
  highlight?: boolean
}) {
  return (
    <div className="space-y-2">
      {items.map((s) => (
        <Link
          key={s.id}
          to={`/sessions/${s.id}`}
          className={cn(
            'border-border/70 bg-surface-raised hover:border-swarm/35 flex flex-col gap-2 rounded-xl border p-4 transition-all hover:shadow-sm sm:flex-row sm:items-center sm:justify-between',
            highlight &&
              needsAttention(s.status) &&
              'border-status-awaiting/35 ring-1 ring-status-awaiting/15',
          )}
        >
          <div className="min-w-0 space-y-1">
            <p className="truncate text-sm font-medium">
              {s.sourceLabel ?? s.sourceRef}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {repoName(s.repoConnectionId)} · {s.engine}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <SessionStatusBadge
              status={s.status}
              workflowStatus={s.workflowStatus}
            />
            <span className="text-muted-foreground text-xs tabular-nums">
              {formatDistanceToNow(new Date(s.updatedAt ?? s.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
