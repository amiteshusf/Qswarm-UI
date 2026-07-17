import { useEffect, useState } from 'react'

import type { PatchFileChange } from '@/api/schemas'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

type ViewMode = 'split' | 'before' | 'after' | 'diff'

type Props = {
  file: PatchFileChange | null
}

export function FileDiffPanel({ file }: Props) {
  const hasBefore = Boolean(file?.beforeContent)
  const hasAfter = Boolean(file?.afterContent)
  const hasDiff = Boolean(file?.unifiedDiff)
  const hasContent = hasBefore || hasAfter || hasDiff

  const defaultView: ViewMode = hasDiff
    ? 'diff'
    : hasBefore && hasAfter
      ? 'split'
      : hasAfter
        ? 'after'
        : 'before'

  const [view, setView] = useState<ViewMode>(defaultView)

  useEffect(() => {
    setView(defaultView)
  }, [file?.path, defaultView])

  if (!file) {
    return (
      <div className="bg-muted/15 border-border/60 text-muted-foreground flex min-h-[280px] items-center justify-center rounded-xl border border-dashed p-6 text-center text-sm">
        Select a file to inspect before/after content.
      </div>
    )
  }

  if (!hasContent) {
    return (
      <div className="bg-muted/15 border-border/60 space-y-2 rounded-xl border p-6">
        <p className="font-mono text-sm font-medium">{file.path}</p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {file.summary ??
            'File-level diff content is not available from the API yet.'}
        </p>
      </div>
    )
  }

  return (
    <div className="border-border/70 overflow-hidden rounded-xl border bg-[#0d1117] text-[#e6edf3] shadow-inner">
      <div className="border-border/40 flex flex-col gap-2 border-b bg-[#161b22] px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="truncate font-mono text-xs">{file.path}</p>
        <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
          <TabsList className="h-7 bg-[#21262d]">
            {hasBefore && hasAfter ? (
              <TabsTrigger value="split" className="h-6 px-2 text-[10px]">
                Split
              </TabsTrigger>
            ) : null}
            {hasBefore ? (
              <TabsTrigger value="before" className="h-6 px-2 text-[10px]">
                Before
              </TabsTrigger>
            ) : null}
            {hasAfter ? (
              <TabsTrigger value="after" className="h-6 px-2 text-[10px]">
                After
              </TabsTrigger>
            ) : null}
            {hasDiff ? (
              <TabsTrigger value="diff" className="h-6 px-2 text-[10px]">
                Diff
              </TabsTrigger>
            ) : null}
          </TabsList>
        </Tabs>
      </div>

      <div className="max-h-[420px] overflow-auto text-xs leading-relaxed">
        {view === 'split' && hasBefore && hasAfter ? (
          <div className="grid md:grid-cols-2">
            <CodeBlock label="Before" content={file.beforeContent!} variant="removed" />
            <CodeBlock label="After" content={file.afterContent!} variant="added" />
          </div>
        ) : null}
        {view === 'before' && hasBefore ? (
          <CodeBlock label="Before" content={file.beforeContent!} variant="removed" />
        ) : null}
        {view === 'after' && hasAfter ? (
          <CodeBlock label="After" content={file.afterContent!} variant="added" />
        ) : null}
        {view === 'diff' && hasDiff ? (
          <UnifiedDiffView diff={file.unifiedDiff!} />
        ) : null}
      </div>
    </div>
  )
}

function CodeBlock({
  label,
  content,
  variant,
}: {
  label: string
  content: string
  variant: 'added' | 'removed'
}) {
  return (
    <div
      className={cn(
        'border-border/30 min-h-[200px] border-r last:border-r-0',
        variant === 'added' && 'bg-emerald-950/30',
        variant === 'removed' && 'bg-red-950/20',
      )}
    >
      <p className="text-muted-foreground border-border/30 border-b px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide">
        {label}
      </p>
      <pre className="overflow-x-auto p-3 font-mono text-[11px] leading-relaxed whitespace-pre">
        {content}
      </pre>
    </div>
  )
}

function UnifiedDiffView({ diff }: { diff: string }) {
  return (
    <pre className="font-mono text-[11px] leading-relaxed">
      {diff.split('\n').map((line, i) => (
        <div
          key={i}
          className={cn(
            'px-3 py-0.5',
            line.startsWith('+') && !line.startsWith('+++') && 'bg-emerald-500/15',
            line.startsWith('-') && !line.startsWith('---') && 'bg-red-500/15',
            line.startsWith('@@') && 'bg-blue-500/10 text-blue-300',
          )}
        >
          {line || ' '}
        </div>
      ))}
    </pre>
  )
}
