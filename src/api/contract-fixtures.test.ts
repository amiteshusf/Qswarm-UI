import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { adaptJiraStoryDetail } from '@/api/adapters/stories'
import { ALL_TEST_DESIGN_RUN_FIXTURES } from '@/api/mocks/fixtures/test-design-runs'
import {
  dashboardSchema,
  jiraStorySchema,
  settingsSchema,
  storyListSchema,
  testDesignRunSchema,
} from '@/api/schemas'
import { backendErrorDetailSchema, testDesignReviewDataWireSchema } from '@/api/wire-schemas'

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), 'contract-fixtures')

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(fixtureDir, name), 'utf8'))
}

describe('contract fixtures', () => {
  it('parses stories-list.json', () => {
    expect(() => storyListSchema.parse(loadFixture('stories-list.json'))).not.toThrow()
  })

  it('parses story-detail.json via adapter', () => {
    expect(() => adaptJiraStoryDetail(loadFixture('story-detail.json'))).not.toThrow()
  })

  it('parses test-design-run-intake-ready.json', () => {
    expect(() =>
      testDesignRunSchema.parse(loadFixture('test-design-run-intake-ready.json')),
    ).not.toThrow()
  })

  it('parses all stage fixtures from mocks', () => {
    for (const fixture of ALL_TEST_DESIGN_RUN_FIXTURES) {
      expect(() => testDesignRunSchema.parse(fixture)).not.toThrow()
    }
  })

  it('parses intake review-data wire fixture', () => {
    expect(() =>
      testDesignReviewDataWireSchema.parse(
        loadFixture('test-design-review-data-intake.json'),
      ),
    ).not.toThrow()
  })

  it('parses dashboard.json', () => {
    expect(() => dashboardSchema.parse(loadFixture('dashboard.json'))).not.toThrow()
  })

  it('parses settings.json', () => {
    expect(() => settingsSchema.parse(loadFixture('settings.json'))).not.toThrow()
  })

  it('parses backend error fixtures', () => {
    expect(() =>
      backendErrorDetailSchema.parse(loadFixture('error-not-found.json').detail),
    ).not.toThrow()
    expect(() =>
      backendErrorDetailSchema.parse(
        loadFixture('error-invalid-state.json').detail,
      ),
    ).not.toThrow()
  })
})
