import { useRepoConnections } from '@/api/hooks'
import { PageHeader } from '@/components/patterns/page-header'
import { QueryErrorAlert } from '@/components/patterns/query-error'
import { LinkButton } from '@/components/ui/link-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function RepoConnectionsPage() {
  const q = useRepoConnections()

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Integrations"
        title="Repository connections"
        description="Tell QSwarm where code lives. Provider, org, repo, default branch, and an auth reference your platform team already provisioned."
        actions={
          <LinkButton to="/repo-connections/new">New connection</LinkButton>
        }
      />
      {q.isError ? (
        <QueryErrorAlert error={q.error} onRetry={() => void q.refetch()} />
      ) : null}
      <div className="grid gap-4">
        {q.isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))
          : null}
        {q.data?.map((r) => (
          <Card
            key={r.id}
            className="border-border/80 hover:border-primary/25 transition-colors"
          >
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-lg">
                  {r.displayName ?? `${r.owner}/${r.repo}`}
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  {r.provider.toUpperCase()} · {r.owner}/{r.repo} · default{' '}
                  <span className="text-foreground font-medium">{r.defaultBranch}</span>
                </p>
              </div>
              <LinkButton variant="outline" size="sm" to={`/repo-connections/${r.id}`}>
                Edit
              </LinkButton>
            </CardHeader>
            <CardContent className="text-muted-foreground grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium tracking-wide uppercase">
                  Auth reference
                </p>
                <p className="text-foreground font-mono text-xs">{r.authRef}</p>
              </div>
              {r.cloneUrl ? (
                <div>
                  <p className="text-xs font-medium tracking-wide uppercase">
                    Clone URL
                  </p>
                  <p className="text-foreground font-mono text-xs break-all">
                    {r.cloneUrl}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
