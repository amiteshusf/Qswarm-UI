import { formatDistanceToNow } from 'date-fns'
import { Filter } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import {
  useCreateSession,
  useRepoConnections,
  useSessions,
} from '@/api/hooks'
import type { SessionCreateInput } from '@/api/schemas'
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
  const [tab, setTab] = useState<(typeof filters)[number]>('all')
  const filter = useMemo(
    () => (tab === 'all' ? undefined : { status: tab }),
    [tab],
  )
  const q = useSessions(filter)
  const repos = useRepoConnections()
  const create = useCreateSession()

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<SessionCreateInput>({
    repoConnectionId: '',
    branchPolicyId: undefined,
    engine: 'qswarm-gpt-4.1',
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
        engine: 'qswarm-gpt-4.1',
        sourceRef: '',
        sourceLabel: '',
      })
      window.location.href = `/sessions/${row.id}`
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Create failed')
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
                  Point QSwarm at a repository connection and describe the source
                  signal (ticket, PR, thread, etc.).
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <FormField
                  id="repoConnectionId"
                  label="Repository connection"
                  hint="Where QSwarm should clone from."
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
                  id="engine"
                  label="Engine"
                  hint="Model or runner profile configured in settings."
                >
                  <Input
                    id="engine"
                    value={form.engine}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, engine: e.target.value }))
                    }
                  />
                </FormField>
                <FormField
                  id="sourceRef"
                  label="Source reference"
                  hint="Opaque handle your backend understands (ticket id, PR URL, etc.)."
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
                  hint="Human-readable label shown in lists."
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
                    create.isPending || !form.repoConnectionId || !form.sourceRef
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
            Filters apply instantly; counts reflect the mock store when enabled.
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
          title="No sessions match"
          description="Adjust filters or create a new session to get started."
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
