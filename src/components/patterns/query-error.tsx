import { AlertCircle } from 'lucide-react'

import {
  ApiError,
  ConfigurationError,
  NetworkApiError,
  SchemaResponseError,
  formatErrorTechnicalDetail,
} from '@/api/errors'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

function classifyError(error: Error): { title: string; summary: string } {
  if (error instanceof ConfigurationError) {
    return {
      title: 'Configuration required',
      summary: error.message,
    }
  }
  if (error instanceof NetworkApiError) {
    return {
      title: 'Cannot reach the API',
      summary: error.message,
    }
  }
  if (error instanceof SchemaResponseError) {
    return {
      title: 'Response did not match the UI contract',
      summary: error.message,
    }
  }
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return {
        title: 'Not found',
        summary: error.summary,
      }
    }
    if (error.status === 401 || error.status === 403) {
      return {
        title: 'Access denied',
        summary: error.summary,
      }
    }
    if (error.status >= 500) {
      return {
        title: 'Server error',
        summary: error.summary,
      }
    }
    return {
      title: `Request failed (${error.status})`,
      summary: error.summary,
    }
  }
  return {
    title: 'Something went wrong',
    summary: error.message,
  }
}

export function QueryErrorAlert({
  error,
  onRetry,
}: {
  error: Error
  onRetry?: () => void
}) {
  const { title, summary } = classifyError(error)
  const technical = formatErrorTechnicalDetail(error)

  return (
    <Alert variant="destructive" className="border-destructive/40">
      <AlertCircle className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-destructive/95 text-sm leading-relaxed">{summary}</p>
        {technical && technical !== summary ? (
          <details className="text-muted-foreground group rounded-md border border-border/60 bg-background/40 p-2 text-xs">
            <summary className="cursor-pointer select-none font-medium text-foreground/80">
              Technical details
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono">
              {technical}
            </pre>
          </details>
        ) : null}
        {onRetry ? (
          <div>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          </div>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}
