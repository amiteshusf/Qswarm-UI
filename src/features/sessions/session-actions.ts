import {
  getSessionStage,
  isApprovedForPrWorkflow,
  type SessionContext,
  type SessionStage,
} from '@/features/sessions/session-lifecycle'

/** Canonical primary CTA for the current workflow stage (at most one). */
export type SessionPrimaryAction =
  | 'start_automation'
  | 'approve'
  | 'create_pr'
  | 'open_pr'

export type SessionMutationAction =
  | 'start'
  | 'revise'
  | 'approve'
  | 'create_pr'

export type SessionActionHints = {
  stage: SessionStage
  primaryAction: SessionPrimaryAction | null
  canStart: boolean
  canRevise: boolean
  canApprove: boolean
  canCreatePr: boolean
  canOpenPr: boolean
  /** No user actions — automation in flight or terminal wait state. */
  isWaiting: boolean
}

const PRIMARY_ACTION_LABELS: Record<SessionPrimaryAction, string> = {
  start_automation: 'Start automation',
  approve: 'Approve output',
  create_pr: 'Publish pull request',
  open_pr: 'Open pull request',
}

export function primaryActionLabel(action: SessionPrimaryAction): string {
  return PRIMARY_ACTION_LABELS[action]
}

/** Single source of truth for which backend mutation the primary CTA should trigger. */
export function resolvePrimarySessionAction(
  session: SessionContext,
): SessionPrimaryAction | null {
  const stage = getSessionStage(session)

  switch (stage) {
    case 'draft':
    case 'queued':
      return 'start_automation'
    case 'ready_for_review':
      return 'approve'
    case 'ready_to_publish':
      return 'create_pr'
    case 'published':
      return session.prExternalUrl ? 'open_pr' : null
    default:
      return null
  }
}

export function isSessionActionAllowed(
  session: SessionContext,
  action: SessionPrimaryAction | SessionMutationAction,
): boolean {
  const hints = sessionActionHints(session)
  switch (action) {
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
export function sessionActionHints(session: SessionContext): SessionActionHints {
  const stage = getSessionStage(session)
  const primaryAction = resolvePrimarySessionAction(session)

  const canStart = primaryAction === 'start_automation'
  const canApprove = primaryAction === 'approve'
  const canCreatePr = primaryAction === 'create_pr'
  const canOpenPr = primaryAction === 'open_pr'
  const canRevise = stage === 'ready_for_review'

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
    canStart,
    canRevise,
    canApprove,
    canCreatePr,
    canOpenPr,
    isWaiting,
  }
}

/** Map primary UI action to the mutation invoked on click. */
export function primaryActionToMutation(
  action: SessionPrimaryAction,
): SessionMutationAction {
  switch (action) {
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

export { getSessionStage, isApprovedForPrWorkflow }
export type { SessionContext, SessionStage }
