import { NavLink } from 'react-router-dom'

import { SidebarThemeMenu } from '@/components/layout/nav-extras'
import { appName } from '@/lib/env'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  GitBranch,
  ListTree,
  Settings2,
  Workflow,
} from 'lucide-react'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/repo-connections', label: 'Repositories', icon: GitBranch },
  { to: '/branch-policies', label: 'Branch policies', icon: ListTree },
  { to: '/sessions', label: 'Sessions', icon: Workflow },
  { to: '/settings', label: 'Settings', icon: Settings2 },
]

export function AppSidebar() {
  return (
    <aside className="border-border/80 bg-sidebar text-sidebar-foreground hidden w-56 shrink-0 border-r md:flex md:flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg text-xs font-semibold">
          QS
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">{appName}</p>
          <p className="text-muted-foreground text-xs">QA control</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground',
              )
            }
          >
            <Icon className="size-4 opacity-80" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="text-muted-foreground border-t border-sidebar-border space-y-2 p-3 text-[11px] leading-relaxed">
        <p>Orchestrate sessions, reviews, and PRs without leaving the browser.</p>
        <SidebarThemeMenu />
      </div>
    </aside>
  )
}
