import { describe, expect, it } from 'vitest'

import { mergeSessionWithReviewData } from '@/features/sessions/review/review-data'
import {
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

describe('getSessionStage', () => {
  it('maps draft to draft', () => {
    expect(getSessionStage({ status: 'draft', workflowStatus: 'pending' })).toBe(
      'draft',
    )
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
  it('returns start_automation for draft', () => {
    expect(
      resolvePrimarySessionAction({ status: 'draft', workflowStatus: 'pending' }),
    ).toBe('start_automation')
  })

  it('returns approve for awaiting review', () => {
    expect(
      resolvePrimarySessionAction({
        status: 'awaiting_review',
        workflowStatus: 'pending_review',
      }),
    ).toBe('approve')
  })

  it('returns create_pr for approved_for_pr', () => {
    expect(
      resolvePrimarySessionAction({
        status: 'succeeded',
        workflowStatus: 'approved_for_pr',
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
  it('exposes only one primary action at a time', () => {
    const hints = sessionActionHints({
      status: 'draft',
      workflowStatus: 'pending',
    })
    expect(hints.primaryAction).toBe('start_automation')
    expect(hints.canStart).toBe(true)
    expect(hints.canCreatePr).toBe(false)
    expect(hints.canApprove).toBe(false)
  })

  it('enables revise only during review', () => {
    const hints = sessionActionHints({
      status: 'awaiting_review',
      workflowStatus: 'pending_review',
    })
    expect(hints.canRevise).toBe(true)
    expect(hints.canApprove).toBe(true)
    expect(hints.canCreatePr).toBe(false)
  })
})

describe('isSessionActionAllowed', () => {
  it('blocks create_pr on draft runs', () => {
    expect(
      isSessionActionAllowed(
        { status: 'draft', workflowStatus: 'pending' },
        'create_pr',
      ),
    ).toBe(false)
  })

  it('allows start on draft runs', () => {
    expect(
      isSessionActionAllowed(
        { status: 'draft', workflowStatus: 'pending' },
        'start',
      ),
    ).toBe(true)
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
