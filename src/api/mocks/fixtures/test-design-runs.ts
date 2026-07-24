import type { TestDesignRun } from '@/api/schemas'

const BASE_TS = '2026-07-24T12:22:13.387184+00:00'

function artifactRef(
  version: number,
  artifactId: string,
  content: Record<string, unknown>,
) {
  return { version, artifactId, content }
}

function baseRun(
  patch: Partial<TestDesignRun> & Pick<TestDesignRun, 'id' | 'currentStage' | 'nextActions'>,
): TestDesignRun {
  const stage = patch.currentStage
  const storyKey = patch.storyKey ?? 'NSP-696'
  return {
    id: patch.id,
    storyKey,
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
      storyKey,
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

function analysisRef(storyKey: string, extra?: Record<string, unknown>) {
  return artifactRef(1, `analysis-${storyKey}`, {
    storyKey,
    summary: `Requirement analysis complete for ${storyKey}.`,
    readinessStatus: 'needs_clarification',
    acceptanceCriteriaCount: 3,
    gapsCount: 1,
    gaps: [{ id: 'gap-1', description: 'Missing edge-case AC', severity: 'medium' }],
    ...extra,
  })
}

function planRef(storyKey: string, extra?: Record<string, unknown>) {
  return artifactRef(1, `plan-${storyKey}`, {
    summary: 'Prepared test-design plan.',
    estimatedCaseCount: 8,
    functionalAreas: ['Banner visibility', 'Threshold rules'],
    ...extra,
  })
}

function caseRecord(
  runId: string,
  patch: {
    id: string
    registryKey: string
    title: string
    storyKey?: string
  },
) {
  return {
    id: patch.id,
    registryKey: patch.registryKey,
    workflowRunId: runId,
    sourceStoryKey: patch.storyKey ?? 'NSP-696',
    title: patch.title,
    automationStatus: 'draft',
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
  requirementAnalysis: analysisRef('NSP-696'),
})

export const testDesignRunAwaitingPlanApprovalFixture = baseRun({
  id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  currentStage: 'awaiting_plan_approval',
  status: 'active',
  nextActions: ['request_plan_changes', 'approve_plan'],
  requirementAnalysis: analysisRef('NSP-696', {
    readinessStatus: 'ready',
    gapsCount: 0,
    gaps: [],
  }),
  testDesignPlan: planRef('NSP-696'),
})

export const testDesignRunPlanApprovedFixture = baseRun({
  id: 'c3d4e5f6-a7b8-4123-8def-123456789012',
  currentStage: 'plan_approved',
  status: 'active',
  nextActions: ['generate_test_cases'],
  requirementAnalysis: analysisRef('NSP-696', { readinessStatus: 'ready' }),
  testDesignPlan: planRef('NSP-696', { summary: 'Approved plan for NSP-696.' }),
})

export const testDesignRunAwaitingTestCaseReviewFixture = baseRun({
  id: 'd4e5f6a7-b8c9-4123-9def-234567890123',
  currentStage: 'awaiting_test_case_review',
  status: 'active',
  nextActions: ['request_test_case_changes', 'approve_test_design'],
  requirementAnalysis: analysisRef('NSP-696'),
  testDesignPlan: planRef('NSP-696', { estimatedCaseCount: 3 }),
  versions: [
    {
      id: 'ver-1',
      versionNumber: 1,
      label: 'Initial generation',
      createdAt: BASE_TS,
      caseCount: 3,
    },
  ],
  testCaseRecords: [
    caseRecord('d4e5f6a7-b8c9-4123-9def-234567890123', {
      id: 'tc-1',
      registryKey: 'TC-D-001',
      title: 'Low-stock banner appears below threshold',
    }),
  ],
})

export const testDesignRunApprovedFixture = baseRun({
  id: 'e5f6a7b8-c9d0-4123-aef0-345678901234',
  currentStage: 'approved',
  status: 'active',
  nextActions: ['publish_test_cases'],
  requirementAnalysis: analysisRef('NSP-696'),
  testDesignPlan: planRef('NSP-696', { estimatedCaseCount: 3 }),
  versions: [{ id: 'ver-1', versionNumber: 1, caseCount: 3 }],
  testCaseRecords: [
    caseRecord('e5f6a7b8-c9d0-4123-aef0-345678901234', {
      id: 'tc-1',
      registryKey: 'TC-D-001',
      title: 'Low-stock banner appears below threshold',
    }),
  ],
  approvalId: 'approval-1',
})

export const testDesignRunAutomationReadyFixture = baseRun({
  id: 'f6a7b8c9-d0e1-4123-bf01-456789012345',
  currentStage: 'automation_ready',
  status: 'completed',
  nextActions: ['open_automation_backlog'],
  requirementAnalysis: analysisRef('NSP-696'),
  testDesignPlan: planRef('NSP-696', { estimatedCaseCount: 3 }),
  versions: [{ id: 'ver-1', versionNumber: 1, caseCount: 3 }],
  testCaseRecords: [
    caseRecord('f6a7b8c9-d0e1-4123-bf01-456789012345', {
      id: 'tc-1',
      registryKey: 'TC-D-001',
      title: 'Published case',
    }),
  ],
  automationReadyTestCases: [
    caseRecord('f6a7b8c9-d0e1-4123-bf01-456789012345', {
      id: 'tc-1',
      registryKey: 'TC-D-001',
      title: 'Published case',
    }),
  ],
  approvalId: 'approval-1',
})

export const testDesignRunLegacyFixture = baseRun({
  id: 'a7b8c9d0-e1f2-4123-8f01-567890123456',
  currentStage: 'legacy_awaiting_approval',
  status: 'active',
  nextActions: ['approve_test_design'],
  requirementAnalysis: analysisRef('LEG-1', { summary: 'Legacy analysis' }),
  testDesignPlan: planRef('LEG-1', { summary: 'Legacy plan' }),
  testCaseRecords: [
    caseRecord('a7b8c9d0-e1f2-4123-8f01-567890123456', {
      id: 'legacy-1',
      registryKey: 'LEG-TC-1',
      title: 'Legacy test case',
      storyKey: 'LEG-1',
    }),
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
