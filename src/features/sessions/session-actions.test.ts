import { describe, expect, it } from 'vitest'

import { mergeSessionWithReviewData } from '@/features/sessions/review/review-data'
import {
  buildActionContext,
  isSessionActionAllowed,
  resolvePrimarySessionAction,
  sessionActionHints,
} from '@/features/sessions/session-actions'
import { getSessionStage } from '@/features/sessions/session-lifecycle'
import type { SessionDetail } from '@/api/schemas'

const baseSession = {
  id: 'session-a',
  status: 'draft',
  workflowStatus: 'pending',
  engine: 'stub',
  sourceRef: 'CASE-1',
  repoConnectionId: 'repo-1',
  branchPolicyId: '',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  patches: [],
  reviews: [],
  rounds: [],
  executions: [],
} as SessionDetail

const draftBrief = {
  sessionId: 'session-a',
  sessionState: {
    status: 'draft',
    workflowStatus: 'pending',
    planApproved: false,
    nextActions: ['prepare_plan', 'start_automation'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  sourceSummary: { sourceReference: 'CASE-1' },
  setup: { engine: 'stub', repositoryConnectionId: 'repo-1' },
  automationBrief: { available: false, summary: 'Prepare a plan first.' },
}

const planReadyBrief = {
  ...draftBrief,
  sessionState: {
    status: 'plan_ready',
    workflowStatus: 'plan_ready',
    planApproved: false,
    nextActions: ['approve_plan', 'request_plan_revision'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  automationBrief: {
    available: true,
    summary: 'Automate tests/foo.spec.ts',
    targetTestFile: 'tests/foo.spec.ts',
  },
}

const planApprovedBrief = {
  ...planReadyBrief,
  sessionState: {
    ...planReadyBrief.sessionState,
    planApproved: true,
    nextActions: ['start_automation'],
  },
}

describe('getSessionStage', () => {
  it('maps draft to draft', () => {
    expect(getSessionStage({ status: 'draft', workflowStatus: 'pending' })).toBe(
      'draft',
    )
  })

  it('maps plan_ready without approval to plan_review', () => {
    expect(
      getSessionStage({
        status: 'plan_ready',
        workflowStatus: 'plan_ready',
        planApproved: false,
      }),
    ).toBe('plan_review')
  })

  it('maps plan_ready with approval to plan_approved', () => {
    expect(
      getSessionStage({
        status: 'plan_ready',
        workflowStatus: 'plan_ready',
        planApproved: true,
      }),
    ).toBe('plan_approved')
  })

  it('does not treat not_approved_for_pr as ready_to_publish', () => {
    expect(
      getSessionStage({
        status: 'draft',
        workflowStatus: 'not_approved_for_pr',
      }),
    ).toBe('draft')
  })

  it('maps approved_for_pr workflow to ready_to_publish', () => {
    expect(
      getSessionStage({
        status: 'succeeded',
        workflowStatus: 'approved_for_pr',
      }),
    ).toBe('ready_to_publish')
  })

  it('maps pr URL to published', () => {
    expect(
      getSessionStage({
        status: 'succeeded',
        workflowStatus: 'approved_for_pr',
        prExternalUrl: 'https://github.com/org/repo/pull/1',
      }),
    ).toBe('published')
  })
})

describe('resolvePrimarySessionAction', () => {
  it('prefers prepare_plan on draft when brief says so', () => {
    const ctx = buildActionContext(baseSession, draftBrief)
    expect(resolvePrimarySessionAction(ctx)).toBe('prepare_plan')
  })

  it('returns approve_plan when plan is ready', () => {
    const ctx = buildActionContext(
      { ...baseSession, status: 'plan_ready', workflowStatus: 'plan_ready' },
      planReadyBrief,
    )
    expect(resolvePrimarySessionAction(ctx)).toBe('approve_plan')
  })

  it('returns start_automation after plan approval', () => {
    const ctx = buildActionContext(
      { ...baseSession, status: 'plan_ready', workflowStatus: 'plan_ready' },
      planApprovedBrief,
    )
    expect(resolvePrimarySessionAction(ctx)).toBe('start_automation')
  })

  it('returns approve for awaiting review', () => {
    expect(
      resolvePrimarySessionAction({
        status: 'awaiting_review',
        workflowStatus: 'pending_review',
        nextActions: ['request_changes', 'approve'],
      }),
    ).toBe('approve')
  })

  it('returns create_pr for approved_for_pr', () => {
    expect(
      resolvePrimarySessionAction({
        status: 'succeeded',
        workflowStatus: 'approved_for_pr',
        nextActions: ['create_pr'],
      }),
    ).toBe('create_pr')
  })

  it('returns open_pr when PR URL exists', () => {
    expect(
      resolvePrimarySessionAction({
        status: 'succeeded',
        workflowStatus: 'approved_for_pr',
        prExternalUrl: 'https://github.com/org/repo/pull/2',
      }),
    ).toBe('open_pr')
  })

  it('returns null while running', () => {
    expect(
      resolvePrimarySessionAction({ status: 'running', workflowStatus: 'running' }),
    ).toBeNull()
  })
})

describe('sessionActionHints', () => {
  it('exposes prepare_plan on draft intake', () => {
    const hints = sessionActionHints(buildActionContext(baseSession, draftBrief))
    expect(hints.primaryAction).toBe('prepare_plan')
    expect(hints.canPreparePlan).toBe(true)
    expect(hints.canStart).toBe(false)
    expect(hints.isPlanPhase).toBe(true)
  })

  it('enables plan revision during plan review', () => {
    const hints = sessionActionHints(
      buildActionContext(
        { ...baseSession, status: 'plan_ready', workflowStatus: 'plan_ready' },
        planReadyBrief,
      ),
    )
    expect(hints.canRequestPlanRevision).toBe(true)
    expect(hints.canApprovePlan).toBe(true)
    expect(hints.canRevise).toBe(false)
  })

  it('enables output revise only during output review', () => {
    const hints = sessionActionHints({
      status: 'awaiting_review',
      workflowStatus: 'pending_review',
      nextActions: ['request_changes', 'approve'],
    })
    expect(hints.canRevise).toBe(true)
    expect(hints.canApprove).toBe(true)
    expect(hints.isOutputReviewPhase).toBe(true)
  })
})

describe('isSessionActionAllowed', () => {
  it('blocks create_pr on draft runs', () => {
    expect(
      isSessionActionAllowed(buildActionContext(baseSession, draftBrief), 'create_pr'),
    ).toBe(false)
  })

  it('allows prepare_plan on draft runs', () => {
    expect(
      isSessionActionAllowed(buildActionContext(baseSession, draftBrief), 'prepare_plan'),
    ).toBe(true)
  })

  it('blocks start until plan is approved when brief requires it', () => {
    expect(
      isSessionActionAllowed(
        buildActionContext(
          { ...baseSession, status: 'plan_ready', workflowStatus: 'plan_ready' },
          planReadyBrief,
        ),
        'start',
      ),
    ).toBe(false)
  })
})

describe('mergeSessionWithReviewData', () => {
  it('ignores review data from a different session', () => {
    const merged = mergeSessionWithReviewData(baseSession, {
      sessionId: 'session-b',
      reviewSummary: {
        changedFilesCount: 3,
        currentPatchVersion: 2,
      },
      changedFiles: [],
      reviewConversation: [],
      prInfo: {
        externalUrl: 'https://github.com/org/repo/pull/99',
        externalId: '99',
        title: 'Wrong session PR',
      },
    })
    expect(merged.prExternalUrl).toBeUndefined()
    expect(merged.patchSummary).toBeUndefined()
  })

  it('merges review data when session ids match', () => {
    const merged = mergeSessionWithReviewData(baseSession, {
      sessionId: 'session-a',
      reviewSummary: {
        changedFilesCount: 2,
        currentPatchVersion: 1,
      },
      changedFiles: [],
      reviewConversation: [],
      prInfo: null,
    })
    expect(merged.patchSummary).toContain('2 files changed')
  })
})
