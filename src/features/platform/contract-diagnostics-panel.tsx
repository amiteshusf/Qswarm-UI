import {
  evaluateContractCompatibility,
  fetchLiveContractMeta,
  getBundledContractInfo,
  type ContractCompatibilityResult,
} from '@/api/contract-version'
import { apiRootHref } from '@/api/http-base'
import { GENERATED_FINGERPRINT } from '@/api/generated/generated-stamp'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMockData } from '@/lib/env'
import { useEffect, useState } from 'react'

export function ContractDiagnosticsPanel() {
  const bundled = getBundledContractInfo()
  const [liveResult, setLiveResult] = useState<ContractCompatibilityResult | null>(
    null,
  )

  useEffect(() => {
    if (useMockData) {
      setLiveResult(evaluateContractCompatibility(null))
      return
    }
    let cancelled = false
    ;(async () => {
      const live = await fetchLiveContractMeta(apiRootHref())
      if (!cancelled) setLiveResult(evaluateContractCompatibility(live))
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const live = liveResult?.live

  return (
    <Card className="border-border/70 bg-surface">
      <CardHeader>
        <CardTitle className="text-base">API contract diagnostics</CardTitle>
        <p className="text-muted-foreground text-sm">
          Bundled backend contract vs live deployment metadata.
        </p>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
        <DiagRow label="Frontend build ID" value={GENERATED_FINGERPRINT.slice(0, 12)} mono />
        <DiagRow
          label="Bundled contract version"
          value={bundled.contractVersion}
        />
        <DiagRow
          label="Live contract version"
          value={live?.contractVersion ?? (useMockData ? 'mock mode' : 'checking…')}
        />
        <DiagRow
          label="Compatibility"
          value={liveResult?.status ?? 'pending'}
        />
        <DiagRow
          label="Bundled OpenAPI checksum"
          value={bundled.openapiSha256}
          mono
        />
        <DiagRow
          label="Live OpenAPI checksum"
          value={live?.openapiSha256 ?? '—'}
          mono
        />
        <DiagRow
          label="Backend git commit (bundled)"
          value={bundled.backendGitCommit}
          mono
        />
        <DiagRow
          label="Backend git commit (live)"
          value={live?.backendGitCommit ?? '—'}
          mono
        />
        <DiagRow label="Contract synced at" value={bundled.syncedAt} />
        <DiagRow
          label="Operations / routes"
          value={`${bundled.operationCount} / ${bundled.routeCount}`}
        />
      </CardContent>
    </Card>
  )
}

function DiagRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs uppercase">{label}</p>
      <p className={mono ? 'font-mono text-xs break-all' : 'font-medium'}>
        {value}
      </p>
    </div>
  )
}
