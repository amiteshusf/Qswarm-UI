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
  useStartSession,
} from '@/api/hooks'
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
import { ChangedFilesPanel } from '@/features/sessions/review/changed-files-panel'
import { CodeRevisionSwitcher } from '@/features/sessions/review/code-revision-switcher'
import { FileDiffPanel } from '@/features/sessions/review/file-diff-panel'
import { ReviewAdvancedPanel } from '@/features/sessions/review/review-advanced-panel'
import { ReviewConversationPanel } from '@/features/sessions/review/review-conversation-panel'
import {
  defaultPatchVersion,
  getPatchFiles,
  getSelectedPatch,
} from '@/features/sessions/review/review-data'
import { RevisionComposer } from '@/features/sessions/review/revision-composer'
import { RunHeroSummary } from '@/features/sessions/review/run-hero-summary'
import { ValidationSummaryPanel } from '@/features/sessions/review/validation-summary-panel'

export function SessionDetailPage() {
  const { id = '' } = useParams()
  const q = useSession(id)
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

  useEffect(() => {
    if (q.data?.patches.length) {
      setPatchVersion(defaultPatchVersion(q.data.patches))
    }
  }, [q.data?.id, q.data?.patches.length])

  const repoName =
    repos.data?.find((r) => r.id === q.data?.repoConnectionId)?.displayName ??
    repos.data?.find((r) => r.id === q.data?.repoConnectionId)?.repoName ??
    q.data?.repoConnectionId ??
    'Repository'

  const longRunning = start.isPending || revision.isPending
  const repoId = q.data?.repoConnectionId?.trim() ?? ''

  const patches = q.data?.patches ?? []
  const effectiveVersion = useMemo(() => {
    if (patches.length === 0) return 1
    if (patches.some((p) => p.version === patchVersion)) return patchVersion
    return defaultPatchVersion(patches)
  }, [patches, patchVersion])

  const selectedPatch = q.data
    ? getSelectedPatch(patches, effectiveVersion)
    : undefined

  const changedFiles = useMemo(() => {
    if (!q.data || !selectedPatch) return []
    return getPatchFiles(selectedPatch, q.data)
  }, [q.data, selectedPatch])

  const selectedFile = useMemo(
    () => changedFiles.find((f) => f.path === selectedFilePath) ?? changedFiles[0] ?? null,
    [changedFiles, selectedFilePath],
  )

  async function submitRevision() {
    try {
      await revision.mutateAsync({ instruction, scope: scope || undefined })
      toast.success('Change request sent to agent')
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
    <div className="space-y-6 pb-8">
      {q.isError ? (
        <QueryErrorAlert error={q.error} onRetry={() => void q.refetch()} />
      ) : null}

      {q.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
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

          {q.data.prExternalUrl ? (
            <div className="border-status-succeeded/30 bg-status-succeeded/8 flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Pull request created</p>
                <p className="text-muted-foreground text-xs">
                  {q.data.prStatus ?? 'open'}
                  {q.data.prExternalId ? ` · #${q.data.prExternalId}` : ''}
                </p>
              </div>
              <a
                href={q.data.prExternalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-swarm text-sm font-medium hover:underline"
              >
                Open on GitHub →
              </a>
            </div>
          ) : null}

          <RunHeroSummary session={q.data} repoName={repoName} />

          <div className="grid gap-6 xl:grid-cols-12">
            {/* Main review workspace */}
            <div className="space-y-6 xl:col-span-8">
              <Tabs defaultValue="changes" className="w-full">
                <TabsList className="bg-muted/40 h-auto w-full justify-start gap-1 rounded-xl p-1">
                  <TabsTrigger value="changes" className="rounded-lg text-xs">
                    Changes
                  </TabsTrigger>
                  <TabsTrigger value="validation" className="rounded-lg text-xs">
                    Validation
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="changes" className="mt-4 space-y-4">
                  <div className="border-border/70 bg-surface rounded-2xl border p-4 shadow-sm sm:p-5">
                    <div className="mb-4 flex items-start gap-2">
                      <FileDiff className="text-swarm mt-0.5 size-5 shrink-0" />
                      <div>
                        <h2 className="text-lg font-semibold">What changed</h2>
                        <p className="text-muted-foreground text-sm">
                          {q.data.patchSummary ??
                            'File-level changes appear after the agent produces a diff.'}
                        </p>
                      </div>
                    </div>

                    <CodeRevisionSwitcher
                      patches={patches}
                      selectedVersion={effectiveVersion}
                      onSelect={(v) => {
                        setPatchVersion(v)
                        setSelectedFilePath(null)
                      }}
                    />

                    <div className="mt-4 grid gap-4 lg:grid-cols-5">
                      <div className="lg:col-span-2">
                        <ChangedFilesPanel
                          files={changedFiles}
                          selectedPath={selectedFile?.path ?? null}
                          onSelect={setSelectedFilePath}
                        />
                      </div>
                      <div className="lg:col-span-3">
                        <FileDiffPanel file={selectedFile} />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="validation" className="mt-4">
                  <div className="border-border/70 bg-surface rounded-2xl border p-4 shadow-sm sm:p-5">
                    <h2 className="mb-4 text-lg font-semibold">Validation result</h2>
                    <ValidationSummaryPanel session={q.data} />
                  </div>
                </TabsContent>
              </Tabs>

              <ReviewConversationPanel session={q.data} />
              <div ref={composerRef} className="mt-4">
                <RevisionComposer
                  session={q.data}
                  instruction={instruction}
                  scope={scope}
                  pending={revision.isPending}
                  onInstructionChange={setInstruction}
                  onScopeChange={setScope}
                  onSubmit={() => void submitRevision()}
                />
              </div>
            </div>

            {/* Sticky action rail */}
            <div className="xl:col-span-4">
              <ActionRail
                session={q.data}
                repoName={repoName}
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
                onApprove={() => void submitApprove()}
                onCreatePr={() => setPrOpen(true)}
              />

              <div className="border-border/60 bg-muted/10 text-muted-foreground mt-4 rounded-xl border px-4 py-3 text-xs">
                <p className="text-foreground font-medium">Quick read</p>
                <ul className="mt-2 space-y-1.5">
                  <li>
                    <span className="text-foreground">Changed:</span>{' '}
                    {q.data.patchSummary ?? '—'}
                  </li>
                  <li>
                    <span className="text-foreground">Validation:</span>{' '}
                    {q.data.latestExecutionSummary ?? '—'}
                  </li>
                  <li>
                    <span className="text-foreground">Updated:</span>{' '}
                    {formatDistanceToNow(new Date(q.data.updatedAt), {
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
              <ReviewAdvancedPanel session={q.data} repoName={repoName} />
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
                {q.data?.prPreviewTitle ?? 'Generated server-side.'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase">Description</p>
              <div className="bg-muted/30 border-border/60 mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border p-3 text-sm">
                {q.data?.prPreviewBody ?? 'From branch policy + run metadata.'}
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
