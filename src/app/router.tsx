import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppShell } from '@/components/layout/app-shell'
import { BranchPoliciesPage } from '@/features/branch-policies/branch-policies-page'
import { BranchPolicyFormPage } from '@/features/branch-policies/branch-policy-form-page'
import { DashboardPage } from '@/features/dashboard/dashboard-page'
import { RepoConnectionsPage } from '@/features/repo-connections/repo-connections-page'
import { RepoConnectionFormPage } from '@/features/repo-connections/repo-connection-form-page'
import { SessionDetailPage } from '@/features/sessions/session-detail-page'
import { SessionsPage } from '@/features/sessions/sessions-page'
import { SettingsPage } from '@/features/settings/settings-page'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
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
