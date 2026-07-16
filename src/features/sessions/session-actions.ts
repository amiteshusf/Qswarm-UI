import type { SessionStatus } from '@/api/schemas'

/** Which session actions are available from coerced UI status + raw workflow state. */
export function sessionActionHints(session: {
  status: SessionStatus
  workflowStatus?: string
}) {
  const wf = session.workflowStatus?.toLowerCase() ?? ''
  const canStart = session.status === 'draft' || session.status === 'queued'
  const canRevise =
    session.status === 'awaiting_review' ||
    session.status === 'revising' ||
    session.status === 'running'
  const canApprove = session.status === 'awaiting_review'
  const canCreatePr =
    session.status === 'awaiting_review' ||
    session.status === 'succeeded' ||
    wf === 'approved_for_pr' ||
    wf === 'pr_creation_failed'
  return { canStart, canRevise, canApprove, canCreatePr }
}
