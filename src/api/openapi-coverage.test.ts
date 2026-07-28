import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import {
  backendOperations,
  listOperationIds,
} from '@/api/generated/backend-routes'

const contractDir = join(
  dirname(fileURLToPath(import.meta.url)),
  'backend-contract',
)

type OpenApiDoc = {
  paths: Record<string, Partial<Record<string, unknown>>>
}

function loadOpenApi(): OpenApiDoc {
  return JSON.parse(
    readFileSync(join(contractDir, 'openapi-ui-v1.json'), 'utf8'),
  ) as OpenApiDoc
}

function normalizePath(path: string): string {
  return path.replace(/\{([^}]+)\}/g, '{$1}')
}

describe('backend contract route coverage', () => {
  it('maps every generated OpenAPI operation to a documented path', () => {
    const doc = loadOpenApi()
    const openApi = new Set<string>()
    for (const [path, methods] of Object.entries(doc.paths)) {
      for (const method of Object.keys(methods)) {
        openApi.add(`${method.toUpperCase()} ${normalizePath(path)}`)
      }
    }

    const missing: string[] = []
    for (const id of listOperationIds()) {
      const op = backendOperations[id]
      if (op.source !== 'openapi-ui-v1') continue
      const key = `${op.method} ${normalizePath(op.pathTemplate)}`
      if (!openApi.has(key)) missing.push(key)
    }

    expect(missing, `Missing in OpenAPI: ${missing.join(', ')}`).toEqual([])
  })

  it('rejects stale alias paths in bundled OpenAPI', () => {
    const doc = loadOpenApi()
    const paths = Object.keys(doc.paths)
    expect(paths.some((p) => p.includes('analyze-requirements'))).toBe(false)
    expect(paths.some((p) => p.includes('automation-backlog'))).toBe(false)
    expect(paths.some((p) => p.includes('requirement-analysis'))).toBe(false)
    expect(paths.some((p) => p.includes('prepare-test-design-plan'))).toBe(false)
    expect(paths.some((p) => p.includes('request-test-case-revision'))).toBe(
      false,
    )
  })
})
