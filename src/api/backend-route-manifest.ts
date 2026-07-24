/**
 * Canonical `/api/v1` route paths for the QSwarm UI client.
 * Source of truth: `reference/backend/docs/openapi-ui-v1.json` (synced from backend).
 */
export const API_V1_PREFIX = '/api/v1' as const

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export type RouteSpec = {
  method: HttpMethod
  path: string
}

function v1(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_V1_PREFIX}${normalized}`
}

/** Path templates use `{param}` segments for OpenAPI comparison. */
export const backendRoutes = {
  dashboard: {
    get: (): RouteSpec => ({ method: 'GET', path: v1('/dashboard') }),
  },
  repoConnections: {
    list: (): RouteSpec => ({ method: 'GET', path: v1('/repo-connections') }),
    create: (): RouteSpec => ({ method: 'POST', path: v1('/repo-connections') }),
    detail: (connectionId: string): RouteSpec => ({
      method: 'GET',
      path: v1(`/repo-connections/${connectionId}`),
    }),
    update: (connectionId: string): RouteSpec => ({
      method: 'PATCH',
      path: v1(`/repo-connections/${connectionId}`),
    }),
  },
  branchPolicies: {
    list: (): RouteSpec => ({ method: 'GET', path: v1('/branch-policies') }),
    create: (): RouteSpec => ({ method: 'POST', path: v1('/branch-policies') }),
    detail: (policyId: string): RouteSpec => ({
      method: 'GET',
      path: v1(`/branch-policies/${policyId}`),
    }),
    update: (policyId: string): RouteSpec => ({
      method: 'PATCH',
      path: v1(`/branch-policies/${policyId}`),
    }),
  },
  sessions: {
    list: (): RouteSpec => ({ method: 'GET', path: v1('/sessions') }),
    create: (): RouteSpec => ({ method: 'POST', path: v1('/sessions') }),
    detail: (sessionId: string): RouteSpec => ({
      method: 'GET',
      path: v1(`/sessions/${sessionId}`),
    }),
    brief: (sessionId: string): RouteSpec => ({
      method: 'GET',
      path: v1(`/sessions/${sessionId}/brief`),
    }),
    reviewData: (sessionId: string): RouteSpec => ({
      method: 'GET',
      path: v1(`/sessions/${sessionId}/review-data`),
    }),
    preparePlan: (sessionId: string): RouteSpec => ({
      method: 'POST',
      path: v1(`/sessions/${sessionId}/prepare-plan`),
    }),
    approvePlan: (sessionId: string): RouteSpec => ({
      method: 'POST',
      path: v1(`/sessions/${sessionId}/approve-plan`),
    }),
    requestPlanRevision: (sessionId: string): RouteSpec => ({
      method: 'POST',
      path: v1(`/sessions/${sessionId}/request-plan-revision`),
    }),
    start: (sessionId: string): RouteSpec => ({
      method: 'POST',
      path: v1(`/sessions/${sessionId}/start`),
    }),
    requestRevision: (sessionId: string): RouteSpec => ({
      method: 'POST',
      path: v1(`/sessions/${sessionId}/request-revision`),
    }),
    approve: (sessionId: string): RouteSpec => ({
      method: 'POST',
      path: v1(`/sessions/${sessionId}/approve`),
    }),
    createPr: (sessionId: string): RouteSpec => ({
      method: 'POST',
      path: v1(`/sessions/${sessionId}/create-pr`),
    }),
  },
  settings: {
    get: (): RouteSpec => ({ method: 'GET', path: v1('/settings') }),
  },
  stories: {
    list: (): RouteSpec => ({ method: 'GET', path: v1('/stories') }),
    detail: (storyKey: string): RouteSpec => ({
      method: 'GET',
      path: v1(`/stories/${storyKey}`),
    }),
    createTestDesignRun: (storyKey: string): RouteSpec => ({
      method: 'POST',
      path: v1(`/stories/${storyKey}/test-design-runs`),
    }),
  },
  testDesignRuns: {
    bulkCreate: (): RouteSpec => ({
      method: 'POST',
      path: v1('/test-design-runs/bulk'),
    }),
    detail: (runId: string): RouteSpec => ({
      method: 'GET',
      path: v1(`/test-design-runs/${runId}`),
    }),
    analyze: (runId: string): RouteSpec => ({
      method: 'POST',
      path: v1(`/test-design-runs/${runId}/analyze`),
    }),
    analysis: (runId: string): RouteSpec => ({
      method: 'GET',
      path: v1(`/test-design-runs/${runId}/analysis`),
    }),
    preparePlan: (runId: string): RouteSpec => ({
      method: 'POST',
      path: v1(`/test-design-runs/${runId}/prepare-plan`),
    }),
    plan: (runId: string): RouteSpec => ({
      method: 'GET',
      path: v1(`/test-design-runs/${runId}/plan`),
    }),
    approvePlan: (runId: string): RouteSpec => ({
      method: 'POST',
      path: v1(`/test-design-runs/${runId}/approve-plan`),
    }),
    requestPlanRevision: (runId: string): RouteSpec => ({
      method: 'POST',
      path: v1(`/test-design-runs/${runId}/request-plan-revision`),
    }),
    generateTestCases: (runId: string): RouteSpec => ({
      method: 'POST',
      path: v1(`/test-design-runs/${runId}/generate-test-cases`),
    }),
    reviewData: (runId: string): RouteSpec => ({
      method: 'GET',
      path: v1(`/test-design-runs/${runId}/review-data`),
    }),
    requestRevision: (runId: string): RouteSpec => ({
      method: 'POST',
      path: v1(`/test-design-runs/${runId}/request-revision`),
    }),
    approve: (runId: string): RouteSpec => ({
      method: 'POST',
      path: v1(`/test-design-runs/${runId}/approve`),
    }),
    publish: (runId: string): RouteSpec => ({
      method: 'POST',
      path: v1(`/test-design-runs/${runId}/publish`),
    }),
  },
  testCases: {
    list: (): RouteSpec => ({ method: 'GET', path: v1('/test-cases') }),
    detail: (recordId: string): RouteSpec => ({
      method: 'GET',
      path: v1(`/test-cases/${recordId}`),
    }),
    publish: (recordId: string): RouteSpec => ({
      method: 'POST',
      path: v1(`/test-cases/${recordId}/publish`),
    }),
    automate: (recordId: string): RouteSpec => ({
      method: 'POST',
      path: v1(`/test-cases/${recordId}/automate`),
    }),
  },
} as const

/** Flat list of every UI-consumed route spec (for OpenAPI coverage tests). */
export function listFrontendRouteSpecs(): RouteSpec[] {
  return [
    backendRoutes.dashboard.get(),
    backendRoutes.repoConnections.list(),
    backendRoutes.repoConnections.create(),
    backendRoutes.repoConnections.detail('{connection_id}'),
    backendRoutes.repoConnections.update('{connection_id}'),
    backendRoutes.branchPolicies.list(),
    backendRoutes.branchPolicies.create(),
    backendRoutes.branchPolicies.detail('{policy_id}'),
    backendRoutes.branchPolicies.update('{policy_id}'),
    backendRoutes.sessions.list(),
    backendRoutes.sessions.create(),
    backendRoutes.sessions.detail('{session_id}'),
    backendRoutes.sessions.brief('{session_id}'),
    backendRoutes.sessions.reviewData('{session_id}'),
    backendRoutes.sessions.preparePlan('{session_id}'),
    backendRoutes.sessions.approvePlan('{session_id}'),
    backendRoutes.sessions.requestPlanRevision('{session_id}'),
    backendRoutes.sessions.start('{session_id}'),
    backendRoutes.sessions.requestRevision('{session_id}'),
    backendRoutes.sessions.approve('{session_id}'),
    backendRoutes.sessions.createPr('{session_id}'),
    backendRoutes.settings.get(),
    backendRoutes.stories.list(),
    backendRoutes.stories.detail('{story_key}'),
    backendRoutes.stories.createTestDesignRun('{story_key}'),
    backendRoutes.testDesignRuns.bulkCreate(),
    backendRoutes.testDesignRuns.detail('{run_id}'),
    backendRoutes.testDesignRuns.analyze('{run_id}'),
    backendRoutes.testDesignRuns.analysis('{run_id}'),
    backendRoutes.testDesignRuns.preparePlan('{run_id}'),
    backendRoutes.testDesignRuns.plan('{run_id}'),
    backendRoutes.testDesignRuns.approvePlan('{run_id}'),
    backendRoutes.testDesignRuns.requestPlanRevision('{run_id}'),
    backendRoutes.testDesignRuns.generateTestCases('{run_id}'),
    backendRoutes.testDesignRuns.reviewData('{run_id}'),
    backendRoutes.testDesignRuns.requestRevision('{run_id}'),
    backendRoutes.testDesignRuns.approve('{run_id}'),
    backendRoutes.testDesignRuns.publish('{run_id}'),
    backendRoutes.testCases.list(),
    backendRoutes.testCases.detail('{record_id}'),
    backendRoutes.testCases.publish('{record_id}'),
    backendRoutes.testCases.automate('{record_id}'),
  ]
}

/** Normalize dynamic segments for OpenAPI path comparison. */
export function normalizeRoutePath(path: string): string {
  return path.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    '/{id}',
  )
}

export function normalizeOpenApiPath(path: string): string {
  return path
    .replace(/\{connection_id\}/g, '{id}')
    .replace(/\{policy_id\}/g, '{id}')
    .replace(/\{session_id\}/g, '{id}')
    .replace(/\{story_key\}/g, '{id}')
    .replace(/\{run_id\}/g, '{id}')
    .replace(/\{record_id\}/g, '{id}')
}
