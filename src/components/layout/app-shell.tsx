import { motion } from 'framer-motion'
import { Outlet } from 'react-router-dom'

import { AppSidebar } from '@/components/layout/app-sidebar'
import { MobileNav } from '@/components/layout/nav-extras'
import { TopBar } from '@/components/layout/top-bar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  allowSameOriginApi,
  apiBaseUrl,
  appName,
  getApiConfigurationError,
  isProduction,
  resolvedApiPathPrefix,
  useMockData,
} from '@/lib/env'
import { cn } from '@/lib/utils'

export function AppShell() {
  const configError = getApiConfigurationError()
  const mockInProd = isProduction && useMockData

  return (
    <div className="theme bg-background text-foreground flex min-h-svh w-full">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <MobileNav />
        {configError ? (
          <div
            className={cn(
              'border-b border-destructive/50 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive',
            )}
          >
            <p className="font-medium">API configuration</p>
            <p className="text-destructive/90 mt-1 text-xs leading-relaxed">
              {configError}
            </p>
          </div>
        ) : null}
        {mockInProd ? (
          <div
            className={cn(
              'border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-950 dark:text-amber-100',
            )}
          >
            <strong className="font-semibold">Mock data is enabled in production.</strong>{' '}
            Set <code className="rounded bg-background/60 px-1">VITE_USE_MOCK_DATA=false</code>{' '}
            and configure <code className="rounded bg-background/60 px-1">VITE_API_BASE_URL</code>{' '}
            for live API calls.
          </div>
        ) : null}
        {!isProduction && useMockData ? (
          <div
            className={cn(
              'border-b border-border/80 bg-muted/40 px-4 py-2 text-center text-xs text-muted-foreground',
            )}
          >
            Mock API enabled ({appName} sample data). For a real backend, set{' '}
            <code className="text-foreground">VITE_USE_MOCK_DATA=false</code> and{' '}
            <code className="text-foreground">VITE_API_BASE_URL</code> (see README).
          </div>
        ) : null}
        {!isProduction && !useMockData && apiBaseUrl ? (
          <div className="border-b border-border/80 bg-primary/5 px-4 py-2 text-center text-xs text-muted-foreground">
            Dev · API{' '}
            <code className="text-foreground">
              {apiBaseUrl}
              {resolvedApiPathPrefix() || '(root)'}
            </code>
          </div>
        ) : null}
        {!isProduction &&
        !useMockData &&
        !apiBaseUrl &&
        allowSameOriginApi ? (
          <div className="border-b border-border/80 bg-muted/40 px-4 py-2 text-center text-xs text-muted-foreground">
            Dev · Same-origin API base{' '}
            <code className="text-foreground">
              {resolvedApiPathPrefix() || '/'}
            </code>{' '}
            (via{' '}
            <code className="text-foreground">VITE_ALLOW_SAME_ORIGIN_API=true</code>).
          </div>
        ) : null}
        <ScrollArea className="flex-1">
          <motion.main
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8"
          >
            <Outlet />
          </motion.main>
        </ScrollArea>
      </div>
    </div>
  )
}
