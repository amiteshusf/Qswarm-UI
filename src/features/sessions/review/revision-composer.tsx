import { Loader2, Send } from 'lucide-react'
import { useRef } from 'react'

import type { SessionBrief, SessionDetail } from '@/api/schemas'
import {
  buildActionContext,
  sessionActionHints,
} from '@/features/sessions/session-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const SUGGESTIONS = [
  'Reuse existing page object',
  'Change locator strategy',
  'Add stronger assertion',
  'Cover the edge case we discussed',
]

type Props = {
  session: SessionDetail
  brief?: SessionBrief | null
  instruction: string
  scope: string
  pending: boolean
  onInstructionChange: (v: string) => void
  onScopeChange: (v: string) => void
  onSubmit: () => void
  className?: string
}

export function RevisionComposer({
  session,
  brief,
  instruction,
  scope,
  pending,
  onInstructionChange,
  onScopeChange,
  onSubmit,
  className,
}: Props) {
  const hints = sessionActionHints(buildActionContext(session, brief))
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const enabled = hints.canRevise && !pending

  if (!hints.canRevise && !pending) {
    return (
      <div
        className={cn(
          'border-border/60 text-muted-foreground rounded-2xl border border-dashed bg-muted/10 px-4 py-6 text-center text-sm',
          className,
        )}
      >
        {hints.stage === 'running' || hints.stage === 'revising'
          ? 'Composer unlocks when the run is ready for your review.'
          : hints.isPlanPhase
            ? 'Output change requests unlock after automation runs.'
            : hints.stage === 'published' || hints.stage === 'ready_to_publish'
              ? 'Output is approved — publishing actions are in the sidebar.'
              : 'Run automation and wait for review to send output change requests.'}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'border-border/70 bg-surface-raised space-y-3 rounded-2xl border p-4 shadow-lg',
        className,
      )}
    >
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
        placeholder="Tell the agent what to change… e.g. Reuse the checkout page object and strengthen the refund assertion."
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

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder="Focus area (optional) — e.g. tests/e2e/checkout"
          value={scope}
          onChange={(e) => onScopeChange(e.target.value)}
          disabled={!enabled}
          className="text-sm"
        />
        <Button
          className="bg-swarm text-swarm-foreground hover:bg-swarm/90 shrink-0 gap-2 sm:ml-auto"
          disabled={!instruction.trim() || !enabled}
          onClick={onSubmit}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Request changes
        </Button>
      </div>
      <p className="text-muted-foreground text-[11px]">
        ⌘/Ctrl + Enter to send · Changes apply to the next agent revision
      </p>
    </div>
  )
}
