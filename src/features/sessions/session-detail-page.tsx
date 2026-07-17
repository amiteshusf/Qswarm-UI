import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  ChevronDown,
  CircleDot,
  FileDiff,
  History,
  Loader2,
} from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { formatErrorForToast } from '@/api/errors'
import {
  useApproveSession,
  useCreatePr,
  useRepoConnections,
  useRequestRevision,
  useSession,
  useStartSession,
} from '@/api/hooks'
import { FormField } from '@/components/patterns/form-field'
import { QueryErrorAlert } from '@/components/patterns/query-error'
import {
  ExecutionStatusBadge,
  SessionStatusBadge,
} from '@/components/patterns/status-badges'
import { WorkflowStrip } from '@/components/patterns/workflow-strip'
import { LinkButton } from '@/components/ui/link-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { SessionNextAction } from '@/features/sessions/session-next-action'
import {
  friendlyPatchLabel,
  friendlyRoundTitle,
  friendlyValidationLabel,
  getHeroSummary,
} from '@/features/sessions/session-lifecycle'
import { cn } from '@/lib/utils'

export function SessionDetailPage() {
  const { id = '' } = useParams()
  const q = useSession(id)
  const repos = useRepoConnections()
  const start = useStartSession(id)
  const revision = useRequestRevision(id)
  const approve = useApproveSession(id)
  const createPr = useCreatePr(id)

  const [revOpen, setRevOpen] = useState(false)
  const [prOpen, setPrOpen] = useState(false)
  const [evidenceOpen, setEvidenceOpen] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [scope, setScope] = useState('')

  const repoName =
    repos.data?.find((r) => r.id === q.data?.repoConnectionId)?.displayName ??
    repos.data?.find((r) => r.id === q.data?.repoConnectionId)?.repoName ??
    q.data?.repoConnectionId ??
    'Repository'

  const longRunning = start.isPending || revision.isPending
  const repoId = q.data?.repoConnectionId?.trim() ?? ''
  const latestPatch = q.data?.patches[q.data.patches.length - 1]

  async function submitRevision() {
    try {
      await revision.mutateAsync({ instruction, scope: scope || undefined })
      toast.success('Change request sent')
      setRevOpen(false)
      setInstruction('')
      setScope('')
    } catch (e) {
      toast.error(formatErrorForToast(e))
    }
  }

  async function submitApprove() {
    try {
      await approve.mutateAsync()
      toast.success('Output approved')
    } catch (e) {
      toast.error(formatErrorForToast(e))
    }
  }

  async function submitPr() {
    if (!repoId) {
      toast.error('No repository linked to this run.')
      return
    }
    try {
      const updated = await createPr.mutateAsync(repoId)
      toast.success(
        updated.prExternalUrl ? 'Pull request published' : 'Publish completed',
        updated.prExternalUrl ? { description: updated.prExternalUrl } : undefined,
      )
      setPrOpen(false)
    } catch (e) {
      toast.error(formatErrorForToast(e))
    }
  }

  return (
    <div className="space-y-6">
      {q.isError ? (
        <QueryErrorAlert error={q.error} onRetry={() => void q.refetch()} />
      ) : null}

      {q.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : null}

      {q.data ? (
        <>
          {longRunning ? (
            <div
              className="border-swarm/30 bg-swarm/8 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm"
              role="status"
            >
              <Loader2 className="text-swarm mt-0.5 size-4 shrink-0 animate-spin" />
              <div className="space-y-1">
                <p className="font-medium">
                  {start.isPending
                    ? 'Starting automation — this runs on the server'
                    : 'Applying your feedback — the agent is revising changes'}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  This can take <strong>5–15+ minutes</strong> on hosted
                  infrastructure. Keep this tab open.
                </p>
              </div>
            </div>
          ) : null}

          {/* 1. Hero status & summary */}
          <div className="border-border/70 bg-surface-raised space-y-4 rounded-2xl border p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-3">
                <p className="text-swarm text-xs font-semibold tracking-widest uppercase">
                  Automation run
                </p>
                <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
                  {q.data.sourceLabel ?? q.data.sourceRef}
                </h1>
                <SessionStatusBadge
                  status={q.data.status}
                  workflowStatus={q.data.workflowStatus}
                  prExternalUrl={q.data.prExternalUrl}
                />
                <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
                  {getHeroSummary(q.data)}
                </p>
                <p className="text-muted-foreground text-xs">
                  {repoName} · updated{' '}
                  {formatDistanceToNow(new Date(q.data.updatedAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <LinkButton variant="ghost" size="sm" to="/sessions" className="shrink-0">
                ← All runs
              </LinkButton>
            </div>
            <WorkflowStrip
              status={q.data.status}
              workflowStatus={q.data.workflowStatus}
              prExternalUrl={q.data.prExternalUrl}
            />
          </div>

          {/* 2. What changed */}
          <Card className="border-border/70 bg-surface shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileDiff className="text-muted-foreground size-5" />
                What changed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed">
                {q.data.patchSummary ??
                  'A summary of code changes will appear here after the agent produces a diff.'}
              </p>
              {latestPatch ? (
                <p className="text-muted-foreground text-xs">
                  Latest {friendlyPatchLabel(latestPatch.version)}
                  {latestPatch.filesChanged != null
                    ? ` · ${latestPatch.filesChanged} files touched`
                    : ''}
                </p>
              ) : null}
            </CardContent>
          </Card>

          {/* 3. Validation result */}
          <Card className="border-border/70 bg-surface shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Validation result</CardTitle>
              <p className="text-muted-foreground text-sm">
                Plain-language outcome from the latest test run.
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/20 border-border/60 rounded-xl border p-4">
                <p className="text-sm leading-relaxed">
                  {q.data.latestExecutionSummary ??
                    'No validation results yet. Start automation or wait for the agent to finish.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 4. Next action — gated */}
          <SessionNextAction
            session={q.data}
            repoId={repoId}
            startPending={start.isPending}
            approvePending={approve.isPending}
            createPrPending={createPr.isPending}
            onStart={() =>
              void start
                .mutateAsync(
                  repoId ? { repositoryConnectionId: repoId } : undefined,
                )
                .then(() => toast.success('Automation started'))
                .catch((e) => toast.error(formatErrorForToast(e)))
            }
            onRequestChanges={() => setRevOpen(true)}
            onApprove={() => void submitApprove()}
            onCreatePr={() => setPrOpen(true)}
          />

          {/* 5. Supporting evidence — collapsed */}
          <Card className="border-border/60 shadow-sm">
            <button
              type="button"
              onClick={() => setEvidenceOpen((o) => !o)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-2">
                <History className="text-muted-foreground size-4" />
                <span className="font-medium">Supporting evidence</span>
                <span className="text-muted-foreground text-xs">
                  Feedback history & run timeline
                </span>
              </div>
              <ChevronDown
                className={cn(
                  'text-muted-foreground size-4 transition-transform',
                  evidenceOpen && 'rotate-180',
                )}
              />
            </button>
            {evidenceOpen ? (
              <CardContent className="space-y-6 border-t pt-4">
                <div>
                  <p className="mb-3 text-sm font-medium">Your feedback</p>
                  {q.data.reviews.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No change requests yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {q.data.reviews.map((rev) => (
                        <div
                          key={rev.id}
                          className="border-border/60 rounded-lg border bg-surface-raised p-3"
                        >
                          <p className="text-muted-foreground mb-1 text-xs">
                            {formatDistanceToNow(new Date(rev.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                          <p className="text-sm leading-relaxed">
                            {rev.instruction}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="mb-3 text-sm font-medium">Run timeline</p>
                  {q.data.rounds.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      Timeline appears after automation begins.
                    </p>
                  ) : (
                    <div className="relative space-y-4">
                      <div className="bg-border absolute top-2 bottom-2 left-[11px] w-px" />
                      {q.data.rounds.map((r, idx) => (
                        <motion.div
                          key={r.id}
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="relative flex gap-3 pl-8"
                        >
                          <div className="absolute top-0.5 left-0 flex size-6 items-center justify-center rounded-full border bg-card">
                            {r.status === 'complete' ? (
                              <CheckCircle2 className="text-status-succeeded size-3.5" />
                            ) : (
                              <CircleDot className="text-swarm size-3.5" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {friendlyRoundTitle(r.number, r.title)}
                            </p>
                            {r.notes ? (
                              <p className="text-muted-foreground text-sm">
                                {r.notes}
                              </p>
                            ) : null}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            ) : null}
          </Card>

          {/* 6. Advanced — tabs */}
          <Tabs defaultValue="technical" className="w-full">
            <TabsList className="bg-muted/40 h-auto flex-wrap justify-start gap-1 rounded-xl p-1">
              <TabsTrigger value="technical" className="rounded-lg text-xs">
                Technical details
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-lg text-xs">
                Validation history
              </TabsTrigger>
              <TabsTrigger value="metadata" className="rounded-lg text-xs">
                Metadata
              </TabsTrigger>
              <TabsTrigger value="debug" className="rounded-lg text-xs">
                Raw data
              </TabsTrigger>
            </TabsList>

            <TabsContent value="technical" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Code revisions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {q.data.patches.length === 0 ? (
                    <p className="text-muted-foreground text-sm">None yet.</p>
                  ) : (
                    q.data.patches.map((p) => (
                      <div
                        key={p.id}
                        className="flex justify-between rounded-lg bg-muted/20 px-3 py-2 text-sm"
                      >
                        <span>{friendlyPatchLabel(p.version)}</span>
                        <span className="text-muted-foreground text-xs">
                          {p.filesChanged != null
                            ? `${p.filesChanged} files`
                            : 'Pending'}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Validation runs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {q.data.executions.length === 0 ? (
                    <p className="text-muted-foreground text-sm">None yet.</p>
                  ) : (
                    q.data.executions.map((ex) => (
                      <div
                        key={ex.id}
                        className="border-border/60 flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {friendlyValidationLabel(ex.roundNumber)}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {ex.summary ?? 'No summary.'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <ExecutionStatusBadge status={ex.status} />
                          {ex.exitCode != null ? (
                            <span className="text-muted-foreground font-mono text-xs">
                              exit {ex.exitCode}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metadata" className="mt-4">
              <Card>
                <CardContent className="grid gap-4 p-4 text-sm sm:grid-cols-2">
                  <MetaRow label="Source reference" value={q.data.sourceRef} mono />
                  {q.data.sourceLabel ? (
                    <MetaRow label="Source label" value={q.data.sourceLabel} />
                  ) : null}
                  <MetaRow label="Repository" value={repoName} />
                  <MetaRow label="Coding engine" value={q.data.engine} mono />
                  {q.data.workflowStatus ? (
                    <MetaRow
                      label="Workflow state (API)"
                      value={q.data.workflowStatus}
                      mono
                    />
                  ) : null}
                  <MetaRow
                    label="Created"
                    value={formatDistanceToNow(new Date(q.data.createdAt), {
                      addSuffix: true,
                    })}
                  />
                </CardContent>
              </Card>
              {(q.data.prPreviewTitle || q.data.prPreviewBody) &&
              !q.data.prExternalUrl ? (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-base">PR preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <MetaRow
                      label="Title"
                      value={q.data.prPreviewTitle ?? 'Generated server-side'}
                    />
                    <div>
                      <p className="text-muted-foreground text-xs">Body</p>
                      <p className="text-muted-foreground mt-1 max-h-40 overflow-auto whitespace-pre-wrap text-xs">
                        {q.data.prPreviewBody ?? '—'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>

            <TabsContent value="debug" className="mt-4">
              <pre className="bg-muted/30 border-border/60 max-h-[480px] overflow-auto rounded-xl border p-4 text-[11px] leading-relaxed">
                {JSON.stringify(q.data, null, 2)}
              </pre>
            </TabsContent>
          </Tabs>
        </>
      ) : null}

      <Dialog open={revOpen} onOpenChange={setRevOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request changes</DialogTitle>
            <DialogDescription>
              Tell the agent what to fix. Be specific — QA context helps more
              than keywords.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <FormField id="instruction" label="What should change?">
              <Textarea
                id="instruction"
                rows={5}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
              />
            </FormField>
            <FormField
              id="scope"
              label="Focus area (optional)"
              hint="e.g. packages/api or checkout flow"
            >
              <Input
                id="scope"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRevOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!instruction.trim() || revision.isPending}
              onClick={() => void submitRevision()}
              className="gap-1.5"
            >
              {revision.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Send to agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={prOpen} onOpenChange={setPrOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish pull request</DialogTitle>
            <DialogDescription>
              Confirm the title and description QSwarm will use on GitHub.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase">Title</p>
              <p className="font-medium">
                {q.data?.prPreviewTitle ?? 'Generated server-side.'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase">Description</p>
              <div className="bg-muted/30 border-border/60 mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border p-3 text-sm leading-relaxed">
                {q.data?.prPreviewBody ??
                  'From your branch policy and run metadata.'}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPrOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={createPr.isPending || !repoId}
              className="gap-1.5"
              onClick={() => void submitPr()}
            >
              {createPr.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Publishing…
                </>
              ) : (
                'Confirm & publish'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MetaRow({
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
