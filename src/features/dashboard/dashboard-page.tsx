import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import { ArrowRight, Layers, Workflow } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useDashboard, useRepoConnections } from '@/api/hooks'
import { PageHeader } from '@/components/patterns/page-header'
import { QueryErrorAlert } from '@/components/patterns/query-error'
import { SessionStatusBadge } from '@/components/patterns/status-badges'
import { LinkButton } from '@/components/ui/link-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardPage() {
  const dashboard = useDashboard()
  const repos = useRepoConnections()

  const repoName = (id: string) =>
    repos.data?.find((r) => r.id === id)?.displayName ??
    repos.data?.find((r) => r.id === id)?.repoName ??
    id

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Overview"
        title="Control surface"
        description="Monitor sessions, repository wiring, and review throughput from one place—no Postman required."
        actions={
          <LinkButton to="/sessions">
            Open sessions
            <ArrowRight className="size-4" />
          </LinkButton>
        }
      />

      {dashboard.isError ? (
        <QueryErrorAlert
          error={dashboard.error}
          onRetry={() => void dashboard.refetch()}
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {dashboard.isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-border/80">
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-9 w-16" />
                </CardContent>
              </Card>
            ))
          : null}
        {dashboard.data ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="border-border/80 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-muted-foreground text-sm font-medium">
                    Active pipeline
                  </CardTitle>
                  <Workflow className="text-muted-foreground size-4" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold tracking-tight">
                    {(dashboard.data.sessionCounts.running ?? 0) +
                      (dashboard.data.sessionCounts.queued ?? 0)}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Queued + running sessions
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-border/80 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-muted-foreground text-sm font-medium">
                    Needs attention
                  </CardTitle>
                  <Layers className="text-muted-foreground size-4" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold tracking-tight">
                    {dashboard.data.sessionCounts.awaiting_review ?? 0}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Sessions awaiting human review
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="border-border/80 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-muted-foreground text-sm font-medium">
                    Shipped (30d roll-up)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold tracking-tight">
                    {dashboard.data.sessionCounts.succeeded ?? 0}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Successful completions (mock aggregate)
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Status mix</CardTitle>
              <p className="text-muted-foreground text-sm">
                Distribution across session lifecycle
              </p>
            </div>
            <LinkButton variant="ghost" size="sm" to="/sessions">
              View all
            </LinkButton>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {dashboard.data
              ? Object.entries(dashboard.data.sessionCounts).map(([k, v]) => (
                  <div
                    key={k}
                    className="bg-muted/40 border-border/60 flex min-w-[120px] flex-1 items-center justify-between gap-2 rounded-xl border px-3 py-2"
                  >
                    <SessionStatusBadge status={k as never} />
                    <span className="text-lg font-semibold tabular-nums">{v}</span>
                  </div>
                ))
              : null}
            {dashboard.isLoading ? (
              <Skeleton className="h-24 w-full rounded-xl" />
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent sessions</CardTitle>
            <p className="text-muted-foreground text-sm">
              Fast jump-in for triage and approvals
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : null}
            {dashboard.data?.recentSessions.map((s) => (
              <Link
                key={s.id}
                to={`/sessions/${s.id}`}
                className="border-border/70 bg-card hover:border-primary/30 hover:bg-muted/30 flex flex-col gap-2 rounded-xl border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium tracking-tight">
                    {s.sourceLabel ?? s.sourceRef}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {repoName(s.repoConnectionId)} · {s.engine}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SessionStatusBadge status={s.status} />
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(s.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/80 border-dashed bg-muted/10 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Repository connections</CardTitle>
            <p className="text-muted-foreground text-sm">
              Wire providers, default branches, and auth references.
            </p>
          </CardHeader>
          <CardContent>
            <LinkButton variant="secondary" className="w-full" to="/repo-connections">
              Configure
            </LinkButton>
          </CardContent>
        </Card>
        <Card className="border-border/80 border-dashed bg-muted/10 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Branch policies</CardTitle>
            <p className="text-muted-foreground text-sm">
              Naming patterns and PR templates for automation.
            </p>
          </CardHeader>
          <CardContent>
            <LinkButton variant="secondary" className="w-full" to="/branch-policies">
              Configure
            </LinkButton>
          </CardContent>
        </Card>
        <Card className="border-border/80 border-dashed bg-muted/10 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Engines & infra</CardTitle>
            <p className="text-muted-foreground text-sm">
              Tune defaults for engines, runners, and source systems.
            </p>
          </CardHeader>
          <CardContent>
            <LinkButton variant="secondary" className="w-full" to="/settings">
              Open settings
            </LinkButton>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
