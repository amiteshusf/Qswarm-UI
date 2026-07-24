import {
  TEST_DESIGN_WORKFLOW_STEPS,
  testDesignWorkflowStepIndex,
  type TestDesignContext,
} from '@/features/test-design/test-design-lifecycle'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

type Props = {
  ctx: TestDesignContext
  className?: string
}

export function TestDesignWorkflowStrip({ ctx, className }: Props) {
  const current = testDesignWorkflowStepIndex(ctx)
  const terminal = Boolean(ctx.blockedReason)

  return (
    <div
      className={cn(
        'border-border/70 bg-surface-raised flex flex-wrap items-center gap-1 rounded-xl border p-2',
        className,
      )}
      role="list"
      aria-label="Test design progress"
    >
      {TEST_DESIGN_WORKFLOW_STEPS.map((step, idx) => {
        const done = idx < current
        const active = idx === current && !terminal
        const failed = terminal && idx === current

        return (
          <div key={step.id} className="flex items-center gap-1" role="listitem">
            <div
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                done && 'text-status-succeeded',
                active && 'bg-swarm/12 text-swarm ring-1 ring-swarm/25',
                failed && 'bg-destructive/10 text-destructive ring-1 ring-destructive/20',
                !done && !active && !failed && 'text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
                  done && 'bg-status-succeeded/15 text-status-succeeded',
                  active && 'bg-swarm text-swarm-foreground',
                  failed && 'bg-destructive/15 text-destructive',
                  !done && !active && !failed && 'bg-muted text-muted-foreground',
                )}
              >
                {done ? <Check className="size-3" /> : idx + 1}
              </span>
              {step.label}
            </div>
            {idx < TEST_DESIGN_WORKFLOW_STEPS.length - 1 ? (
              <div
                className={cn(
                  'mx-0.5 hidden h-px w-4 sm:block',
                  done ? 'bg-status-succeeded/40' : 'bg-border',
                )}
                aria-hidden
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
