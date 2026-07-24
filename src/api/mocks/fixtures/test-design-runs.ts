import type { TestDesignRun } from '@/api/schemas'

const BASE_TS = '2026-07-24T12:22:13.387184+00:00'

function baseRun(
  patch: Partial<TestDesignRun> & Pick<TestDesignRun, 'id' | 'currentStage' | 'nextActions'>,
): TestDesignRun {
  const stage = patch.currentStage
  return {
    id: patch.id,
    storyKey: patch.storyKey ?? 'NSP-696',
    workflowName: 'sprint1_qswarm_workspace',
    status: patch.status ?? 'pending',
    currentStep: patch.currentStep ?? stage,
    currentStage: stage,
    nextActions: patch.nextActions,
    blockedReason: patch.blockedReason ?? null,
    initiatedBy: 'qswarm-web',
    createdAt: patch.createdAt ?? BASE_TS,
    updatedAt: patch.updatedAt ?? BASE_TS,
    sourceStory: patch.sourceStory ?? {
      storyKey: patch.storyKey ?? 'NSP-696',
      intakeArtifactId: '7995e03e-0881-4027-9650-ddabe2540da0',
    },
    requirementAnalysis: patch.requirementAnalysis ?? null,
    testDesignPlan: patch.testDesignPlan ?? null,
    reviewIssue: patch.reviewIssue ?? null,
    versions: patch.versions ?? [],
    testCaseRecords: patch.testCaseRecords ?? [],
    automationReadyTestCases: patch.automationReadyTestCases ?? [],
    approvalId: patch.approvalId ?? null,
    productWorkspace: patch.productWorkspace ?? {
      mode: 'qswarm_first',
      stage,
    },
  }
}

export const testDesignRunIntakeReadyFixture = baseRun({
  id: '38d476a7-8294-4acd-909b-36de472f18d0',
  currentStage: 'intake_ready',
  nextActions: ['analyze_requirements'],
})

export const testDesignRunAnalysisReadyFixture = baseRun({
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  currentStage: 'analysis_ready',
  status: 'active',
  nextActions: ['prepare_plan'],
  requirementAnalysis: {
    summary: 'Requirement analysis complete for NSP-696.',
    readinessStatus: 'needs_clarification',
    storyKey: 'NSP-696',
    acceptanceCriteriaCount: 3,
    gapsCount: 1,
  },
})

export const testDesignRunAwaitingPlanApprovalFixture = baseRun({
  id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  currentStage: 'awaiting_plan_approval',
  status: 'active',
  nextActions: ['request_plan_changes', 'approve_plan'],
  requirementAnalysis: {
    summary: 'Requirement analysis complete.',
    readinessStatus: 'ready',
    storyKey: 'NSP-696',
    acceptanceCriteriaCount: 3,
    gapsCount: 0,
  },
  testDesignPlan: {
    version: 1,
    versionId: 'plan_v1',
    summary: 'Eight functional cases covering banner visibility and content.',
    estimatedCaseCount: 8,
  },
})

export const testDesignRunPlanApprovedFixture = baseRun({
  id: 'c3d4e5f6-a7b8-4123-8def-123456789012',
  currentStage: 'plan_approved',
  status: 'active',
  nextActions: ['generate_test_cases'],
  requirementAnalysis: {
    summary: 'Requirement analysis complete.',
    readinessStatus: 'ready',
    storyKey: 'NSP-696',
  },
  testDesignPlan: {
    version: 1,
    summary: 'Approved plan for NSP-696.',
    estimatedCaseCount: 8,
  },
})

export const testDesignRunAwaitingTestCaseReviewFixture = baseRun({
  id: 'd4e5f6a7-b8c9-4123-9def-234567890123',
  currentStage: 'awaiting_test_case_review',
  status: 'active',
  nextActions: ['request_test_case_changes', 'approve_test_design'],
  requirementAnalysis: { summary: 'Analysis', storyKey: 'NSP-696' },
  testDesignPlan: { version: 1, summary: 'Plan', estimatedCaseCount: 3 },
  versions: [
    { version: 1, label: 'Initial generation', createdAt: BASE_TS, caseCount: 3 },
  ],
  testCaseRecords: [
    {
      id: 'tc-1',
      draftId: 'TC-D-001',
      title: 'Low-stock banner appears below threshold',
      priority: 'high',
      automationCandidate: true,
      version: 1,
    },
  ],
})

export const testDesignRunApprovedFixture = baseRun({
  id: 'e5f6a7b8-c9d0-4123-aef0-345678901234',
  currentStage: 'approved',
  status: 'active',
  nextActions: ['publish_test_cases'],
  requirementAnalysis: { summary: 'Analysis', storyKey: 'NSP-696' },
  testDesignPlan: { version: 1, summary: 'Plan', estimatedCaseCount: 3 },
  versions: [{ version: 1, caseCount: 3 }],
  testCaseRecords: [
    {
      id: 'tc-1',
      draftId: 'TC-D-001',
      title: 'Low-stock banner appears below threshold',
      version: 1,
    },
  ],
  approvalId: 'approval-1',
})

export const testDesignRunAutomationReadyFixture = baseRun({
  id: 'f6a7b8c9-d0e1-4123-bf01-456789012345',
  currentStage: 'automation_ready',
  status: 'completed',
  nextActions: ['open_automation_backlog'],
  requirementAnalysis: { summary: 'Analysis', storyKey: 'NSP-696' },
  testDesignPlan: { version: 1, summary: 'Plan', estimatedCaseCount: 3 },
  versions: [{ version: 1, caseCount: 3 }],
  testCaseRecords: [
    {
      id: 'tc-1',
      draftId: 'TC-D-001',
      title: 'Published case',
      version: 1,
    },
  ],
  automationReadyTestCases: [
    {
      id: 'tc-1',
      draftId: 'TC-D-001',
      title: 'Published case',
      automationCandidate: true,
      version: 1,
    },
  ],
  approvalId: 'approval-1',
})

export const testDesignRunLegacyFixture = baseRun({
  id: 'a7b8c9d0-e1f2-4123-8f01-567890123456',
  currentStage: 'legacy_awaiting_approval',
  status: 'active',
  nextActions: ['approve_test_design'],
  requirementAnalysis: { summary: 'Legacy analysis', storyKey: 'LEG-1' },
  testDesignPlan: { version: 1, summary: 'Legacy plan' },
  testCaseRecords: [
    { id: 'legacy-1', title: 'Legacy test case', version: 1 },
  ],
})

export const ALL_TEST_DESIGN_RUN_FIXTURES = [
  testDesignRunIntakeReadyFixture,
  testDesignRunAnalysisReadyFixture,
  testDesignRunAwaitingPlanApprovalFixture,
  testDesignRunPlanApprovedFixture,
  testDesignRunAwaitingTestCaseReviewFixture,
  testDesignRunApprovedFixture,
  testDesignRunAutomationReadyFixture,
  testDesignRunLegacyFixture,
] as const
