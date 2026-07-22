import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, Play, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { formatErrorForToast } from '@/api/errors'
import {
  useAutomationBacklog,
  useAutomateTestCase,
  useBranchPolicies,
  useRepoConnections,
  useSettings,
} from '@/api/hooks'
import type {
  AutomationBacklogTestCase,
  AutomateTestCaseFormValues,
} from '@/api/schemas'
import { EmptyState } from '@/components/patterns/empty-state'
import { PageHeader } from '@/components/patterns/page-header'
import { QueryErrorAlert } from '@/components/patterns/query-error'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AutomateTestCaseDialog } from '@/features/automation-backlog/automate-test-case-dialog'
import {
  TestCasePreviewPanel,
  testCaseStatusLabels,
} from '@/features/automation-backlog/test-case-preview-panel'
import { cn } from '@/lib/utils'

const tabs = ['ready', 'in_progress', 'all'] as const
type BacklogTab = (typeof tabs)[number]

const tabLabels: Record<BacklogTab, string> = {
  ready: 'Ready to automate',
  in_progress: 'In progress',
  all: 'All cases',
}

const tabStatus: Record<BacklogTab, string | undefined> = {
  ready: 'not_automated',
  in_progress: 'in_progress',
  all: 'all',
}

export function AutomationBacklogPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<BacklogTab>('ready')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [automateOpen, setAutomateOpen] = useState(false)

  const backlogQ = useAutomationBacklog({
    q: search.trim() || undefined,
    status: tabStatus[tab],
  })
  const repos = useRepoConnections()
  const policies = useBranchPolicies()
  const settings = useSettings()
  const automate = useAutomateTestCase()

  const defaultEngine = settings.data?.copilotAgentEnabled
    ? 'copilot_agent'
    : 'stub'

  const items = backlogQ.data?.items ?? []

  const selected = useMemo(
    () => items.find((tc) => tc.id === selectedId) ?? items[0] ?? null,
    [items, selectedId],
  )

  async function onAutomate(values: AutomateTestCaseFormValues) {
    if (!selected) return
    try {
      const session = await automate.mutateAsync({
        testCaseId: selected.id,
        input: values,
      })
      toast.success('Automation session created')
      setAutomateOpen(false)
      navigate(`/sessions/${session.id}`)
    } catch (e) {
      toast.error(formatErrorForToast(e))
    }
  }

  function onPrimaryAction(tc: AutomationBacklogTestCase) {
    if (tc.automationStatus === 'in_progress' && tc.sessionId) {
      navigate(`/sessions/${tc.sessionId}`)
      return
    }
    if (tc.automationStatus === 'automated' && tc.sessionId) {
      navigate(`/sessions/${tc.sessionId}`)
      return
    }
    setSelectedId(tc.id)
    setAutomateOpen(true)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations"
        title="Automation backlog"
        description="Approved test cases waiting for automation. Select a case, review the plan, run automation, then review output and publish."
        actions={
          <Link to="/sessions" className={buttonVariants({ variant: 'outline' })}>
            View automation runs
          </Link>
        }
      />

      {backlogQ.isError ? (
        <QueryErrorAlert
          error={backlogQ.error}
          onRetry={() => void backlogQ.refetch()}
        />
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as BacklogTab)}
          className="w-full sm:w-auto"
        >
          <TabsList className="bg-muted/40 h-auto w-full justify-start gap-1 rounded-xl p-1 sm:w-auto">
            {tabs.map((t) => (
              <TabsTrigger key={t} value={t} className="rounded-lg text-xs">
                {tabLabels[t]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cases, stories, IDs…"
            className="pl-9"
          />
        </div>
      </div>

      {backlogQ.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-5">
          <Skeleton className="h-96 rounded-2xl lg:col-span-3" />
          <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No test cases in this view"
          description="Approved test cases ready for automation will appear here. Try another filter or check your test case registry connection."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="border-border/70 bg-surface overflow-hidden rounded-2xl border lg:col-span-3">
            <div className="border-border/60 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-muted/30 text-muted-foreground text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 font-medium">Test case</th>
                    <th className="px-4 py-3 font-medium">Story</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Updated</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((tc) => {
                    const active = selected?.id === tc.id
                    return (
                      <tr
                        key={tc.id}
                        className={cn(
                          'border-border/50 hover:bg-muted/20 border-t transition-colors',
                          active && 'bg-swarm/6',
                        )}
                      >
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className="text-left"
                            onClick={() => setSelectedId(tc.id)}
                          >
                            <p className="font-medium">{tc.title}</p>
                            <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                              {tc.caseId ?? tc.sourceReference}
                            </p>
                          </button>
                        </td>
                        <td className="text-muted-foreground px-4 py-3 text-xs">
                          {tc.storyKey ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {testCaseStatusLabels[tc.automationStatus]}
                        </td>
                        <td className="text-muted-foreground px-4 py-3 text-xs whitespace-nowrap">
                          {tc.updatedAt
                            ? formatDistanceToNow(new Date(tc.updatedAt), {
                                addSuffix: true,
                              })
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant={
                              tc.automationStatus === 'not_automated'
                                ? 'default'
                                : 'outline'
                            }
                            className={cn(
                              tc.automationStatus === 'not_automated' &&
                                'bg-swarm text-swarm-foreground hover:bg-swarm/90',
                            )}
                            onClick={() => onPrimaryAction(tc)}
                          >
                            {tc.automationStatus === 'not_automated' ? (
                              <>
                                <Play className="size-3.5" />
                                Automate
                              </>
                            ) : (
                              <>
                                Open
                                <ArrowRight className="size-3.5" />
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-2">
            {selected ? (
              <>
                <TestCasePreviewPanel testCase={selected} />
                {selected.automationStatus === 'not_automated' ? (
                  <Button
                    className="bg-swarm text-swarm-foreground hover:bg-swarm/90 w-full gap-2"
                    onClick={() => setAutomateOpen(true)}
                  >
                    <Play className="size-4" />
                    Automate test case
                  </Button>
                ) : selected.sessionId ? (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => navigate(`/sessions/${selected.sessionId}`)}
                  >
                    Continue automation
                    <ArrowRight className="size-4" />
                  </Button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      )}

      <AutomateTestCaseDialog
        open={automateOpen}
        onOpenChange={setAutomateOpen}
        testCase={selected}
        repos={repos.data ?? []}
        policies={policies.data ?? []}
        defaultEngine={defaultEngine}
        pending={automate.isPending}
        onSubmit={(values) => void onAutomate(values)}
      />
    </div>
  )
}
