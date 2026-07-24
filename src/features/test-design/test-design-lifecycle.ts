import type { TestDesignCurrentStage } from '@/api/schemas'

export type TestDesignStage =
  | 'intake'
  | 'analyzing'
  | 'analysis_review'
  | 'plan_preparing'
  | 'plan_review'
  | 'plan_approved'
  | 'generating'
  | 'case_review'
  | 'revising'
  | 'approval'
  | 'publishing'
  | 'automation_ready'
  | 'completed'
  | 'legacy_approval'
  | 'failed'

export type TestDesignContext = {
  status: string
  currentStep: string
  currentStage: TestDesignCurrentStage
  nextActions: string[]
  blockedReason?: string | null
  productWorkspace?: { mode: string; stage: string }
}

const STAGE_FROM_CURRENT: Record<TestDesignCurrentStage, TestDesignStage> = {
  intake_ready: 'intake',
  analyzing_requirements: 'analyzing',
  analysis_ready: 'analysis_review',
  preparing_test_design_plan: 'plan_preparing',
  awaiting_plan_approval: 'plan_review',
  plan_revision_requested: 'plan_review',
  plan_approved: 'plan_approved',
  generating_test_cases: 'generating',
  awaiting_test_case_review: 'case_review',
  revising_test_cases: 'revising',
  approved: 'approval',
  publishing: 'publishing',
  automation_ready: 'automation_ready',
  completed: 'completed',
  legacy_awaiting_approval: 'legacy_approval',
}

export function getTestDesignStage(ctx: TestDesignContext): TestDesignStage {
  if (ctx.blockedReason) return 'failed'
  return STAGE_FROM_CURRENT[ctx.currentStage] ?? 'intake'
}

const STAGE_LABELS: Record<TestDesignStage, string> = {
  intake: 'Intake',
  analyzing: 'Analyzing requirements',
  analysis_review: 'Requirement analysis',
  plan_preparing: 'Preparing plan',
  plan_review: 'Review test-design plan',
  plan_approved: 'Plan approved',
  generating: 'Generating test cases',
  case_review: 'Review test cases',
  revising: 'Applying feedback',
  approval: 'Ready for approval',
  publishing: 'Publishing',
  automation_ready: 'Ready for automation',
  completed: 'Completed',
  legacy_approval: 'Legacy approval',
  failed: 'Blocked',
}

export function getTestDesignStatusLabel(ctx: TestDesignContext): string {
  return STAGE_LABELS[getTestDesignStage(ctx)]
}

const STAGE_SUMMARIES: Record<TestDesignStage, string> = {
  intake:
    'Start by analyzing the Jira story. QSwarm will extract acceptance criteria, gaps, and scope.',
  analyzing:
    'QSwarm is analyzing the story requirements. This usually takes a minute.',
  analysis_review:
    'Review the requirement analysis. Request changes or continue to the test-design plan.',
  plan_preparing: 'QSwarm is preparing your test-design plan.',
  plan_review:
    'Review the proposed test-design plan before generating test cases.',
  plan_approved:
    'The plan is approved. Generate test cases when you are ready.',
  generating:
    'QSwarm is generating test cases from the approved plan.',
  case_review:
    'Review generated test cases. Request changes conversationally or approve the design.',
  revising: 'QSwarm is applying your feedback to the test cases.',
  approval:
    'Review the summary and approve the test design before publishing.',
  publishing: 'Publishing test cases to your connected test management system.',
  automation_ready:
    'Test cases are published. Open the Automation Backlog to start automating.',
  completed: 'This test-design run is complete.',
  legacy_approval: 'Review and approve the legacy test design output.',
  failed:
    'This run is blocked. Review the blocked reason or contact your platform team.',
}

export function getTestDesignHeroSummary(ctx: TestDesignContext): string {
  if (ctx.blockedReason) {
    return ctx.blockedReason
  }
  return STAGE_SUMMARIES[getTestDesignStage(ctx)]
}

export const TEST_DESIGN_WORKFLOW_STEPS = [
  { id: 'analyze', label: 'Analyze' },
  { id: 'plan', label: 'Review plan' },
  { id: 'generate', label: 'Generate cases' },
  { id: 'review', label: 'Review cases' },
  { id: 'approve', label: 'Approve' },
  { id: 'publish', label: 'Publish' },
] as const

export function testDesignWorkflowStepIndex(ctx: TestDesignContext): number {
  const stage = getTestDesignStage(ctx)
  switch (stage) {
    case 'intake':
    case 'analyzing':
      return 0
    case 'analysis_review':
    case 'plan_preparing':
    case 'plan_review':
      return 1
    case 'plan_approved':
    case 'generating':
      return 2
    case 'case_review':
    case 'revising':
    case 'legacy_approval':
      return 3
    case 'approval':
      return 4
    case 'publishing':
    case 'automation_ready':
    case 'completed':
      return 5
    case 'failed':
      return 0
    default:
      return 0
  }
}

export function isAnalysisPhase(ctx: TestDesignContext): boolean {
  const stage = getTestDesignStage(ctx)
  return (
    stage === 'intake' ||
    stage === 'analyzing' ||
    stage === 'analysis_review'
  )
}

export function isPlanPhase(ctx: TestDesignContext): boolean {
  const stage = getTestDesignStage(ctx)
  return (
    stage === 'plan_preparing' ||
    stage === 'plan_review' ||
    stage === 'plan_approved'
  )
}

export function isCaseReviewPhase(ctx: TestDesignContext): boolean {
  const stage = getTestDesignStage(ctx)
  return (
    stage === 'case_review' ||
    stage === 'revising' ||
    stage === 'legacy_approval'
  )
}

export function isApprovalPhase(ctx: TestDesignContext): boolean {
  return getTestDesignStage(ctx) === 'approval'
}

export function isPublicationPhase(ctx: TestDesignContext): boolean {
  const stage = getTestDesignStage(ctx)
  return (
    stage === 'publishing' ||
    stage === 'automation_ready' ||
    stage === 'completed'
  )
}

export function isIntakeReady(ctx: TestDesignContext): boolean {
  return ctx.currentStage === 'intake_ready'
}
