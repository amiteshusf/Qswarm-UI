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
import {
  acceptanceCriteriaStatusLabel,
  deriveProjectsFromStories,
  formatMissingInformationSummary,
  formatStoryMetaLine,
  resolveStoryRowAction,
  storyRowActionLabel,
} from '@/features/story-intake/story-intake-utils'
import { cn } from '@/lib/utils'

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
  const stories = storiesQ.data?.stories ?? []
  const projects = useMemo(
    () => deriveProjectsFromStories(stories),
    [stories],
  )

  const selectedStories = useMemo(
    () => stories.filter((s) => selected.has(s.storyKey)),
    [stories, selected],
  )

  function toggleStory(storyKey: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(storyKey)) next.delete(storyKey)
      else next.add(storyKey)
      return next
    })
  }

  async function startTestDesign(story: JiraStory) {
    try {
      const run = await createRun.mutateAsync(story.storyKey)
      toast.success(`Test-design run opened for ${story.storyKey}`)
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
    if (resolveStoryRowAction(story) === 'open_run' && story.activeRunId) {
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
              <TabsTrigger value="missing_ac">Missing AC</TabsTrigger>
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
      ) : stories.length === 0 ? (
        <EmptyState
          title="No eligible stories"
          description="Try a different project or search. Stories need to be synced from Jira."
        />
      ) : (
        <div className="space-y-2">
          {stories.map((story) => (
            <StoryRow
              key={story.storyKey}
              story={story}
              checked={selected.has(story.storyKey)}
              onToggle={() => toggleStory(story.storyKey)}
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
  const acStatus = story.acceptanceCriteriaStatus
  const rowAction = resolveStoryRowAction(story)
  const missingSummary = formatMissingInformationSummary(
    story.missingInformation,
  )

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
          aria-label={`Select ${story.storyKey}`}
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold">
              {story.storyKey}
            </span>
            <Badge variant="outline">{story.status}</Badge>
            <Badge
              variant={
                acStatus === 'ready'
                  ? 'default'
                  : acStatus === 'missing_ac'
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {acceptanceCriteriaStatusLabel(acStatus)}
            </Badge>
            {story.hasActiveRun ? (
              <Badge variant="secondary">QSwarm run active</Badge>
            ) : null}
          </div>
          <p className="mt-1 truncate text-sm font-medium">{story.title}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {formatStoryMetaLine(story)}
          </p>
          {missingSummary ? (
            <p className="text-status-awaiting mt-1 text-xs">
              Missing: {missingSummary}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
        <a
          href={story.jiraUrl}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          <ExternalLink className="size-4" />
          Jira
        </a>
        <Button
          size="sm"
          variant={rowAction === 'open_run' ? 'outline' : 'default'}
          disabled={pending}
          onClick={onAction}
        >
          {storyRowActionLabel(rowAction)}
        </Button>
      </div>
    </div>
  )
}
