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
      <div className="bg-muted/15 border-border/60 text-muted-foreground flex min-h-[min(40vh,20rem)] w-full items-center justify-center rounded-xl border border-dashed p-6 text-center text-sm">
        Select a file to inspect before/after content.
      </div>
    )
  }

  if (!hasContent) {
    return (
      <div className="bg-muted/15 border-border/60 w-full space-y-2 rounded-xl border p-6">
        <p className="font-mono text-sm font-medium">{file.path}</p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {file.summary ??
            'File-level diff content is not available from the API yet.'}
        </p>
      </div>
    )
  }

  return (
    <div className="border-border/70 flex min-h-[min(50vh,28rem)] w-full min-w-0 flex-col overflow-hidden rounded-xl border bg-[#0d1117] text-[#e6edf3] shadow-inner">
      <div className="border-border/40 flex shrink-0 flex-col gap-2 border-b bg-[#161b22] px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 truncate font-mono text-xs sm:text-sm">{file.path}</p>
        <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
          <TabsList className="h-8 bg-[#21262d]">
            {hasBefore && hasAfter ? (
              <TabsTrigger value="split" className="h-7 px-2.5 text-[11px]">
                Split
              </TabsTrigger>
            ) : null}
            {hasBefore ? (
              <TabsTrigger value="before" className="h-7 px-2.5 text-[11px]">
                Before
              </TabsTrigger>
            ) : null}
            {hasAfter ? (
              <TabsTrigger value="after" className="h-7 px-2.5 text-[11px]">
                After
              </TabsTrigger>
            ) : null}
            {hasDiff ? (
              <TabsTrigger value="diff" className="h-7 px-2.5 text-[11px]">
                Diff
              </TabsTrigger>
            ) : null}
          </TabsList>
        </Tabs>
      </div>

      <div className="min-h-0 flex-1 overflow-auto text-sm leading-relaxed">
        {view === 'split' && hasBefore && hasAfter ? (
          <div className="grid grid-cols-1 xl:grid-cols-2">
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
        'border-border/30 min-h-[12rem] min-w-0 border-b last:border-b-0 xl:border-b-0 xl:border-r xl:last:border-r-0',
        variant === 'added' && 'bg-emerald-950/30',
        variant === 'removed' && 'bg-red-950/20',
      )}
    >
      <p className="text-muted-foreground border-border/30 sticky top-0 z-10 border-b bg-[#161b22] px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide">
        {label}
      </p>
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-6 whitespace-pre sm:text-sm sm:leading-7">
        {content}
      </pre>
    </div>
  )
}

function UnifiedDiffView({ diff }: { diff: string }) {
  return (
    <pre className="min-w-0 font-mono text-xs leading-6 sm:text-sm sm:leading-7">
      {diff.split('\n').map((line, i) => (
        <div
          key={i}
          className={cn(
            'overflow-x-auto px-3 py-0.5 whitespace-pre',
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
