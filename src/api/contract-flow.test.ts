import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  testDesignRunAnalysisReadyFixture,
  testDesignRunAwaitingPlanApprovalFixture,
  testDesignRunAwaitingTestCaseReviewFixture,
  testDesignRunAutomationReadyFixture,
  testDesignRunIntakeReadyFixture,
  testDesignRunPlanApprovedFixture,
} from '@/api/mocks/fixtures/test-design-runs'
import { sessionDetailSchema } from '@/api/schemas'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('Sprint 1 → Sprint 2 contract flow (mocked HTTP)', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_USE_MOCK_DATA', 'false')
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')
    vi.stubEnv('VITE_ALLOW_SAME_ORIGIN_API', 'false')
  })

  it('sequences documented routes without alias drift', async () => {
    vi.stubEnv('VITE_USE_MOCK_DATA', 'false')
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')
    vi.stubEnv('VITE_ALLOW_SAME_ORIGIN_API', 'false')

    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.resetModules()
    const { api } = await import('@/api/client')

    const storyKey = 'NSP-696'
    const runId = testDesignRunIntakeReadyFixture.id
    const sessionId = 'sess-contract-flow-1'
    const testCaseId = 'tc-contract-1'

    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ stories: [], total: 0 }),
      )
      .mockResolvedValueOnce(jsonResponse(testDesignRunIntakeReadyFixture))
      .mockResolvedValueOnce(jsonResponse(testDesignRunIntakeReadyFixture))
      .mockResolvedValueOnce(jsonResponse(testDesignRunAnalysisReadyFixture))
      .mockResolvedValueOnce(
        jsonResponse({
          version: 1,
          artifactId: 'analysis-1',
          content: { storyKey, summary: 'Analysis ready' },
        }),
      )
      .mockResolvedValueOnce(jsonResponse(testDesignRunAwaitingPlanApprovalFixture))
      .mockResolvedValueOnce(
        jsonResponse({
          version: 1,
          artifactId: 'plan-1',
          content: { summary: 'Plan ready' },
        }),
      )
      .mockResolvedValueOnce(jsonResponse(testDesignRunPlanApprovedFixture))
      .mockResolvedValueOnce(
        jsonResponse(testDesignRunAwaitingTestCaseReviewFixture),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          workflowRunId: runId,
          reviewSummary: {
            status: 'awaiting_test_case_review',
            currentVersion: 1,
            testCaseCount: 1,
            gapsCount: 0,
            automationCandidateCount: 1,
            nextActions: ['approve_test_design'],
          },
          testCases: [],
          conversation: [],
          versions: [],
          publication: { publishedCount: 0, records: [] },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(testDesignRunAutomationReadyFixture),
      )
      .mockResolvedValueOnce(jsonResponse({ items: [{ id: testCaseId, registryKey: 'TC-1', workflowRunId: runId, sourceStoryKey: storyKey, title: 'Case' }], total: 1 }))
      .mockResolvedValueOnce(
        jsonResponse(
          sessionDetailSchema.parse({
            id: sessionId,
            status: 'draft',
            engine: 'copilot_agent',
            repoConnectionId: 'rc-1',
            sourceRef: testCaseId,
            sourceLabel: 'Case',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            rounds: [],
            patches: [],
            executions: [],
            reviews: [],
          }),
        ),
      )

    await api.listStories()
    await api.createTestDesignRun(storyKey)
    await api.getTestDesignRun(runId)
    await api.analyzeRequirements(runId)
    await api.getRequirementAnalysis(runId)
    await api.prepareTestDesignPlan(runId)
    await api.getTestDesignPlan(runId)
    await api.approveTestDesignPlan(runId)
    await api.generateTestCases(runId)
    await api.getTestDesignReviewData(runId)
    await api.publishTestCases(runId)
    await api.listAutomationBacklog({ status: 'not_automated' })
    await api.automateTestCase(testCaseId, {
      repositoryConnectionId: 'rc-1',
      engine: 'copilot_agent',
    })

    const hrefs = fetchMock.mock.calls.map(([href]) => String(href))
    expect(hrefs.some((h) => h.includes('/analyze-requirements'))).toBe(false)
    expect(hrefs.some((h) => h.includes('/automation-backlog'))).toBe(false)
    expect(hrefs.some((h) => h.includes('/analyze'))).toBe(true)
    expect(hrefs.some((h) => h.includes('/test-cases?'))).toBe(true)
    expect(hrefs.some((h) => h.includes('/automate'))).toBe(true)
  })
})
