const raw = import.meta.env.VITE_API_BASE_URL as string | undefined

const rawPathPrefix = import.meta.env.VITE_API_PATH_PREFIX as string | undefined

/**
 * Path prefix before resource segments (e.g. `/api/v1`).
 * Set to empty string if the API is mounted at the origin root (no `/api/v1`).
 * Default when unset: `/api/v1`.
 */
export function resolvedApiPathPrefix(): string {
  if (rawPathPrefix === undefined) return '/api/v1'
  const t = rawPathPrefix.trim()
  if (t === '' || t === '/') return ''
  const withSlash = t.startsWith('/') ? t : `/${t}`
  return withSlash.replace(/\/+$/, '')
}

/** Backend origin without trailing slash. Empty when unset. */
export const apiBaseUrl = raw?.trim().replace(/\/+$/, '') ?? ''

/** Use built-in mock dataset (no network). */
export const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true'

export const isProduction = import.meta.env.PROD

/**
 * Development only: allow relative `/api/v1/...` (e.g. Vite dev proxy or local
 * reverse proxy). Never rely on this in production.
 */
export const allowSameOriginApi =
  import.meta.env.VITE_ALLOW_SAME_ORIGIN_API === 'true'

export const uiActorId =
  (import.meta.env.VITE_UI_ACTOR_ID as string | undefined)?.trim() ?? ''

/** Product label in shell, sidebar, and mock banner. */
export const appName =
  (import.meta.env.VITE_APP_NAME as string | undefined)?.trim() || 'QSwarm'

/**
 * When non-null, the real API client must not run — show this instead of
 * opaque fetch failures.
 */
export function getApiConfigurationError(): string | null {
  if (useMockData) return null
  if (apiBaseUrl) return null

  if (isProduction) {
    return [
      'This deployment is not configured to call the QSwarm API.',
      'Set VITE_API_BASE_URL in Vercel (e.g. https://qswarm.onrender.com) and set VITE_USE_MOCK_DATA=false.',
      'Without a base URL, the UI would call same-origin /api/v1, which is empty on static hosting.',
    ].join(' ')
  }

  if (!allowSameOriginApi) {
    return [
      'Real API mode needs VITE_API_BASE_URL (no trailing slash), or enable mock data.',
      'If you intentionally proxy /api/v1 to the backend during local dev, set VITE_ALLOW_SAME_ORIGIN_API=true in .env.local.',
    ].join(' ')
  }

  return null
}
