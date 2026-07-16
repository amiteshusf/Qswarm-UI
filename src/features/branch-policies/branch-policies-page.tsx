import { useBranchPolicies, useRepoConnections } from '@/api/hooks'
import { PageHeader } from '@/components/patterns/page-header'
import { QueryErrorAlert } from '@/components/patterns/query-error'
import { SectionBlock } from '@/components/patterns/section-block'
import { LinkButton } from '@/components/ui/link-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { GitBranch, ListTree, Plus } from 'lucide-react'

export function BranchPoliciesPage() {
  const q = useBranchPolicies()
  const repos = useRepoConnections()

  const repoLabel = (id: string) => {
    const r = repos.data?.find((x) => x.id === id)
    return r?.displayName ?? (r ? `${r.ownerOrOrg}/${r.repoName}` : id)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Automation setup"
        title="Branch policies"
        description="Define how QSwarm names branches and opens pull requests — templates apply when sessions create PRs."
        actions={
          <LinkButton to="/branch-policies/new">
            <Plus className="size-4" />
            New policy
          </LinkButton>
        }
      />
      {q.isError ? (
        <QueryErrorAlert error={q.error} onRetry={() => void q.refetch()} />
      ) : null}

      <SectionBlock
        title="Policy catalog"
        description={`${q.data?.length ?? 0} policies configured for PR automation.`}
      >
        <div className="grid gap-4">
          {q.isLoading
            ? Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-44 w-full rounded-xl" />
              ))
            : null}
          {!q.isLoading && !q.data?.length ? (
            <Card className="border-dashed bg-muted/10 shadow-none">
              <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                <div className="bg-muted flex size-12 items-center justify-center rounded-2xl">
                  <ListTree className="text-muted-foreground size-6" />
                </div>
                <p className="font-medium">No branch policies yet</p>
                <p className="text-muted-foreground max-w-sm text-sm">
                  Policies control branch naming and PR title/body templates per repository.
                </p>
                <LinkButton to="/branch-policies/new">Create policy</LinkButton>
              </CardContent>
            </Card>
          ) : null}
          {q.data?.map((p) => (
            <Card
              key={p.id}
              className="border-border/70 bg-surface hover:border-swarm/30 transition-colors"
            >
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="bg-swarm/10 text-swarm flex size-10 shrink-0 items-center justify-center rounded-xl">
                    <ListTree className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-1 text-sm">
                      <GitBranch className="size-3.5" />
                      <span>{repoLabel(p.repoConnectionId ?? '')}</span>
                      <span>·</span>
                      base{' '}
                      <span className="text-foreground font-mono text-xs">
                        {p.baseBranch}
                      </span>
                    </p>
                  </div>
                </div>
                <LinkButton variant="outline" size="sm" to={`/branch-policies/${p.id}`}>
                  Edit
                </LinkButton>
              </CardHeader>
              <CardContent>
                <div className="border-border/60 bg-muted/15 grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
                  <TemplateBlock
                    label="Branch pattern"
                    value={p.branchPattern}
                    mono
                  />
                  <TemplateBlock label="PR title template" value={p.prTitleTemplate} mono />
                  <TemplateBlock
                    label="PR body template"
                    value={p.prBodyTemplate}
                    mono
                    className="sm:col-span-2"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionBlock>
    </div>
  )
}

function TemplateBlock({
  label,
  value,
  mono,
  className,
}: {
  label: string
  value: string
  mono?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      <p
        className={
          mono
            ? 'text-foreground font-mono text-xs leading-relaxed'
            : 'text-foreground text-sm leading-relaxed'
        }
      >
        {value}
      </p>
    </div>
  )
}
