import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppShell } from '@/components/layout/app-shell'
import { AutomationBacklogPage } from '@/features/automation-backlog/automation-backlog-page'
import { BranchPoliciesPage } from '@/features/branch-policies/branch-policies-page'
import { BranchPolicyFormPage } from '@/features/branch-policies/branch-policy-form-page'
import { DashboardPage } from '@/features/dashboard/dashboard-page'
import { RepoConnectionsPage } from '@/features/repo-connections/repo-connections-page'
import { RepoConnectionFormPage } from '@/features/repo-connections/repo-connection-form-page'
import { SessionDetailPage } from '@/features/sessions/session-detail-page'
import { SessionsPage } from '@/features/sessions/sessions-page'
import { SettingsPage } from '@/features/settings/settings-page'
import { StoryIntakePage } from '@/features/story-intake/story-intake-page'
import { TestDesignPage } from '@/features/test-design/test-design-page'
import { TestDesignRunsPage } from '@/features/test-design/test-design-runs-page'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'story-intake', element: <StoryIntakePage /> },
      { path: 'test-design', element: <TestDesignRunsPage /> },
      { path: 'test-design/:id', element: <TestDesignPage /> },
      { path: 'automation-backlog', element: <AutomationBacklogPage /> },
      { path: 'repo-connections', element: <RepoConnectionsPage /> },
      { path: 'repo-connections/new', element: <RepoConnectionFormPage /> },
      { path: 'repo-connections/:id', element: <RepoConnectionFormPage /> },
      { path: 'branch-policies', element: <BranchPoliciesPage /> },
      { path: 'branch-policies/new', element: <BranchPolicyFormPage /> },
      { path: 'branch-policies/:id', element: <BranchPolicyFormPage /> },
      { path: 'sessions', element: <SessionsPage /> },
      { path: 'sessions/:id', element: <SessionDetailPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
