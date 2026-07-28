import syncMetadata from '@/api/backend-contract/sync-metadata.json'
import {
  backendOperations,
  GENERATED_CONTRACT_VERSION,
  type OperationId,
} from '@/api/generated/backend-routes'

export type ContractCompatibilityStatus =
  | 'compatible'
  | 'compatible_additive'
  | 'incompatible'
  | 'unknown'

export type BundledContractInfo = {
  contractVersion: string
  backendGitCommit: string
  openapiSha256: string
  fixtureBundleSha256: string
  syncedAt: string
  operationCount: number
  routeCount: number
}

export type LiveContractInfo = {
  contractVersion: string
  compatibleFrontendContract?: string
  openapiSha256?: string
  fixtureBundleSha256?: string
  backendGitCommit?: string
}

export type ContractCompatibilityResult = {
  status: ContractCompatibilityStatus
  bundled: BundledContractInfo
  live: LiveContractInfo | null
  message?: string
}

export function getBundledContractInfo(): BundledContractInfo {
  return {
    contractVersion: syncMetadata.contractVersion,
    backendGitCommit: syncMetadata.backendGitCommit,
    openapiSha256: syncMetadata.openapiSha256,
    fixtureBundleSha256: syncMetadata.fixtureBundleSha256,
    syncedAt: syncMetadata.syncedAt,
    operationCount: syncMetadata.operationCount,
    routeCount: syncMetadata.routeCount,
  }
}

export function evaluateContractCompatibility(
  live: LiveContractInfo | null | undefined,
): ContractCompatibilityResult {
  const bundled = getBundledContractInfo()

  if (!live?.contractVersion) {
    return {
      status: 'unknown',
      bundled,
      live: live ?? null,
      message:
        'Live backend contract metadata is unavailable. Deploy matching API or enable mock mode.',
    }
  }

  const versionMatch = live.contractVersion === bundled.contractVersion
  const openapiMatch =
    !live.openapiSha256 || live.openapiSha256 === bundled.openapiSha256
  const fixtureMatch =
    !live.fixtureBundleSha256 ||
    live.fixtureBundleSha256 === bundled.fixtureBundleSha256
  const compatibleFrontend =
    live.compatibleFrontendContract === bundled.contractVersion

  if (versionMatch && openapiMatch && fixtureMatch) {
    return { status: 'compatible', bundled, live }
  }

  if (
    compatibleFrontend ||
    (versionMatch && (openapiMatch || fixtureMatch))
  ) {
    return {
      status: 'compatible_additive',
      bundled,
      live,
      message:
        'Backend contract differs slightly but declares frontend compatibility.',
    }
  }

  return {
    status: 'incompatible',
    bundled,
    live,
    message: 'Frontend and backend contract versions or checksums do not match.',
  }
}

export async function fetchLiveContractMeta(
  apiRoot: string,
): Promise<LiveContractInfo | null> {
  try {
    const res = await fetch(`${apiRoot}/meta/contract`)
    if (!res.ok) return null
    const data = (await res.json()) as Record<string, unknown>
    return {
      contractVersion: String(
        data.contractVersion ?? data.version ?? '',
      ),
      compatibleFrontendContract:
        typeof data.compatibleFrontendContract === 'string'
          ? data.compatibleFrontendContract
          : undefined,
      openapiSha256:
        typeof data.openapiSha256 === 'string'
          ? data.openapiSha256
          : undefined,
      fixtureBundleSha256:
        typeof data.fixtureBundleSha256 === 'string'
          ? data.fixtureBundleSha256
          : undefined,
      backendGitCommit:
        typeof data.backendGitCommit === 'string'
          ? data.backendGitCommit
          : undefined,
    }
  } catch {
    return null
  }
}

export const FRONTEND_BUNDLED_CONTRACT_VERSION = GENERATED_CONTRACT_VERSION

export function getOperationPathTemplate(id: OperationId): string {
  return backendOperations[id].pathTemplate
}
