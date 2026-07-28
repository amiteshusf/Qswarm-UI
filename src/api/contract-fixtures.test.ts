import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { adaptJiraStoryDetail } from '@/api/adapters/stories'
import {
  canonicalBackendErrorBodySchema,
  getOperationResponseSchema,
} from '@/api/generated/backend-schemas'
import {
  dashboardSchema,
  settingsSchema,
  storyListSchema,
  testDesignRunSchema,
} from '@/api/schemas'
import { testDesignReviewDataWireSchema } from '@/api/wire-schemas'

const contractDir = join(
  dirname(fileURLToPath(import.meta.url)),
  'backend-contract',
)

function loadFixture(relativePath: string): unknown {
  return JSON.parse(
    readFileSync(join(contractDir, relativePath), 'utf8'),
  )
}

describe('backend contract fixtures', () => {
  it('parses stories-list.json', () => {
    expect(() =>
      storyListSchema.parse(loadFixture('fixtures/stories-list.json')),
    ).not.toThrow()
  })

  it('parses story-detail.json via adapter', () => {
    expect(() =>
      adaptJiraStoryDetail(loadFixture('fixtures/story-detail.json')),
    ).not.toThrow()
  })

  it('parses test-design-run-intake-ready.json', () => {
    expect(() =>
      testDesignRunSchema.parse(
        loadFixture('fixtures/test-design-run-intake-ready.json'),
      ),
    ).not.toThrow()
  })

  it('parses intake review-data wire fixture', () => {
    expect(() =>
      testDesignReviewDataWireSchema.parse(
        loadFixture('fixtures/test-design-review-data-intake.json'),
      ),
    ).not.toThrow()
  })

  it('parses dashboard.json', () => {
    expect(() =>
      dashboardSchema.parse(loadFixture('fixtures/dashboard.json')),
    ).not.toThrow()
  })

  it('parses settings.json', () => {
    expect(() =>
      settingsSchema.parse(loadFixture('fixtures/settings.json')),
    ).not.toThrow()
  })

  it('parses backend error fixtures', () => {
    expect(() =>
      canonicalBackendErrorBodySchema.parse(
        loadFixture('errors/invalid-state.json'),
      ),
    ).not.toThrow()
    expect(() =>
      canonicalBackendErrorBodySchema.parse(loadFixture('errors/not-found.json')),
    ).not.toThrow()
  })

  it('validates every indexed fixture with operation schema', () => {
    const index = loadFixture('fixtures/index.json') as {
      fixtures: { operationId: string; file: string | null }[]
    }
    for (const row of index.fixtures) {
      if (!row.file) continue
      const schema = getOperationResponseSchema(
        row.operationId as Parameters<typeof getOperationResponseSchema>[0],
      )
      expect(schema, row.file).toBeDefined()
      expect(() => schema!.parse(loadFixture(row.file))).not.toThrow()
    }
  })
})
