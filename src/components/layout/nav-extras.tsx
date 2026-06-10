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
import { Moon, Sun } from 'lucide-react'

const mobileLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/repo-connections', label: 'Repos' },
  { to: '/branch-policies', label: 'Policies' },
  { to: '/sessions', label: 'Sessions' },
  { to: '/settings', label: 'Settings' },
]

export function MobileNav() {
  return (
    <nav className="border-border bg-muted/30 flex gap-1 overflow-x-auto border-b px-3 py-2 md:hidden">
      {mobileLinks.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              buttonVariants({
                variant: isActive ? 'secondary' : 'ghost',
                size: 'sm',
              }),
              'shrink-0 rounded-full px-3',
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
          'w-full justify-start gap-2',
        )}
      >
        {resolved === 'dark' ? (
          <Moon className="size-4" />
        ) : (
          <Sun className="size-4" />
        )}
        Theme
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
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
