import type { LucideIcon } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  children,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  className?: string
  children?: React.ReactNode
}) {
  return (
    <Card
      className={cn(
        'border-dashed bg-muted/20 shadow-none',
        className,
      )}
    >
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        {Icon ? (
          <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-2xl">
            <Icon className="size-6" />
          </div>
        ) : null}
        <div className="space-y-1">
          <p className="text-foreground text-base font-medium tracking-tight">
            {title}
          </p>
          {description ? (
            <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>
        {children}
      </CardContent>
    </Card>
  )
}
