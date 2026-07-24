import { AlertTriangle, CheckCircle2 } from 'lucide-react'

import type { RequirementAnalysis } from '@/api/schemas'
import { SectionBlock } from '@/components/patterns/section-block'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Props = {
  analysis: RequirementAnalysis
  className?: string
}

export function RequirementAnalysisPanel({ analysis, className }: Props) {
  const gaps = analysis.gaps ?? []
  const readiness = analysis.readinessStatus ?? 'ready'

  return (
    <div className={cn('space-y-6', className)}>
      {analysis.summary ? (
        <SectionBlock title="Story summary" description="Extracted from Jira">
          <p className="text-sm leading-relaxed">{analysis.summary}</p>
        </SectionBlock>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant={
            readiness === 'ready'
              ? 'default'
              : readiness === 'blocked'
                ? 'destructive'
                : 'secondary'
          }
        >
          {readiness === 'ready'
            ? 'Ready for planning'
            : readiness === 'blocked'
              ? 'Blocked'
              : 'Needs clarification'}
        </Badge>
        {gaps.length > 0 ? (
          <span className="text-muted-foreground text-xs">
            {gaps.length} gap{gaps.length === 1 ? '' : 's'} identified
          </span>
        ) : null}
      </div>

      {analysis.acceptanceCriteria?.length ? (
        <SectionBlock
          title="Acceptance criteria"
          description="Mapped from the Jira story"
        >
          <ul className="space-y-2">
            {analysis.acceptanceCriteria.map((ac) => (
              <li
                key={ac.id}
                className="border-border/60 flex gap-3 rounded-lg border px-3 py-2 text-sm"
              >
                {ac.covered ? (
                  <CheckCircle2 className="text-status-succeeded mt-0.5 size-4 shrink-0" />
                ) : (
                  <AlertTriangle className="text-status-awaiting mt-0.5 size-4 shrink-0" />
                )}
                <span>{ac.text}</span>
              </li>
            ))}
          </ul>
        </SectionBlock>
      ) : null}

      {gaps.length > 0 ? (
        <SectionBlock
          title="Gaps & ambiguities"
          description="Review before continuing to the test-design plan"
        >
          <ul className="space-y-2">
            {gaps.map((gap) => (
              <li
                key={gap.id}
                className="border-status-awaiting/30 bg-status-awaiting/8 rounded-lg border px-3 py-2 text-sm"
              >
                <span className="text-muted-foreground text-[10px] font-semibold uppercase">
                  {gap.severity ?? 'medium'}
                </span>
                <p className="mt-1">{gap.description}</p>
              </li>
            ))}
          </ul>
        </SectionBlock>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <ListSection title="Business rules" items={analysis.businessRules} />
        <ListSection title="Dependencies" items={analysis.dependencies} />
        <ListSection title="Assumptions" items={analysis.assumptions} />
        <ListSection title="Risks" items={analysis.risks} />
      </div>

      {analysis.proposedScope ? (
        <SectionBlock title="Proposed scope">
          <p className="text-sm leading-relaxed">{analysis.proposedScope}</p>
        </SectionBlock>
      ) : null}

      {analysis.missingInformation?.length ? (
        <SectionBlock title="Missing information">
          <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
            {analysis.missingInformation.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </SectionBlock>
      ) : null}
    </div>
  )
}

function ListSection({
  title,
  items,
}: {
  title: string
  items?: string[]
}) {
  if (!items?.length) return null
  return (
    <SectionBlock title={title}>
      <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </SectionBlock>
  )
}
