import type { SessionStatus } from '@/api/schemas'

/** Canonical QSwarm session workflow steps for UI progression strip. */
export const WORKFLOW_STEPS = [
  { id: 'create', label: 'Create', statuses: ['draft'] as SessionStatus[] },
  { id: 'start', label: 'Start', statuses: ['queued', 'running'] as SessionStatus[] },
  {
    id: 'review',
    label: 'Review',
    statuses: ['awaiting_review', 'revising'] as SessionStatus[],
  },
  { id: 'approve', label: 'Approve', statuses: [] as SessionStatus[] },
  { id: 'pr', label: 'Create PR', statuses: ['succeeded'] as SessionStatus[] },
] as const

export function workflowStepIndex(
  status: SessionStatus,
  workflowStatus?: string,
): number {
  const wf = workflowStatus?.toLowerCase() ?? ''
  if (wf.includes('pr') || status === 'succeeded') return 4
  if (wf.includes('approved')) return 3
  if (status === 'awaiting_review' || status === 'revising') return 2
  if (status === 'running' || status === 'queued') return 1
  if (status === 'draft') return 0
  if (status === 'failed' || status === 'cancelled') return 2
  return 0
}

export function needsAttention(status: SessionStatus): boolean {
  return (
    status === 'awaiting_review' ||
    status === 'failed' ||
    status === 'revising'
  )
}

export function isActivePipeline(status: SessionStatus): boolean {
  return status === 'running' || status === 'queued' || status === 'revising'
}
