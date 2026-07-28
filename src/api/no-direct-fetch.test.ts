import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const API_LAYER = join(srcRoot, 'api')

const FETCH_RE = /\bfetch\s*\(/
const AXIOS_RE = /\baxios\b/

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules') continue
      collectSourceFiles(full, out)
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

describe('no direct fetch outside API layer', () => {
  it('allows fetch only under src/api (except contract-version meta handshake)', () => {
    const offenders: string[] = []
    for (const file of collectSourceFiles(srcRoot)) {
      if (file.startsWith(API_LAYER)) continue
      const text = readFileSync(file, 'utf8')
      if (FETCH_RE.test(text) || AXIOS_RE.test(text)) {
        offenders.push(file.replace(`${srcRoot}/`, ''))
      }
    }
    expect(offenders).toEqual([])
  })
})
