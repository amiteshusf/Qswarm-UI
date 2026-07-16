import { formatDistanceToNow } from 'date-fns'
import { GitBranch, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useBranchPolicies, useRepoConnections } from '@/api/hooks'
import { PageHeader } from '@/components/patterns/page-header'
import { QueryErrorAlert } from '@/components/patterns/query-error'
import { SectionBlock } from '@/components/patterns/section-block'
import { LinkButton } from '@/components/ui/link-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function RepoConnectionsPage() {
  const q = useRepoConnections()
  const policies = useBranchPolicies()

  const policyCountForRepo = (repoId: string) =>
    policies.data?.filter((p) => p.repoConnectionId === repoId).length ?? 0

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Automation setup"
        title="Repositories"
        description="Connect where code lives. Each connection is a clone target with provider, org, repo, and auth reference."
        actions={
          <LinkButton to="/repo-connections/new">
            <Plus className="size-4" />
            New connection
          </LinkButton>
        }
      />

      {q.isError ? (
        <QueryErrorAlert error={q.error} onRetry={() => void q.refetch()} />
      ) : null}

      <SectionBlock
        title="Connection catalog"
        description={`${q.data?.length ?? 0} repositories wired for session automation.`}
      >
        <div className="grid gap-4">
          {q.isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-36 w-full rounded-xl" />
              ))
            : null}
          {!q.isLoading && !q.data?.length ? (
            <Card className="border-dashed bg-muted/10 shadow-none">
              <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                <div className="bg-muted flex size-12 items-center justify-center rounded-2xl">
                  <GitBranch className="text-muted-foreground size-6" />
                </div>
                <p className="font-medium">No repositories connected</p>
                <p className="text-muted-foreground max-w-sm text-sm">
                  Add your first connection before creating sessions.
                </p>
                <LinkButton to="/repo-connections/new">Connect repository</LinkButton>
              </CardContent>
            </Card>
          ) : null}
          {q.data?.map((r) => {
            const policyCount = policyCountForRepo(r.id)
            return (
              <Card
                key={r.id}
                className="border-border/70 bg-surface hover:border-swarm/30 transition-colors"
              >
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="bg-swarm/10 text-swarm flex size-10 shrink-0 items-center justify-center rounded-xl">
                      <GitBranch className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {r.displayName ?? `${r.ownerOrOrg}/${r.repoName}`}
                      </CardTitle>
                      <p className="text-muted-foreground mt-1 text-sm">
                        <span className="text-foreground font-medium">{r.provider}</span>
                        {' · '}
                        {r.ownerOrOrg}/{r.repoName}
                        {' · '}
                        default{' '}
                        <span className="font-mono text-xs">{r.defaultBranch}</span>
                      </p>
                      {r.updatedAt ? (
                        <p className="text-muted-foreground mt-1 text-xs">
                          Updated{' '}
                          {formatDistanceToNow(new Date(r.updatedAt), {
                            addSuffix: true,
                          })}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <LinkButton variant="outline" size="sm" to={`/repo-connections/${r.id}`}>
                    Edit
                  </LinkButton>
                </CardHeader>
                <CardContent>
                  <div className="border-border/60 bg-muted/15 grid gap-4 rounded-xl border p-4 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
                        Auth reference
                      </p>
                      {r.credentialReference == null ? (
                        <p className="text-muted-foreground text-xs italic">Not set</p>
                      ) : (
                        <p className="font-mono text-xs">{r.credentialReference}</p>
                      )}
                    </div>
                    {r.cloneUrl ? (
                      <div className="sm:col-span-2">
                        <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
                          Clone URL
                        </p>
                        <p className="font-mono text-xs break-all">{r.cloneUrl}</p>
                      </div>
                    ) : null}
                    <div>
                      <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
                        Branch policies
                      </p>
                      <Link
                        to="/branch-policies"
                        className={cn(
                          'text-sm font-medium',
                          policyCount > 0 ? 'text-swarm hover:underline' : 'text-muted-foreground',
                        )}
                      >
                        {policyCount > 0
                          ? `${policyCount} linked`
                          : 'None — add a policy'}
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </SectionBlock>
    </div>
  )
}
