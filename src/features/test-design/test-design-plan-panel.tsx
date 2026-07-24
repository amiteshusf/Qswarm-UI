import type { TestDesignPlan } from '@/api/schemas'
import { SectionBlock } from '@/components/patterns/section-block'
import { cn } from '@/lib/utils'

type Props = {
  plan: TestDesignPlan
  className?: string
}

export function TestDesignPlanPanel({ plan, className }: Props) {
  return (
    <div className={cn('space-y-6', className)}>
      {plan.summary ? (
        <SectionBlock title="Plan summary">
          <p className="text-sm leading-relaxed">{plan.summary}</p>
        </SectionBlock>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <PlanListSection title="Functional areas" items={plan.functionalAreas} />
        <PlanListSection title="Positive scenarios" items={plan.positiveScenarios} />
        <PlanListSection title="Negative scenarios" items={plan.negativeScenarios} />
        <PlanListSection title="Boundary coverage" items={plan.boundaryCoverage} />
        <PlanListSection title="Data variations" items={plan.dataVariations} />
        <PlanListSection title="Automation candidates" items={plan.automationCandidates} />
        <PlanListSection title="Exclusions" items={plan.exclusions} />
      </div>

      {plan.traceability?.length ? (
        <SectionBlock
          title="Traceability"
          description="Coverage mapped to acceptance criteria"
        >
          <div className="space-y-2">
            {plan.traceability.map((row) => (
              <div
                key={row.acceptanceCriteriaId}
                className="border-border/60 rounded-lg border px-3 py-2 text-sm"
              >
                <span className="font-mono text-xs">{row.acceptanceCriteriaId}</span>
                <p className="text-muted-foreground mt-1">{row.coverage}</p>
              </div>
            ))}
          </div>
        </SectionBlock>
      ) : null}

      {plan.estimatedCaseCount != null ? (
        <p className="text-muted-foreground text-sm">
          Estimated test cases:{' '}
          <span className="text-foreground font-medium">
            {plan.estimatedCaseCount}
          </span>
        </p>
      ) : null}
    </div>
  )
}

function PlanListSection({
  title,
  items,
}: {
  title: string
  items?: string[]
}) {
  if (!items?.length) return null
  return (
    <SectionBlock title={title}>
      <ul className="space-y-1.5 text-sm">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-swarm mt-1.5 size-1.5 shrink-0 rounded-full bg-current" />
            {item}
          </li>
        ))}
      </ul>
    </SectionBlock>
  )
}
