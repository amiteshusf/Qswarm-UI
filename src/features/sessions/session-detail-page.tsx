import { formatDistanceToNow } from 'date-fns'
import { FileDiff, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { formatErrorForToast } from '@/api/errors'
import {
  useApproveSession,
  useCreatePr,
  useRepoConnections,
  useRequestRevision,
  useSession,
  useSessionBrief,
  useSessionReviewData,
  useStartSession,
} from '@/api/hooks'
import type { SessionDetail } from '@/api/schemas'
import { QueryErrorAlert } from '@/components/patterns/query-error'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { ActionRail } from '@/features/sessions/review/action-rail'
import { CodeRevisionSwitcher } from '@/features/sessions/review/code-revision-switcher'
import { ReviewChangesWorkspace } from '@/features/sessions/review/review-changes-workspace'
import { ReviewAdvancedPanel } from '@/features/sessions/review/review-advanced-panel'
import { ReviewConversationPanel } from '@/features/sessions/review/review-conversation-panel'
import {
  defaultPatchVersion,
  getSelectedPatch,
  mergeSessionWithReviewData,
  resolveChangedFiles,
} from '@/features/sessions/review/review-data'
import { RevisionComposer } from '@/features/sessions/review/revision-composer'
import { RunHeroSummary } from '@/features/sessions/review/run-hero-summary'
import { SessionBriefPanel } from '@/features/sessions/review/session-brief-panel'
import { ValidationSummaryPanel } from '@/features/sessions/review/validation-summary-panel'
import {
  isSessionActionAllowed,
  type SessionMutationAction,
} from '@/features/sessions/session-actions'

function actionBlockedToast(action: SessionMutationAction) {
  const labels: Record<SessionMutationAction, string> = {
    start: 'Start automation',
    revise: 'Request changes',
    approve: 'Approve output',
    create_pr: 'Publish pull request',
  }
  toast.error(
    `“${labels[action]}” is not available for this run right now. Refresh and try again.`,
  )
}

function guardSessionMutation(
  session: SessionDetail,
  action: SessionMutationAction,
): boolean {
  if (!isSessionActionAllowed(session, action)) {
    actionBlockedToast(action)
    return false
  }
  return true
}

export function SessionDetailPage() {
  const { id = '' } = useParams()
  const q = useSession(id)
  const briefQ = useSessionBrief(id)
  const reviewQ = useSessionReviewData(id)
  const repos = useRepoConnections()
  const start = useStartSession(id)
  const revision = useRequestRevision(id)
  const approve = useApproveSession(id)
  const createPr = useCreatePr(id)

  const composerRef = useRef<HTMLDivElement>(null)
  const [prOpen, setPrOpen] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [scope, setScope] = useState('')
  const [patchVersion, setPatchVersion] = useState(1)
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null)

  const actionSession =
    q.data && q.data.id === id ? q.data : undefined

  const reviewDataForSession =
    reviewQ.data && reviewQ.data.sessionId === id ? reviewQ.data : null

  const displaySession = useMemo(
    () =>
      actionSession
        ? mergeSessionWithReviewData(actionSession, reviewDataForSession)
        : undefined,
    [actionSession, reviewDataForSession],
  )

  useEffect(() => {
    setPrOpen(false)
    setInstruction('')
    setScope('')
    setSelectedFilePath(null)
  }, [id])

  useEffect(() => {
    if (!q.data) return
    setPatchVersion(defaultPatchVersion(q.data.patches, reviewDataForSession))
  }, [
    q.data?.id,
    q.data?.patches.length,
    reviewDataForSession?.reviewSummary.currentPatchVersion,
  ])

  const repoName =
    briefQ.data?.setup.repository?.displayName ??
    repos.data?.find((r) => r.id === q.data?.repoConnectionId)?.displayName ??
    repos.data?.find((r) => r.id === q.data?.repoConnectionId)?.repoName ??
    q.data?.repoConnectionId ??
    'Repository'

  const longRunning = start.isPending || revision.isPending
  const repoId = actionSession?.repoConnectionId?.trim() ?? ''

  const patches = displaySession?.patches ?? []
  const effectiveVersion = useMemo(() => {
    if (patches.length === 0) {
      return reviewDataForSession?.reviewSummary.currentPatchVersion ?? 1
    }
    if (patches.some((p) => p.version === patchVersion)) return patchVersion
    return defaultPatchVersion(patches, reviewDataForSession)
  }, [patches, patchVersion, reviewDataForSession])

  const selectedPatch = displaySession
    ? getSelectedPatch(patches, effectiveVersion)
    : undefined

  const changedFiles = useMemo(() => {
    if (!displaySession) return []
    return resolveChangedFiles({
      reviewData: reviewDataForSession,
      session: displaySession,
      selectedPatch,
      selectedPatchVersion: effectiveVersion,
    })
  }, [displaySession, reviewDataForSession, selectedPatch, effectiveVersion])

  const selectedFile = useMemo(
    () =>
      changedFiles.find((f) => f.path === selectedFilePath) ??
      changedFiles[0] ??
      null,
    [changedFiles, selectedFilePath],
  )

  const changeSummary =
    displaySession?.patchSummary ??
    (reviewDataForSession?.reviewSummary.changedFilesCount
      ? `${reviewDataForSession.reviewSummary.changedFilesCount} file(s) in code revision ${reviewDataForSession.reviewSummary.currentPatchVersion ?? 1}`
      : undefined)

  const prUrl =
    actionSession?.prExternalUrl ?? reviewDataForSession?.prInfo?.externalUrl

  async function submitRevision() {
    if (!actionSession || !guardSessionMutation(actionSession, 'revise')) return
    try {
      await revision.mutateAsync({ instruction, scope: scope || undefined })
      toast.success('Change request sent to agent')
      setInstruction('')
      setScope('')
    } catch (e) {
      toast.error(formatErrorForToast(e, { action: 'revise' }))
    }
  }

  async function submitApprove() {
    if (!actionSession || !guardSessionMutation(actionSession, 'approve')) return
    try {
      await approve.mutateAsync()
      toast.success('Output approved')
    } catch (e) {
      toast.error(formatErrorForToast(e, { action: 'approve' }))
    }
  }

  async function submitPr() {
    if (!actionSession || !guardSessionMutation(actionSession, 'create_pr')) return
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
      toast.error(formatErrorForToast(e, { action: 'create_pr' }))
    }
  }

  async function submitStart() {
    if (!actionSession || !guardSessionMutation(actionSession, 'start')) return
    try {
      await start.mutateAsync(
        repoId ? { repositoryConnectionId: repoId } : undefined,
      )
      toast.success('Automation started')
    } catch (e) {
      toast.error(formatErrorForToast(e, { action: 'start' }))
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {q.isError ? (
        <QueryErrorAlert error={q.error} onRetry={() => void q.refetch()} />
      ) : null}

      {reviewQ.isError ? (
        <p className="text-muted-foreground text-center text-xs">
          Review data unavailable — showing session summary fallback.
        </p>
      ) : null}

      {q.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      ) : null}

      {displaySession && actionSession ? (
        <>
          {longRunning ? (
            <div
              className="border-swarm/30 bg-swarm/8 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm"
              role="status"
            >
              <Loader2 className="text-swarm mt-0.5 size-4 shrink-0 animate-spin" />
              <div>
                <p className="font-medium">
                  {start.isPending
                    ? 'Starting automation on the server'
                    : 'Agent is applying your feedback'}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  This can take 5–15+ minutes. Keep this tab open.
                </p>
              </div>
            </div>
          ) : null}

          {prUrl ? (
            <div className="border-status-succeeded/30 bg-status-succeeded/8 flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Pull request created</p>
                <p className="text-muted-foreground text-xs">
                  {reviewQ.data?.prInfo?.title ??
                    displaySession.prPreviewTitle ??
                    'Published'}
                  {actionSession.prExternalId ||
                  reviewDataForSession?.prInfo?.externalId
                    ? ` · #${actionSession.prExternalId ?? reviewDataForSession?.prInfo?.externalId}`
                    : ''}
                </p>
              </div>
              <a
                href={prUrl}
                target="_blank"
                rel="noreferrer"
                className="text-swarm text-sm font-medium hover:underline"
              >
                Open on GitHub →
              </a>
            </div>
          ) : null}

          <RunHeroSummary session={actionSession} repoName={repoName} />

          <SessionBriefPanel
            brief={briefQ.data}
            session={actionSession}
            isLoading={briefQ.isLoading}
          />

          <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1 space-y-6">
              <Tabs defaultValue="changes" className="w-full">
                <TabsList className="bg-muted/40 h-auto w-full justify-start gap-1 rounded-xl p-1">
                  <TabsTrigger value="changes" className="rounded-lg text-xs">
                    Changes
                    {reviewQ.data?.reviewSummary.changedFilesCount
                      ? ` (${reviewQ.data.reviewSummary.changedFilesCount})`
                      : ''}
                  </TabsTrigger>
                  <TabsTrigger value="validation" className="rounded-lg text-xs">
                    Validation
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="changes" className="mt-4 space-y-4">
                  <div className="border-border/70 bg-surface min-w-0 rounded-2xl border p-4 shadow-sm sm:p-5">
                    <div className="mb-4 flex items-start gap-2">
                      <FileDiff className="text-swarm mt-0.5 size-5 shrink-0" />
                      <div>
                        <h2 className="text-lg font-semibold">What changed</h2>
                        <p className="text-muted-foreground text-sm">
                          {changeSummary ??
                            'File-level changes appear after the agent produces a diff.'}
                        </p>
                        {reviewQ.isFetching && !reviewQ.isLoading ? (
                          <p className="text-muted-foreground mt-1 text-xs">
                            Refreshing live diff…
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {patches.length > 1 ? (
                      <CodeRevisionSwitcher
                        patches={patches}
                        selectedVersion={effectiveVersion}
                        onSelect={(v) => {
                          setPatchVersion(v)
                          setSelectedFilePath(null)
                        }}
                      />
                    ) : reviewQ.data?.reviewSummary.currentPatchVersion ? (
                      <p className="text-muted-foreground mb-3 text-xs">
                        Code revision{' '}
                        {reviewQ.data.reviewSummary.currentPatchVersion}
                      </p>
                    ) : null}

                    {reviewQ.isLoading && !changedFiles.length ? (
                      <Skeleton className="h-64 w-full rounded-xl" />
                    ) : (
                      <ReviewChangesWorkspace
                        className="mt-4"
                        files={changedFiles}
                        selectedFile={selectedFile}
                        onSelectFile={setSelectedFilePath}
                      />
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="validation" className="mt-4">
                  <div className="border-border/70 bg-surface rounded-2xl border p-4 shadow-sm sm:p-5">
                    <h2 className="mb-4 text-lg font-semibold">
                      Validation result
                    </h2>
                    <ValidationSummaryPanel
                      session={displaySession}
                      reviewData={reviewDataForSession}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <ReviewConversationPanel
                session={displaySession}
                reviewData={reviewDataForSession}
              />
              <div ref={composerRef} className="mt-4">
                <RevisionComposer
                  session={actionSession}
                  instruction={instruction}
                  scope={scope}
                  pending={revision.isPending}
                  onInstructionChange={setInstruction}
                  onScopeChange={setScope}
                  onSubmit={() => void submitRevision()}
                />
              </div>
            </div>

            <div className="w-full shrink-0 lg:sticky lg:top-20 lg:w-72 lg:max-w-[30%]">
              <ActionRail
                session={actionSession}
                repoName={repoName}
                repoId={repoId}
                startPending={start.isPending}
                approvePending={approve.isPending}
                createPrPending={createPr.isPending}
                onStart={() => void submitStart()}
                onApprove={() => void submitApprove()}
                onCreatePr={() => {
                  if (!guardSessionMutation(actionSession, 'create_pr')) return
                  setPrOpen(true)
                }}
              />

              <div className="border-border/60 bg-muted/10 text-muted-foreground mt-4 rounded-xl border px-4 py-3 text-xs">
                <p className="text-foreground font-medium">Quick read</p>
                <ul className="mt-2 space-y-1.5">
                  <li>
                    <span className="text-foreground">Changed:</span>{' '}
                    {changeSummary ?? '—'}
                  </li>
                  <li>
                    <span className="text-foreground">Validation:</span>{' '}
                    {displaySession.latestExecutionSummary?.slice(0, 120) ??
                      reviewDataForSession?.reviewSummary.latestExecutionStatus ??
                      '—'}
                  </li>
                  <li>
                    <span className="text-foreground">Updated:</span>{' '}
                    {formatDistanceToNow(new Date(actionSession.updatedAt), {
                      addSuffix: true,
                    })}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <details className="border-border/60 rounded-2xl border bg-muted/5 px-4 py-3">
            <summary className="text-muted-foreground cursor-pointer text-sm font-medium">
              Advanced — history, metadata & raw data
            </summary>
            <div className="mt-4">
              <ReviewAdvancedPanel session={displaySession} repoName={repoName} />
            </div>
          </details>
        </>
      ) : null}

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
                {reviewDataForSession?.prInfo?.title ??
                  displaySession?.prPreviewTitle ??
                  'Generated server-side.'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase">
                Description
              </p>
              <div className="bg-muted/30 border-border/60 mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border p-3 text-sm">
                {reviewDataForSession?.prInfo?.body ??
                  displaySession?.prPreviewBody ??
                  'From branch policy + run metadata.'}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPrOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={createPr.isPending || !repoId}
              onClick={() => void submitPr()}
            >
              {createPr.isPending ? 'Publishing…' : 'Confirm & publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
