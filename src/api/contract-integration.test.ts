import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it, vi } from 'vitest'

import {
  evaluateContractCompatibility,
  getBundledContractInfo,
} from '@/api/contract-version'
import { operationHref } from '@/api/contract-http'
import {
  backendOperations,
  listOperationIds,
  OPERATION_COUNT,
  ROUTE_COUNT,
} from '@/api/generated/backend-routes'
import {
  canonicalBackendErrorBodySchema,
  fastApiValidationErrorBodySchema,
  getOperationResponseSchema,
} from '@/api/generated/backend-schemas'
import {
  GENERATED_FINGERPRINT,
  SOURCE_CONTRACT_VERSION,
} from '@/api/generated/generated-stamp'
import {
  SPRINT1_ACTIONS,
  SPRINT1_STAGES,
  SPRINT2_MUTATION_ACTIONS,
  SPRINT2_NEXT_ACTIONS,
} from '@/api/generated/backend-workflow'
import {
  assertWorkflowActionMapped,
  assertWorkflowStageMapped,
} from '@/api/workflow-mapping'

const contractDir = join(
  dirname(fileURLToPath(import.meta.url)),
  'backend-contract',
)

function loadJson<T>(relativePath: string): T {
  return JSON.parse(
    readFileSync(join(contractDir, relativePath), 'utf8'),
  ) as T
}

function sha256File(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function sha256FixtureBundle(dir: string): string {
  const fixtureRoot = join(dir, 'fixtures')
  const files: string[] = []
  function walk(p: string) {
    for (const entry of readdirSync(p).sort()) {
      const full = join(p, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (entry.endsWith('.json') && entry !== 'index.json') files.push(full)
    }
  }
  walk(fixtureRoot)
  const hash = createHash('sha256')
  for (const file of files.sort()) {
    hash.update(readFileSync(file))
  }
  return hash.digest('hex')
}

describe('backend contract bundle', () => {
  it('verifies checksum metadata', () => {
    const checksums = loadJson<{
      version: string
      openapiSha256: string
      fixtureBundleSha256: string
    }>('checksums.json')
    const manifest = loadJson<{ version: string }>('contract-manifest.json')
    const syncMeta = loadJson<{ contractVersion: string }>('sync-metadata.json')

    expect(manifest.version).toBe(checksums.version)
    expect(syncMeta.contractVersion).toBe(checksums.version)
    expect(sha256File(join(contractDir, 'openapi-ui-v1.json'))).toBe(
      checksums.files['openapi-ui-v1.json'],
    )
    expect(sha256FixtureBundle(contractDir)).toBe(
      checksums.files['fixture-bundle'],
    )
  })

  it('parses bundled contract metadata', () => {
    const info = getBundledContractInfo()
    expect(info.contractVersion).toBe('2026.07.28.1')
    expect(info.operationCount).toBe(OPERATION_COUNT)
    expect(info.routeCount).toBe(ROUTE_COUNT)
  })
})

describe('contract handshake', () => {
  it('is compatible when versions and checksums match', () => {
    const bundled = getBundledContractInfo()
    const result = evaluateContractCompatibility({
      contractVersion: bundled.contractVersion,
      openapiSha256: bundled.openapiSha256,
      fixtureBundleSha256: bundled.fixtureBundleSha256,
    })
    expect(result.status).toBe('compatible')
  })

  it('is incompatible when versions differ', () => {
    const bundled = getBundledContractInfo()
    const result = evaluateContractCompatibility({
      contractVersion: '1999.01.01.1',
      openapiSha256: bundled.openapiSha256,
      fixtureBundleSha256: bundled.fixtureBundleSha256,
    })
    expect(result.status).toBe('incompatible')
  })

  it('allows compatible_additive when backend declares frontend compatibility', () => {
    const bundled = getBundledContractInfo()
    const result = evaluateContractCompatibility({
      contractVersion: '1999.01.01.2',
      compatibleFrontendContract: bundled.contractVersion,
    })
    expect(result.status).toBe('compatible_additive')
  })
})

describe('generated routes', () => {
  it('lists all operations from route manifest', () => {
    const manifest = loadJson<{ operations: { operationId: string }[] }>(
      'route-manifest.json',
    )
    const ids = new Set(listOperationIds())
    for (const op of manifest.operations) {
      expect(ids.has(op.operationId as never)).toBe(true)
    }
    expect(ids.size).toBe(48)
  })

  it('matches method and path templates for fixtures', () => {
    const index = loadJson<{
      fixtures: {
        operationId: string
        method: string
        path: string
        file: string | null
      }[]
    }>('fixtures/index.json')

    for (const fixture of index.fixtures) {
      if (!fixture.file) continue
      const op = backendOperations[fixture.operationId as keyof typeof backendOperations]
      expect(op, fixture.operationId).toBeDefined()
      expect(op.method).toBe(fixture.method)
      expect(op.pathTemplate).toBe(fixture.path)
    }
  })
})

describe('backend fixtures', () => {
  const index = loadJson<{
    fixtures: {
      operationId: string
      method: string
      path: string
      file: string | null
      variantTags?: string[]
    }[]
    missing: { operationId: string; note?: string }[]
  }>('fixtures/index.json')

  for (const fixture of index.fixtures) {
    if (!fixture.file) continue
    it(`parses ${fixture.file}`, () => {
      const data = loadJson(fixture.file.replace(/^fixtures\//, 'fixtures/'))
      const schema = getOperationResponseSchema(
        fixture.operationId as keyof typeof backendOperations,
      )
      expect(schema, fixture.operationId).toBeDefined()
      expect(() => schema!.parse(data)).not.toThrow()
    })
  }

  it('flags known missing mutation fixtures', () => {
    const missingIds = index.missing.map((m) => m.operationId)
    expect(missingIds).toContain('publishTestDesign')
    expect(missingIds).toContain('prepareSessionPlan')
  })
})

describe('workflow contract mapping', () => {
  it('maps all sprint1 stages and actions', () => {
    for (const stage of SPRINT1_STAGES) {
      expect(() => assertWorkflowStageMapped(stage, 'sprint1')).not.toThrow()
    }
    for (const action of SPRINT1_ACTIONS) {
      expect(() => assertWorkflowActionMapped(action, 'sprint1')).not.toThrow()
    }
  })

  it('maps all sprint2 actions from contract', () => {
    for (const action of SPRINT2_NEXT_ACTIONS) {
      expect(() => assertWorkflowActionMapped(action, 'sprint2')).not.toThrow()
    }
    for (const action of SPRINT2_MUTATION_ACTIONS) {
      expect(() => assertWorkflowActionMapped(action, 'sprint2')).not.toThrow()
    }
  })

  it('maps fixture nextActions when present', () => {
    const review = loadJson<{ reviewSummary?: { nextActions?: string[] } }>(
      'fixtures/test-design-review-data-intake.json',
    )
    for (const action of review.reviewSummary?.nextActions ?? []) {
      expect(() => assertWorkflowActionMapped(action, 'sprint1')).not.toThrow()
    }
  })
})

describe('canonical errors', () => {
  it('parses invalid_state detail', () => {
    const body = loadJson('errors/invalid-state.json')
    expect(() => canonicalBackendErrorBodySchema.parse(body)).not.toThrow()
  })

  it('parses FastAPI 422 validation variant', () => {
    const body = loadJson('errors/validation-422.json')
    expect(() => canonicalBackendErrorBodySchema.parse(body)).not.toThrow()
    expect(() => fastApiValidationErrorBodySchema.parse({ error: { message: 'x', details: [{ msg: 'bad' }] } })).not.toThrow()
  })
})

describe('generated artifacts freshness', () => {
  it('matches generated stamp contract version', () => {
    expect(SOURCE_CONTRACT_VERSION).toBe('2026.07.28.1')
    expect(GENERATED_FINGERPRINT).toMatch(/^[a-f0-9]{64}$/)
  })
})

describe('route builders', () => {
  it('builds canonical analyze path', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')
    vi.stubEnv('VITE_API_PATH_PREFIX', '/api/v1')
    const href = operationHref(
      'analyzeTestDesignRun',
      { run_id: 'run-1' },
      { actor_id: 'qswarm-web' },
    )
    expect(href).toBe(
      'https://api.example.com/api/v1/test-design-runs/run-1/analyze?actor_id=qswarm-web',
    )
  })
})