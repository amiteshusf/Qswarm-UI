import { z } from 'zod'

import type { SessionMutationAction } from '@/features/sessions/session-actions'

export type FormatErrorOptions = {
  action?: SessionMutationAction
}

const INVALID_STATE_MESSAGES: Record<SessionMutationAction, string> = {
  prepare_plan:
    'A plan cannot be prepared in the current state. Refresh the page and try again.',
  approve_plan:
    'Plan approval is only available when a plan is ready for your review.',
  request_plan_revision:
    'Plan change requests are only available while the plan is awaiting approval.',
  start:
    'This run cannot be started in its current state. Approve the plan first, then try again.',
  revise:
    'Change requests are only available while the run is awaiting your review.',
  approve:
    'Output approval is only available when automation output is ready for review.',
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

export type NormalizedApiError = {
  status: number
  code?: string
  message: string
  action?: string
  currentStage?: string
  allowedActions?: string[]
  retryable?: boolean
  context?: Record<string, unknown>
  requestId?: string
  operationId?: string
}

/** Normalize canonical backend error bodies into a stable frontend shape. */
export function normalizeApiError(
  status: number,
  body: unknown,
  meta?: { requestId?: string; operationId?: string },
): NormalizedApiError {
  const message =
    extractBackendMessage(body) ?? `Request failed with status ${status}`
  const code = extractBackendErrorCode(body)
  const detail =
    body && typeof body === 'object' && 'detail' in body
      ? (body as { detail: unknown }).detail
      : undefined
  const detailObj =
    detail && typeof detail === 'object' && !Array.isArray(detail)
      ? (detail as Record<string, unknown>)
      : undefined
  const errObj =
    body && typeof body === 'object' && 'error' in body
      ? (body as { error: unknown }).error
      : undefined
  const errorRecord =
    errObj && typeof errObj === 'object'
      ? (errObj as Record<string, unknown>)
      : undefined

  return {
    status,
    code: code ?? (typeof errorRecord?.code === 'string' ? errorRecord.code : undefined),
    message,
    action:
      typeof detailObj?.action === 'string' ? detailObj.action : undefined,
    currentStage:
      typeof detailObj?.currentStage === 'string'
        ? detailObj.currentStage
        : undefined,
    allowedActions: Array.isArray(detailObj?.allowedActions)
      ? detailObj.allowedActions.map(String)
      : undefined,
    retryable:
      typeof detailObj?.retryable === 'boolean' ? detailObj.retryable : undefined,
    context:
      detailObj?.context && typeof detailObj.context === 'object'
        ? (detailObj.context as Record<string, unknown>)
        : undefined,
    requestId: meta?.requestId,
    operationId: meta?.operationId,
  }
}

export class ApiError extends Error {
  readonly kind = 'http' as const
  readonly status: number
  readonly body?: unknown
  /** Short summary suitable for toasts and alert titles. */
  readonly summary: string
  readonly normalized: NormalizedApiError

  constructor(
    summary: string,
    status: number,
    body?: unknown,
    meta?: { requestId?: string; operationId?: string },
  ) {
    super(summary)
    this.name = 'ApiError'
    this.summary = summary
    this.status = status
    this.body = body
    this.normalized = normalizeApiError(status, body, meta)
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
    const lines = error.zodIssues.map((issue) => {
      const path =
        issue.path.length > 0 ? issue.path.map(String).join('.') : '(root)'
      const parts = [`path: ${path}`, `code: ${issue.code}`, `message: ${issue.message}`]
      if ('expected' in issue && issue.expected !== undefined) {
        parts.push(`expected: ${String(issue.expected)}`)
      }
      if ('received' in issue && issue.received !== undefined) {
        parts.push(`received: ${String(issue.received)}`)
      } else if ('input' in issue && issue.input !== undefined) {
        parts.push(`received: ${JSON.stringify(issue.input)}`)
      } else {
        const receivedMatch = issue.message.match(/received (.+)$/i)
        if (receivedMatch?.[1]) {
          parts.push(`received: ${receivedMatch[1]}`)
        }
      }
      return parts.join('\n  ')
    })
    return [`resource: ${error.resourceLabel}`, '', ...lines].join('\n')
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
