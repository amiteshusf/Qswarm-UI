import type {
  RequirementAnalysis,
  TestCaseDraft,
  TestDesignPlan,
  TestDesignReviewData,
  TestDesignRun,
} from '@/api/schemas'
import { findMockStory } from '@/api/mocks/stories'

type RunStore = {
  runs: Map<string, TestDesignRun>
  analysis: Map<string, RequirementAnalysis>
  plans: Map<string, TestDesignPlan>
  reviewData: Map<string, TestDesignReviewData>
}

export const mockTestDesignStore: RunStore = {
  runs: new Map(),
  analysis: new Map(),
  plans: new Map(),
  reviewData: new Map(),
}

function seedInv12Run() {
  const run: TestDesignRun = {
    id: 'tdr_inv12',
    storyKey: 'INV-12',
    storyTitle: 'Inventory alerts',
    projectKey: 'INV',
    status: 'cases_ready',
    workflowStatus: 'awaiting_review',
    nextActions: ['request_test_case_changes', 'approve_test_design'],
    currentVersion: 2,
    planApproved: true,
    analysisReady: true,
    casesGenerated: true,
    externalUrl: 'https://jira.example.com/browse/INV-12',
    createdAt: '2026-07-18T10:00:00Z',
    updatedAt: '2026-07-19T14:30:00Z',
  }
  mockTestDesignStore.runs.set(run.id, run)
  mockTestDesignStore.analysis.set(run.id, buildAnalysis(run))
  mockTestDesignStore.plans.set(run.id, buildPlan(run))
  mockTestDesignStore.reviewData.set(run.id, buildReviewData(run))
}

function seedAuth4Run() {
  const run: TestDesignRun = {
    id: 'tdr_auth4',
    storyKey: 'AUTH-4',
    storyTitle: 'Login happy path',
    projectKey: 'AUTH',
    status: 'published',
    workflowStatus: 'published',
    nextActions: ['open_automation_backlog'],
    currentVersion: 1,
    planApproved: true,
    analysisReady: true,
    casesGenerated: true,
    approvedAt: '2026-07-14T12:00:00Z',
    publishedAt: '2026-07-15T09:00:00Z',
    externalUrl: 'https://jira.example.com/browse/AUTH-4',
    createdAt: '2026-07-12T08:00:00Z',
    updatedAt: '2026-07-15T09:00:00Z',
  }
  mockTestDesignStore.runs.set(run.id, run)
  mockTestDesignStore.analysis.set(run.id, buildAnalysis(run))
  mockTestDesignStore.plans.set(run.id, buildPlan(run))
  mockTestDesignStore.reviewData.set(run.id, buildPublishedReviewData(run))
}

seedInv12Run()
seedAuth4Run()

export function listMockTestDesignRuns(): TestDesignRun[] {
  return Array.from(mockTestDesignStore.runs.values())
}

export function findMockTestDesignRun(id: string): TestDesignRun | undefined {
  return mockTestDesignStore.runs.get(id)
}

export function createMockTestDesignRun(storyKey: string): TestDesignRun {
  const story = findMockStory(storyKey)
  const id = `tdr_${crypto.randomUUID().slice(0, 8)}`
  const run: TestDesignRun = {
    id,
    storyKey,
    storyTitle: story?.title ?? storyKey,
    projectKey: story?.projectKey,
    status: 'draft',
    nextActions: ['analyze_requirements'],
    currentVersion: 0,
    externalUrl: story?.jiraUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  mockTestDesignStore.runs.set(id, run)
  if (story) {
    story.hasActiveRun = true
    story.activeRunId = id
  }
  return run
}

function buildAnalysis(run: TestDesignRun): RequirementAnalysis {
  return {
    runId: run.id,
    storyKey: run.storyKey,
    storyTitle: run.storyTitle,
    summary: `Requirement analysis for ${run.storyKey}: ${run.storyTitle}`,
    acceptanceCriteria: [
      {
        id: 'ac-1',
        text: 'Low-stock banner appears when quantity is below threshold',
        covered: true,
      },
      {
        id: 'ac-2',
        text: 'Banner shows SKU and current quantity',
        covered: true,
      },
      {
        id: 'ac-3',
        text: 'Banner dismisses after restock above threshold',
        covered: false,
      },
    ],
    businessRules: [
      'Threshold default is 5 units unless configured per SKU',
      'Banner only shows on inventory detail page',
    ],
    gaps: [
      {
        id: 'gap-1',
        description: 'Threshold value for low-stock banner not specified in Jira',
        severity: 'medium',
      },
    ],
    dependencies: ['Inventory seed API', 'SKU catalog fixture'],
    assumptions: ['Threshold of 5 units applies for MVP'],
    risks: ['Flaky timing if inventory sync is delayed'],
    proposedScope:
      'Cover banner visibility, content, and dismissal after restock for a single SKU.',
    readinessStatus: 'needs_clarification',
    missingInformation: ['Confirm threshold value with product owner'],
  }
}

function buildPlan(run: TestDesignRun): TestDesignPlan {
  return {
    runId: run.id,
    version: 1,
    versionId: `plan_v1_${run.id}`,
    functionalAreas: ['Inventory detail page', 'Low-stock banner'],
    positiveScenarios: [
      'Banner appears when quantity drops below threshold',
      'Banner shows correct SKU and quantity',
    ],
    negativeScenarios: [
      'Banner does not appear when quantity is above threshold',
      'Banner does not appear for inactive SKU',
    ],
    boundaryCoverage: ['Quantity exactly at threshold', 'Quantity zero'],
    dataVariations: ['SKU with custom threshold', 'SKU with default threshold'],
    automationCandidates: [
      'Low-stock banner visibility',
      'Banner content validation',
    ],
    exclusions: ['Bulk import flows', 'Multi-warehouse inventory'],
    traceability: [
      { acceptanceCriteriaId: 'ac-1', coverage: 'Positive + boundary scenarios' },
      { acceptanceCriteriaId: 'ac-2', coverage: 'Banner content assertions' },
    ],
    estimatedCaseCount: 8,
    summary:
      'Eight functional cases covering banner visibility, content, boundaries, and dismissal.',
  }
}

function sampleTestCases(run: TestDesignRun, version: number): TestCaseDraft[] {
  return [
    {
      id: `tc_${run.id}_1`,
      draftId: 'TC-D-001',
      version,
      title: 'Low-stock banner appears below threshold',
      objective: 'Verify banner shows when on-hand quantity is below 5',
      preconditions: ['SKU exists with qty 3'],
      steps: ['Open inventory detail for SKU', 'Observe banner region'],
      expectedResults: ['Low-stock banner is visible', 'Banner shows qty 3'],
      priority: 'high',
      type: 'functional',
      automationCandidate: true,
      linkedAcceptanceCriteria: ['ac-1'],
      changeType: version > 1 ? 'unchanged' : 'added',
    },
    {
      id: `tc_${run.id}_2`,
      draftId: 'TC-D-002',
      version,
      title: 'Banner hidden above threshold',
      objective: 'Verify no banner when quantity is sufficient',
      preconditions: ['SKU exists with qty 10'],
      steps: ['Open inventory detail for SKU'],
      expectedResults: ['Low-stock banner is not visible'],
      priority: 'medium',
      type: 'negative',
      automationCandidate: true,
      linkedAcceptanceCriteria: ['ac-1'],
      changeType: version > 1 ? 'modified' : 'added',
    },
    {
      id: `tc_${run.id}_3`,
      draftId: 'TC-D-003',
      version,
      title: 'Banner shows SKU and quantity',
      objective: 'Verify banner content matches SKU data',
      preconditions: ['SKU INV-42 with qty 2'],
      steps: ['Open inventory detail', 'Read banner text'],
      expectedResults: [
        'Banner contains SKU code INV-42',
        'Banner contains quantity 2',
      ],
      priority: 'high',
      type: 'functional',
      automationCandidate: true,
      linkedAcceptanceCriteria: ['ac-2'],
      changeType: version > 1 ? 'added' : 'added',
    },
  ]
}

function buildReviewData(run: TestDesignRun): TestDesignReviewData {
  const version = run.currentVersion ?? 1
  return {
    runId: run.id,
    reviewSummary: {
      currentVersion: version,
      currentVersionId: `v${version}_${run.id}`,
      totalCases: 3,
      automationCandidateCount: 3,
      gapsRemaining: 1,
      traceabilityCoverage: '67%',
      reviewState: 'awaiting_review',
      nextActions: run.nextActions,
    },
    testCases: sampleTestCases(run, version),
    versions: [
      {
        version: 1,
        versionId: `v1_${run.id}`,
        label: 'Initial generation',
        createdAt: '2026-07-19T10:00:00Z',
        caseCount: 2,
        changeSummary: '2 cases generated',
        addedCount: 2,
      },
      {
        version: 2,
        versionId: `v2_${run.id}`,
        label: 'Revision 1',
        createdAt: '2026-07-19T14:30:00Z',
        caseCount: 3,
        changeSummary: 'Added banner content case, updated negative case',
        addedCount: 1,
        modifiedCount: 1,
      },
    ],
    reviewConversation: [
      {
        id: 'conv-1',
        type: 'agent',
        actor: 'qswarm',
        text: 'Generated 2 test cases from approved plan.',
        createdAt: '2026-07-19T10:00:00Z',
      },
      {
        id: 'conv-2',
        type: 'request_revision',
        actor: 'reviewer',
        text: 'Add a case for banner content and improve the negative scenario.',
        createdAt: '2026-07-19T12:00:00Z',
        scope: 'inventory banner',
      },
      {
        id: 'conv-3',
        type: 'agent',
        actor: 'qswarm',
        text: 'Revision complete: 1 case added, 1 modified. Version 2 ready for review.',
        createdAt: '2026-07-19T14:30:00Z',
        status: 'completed',
      },
    ],
    publicationResult: null,
  }
}

function buildPublishedReviewData(run: TestDesignRun): TestDesignReviewData {
  const base = buildReviewData(run)
  return {
    ...base,
    reviewSummary: {
      ...base.reviewSummary,
      reviewState: 'published',
      nextActions: ['open_automation_backlog'],
    },
    publicationResult: {
      destination: 'Jira',
      status: 'succeeded',
      publishedCount: 3,
      failedCount: 0,
      readyForAutomationCount: 3,
      items: [
        {
          externalId: 'QA-1042',
          externalUrl: 'https://jira.example.com/browse/QA-1042',
          title: 'Login redirects authenticated user to dashboard',
          status: 'published',
          testCaseId: 'a1f2c3d4-e5f6-7890-abcd-ef1234567890',
        },
      ],
    },
  }
}

export function buildMockRequirementAnalysis(
  run: TestDesignRun,
): RequirementAnalysis {
  return mockTestDesignStore.analysis.get(run.id) ?? buildAnalysis(run)
}

export function buildMockTestDesignPlan(run: TestDesignRun): TestDesignPlan {
  return mockTestDesignStore.plans.get(run.id) ?? buildPlan(run)
}

export function buildMockTestDesignReviewData(
  run: TestDesignRun,
): TestDesignReviewData {
  if (run.status === 'published') {
    return (
      mockTestDesignStore.reviewData.get(run.id) ??
      buildPublishedReviewData(run)
    )
  }
  return mockTestDesignStore.reviewData.get(run.id) ?? buildReviewData(run)
}

export function updateMockRun(id: string, patch: Partial<TestDesignRun>) {
  const existing = mockTestDesignStore.runs.get(id)
  if (!existing) return
  const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() }
  mockTestDesignStore.runs.set(id, updated)
  const story = findMockStory(updated.storyKey)
  if (story) {
    story.hasActiveRun = true
    story.activeRunId = updated.id
  }
}
