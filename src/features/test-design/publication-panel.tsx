import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { TestDesignReviewData } from '@/api/schemas'
import { LinkButton } from '@/components/ui/link-button'
import { cn } from '@/lib/utils'

type Props = {
  reviewData: TestDesignReviewData
  className?: string
}

export function PublicationPanel({ reviewData, className }: Props) {
  const pub = reviewData.publicationResult
  if (!pub) {
    return (
      <div className={cn('text-muted-foreground text-sm', className)}>
        Publication results will appear here after test cases are published.
      </div>
    )
  }

  const readyCount = pub.readyForAutomationCount ?? 0

  return (
    <div className={cn('space-y-6', className)}>
      <div className="border-status-succeeded/30 bg-status-succeeded/8 rounded-xl border px-4 py-3">
        <p className="font-medium">
          {pub.status === 'succeeded'
            ? 'Test cases published successfully'
            : 'Publication completed with issues'}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {pub.publishedCount ?? 0} published
          {(pub.failedCount ?? 0) > 0
            ? ` · ${pub.failedCount} failed`
            : ''}
          {pub.destination ? ` · Destination: ${pub.destination}` : ''}
        </p>
      </div>

      {readyCount > 0 ? (
        <div className="border-swarm/25 bg-swarm/6 rounded-xl border px-4 py-4">
          <p className="font-medium">
            {readyCount} test case{readyCount === 1 ? '' : 's'} ready for
            automation
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Open the Automation Backlog to select cases and start Playwright
            generation.
          </p>
          <LinkButton to="/automation-backlog" className="mt-3">
            Open Automation Backlog
          </LinkButton>
        </div>
      ) : null}

      {pub.items?.length ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Published test cases</p>
          {pub.items.map((item) => (
            <div
              key={item.externalId ?? item.title}
              className="border-border/60 flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-muted-foreground text-xs capitalize">
                  {item.status}
                  {item.externalId ? ` · ${item.externalId}` : ''}
                </p>
              </div>
              {item.externalUrl ? (
                <a
                  href={item.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-swarm flex shrink-0 items-center gap-1 text-xs"
                >
                  <ExternalLink className="size-3.5" />
                  View
                </a>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <Link
        to={`/test-design/${reviewData.runId}`}
        className="text-muted-foreground hover:text-foreground text-xs"
      >
        Return to test-design workspace
      </Link>
    </div>
  )
}
