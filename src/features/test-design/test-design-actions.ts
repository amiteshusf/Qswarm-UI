import type { TestDesignRun } from '@/api/schemas'
import {
  getTestDesignStage,
  isAnalysisPhase,
  isApprovalPhase,
  isCaseReviewPhase,
  isPlanPhase,
  isPublicationPhase,
  type TestDesignContext,
  type TestDesignStage,
} from '@/features/test-design/test-design-lifecycle'

/** Wire-format next action tokens from the backend. */
export type TestDesignPrimaryAction =
  | 'analyze_requirements'
  | 'prepare_plan'
  | 'approve_plan'
  | 'generate_test_cases'
  | 'approve_test_design'
  | 'publish_test_cases'
  | 'open_automation_backlog'

export type TestDesignMutationAction =
  | TestDesignPrimaryAction
  | 'request_analysis_revision'
  | 'request_plan_changes'
  | 'request_test_case_changes'

export type TestDesignActionHints = {
  stage: TestDesignStage
  primaryAction: TestDesignPrimaryAction | null
  canAnalyze: boolean
  canRequestAnalysisRevision: boolean
  canPreparePlan: boolean
  canApprovePlan: boolean
  canRequestPlanChanges: boolean
  canGenerateCases: boolean
  canRequestCaseChanges: boolean
  canApproveDesign: boolean
  canPublish: boolean
  canOpenBacklog: boolean
  isAnalysisPhase: boolean
  isPlanPhase: boolean
  isCaseReviewPhase: boolean
  isApprovalPhase: boolean
  isPublicationPhase: boolean
  isWaiting: boolean
}

const PRIMARY_LABELS: Record<TestDesignPrimaryAction, string> = {
  analyze_requirements: 'Analyze requirements',
  prepare_plan: 'Prepare test-design plan',
  approve_plan: 'Approve plan',
  generate_test_cases: 'Generate test cases',
  approve_test_design: 'Approve test design',
  publish_test_cases: 'Publish test cases',
  open_automation_backlog: 'Open Automation Backlog',
}

export function testDesignPrimaryActionLabel(
  action: TestDesignPrimaryAction,
): string {
  return PRIMARY_LABELS[action]
}

function hasAction(actions: string[] | undefined, action: string): boolean {
  return actions?.includes(action) ?? false
}

export function buildTestDesignContext(run: TestDesignRun): TestDesignContext {
  return {
    status: run.status,
    currentStep: run.currentStep,
    currentStage: run.currentStage,
    nextActions: run.nextActions,
    blockedReason: run.blockedReason,
    productWorkspace: run.productWorkspace,
  }
}

const PRIMARY_ACTION_ORDER: TestDesignPrimaryAction[] = [
  'open_automation_backlog',
  'publish_test_cases',
  'approve_test_design',
  'generate_test_cases',
  'approve_plan',
  'prepare_plan',
  'analyze_requirements',
]

export function resolvePrimaryTestDesignAction(
  ctx: TestDesignContext,
): TestDesignPrimaryAction | null {
  const actions = ctx.nextActions ?? []
  if (actions.length > 0) {
    for (const candidate of PRIMARY_ACTION_ORDER) {
      if (hasAction(actions, candidate)) return candidate
    }
    return null
  }

  const stage = getTestDesignStage(ctx)
  switch (stage) {
    case 'intake':
      return 'analyze_requirements'
    case 'analysis_review':
      return 'prepare_plan'
    case 'plan_review':
      return 'approve_plan'
    case 'plan_approved':
      return 'generate_test_cases'
    case 'case_review':
    case 'legacy_approval':
      return 'approve_test_design'
    case 'approval':
      return 'publish_test_cases'
    case 'automation_ready':
    case 'completed':
      return 'open_automation_backlog'
    default:
      return null
  }
}

export function testDesignActionHints(
  ctx: TestDesignContext,
): TestDesignActionHints {
  const stage = getTestDesignStage(ctx)
  const actions = ctx.nextActions ?? []
  const primaryAction = resolvePrimaryTestDesignAction(ctx)

  const canAnalyze = primaryAction === 'analyze_requirements'
  const canRequestAnalysisRevision = hasAction(
    actions,
    'request_analysis_revision',
  )
  const canPreparePlan = primaryAction === 'prepare_plan'
  const canApprovePlan = primaryAction === 'approve_plan'
  const canRequestPlanChanges = hasAction(actions, 'request_plan_changes')
  const canGenerateCases = primaryAction === 'generate_test_cases'
  const canRequestCaseChanges = hasAction(actions, 'request_test_case_changes')
  const canApproveDesign = primaryAction === 'approve_test_design'
  const canPublish = primaryAction === 'publish_test_cases'
  const canOpenBacklog = primaryAction === 'open_automation_backlog'

  const isWaiting =
    stage === 'analyzing' ||
    stage === 'plan_preparing' ||
    stage === 'generating' ||
    stage === 'revising' ||
    stage === 'publishing' ||
    stage === 'failed'

  return {
    stage,
    primaryAction,
    canAnalyze,
    canRequestAnalysisRevision,
    canPreparePlan,
    canApprovePlan,
    canRequestPlanChanges,
    canGenerateCases,
    canRequestCaseChanges,
    canApproveDesign,
    canPublish,
    canOpenBacklog,
    isAnalysisPhase: isAnalysisPhase(ctx),
    isPlanPhase: isPlanPhase(ctx),
    isCaseReviewPhase: isCaseReviewPhase(ctx),
    isApprovalPhase: isApprovalPhase(ctx),
    isPublicationPhase: isPublicationPhase(ctx),
    isWaiting,
  }
}

export function isTestDesignActionAllowed(
  ctx: TestDesignContext,
  action: TestDesignMutationAction,
): boolean {
  const hints = testDesignActionHints(ctx)
  switch (action) {
    case 'analyze_requirements':
      return hints.canAnalyze
    case 'request_analysis_revision':
      return hints.canRequestAnalysisRevision
    case 'prepare_plan':
      return hints.canPreparePlan
    case 'approve_plan':
      return hints.canApprovePlan
    case 'request_plan_changes':
      return hints.canRequestPlanChanges
    case 'generate_test_cases':
      return hints.canGenerateCases
    case 'request_test_case_changes':
      return hints.canRequestCaseChanges
    case 'approve_test_design':
      return hints.canApproveDesign
    case 'publish_test_cases':
      return hints.canPublish
    case 'open_automation_backlog':
      return hints.canOpenBacklog
    default:
      return false
  }
}

export {
  getTestDesignStage,
  isAnalysisPhase,
  isPlanPhase,
  isCaseReviewPhase,
  isApprovalPhase,
  isPublicationPhase,
}
export type { TestDesignContext, TestDesignStage }
