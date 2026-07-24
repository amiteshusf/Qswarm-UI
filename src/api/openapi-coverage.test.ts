import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import {
  API_V1_PREFIX,
  listFrontendRouteSpecs,
  normalizeOpenApiPath,
  normalizeRoutePath,
} from '@/api/backend-route-manifest'

const openapiPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../reference/backend/docs/openapi-ui-v1.json',
)

type OpenApiDoc = {
  paths: Record<string, Partial<Record<string, unknown>>>
}

function loadOpenApi(): OpenApiDoc {
  return JSON.parse(readFileSync(openapiPath, 'utf8')) as OpenApiDoc
}

function openApiRouteSet(doc: OpenApiDoc): Set<string> {
  const routes = new Set<string>()
  for (const [path, methods] of Object.entries(doc.paths)) {
    if (!path.startsWith(API_V1_PREFIX)) continue
    for (const method of Object.keys(methods)) {
      routes.add(`${method.toUpperCase()} ${normalizeOpenApiPath(path)}`)
    }
  }
  return routes
}

describe('OpenAPI route coverage', () => {
  it('maps every frontend route to a documented OpenAPI operation', () => {
    const doc = loadOpenApi()
    const openApi = openApiRouteSet(doc)
    const missing: string[] = []

    for (const route of listFrontendRouteSpecs()) {
      const normalized = `${route.method} ${normalizeOpenApiPath(
        normalizeRoutePath(route.path),
      )}`
      if (!openApi.has(normalized)) missing.push(normalized)
    }

    expect(missing, `Missing in OpenAPI: ${missing.join(', ')}`).toEqual([])
  })

  it('rejects stale alias paths such as analyze-requirements', () => {
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
