import { z } from 'zod'

import type { SessionMutationAction } from '@/features/sessions/session-actions'

export type FormatErrorOptions = {
  action?: SessionMutationAction
}

const INVALID_STATE_MESSAGES: Record<SessionMutationAction, string> = {
  start:
    'This run cannot be started in its current state. Refresh the page and confirm setup is complete.',
  revise:
    'Change requests are only available while the run is awaiting your review.',
  approve:
    'Approval is only available when the run is ready for your review.',
  create_pr:
    'Creating a pull request requires an approved run. Complete review and approval first.',
}

/** Extract a human-readable message from common JSON error bodies. */
export function extractBackendMessage(body: unknown): string | undefined {
  if (body == null) return undefined
  if (typeof body === 'string') {
    const t = body.trim()
    return t.length > 0 ? t.slice(0, 800) : undefined
  }
  if (typeof body !== 'object') return undefined
  const o = body as Record<string, unknown>
  if (typeof o.message === 'string' && o.message.trim()) return o.message
  if (typeof o.error === 'string' && o.error.trim()) return o.error
  if (typeof o.title === 'string' && o.title.trim()) return o.title

  const detail = o.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (detail && typeof detail === 'object') {
    const d = detail as Record<string, unknown>
    if (typeof d.message === 'string' && d.message.trim()) return d.message
    if (typeof d.msg === 'string' && d.msg.trim()) return d.msg
  }

  const err = o.error
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>
    if (typeof e.message === 'string' && e.message.trim()) return e.message.trim()
    const details = e.details
    if (Array.isArray(details) && details.length > 0) {
      const parts = details.map((item) => {
        if (!item || typeof item !== 'object') return String(item)
        const row = item as Record<string, unknown>
        if (typeof row.msg === 'string' && row.msg.trim()) {
          const loc = Array.isArray(row.loc) ? row.loc.join('.') : ''
          return loc ? `${loc}: ${row.msg}` : String(row.msg)
        }
        try {
          return JSON.stringify(item)
        } catch {
          return String(item)
        }
      })
      const joined = parts.filter(Boolean).join('; ')
      if (joined.length > 0) return joined.slice(0, 1200)
    }
  }

  if (Array.isArray(o.detail)) {
    const parts = o.detail.map((item) => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object' && 'msg' in item)
        return String((item as { msg: unknown }).msg)
      try {
        return JSON.stringify(item)
      } catch {
        return String(item)
      }
    })
    const joined = parts.filter(Boolean).join('; ')
    return joined.length > 0 ? joined : undefined
  }
  return undefined
}

/** Best-effort error code from structured API bodies (e.g. FastAPI detail dict). */
export function extractBackendErrorCode(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined
  const o = body as Record<string, unknown>
  if (typeof o.code === 'string' && o.code.trim()) return o.code.trim()
  const detail = o.detail
  if (detail && typeof detail === 'object' && 'code' in detail) {
    const c = (detail as { code: unknown }).code
    if (typeof c === 'string' && c.trim()) return c.trim()
  }
  const err = o.error
  if (err && typeof err === 'object' && 'code' in err) {
    const c = (err as { code: unknown }).code
    if (typeof c === 'string' && c.trim()) return c.trim()
  }
  return undefined
}

export class ConfigurationError extends Error {
  readonly kind = 'configuration' as const
  constructor(message: string) {
    super(message)
    this.name = 'ConfigurationError'
  }
}

export class NetworkApiError extends Error {
  readonly kind = 'network' as const
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'NetworkApiError'
  }
}

export class SchemaResponseError extends Error {
  readonly kind = 'schema' as const
  readonly zodIssues: z.ZodIssue[]
  readonly resourceLabel: string

  constructor(
    message: string,
    zodError: z.ZodError,
    resourceLabel: string,
  ) {
    super(message)
    this.name = 'SchemaResponseError'
    this.zodIssues = zodError.issues
    this.resourceLabel = resourceLabel
  }
}

export class ApiError extends Error {
  readonly kind = 'http' as const
  readonly status: number
  readonly body?: unknown
  /** Short summary suitable for toasts and alert titles. */
  readonly summary: string

  constructor(summary: string, status: number, body?: unknown) {
    super(summary)
    this.name = 'ApiError'
    this.summary = summary
    this.status = status
    this.body = body
  }
}

export function formatErrorForToast(
  error: unknown,
  options?: FormatErrorOptions,
): string {
  if (error instanceof ConfigurationError) return error.message
  if (error instanceof NetworkApiError) return error.message
  if (error instanceof SchemaResponseError) return error.message
  if (error instanceof ApiError) {
    const code = extractBackendErrorCode(error.body)
    if (code === 'revision_no_material_change') {
      return 'Copilot did not change any files in the requested scope. Try broader instructions or a different scope.'
    }
    if (code === 'invalid_state') {
      if (error.status === 409) {
        if (options?.action) {
          return INVALID_STATE_MESSAGES[options.action]
        }
        return 'This action is not allowed in the current session state. Refresh the page and try the suggested next step.'
      }
    }
    if (code) return `${code}: ${error.summary}`
    return error.summary
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}

export function formatErrorTechnicalDetail(error: Error): string {
  if (error instanceof SchemaResponseError) {
    return JSON.stringify(
      { resource: error.resourceLabel, issues: error.zodIssues },
      null,
      2,
    )
  }
  if (error instanceof ApiError) {
    const body =
      error.body === undefined
        ? undefined
        : typeof error.body === 'string'
          ? error.body
          : JSON.stringify(error.body, null, 2)
    return [`HTTP ${error.status}`, body].filter(Boolean).join('\n\n')
  }
  if (error instanceof NetworkApiError && error.cause instanceof Error) {
    return [error.message, `Cause: ${error.cause.message}`].join('\n\n')
  }
  return error.stack ?? error.message
}
