import { BookOpen } from 'lucide-react'

import type { SessionBrief, SessionDetail } from '@/api/schemas'
import { LinkButton } from '@/components/ui/link-button'

type Props = {
  session: SessionDetail
  brief?: SessionBrief | null
}

export function TestCaseContextBanner({ session, brief }: Props) {
  const source = brief?.sourceSummary
  const title =
    source?.sourceTitle ?? session.sourceLabel ?? session.sourceRef
  const caseId = source?.caseId ?? session.approvedCaseId ?? session.sourceRef
  const storyRef = source?.sourceReference

  if (!title && !caseId) return null

  return (
    <div className="border-swarm/25 bg-swarm/6 flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="bg-swarm/12 text-swarm flex size-9 shrink-0 items-center justify-center rounded-lg">
          <BookOpen className="size-4" />
        </div>
        <div>
          <p className="text-sm font-medium">Automating test case</p>
          <p className="text-foreground mt-0.5 text-sm">{title}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Case <span className="font-mono">{caseId}</span>
            {storyRef && storyRef !== caseId ? (
              <>
                {' '}
                · Story <span className="font-mono">{storyRef}</span>
              </>
            ) : null}
            {source?.sourceSystem ? ` · ${source.sourceSystem}` : null}
          </p>
        </div>
      </div>
      <LinkButton variant="ghost" size="sm" to="/automation-backlog" className="shrink-0">
        View backlog
      </LinkButton>
    </div>
  )
}
