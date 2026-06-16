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
  branchPolicyInputSchema,
  branchPolicySchema,
  dashboardSchema,
  repoConnectionInputSchema,
  repoConnectionSchema,
  revisionRequestSchema,
  sessionCreateInputSchema,
  sessionDetailSchema,
  sessionSummarySchema,
  settingsSchema,
} from '@/api/schemas'
import { apiBaseUrl, getApiConfigurationError, resolvedApiPathPrefix, uiActorId, useMockData } from '@/lib/env'

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

function sessionMutationBody(extra?: Record<string, unknown>): string {
  const base: Record<string, unknown> = {}
  if (uiActorId) base.actorId = uiActorId
  return JSON.stringify({ ...base, ...extra })
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
    'The server sent a response that does not match the UI contract (Zod validation failed). The backend may have changed; compare with src/api/schemas.ts.',
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
    return parseWithSchema(zArray(repoConnectionSchema), data, 'GET /repo-connections')
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
    const body = repoConnectionInputSchema.parse(input)
    if (useMockData) {
      await delay(100)
      const row = {
        id: `rc_${crypto.randomUUID().slice(0, 8)}`,
        ...body,
        cloneUrl: body.cloneUrl || undefined,
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
    const body = repoConnectionInputSchema.parse(input)
    if (useMockData) {
      await delay(90)
      const idx = mockRepoConnections.findIndex((r) => r.id === id)
      if (idx === -1) throw new ApiError('Not found', 404)
      const row = {
        ...mockRepoConnections[idx],
        ...body,
        cloneUrl: body.cloneUrl || undefined,
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
      body: JSON.stringify(body),
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
      body: JSON.stringify(body),
    })
    return parseWithSchema(sessionDetailSchema, data, 'POST /sessions')
  },

  async startSession(id: string) {
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
    const data = await fetchJson<unknown>(url('sessions', id, 'start'), {
      method: 'POST',
      body: sessionMutationBody(),
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
          ...(body.scope ? { scope: body.scope } : {}),
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

  async createPr(id: string) {
    if (useMockData) {
      await delay(140)
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
      body: sessionMutationBody(),
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
}
