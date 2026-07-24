import { Link } from 'react-router-dom'

import { useStories } from '@/api/hooks'
import { EmptyState } from '@/components/patterns/empty-state'
import { PageHeader } from '@/components/patterns/page-header'
import { QueryErrorAlert } from '@/components/patterns/query-error'
import { LinkButton } from '@/components/ui/link-button'
import { Skeleton } from '@/components/ui/skeleton'

export function TestDesignRunsPage() {
  const storiesQ = useStories()
  const runs =
    storiesQ.data?.stories.filter((s) => s.hasActiveRun && s.activeRunId) ?? []

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operations"
        title="Test Design"
        description="Active and recent test-design runs from Story Intake."
        actions={
          <LinkButton to="/story-intake">Select Jira stories</LinkButton>
        }
      />

      {storiesQ.isError ? (
        <QueryErrorAlert
          error={storiesQ.error}
          onRetry={() => void storiesQ.refetch()}
        />
      ) : null}

      {storiesQ.isLoading ? (
        <Skeleton className="h-24 rounded-xl" />
      ) : runs.length === 0 ? (
        <EmptyState
          title="No test-design runs"
          description="Start from Story Intake to analyze a Jira story and design test cases."
        >
          <LinkButton to="/story-intake">Go to Story Intake</LinkButton>
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {runs.map((story) => (
            <Link
              key={story.activeRunId}
              to={`/test-design/${story.activeRunId}`}
              className="border-border/70 bg-surface-raised hover:border-swarm/35 flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors"
            >
              <div>
                <p className="font-mono text-sm font-semibold">{story.storyKey}</p>
                <p className="text-sm">{story.title}</p>
              </div>
              <div className="text-right text-xs">
                <p className="font-medium">In progress</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
