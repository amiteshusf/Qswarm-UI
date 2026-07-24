import { formatDistanceToNow } from 'date-fns'
import { ExternalLink, Play, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { formatErrorForToast } from '@/api/errors'
import { useCreateTestDesignRun, useSettings, useStories } from '@/api/hooks'
import type { JiraStory } from '@/api/schemas'
import { EmptyState } from '@/components/patterns/empty-state'
import { PageHeader } from '@/components/patterns/page-header'
import { QueryErrorAlert } from '@/components/patterns/query-error'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
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
import { cn } from '@/lib/utils'

const readinessLabels = {
  ready: 'Ready',
  partial: 'Partial AC',
  missing: 'Missing AC',
} as const

export function StoryIntakePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [project, setProject] = useState<string>('all')
  const [readiness, setReadiness] = useState<string>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const settings = useSettings()
  const storiesQ = useStories({
    q: search.trim() || undefined,
    project: project === 'all' ? undefined : project,
    readiness: readiness === 'all' ? undefined : readiness,
  })
  const createRun = useCreateTestDesignRun()

  const jiraConfigured = settings.data?.jira?.configured
  const items = storiesQ.data?.items ?? []
  const projects = storiesQ.data?.projects ?? []

  const selectedStories = useMemo(
    () => items.filter((s) => selected.has(s.key)),
    [items, selected],
  )

  function toggleStory(key: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function startTestDesign(story: JiraStory) {
    try {
      const run = await createRun.mutateAsync(story.key)
      toast.success(`Test-design run opened for ${story.key}`)
      navigate(`/test-design/${run.id}`)
    } catch (e) {
      toast.error(formatErrorForToast(e))
    }
  }

  async function startSelected() {
    const story = selectedStories[0]
    if (!story) return
    await startTestDesign(story)
  }

  function onRowAction(story: JiraStory) {
    if (story.hasActiveRun && story.activeRunId) {
      navigate(`/test-design/${story.activeRunId}`)
      return
    }
    void startTestDesign(story)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations"
        title="Story Intake"
        description="Select Jira stories to analyze requirements, design test cases, and publish to your test registry."
        actions={
          <div className="flex flex-wrap gap-2">
            {selectedStories.length > 0 ? (
              <Button
                disabled={createRun.isPending}
                onClick={() => void startSelected()}
              >
                <Play className="size-4" />
                Start test design ({selectedStories.length})
              </Button>
            ) : null}
            <Link to="/test-design" className={buttonVariants({ variant: 'outline' })}>
              Test Design runs
            </Link>
          </div>
        }
      />

      {!settings.isLoading && !jiraConfigured ? (
        <div className="border-status-awaiting/30 bg-status-awaiting/8 rounded-xl border px-4 py-3 text-sm">
          Jira is not fully configured.{' '}
          <Link to="/settings" className="text-swarm font-medium hover:underline">
            Check integrations
          </Link>{' '}
          or use mock data in development.
        </div>
      ) : null}

      {storiesQ.isError ? (
        <QueryErrorAlert
          error={storiesQ.error}
          onRetry={() => void storiesQ.refetch()}
        />
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            className="pl-9"
            placeholder="Search by key or title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={project} onValueChange={(v) => setProject(v ?? 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.key} value={p.key}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tabs value={readiness} onValueChange={setReadiness}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="ready">Ready</TabsTrigger>
              <TabsTrigger value="partial">Partial</TabsTrigger>
              <TabsTrigger value="missing">Missing AC</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {storiesQ.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No eligible stories"
          description="Try a different project or search. Stories need to be synced from Jira."
        />
      ) : (
        <div className="space-y-2">
          {items.map((story) => (
            <StoryRow
              key={story.key}
              story={story}
              checked={selected.has(story.key)}
              onToggle={() => toggleStory(story.key)}
              onAction={() => onRowAction(story)}
              pending={createRun.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function StoryRow({
  story,
  checked,
  onToggle,
  onAction,
  pending,
}: {
  story: JiraStory
  checked: boolean
  onToggle: () => void
  onAction: () => void
  pending: boolean
}) {
  const readiness = story.acceptanceCriteriaReadiness ?? 'ready'
  const hasRun = story.hasActiveRun && story.activeRunId

  return (
    <div
      className={cn(
        'border-border/70 bg-surface-raised hover:border-swarm/30 flex flex-col gap-3 rounded-xl border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between',
        checked && 'border-swarm/40 ring-1 ring-swarm/15',
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="border-border mt-1 size-4 rounded"
          aria-label={`Select ${story.key}`}
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold">{story.key}</span>
            <Badge variant="outline">{story.status}</Badge>
            <Badge
              variant={
                readiness === 'ready'
                  ? 'default'
                  : readiness === 'missing'
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {readinessLabels[readiness]}
            </Badge>
            {hasRun ? (
              <Badge variant="secondary">QSwarm run active</Badge>
            ) : null}
          </div>
          <p className="mt-1 truncate text-sm font-medium">{story.title}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {story.projectName ?? story.projectKey}
            {story.sprint ? ` · ${story.sprint}` : ''}
            {story.updatedAt
              ? ` · Updated ${formatDistanceToNow(new Date(story.updatedAt), { addSuffix: true })}`
              : ''}
          </p>
          {story.missingInformation?.length ? (
            <p className="text-status-awaiting mt-1 text-xs">
              Missing: {story.missingInformation[0]}
              {story.missingInformation.length > 1
                ? ` (+${story.missingInformation.length - 1} more)`
                : ''}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
        {story.externalUrl ? (
          <a
            href={story.externalUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            <ExternalLink className="size-4" />
            Jira
          </a>
        ) : null}
        <Button
          size="sm"
          variant={hasRun ? 'outline' : 'default'}
          disabled={pending}
          onClick={onAction}
        >
          {hasRun ? 'Open run' : 'Start test design'}
        </Button>
      </div>
    </div>
  )
}
