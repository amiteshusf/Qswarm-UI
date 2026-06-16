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
        description="Read-only slice from GET /api/v1/settings. Values reflect how this deployment is configured; secrets are never returned."
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
              <CardTitle className="text-lg">Application</CardTitle>
              <p className="text-muted-foreground text-sm">
                Identity and runtime flags for this backend instance.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Application" value={q.data.applicationName} />
              <Row label="Environment" value={q.data.environment} />
              <Row label="Debug mode" value={q.data.debug ? 'on' : 'off'} />
              <Row label="Workspace root" value={q.data.workspaceRoot} />
            </CardContent>
          </Card>
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Coding &amp; agents</CardTitle>
              <p className="text-muted-foreground text-sm">
                Which coding provider and agent integrations are enabled server-side.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Coding provider" value={q.data.codingProvider} />
              <Row
                label="Claude Code"
                value={q.data.claudeCodeEnabled ? 'enabled' : 'disabled'}
              />
              <Row
                label="Copilot agent"
                value={q.data.copilotAgentEnabled ? 'enabled' : 'disabled'}
              />
            </CardContent>
          </Card>
          <Card className="border-border/80 shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Jira</CardTitle>
              <p className="text-muted-foreground text-sm">
                Whether Jira is configured and whether the deployment uses a stub.
              </p>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Row
                label="Stub mode"
                value={q.data.jira.useStub ? 'yes' : 'no'}
              />
              <Row
                label="Configured"
                value={q.data.jira.configured ? 'yes' : 'no'}
              />
            </CardContent>
          </Card>
          {q.data.notes ? (
            <Card className="border-border/80 bg-muted/10 shadow-none lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {q.data.notes}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
      <Separator className="opacity-60" />
      <p className="text-muted-foreground text-center text-xs">
        Editing settings in the UI is not wired yet; change configuration on the
        backend. Mock mode uses an in-memory slice that matches this response
        shape.
      </p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-muted-foreground text-xs uppercase">{label}</p>
      <p className="text-foreground font-medium break-all">{value}</p>
    </div>
  )
}
