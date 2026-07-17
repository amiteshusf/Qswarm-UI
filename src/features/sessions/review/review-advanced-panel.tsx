import { formatDistanceToNow } from 'date-fns'

import type { SessionDetail } from '@/api/schemas'
import { ExecutionStatusBadge } from '@/components/patterns/status-badges'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  friendlyPatchLabel,
  friendlyRoundTitle,
  friendlyValidationLabel,
} from '@/features/sessions/session-lifecycle'
import { cn } from '@/lib/utils'

type Props = {
  session: SessionDetail
  repoName: string
}

export function ReviewAdvancedPanel({ session, repoName }: Props) {
  return (
    <Tabs defaultValue="history" className="w-full">
      <TabsList className="bg-muted/40 h-auto flex-wrap justify-start gap-1 rounded-xl p-1">
        <TabsTrigger value="history" className="rounded-lg text-xs">
          History
        </TabsTrigger>
        <TabsTrigger value="metadata" className="rounded-lg text-xs">
          Metadata
        </TabsTrigger>
        <TabsTrigger value="debug" className="rounded-lg text-xs">
          Raw data
        </TabsTrigger>
      </TabsList>

      <TabsContent value="history" className="mt-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Run timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {session.rounds.length === 0 ? (
              <p className="text-muted-foreground">No rounds yet.</p>
            ) : (
              session.rounds.map((r) => (
                <div
                  key={r.id}
                  className="border-border/50 rounded-lg border px-3 py-2"
                >
                  <p className="font-medium">
                    {friendlyRoundTitle(r.number, r.title)}
                  </p>
                  {r.notes ? (
                    <p className="text-muted-foreground text-xs">{r.notes}</p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Validation history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {session.executions.map((ex) => (
              <div
                key={ex.id}
                className="flex items-center justify-between text-sm"
              >
                <span>{friendlyValidationLabel(ex.roundNumber)}</span>
                <ExecutionStatusBadge status={ex.status} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Code revisions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {session.patches.map((p) => (
              <div key={p.id} className="flex justify-between">
                <span>{friendlyPatchLabel(p.version)}</span>
                <span className="text-muted-foreground text-xs">
                  {p.filesChanged ?? '?'} files
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="metadata" className="mt-4">
        <Card>
          <CardContent className="grid gap-4 p-4 text-sm sm:grid-cols-2">
            <Row label="Source reference" value={session.sourceRef} mono />
            {session.sourceLabel ? (
              <Row label="Source label" value={session.sourceLabel} />
            ) : null}
            <Row label="Repository" value={repoName} />
            <Row label="Coding engine" value={session.engine} mono />
            {session.workflowStatus ? (
              <Row label="Workflow state (API)" value={session.workflowStatus} mono />
            ) : null}
            <Row
              label="Created"
              value={formatDistanceToNow(new Date(session.createdAt), {
                addSuffix: true,
              })}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="debug" className="mt-4">
        <pre className="bg-muted/30 border-border/60 max-h-[400px] overflow-auto rounded-xl border p-4 text-[11px]">
          {JSON.stringify(session, null, 2)}
        </pre>
      </TabsContent>
    </Tabs>
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
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={cn('font-medium', mono && 'font-mono text-xs')}>{value}</p>
    </div>
  )
}
