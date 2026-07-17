import { NavLink, useLocation } from 'react-router-dom'

import { SidebarThemeMenu } from '@/components/layout/nav-extras'
import { appName } from '@/lib/env'
import { cn } from '@/lib/utils'
import {
  ClipboardCheck,
  GitBranch,
  LayoutDashboard,
  ListTree,
  ServerCog,
  Workflow,
} from 'lucide-react'

type NavItem = {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  end?: boolean
  emphasis?: boolean
  matchSearch?: string
}

type NavGroup = {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Operations',
    items: [
      { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/sessions', label: 'Automation runs', icon: Workflow, emphasis: true },
      {
        to: '/sessions?status=awaiting_review',
        label: 'Review queue',
        icon: ClipboardCheck,
        matchSearch: 'status=awaiting_review',
      },
    ],
  },
  {
    label: 'Automation setup',
    items: [
      { to: '/repo-connections', label: 'Repositories', icon: GitBranch },
      { to: '/branch-policies', label: 'Branch policies', icon: ListTree },
      { to: '/settings', label: 'Engines & platform', icon: ServerCog },
    ],
  },
]

function NavItemLink({ to, label, icon: Icon, end, emphasis, matchSearch }: NavItem) {
  const location = useLocation()
  const [path] = to.split('?')

  let isActive = false
  if (matchSearch) {
    isActive =
      location.pathname === path && location.search.includes(matchSearch)
  } else if (path === '/sessions') {
    isActive =
      location.pathname === '/sessions' &&
      !location.search.includes('status=awaiting_review')
  } else if (end) {
    isActive = location.pathname === path
  } else {
    isActive =
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
  }

  return (
    <NavLink
      to={to}
      end={end}
      className={() =>
        cn(
          'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-sidebar-border'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
          emphasis && !isActive && 'text-sidebar-foreground/90',
        )
      }
    >
      <Icon
        className={cn(
          'size-4 shrink-0 transition-colors',
          'group-[.active]:text-swarm',
        )}
      />
      {label}
    </NavLink>
  )
}

export function AppSidebar() {
  return (
    <aside className="bg-sidebar text-sidebar-foreground hidden w-60 shrink-0 border-r border-sidebar-border md:flex md:flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="from-swarm to-primary flex size-9 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-bold text-swarm-foreground shadow-sm">
          QS
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight text-sidebar-accent-foreground">
            {appName}
          </p>
          <p className="text-sidebar-foreground/55 text-[11px]">
            Agentic QA orchestration
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto p-3">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="text-sidebar-foreground/45 px-3 pb-1 text-[10px] font-semibold tracking-widest uppercase">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItemLink key={item.to} {...item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-2 border-t border-sidebar-border p-3">
        <p className="text-sidebar-foreground/50 px-1 text-[11px] leading-relaxed">
          Connect repos, run sessions, review output, and ship PRs from one
          control plane.
        </p>
        <SidebarThemeMenu />
      </div>
    </aside>
  )
}
