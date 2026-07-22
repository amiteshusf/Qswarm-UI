import { NavLink } from 'react-router-dom'

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
import { cn } from '@/lib/utils'
import { Menu, Moon, Sun } from 'lucide-react'

const mobileLinks = [
  { to: '/', label: 'Overview', end: true },
  { to: '/automation-backlog', label: 'Backlog' },
  { to: '/sessions', label: 'Runs' },
  { to: '/sessions?status=awaiting_review', label: 'Review' },
  { to: '/repo-connections', label: 'Repos' },
  { to: '/settings', label: 'Setup' },
]

export function MobileNav() {
  return (
    <nav className="border-border/80 bg-surface flex gap-1 overflow-x-auto border-b px-3 py-2 md:hidden">
      {mobileLinks.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              buttonVariants({
                variant: isActive ? 'default' : 'ghost',
                size: 'sm',
              }),
              'shrink-0 rounded-full px-3 text-xs',
              isActive && 'bg-swarm text-swarm-foreground hover:bg-swarm/90',
            )
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

export function SidebarThemeMenu() {
  const { resolved, setTheme } = useTheme()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          'border-sidebar-border bg-sidebar-accent/40 text-sidebar-foreground hover:bg-sidebar-accent w-full justify-start gap-2',
        )}
      >
        {resolved === 'dark' ? (
          <Moon className="size-4" />
        ) : (
          <Sun className="size-4" />
        )}
        Appearance
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
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
  )
}

export function MobileMenuTrigger() {
  const { setTheme } = useTheme()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
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
  )
}
