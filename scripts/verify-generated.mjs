#!/usr/bin/env node
/**
 * Verify generated backend client artifacts are current.
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const generatedDir = join(root, 'src/api/generated')

function fingerprint() {
  const routes = readFileSync(join(generatedDir, 'backend-routes.ts'), 'utf8')
  const workflow = readFileSync(join(generatedDir, 'backend-workflow.ts'), 'utf8')
  return createHash('sha256').update(routes).update(workflow).digest('hex')
}

const stamp = readFileSync(join(generatedDir, 'generated-stamp.ts'), 'utf8')
const match = stamp.match(/GENERATED_FINGERPRINT = '([a-f0-9]+)'/)
if (!match) {
  console.error('Could not read GENERATED_FINGERPRINT from generated-stamp.ts')
  process.exit(1)
}

const current = fingerprint()
if (current !== match[1]) {
  console.error('Generated files are stale. Run: npm run contract:generate')
  console.error(` expected ${match[1]}`)
  console.error(` actual   ${current}`)
  process.exit(1)
}

console.log('Generated backend client artifacts are current.')
