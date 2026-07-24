import { useMemo, useState } from 'react'

import type { TestCaseDraft, TestDesignReviewData } from '@/api/schemas'
import { TestCaseDetailPanel } from '@/features/test-design/test-case-detail-panel'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

type FilterTab = 'all' | 'automation' | 'critical' | 'negative'

type Props = {
  reviewData: TestDesignReviewData
  selectedVersion?: number
  onVersionChange?: (version: number) => void
  className?: string
}

export function TestCaseReviewWorkspace({
  reviewData,
  selectedVersion,
  onVersionChange,
  className,
}: Props) {
  const [tab, setTab] = useState<FilterTab>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const version =
    selectedVersion ?? reviewData.reviewSummary.currentVersion ?? 1

  const cases = useMemo(() => {
    let items = reviewData.testCases.filter(
      (tc) => !tc.version || tc.version === version,
    )
    if (tab === 'automation') {
      items = items.filter((tc) => tc.automationCandidate)
    } else if (tab === 'critical') {
      items = items.filter((tc) => tc.priority === 'critical' || tc.priority === 'high')
    } else if (tab === 'negative') {
      items = items.filter((tc) => tc.type === 'negative')
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      items = items.filter(
        (tc) =>
          tc.title.toLowerCase().includes(q) ||
          tc.draftId?.toLowerCase().includes(q),
      )
    }
    return items
  }, [reviewData.testCases, version, tab, search])

  const selected =
    cases.find((tc) => tc.id === selectedId) ?? cases[0] ?? null

  const versionMeta = reviewData.versions.find((v) => v.version === version)

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Version {version}</Badge>
          {versionMeta?.changeSummary ? (
            <span className="text-muted-foreground text-xs">
              {versionMeta.changeSummary}
            </span>
          ) : null}
        </div>
        {reviewData.versions.length > 1 && onVersionChange ? (
          <Select
            value={String(version)}
            onValueChange={(v) => onVersionChange(Number(v))}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {reviewData.versions.map((v) => (
                <SelectItem key={v.version} value={String(v.version)}>
                  {v.label ?? `Version ${v.version}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="critical">High priority</TabsTrigger>
            <TabsTrigger value="negative">Negative</TabsTrigger>
          </TabsList>
        </Tabs>
        <input
          type="search"
          placeholder="Search cases…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-border/70 bg-background h-9 w-full rounded-lg border px-3 text-sm sm:w-56"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="border-border/70 bg-surface max-h-[520px] overflow-y-auto rounded-2xl border lg:col-span-2">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 sticky top-0">
              <tr className="text-muted-foreground text-left text-xs">
                <th className="px-3 py-2 font-medium">Case</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">
                  Type
                </th>
              </tr>
            </thead>
            <tbody>
              {cases.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="text-muted-foreground px-3 py-8 text-center text-sm"
                  >
                    No test cases match this filter.
                  </td>
                </tr>
              ) : (
                cases.map((tc) => (
                  <TestCaseRow
                    key={tc.id}
                    testCase={tc}
                    selected={selected?.id === tc.id}
                    onSelect={() => setSelectedId(tc.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="lg:col-span-3">
          {selected ? (
            <TestCaseDetailPanel testCase={selected} />
          ) : (
            <div className="text-muted-foreground border-border/60 rounded-2xl border border-dashed px-6 py-12 text-center text-sm">
              Select a test case to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TestCaseRow({
  testCase,
  selected,
  onSelect,
}: {
  testCase: TestCaseDraft
  selected: boolean
  onSelect: () => void
}) {
  return (
    <tr
      className={cn(
        'hover:bg-muted/20 cursor-pointer border-t transition-colors',
        selected && 'bg-swarm/8',
      )}
      onClick={onSelect}
    >
      <td className="px-3 py-2.5">
        <p className="font-medium">{testCase.title}</p>
        <p className="text-muted-foreground font-mono text-[10px]">
          {testCase.draftId ?? testCase.id}
        </p>
      </td>
      <td className="text-muted-foreground hidden px-3 py-2.5 sm:table-cell">
        {testCase.type ?? '—'}
      </td>
    </tr>
  )
}
