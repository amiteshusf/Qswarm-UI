import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  FileDiff,
  GitPullRequest,
  History,
  Loader2,
  Play,
  ShieldCheck,
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
import { PageHeader } from '@/components/patterns/page-header'
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
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { sessionActionHints } from '@/features/sessions/session-actions'
import { cn } from '@/lib/utils'

function sectionEmpty(message: string) {
  return (
    <p className="text-muted-foreground border-border/50 bg-muted/15 rounded-lg border border-dashed px-4 py-8 text-center text-sm">
      {message}
    </p>
  )
}

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
  const [debugOpen, setDebugOpen] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [scope, setScope] = useState('')

  const repoName =
    repos.data?.find((r) => r.id === q.data?.repoConnectionId)?.displayName ??
    repos.data?.find((r) => r.id === q.data?.repoConnectionId)?.repoName ??
    q.data?.repoConnectionId ??
    'Repository'

  const hints = q.data ? sessionActionHints(q.data) : null
  const longRunning = start.isPending || revision.isPending

  async function submitRevision() {
    try {
      await revision.mutateAsync({ instruction, scope: scope || undefined })
      toast.success('Revision requested')
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
      toast.success('Session approved')
    } catch (e) {
      toast.error(formatErrorForToast(e))
    }
  }

  const repoId = q.data?.repoConnectionId?.trim() ?? ''

  async function submitPr() {
    if (!repoId) {
      toast.error('This session has no repository connection id; cannot create a PR.')
      return
    }
    try {
      const updated = await createPr.mutateAsync(repoId)
      toast.success(
        updated.prExternalUrl ? 'Pull request created' : 'Pull request creation completed',
        updated.prExternalUrl
          ? { description: updated.prExternalUrl }
          : undefined,
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
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
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
                    ? 'Starting session — server-side orchestration in progress'
                    : 'Requesting revision — agent is regenerating changes'}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Clone, bootstrap, Copilot CLI, and Playwright can take{' '}
                  <strong>5–15+ minutes</strong> on hosted Render. Keep this tab
                  open; the page updates when the API responds.
                </p>
              </div>
            </div>
          ) : null}

          {/* Review cockpit header */}
          <div className="border-border/70 bg-surface-raised space-y-5 rounded-2xl border p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-3">
                <PageHeader
                  compact
                  eyebrow="Session review"
                  title={q.data.sourceLabel ?? q.data.sourceRef}
                  description={`${repoName} · ${q.data.engine} · updated ${formatDistanceToNow(new Date(q.data.updatedAt), { addSuffix: true })}`}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <SessionStatusBadge status={q.data.status} />
                  {q.data.workflowStatus &&
                  q.data.workflowStatus !== q.data.status ? (
                    <span className="text-muted-foreground rounded-full border border-border/60 bg-muted/30 px-2.5 py-0.5 font-mono text-xs">
                      {q.data.workflowStatus}
                    </span>
                  ) : null}
                </div>
              </div>
              <LinkButton variant="ghost" size="sm" to="/sessions" className="shrink-0">
                ← All sessions
              </LinkButton>
            </div>

            <WorkflowStrip
              status={q.data.status}
              workflowStatus={q.data.workflowStatus}
            />

            {/* Sticky action bar */}
            <div className="border-border/60 bg-muted/20 flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Workflow actions
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={start.isPending || !hints?.canStart}
                  title={
                    hints?.canStart
                      ? 'Materialize workspace and run the first automation round'
                      : 'Start is only available while the session is in draft or queued.'
                  }
                  className="gap-1.5"
                  onClick={() =>
                    void start
                      .mutateAsync(
                        repoId
                          ? { repositoryConnectionId: repoId }
                          : undefined,
                      )
                      .then(() => toast.success('Session started'))
                      .catch((e) => toast.error(formatErrorForToast(e)))
                  }
                >
                  {start.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Play className="size-4" />
                  )}
                  {start.isPending ? 'Starting…' : 'Start'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hints?.canRevise || revision.isPending}
                  onClick={() => setRevOpen(true)}
                  className="gap-1.5"
                >
                  Request revision
                </Button>
                <Separator orientation="vertical" className="hidden h-8 sm:block" />
                <Button
                  variant="default"
                  size="sm"
                  disabled={approve.isPending || !hints?.canApprove}
                  className="bg-swarm text-swarm-foreground hover:bg-swarm/90 gap-1.5"
                  onClick={() => void submitApprove()}
                >
                  {approve.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="size-4" />
                  )}
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    createPr.isPending || !hints?.canCreatePr || !repoId
                  }
                  onClick={() => setPrOpen(true)}
                  className="gap-1.5"
                >
                  <GitPullRequest className="size-4" />
                  Create PR
                </Button>
              </div>
            </div>
          </div>

          {q.data.prExternalUrl ? (
            <Card className="border-status-succeeded/30 bg-status-succeeded/8 shadow-sm">
              <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Pull request shipped</p>
                  <p className="text-muted-foreground text-xs">
                    {q.data.prStatus ?? 'created'}
                    {q.data.prExternalId ? ` · #${q.data.prExternalId}` : ''}
                  </p>
                </div>
                <a
                  href={q.data.prExternalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-swarm text-sm font-medium underline-offset-4 hover:underline"
                >
                  Open on GitHub →
                </a>
              </CardContent>
            </Card>
          ) : null}

          {/* Two-column cockpit */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="border-border/70 bg-surface shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Execution result</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    Latest runner output and attempt history.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/25 border-border/60 rounded-xl border p-4">
                    <p className="text-sm leading-relaxed">
                      {q.data.latestExecutionSummary ??
                        'No execution summary yet. Start the session or wait for the runner.'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {q.data.executions.length === 0
                      ? sectionEmpty(
                          'No execution attempts yet. Start the session to record runner output.',
                        )
                      : null}
                    {q.data.executions.map((ex) => (
                      <div
                        key={ex.id}
                        className="border-border/60 flex flex-col gap-2 rounded-xl border bg-surface-raised p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            Round {ex.roundNumber}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {ex.summary ?? 'No summary yet.'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <ExecutionStatusBadge status={ex.status} />
                          {ex.exitCode != null ? (
                            <span className="text-muted-foreground text-xs tabular-nums">
                              exit {ex.exitCode}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-surface shadow-sm">
                <CardHeader className="flex flex-row items-center gap-2">
                  <History className="text-muted-foreground size-4" />
                  <div>
                    <CardTitle className="text-lg">Rounds timeline</CardTitle>
                    <p className="text-muted-foreground text-sm">
                      Progress through automation rounds.
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  {q.data.rounds.length === 0 ? (
                    sectionEmpty('No rounds yet — timeline fills in after work begins.')
                  ) : (
                    <>
                      <div className="bg-border absolute top-2 bottom-2 left-[11px] w-px" />
                      <div className="space-y-6">
                        {q.data.rounds.map((r, idx) => (
                          <motion.div
                            key={r.id}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className="relative flex gap-4 pl-8"
                          >
                            <div className="absolute top-1 left-0 flex size-6 items-center justify-center rounded-full border bg-card">
                              {r.status === 'complete' ? (
                                <CheckCircle2 className="text-status-succeeded size-3.5" />
                              ) : (
                                <CircleDot className="text-swarm size-3.5" />
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold">
                                  Round {r.number}: {r.title}
                                </p>
                                <span className="text-muted-foreground text-xs capitalize">
                                  {r.status}
                                </span>
                              </div>
                              {r.notes ? (
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                  {r.notes}
                                </p>
                              ) : null}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-surface shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Review history</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    Structured feedback sent back to the agent.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {q.data.reviews.length === 0
                    ? sectionEmpty('No review requests yet.')
                    : null}
                  {q.data.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="border-border/60 rounded-xl border bg-surface-raised p-4"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-muted-foreground">
                          {formatDistanceToNow(new Date(rev.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                        <span className="bg-muted rounded-full px-2 py-0.5 font-medium capitalize">
                          {rev.status}
                        </span>
                        {rev.scope ? (
                          <span className="text-muted-foreground font-mono">
                            {rev.scope}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm leading-relaxed">{rev.instruction}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar panels */}
            <div className="space-y-6">
              <Card className="border-border/70 bg-surface shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Session metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <MetaRow label="Source ref" value={q.data.sourceRef} mono />
                  {q.data.sourceLabel ? (
                    <MetaRow label="Source label" value={q.data.sourceLabel} />
                  ) : null}
                  <MetaRow label="Repository" value={repoName} />
                  <MetaRow label="Engine" value={q.data.engine} mono />
                  <MetaRow
                    label="Created"
                    value={formatDistanceToNow(new Date(q.data.createdAt), {
                      addSuffix: true,
                    })}
                  />
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-surface shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileDiff className="text-muted-foreground size-4" />
                    Patch versions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground leading-relaxed">
                    {q.data.patchSummary ??
                      'Patch metadata appears after the first successful diff.'}
                  </p>
                  <Separator />
                  {q.data.patches.length === 0
                    ? sectionEmpty('No patch versions yet.')
                    : null}
                  {q.data.patches.map((p) => (
                    <div
                      key={p.id}
                      className="bg-muted/25 flex items-center justify-between rounded-lg px-3 py-2 text-xs"
                    >
                      <span className="font-medium">v{p.version}</span>
                      <span className="text-muted-foreground">
                        {p.filesChanged != null
                          ? `${p.filesChanged} files`
                          : 'Pending'}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {(q.data.prPreviewTitle || q.data.prPreviewBody) && !q.data.prExternalUrl ? (
                <Card className="border-border/70 bg-surface shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <GitPullRequest className="text-muted-foreground size-4" />
                      PR preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase">Title</p>
                      <p className="font-medium">
                        {q.data.prPreviewTitle ?? 'Generated server-side'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase">Body</p>
                      <p className="text-muted-foreground mt-1 max-h-32 overflow-auto whitespace-pre-wrap text-xs leading-relaxed">
                        {q.data.prPreviewBody ?? '—'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              <Card className="border-border/60 border-dashed bg-muted/10 shadow-none">
                <button
                  type="button"
                  onClick={() => setDebugOpen((o) => !o)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <span className="text-muted-foreground text-sm font-medium">
                    Advanced / debug
                  </span>
                  <ChevronDown
                    className={cn(
                      'text-muted-foreground size-4 transition-transform',
                      debugOpen && 'rotate-180',
                    )}
                  />
                </button>
                {debugOpen ? (
                  <CardContent className="pt-0">
                    <pre className="bg-muted/30 border-border/60 max-h-80 overflow-auto rounded-lg border p-3 text-[11px] leading-relaxed">
                      {JSON.stringify(q.data, null, 2)}
                    </pre>
                  </CardContent>
                ) : null}
              </Card>
            </div>
          </div>
        </>
      ) : null}

      <Dialog open={revOpen} onOpenChange={setRevOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request revision</DialogTitle>
            <DialogDescription>
              Be explicit about what should change. Optional scope narrows files
              or services for the next attempt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <FormField id="instruction" label="Instructions">
              <Textarea
                id="instruction"
                rows={5}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
              />
            </FormField>
            <FormField id="scope" label="Target scope (optional)">
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
              Send request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={prOpen} onOpenChange={setPrOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create pull request</DialogTitle>
            <DialogDescription>
              Confirm the title and body QSwarm will use when opening the PR.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase">Title</p>
              <p className="font-medium">
                {q.data?.prPreviewTitle ?? 'Title will be generated server-side.'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase">Body</p>
              <div className="bg-muted/30 border-border/60 mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border p-3 text-sm leading-relaxed">
                {q.data?.prPreviewBody ??
                  'Body templates come from branch policy + session metadata.'}
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
                  Creating PR…
                </>
              ) : (
                <>
                  <ChevronRight className="size-4" />
                  Confirm & create PR
                </>
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
