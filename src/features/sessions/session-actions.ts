import {
  getSessionStage,
  type SessionContext,
  type SessionStage,
} from '@/features/sessions/session-lifecycle'

export type SessionActionHints = {
  stage: SessionStage
  canStart: boolean
  canRevise: boolean
  canApprove: boolean
  canCreatePr: boolean
  canOpenPr: boolean
  /** No user actions — automation in flight or terminal wait state. */
  isWaiting: boolean
}

/** Stage-gated actions — only show controls relevant to the current lifecycle step. */
export function sessionActionHints(session: SessionContext): SessionActionHints {
  const stage = getSessionStage(session)
  const wf = session.workflowStatus?.toLowerCase() ?? ''

  const canStart = stage === 'draft' || stage === 'queued'
  const canRevise = stage === 'ready_for_review'
  const canApprove = stage === 'ready_for_review'
  const canCreatePr =
    stage === 'ready_to_publish' ||
    wf === 'pr_creation_failed' ||
    (session.status === 'succeeded' &&
      !session.prExternalUrl &&
      wf.includes('approved'))
  const canOpenPr = stage === 'published' && Boolean(session.prExternalUrl)
  const isWaiting =
    stage === 'running' ||
    stage === 'revising' ||
    stage === 'queued' ||
    stage === 'published' ||
    stage === 'failed' ||
    stage === 'cancelled'

  return {
    stage,
    canStart,
    canRevise,
    canApprove,
    canCreatePr,
    canOpenPr,
    isWaiting,
  }
}

export type { SessionContext, SessionStage }
