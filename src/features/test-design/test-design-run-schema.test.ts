import { describe, expect, it } from 'vitest'

import {
  ALL_TEST_DESIGN_RUN_FIXTURES,
  testDesignRunIntakeReadyFixture,
} from '@/api/mocks/fixtures/test-design-runs'
import { testDesignRunSchema } from '@/api/schemas'
import {
  buildTestDesignContext,
  isTestDesignActionAllowed,
  resolvePrimaryTestDesignAction,
  testDesignActionHints,
  testDesignPrimaryActionLabel,
} from '@/features/test-design/test-design-actions'
import { getTestDesignStage, isIntakeReady } from '@/features/test-design/test-design-lifecycle'

describe('testDesignRunSchema', () => {
  it.each(ALL_TEST_DESIGN_RUN_FIXTURES.map((fixture) => [fixture.currentStage, fixture]))(
    'parses %s fixture',
    (_stage, fixture) => {
      const parsed = testDesignRunSchema.parse(fixture)
      expect(parsed.id).toBe(fixture.id)
      expect(parsed.storyKey).toBe(fixture.storyKey)
    },
  )

  it('parses live intake_ready response with nullables and empty arrays', () => {
    const parsed = testDesignRunSchema.parse(testDesignRunIntakeReadyFixture)
    expect(parsed.currentStage).toBe('intake_ready')
    expect(parsed.requirementAnalysis).toBeNull()
    expect(parsed.testDesignPlan).toBeNull()
    expect(parsed.reviewIssue).toBeNull()
    expect(parsed.approvalId).toBeNull()
    expect(parsed.blockedReason).toBeNull()
    expect(parsed.versions).toEqual([])
    expect(parsed.testCaseRecords).toEqual([])
    expect(parsed.automationReadyTestCases).toEqual([])
    expect(parsed.productWorkspace.stage).toBe('intake_ready')
  })

  it('rejects legacy frontend run shape', () => {
    const result = testDesignRunSchema.safeParse({
      id: 'tdr_test',
      storyKey: 'PAY-88',
      storyTitle: 'Checkout',
      status: 'draft',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    })
    expect(result.success).toBe(false)
  })

  it('uses id as canonical identifier', () => {
    const parsed = testDesignRunSchema.parse(testDesignRunIntakeReadyFixture)
    expect(parsed.id).toBe('38d476a7-8294-4acd-909b-36de472f18d0')
    expect('runId' in parsed).toBe(false)
  })
})

describe('test design actions', () => {
  it('maps intake_ready nextActions to Analyze requirements', () => {
    const run = testDesignRunSchema.parse(testDesignRunIntakeReadyFixture)
    const ctx = buildTestDesignContext(run)
    expect(resolvePrimaryTestDesignAction(ctx)).toBe('analyze_requirements')
    expect(testDesignPrimaryActionLabel('analyze_requirements')).toBe(
      'Analyze requirements',
    )
    expect(isTestDesignActionAllowed(ctx, 'analyze_requirements')).toBe(true)
    expect(isTestDesignActionAllowed(ctx, 'publish_test_cases')).toBe(false)
  })

  it('maps prepare_plan wire token to UI label', () => {
    expect(testDesignPrimaryActionLabel('prepare_plan')).toBe(
      'Prepare test-design plan',
    )
  })

  it('marks intake_ready as intake stage', () => {
    const ctx = buildTestDesignContext(
      testDesignRunSchema.parse(testDesignRunIntakeReadyFixture),
    )
    expect(getTestDesignStage(ctx)).toBe('intake')
    expect(isIntakeReady(ctx)).toBe(true)
  })

  it('enables plan revision during awaiting_plan_approval', () => {
    const fixture = ALL_TEST_DESIGN_RUN_FIXTURES.find(
      (f) => f.currentStage === 'awaiting_plan_approval',
    )!
    const ctx = buildTestDesignContext(testDesignRunSchema.parse(fixture))
    const hints = testDesignActionHints(ctx)
    expect(hints.canRequestPlanChanges).toBe(true)
    expect(hints.primaryAction).toBe('approve_plan')
  })
})
