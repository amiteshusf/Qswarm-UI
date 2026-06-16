import { formatDistanceToNow } from 'date-fns'
import { Filter } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { formatErrorForToast } from '@/api/errors'
import {
  useBranchPolicies,
  useCreateSession,
  useRepoConnections,
  useSessions,
} from '@/api/hooks'
import type { SessionCreateFormValues } from '@/api/schemas'
import { EmptyState } from '@/components/patterns/empty-state'
import { FormField } from '@/components/patterns/form-field'
import { PageHeader } from '@/components/patterns/page-header'
import { QueryErrorAlert } from '@/components/patterns/query-error'
import { SessionStatusBadge } from '@/components/patterns/status-badges'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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

const filters = ['all', 'running', 'awaiting_review', 'draft'] as const

export function SessionsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<(typeof filters)[number]>('all')
  const filter = useMemo(
    () => (tab === 'all' ? undefined : { status: tab }),
    [tab],
  )
  const q = useSessions(filter)
  const repos = useRepoConnections()
  const policies = useBranchPolicies()
  const create = useCreateSession()

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
    repos.data?.find((r) => r.id === id)?.repo ??
    id

  async function onCreate() {
    try {
      const row = await create.mutateAsync(form)
      toast.success('Session created')
      setOpen(false)
      setForm({
        repoConnectionId: '',
        branchPolicyId: undefined,
        engine: 'stub',
        sourceRef: '',
        sourceLabel: '',
      })
      navigate(`/sessions/${row.id}`)
    } catch (e) {
      toast.error(formatErrorForToast(e))
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workflow"
        title="Sessions"
        description="Every QA run is a session—track engine, repository, source signal, and lifecycle status without leaving this surface."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className={buttonVariants()}>
              New session
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create session</DialogTitle>
                <DialogDescription>
                  Choose a saved repository connection, pick the coding engine the
                  runner should use, and identify the work item (ticket key, case id,
                  or PR) your backend expects as the source signal.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {!repos.data?.length ? (
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    No repository connections yet.{' '}
                    <Link
                      to="/repo-connections/new"
                      className="text-primary font-medium underline-offset-4 hover:underline"
                    >
                      Add a connection
                    </Link>{' '}
                    before creating a session.
                  </p>
                ) : null}
                <FormField
                  id="repoConnectionId"
                  label="Repository connection"
                  hint="Saved clone target and credentials pointer from Repository connections."
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
                          {r.displayName ?? `${r.owner}/${r.repo}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField
                  id="branchPolicyId"
                  label="Branch policy (optional)"
                  hint="When set, must belong to the selected repository connection."
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
                  hint="Must match a runner your API accepts (e.g. stub for dry runs, claude_code, copilot_agent when enabled server-side)."
                >
                  <Select
                    value={form.engine}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        engine: v && v.length > 0 ? v : 'stub',
                      }))
                    }
                  >
                    <SelectTrigger id="engine" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stub">stub (safe default)</SelectItem>
                      <SelectItem value="claude_code">claude_code</SelectItem>
                      <SelectItem value="copilot_agent">copilot_agent</SelectItem>
                      <SelectItem value="qswarm-gpt-4.1">qswarm-gpt-4.1 (legacy label)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField
                  id="sourceRef"
                  label="Source reference"
                  hint="Primary handle for this run (e.g. Jira key, approved case id, or PR). Required by the API."
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
                  hint="Shown in session lists; does not replace the reference for the runner."
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

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="bg-muted/50 h-9 w-fit rounded-full p-1">
            {filters.map((f) => (
              <TabsTrigger
                key={f}
                value={f}
                className="rounded-full px-3 text-xs data-[state=active]:shadow-sm"
              >
                {f === 'all' ? 'All' : f.replace('_', ' ')}
              </TabsTrigger>
            ))}
          </TabsList>
          <p className="text-muted-foreground flex items-center gap-2 text-xs">
            <Filter className="size-3.5" />
            Filters apply instantly; counts reflect the current data source (mock
            or API).
          </p>
        </div>
      </Tabs>

      {q.isError ? (
        <QueryErrorAlert error={q.error} onRetry={() => void q.refetch()} />
      ) : null}

      {q.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : null}

      {!q.isLoading && !q.data?.length ? (
        <EmptyState
          icon={Filter}
          title={tab === 'all' ? 'No sessions yet' : 'No sessions match'}
          description={
            tab === 'all'
              ? 'Create a session to kick off a QA run, or connect a repository first if you have not.'
              : 'Try another filter or create a session in this state from your workflow.'
          }
        />
      ) : null}

      <div className="space-y-3">
        {q.data?.map((s) => (
          <Link key={s.id} to={`/sessions/${s.id}`}>
            <Card className="border-border/80 hover:border-primary/30 hover:bg-muted/20 transition-colors">
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-base font-medium tracking-tight">
                    {s.sourceLabel ?? s.sourceRef}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {repoLabel(s.repoConnectionId)} · {s.engine}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SessionStatusBadge status={s.status} />
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(s.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
