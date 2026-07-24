import { adaptJiraStoryDetail } from '@/api/adapters/stories'
import { beforeEach, describe, expect, it, vi } from 'vitest'

async function loadApiClient() {
  vi.stubEnv('VITE_USE_MOCK_DATA', 'false')
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')
  vi.stubEnv('VITE_ALLOW_SAME_ORIGIN_API', 'false')
  vi.resetModules()
  const mod = await import('@/api/client')
  return mod.api
}
import { backendRoutes } from '@/api/backend-route-manifest'
import { testDesignRunIntakeReadyFixture } from '@/api/mocks/fixtures/test-design-runs'

describe('API client routes', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(testDesignRunIntakeReadyFixture), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )
  })

  it('POST analyze uses canonical /analyze path with actor_id query', async () => {
    const api = await loadApiClient()
    await api.analyzeRequirements(testDesignRunIntakeReadyFixture.id)
    const [href, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit]
    expect(init.method).toBe('POST')
    expect(href).toBe(
      `https://api.example.com${backendRoutes.testDesignRuns.analyze(testDesignRunIntakeReadyFixture.id).path}?actor_id=qswarm-web`,
    )
    expect(href).not.toContain('analyze-requirements')
    expect(init.body).toBeUndefined()
  })

  it('GET analysis uses /analysis sub-resource', async () => {
    const api = await loadApiClient()
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          version: 1,
          artifactId: 'analysis-1',
          content: { storyKey: 'NSP-696', summary: 'ok' },
        }),
        { status: 200 },
      ),
    )
    await api.getRequirementAnalysis(testDesignRunIntakeReadyFixture.id)
    const [href] = vi.mocked(fetch).mock.calls[0] as [string]
    expect(href).toContain('/analysis')
    expect(href).not.toContain('requirement-analysis')
  })

  it('lists backlog via GET /test-cases', async () => {
    const api = await loadApiClient()
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ items: [] }), { status: 200 }),
    )
    await api.listAutomationBacklog({ status: 'not_automated' })
    const [href] = vi.mocked(fetch).mock.calls[0] as [string]
    expect(href).toContain(backendRoutes.testCases.list().path)
    expect(href).not.toContain('automation-backlog')
    expect(href).toContain('status=automation_ready')
  })

  it('POST prepare-plan uses canonical path', async () => {
    const api = await loadApiClient()
    await api.prepareTestDesignPlan(testDesignRunIntakeReadyFixture.id)
    const [href] = vi.mocked(fetch).mock.calls[0] as [string]
    expect(href).toContain('/prepare-plan')
    expect(href).not.toContain('prepare-test-design-plan')
  })

  it('POST request-revision uses canonical path for case revisions', async () => {
    const api = await loadApiClient()
    await api.requestTestCaseRevision(testDesignRunIntakeReadyFixture.id, {
      instruction: 'Tighten assertions',
    })
    const [href] = vi.mocked(fetch).mock.calls[0] as [string]
    expect(href).toContain('/request-revision')
    expect(href).not.toContain('request-test-case-revision')
  })
})
