import { useEffect, useState } from 'react'

import {
  evaluateContractCompatibility,
  fetchLiveContractMeta,
  type ContractCompatibilityResult,
} from '@/api/contract-version'
import { apiRootHref } from '@/api/http-base'
import { ContractCompatibilityPage } from '@/features/platform/contract-compatibility-page'
import { useMockData } from '@/lib/env'

type GateState =
  | { phase: 'loading' }
  | { phase: 'ready'; result: ContractCompatibilityResult }

export function ContractGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>(
    useMockData ? { phase: 'ready', result: evaluateContractCompatibility(null) } : { phase: 'loading' },
  )

  useEffect(() => {
    if (useMockData) return

    let cancelled = false
    ;(async () => {
      const live = await fetchLiveContractMeta(apiRootHref())
      if (cancelled) return
      setState({
        phase: 'ready',
        result: evaluateContractCompatibility(live),
      })
    })()

    return () => {
      cancelled = true
    }
  }, [])

  if (state.phase === 'loading') {
    return (
      <div className="bg-background text-muted-foreground flex min-h-screen items-center justify-center text-sm">
        Verifying API contract compatibility…
      </div>
    )
  }

  const { result } = state

  if (result.status === 'incompatible' || result.status === 'unknown') {
    return <ContractCompatibilityPage result={result} />
  }

  return (
    <>
      {result.status === 'compatible_additive' ? (
        <div
          className="border-status-awaiting/30 bg-status-awaiting/10 text-status-awaiting border-b px-4 py-2 text-center text-xs"
          role="status"
        >
          {result.message ??
            'Backend contract metadata differs from the bundled frontend contract.'}
        </div>
      ) : null}
      {children}
    </>
  )
}
