import type { SessionStatus } from '@/api/schemas'

/** Business-facing lifecycle stage derived from UI status + workflow state. */
export type SessionStage =
  | 'draft'
  | 'queued'
  | 'plan_review'
  | 'plan_approved'
  | 'running'
  | 'revising'
  | 'ready_for_review'
  | 'ready_to_publish'
  | 'published'
  | 'failed'
  | 'cancelled'

export type SessionContext = {
  status: SessionStatus
  workflowStatus?: string
  prExternalUrl?: string | null
  planApproved?: boolean
  nextActions?: string[]
}

export function isApprovedForPrWorkflow(workflowStatus?: string): boolean {
  const wf = workflowStatus?.toLowerCase().trim() ?? ''
  return wf === 'approved_for_pr'
}

export function isPrCreationFailedWorkflow(workflowStatus?: string): boolean {
  const wf = workflowStatus?.toLowerCase().trim() ?? ''
  return wf === 'pr_creation_failed'
}

export function getSessionStage(session: SessionContext): SessionStage {
  if (session.prExternalUrl) return 'published'

  if (session.status === 'failed') return 'failed'
  if (session.status === 'cancelled') return 'cancelled'
  if (isApprovedForPrWorkflow(session.workflowStatus)) {
    return 'ready_to_publish'
  }
  if (isPrCreationFailedWorkflow(session.workflowStatus)) {
    return 'ready_to_publish'
  }

  switch (session.status) {
    case 'draft':
      return 'draft'
    case 'plan_ready':
      return session.planApproved ? 'plan_approved' : 'plan_review'
    case 'queued':
      return 'queued'
    case 'running':
      return 'running'
    case 'revising':
      return 'revising'
    case 'awaiting_review':
      return 'ready_for_review'
    case 'succeeded':
      return isApprovedForPrWorkflow(session.workflowStatus)
        ? 'ready_to_publish'
        : 'published'
    default:
      return 'draft'
  }
}

const STAGE_LABELS: Record<SessionStage, string> = {
  draft: 'Not started',
  queued: 'Queued',
  plan_review: 'Review plan',
  plan_approved: 'Plan approved',
  running: 'Automation in progress',
  revising: 'Applying your feedback',
  ready_for_review: 'Ready for review',
  ready_to_publish: 'Ready to publish',
  published: 'Published',
  failed: 'Needs attention',
  cancelled: 'Cancelled',
}

export function getFriendlyStatusLabel(session: SessionContext): string {
  return STAGE_LABELS[getSessionStage(session)]
}

const STAGE_SUMMARIES: Record<SessionStage, string> = {
  draft:
    'This automation run is set up. Prepare a plan to see what QSwarm will do before running.',
  queued: 'Your run is queued and will begin shortly.',
  plan_review:
    'QSwarm prepared an automation plan. Review it and approve, or request changes before running.',
  plan_approved:
    'The plan is approved. Run automation when you are ready for the agent to work.',
  running:
    'The agent is generating code and running validation. This can take several minutes — no action needed.',
  revising:
    'The agent is applying feedback from a previous review. You will be notified when it is ready.',
  ready_for_review:
    'Automation finished. Review what changed and either approve the output or request changes.',
  ready_to_publish:
    'Output is approved. Publish a pull request when you are ready to ship.',
  published:
    'A pull request has been created. Open it on GitHub to continue the review process.',
  failed:
    'Something went wrong during automation. Check validation details below or contact your platform team.',
  cancelled: 'This automation run was cancelled.',
}

export function getHeroSummary(session: SessionContext): string {
  return STAGE_SUMMARIES[getSessionStage(session)]
}

const NEXT_STEP_HEADINGS: Record<SessionStage, string> = {
  draft: 'Next step',
  queued: 'What happens next',
  plan_review: 'Review the plan',
  plan_approved: 'Ready to run',
  running: 'Sit tight',
  revising: 'Sit tight',
  ready_for_review: 'Your decision',
  ready_to_publish: 'Next step',
  published: 'All done',
  failed: 'What you can do',
  cancelled: 'Run ended',
}

export function getNextStepHeading(session: SessionContext): string {
  return NEXT_STEP_HEADINGS[getSessionStage(session)]
}

const NEXT_STEP_MESSAGES: Record<SessionStage, string> = {
  draft: 'Prepare a plan to see what QSwarm will automate before you run.',
  queued: 'The runner will pick up this job automatically.',
  plan_review:
    'Approve the plan if it looks right, or request plan changes with clear instructions.',
  plan_approved: 'Run automation to clone the repo, generate changes, and run validation.',
  running: 'Keep this tab open. The page updates when the agent completes this step.',
  revising: 'The agent is working on your feedback. Approval actions return when review is ready.',
  ready_for_review:
    'Approve the output if it looks good, or request changes with clear instructions.',
  ready_to_publish: 'Create a pull request to publish the approved changes to your repository.',
  published: 'Review and merge the pull request in your Git workflow.',
  failed: 'Review the validation result and supporting details. You may need to start a new run.',
  cancelled: 'This run will not continue. Create a new automation run if needed.',
}

export function getNextStepMessage(session: SessionContext): string {
  return NEXT_STEP_MESSAGES[getSessionStage(session)]
}

/** Human label for automation round number (1 → Initial run, 2 → Revision 1). */
export function friendlyRoundLabel(roundNumber: number): string {
  if (roundNumber <= 1) return 'Initial run'
  return `Revision ${roundNumber - 1}`
}

export function friendlyRoundTitle(roundNumber: number, title?: string): string {
  const base = friendlyRoundLabel(roundNumber)
  return title?.trim() ? `${base} · ${title}` : base
}

export function friendlyPatchLabel(version: number): string {
  return `Code revision ${version}`
}

export function friendlyValidationLabel(roundNumber: number): string {
  return `${friendlyRoundLabel(roundNumber)} validation`
}

export const FRIENDLY_WORKFLOW_STEPS = [
  { id: 'setup', label: 'Set up' },
  { id: 'plan', label: 'Review plan' },
  { id: 'run', label: 'Run' },
  { id: 'review', label: 'Review output' },
  { id: 'approve', label: 'Approve' },
  { id: 'publish', label: 'Publish' },
] as const

export function friendlyWorkflowStepIndex(
  status: SessionStatus,
  workflowStatus?: string,
  prExternalUrl?: string | null,
  planApproved?: boolean,
): number {
  const stage = getSessionStage({ status, workflowStatus, prExternalUrl, planApproved })
  switch (stage) {
    case 'draft':
    case 'queued':
      return 0
    case 'plan_review':
    case 'plan_approved':
      return 1
    case 'running':
    case 'revising':
      return 2
    case 'ready_for_review':
    case 'failed':
      return 3
    case 'ready_to_publish':
      return 4
    case 'published':
      return 5
    case 'cancelled':
      return 3
    default:
      return 0
  }
}

export function isPlanPhase(session: SessionContext): boolean {
  const stage = getSessionStage(session)
  return (
    stage === 'draft' ||
    stage === 'queued' ||
    stage === 'plan_review' ||
    stage === 'plan_approved'
  )
}

export function isOutputReviewPhase(session: SessionContext): boolean {
  const stage = getSessionStage(session)
  return (
    stage === 'running' ||
    stage === 'revising' ||
    stage === 'ready_for_review' ||
    stage === 'ready_to_publish' ||
    stage === 'published' ||
    stage === 'failed'
  )
}
