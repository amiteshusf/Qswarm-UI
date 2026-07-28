import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

const ALLOWED_PATH_PREFIXES = [
  join(srcRoot, 'api/generated'),
  join(srcRoot, 'api/backend-contract'),
  join(srcRoot, 'api/contract-integration.test.ts'),
  join(srcRoot, 'api/api-routes.test.ts'),
  join(srcRoot, 'api/contract-flow.test.ts'),
  join(srcRoot, 'api/openapi-coverage.test.ts'),
]

const API_V1_STRING_RE = /(['"`])\/api\/v1\/[^'"`]*\1/g

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry === 'backend-contract') continue
      collectSourceFiles(full, out)
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

function isAllowed(file: string): boolean {
  return ALLOWED_PATH_PREFIXES.some((prefix) => file.startsWith(prefix))
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

describe('no hardcoded /api/v1/ paths', () => {
  it('only appears in generated files, contract bundle, and approved tests', () => {
    const offenders: string[] = []
    for (const file of collectSourceFiles(srcRoot)) {
      if (isAllowed(file)) continue
      const text = stripComments(readFileSync(file, 'utf8'))
      if (API_V1_STRING_RE.test(text)) offenders.push(file.replace(`${srcRoot}/`, ''))
      API_V1_STRING_RE.lastIndex = 0
    }
    expect(offenders).toEqual([])
  })
})
