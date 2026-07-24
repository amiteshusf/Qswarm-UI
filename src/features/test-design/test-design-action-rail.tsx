import { ExternalLink, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { TestDesignRun } from '@/api/schemas'
import {
  buildTestDesignContext,
  testDesignActionHints,
  testDesignPrimaryActionLabel,
  type TestDesignPrimaryAction,
} from '@/features/test-design/test-design-actions'
import {
  getTestDesignHeroSummary,
  getTestDesignStatusLabel,
} from '@/features/test-design/test-design-lifecycle'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import { cn } from '@/lib/utils'

type Props = {
  run: TestDesignRun
  pending?: boolean
  onPrimaryAction: (action: TestDesignPrimaryAction) => void
  className?: string
}

export function TestDesignActionRail({
  run,
  pending,
  onPrimaryAction,
  className,
}: Props) {
  const ctx = buildTestDesignContext(run)
  const hints = testDesignActionHints(ctx)

  return (
    <div
      className={cn(
        'border-border/70 bg-surface-raised space-y-4 rounded-2xl border p-5 shadow-sm',
        className,
      )}
    >
      <div>
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Next step
        </p>
        <p className="mt-1 text-sm font-semibold">
          {getTestDesignStatusLabel(ctx)}
        </p>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {getTestDesignHeroSummary(ctx)}
        </p>
      </div>

      {hints.primaryAction === 'open_automation_backlog' ? (
        <LinkButton to="/automation-backlog" className="w-full">
          {testDesignPrimaryActionLabel('open_automation_backlog')}
        </LinkButton>
      ) : hints.primaryAction ? (
        <Button
          className="w-full gap-2"
          disabled={pending || hints.isWaiting}
          onClick={() => onPrimaryAction(hints.primaryAction!)}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : null}
          {testDesignPrimaryActionLabel(hints.primaryAction)}
        </Button>
      ) : hints.isWaiting ? (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Working…
        </div>
      ) : null}

      {run.externalUrl ? (
        <a
          href={run.externalUrl}
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs"
        >
          <ExternalLink className="size-3.5" />
          Open in Jira
        </a>
      ) : null}

      <Link
        to="/story-intake"
        className="text-muted-foreground hover:text-foreground block text-xs"
      >
        ← Back to Story Intake
      </Link>
    </div>
  )
}
