import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import type { SessionStatus } from '@/api/schemas'

function sectionEmpty(message: string) {
  return (
    <p className="text-muted-foreground border-border/60 bg-muted/20 rounded-lg border border-dashed px-4 py-6 text-center text-sm">
      {message}
    </p>
  )
}

function sessionActionHints(status: SessionStatus) {
  const canStart = status === 'draft' || status === 'queued'
  const canRevise =
    status === 'awaiting_review' ||
    status === 'revising' ||
    status === 'running'
  const canApprove = status === 'awaiting_review'
  const canCreatePr = status === 'awaiting_review' || status === 'succeeded'
  return { canStart, canRevise, canApprove, canCreatePr }
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
  const [instruction, setInstruction] = useState('')
  const [scope, setScope] = useState('')

  const repoName =
    repos.data?.find((r) => r.id === q.data?.repoConnectionId)?.displayName ??
    repos.data?.find((r) => r.id === q.data?.repoConnectionId)?.repoName ??
    q.data?.repoConnectionId ??
    'Repository'

  const hints = q.data ? sessionActionHints(q.data.status) : null

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
      await createPr.mutateAsync(repoId)
      toast.success('Pull request creation queued')
      setPrOpen(false)
    } catch (e) {
      toast.error(formatErrorForToast(e))
    }
  }

  return (
    <div className="space-y-10">
      {q.isError ? (
        <QueryErrorAlert error={q.error} onRetry={() => void q.refetch()} />
      ) : null}

      {q.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : null}

      {q.data ? (
        <>
          <PageHeader
            eyebrow="Session"
            title={q.data.sourceLabel ?? q.data.sourceRef}
            description={`${repoName} · ${q.data.engine} · ref ${q.data.sourceRef}${
              q.data.sourceLabel && q.data.sourceLabel !== q.data.sourceRef
                ? ` · label ${q.data.sourceLabel}`
                : ''
            } · updated ${formatDistanceToNow(new Date(q.data.updatedAt), { addSuffix: true })}`}
            actions={
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                <LinkButton variant="ghost" to="/sessions">
                  Back
                </LinkButton>
                <div className="bg-muted/30 flex flex-wrap gap-2 rounded-xl border border-border/70 p-2">
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
                    Start
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hints?.canRevise || revision.isPending}
                    title={
                      hints?.canRevise
                        ? 'Send structured feedback for another attempt'
                        : 'Request revision when the session is running or waiting on review.'
                    }
                    className="gap-1.5"
                    onClick={() => setRevOpen(true)}
                  >
                    Request revision
                  </Button>
                </div>
                <div className="bg-muted/30 flex flex-wrap gap-2 rounded-xl border border-border/70 p-2">
                  <Button
                    variant="default"
                    size="sm"
                    disabled={approve.isPending || !hints?.canApprove}
                    title={
                      hints?.canApprove
                        ? 'Mark automation output as accepted for PR creation'
                        : 'Approve is available when the session awaits review.'
                    }
                    className="gap-1.5"
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
                      createPr.isPending ||
                      !hints?.canCreatePr ||
                      !repoId
                    }
                    title={
                      !repoId
                        ? 'Cannot create a PR without a repository connection on this session.'
                        : hints?.canCreatePr
                          ? 'Open a pull request from the session branch (backend must be in a PR-ready state).'
                          : 'Create PR when the session awaits review or has succeeded and is ready for PR.'
                    }
                    className="gap-1.5"
                    onClick={() => setPrOpen(true)}
                  >
                    <GitPullRequest className="size-4" />
                    Create PR
                  </Button>
                </div>
              </div>
            }
          />

          <div className="flex flex-wrap items-center gap-3">
            <SessionStatusBadge status={q.data.status} />
            <Separator orientation="vertical" className="hidden h-6 sm:block" />
            <p className="text-muted-foreground text-sm">
              Source reference{' '}
              <span className="text-foreground font-mono text-xs">
                {q.data.sourceRef}
              </span>
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border-border/80 lg:col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Latest execution</CardTitle>
                <p className="text-muted-foreground text-sm">
                  High-signal summary for triage—open the debug tab for raw payloads.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/40 border-border/80 rounded-xl border p-4">
                  <p className="text-sm leading-relaxed">
                    {q.data.latestExecutionSummary ??
                      'No execution summary yet. Start the session or wait for the runner.'}
                  </p>
                </div>
                <div className="space-y-2">
                  {q.data.executions.length === 0
                    ? sectionEmpty(
                        'No execution attempts yet. Start the session to record runner output here.',
                      )
                    : null}
                  {q.data.executions.map((ex) => (
                    <div
                      key={ex.id}
                      className="border-border/70 flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
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

            <Card className="border-border/80 h-fit shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Patch summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <FileDiff className="text-muted-foreground mt-0.5 size-4" />
                  <p className="leading-relaxed">
                    {q.data.patchSummary ??
                      'Patch metadata will appear after the first successful diff.'}
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  {q.data.patches.length === 0
                    ? sectionEmpty(
                        'No patch versions yet. They appear after the coding agent proposes changes.',
                      )
                    : null}
                  {q.data.patches.map((p) => (
                    <div
                      key={p.id}
                      className="bg-muted/30 flex items-center justify-between rounded-lg px-3 py-2 text-xs"
                    >
                      <span className="font-medium">v{p.version}</span>
                      <span className="text-muted-foreground">
                        {p.filesChanged != null
                          ? `${p.filesChanged} files`
                          : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-2">
              <History className="text-muted-foreground size-4" />
              <div>
                <CardTitle className="text-lg">Rounds timeline</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Each round is a focused slice of work toward the acceptance bar.
                </p>
              </div>
            </CardHeader>
            <CardContent className="relative space-y-0">
              {q.data.rounds.length === 0 ? (
                <div className="pl-2">{sectionEmpty('No rounds yet — the timeline fills in after work begins.')}</div>
              ) : (
                <>
              <div className="bg-border absolute top-2 bottom-2 left-[11px] w-px" />
              <div className="space-y-6">
                {q.data.rounds.map((r, idx) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative flex gap-4 pl-8"
                  >
                    <div className="absolute top-1 left-0 flex size-6 items-center justify-center rounded-full border bg-card">
                      {r.status === 'complete' ? (
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                      ) : (
                        <CircleDot className="text-primary size-3.5" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold tracking-tight">
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

          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Review requests</CardTitle>
              <p className="text-muted-foreground text-sm">
                Instructions you send back to the swarm stay auditable here.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {q.data.reviews.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No review requests yet.
                </p>
              ) : null}
              {q.data.reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="border-border/70 rounded-xl border p-4"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(rev.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 font-medium capitalize">
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

          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="debug">Advanced / debug</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="text-muted-foreground text-sm">
              Human-readable summaries only. Use Request revision for structured
              feedback; approvals unlock downstream automation on the backend.
            </TabsContent>
            <TabsContent value="debug">
              <pre className="bg-muted/40 border-border/80 max-h-[420px] overflow-auto rounded-xl border p-4 text-xs leading-relaxed">
                {JSON.stringify(q.data, null, 2)}
              </pre>
            </TabsContent>
          </Tabs>
        </>
      ) : null}

      <Dialog open={revOpen} onOpenChange={setRevOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request revision</DialogTitle>
            <DialogDescription>
              Be explicit about what should change. Optional scope narrows files or
              services for the next attempt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <FormField
              id="instruction"
              label="Instructions"
              hint="Plain language is fine—QA context beats terse keywords."
            >
              <Textarea
                id="instruction"
                rows={5}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
              />
            </FormField>
            <FormField
              id="scope"
              label="Target scope (optional)"
              hint="Example: packages/api or src/checkout."
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
              Confirm the title and body QSwarm will use when opening the PR from
              this session&apos;s head branch.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase">Title</p>
              <p className="text-foreground font-medium">
                {q.data?.prPreviewTitle ?? 'Title will be generated server-side.'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase">Body</p>
              <div className="bg-muted/40 border-border/80 text-foreground mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border p-3 text-sm leading-relaxed">
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
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ChevronRight className="size-4" />
              )}
              Confirm & create PR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
