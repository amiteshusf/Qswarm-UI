import type { TestCaseDraft } from '@/api/schemas'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Props = {
  testCase: TestCaseDraft
  className?: string
}

export function TestCaseDetailPanel({ testCase, className }: Props) {
  return (
    <div className={cn('border-border/70 bg-surface-raised space-y-4 rounded-2xl border p-5', className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-muted-foreground">
            {testCase.draftId ?? testCase.id}
          </p>
          <h3 className="mt-1 text-base font-semibold">{testCase.title}</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {testCase.priority ? (
            <Badge variant="secondary">{testCase.priority}</Badge>
          ) : null}
          {testCase.type ? <Badge variant="outline">{testCase.type}</Badge> : null}
          {testCase.automationCandidate ? (
            <Badge className="bg-swarm/12 text-swarm">Automation candidate</Badge>
          ) : null}
          {testCase.changeType && testCase.changeType !== 'unchanged' ? (
            <Badge variant="secondary">{testCase.changeType}</Badge>
          ) : null}
        </div>
      </div>

      {testCase.objective ? (
        <Section label="Objective" value={testCase.objective} />
      ) : null}

      {testCase.preconditions?.length ? (
        <ListSection label="Preconditions" items={testCase.preconditions} />
      ) : null}

      {testCase.data ? <Section label="Test data" value={testCase.data} /> : null}

      {testCase.steps?.length ? (
        <ListSection label="Steps" items={testCase.steps} ordered />
      ) : null}

      {testCase.expectedResults?.length ? (
        <ListSection label="Expected results" items={testCase.expectedResults} />
      ) : null}

      {testCase.linkedAcceptanceCriteria?.length ? (
        <div>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Linked acceptance criteria
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {testCase.linkedAcceptanceCriteria.map((ac) => (
              <Badge key={ac} variant="outline" className="font-mono text-xs">
                {ac}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Section({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-1 text-sm leading-relaxed">{value}</p>
    </div>
  )
}

function ListSection({
  label,
  items,
  ordered,
}: {
  label: string
  items: string[]
  ordered?: boolean
}) {
  const Tag = ordered ? 'ol' : 'ul'
  return (
    <div>
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {label}
      </p>
      <Tag className="mt-2 space-y-1 pl-5 text-sm">
        {items.map((item, i) => (
          <li key={`${label}-${i}`}>{item}</li>
        ))}
      </Tag>
    </div>
  )
}
