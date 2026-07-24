import { describe, expect, it } from 'vitest'

import { formatErrorTechnicalDetail, SchemaResponseError } from '@/api/errors'
import { LIVE_STORY_LIST_FIXTURE, mockJiraStories } from '@/api/mocks/stories'
import {
  jiraStorySchema,
  storyListSchema,
} from '@/api/schemas'
import {
  acceptanceCriteriaStatusLabel,
  formatMissingInformationSummary,
  formatStoryMetaLine,
  resolveStoryRowAction,
  storyRowActionLabel,
} from '@/features/story-intake/story-intake-utils'

describe('storyListSchema', () => {
  it('parses the real backend fixture', () => {
    const parsed = storyListSchema.parse(LIVE_STORY_LIST_FIXTURE)
    expect(parsed.total).toBe(1)
    expect(parsed.stories[0]?.storyKey).toBe('STUB-1')
    expect(parsed.stories[0]?.jiraUrl).toBe(
      'https://usfoods.atlassian.net/browse/STUB-1',
    )
  })

  it('parses an empty stories response', () => {
    const parsed = storyListSchema.parse({ stories: [], total: 0 })
    expect(parsed.stories).toEqual([])
    expect(parsed.total).toBe(0)
  })

  it('accepts null sprint and assignee', () => {
    const parsed = jiraStorySchema.parse(LIVE_STORY_LIST_FIXTURE.stories[0])
    expect(parsed.sprint).toBeNull()
    expect(parsed.assignee).toBeNull()
    expect(parsed.activeRunId).toBeNull()
  })

  it('parses all readiness and acceptanceCriteriaStatus values', () => {
    for (const readiness of ['ready', 'partial', 'missing_ac'] as const) {
      const story = jiraStorySchema.parse({
        ...LIVE_STORY_LIST_FIXTURE.stories[0],
        readiness,
        acceptanceCriteriaStatus: readiness,
      })
      expect(story.readiness).toBe(readiness)
      expect(story.acceptanceCriteriaStatus).toBe(readiness)
    }
  })

  it('rejects legacy items wrapper', () => {
    const result = storyListSchema.safeParse({
      items: LIVE_STORY_LIST_FIXTURE.stories,
      total: 1,
    })
    expect(result.success).toBe(false)
  })

  it('rejects legacy key field', () => {
    const result = jiraStorySchema.safeParse({
      key: 'PAY-88',
      title: 'Legacy',
      description: 'x',
      status: 'Open',
      sprint: null,
      projectKey: 'PAY',
      assignee: null,
      readiness: 'ready',
      acceptanceCriteriaStatus: 'ready',
      missingInformation: [],
      hasActiveRun: false,
      activeRunId: null,
      jiraUrl: 'https://jira.example.com/browse/PAY-88',
    })
    expect(result.success).toBe(false)
  })
})

describe('mock fixtures', () => {
  it('mock stories match the live contract', () => {
    for (const story of mockJiraStories) {
      expect(() => jiraStorySchema.parse(story)).not.toThrow()
    }
    expect(
      storyListSchema.parse({
        stories: mockJiraStories,
        total: mockJiraStories.length,
      }).total,
    ).toBe(mockJiraStories.length)
  })
})

describe('story intake utils', () => {
  const baseStory = jiraStorySchema.parse(LIVE_STORY_LIST_FIXTURE.stories[0])

  it('formats missing information summary', () => {
    expect(formatMissingInformationSummary([])).toBeNull()
    expect(formatMissingInformationSummary(['One gap'])).toBe('One gap')
    expect(formatMissingInformationSummary(['A', 'B'])).toBe('A (+1 more)')
  })

  it('labels all acceptance criteria statuses', () => {
    expect(acceptanceCriteriaStatusLabel('ready')).toBe('Ready')
    expect(acceptanceCriteriaStatusLabel('partial')).toBe('Partial AC')
    expect(acceptanceCriteriaStatusLabel('missing_ac')).toBe('Missing AC')
  })

  it('formats meta line with null-safe sprint and assignee', () => {
    expect(formatStoryMetaLine(baseStory)).toBe('STUB')
    expect(
      formatStoryMetaLine({
        ...baseStory,
        sprint: 'Sprint 1',
        assignee: 'Alex',
      }),
    ).toBe('STUB · Sprint 1 · Alex')
  })

  it('opens run when hasActiveRun is true', () => {
    const action = resolveStoryRowAction({
      ...baseStory,
      hasActiveRun: true,
      activeRunId: 'tdr_123',
    })
    expect(action).toBe('open_run')
    expect(storyRowActionLabel(action)).toBe('Open run')
  })

  it('starts test design when hasActiveRun is false', () => {
    const action = resolveStoryRowAction({
      ...baseStory,
      hasActiveRun: false,
      activeRunId: null,
    })
    expect(action).toBe('start_test_design')
    expect(storyRowActionLabel(action)).toBe('Start test design')
  })
})

describe('SchemaResponseError technical details', () => {
  it('shows path, expected, and received for Zod failures', () => {
    const parsed = storyListSchema.safeParse({ stories: [], total: 'nope' })
    if (parsed.success) throw new Error('expected failure')
    const err = new SchemaResponseError('failed', parsed.error, 'GET /stories')
    const detail = formatErrorTechnicalDetail(err)
    expect(detail).toContain('resource: GET /stories')
    expect(detail).toContain('path: total')
    expect(detail).toMatch(/expected:/)
    expect(detail).toMatch(/received:/)
  })
})
