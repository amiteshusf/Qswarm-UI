import { z } from 'zod'

/**
 * HTTP client for QSwarm REST resources.
 *
 * Browser calls go to `${VITE_API_BASE_URL}${VITE_API_PATH_PREFIX ?? '/api/v1'}/...`.
 * Cross-origin deployments require backend CORS for the UI origin — see docs/CORS.md.
 */
import {
  ApiError,
  ConfigurationError,
  NetworkApiError,
  SchemaResponseError,
  extractBackendMessage,
} from '@/api/errors'
import {
  mockBranchPolicies,
  mockDashboard,
  mockRepoConnections,
  mockSessionDetail,
  mockSettings,
} from '@/api/mocks/data'
import {
  findMockStory,
  mockJiraStories,
} from '@/api/mocks/stories'
import {
  buildMockRequirementAnalysis,
  buildMockTestDesignPlan,
  buildMockTestDesignReviewData,
  createMockTestDesignRun,
  findMockTestDesignRun,
  listMockTestDesignRuns,
  mockTestDesignStore,
  updateMockRun,
} from '@/api/mocks/test-design'
import {
  buildMockSessionBrief,
  buildMockSessionReviewData,
  setMockPlanApproved,
} from '@/api/mocks/session-product'
import {
  automateTestCaseInputSchema,
  automationBacklogListSchema,
  automationBacklogTestCaseSchema,
  branchPolicyInputSchema,
  branchPolicySchema,
  dashboardSchema,
  repoConnectionFormSchema,
  repoConnectionFormToWire,
  repoConnectionSchema,
  jiraStorySchema,
  storyListSchema,
  requirementAnalysisSchema,
  revisionRequestSchema,
  sessionCreateInputSchema,
  sessionBriefSchema,
  sessionDetailSchema,
  sessionReviewDataSchema,
  sessionSummarySchema,
  settingsSchema,
  testDesignPlanSchema,
  testDesignRevisionInputSchema,
  testDesignReviewDataSchema,
  testDesignRunSchema,
} from '@/api/schemas'
import {
  findMockTestCase,
  mockAutomationBacklog,
} from '@/api/mocks/test-cases'
import type {
  AutomateTestCaseInput,
  RepoConnection,
  SessionCreateInput,
} from '@/api/schemas'
import {
  apiBaseUrl,
  getApiConfigurationError,
  resolvedApiPathPrefix,
  sessionActorId,
  sessionCreatedBy,
  useMockData,
} from '@/lib/env'

export {
  ApiError,
  ConfigurationError,
  NetworkApiError,
  SchemaResponseError,
} from '@/api/errors'

const API_PREFIX = resolvedApiPathPrefix()

function assertRealApiConfigured(): void {
  const msg = getApiConfigurationError()
  if (msg) throw new ConfigurationError(msg)
}

/** Full base for API paths: `origin` + configured prefix, without double slashes. */
function apiRootHref(): string {
  const origin = apiBaseUrl.replace(/\/+$/, '')
  if (!origin) {
    return API_PREFIX || ''
  }
  if (!API_PREFIX) return origin
  return `${origin}${API_PREFIX}`
}

function url(...segments: string[]): string {
  const root = apiRootHref()
  const path = segments.map(encodeURIComponent).join('/')
  if (root.endsWith('/')) return `${root}${path}`
  return `${root}/${path}`
}

/** OpenAPI session mutations expect `actorId` (default `qswarm-web` when unset). */
function sessionMutationBody(extra?: Record<string, unknown>): string {
  return JSON.stringify({ actorId: sessionActorId(), ...extra })
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function firstUuid(s: string | undefined): string | undefined {
  if (!s?.trim()) return undefined
  const t = s.trim()
  if (UUID_RE.test(t)) return t
  return undefined
}

/** POST /api/v1/sessions wire body (OpenAPI `UiAutomationSessionCreate`). */
function sessionCreateWireBody(parsed: SessionCreateInput): Record<string, unknown> {
  const wire: Record<string, unknown> = {
    repositoryConnectionId: parsed.repoConnectionId,
    engine: parsed.engine,
    codingEngine: parsed.engine,
    sourceRef: parsed.sourceRef,
    createdBy: sessionCreatedBy,
  }
  if (parsed.branchPolicyId) wire.branchPolicyId = parsed.branchPolicyId
  if (parsed.sourceLabel) wire.sourceLabel = parsed.sourceLabel
  const approved =
    firstUuid(parsed.sourceLabel) ?? firstUuid(parsed.sourceRef)
  if (approved) wire.approvedCaseId = approved
  return wire
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  if (!text) return undefined as T
  try {
    return JSON.parse(text) as T
  } catch {
    return text as unknown as T
  }
}

function httpFailureSummary(status: number, body: unknown, statusText: string) {
  const fromBody = extractBackendMessage(body)
  if (fromBody) return fromBody
  if (status === 404)
    return 'This endpoint or resource was not found. Confirm VITE_API_PATH_PREFIX and that the server exposes this route (see README → Backend alignment).'
  if (status === 401 || status === 403)
    return 'Access was denied. Authentication or permissions may be required.'
  if (status >= 500)
    return 'The API returned a server error. Try again shortly or check backend logs.'
  return statusText || 'Request failed'
}

async function fetchJson<T>(href: string, init?: RequestInit): Promise<T> {
  assertRealApiConfigured()
  let res: Response
  try {
    res = await fetch(href, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    })
  } catch (e) {
    const hint =
      'Could not reach the API. Check VITE_API_BASE_URL, your network, and that the backend allows CORS from this site (browser DevTools → Network).'
    throw new NetworkApiError(hint, { cause: e })
  }
  if (!res.ok) {
    const body = await parseJson<unknown>(res).catch(() => undefined)
    const summary = httpFailureSummary(res.status, body, res.statusText)
    throw new ApiError(summary, res.status, body)
  }
  return parseJson<T>(res)
}

function parseWithSchema<T>(
  schema: z.ZodType<T>,
  data: unknown,
  resourceLabel: string,
): T {
  const parsed = schema.safeParse(data)
  if (parsed.success) return parsed.data
  throw new SchemaResponseError(
    [
      `Zod validation failed for ${resourceLabel}.`,
      'Compare the response with `src/api/schemas.ts` and `docs/LIVE_BACKEND_CONTRACT.md`.',
      'Expand “Technical details” for paths, codes (invalid_type, invalid_enum_value, …), and expected vs received shapes.',
    ].join(' '),
    parsed.error,
    resourceLabel,
  )
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

const mockSessionsStore = {
  detail: { ...mockSessionDetail },
  list: [...mockDashboard.recentSessions],
}

function zArray<T extends z.ZodTypeAny>(schema: T) {
  return z.array(schema)
}

const repoConnectionsListSchema = z.union([
  zArray(repoConnectionSchema),
  z.object({ items: zArray(repoConnectionSchema) }),
])

function parseRepoConnectionsListResponse(
  data: unknown,
  resourceLabel: string,
): RepoConnection[] {
  const parsed = repoConnectionsListSchema.safeParse(data)
  if (!parsed.success) {
    throw new SchemaResponseError(
      [
        `Zod validation failed for ${resourceLabel}.`,
        'Expected a top-level JSON array of repo connections, or `{ "items": [ ... ] }`.',
        'See `docs/LIVE_BACKEND_CONTRACT.md`.',
      ].join(' '),
      parsed.error,
      resourceLabel,
    )
  }
  return Array.isArray(parsed.data) ? parsed.data : parsed.data.items
}

function parseAutomationBacklogList(data: unknown, resourceLabel: string) {
  const listSchema = z.union([
    automationBacklogListSchema,
    z.object({ items: z.array(automationBacklogTestCaseSchema) }),
    z.array(automationBacklogTestCaseSchema),
  ])
  const parsed = listSchema.safeParse(data)
  if (!parsed.success) {
    throw new SchemaResponseError(
      `Zod validation failed for ${resourceLabel}.`,
      parsed.error,
      resourceLabel,
    )
  }
  if (Array.isArray(parsed.data)) {
    return { items: parsed.data, total: parsed.data.length }
  }
  if ('items' in parsed.data && !('total' in parsed.data)) {
    return { items: parsed.data.items, total: parsed.data.items.length }
  }
  return parsed.data
}

function automateTestCaseWireBody(
  testCaseId: string,
  parsed: AutomateTestCaseInput,
  testCase?: { sourceReference?: string; caseId?: string; title?: string; sourceSystem?: string } | null,
): Record<string, unknown> {
  const wire: Record<string, unknown> = {
    actorId: sessionActorId(),
    createdBy: sessionCreatedBy,
    repositoryConnectionId: parsed.repositoryConnectionId,
    engine: parsed.engine,
    codingEngine: parsed.engine,
    approvedCaseId: testCaseId,
    sourceRef:
      testCase?.sourceReference ?? testCase?.caseId ?? testCaseId,
  }
  if (parsed.branchPolicyId) wire.branchPolicyId = parsed.branchPolicyId
  if (testCase?.title) wire.sourceLabel = testCase.title
  if (testCase?.sourceSystem) wire.sourceSystem = testCase.sourceSystem
  return wire
}

export const api = {
  async getDashboard() {
    if (useMockData) {
      await delay(120)
      return dashboardSchema.parse(mockDashboard)
    }
    const data = await fetchJson<unknown>(url('dashboard'))
    return parseWithSchema(dashboardSchema, data, 'GET /dashboard')
  },

  async listRepoConnections() {
    if (useMockData) {
      await delay(80)
      return mockRepoConnections.map((r) => repoConnectionSchema.parse(r))
    }
    const data = await fetchJson<unknown>(url('repo-connections'))
    return parseRepoConnectionsListResponse(data, 'GET /repo-connections')
  },

  async getRepoConnection(id: string) {
    if (useMockData) {
      await delay(60)
      const row = mockRepoConnections.find((r) => r.id === id)
      if (!row) throw new ApiError('Not found', 404)
      return repoConnectionSchema.parse(row)
    }
    const data = await fetchJson<unknown>(url('repo-connections', id))
    return parseWithSchema(repoConnectionSchema, data, `GET /repo-connections/${id}`)
  },

  async createRepoConnection(input: unknown) {
    const trimmed = repoConnectionFormSchema.parse(input)
    const body = repoConnectionFormToWire(trimmed)
    if (useMockData) {
      await delay(100)
      const row: RepoConnection = {
        id: `rc_${crypto.randomUUID().slice(0, 8)}`,
        provider: body.provider,
        ownerOrOrg: body.owner,
        repoName: body.repo,
        projectOrWorkspace: null,
        displayName: body.displayName ?? null,
        cloneUrl: body.cloneUrl ?? null,
        defaultBranch: body.defaultBranch,
        authType: 'github_pat_env',
        credentialReference: body.authRef,
        isActive: true,
        createdBy: 'mock',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      mockRepoConnections.unshift(repoConnectionSchema.parse(row))
      return repoConnectionSchema.parse(row)
    }
    const data = await fetchJson<unknown>(url('repo-connections'), {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return parseWithSchema(repoConnectionSchema, data, 'POST /repo-connections')
  },

  async updateRepoConnection(id: string, input: unknown) {
    const trimmed = repoConnectionFormSchema.parse(input)
    const body = repoConnectionFormToWire(trimmed)
    if (useMockData) {
      await delay(90)
      const idx = mockRepoConnections.findIndex((r) => r.id === id)
      if (idx === -1) throw new ApiError('Not found', 404)
      const row: RepoConnection = {
        ...mockRepoConnections[idx],
        provider: body.provider,
        ownerOrOrg: body.owner,
        repoName: body.repo,
        defaultBranch: body.defaultBranch,
        displayName: body.displayName ?? mockRepoConnections[idx].displayName,
        cloneUrl: body.cloneUrl ?? mockRepoConnections[idx].cloneUrl,
        credentialReference: body.authRef,
        updatedAt: new Date().toISOString(),
      }
      mockRepoConnections[idx] = repoConnectionSchema.parse(row)
      return mockRepoConnections[idx]
    }
    const data = await fetchJson<unknown>(url('repo-connections', id), {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    return parseWithSchema(
      repoConnectionSchema,
      data,
      `PATCH /repo-connections/${id}`,
    )
  },

  async listBranchPolicies() {
    if (useMockData) {
      await delay(80)
      return mockBranchPolicies.map((b) => branchPolicySchema.parse(b))
    }
    const data = await fetchJson<unknown>(url('branch-policies'))
    return parseWithSchema(
      zArray(branchPolicySchema),
      data,
      'GET /branch-policies',
    )
  },

  async getBranchPolicy(id: string) {
    if (useMockData) {
      await delay(50)
      const row = mockBranchPolicies.find((b) => b.id === id)
      if (!row) throw new ApiError('Not found', 404)
      return branchPolicySchema.parse(row)
    }
    const data = await fetchJson<unknown>(url('branch-policies', id))
    return parseWithSchema(branchPolicySchema, data, `GET /branch-policies/${id}`)
  },

  async createBranchPolicy(input: unknown) {
    const body = branchPolicyInputSchema.parse(input)
    const wire = {
      name: body.name,
      baseBranch: body.baseBranch,
      branchPattern: body.branchPattern,
      prTitleTemplate: body.prTitleTemplate,
      prBodyTemplate: body.prBodyTemplate,
      repositoryConnectionId: body.repoConnectionId,
    }
    if (useMockData) {
      await delay(100)
      const row = {
        id: `bp_${crypto.randomUUID().slice(0, 8)}`,
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      mockBranchPolicies.unshift(branchPolicySchema.parse(row))
      return branchPolicySchema.parse(row)
    }
    const data = await fetchJson<unknown>(url('branch-policies'), {
      method: 'POST',
      body: JSON.stringify(wire),
    })
    return parseWithSchema(branchPolicySchema, data, 'POST /branch-policies')
  },

  async updateBranchPolicy(id: string, input: unknown) {
    const body = branchPolicyInputSchema.parse(input)
    if (useMockData) {
      await delay(90)
      const idx = mockBranchPolicies.findIndex((b) => b.id === id)
      if (idx === -1) throw new ApiError('Not found', 404)
      const row = {
        ...mockBranchPolicies[idx],
        ...body,
        updatedAt: new Date().toISOString(),
      }
      mockBranchPolicies[idx] = branchPolicySchema.parse(row)
      return mockBranchPolicies[idx]
    }
    const data = await fetchJson<unknown>(url('branch-policies', id), {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    return parseWithSchema(
      branchPolicySchema,
      data,
      `PATCH /branch-policies/${id}`,
    )
  },

  async listAutomationBacklog(filters?: {
    q?: string
    status?: string
  }) {
    if (useMockData) {
      await delay(90)
      let items = [...mockAutomationBacklog]
      if (filters?.status && filters.status !== 'all') {
        items = items.filter((tc) => tc.automationStatus === filters.status)
      }
      if (filters?.q?.trim()) {
        const q = filters.q.trim().toLowerCase()
        items = items.filter(
          (tc) =>
            tc.title.toLowerCase().includes(q) ||
            tc.caseId?.toLowerCase().includes(q) ||
            tc.storyKey?.toLowerCase().includes(q) ||
            tc.sourceReference?.toLowerCase().includes(q),
        )
      }
      return automationBacklogListSchema.parse({
        items,
        total: items.length,
      })
    }
    const params = new URLSearchParams()
    if (filters?.q?.trim()) params.set('q', filters.q.trim())
    if (filters?.status && filters.status !== 'all') {
      params.set('status', filters.status)
    }
    const qs = params.toString() ? `?${params.toString()}` : ''
    const data = await fetchJson<unknown>(
      `${url('test-cases', 'automation-backlog')}${qs}`,
    )
    return parseAutomationBacklogList(
      data,
      'GET /test-cases/automation-backlog',
    )
  },

  async getTestCase(id: string) {
    if (useMockData) {
      await delay(60)
      const row = findMockTestCase(id)
      if (!row) throw new ApiError('Not found', 404)
      return automationBacklogTestCaseSchema.parse(row)
    }
    const data = await fetchJson<unknown>(url('test-cases', id))
    return parseWithSchema(
      automationBacklogTestCaseSchema,
      data,
      `GET /test-cases/${id}`,
    )
  },

  async automateTestCase(id: string, input: unknown) {
    const body = automateTestCaseInputSchema.parse(input)
    if (useMockData) {
      await delay(160)
      const tc = findMockTestCase(id)
      if (!tc) throw new ApiError('Test case not found', 404)
      const sessionId = `sess_${crypto.randomUUID().slice(0, 8)}`
      const row = sessionDetailSchema.parse({
        ...mockSessionDetail,
        id: sessionId,
        status: 'draft',
        engine: body.engine,
        repoConnectionId: body.repositoryConnectionId,
        branchPolicyId: body.branchPolicyId,
        sourceRef: tc.sourceReference ?? tc.caseId ?? tc.id,
        sourceLabel: tc.title,
        approvedCaseId: tc.id,
        rounds: [],
        patches: [],
        executions: [],
        reviews: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      mockSessionsStore.detail = row
      mockSessionsStore.list = [
        {
          id: row.id,
          status: row.status,
          engine: row.engine,
          repoConnectionId: row.repoConnectionId,
          sourceRef: row.sourceRef,
          sourceLabel: row.sourceLabel,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        },
        ...mockSessionsStore.list,
      ]
      tc.automationStatus = 'in_progress'
      tc.sessionId = sessionId
      return row
    }
    const tc = await this.getTestCase(id).catch(() => null)
    const data = await fetchJson<unknown>(url('test-cases', id, 'automate'), {
      method: 'POST',
      body: JSON.stringify(automateTestCaseWireBody(id, body, tc)),
    })
    return parseWithSchema(
      sessionDetailSchema,
      data,
      `POST /test-cases/${id}/automate`,
    )
  },

  async listSessions(filters?: { status?: string }) {
    if (useMockData) {
      await delay(100)
      let rows = mockSessionsStore.list
      if (filters?.status)
        rows = rows.filter((s) => s.status === filters.status)
      return rows.map((s) => sessionSummarySchema.parse(s))
    }
    const qs = filters?.status
      ? `?status=${encodeURIComponent(filters.status)}`
      : ''
    const data = await fetchJson<unknown>(`${url('sessions')}${qs}`)
    return parseWithSchema(zArray(sessionSummarySchema), data, 'GET /sessions')
  },

  async getSession(id: string) {
    if (useMockData) {
      await delay(120)
      if (id === mockSessionsStore.detail.id)
        return sessionDetailSchema.parse(mockSessionsStore.detail)
      const base = mockSessionsStore.list.find((s) => s.id === id)
      if (!base) throw new ApiError('Not found', 404)
      return sessionDetailSchema.parse({
        ...mockSessionDetail,
        ...base,
        rounds: mockSessionDetail.rounds,
        patches: mockSessionDetail.patches,
        executions: mockSessionDetail.executions,
        reviews: mockSessionDetail.reviews,
      })
    }
    const data = await fetchJson<unknown>(url('sessions', id))
    return parseWithSchema(sessionDetailSchema, data, `GET /sessions/${id}`)
  },

  async getSessionBrief(id: string) {
    if (useMockData) {
      await delay(80)
      const detail =
        id === mockSessionsStore.detail.id
          ? mockSessionsStore.detail
          : {
              ...mockSessionDetail,
              ...(mockSessionsStore.list.find((s) => s.id === id) ?? {}),
            }
      return sessionBriefSchema.parse(
        buildMockSessionBrief(sessionDetailSchema.parse(detail)),
      )
    }
    const data = await fetchJson<unknown>(url('sessions', id, 'brief'))
    return parseWithSchema(
      sessionBriefSchema,
      data,
      `GET /sessions/${id}/brief`,
    )
  },

  async getSessionReviewData(id: string) {
    if (useMockData) {
      await delay(100)
      const detail =
        id === mockSessionsStore.detail.id
          ? mockSessionsStore.detail
          : sessionDetailSchema.parse({
              ...mockSessionDetail,
              ...(mockSessionsStore.list.find((s) => s.id === id) ?? {}),
              rounds: mockSessionDetail.rounds,
              patches: mockSessionDetail.patches,
              executions: mockSessionDetail.executions,
              reviews: mockSessionDetail.reviews,
            })
      return sessionReviewDataSchema.parse(buildMockSessionReviewData(detail))
    }
    const data = await fetchJson<unknown>(url('sessions', id, 'review-data'))
    return parseWithSchema(
      sessionReviewDataSchema,
      data,
      `GET /sessions/${id}/review-data`,
    )
  },

  async createSession(input: unknown) {
    const body = sessionCreateInputSchema.parse(input)
    if (useMockData) {
      await delay(150)
      const id = `sess_${crypto.randomUUID().slice(0, 8)}`
      const row = sessionDetailSchema.parse({
        ...mockSessionDetail,
        id,
        status: 'draft',
        ...body,
        rounds: [],
        patches: [],
        executions: [],
        reviews: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      mockSessionsStore.detail = row
      mockSessionsStore.list = [
        {
          id: row.id,
          status: row.status,
          engine: row.engine,
          repoConnectionId: row.repoConnectionId,
          sourceRef: row.sourceRef,
          sourceLabel: row.sourceLabel,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        },
        ...mockSessionsStore.list,
      ]
      return row
    }
    const data = await fetchJson<unknown>(url('sessions'), {
      method: 'POST',
      body: JSON.stringify(sessionCreateWireBody(body)),
    })
    return parseWithSchema(sessionDetailSchema, data, 'POST /sessions')
  },

  async preparePlan(id: string) {
    if (useMockData) {
      await delay(200)
      setMockPlanApproved(id, false)
      mockSessionsStore.detail = {
        ...mockSessionsStore.detail,
        id,
        status: 'plan_ready',
        workflowStatus: 'plan_ready',
        updatedAt: new Date().toISOString(),
      }
      return sessionDetailSchema.parse(mockSessionsStore.detail)
    }
    const data = await fetchJson<unknown>(url('sessions', id, 'prepare-plan'), {
      method: 'POST',
      body: sessionMutationBody(),
    })
    return parseWithSchema(
      sessionDetailSchema,
      data,
      `POST /sessions/${id}/prepare-plan`,
    )
  },

  async approvePlan(id: string) {
    if (useMockData) {
      await delay(120)
      setMockPlanApproved(id, true)
      mockSessionsStore.detail = {
        ...mockSessionsStore.detail,
        id,
        status: 'plan_ready',
        workflowStatus: 'plan_ready',
        updatedAt: new Date().toISOString(),
      }
      return sessionDetailSchema.parse(mockSessionsStore.detail)
    }
    const data = await fetchJson<unknown>(url('sessions', id, 'approve-plan'), {
      method: 'POST',
      body: sessionMutationBody(),
    })
    return parseWithSchema(
      sessionDetailSchema,
      data,
      `POST /sessions/${id}/approve-plan`,
    )
  },

  async requestPlanRevision(id: string, input: unknown) {
    const body = revisionRequestSchema.parse(input)
    if (useMockData) {
      await delay(150)
      setMockPlanApproved(id, false)
      mockSessionsStore.detail = {
        ...mockSessionsStore.detail,
        id,
        status: 'plan_ready',
        workflowStatus: 'plan_ready',
        updatedAt: new Date().toISOString(),
      }
      return sessionDetailSchema.parse(mockSessionsStore.detail)
    }
    const data = await fetchJson<unknown>(
      url('sessions', id, 'request-plan-revision'),
      {
        method: 'POST',
        body: sessionMutationBody({
          instruction: body.instruction,
          instructionText: body.instruction,
          ...(body.scope ? { scope: body.scope, targetScope: body.scope } : {}),
        }),
      },
    )
    return parseWithSchema(
      sessionDetailSchema,
      data,
      `POST /sessions/${id}/request-plan-revision`,
    )
  },

  async startSession(
    id: string,
    opts?: { repositoryConnectionId?: string },
  ) {
    if (useMockData) {
      await delay(100)
      mockSessionsStore.detail = {
        ...mockSessionsStore.detail,
        id,
        status: 'running',
        updatedAt: new Date().toISOString(),
      }
      return sessionDetailSchema.parse(mockSessionsStore.detail)
    }
    const extra: Record<string, unknown> = {}
    if (opts?.repositoryConnectionId?.trim())
      extra.repositoryConnectionId = opts.repositoryConnectionId.trim()
    const data = await fetchJson<unknown>(url('sessions', id, 'start'), {
      method: 'POST',
      body: sessionMutationBody(extra),
    })
    return parseWithSchema(
      sessionDetailSchema,
      data,
      `POST /sessions/${id}/start`,
    )
  },

  async requestRevision(id: string, input: unknown) {
    const body = revisionRequestSchema.parse(input)
    if (useMockData) {
      await delay(120)
      mockSessionsStore.detail = {
        ...mockSessionsStore.detail,
        id,
        status: 'revising',
        reviews: [
          {
            id: `rev_${crypto.randomUUID().slice(0, 6)}`,
            createdAt: new Date().toISOString(),
            instruction: body.instruction,
            scope: body.scope,
            status: 'open',
          },
          ...mockSessionsStore.detail.reviews,
        ],
        updatedAt: new Date().toISOString(),
      }
      return sessionDetailSchema.parse(mockSessionsStore.detail)
    }
    const data = await fetchJson<unknown>(
      url('sessions', id, 'request-revision'),
      {
        method: 'POST',
        body: sessionMutationBody({
          instruction: body.instruction,
          instructionText: body.instruction,
          ...(body.scope ? { scope: body.scope, targetScope: body.scope } : {}),
        }),
      },
    )
    return parseWithSchema(
      sessionDetailSchema,
      data,
      `POST /sessions/${id}/request-revision`,
    )
  },

  async approveSession(id: string) {
    if (useMockData) {
      await delay(100)
      mockSessionsStore.detail = {
        ...mockSessionsStore.detail,
        id,
        status: 'succeeded',
        updatedAt: new Date().toISOString(),
      }
      return sessionDetailSchema.parse(mockSessionsStore.detail)
    }
    const data = await fetchJson<unknown>(url('sessions', id, 'approve'), {
      method: 'POST',
      body: sessionMutationBody(),
    })
    return parseWithSchema(
      sessionDetailSchema,
      data,
      `POST /sessions/${id}/approve`,
    )
  },

  async createPr(id: string, repositoryConnectionId: string) {
    if (useMockData) {
      await delay(140)
      void repositoryConnectionId
      mockSessionsStore.detail = {
        ...mockSessionsStore.detail,
        id,
        status: 'succeeded',
        updatedAt: new Date().toISOString(),
      }
      return sessionDetailSchema.parse(mockSessionsStore.detail)
    }
    const data = await fetchJson<unknown>(url('sessions', id, 'create-pr'), {
      method: 'POST',
      body: sessionMutationBody({
        repositoryConnectionId: repositoryConnectionId.trim(),
      }),
    })
    return parseWithSchema(
      sessionDetailSchema,
      data,
      `POST /sessions/${id}/create-pr`,
    )
  },

  async getSettings() {
    if (useMockData) {
      await delay(80)
      return settingsSchema.parse(mockSettings)
    }
    const data = await fetchJson<unknown>(url('settings'))
    return parseWithSchema(settingsSchema, data, 'GET /settings')
  },

  async updateSettings(patch: unknown) {
    if (useMockData) {
      await delay(100)
      return settingsSchema.parse({ ...mockSettings, ...(patch as object) })
    }
    const data = await fetchJson<unknown>(url('settings'), {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    return parseWithSchema(settingsSchema, data, 'PATCH /settings')
  },

  // --- Sprint 1: Jira stories & test-design runs ---

  async listStories(filters?: {
    q?: string
    project?: string
    sprint?: string
    status?: string
    readiness?: string
  }) {
    if (useMockData) {
      await delay(90)
      let stories = [...mockJiraStories]
      if (filters?.project) {
        stories = stories.filter((s) => s.projectKey === filters.project)
      }
      if (filters?.readiness) {
        stories = stories.filter((s) => s.readiness === filters.readiness)
      }
      if (filters?.q?.trim()) {
        const q = filters.q.trim().toLowerCase()
        stories = stories.filter(
          (s) =>
            s.storyKey.toLowerCase().includes(q) ||
            s.title.toLowerCase().includes(q),
        )
      }
      return storyListSchema.parse({
        stories,
        total: stories.length,
      })
    }
    const params = new URLSearchParams()
    if (filters?.q?.trim()) params.set('q', filters.q.trim())
    if (filters?.project) params.set('project', filters.project)
    if (filters?.sprint) params.set('sprint', filters.sprint)
    if (filters?.status) params.set('status', filters.status)
    if (filters?.readiness) params.set('readiness', filters.readiness)
    const qs = params.toString() ? `?${params.toString()}` : ''
    const data = await fetchJson<unknown>(`${url('stories')}${qs}`)
    return parseWithSchema(storyListSchema, data, 'GET /stories')
  },

  async getStory(key: string) {
    if (useMockData) {
      await delay(60)
      const row = findMockStory(key)
      if (!row) throw new ApiError('Story not found', 404)
      return jiraStorySchema.parse(row)
    }
    const data = await fetchJson<unknown>(url('stories', key))
    return parseWithSchema(jiraStorySchema, data, `GET /stories/${key}`)
  },

  async createTestDesignRun(storyKey: string) {
    if (useMockData) {
      await delay(140)
      const existing = listMockTestDesignRuns().find(
        (r) => r.storyKey === storyKey && r.status !== 'published',
      )
      if (existing) return testDesignRunSchema.parse(existing)
      return testDesignRunSchema.parse(createMockTestDesignRun(storyKey))
    }
    const data = await fetchJson<unknown>(
      url('stories', storyKey, 'test-design-runs'),
      {
        method: 'POST',
        body: sessionMutationBody({ createdBy: sessionCreatedBy }),
      },
    )
    return parseWithSchema(
      testDesignRunSchema,
      data,
      `POST /stories/${storyKey}/test-design-runs`,
    )
  },

  async getTestDesignRun(id: string) {
    if (useMockData) {
      await delay(70)
      const row = findMockTestDesignRun(id)
      if (!row) throw new ApiError('Test-design run not found', 404)
      return testDesignRunSchema.parse(row)
    }
    const data = await fetchJson<unknown>(url('test-design-runs', id))
    return parseWithSchema(
      testDesignRunSchema,
      data,
      `GET /test-design-runs/${id}`,
    )
  },

  async getRequirementAnalysis(runId: string) {
    if (useMockData) {
      await delay(80)
      const run = findMockTestDesignRun(runId)
      if (!run) throw new ApiError('Not found', 404)
      return requirementAnalysisSchema.parse(buildMockRequirementAnalysis(run))
    }
    const data = await fetchJson<unknown>(
      url('test-design-runs', runId, 'requirement-analysis'),
    )
    return parseWithSchema(
      requirementAnalysisSchema,
      data,
      `GET /test-design-runs/${runId}/requirement-analysis`,
    )
  },

  async getTestDesignPlan(runId: string) {
    if (useMockData) {
      await delay(70)
      const run = findMockTestDesignRun(runId)
      if (!run) throw new ApiError('Not found', 404)
      return testDesignPlanSchema.parse(buildMockTestDesignPlan(run))
    }
    const data = await fetchJson<unknown>(
      url('test-design-runs', runId, 'test-design-plan'),
    )
    return parseWithSchema(
      testDesignPlanSchema,
      data,
      `GET /test-design-runs/${runId}/test-design-plan`,
    )
  },

  async getTestDesignReviewData(runId: string) {
    if (useMockData) {
      await delay(90)
      const run = findMockTestDesignRun(runId)
      if (!run) throw new ApiError('Not found', 404)
      return testDesignReviewDataSchema.parse(
        buildMockTestDesignReviewData(run),
      )
    }
    const data = await fetchJson<unknown>(
      url('test-design-runs', runId, 'review-data'),
    )
    return parseWithSchema(
      testDesignReviewDataSchema,
      data,
      `GET /test-design-runs/${runId}/review-data`,
    )
  },

  async analyzeRequirements(runId: string) {
    if (useMockData) {
      await delay(200)
      updateMockRun(runId, {
        status: 'analysis_ready',
        analysisReady: true,
        nextActions: [
          'request_analysis_revision',
          'prepare_test_design_plan',
        ],
      })
      const run = findMockTestDesignRun(runId)!
      mockTestDesignStore.analysis.set(runId, buildMockRequirementAnalysis(run))
      return testDesignRunSchema.parse(run)
    }
    const data = await fetchJson<unknown>(
      url('test-design-runs', runId, 'analyze-requirements'),
      { method: 'POST', body: sessionMutationBody() },
    )
    return parseWithSchema(
      testDesignRunSchema,
      data,
      `POST /test-design-runs/${runId}/analyze-requirements`,
    )
  },

  async prepareTestDesignPlan(runId: string) {
    if (useMockData) {
      await delay(180)
      updateMockRun(runId, {
        status: 'plan_ready',
        nextActions: ['request_plan_changes', 'approve_plan'],
      })
      const run = findMockTestDesignRun(runId)!
      mockTestDesignStore.plans.set(runId, buildMockTestDesignPlan(run))
      return testDesignRunSchema.parse(run)
    }
    const data = await fetchJson<unknown>(
      url('test-design-runs', runId, 'prepare-test-design-plan'),
      { method: 'POST', body: sessionMutationBody() },
    )
    return parseWithSchema(
      testDesignRunSchema,
      data,
      `POST /test-design-runs/${runId}/prepare-test-design-plan`,
    )
  },

  async approveTestDesignPlan(runId: string) {
    if (useMockData) {
      await delay(120)
      updateMockRun(runId, {
        status: 'plan_approved',
        planApproved: true,
        nextActions: ['generate_test_cases'],
      })
      return testDesignRunSchema.parse(findMockTestDesignRun(runId)!)
    }
    const data = await fetchJson<unknown>(
      url('test-design-runs', runId, 'approve-plan'),
      { method: 'POST', body: sessionMutationBody() },
    )
    return parseWithSchema(
      testDesignRunSchema,
      data,
      `POST /test-design-runs/${runId}/approve-plan`,
    )
  },

  async requestTestDesignPlanRevision(runId: string, input: unknown) {
    const body = testDesignRevisionInputSchema.parse(input)
    if (useMockData) {
      await delay(160)
      updateMockRun(runId, {
        status: 'plan_preparing',
        nextActions: [],
      })
      await delay(100)
      updateMockRun(runId, {
        status: 'plan_ready',
        nextActions: ['request_plan_changes', 'approve_plan'],
      })
      return testDesignRunSchema.parse(findMockTestDesignRun(runId)!)
    }
    const data = await fetchJson<unknown>(
      url('test-design-runs', runId, 'request-plan-revision'),
      {
        method: 'POST',
        body: sessionMutationBody({
          instruction: body.instruction,
          instructionText: body.instruction,
          ...(body.scope ? { scope: body.scope } : {}),
          ...(body.focusArea ? { focusArea: body.focusArea } : {}),
        }),
      },
    )
    return parseWithSchema(
      testDesignRunSchema,
      data,
      `POST /test-design-runs/${runId}/request-plan-revision`,
    )
  },

  async generateTestCases(runId: string) {
    if (useMockData) {
      await delay(220)
      updateMockRun(runId, {
        status: 'cases_ready',
        casesGenerated: true,
        currentVersion: 1,
        nextActions: ['request_test_case_changes', 'approve_test_design'],
      })
      const run = findMockTestDesignRun(runId)!
      mockTestDesignStore.reviewData.set(
        runId,
        buildMockTestDesignReviewData(run),
      )
      return testDesignRunSchema.parse(run)
    }
    const data = await fetchJson<unknown>(
      url('test-design-runs', runId, 'generate-test-cases'),
      { method: 'POST', body: sessionMutationBody() },
    )
    return parseWithSchema(
      testDesignRunSchema,
      data,
      `POST /test-design-runs/${runId}/generate-test-cases`,
    )
  },

  async requestTestCaseRevision(runId: string, input: unknown) {
    const body = testDesignRevisionInputSchema.parse(input)
    if (useMockData) {
      await delay(200)
      const run = findMockTestDesignRun(runId)!
      const nextVersion = (run.currentVersion ?? 1) + 1
      updateMockRun(runId, {
        status: 'revising',
        nextActions: [],
      })
      await delay(100)
      updateMockRun(runId, {
        status: 'cases_ready',
        currentVersion: nextVersion,
        nextActions: ['request_test_case_changes', 'approve_test_design'],
      })
      const updated = findMockTestDesignRun(runId)!
      const review = buildMockTestDesignReviewData(updated)
      review.reviewConversation.push({
        id: `conv_${Date.now()}`,
        type: 'request_revision',
        actor: 'reviewer',
        text: body.instruction,
        createdAt: new Date().toISOString(),
        scope: body.scope,
      })
      review.reviewConversation.push({
        id: `conv_${Date.now() + 1}`,
        type: 'agent',
        actor: 'qswarm',
        text: `Revision complete. Version ${nextVersion} ready for review.`,
        createdAt: new Date().toISOString(),
        status: 'completed',
      })
      review.reviewSummary.currentVersion = nextVersion
      mockTestDesignStore.reviewData.set(runId, review)
      return testDesignRunSchema.parse(updated)
    }
    const data = await fetchJson<unknown>(
      url('test-design-runs', runId, 'request-test-case-revision'),
      {
        method: 'POST',
        body: sessionMutationBody({
          instruction: body.instruction,
          instructionText: body.instruction,
          ...(body.scope ? { scope: body.scope } : {}),
          ...(body.focusArea ? { focusArea: body.focusArea } : {}),
        }),
      },
    )
    return parseWithSchema(
      testDesignRunSchema,
      data,
      `POST /test-design-runs/${runId}/request-test-case-revision`,
    )
  },

  async approveTestDesign(runId: string) {
    if (useMockData) {
      await delay(120)
      updateMockRun(runId, {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        nextActions: ['publish_test_cases'],
      })
      return testDesignRunSchema.parse(findMockTestDesignRun(runId)!)
    }
    const data = await fetchJson<unknown>(
      url('test-design-runs', runId, 'approve'),
      { method: 'POST', body: sessionMutationBody() },
    )
    return parseWithSchema(
      testDesignRunSchema,
      data,
      `POST /test-design-runs/${runId}/approve`,
    )
  },

  async publishTestCases(runId: string) {
    if (useMockData) {
      await delay(200)
      updateMockRun(runId, {
        status: 'published',
        publishedAt: new Date().toISOString(),
        nextActions: ['open_automation_backlog'],
      })
      const run = findMockTestDesignRun(runId)!
      mockTestDesignStore.reviewData.set(
        runId,
        buildMockTestDesignReviewData(run),
      )
      return testDesignRunSchema.parse(run)
    }
    const data = await fetchJson<unknown>(
      url('test-design-runs', runId, 'publish'),
      { method: 'POST', body: sessionMutationBody() },
    )
    return parseWithSchema(
      testDesignRunSchema,
      data,
      `POST /test-design-runs/${runId}/publish`,
    )
  },
}
