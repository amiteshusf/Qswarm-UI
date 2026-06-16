#!/usr/bin/env node
/**
 * Optional contract audit: GET public /api/v1 routes and print HTTP status + JSON keys.
 *
 * Usage:
 *   node scripts/audit-api-contract.mjs
 *   AUDIT_API_BASE=https://qswarm.onrender.com AUDIT_API_PREFIX=/api/v1 node scripts/audit-api-contract.mjs
 */
const base = (process.env.AUDIT_API_BASE ?? 'https://qswarm.onrender.com').replace(
  /\/+$/,
  '',
)
const prefix = (process.env.AUDIT_API_PREFIX ?? '/api/v1').replace(/\/+$/, '') || ''

const paths = [
  'dashboard',
  'repo-connections',
  'branch-policies',
  'sessions',
  'settings',
]

function topKeys(value) {
  if (value === null || value === undefined) return String(value)
  if (Array.isArray(value))
    return `array(len=${value.length}) first=${value[0] != null ? Object.keys(value[0]).slice(0, 12).join(',') : '∅'}`
  if (typeof value === 'object') return Object.keys(value).join(', ')
  return typeof value
}

async function main() {
  for (const p of paths) {
    const url = `${base}${prefix}/${p}`
    const res = await fetch(url)
    const text = await res.text()
    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = text.slice(0, 200)
    }
    console.log('\n===', res.status, url, '===')
    console.log('top:', topKeys(parsed))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
