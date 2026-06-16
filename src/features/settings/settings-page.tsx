import { useSettings } from '@/api/hooks'
import { PageHeader } from '@/components/patterns/page-header'
import { QueryErrorAlert } from '@/components/patterns/query-error'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

export function SettingsPage() {
  const q = useSettings()

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Platform"
        title="Settings"
        description="Engine defaults, infrastructure, and source-system wiring. Values are read from your QSwarm deployment via GET /api/v1/settings."
      />
      {q.isError ? (
        <QueryErrorAlert error={q.error} onRetry={() => void q.refetch()} />
      ) : null}
      {q.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : null}
      {q.data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Engine preferences</CardTitle>
              <p className="text-muted-foreground text-sm">
                Default model profile and guardrails for autonomous iterations.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Default engine" value={q.data.engine.defaultEngine} />
              <Row label="Max rounds" value={String(q.data.engine.maxRounds)} />
              {q.data.engine.temperature != null ? (
                <Row
                  label="Temperature"
                  value={String(q.data.engine.temperature)}
                />
              ) : null}
              {q.data.engine.notes ? (
                <p className="text-muted-foreground leading-relaxed">
                  {q.data.engine.notes}
                </p>
              ) : null}
            </CardContent>
          </Card>
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Infrastructure</CardTitle>
              <p className="text-muted-foreground text-sm">
                Where sessions execute and how aggressively they fan out.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Provider" value={q.data.infrastructure.provider} />
              {q.data.infrastructure.region ? (
                <Row label="Region" value={q.data.infrastructure.region} />
              ) : null}
              {q.data.infrastructure.runnerImage ? (
                <Row label="Runner image" value={q.data.infrastructure.runnerImage} />
              ) : null}
              {q.data.infrastructure.concurrency != null ? (
                <Row
                  label="Concurrency"
                  value={String(q.data.infrastructure.concurrency)}
                />
              ) : null}
            </CardContent>
          </Card>
          <Card className="border-border/80 shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Source system</CardTitle>
              <p className="text-muted-foreground text-sm">
                Tickets, PRs, or chat systems that seed sessions.
              </p>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 text-sm">
                <Row label="System" value={q.data.source.system} />
                {q.data.source.apiTokenRef ? (
                  <Row label="API token ref" value={q.data.source.apiTokenRef} />
                ) : null}
              </div>
              <div className="space-y-2 text-sm">
                {q.data.source.webhookUrl ? (
                  <>
                    <p className="text-muted-foreground text-xs uppercase">
                      Webhook URL
                    </p>
                    <p className="text-foreground font-mono text-xs break-all">
                      {q.data.source.webhookUrl}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No webhook URL configured.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          {q.data.future ? (
            <Card className="border-border/80 border-dashed bg-muted/10 shadow-none lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Future runtime</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Reserved for framework and runtime hints as QSwarm evolves.
                </p>
              </CardHeader>
              <CardContent className="text-muted-foreground grid gap-3 text-sm sm:grid-cols-2">
                {q.data.future.framework ? (
                  <Row label="Framework" value={q.data.future.framework} />
                ) : null}
                {q.data.future.runtime ? (
                  <Row label="Runtime" value={q.data.future.runtime} />
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
      <Separator className="opacity-60" />
      <p className="text-muted-foreground text-center text-xs">
        Editing settings in the UI is not wired yet; use your backend or admin
        tools to change values. Mock mode applies changes in-memory only.
      </p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-muted-foreground text-xs uppercase">{label}</p>
      <p className="text-foreground font-medium">{value}</p>
    </div>
  )
}
