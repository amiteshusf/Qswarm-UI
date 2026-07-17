import type { PatchVersion } from '@/api/schemas'
import { friendlyPatchLabel } from '@/features/sessions/session-lifecycle'
import { cn } from '@/lib/utils'

type Props = {
  patches: PatchVersion[]
  selectedVersion: number
  onSelect: (version: number) => void
}

export function CodeRevisionSwitcher({
  patches,
  selectedVersion,
  onSelect,
}: Props) {
  if (patches.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {patches.map((p) => {
        const active = p.version === selectedVersion
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.version)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-left text-xs transition-colors',
              active
                ? 'border-swarm/40 bg-swarm/10 text-swarm ring-1 ring-swarm/20'
                : 'border-border/60 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/40',
            )}
          >
            <span className="font-medium">{friendlyPatchLabel(p.version)}</span>
            {p.label ? (
              <span className="mt-0.5 block text-[11px] opacity-80">{p.label}</span>
            ) : null}
            {p.filesChanged != null ? (
              <span className="mt-0.5 block font-mono text-[10px] opacity-70">
                {p.filesChanged} files
                {p.additions != null && p.deletions != null
                  ? ` · +${p.additions} / −${p.deletions}`
                  : ''}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
