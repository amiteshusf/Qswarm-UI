export const qk = {
  dashboard: ['dashboard'] as const,
  repoConnections: ['repo-connections'] as const,
  repoConnection: (id: string) => ['repo-connections', id] as const,
  branchPolicies: ['branch-policies'] as const,
  branchPolicy: (id: string) => ['branch-policies', id] as const,
  sessions: (filters?: Record<string, string | undefined>) =>
    ['sessions', filters ?? {}] as const,
  session: (id: string) => ['sessions', id] as const,
  settings: ['settings'] as const,
}
