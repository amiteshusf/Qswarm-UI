import { useBranchPolicies } from '@/api/hooks'
import { PageHeader } from '@/components/patterns/page-header'
import { QueryErrorAlert } from '@/components/patterns/query-error'
import { LinkButton } from '@/components/ui/link-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function BranchPoliciesPage() {
  const q = useBranchPolicies()

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Automation"
        title="Branch policies"
        description="Define how QSwarm names branches and opens pull requests so output matches your team's conventions."
        actions={
          <LinkButton to="/branch-policies/new">New policy</LinkButton>
        }
      />
      {q.isError ? (
        <QueryErrorAlert error={q.error} onRetry={() => void q.refetch()} />
      ) : null}
      <div className="grid gap-4">
        {q.isLoading
          ? Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))
          : null}
        {q.data?.map((p) => (
          <Card
            key={p.id}
            className="border-border/80 hover:border-primary/25 transition-colors"
          >
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-lg">{p.name}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Base <span className="text-foreground font-medium">{p.baseBranch}</span>{' '}
                  · pattern{' '}
                  <span className="text-foreground font-mono text-xs">{p.branchPattern}</span>
                </p>
              </div>
              <LinkButton variant="outline" size="sm" to={`/branch-policies/${p.id}`}>
                Edit
              </LinkButton>
            </CardHeader>
            <CardContent className="text-muted-foreground grid gap-3 text-sm">
              <div>
                <p className="text-xs font-medium tracking-wide uppercase">
                  PR title template
                </p>
                <p className="text-foreground font-mono text-xs">{p.prTitleTemplate}</p>
              </div>
              <div>
                <p className="text-xs font-medium tracking-wide uppercase">
                  PR body template
                </p>
                <p className="text-foreground whitespace-pre-wrap font-mono text-xs">
                  {p.prBodyTemplate}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
