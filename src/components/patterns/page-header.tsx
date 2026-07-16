export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  compact,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
  compact?: boolean
}) {
  return (
    <div
      className={
        compact
          ? 'mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'
          : 'mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'
      }
    >
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-swarm text-xs font-semibold tracking-widest uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={
            compact
              ? 'text-foreground text-2xl font-semibold tracking-tight'
              : 'text-foreground text-3xl font-semibold tracking-tight sm:text-[2rem]'
          }
        >
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}
