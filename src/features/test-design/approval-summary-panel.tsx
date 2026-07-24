import type { TestDesignReviewData } from '@/api/schemas'
import { MetricTile } from '@/components/patterns/metric-tile'
import { ClipboardCheck, ListChecks, Target, TriangleAlert } from 'lucide-react'

type Props = {
  reviewData: TestDesignReviewData
}

export function ApprovalSummaryPanel({ reviewData }: Props) {
  const summary = reviewData.reviewSummary

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm leading-relaxed">
        Review the summary below. Approving locks the current test design for
        publication to your connected test management system.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="Total cases"
          value={summary.totalCases ?? 0}
          icon={ListChecks}
        />
        <MetricTile
          label="Automation candidates"
          value={summary.automationCandidateCount ?? 0}
          icon={Target}
          variant="active"
        />
        <MetricTile
          label="Gaps remaining"
          value={summary.gapsRemaining ?? 0}
          icon={TriangleAlert}
          variant={(summary.gapsRemaining ?? 0) > 0 ? 'attention' : 'default'}
        />
        <MetricTile
          label="Traceability"
          value={summary.traceabilityCoverage ?? '—'}
          icon={ClipboardCheck}
        />
      </div>
    </div>
  )
}
