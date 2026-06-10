import { AlertCircle } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/api/client'

export function QueryErrorAlert({
  error,
  onRetry,
}: {
  error: Error
  onRetry?: () => void
}) {
  const detail =
    error instanceof ApiError
      ? typeof error.body === 'string'
        ? error.body
        : JSON.stringify(error.body ?? {})
      : error.message

  return (
    <Alert variant="destructive" className="border-destructive/40">
      <AlertCircle className="size-4" />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-destructive/90 font-mono text-xs break-all">
          {detail}
        </span>
        {onRetry ? (
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}
