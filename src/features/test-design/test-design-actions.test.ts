import { describe, expect, it } from 'vitest'

import type { TestDesignRun } from '@/api/schemas'
import {
  buildTestDesignContext,
  isTestDesignActionAllowed,
  resolvePrimaryTestDesignAction,
  testDesignActionHints,
} from '@/features/test-design/test-design-actions'
import { getTestDesignStage } from '@/features/test-design/test-design-lifecycle'

const baseRun = (patch: Partial<TestDesignRun>): TestDesignRun => ({
  id: 'tdr_test',
  storyKey: 'PAY-88',
  storyTitle: 'Checkout partial refunds',
  status: 'draft',
  createdAt: '2026-07-20T10:00:00Z',
  updatedAt: '2026-07-20T10:00:00Z',
  ...patch,
})

describe('getTestDesignStage', () => {
  it('maps draft to intake', () => {
    expect(getTestDesignStage({ status: 'draft' })).toBe('intake')
  })

  it('maps cases_ready to case_review', () => {
    expect(getTestDesignStage({ status: 'cases_ready' })).toBe('case_review')
  })

  it('maps published to published', () => {
    expect(getTestDesignStage({ status: 'published' })).toBe('published')
  })
})

describe('resolvePrimaryTestDesignAction', () => {
  it('prefers nextActions over stage', () => {
    const ctx = buildTestDesignContext(
      baseRun({
        status: 'plan_ready',
        nextActions: ['approve_plan'],
      }),
    )
    expect(resolvePrimaryTestDesignAction(ctx)).toBe('approve_plan')
  })

  it('returns generate_test_cases when plan approved', () => {
    const ctx = buildTestDesignContext(
      baseRun({
        status: 'plan_approved',
        planApproved: true,
        nextActions: ['generate_test_cases'],
      }),
    )
    expect(resolvePrimaryTestDesignAction(ctx)).toBe('generate_test_cases')
  })

  it('returns open_automation_backlog when published', () => {
    const ctx = buildTestDesignContext(
      baseRun({
        status: 'published',
        nextActions: ['open_automation_backlog'],
      }),
    )
    expect(resolvePrimaryTestDesignAction(ctx)).toBe('open_automation_backlog')
  })

  it('hides publish before approval', () => {
    const ctx = buildTestDesignContext(
      baseRun({
        status: 'cases_ready',
        nextActions: ['request_test_case_changes', 'approve_test_design'],
      }),
    )
    expect(resolvePrimaryTestDesignAction(ctx)).toBe('approve_test_design')
    expect(isTestDesignActionAllowed(ctx, 'publish_test_cases')).toBe(false)
  })
})

describe('testDesignActionHints', () => {
  it('enables plan revision when in plan_review', () => {
    const ctx = buildTestDesignContext(
      baseRun({
        status: 'plan_ready',
        nextActions: ['request_plan_changes', 'approve_plan'],
      }),
    )
    const hints = testDesignActionHints(ctx)
    expect(hints.canRequestPlanChanges).toBe(true)
    expect(hints.canApprovePlan).toBe(true)
    expect(hints.primaryAction).toBe('approve_plan')
  })

  it('enables case revision during case review', () => {
    const ctx = buildTestDesignContext(
      baseRun({
        status: 'cases_ready',
        nextActions: ['request_test_case_changes', 'approve_test_design'],
      }),
    )
    const hints = testDesignActionHints(ctx)
    expect(hints.canRequestCaseChanges).toBe(true)
    expect(hints.isCaseReviewPhase).toBe(true)
  })

  it('marks analyzing as waiting', () => {
    const ctx = buildTestDesignContext(baseRun({ status: 'analyzing' }))
    const hints = testDesignActionHints(ctx)
    expect(hints.isWaiting).toBe(true)
    expect(hints.primaryAction).toBeNull()
  })
})
