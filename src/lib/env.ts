const raw = import.meta.env.VITE_API_BASE_URL as string | undefined

/** Backend origin without trailing slash. Empty when unset. */
export const apiBaseUrl = raw?.replace(/\/+$/, '') ?? ''

/** Use built-in mock dataset (no network). */
export const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true'

export const appName = 'QSwarm'
