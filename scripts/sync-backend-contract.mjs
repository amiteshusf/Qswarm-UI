#!/usr/bin/env node
/**
 * Sync backend UI API contract bundle into src/api/backend-contract/.
 * Source: BACKEND_CONTRACT_SOURCE env, or reference/backend/ui-api-contract/.
 */
import { createHash } from 'node:crypto'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const defaultSource = join(root, 'reference/backend/ui-api-contract')
const source = process.env.BACKEND_CONTRACT_SOURCE ?? defaultSource
const target = join(root, 'src/api/backend-contract')

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function sha256FixtureBundle(dir) {
  const fixtureRoot = join(dir, 'fixtures')
  const files = []
  function walk(p) {
    for (const entry of readdirSync(p).sort()) {
      const full = join(p, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (entry.endsWith('.json') && entry !== 'index.json') files.push(full)
    }
  }
  if (existsSync(fixtureRoot)) walk(fixtureRoot)
  const hash = createHash('sha256')
  for (const file of files.sort()) {
    hash.update(readFileSync(file))
  }
  return hash.digest('hex')
}

function requiredFiles(dir) {
  return [
    'contract-manifest.json',
    'route-manifest.json',
    'workflow-contract.json',
    'openapi-ui-v1.json',
    'checksums.json',
    'fixtures/index.json',
  ]
}

function main() {
  if (!existsSync(source)) {
    console.error(`Backend contract source not found: ${source}`)
    process.exit(1)
  }

  for (const file of requiredFiles(source)) {
    if (!existsSync(join(source, file))) {
      console.error(`Missing required artifact: ${file}`)
      process.exit(1)
    }
  }

  const manifest = JSON.parse(
    readFileSync(join(source, 'contract-manifest.json'), 'utf8'),
  )
  const checksums = JSON.parse(
    readFileSync(join(source, 'checksums.json'), 'utf8'),
  )

  if (manifest.version !== checksums.version) {
    console.error(
      `Version mismatch: manifest=${manifest.version} checksums=${checksums.version}`,
    )
    process.exit(1)
  }

  const openapiSha = sha256File(join(source, 'openapi-ui-v1.json'))
  const fixtureSha = sha256FixtureBundle(source)
  const manifestSha = sha256File(join(source, 'contract-manifest.json'))

  if (checksums.files['openapi-ui-v1.json'] !== openapiSha) {
    console.error('OpenAPI SHA-256 mismatch')
    console.error(` expected ${checksums.files['openapi-ui-v1.json']}`)
    console.error(` actual   ${openapiSha}`)
    process.exit(1)
  }
  if (checksums.files['fixture-bundle'] !== fixtureSha) {
    console.error('Fixture bundle SHA-256 mismatch')
    console.error(` expected ${checksums.files['fixture-bundle']}`)
    console.error(` actual   ${fixtureSha}`)
    process.exit(1)
  }
  if (checksums.files['contract-manifest.json'] !== manifestSha) {
    console.error('Contract manifest SHA-256 mismatch')
    process.exit(1)
  }

  rmSync(target, { recursive: true, force: true })
  mkdirSync(target, { recursive: true })
  cpSync(source, target, { recursive: true })

  const syncMetadata = {
    contractVersion: manifest.version,
    backendGitCommit: manifest.backendGitCommit,
    openapiSha256: openapiSha,
    fixtureBundleSha256: fixtureSha,
    syncedAt: new Date().toISOString(),
    sourcePath: source,
    operationCount: manifest.operationCount,
    routeCount: manifest.routeCount,
  }
  writeFileSync(
    join(target, 'sync-metadata.json'),
    `${JSON.stringify(syncMetadata, null, 2)}\n`,
  )

  console.log(`Synced contract ${manifest.version} to ${relative(root, target)}`)
  console.log(`  operations: ${manifest.operationCount}`)
  console.log(`  routes: ${manifest.routeCount}`)
  console.log(`  openapiSha256: ${openapiSha}`)
}

main()
