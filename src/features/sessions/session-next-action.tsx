import {
  ExternalLink,
  GitPullRequest,
  Loader2,
  MessageSquarePlus,
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
  repoId: string
  startPending: boolean
  approvePending: boolean
  createPrPending: boolean
  onStart: () => void
  onRequestChanges: () => void
  onApprove: () => void
  onCreatePr: () => void
}

export function SessionNextAction({
  session,
  repoId,
  startPending,
  approvePending,
  createPrPending,
  onStart,
  onRequestChanges,
  onApprove,
  onCreatePr,
}: Props) {
  const hints = sessionActionHints(session)
  const heading = getNextStepHeading(session)
  const message = getNextStepMessage(session)

  const showActions =
    hints.canStart ||
    hints.canRevise ||
    hints.canApprove ||
    hints.canCreatePr ||
    hints.canOpenPr

  return (
    <div
      className={cn(
        'rounded-2xl border p-5 sm:p-6',
        hints.canApprove || hints.canCreatePr
          ? 'border-swarm/25 bg-swarm/5'
          : 'border-border/70 bg-surface-raised',
      )}
    >
      <p className="text-swarm text-xs font-semibold tracking-widest uppercase">
        {heading}
      </p>
      <p className="text-foreground mt-2 text-base font-medium leading-snug">
        {message}
      </p>

      {showActions ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {hints.canStart ? (
            <Button
              size="default"
              disabled={startPending}
              className="bg-swarm text-swarm-foreground hover:bg-swarm/90 gap-2"
              onClick={onStart}
            >
              {startPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
              {startPending ? 'Starting…' : 'Start automation'}
            </Button>
          ) : null}

          {hints.canApprove ? (
            <Button
              size="default"
              disabled={approvePending}
              className="bg-swarm text-swarm-foreground hover:bg-swarm/90 gap-2"
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

          {hints.canRevise ? (
            <Button
              variant="outline"
              size="default"
              className="gap-2"
              onClick={onRequestChanges}
            >
              <MessageSquarePlus className="size-4" />
              Request changes
            </Button>
          ) : null}

          {hints.canCreatePr ? (
            <Button
              size="default"
              disabled={createPrPending || !repoId}
              className="bg-swarm text-swarm-foreground hover:bg-swarm/90 gap-2"
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
              className="bg-swarm text-swarm-foreground hover:bg-swarm/90 inline-flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium"
            >
              <ExternalLink className="size-4" />
              Open pull request
            </a>
          ) : null}
        </div>
      ) : hints.isWaiting && (hints.stage === 'running' || hints.stage === 'revising') ? (
        <div className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
          <Loader2 className="text-swarm size-4 animate-spin" />
          Automation is working — check back here for updates.
        </div>
      ) : null}
    </div>
  )
}
