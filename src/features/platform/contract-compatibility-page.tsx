import { AlertTriangle } from 'lucide-react'

import type { ContractCompatibilityResult } from '@/api/contract-version'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ContractCompatibilityPageProps = {
  result: ContractCompatibilityResult
}

export function ContractCompatibilityPage({
  result,
}: ContractCompatibilityPageProps) {
  const { bundled, live } = result

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-6">
      <Card className="border-destructive/30 max-w-2xl shadow-lg">
        <CardHeader className="space-y-3">
          <div className="text-destructive flex items-center gap-2">
            <AlertTriangle className="size-5" />
            <CardTitle className="text-xl">API contract incompatible</CardTitle>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            QSwarm UI and API versions are incompatible. Deploy matching QSwarm
            UI and API versions before continuing.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <dl className="grid gap-3 text-sm">
            <Row label="Frontend contract" value={bundled.contractVersion} />
            <Row
              label="Backend contract"
              value={live?.contractVersion ?? 'unavailable'}
            />
            <Row
              label="Frontend OpenAPI checksum"
              value={bundled.openapiSha256}
              mono
            />
            <Row
              label="Backend OpenAPI checksum"
              value={live?.openapiSha256 ?? 'unavailable'}
              mono
            />
            <Row
              label="Frontend fixture bundle checksum"
              value={bundled.fixtureBundleSha256}
              mono
            />
            <Row
              label="Backend fixture bundle checksum"
              value={live?.fixtureBundleSha256 ?? 'unavailable'}
              mono
            />
          </dl>
          {result.message ? (
            <p className="text-muted-foreground text-sm">{result.message}</p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Retry compatibility check
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[12rem_1fr]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? 'font-mono text-xs break-all' : 'font-medium'}>
        {value}
      </dd>
    </div>
  )
}
