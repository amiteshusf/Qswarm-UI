import { resolvedApiPathPrefix } from '@/lib/env'

/** Full base for API paths: `origin` + configured prefix, without double slashes. */
export function apiRootHref(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined
  const origin = raw?.trim().replace(/\/+$/, '') ?? ''
  const API_PREFIX = resolvedApiPathPrefix()
  if (!origin) {
    return API_PREFIX || ''
  }
  if (!API_PREFIX) return origin
  return `${origin}${API_PREFIX}`
}
