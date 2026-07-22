import type { AutomationBacklogTestCase } from '@/api/schemas'
import { cn } from '@/lib/utils'
import { BookOpen, GitBranch, Layers } from 'lucide-react'

const statusLabels = {
  not_automated: 'Ready to automate',
  in_progress: 'Automation in progress',
  automated: 'Automated',
  failed: 'Needs attention',
} as const

const statusStyles = {
  not_automated:
    'border-status-awaiting/30 bg-status-awaiting/10 text-status-awaiting',
  in_progress:
    'border-status-running/30 bg-status-running/10 text-[color:var(--status-running)]',
  automated:
    'border-status-succeeded/30 bg-status-succeeded/10 text-[color:var(--status-succeeded)]',
  failed: 'border-destructive/30 bg-destructive/10 text-destructive',
} as const

type Props = {
  testCase: AutomationBacklogTestCase
  className?: string
}

export function TestCasePreviewPanel({ testCase, className }: Props) {
  return (
    <div
      className={cn(
        'border-border/70 bg-surface-raised space-y-4 rounded-2xl border p-5 shadow-sm',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-swarm text-xs font-semibold tracking-widest uppercase">
            Test case preview
          </p>
          <h2 className="text-foreground mt-1 text-lg font-semibold leading-snug">
            {testCase.title}
          </h2>
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            {testCase.caseId ?? testCase.id}
          </p>
        </div>
        <span
          className={cn(
            'rounded-full border px-2.5 py-1 text-[11px] font-medium',
            statusStyles[testCase.automationStatus],
          )}
        >
          {statusLabels[testCase.automationStatus]}
        </span>
      </div>

      {testCase.objective ? (
        <p className="text-muted-foreground text-sm leading-relaxed">
          {testCase.objective}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <MetaTile
          icon={BookOpen}
          label="Story"
          value={testCase.storyKey ?? '—'}
          detail={testCase.storyTitle}
        />
        <MetaTile
          icon={Layers}
          label="Source"
          value={testCase.sourceReference ?? testCase.caseId ?? '—'}
          detail={testCase.sourceSystem}
        />
        <MetaTile
          icon={GitBranch}
          label="Target area"
          value={testCase.targetArea ?? 'Not specified'}
        />
      </div>

      {testCase.stepsPreview ? (
        <div className="border-border/60 bg-muted/15 rounded-xl border p-4">
          <p className="text-sm font-medium">Steps summary</p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {testCase.stepsPreview}
          </p>
        </div>
      ) : null}
    </div>
  )
}

function MetaTile({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  detail?: string
}) {
  return (
    <div className="border-border/50 rounded-lg border bg-surface px-3 py-2.5">
      <div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide">
        <Icon className="size-3" />
        {label}
      </div>
      <p className="text-sm font-medium">{value}</p>
      {detail ? (
        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">{detail}</p>
      ) : null}
    </div>
  )
}

export { statusLabels as testCaseStatusLabels }
