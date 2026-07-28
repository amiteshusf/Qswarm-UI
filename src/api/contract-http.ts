import {
  backendOperations,
  type OperationId,
} from '@/api/generated/backend-routes'
import { apiRootHref } from '@/api/http-base'
import { sessionActorId } from '@/lib/env'

export function buildOperationPath(
  operationId: OperationId,
  pathParams: Record<string, string> = {},
): string {
  const template = backendOperations[operationId].pathTemplate
  return template.replace(/\{([^}]+)\}/g, (_, key: string) =>
    encodeURIComponent(pathParams[key] ?? ''),
  )
}

export function operationHref(
  operationId: OperationId,
  pathParams: Record<string, string> = {},
  query?: Record<string, string | number | null | undefined>,
): string {
  const root = apiRootHref()
  const path = buildOperationPath(operationId, pathParams)
  const suffix = path.replace(/^\/api\/v1/, '')
  const base = root.endsWith('/')
    ? `${root.slice(0, -1)}${suffix}`
    : `${root}${suffix}`
  if (!query) return base
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value == null || value === '') continue
    params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

export function actorQuery(): Record<string, string> {
  return { actor_id: sessionActorId() }
}

export function getOperationMethod(operationId: OperationId): string {
  return backendOperations[operationId].method
}
