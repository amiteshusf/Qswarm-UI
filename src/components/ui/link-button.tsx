import { type VariantProps } from 'class-variance-authority'
import { Link, type LinkProps } from 'react-router-dom'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type LinkButtonProps = LinkProps &
  VariantProps<typeof buttonVariants> & {
    className?: string
  }

export function LinkButton({
  className,
  variant,
  size,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
