import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from 'sonner'

import { ThemeProvider } from '@/app/theme-provider'
import {
  ApiError,
  ConfigurationError,
  SchemaResponseError,
} from '@/api/errors'
import { TooltipProvider } from '@/components/ui/tooltip'

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false
  if (error instanceof ConfigurationError) return false
  if (error instanceof SchemaResponseError) return false
  if (error instanceof ApiError && (error.status === 404 || error.status === 401 || error.status === 403))
    return false
  return true
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: shouldRetryQuery,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <TooltipProvider delay={200}>
          {children}
          <Toaster richColors closeButton position="top-center" />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
