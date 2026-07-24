import type {
  RequirementAnalysis,
  TestDesignPlan,
  TestDesignReviewData,
  TestDesignRun,
} from '@/api/schemas'
import {
  artifactRefToRequirementAnalysis,
  artifactRefToTestDesignPlan,
} from '@/api/adapters/test-design'
import {
  testDesignRunAwaitingTestCaseReviewFixture,
  testDesignRunAutomationReadyFixture,
  testDesignRunIntakeReadyFixture,
} from '@/api/mocks/fixtures/test-design-runs'
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

function seedFixtureRun(fixture: TestDesignRun) {
  mockTestDesignStore.runs.set(fixture.id, fixture)
  if (fixture.requirementAnalysis) {
    mockTestDesignStore.analysis.set(fixture.id, buildAnalysis(fixture))
  }
  if (fixture.testDesignPlan) {
    mockTestDesignStore.plans.set(fixture.id, buildPlan(fixture))
  }
  if (fixture.testCaseRecords.length > 0) {
    mockTestDesignStore.reviewData.set(fixture.id, buildReviewData(fixture))
  }
}

seedFixtureRun(testDesignRunAwaitingTestCaseReviewFixture)
seedFixtureRun(testDesignRunAutomationReadyFixture)

export function listMockTestDesignRuns(): TestDesignRun[] {
  return Array.from(mockTestDesignStore.runs.values())
}

export function findMockTestDesignRun(id: string): TestDesignRun | undefined {
  return mockTestDesignStore.runs.get(id)
}

export function createMockTestDesignRun(storyKey: string): TestDesignRun {
  const existing = Array.from(mockTestDesignStore.runs.values()).find(
    (r) => r.storyKey === storyKey && r.currentStage !== 'automation_ready',
  )
  if (existing) return existing

  const id = crypto.randomUUID()
  const run: TestDesignRun = {
    ...testDesignRunIntakeReadyFixture,
    id,
    storyKey,
    sourceStory: {
      storyKey,
      intakeArtifactId: crypto.randomUUID(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  mockTestDesignStore.runs.set(id, run)
  const story = findMockStory(storyKey)
  if (story) {
    story.hasActiveRun = true
    story.activeRunId = id
  }
  return run
}

function buildAnalysis(run: TestDesignRun): RequirementAnalysis {
  if (run.requirementAnalysis) {
    return artifactRefToRequirementAnalysis(
      run.id,
      run.storyKey,
      run.requirementAnalysis,
    )
  }
  return {
    runId: run.id,
    storyKey: run.storyKey,
    storyTitle: run.storyKey,
    summary: `Requirement analysis for ${run.storyKey}`,
    acceptanceCriteria: [
      {
        id: 'ac-1',
        text: 'Low-stock banner appears when quantity is below threshold',
        covered: true,
      },
    ],
    gaps: [
      {
        id: 'gap-1',
        description: 'Threshold not specified',
        severity: 'medium',
      },
    ],
    businessRules: ['Threshold default is 5 units'],
    proposedScope: 'Cover banner visibility and content.',
    readinessStatus: 'needs_clarification',
  }
}

function buildPlan(run: TestDesignRun): TestDesignPlan {
  if (run.testDesignPlan) {
    return artifactRefToTestDesignPlan(run.id, run.testDesignPlan)
  }
  return {
    runId: run.id,
    version: 1,
    summary: 'Prepared test-design plan.',
    estimatedCaseCount: 8,
    functionalAreas: ['Inventory detail page'],
    positiveScenarios: ['Banner appears below threshold'],
    negativeScenarios: ['Banner hidden above threshold'],
  }
}

function buildReviewData(run: TestDesignRun): TestDesignReviewData {
  return {
    runId: run.id,
    reviewSummary: {
      currentVersion: run.versions[0]?.versionNumber ?? 1,
      totalCases: run.testCaseRecords.length,
      automationCandidateCount: run.testCaseRecords.length,
      nextActions: run.nextActions,
    },
    testCases: run.testCaseRecords.map((tc) => ({
      id: tc.id,
      draftId: tc.registryKey,
      version: tc.versionNumber,
      title: tc.title ?? tc.registryKey,
      objective: tc.objective ?? undefined,
    })),
    versions: run.versions.map((v) => ({
      version: v.versionNumber ?? v.version ?? 1,
      versionId: v.id,
      label: v.label ?? v.notes ?? undefined,
      createdAt: v.createdAt ?? run.updatedAt,
      caseCount: v.caseCount,
    })),
    reviewConversation: [],
    publicationResult:
      run.currentStage === 'automation_ready'
        ? {
            status: 'succeeded',
            publishedCount: run.testCaseRecords.length,
            readyForAutomationCount: run.automationReadyTestCases.length,
          }
        : null,
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
  return mockTestDesignStore.reviewData.get(run.id) ?? buildReviewData(run)
}

export function updateMockRun(id: string, patch: Partial<TestDesignRun>) {
  const existing = mockTestDesignStore.runs.get(id)
  if (!existing) return
  const currentStage = patch.currentStage ?? existing.currentStage
  const updated: TestDesignRun = {
    ...existing,
    ...patch,
    currentStage,
    currentStep: patch.currentStep ?? currentStage,
    updatedAt: new Date().toISOString(),
    productWorkspace: patch.productWorkspace ?? {
      mode: existing.productWorkspace.mode,
      stage: currentStage,
    },
  }
  mockTestDesignStore.runs.set(id, updated)
  const story = findMockStory(updated.storyKey)
  if (story) {
    story.hasActiveRun = currentStage !== 'automation_ready'
    story.activeRunId = story.hasActiveRun ? updated.id : null
  }
}
