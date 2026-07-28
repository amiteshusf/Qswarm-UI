import {
  SPRINT1_ACTIONS,
  SPRINT1_STAGES,
  SPRINT2_MUTATION_ACTIONS,
  SPRINT2_NEXT_ACTIONS,
  SPRINT2_SESSION_STAGES,
} from '@/api/generated/backend-workflow'

/** Frontend-mapped Sprint 1 stages (lifecycle + UI). */
export const FRONTEND_SPRINT1_STAGES = new Set<string>([
  ...SPRINT1_STAGES,
])

/** Frontend-mapped Sprint 1 action tokens referenced in UI. */
export const FRONTEND_SPRINT1_ACTIONS = new Set<string>([
  ...SPRINT1_ACTIONS,
])

export const FRONTEND_SPRINT2_STAGES = new Set<string>([
  ...SPRINT2_SESSION_STAGES,
])

export const FRONTEND_SPRINT2_NEXT_ACTIONS = new Set<string>([
  ...SPRINT2_NEXT_ACTIONS,
])

export const FRONTEND_SPRINT2_MUTATION_ACTIONS = new Set<string>([
  ...SPRINT2_MUTATION_ACTIONS,
  'open_pr',
  'view_summary',
])

export function assertWorkflowStageMapped(stage: string, sprint: 'sprint1' | 'sprint2') {
  const set =
    sprint === 'sprint1' ? FRONTEND_SPRINT1_STAGES : FRONTEND_SPRINT2_STAGES
  if (!set.has(stage)) {
    throw new Error(`Unmapped ${sprint} stage: ${stage}`)
  }
}

export function assertWorkflowActionMapped(
  action: string,
  sprint: 'sprint1' | 'sprint2',
) {
  const set =
    sprint === 'sprint1'
      ? FRONTEND_SPRINT1_ACTIONS
      : new Set([
          ...FRONTEND_SPRINT2_NEXT_ACTIONS,
          ...FRONTEND_SPRINT2_MUTATION_ACTIONS,
        ])
  if (!set.has(action)) {
    throw new Error(`Unmapped ${sprint} action: ${action}`)
  }
}
