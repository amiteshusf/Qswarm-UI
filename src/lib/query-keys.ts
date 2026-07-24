export const qk = {
  dashboard: ['dashboard'] as const,
  repoConnections: ['repo-connections'] as const,
  repoConnection: (id: string) => ['repo-connections', id] as const,
  branchPolicies: ['branch-policies'] as const,
  branchPolicy: (id: string) => ['branch-policies', id] as const,
  sessions: (filters?: Record<string, string | undefined>) =>
    ['sessions', filters ?? {}] as const,
  session: (id: string) => ['sessions', id] as const,
  sessionBrief: (id: string) => ['sessions', id, 'brief'] as const,
  sessionReviewData: (id: string) => ['sessions', id, 'review-data'] as const,
  automationBacklog: (filters?: Record<string, string | undefined>) =>
    ['automation-backlog', filters ?? {}] as const,
  testCase: (id: string) => ['test-cases', id] as const,
  stories: (filters?: Record<string, string | undefined>) =>
    ['stories', filters ?? {}] as const,
  story: (key: string) => ['stories', key] as const,
  testDesignRun: (id: string) => ['test-design-runs', id] as const,
  testDesignAnalysis: (id: string) =>
    ['test-design-runs', id, 'requirement-analysis'] as const,
  testDesignPlan: (id: string) =>
    ['test-design-runs', id, 'test-design-plan'] as const,
  testDesignReviewData: (id: string) =>
    ['test-design-runs', id, 'review-data'] as const,
  settings: ['settings'] as const,
}
