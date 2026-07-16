import { CheckCircle2, Circle, ServerCog } from 'lucide-react'

import { useSettings } from '@/api/hooks'
import { PageHeader } from '@/components/patterns/page-header'
import { QueryErrorAlert } from '@/components/patterns/query-error'
import { SectionBlock } from '@/components/patterns/section-block'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function SettingsPage() {
  const q = useSettings()

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Automation setup"
        title="Engines & platform"
        description="Read-only deployment state from GET /api/v1/settings. Secrets are never returned — configure on the backend."
      />
      {q.isError ? (
        <QueryErrorAlert error={q.error} onRetry={() => void q.refetch()} />
      ) : null}
      {q.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : null}
      {q.data ? (
        <>
          <SectionBlock title="System status">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatusPill
                label="Environment"
                value={q.data.environment}
                ready
              />
              <StatusPill
                label="Debug mode"
                value={q.data.debug ? 'on' : 'off'}
                ready={!q.data.debug}
              />
              <StatusPill
                label="Application"
                value={q.data.applicationName}
                ready
              />
            </div>
          </SectionBlock>

          <SectionBlock
            title="Coding engines"
            description="Which agent integrations are enabled for session automation."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <EngineCard
                name="Copilot agent"
                enabled={q.data.copilotAgentEnabled}
                detail="Primary engine for Sprint 2 hosted POC sessions."
              />
              <EngineCard
                name="Claude Code"
                enabled={q.data.claudeCodeEnabled}
                detail="Alternative coding provider when enabled server-side."
              />
              <Card className="border-border/70 bg-surface md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Coding provider</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-mono text-sm">{q.data.codingProvider}</p>
                </CardContent>
              </Card>
            </div>
          </SectionBlock>

          <SectionBlock title="Infrastructure & integrations">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-border/70 bg-surface">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ServerCog className="text-muted-foreground size-4" />
                    Workspace
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Row label="Workspace root" value={q.data.workspaceRoot} mono />
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-surface">
                <CardHeader>
                  <CardTitle className="text-base">Jira integration</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    Source system connectivity for ticket-driven sessions.
                  </p>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <IntegrationRow
                    label="Configured"
                    ready={q.data.jira.configured}
                  />
                  <IntegrationRow
                    label="Stub mode"
                    ready={!q.data.jira.useStub}
                    invert
                  />
                </CardContent>
              </Card>
            </div>
          </SectionBlock>

          {q.data.notes ? (
            <Card className="border-border/60 bg-muted/15 border-dashed shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Deployment notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {q.data.notes}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}

      <p className="text-muted-foreground text-center text-xs">
        UI editing is not wired yet. Change configuration on the backend deployment.
      </p>
    </div>
  )
}

function StatusPill({
  label,
  value,
  ready,
}: {
  label: string
  value: string
  ready: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3',
        ready
          ? 'border-status-succeeded/25 bg-status-succeeded/8'
          : 'border-status-awaiting/25 bg-status-awaiting/8',
      )}
    >
      <p className="text-muted-foreground text-xs uppercase">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  )
}

function EngineCard({
  name,
  enabled,
  detail,
}: {
  name: string
  enabled: boolean
  detail: string
}) {
  return (
    <Card
      className={cn(
        'border-border/70',
        enabled ? 'border-status-succeeded/25 bg-status-succeeded/5' : 'bg-surface',
      )}
    >
      <CardContent className="flex gap-3 p-4">
        {enabled ? (
          <CheckCircle2 className="text-status-succeeded mt-0.5 size-5 shrink-0" />
        ) : (
          <Circle className="text-muted-foreground mt-0.5 size-5 shrink-0" />
        )}
        <div>
          <p className="font-medium">{name}</p>
          <p
            className={cn(
              'text-xs font-medium uppercase',
              enabled ? 'text-status-succeeded' : 'text-muted-foreground',
            )}
          >
            {enabled ? 'Enabled' : 'Disabled'}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">{detail}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function IntegrationRow({
  label,
  ready,
  invert,
}: {
  label: string
  ready: boolean
  invert?: boolean
}) {
  const showReady = invert ? !ready : ready
  return (
    <div className="flex items-center gap-2">
      {showReady ? (
        <CheckCircle2 className="text-status-succeeded size-4" />
      ) : (
        <Circle className="text-muted-foreground size-4" />
      )}
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">
          {showReady ? 'Ready' : 'Needs attention'}
        </p>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs uppercase">{label}</p>
      <p className={cn('font-medium break-all', mono && 'font-mono text-xs')}>
        {value}
      </p>
    </div>
  )
}
