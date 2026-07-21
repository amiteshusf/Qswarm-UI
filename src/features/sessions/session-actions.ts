import type { SessionBrief, SessionDetail } from '@/api/schemas'
import { sessionStatusSchema } from '@/api/schemas'
import {
  getSessionStage,
  isApprovedForPrWorkflow,
  isPlanPhase,
  isOutputReviewPhase,
  type SessionContext,
  type SessionStage,
} from '@/features/sessions/session-lifecycle'

/** Canonical primary CTA for the current workflow stage (at most one). */
export type SessionPrimaryAction =
  | 'prepare_plan'
  | 'approve_plan'
  | 'start_automation'
  | 'approve'
  | 'create_pr'
  | 'open_pr'

export type SessionMutationAction =
  | 'prepare_plan'
  | 'approve_plan'
  | 'request_plan_revision'
  | 'start'
  | 'revise'
  | 'approve'
  | 'create_pr'

export type SessionActionHints = {
  stage: SessionStage
  primaryAction: SessionPrimaryAction | null
  canPreparePlan: boolean
  canApprovePlan: boolean
  canRequestPlanRevision: boolean
  canStart: boolean
  canRevise: boolean
  canApprove: boolean
  canCreatePr: boolean
  canOpenPr: boolean
  isPlanPhase: boolean
  isOutputReviewPhase: boolean
  /** No user actions — automation in flight or terminal wait state. */
  isWaiting: boolean
}

const PRIMARY_ACTION_LABELS: Record<SessionPrimaryAction, string> = {
  prepare_plan: 'Prepare plan',
  approve_plan: 'Approve plan',
  start_automation: 'Run automation',
  approve: 'Approve output',
  create_pr: 'Publish pull request',
  open_pr: 'Open pull request',
}

export function primaryActionLabel(action: SessionPrimaryAction): string {
  return PRIMARY_ACTION_LABELS[action]
}

function hasNextAction(actions: string[] | undefined, action: string): boolean {
  return actions?.includes(action) ?? false
}

/** Merge session detail with brief for canonical action gating. */
export function buildActionContext(
  session: SessionDetail,
  brief?: SessionBrief | null,
): SessionContext {
  const briefMatches = brief?.sessionId === session.id ? brief : null
  const briefStatus = briefMatches?.sessionState.status

  return {
    status: briefStatus
      ? sessionStatusSchema.parse(briefStatus)
      : session.status,
    workflowStatus:
      briefMatches?.sessionState.workflowStatus ?? session.workflowStatus,
    prExternalUrl: session.prExternalUrl,
    planApproved: briefMatches?.sessionState.planApproved,
    nextActions: briefMatches?.sessionState.nextActions,
  }
}

/** Single source of truth — prefers brief.nextActions, falls back to stage. */
export function resolvePrimarySessionAction(
  ctx: SessionContext,
): SessionPrimaryAction | null {
  if (ctx.prExternalUrl) return 'open_pr'

  const actions = ctx.nextActions ?? []
  const stage = getSessionStage(ctx)

  if (actions.length > 0) {
    if (hasNextAction(actions, 'create_pr') || stage === 'ready_to_publish') {
      return 'create_pr'
    }
    if (hasNextAction(actions, 'approve') && stage === 'ready_for_review') {
      return 'approve'
    }
    if (hasNextAction(actions, 'approve_plan')) return 'approve_plan'
    if (hasNextAction(actions, 'prepare_plan')) return 'prepare_plan'
    if (
      hasNextAction(actions, 'start_automation') &&
      !hasNextAction(actions, 'prepare_plan') &&
      !hasNextAction(actions, 'approve_plan')
    ) {
      return 'start_automation'
    }
    return null
  }

  switch (stage) {
    case 'draft':
    case 'queued':
      return 'prepare_plan'
    case 'plan_review':
      return 'approve_plan'
    case 'plan_approved':
      return 'start_automation'
    case 'ready_for_review':
      return 'approve'
    case 'ready_to_publish':
      return 'create_pr'
    case 'published':
      return ctx.prExternalUrl ? 'open_pr' : null
    default:
      return null
  }
}

export function isSessionActionAllowed(
  ctx: SessionContext,
  action: SessionPrimaryAction | SessionMutationAction,
): boolean {
  const hints = sessionActionHints(ctx)
  switch (action) {
    case 'prepare_plan':
      return hints.canPreparePlan
    case 'approve_plan':
      return hints.canApprovePlan
    case 'request_plan_revision':
      return hints.canRequestPlanRevision
    case 'start':
    case 'start_automation':
      return hints.canStart
    case 'revise':
      return hints.canRevise
    case 'approve':
      return hints.canApprove
    case 'create_pr':
      return hints.canCreatePr
    case 'open_pr':
      return hints.canOpenPr
    default:
      return false
  }
}

/** Stage-gated actions — only one primary control at a time. */
export function sessionActionHints(ctx: SessionContext): SessionActionHints {
  const stage = getSessionStage(ctx)
  const actions = ctx.nextActions ?? []
  const primaryAction = resolvePrimarySessionAction(ctx)

  const canPreparePlan =
    primaryAction === 'prepare_plan' ||
    (actions.length === 0 && stage === 'draft')
  const canApprovePlan = primaryAction === 'approve_plan'
  const canRequestPlanRevision =
    hasNextAction(actions, 'request_plan_revision') ||
    (actions.length === 0 && stage === 'plan_review')
  const canStart = primaryAction === 'start_automation'
  const canApprove = primaryAction === 'approve'
  const canCreatePr = primaryAction === 'create_pr'
  const canOpenPr = primaryAction === 'open_pr'
  const canRevise =
    hasNextAction(actions, 'request_changes') ||
    (actions.length === 0 && stage === 'ready_for_review')

  const isWaiting =
    stage === 'running' ||
    stage === 'revising' ||
    stage === 'queued' ||
    (stage === 'published' && !canOpenPr) ||
    stage === 'failed' ||
    stage === 'cancelled'

  return {
    stage,
    primaryAction,
    canPreparePlan,
    canApprovePlan,
    canRequestPlanRevision,
    canStart,
    canRevise,
    canApprove,
    canCreatePr,
    canOpenPr,
    isPlanPhase: isPlanPhase(ctx),
    isOutputReviewPhase: isOutputReviewPhase(ctx),
    isWaiting,
  }
}

/** Map primary UI action to the mutation invoked on click. */
export function primaryActionToMutation(
  action: SessionPrimaryAction,
): SessionMutationAction {
  switch (action) {
    case 'prepare_plan':
      return 'prepare_plan'
    case 'approve_plan':
      return 'approve_plan'
    case 'start_automation':
      return 'start'
    case 'approve':
      return 'approve'
    case 'create_pr':
      return 'create_pr'
    case 'open_pr':
      throw new Error('open_pr is a navigation action, not a mutation')
  }
}

export { getSessionStage, isApprovedForPrWorkflow, isPlanPhase, isOutputReviewPhase }
export type { SessionContext, SessionStage }
