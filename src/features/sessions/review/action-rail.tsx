import {
  ExternalLink,
  GitPullRequest,
  Loader2,
  Play,
  ShieldCheck,
} from 'lucide-react'

import type { SessionDetail } from '@/api/schemas'
import { sessionActionHints } from '@/features/sessions/session-actions'
import {
  getNextStepHeading,
  getNextStepMessage,
} from '@/features/sessions/session-lifecycle'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  session: SessionDetail
  repoName: string
  repoId: string
  startPending: boolean
  approvePending: boolean
  createPrPending: boolean
  onStart: () => void
  onApprove: () => void
  onCreatePr: () => void
  onScrollToComposer?: () => void
  className?: string
}

export function ActionRail({
  session,
  repoName,
  repoId,
  startPending,
  approvePending,
  createPrPending,
  onStart,
  onApprove,
  onCreatePr,
  className,
}: Props) {
  const hints = sessionActionHints(session)
  const heading = getNextStepHeading(session)
  const message = getNextStepMessage(session)

  const showActions =
    hints.canStart ||
    hints.canApprove ||
    hints.canCreatePr ||
    hints.canOpenPr

  return (
    <aside
      className={cn(
        'border-border/70 bg-surface-raised space-y-4 rounded-2xl border p-5 shadow-sm lg:sticky lg:top-20',
        className,
      )}
    >
      <div>
        <p className="text-swarm text-xs font-semibold tracking-widest uppercase">
          Your decision
        </p>
        <p className="text-foreground mt-2 text-sm font-medium leading-snug">
          {heading}
        </p>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          {message}
        </p>
      </div>

      {showActions ? (
        <div className="flex flex-col gap-2">
          {hints.canStart ? (
            <Button
              className="bg-swarm text-swarm-foreground hover:bg-swarm/90 w-full gap-2"
              disabled={startPending}
              onClick={onStart}
            >
              {startPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
              Start automation
            </Button>
          ) : null}

          {hints.canApprove ? (
            <Button
              className="bg-swarm text-swarm-foreground hover:bg-swarm/90 w-full gap-2"
              disabled={approvePending}
              onClick={onApprove}
            >
              {approvePending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
              Approve output
            </Button>
          ) : null}

          {hints.canCreatePr ? (
            <Button
              className="bg-swarm text-swarm-foreground hover:bg-swarm/90 w-full gap-2"
              disabled={createPrPending || !repoId}
              onClick={onCreatePr}
            >
              <GitPullRequest className="size-4" />
              Publish pull request
            </Button>
          ) : null}

          {hints.canOpenPr && session.prExternalUrl ? (
            <a
              href={session.prExternalUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-swarm text-swarm-foreground hover:bg-swarm/90 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium"
            >
              <ExternalLink className="size-4" />
              Open pull request
            </a>
          ) : null}
        </div>
      ) : hints.isWaiting &&
        (hints.stage === 'running' || hints.stage === 'revising') ? (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="text-swarm size-4 animate-spin" />
          Automation in progress…
        </div>
      ) : null}

      {hints.canRevise ? (
        <p className="text-muted-foreground border-border/50 border-t pt-3 text-xs leading-relaxed">
          To request changes, use the <strong>review conversation</strong>{' '}
          composer below — type naturally, like ChatGPT.
        </p>
      ) : null}

      <div className="border-border/50 space-y-2 border-t pt-3 text-xs">
        <MetaLine label="Repository" value={repoName} />
        <MetaLine label="Engine" value={session.engine} mono />
        {session.prExternalUrl ? (
          <MetaLine label="Pull request" value="Created" />
        ) : null}
      </div>
    </aside>
  )
}

function MetaLine({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('text-right font-medium', mono && 'font-mono')}>
        {value}
      </span>
    </div>
  )
}
