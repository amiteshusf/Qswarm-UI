import type { TestDesignRunStatus } from '@/api/schemas'

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
  | 'published'
  | 'failed'

export type TestDesignContext = {
  status: TestDesignRunStatus
  workflowStatus?: string
  planApproved?: boolean
  analysisReady?: boolean
  casesGenerated?: boolean
  nextActions?: string[]
}

export function getTestDesignStage(ctx: TestDesignContext): TestDesignStage {
  if (ctx.status === 'failed') return 'failed'
  if (ctx.status === 'published') return 'published'
  if (ctx.status === 'publishing') return 'publishing'
  if (ctx.status === 'approved') return 'approval'
  if (ctx.status === 'revising') return 'revising'
  if (ctx.status === 'cases_ready') return 'case_review'
  if (ctx.status === 'generating') return 'generating'
  if (ctx.status === 'plan_approved') return 'plan_approved'
  if (ctx.status === 'plan_ready') return 'plan_review'
  if (ctx.status === 'plan_preparing') return 'plan_preparing'
  if (ctx.status === 'analysis_ready') return 'analysis_review'
  if (ctx.status === 'analyzing') return 'analyzing'
  return 'intake'
}

const STAGE_LABELS: Record<TestDesignStage, string> = {
  intake: 'Not started',
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
  published: 'Published',
  failed: 'Needs attention',
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
  published:
    'Test cases are published. Open the Automation Backlog to start automating.',
  failed:
    'Something went wrong. Review details below or start a new test-design run.',
}

export function getTestDesignHeroSummary(ctx: TestDesignContext): string {
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
      return 3
    case 'approval':
      return 4
    case 'publishing':
    case 'published':
      return 5
    case 'failed':
      return 3
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
  return stage === 'case_review' || stage === 'revising'
}

export function isApprovalPhase(ctx: TestDesignContext): boolean {
  return getTestDesignStage(ctx) === 'approval'
}

export function isPublicationPhase(ctx: TestDesignContext): boolean {
  const stage = getTestDesignStage(ctx)
  return stage === 'publishing' || stage === 'published'
}
