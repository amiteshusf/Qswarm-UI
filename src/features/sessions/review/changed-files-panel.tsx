import { FileCode2, FileMinus, FilePlus, FilePen } from 'lucide-react'

import type { PatchFileChange } from '@/api/schemas'
import { cn } from '@/lib/utils'

const changeMeta = {
  modified: {
    label: 'Modified',
    icon: FilePen,
    className: 'bg-amber-500/12 text-amber-700 dark:text-amber-400',
  },
  created: {
    label: 'Created',
    icon: FilePlus,
    className: 'bg-status-succeeded/12 text-[color:var(--status-succeeded)]',
  },
  deleted: {
    label: 'Deleted',
    icon: FileMinus,
    className: 'bg-destructive/12 text-destructive',
  },
  renamed: {
    label: 'Renamed',
    icon: FileCode2,
    className: 'bg-muted text-muted-foreground',
  },
} as const

type Props = {
  files: PatchFileChange[]
  selectedPath: string | null
  onSelect: (path: string) => void
}

export function ChangedFilesPanel({ files, selectedPath, onSelect }: Props) {
  if (files.length === 0) {
    return (
      <div className="border-border/60 text-muted-foreground rounded-xl border border-dashed px-4 py-10 text-center text-sm">
        No file-level changes yet. They appear after the agent produces a diff.
      </div>
    )
  }

  return (
    <div className="border-border/60 flex max-h-[min(50vh,28rem)] flex-col overflow-hidden rounded-xl border">
      <p className="text-muted-foreground border-border/60 shrink-0 border-b px-3 py-2 text-[10px] font-semibold uppercase tracking-wide">
        Changed files ({files.length})
      </p>
      <div className="divide-border/60 min-h-0 flex-1 divide-y overflow-y-auto">
        {files.map((file) => {
          const type = file.changeType ?? 'modified'
          const meta = changeMeta[type]
          const Icon = meta.icon
          const active = selectedPath === file.path

          return (
            <button
              key={file.path}
              type="button"
              onClick={() => onSelect(file.path)}
              className={cn(
                'hover:bg-muted/30 flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors',
                active && 'bg-swarm/8 border-l-swarm border-l-2',
              )}
            >
              <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs font-medium">{file.path}</p>
                {file.summary ? (
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-relaxed">
                    {file.summary}
                  </p>
                ) : null}
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-medium',
                      meta.className,
                    )}
                  >
                    {meta.label}
                  </span>
                  {file.additions != null ? (
                    <span className="text-status-succeeded text-[10px] tabular-nums">
                      +{file.additions}
                    </span>
                  ) : null}
                  {file.deletions != null ? (
                    <span className="text-destructive text-[10px] tabular-nums">
                      −{file.deletions}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
