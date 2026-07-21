import { Loader2, Send } from 'lucide-react'
import { useRef } from 'react'

import type { SessionBrief, SessionDetail } from '@/api/schemas'
import {
  buildActionContext,
  sessionActionHints,
} from '@/features/sessions/session-actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const SUGGESTIONS = [
  'Use a different target test file',
  'Include page object updates',
  'Focus on the checkout flow',
  'Add coverage for the edge case',
]

type Props = {
  session: SessionDetail
  brief?: SessionBrief | null
  instruction: string
  pending: boolean
  onInstructionChange: (v: string) => void
  onSubmit: () => void
  className?: string
}

export function PlanRevisionComposer({
  session,
  brief,
  instruction,
  pending,
  onInstructionChange,
  onSubmit,
  className,
}: Props) {
  const hints = sessionActionHints(buildActionContext(session, brief))
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const enabled = hints.canRequestPlanRevision && !pending

  if (!hints.canRequestPlanRevision && !pending) return null

  return (
    <div
      className={cn(
        'border-border/70 bg-surface-raised space-y-3 rounded-2xl border p-4 shadow-sm',
        className,
      )}
    >
      <div>
        <p className="text-sm font-medium">Request plan changes</p>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          Tell QSwarm how to adjust the automation plan before you run. This is
          separate from requesting code changes after automation runs.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={!enabled}
            onClick={() => {
              onInstructionChange(s)
              textareaRef.current?.focus()
            }}
            className="border-border/60 hover:border-swarm/40 hover:bg-swarm/8 rounded-full border bg-muted/20 px-2.5 py-1 text-[11px] transition-colors disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      <Textarea
        ref={textareaRef}
        rows={3}
        placeholder="e.g. Target tests/checkout/refund.spec.ts instead and reuse the checkout page object."
        value={instruction}
        onChange={(e) => onInstructionChange(e.target.value)}
        disabled={!enabled}
        className="resize-none text-sm"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && instruction.trim()) {
            e.preventDefault()
            onSubmit()
          }
        }}
      />

      <Button
        variant="outline"
        className="gap-2"
        disabled={!instruction.trim() || !enabled}
        onClick={onSubmit}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Request plan changes
      </Button>
    </div>
  )
}
