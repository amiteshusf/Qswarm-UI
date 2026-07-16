import { formatDistanceToNow } from 'date-fns'
import { Filter, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { formatErrorForToast } from '@/api/errors'
import {
  useBranchPolicies,
  useCreateSession,
  useRepoConnections,
  useSessions,
  useSettings,
} from '@/api/hooks'
import type { SessionCreateFormValues, SessionStatus } from '@/api/schemas'
import { EmptyState } from '@/components/patterns/empty-state'
import { FormField } from '@/components/patterns/form-field'
import { PageHeader } from '@/components/patterns/page-header'
import { QueryErrorAlert } from '@/components/patterns/query-error'
import { SessionStatusBadge } from '@/components/patterns/status-badges'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { isActivePipeline, needsAttention } from '@/lib/workflow'
import { cn } from '@/lib/utils'

const filters = [
  'all',
  'awaiting_review',
  'running',
  'revising',
  'draft',
  'failed',
] as const

type FilterTab = (typeof filters)[number]

const filterLabels: Record<FilterTab, string> = {
  all: 'All',
  awaiting_review: 'Awaiting review',
  running: 'Running',
  revising: 'Revising',
  draft: 'Draft',
  failed: 'Failed',
}

function parseFilter(value: string | null): FilterTab {
  if (value && filters.includes(value as FilterTab)) return value as FilterTab
  return 'all'
}

export function SessionsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = parseFilter(searchParams.get('status'))
  const [tab, setTab] = useState<FilterTab>(initialTab)

  useEffect(() => {
    setTab(parseFilter(searchParams.get('status')))
  }, [searchParams])

  const filter = useMemo(
    () => (tab === 'all' ? undefined : { status: tab }),
    [tab],
  )
  const q = useSessions(filter)
  const repos = useRepoConnections()
  const policies = useBranchPolicies()
  const settings = useSettings()
  const create = useCreateSession()

  const defaultEngine = settings.data?.copilotAgentEnabled
    ? 'copilot_agent'
    : 'stub'

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<SessionCreateFormValues>({
    repoConnectionId: '',
    branchPolicyId: undefined,
    engine: 'stub',
    sourceRef: '',
    sourceLabel: '',
  })

  const repoLabel = (id: string) =>
    repos.data?.find((r) => r.id === id)?.displayName ??
    repos.data?.find((r) => r.id === id)?.repoName ??
    id

  function onTabChange(next: FilterTab) {
    setTab(next)
    if (next === 'all') {
      setSearchParams({})
    } else {
      setSearchParams({ status: next })
    }
  }

  async function onCreate() {
    try {
      const row = await create.mutateAsync(form)
      toast.success('Session created')
      setOpen(false)
      setForm({
        repoConnectionId: '',
        branchPolicyId: undefined,
        engine: defaultEngine,
        sourceRef: '',
        sourceLabel: '',
      })
      navigate(`/sessions/${row.id}`)
    } catch (e) {
      toast.error(formatErrorForToast(e))
    }
  }

  const isReviewQueue = tab === 'awaiting_review'

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={isReviewQueue ? 'Review' : 'Workflow'}
        title={isReviewQueue ? 'Review queue' : 'Sessions'}
        description={
          isReviewQueue
            ? 'Approve or request revisions on sessions waiting for human review.'
            : 'Every QA run is a session — track engine, repository, and lifecycle from draft through PR.'
        }
        actions={
          <Dialog
            open={open}
            onOpenChange={(next) => {
              setOpen(next)
              if (next && form.engine === 'stub' && defaultEngine !== 'stub') {
                setForm((f) => ({ ...f, engine: defaultEngine }))
              }
            }}
          >
            <DialogTrigger className={buttonVariants()}>
              <Plus className="size-4" />
              New session
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create session</DialogTitle>
                <DialogDescription>
                  Connect a repository, pick the coding engine, and identify the
                  source signal your backend expects.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {!repos.data?.length ? (
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    No repository connections yet.{' '}
                    <Link
                      to="/repo-connections/new"
                      className="text-swarm font-medium underline-offset-4 hover:underline"
                    >
                      Add a connection
                    </Link>{' '}
                    before creating a session.
                  </p>
                ) : null}
                <FormField
                  id="repoConnectionId"
                  label="Repository connection"
                  hint="Clone target and credentials from Automation setup."
                >
                  <Select
                    value={form.repoConnectionId}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        repoConnectionId: typeof v === 'string' ? v : '',
                      }))
                    }
                  >
                    <SelectTrigger id="repoConnectionId" className="w-full">
                      <SelectValue placeholder="Select connection" />
                    </SelectTrigger>
                    <SelectContent>
                      {repos.data?.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.displayName ?? `${r.ownerOrOrg}/${r.repoName}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField
                  id="branchPolicyId"
                  label="Branch policy (optional)"
                  hint="Must belong to the selected repository."
                >
                  <Select
                    value={form.branchPolicyId ?? '__none__'}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        branchPolicyId:
                          !v || v === '__none__' ? undefined : v,
                      }))
                    }
                  >
                    <SelectTrigger id="branchPolicyId" className="w-full">
                      <SelectValue placeholder="Default policy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {policies.data
                        ?.filter(
                          (p) =>
                            !form.repoConnectionId ||
                            p.repoConnectionId === form.repoConnectionId,
                        )
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField
                  id="engine"
                  label="Coding engine"
                  hint={
                    settings.data?.copilotAgentEnabled
                      ? 'Hosted POC uses copilot_agent.'
                      : 'Copilot disabled — use stub or claude_code if enabled.'
                  }
                >
                  <Select
                    value={form.engine}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        engine: v && v.length > 0 ? v : defaultEngine,
                      }))
                    }
                  >
                    <SelectTrigger id="engine" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stub">stub (dry run)</SelectItem>
                      {settings.data?.copilotAgentEnabled ? (
                        <SelectItem value="copilot_agent">
                          copilot_agent
                        </SelectItem>
                      ) : null}
                      {settings.data?.claudeCodeEnabled ? (
                        <SelectItem value="claude_code">claude_code</SelectItem>
                      ) : null}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField
                  id="sourceRef"
                  label="Source reference"
                  hint="Jira key, case id, or PR — required by the API."
                >
                  <Input
                    id="sourceRef"
                    value={form.sourceRef}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sourceRef: e.target.value }))
                    }
                  />
                </FormField>
                <FormField
                  id="sourceLabel"
                  label="Source label (optional)"
                  hint="UUIDs are sent as approvedCaseId for hosted automation."
                >
                  <Input
                    id="sourceLabel"
                    value={form.sourceLabel}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sourceLabel: e.target.value }))
                    }
                  />
                </FormField>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => void onCreate()}
                  disabled={
                    create.isPending ||
                    !repos.data?.length ||
                    !form.repoConnectionId ||
                    !form.sourceRef.trim()
                  }
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Tabs value={tab} onValueChange={(v) => onTabChange(v as FilterTab)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="bg-muted/40 h-auto flex-wrap justify-start gap-1 rounded-xl p-1">
            {filters.map((f) => (
              <TabsTrigger
                key={f}
                value={f}
                className="data-[state=active]:bg-swarm rounded-lg px-3 py-1.5 text-xs data-[state=active]:text-swarm-foreground data-[state=active]:shadow-sm"
              >
                {filterLabels[f]}
              </TabsTrigger>
            ))}
          </TabsList>
          <p className="text-muted-foreground flex items-center gap-2 text-xs">
            <Filter className="size-3.5" />
            {q.data?.length ?? 0} session{(q.data?.length ?? 0) === 1 ? '' : 's'}
          </p>
        </div>
      </Tabs>

      {q.isError ? (
        <QueryErrorAlert error={q.error} onRetry={() => void q.refetch()} />
      ) : null}

      {q.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : null}

      {!q.isLoading && !q.data?.length ? (
        <EmptyState
          icon={Filter}
          title={tab === 'all' ? 'No sessions yet' : 'No sessions match'}
          description={
            tab === 'all'
              ? 'Create a session to kick off a QA run, or connect a repository first.'
              : 'Try another filter or create a session in this state.'
          }
        />
      ) : null}

      <div className="space-y-2">
        {q.data?.map((s) => (
          <SessionListRow
            key={s.id}
            id={s.id}
            title={s.sourceLabel ?? s.sourceRef}
            repo={repoLabel(s.repoConnectionId)}
            engine={s.engine}
            status={s.status}
            updatedAt={s.updatedAt ?? s.createdAt}
          />
        ))}
      </div>
    </div>
  )
}

function SessionListRow({
  id,
  title,
  repo,
  engine,
  status,
  updatedAt,
}: {
  id: string
  title: string
  repo: string
  engine: string
  status: SessionStatus
  updatedAt: string
}) {
  const attention = needsAttention(status)
  const active = isActivePipeline(status)

  return (
    <Link to={`/sessions/${id}`} className="group block">
      <div
        className={cn(
          'border-border/70 bg-surface-raised hover:border-swarm/35 flex gap-4 rounded-xl border p-4 transition-all hover:shadow-md',
          attention && 'border-status-awaiting/30 ring-1 ring-status-awaiting/10',
          active && !attention && 'border-status-running/25',
        )}
      >
        <div
          className={cn(
            'mt-1 w-1 shrink-0 rounded-full',
            attention && 'bg-status-awaiting',
            active && !attention && 'bg-status-running',
            !attention && !active && 'bg-border',
          )}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="group-hover:text-swarm truncate text-base font-medium transition-colors">
              {title}
            </p>
            <p className="text-muted-foreground truncate text-sm">
              {repo} · <span className="font-mono text-xs">{engine}</span>
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <SessionStatusBadge status={status} />
            <span className="text-muted-foreground text-xs tabular-nums">
              {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
