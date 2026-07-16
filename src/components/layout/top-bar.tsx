import { Moon, Sun } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { MobileMenuTrigger, MobileNav } from '@/components/layout/nav-extras'
import { buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/app/theme-provider'
import { appName } from '@/lib/env'
import { cn } from '@/lib/utils'

const routeTitles: Record<string, string> = {
  '/': 'Overview',
  '/sessions': 'Sessions',
  '/repo-connections': 'Repositories',
  '/branch-policies': 'Branch policies',
  '/settings': 'Engines & platform',
}

function pageTitle(pathname: string, search: string): string {
  if (pathname.startsWith('/sessions/') && pathname !== '/sessions') {
    return 'Session review'
  }
  if (pathname === '/sessions' && search.includes('awaiting_review')) {
    return 'Review queue'
  }
  return routeTitles[pathname] ?? appName
}

export function TopBar() {
  const { resolved, setTheme } = useTheme()
  const { pathname, search } = useLocation()
  const title = pageTitle(pathname, search)

  return (
    <header className="bg-surface-raised/80 border-border sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <MobileMenuTrigger />
        <span className="text-sm font-semibold tracking-tight">{title}</span>
      </div>
      <p className="text-muted-foreground hidden text-sm md:block">
        <span className="text-foreground font-medium">{title}</span>
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'hidden gap-1.5 md:inline-flex',
          )}
        >
          {resolved === 'dark' ? (
            <Moon className="size-4" />
          ) : (
            <Sun className="size-4" />
          )}
          Theme
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setTheme('light')}>
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('dark')}>
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('system')}>
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

export { MobileNav }
