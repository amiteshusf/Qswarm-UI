import { Loader2, Send } from 'lucide-react'
import { useRef, useState } from 'react'

import type { TestDesignRun } from '@/api/schemas'
import {
  buildTestDesignContext,
  testDesignActionHints,
} from '@/features/test-design/test-design-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const SUGGESTIONS = [
  'Add missing negative cases',
  'Split overloaded case into two',
  'Improve expected results clarity',
  'Remove duplicate coverage',
  'Mark selected cases for automation',
]

type Props = {
  run: TestDesignRun
  instruction: string
  pending: boolean
  onInstructionChange: (v: string) => void
  onSubmit: (focusArea?: string) => void
  className?: string
}

export function TestCaseRevisionComposer({
  run,
  instruction,
  pending,
  onInstructionChange,
  onSubmit,
  className,
}: Props) {
  const [focusArea, setFocusArea] = useState('')
  const hints = testDesignActionHints(buildTestDesignContext(run))
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const enabled = hints.canRequestCaseChanges && !pending

  if (!hints.canRequestCaseChanges && !pending) return null

  return (
    <div
      className={cn(
        'border-border/70 bg-surface-raised space-y-3 rounded-2xl border p-4 shadow-sm',
        className,
      )}
    >
      <div>
        <p className="text-sm font-medium">Request test-case changes</p>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          Describe what to add, split, improve, or remove. QSwarm will produce a
          new version.
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

      <Input
        placeholder="Focus area (optional)"
        value={focusArea}
        onChange={(e) => setFocusArea(e.target.value)}
        disabled={!enabled}
        className="text-sm"
      />

      <Textarea
        ref={textareaRef}
        rows={4}
        placeholder="e.g. Add a case for banner dismissal after restock above threshold."
        value={instruction}
        onChange={(e) => onInstructionChange(e.target.value)}
        disabled={!enabled}
        className="resize-none text-sm"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && instruction.trim()) {
            e.preventDefault()
            onSubmit(focusArea.trim() || undefined)
          }
        }}
      />

      <Button
        variant="outline"
        className="gap-2"
        disabled={!instruction.trim() || !enabled}
        onClick={() => onSubmit(focusArea.trim() || undefined)}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Request test-case changes
      </Button>
    </div>
  )
}
