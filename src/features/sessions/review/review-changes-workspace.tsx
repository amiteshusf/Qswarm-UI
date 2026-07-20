import type { PatchFileChange } from '@/api/schemas'
import { ChangedFilesPanel } from '@/features/sessions/review/changed-files-panel'
import { FileDiffPanel } from '@/features/sessions/review/file-diff-panel'
import { cn } from '@/lib/utils'

type Props = {
  files: PatchFileChange[]
  selectedFile: PatchFileChange | null
  onSelectFile: (path: string) => void
  className?: string
}

/**
 * File list + diff viewer workspace.
 * Stacks vertically on narrow widths; side-by-side when there is room for a readable diff.
 */
export function ReviewChangesWorkspace({
  files,
  selectedFile,
  onSelectFile,
  className,
}: Props) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="w-full shrink-0 lg:w-64 lg:max-w-[30%] xl:w-72">
          <ChangedFilesPanel
            files={files}
            selectedPath={selectedFile?.path ?? null}
            onSelect={onSelectFile}
          />
        </div>
        <div className="min-w-0 flex-1 lg:min-w-[28rem]">
          <FileDiffPanel file={selectedFile} />
        </div>
      </div>
    </div>
  )
}
