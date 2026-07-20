import type {
  PatchFileChange,
  PatchVersion,
  ReviewChangedFile,
  SessionDetail,
  SessionReviewData,
} from '@/api/schemas'
import { useMockData } from '@/lib/env'

const ACTION_TO_CHANGE_TYPE: Record<
  string,
  PatchFileChange['changeType']
> = {
  modify: 'modified',
  create: 'created',
  delete: 'deleted',
  rename: 'renamed',
}

/** Map GET /review-data changed file → UI patch file shape. */
export function mapReviewChangedFile(file: ReviewChangedFile): PatchFileChange {
  return {
    path: file.path,
    changeType: file.action
      ? ACTION_TO_CHANGE_TYPE[file.action] ?? 'modified'
      : 'modified',
    summary: file.summary,
    beforeContent: file.beforeContent ?? file.previousContent,
    afterContent: file.afterContent ?? file.currentContent,
    unifiedDiff: file.unifiedDiff,
    additions: file.additions,
    deletions: file.deletions,
  }
}

export function mapReviewChangedFiles(
  files: ReviewChangedFile[] | undefined,
): PatchFileChange[] {
  if (!files?.length) return []
  return files.map(mapReviewChangedFile)
}

/** Prefer live review-data files; fall back to patch/session placeholders. */
export function resolveChangedFiles(opts: {
  reviewData?: SessionReviewData | null
  session: SessionDetail
  selectedPatch?: PatchVersion
  selectedPatchVersion: number
}): PatchFileChange[] {
  const { reviewData, session, selectedPatch, selectedPatchVersion } = opts
  const liveVersion = reviewData?.reviewSummary.currentPatchVersion ?? 0

  if (
    reviewData?.changedFiles?.length &&
    (liveVersion === 0 ||
      selectedPatchVersion === liveVersion ||
      !selectedPatch)
  ) {
    return mapReviewChangedFiles(reviewData.changedFiles)
  }

  if (selectedPatch) {
    return getPatchFilesFallback(selectedPatch, session)
  }

  return []
}

/** Demo file payloads when API omits per-file diffs (mock / legacy only). */
const DEMO_FILES_V2: PatchFileChange[] = [
  {
    path: 'tests/e2e/checkout/refund.spec.ts',
    changeType: 'modified',
    summary: 'Hardens partial-refund assertion and reuses page object.',
    additions: 42,
    deletions: 8,
    beforeContent: `import { test, expect } from '@playwright/test'

test('partial refund shows correct balance', async ({ page }) => {
  await page.goto('/checkout')
  await page.click('[data-testid=refund-partial]')
  await expect(page.locator('.balance')).toHaveText('$12.00')
})`,
    afterContent: `import { test } from '@playwright/test'
import { CheckoutPage } from '../pages/checkout.page'

test('partial refund shows correct balance', async ({ page }) => {
  const checkout = new CheckoutPage(page)
  await checkout.goto()
  await checkout.requestPartialRefund()
  await checkout.expectBalance('$12.00')
})`,
    unifiedDiff: `@@ -1,8 +1,9 @@
-import { test, expect } from '@playwright/test'
+import { test } from '@playwright/test'
+import { CheckoutPage } from '../pages/checkout.page'`,
  },
]

function getPatchFilesFallback(
  patch: PatchVersion,
  session: Pick<SessionDetail, 'id' | 'sourceRef'>,
): PatchFileChange[] {
  if (patch.files?.length) return patch.files

  if (useMockData && patch.version >= 2) return DEMO_FILES_V2

  const count = patch.filesChanged ?? 0
  if (count > 0) {
    return Array.from({ length: Math.min(count, 8) }, (_, i) => ({
      path: `src/automation/change-${patch.version}-${i + 1}.ts`,
      changeType: 'modified' as const,
      summary:
        patch.label ??
        `Changes from code revision ${patch.version} (${session.sourceRef})`,
    }))
  }

  return []
}

/** @deprecated Use resolveChangedFiles — kept for compatibility. */
export function getPatchFiles(
  patch: PatchVersion,
  session: Pick<SessionDetail, 'id' | 'sourceRef'>,
): PatchFileChange[] {
  return getPatchFilesFallback(patch, session)
}

export function getSelectedPatch(
  patches: PatchVersion[],
  version: number,
): PatchVersion | undefined {
  return patches.find((p) => p.version === version) ?? patches[patches.length - 1]
}

export function defaultPatchVersion(
  patches: PatchVersion[],
  reviewData?: SessionReviewData | null,
): number {
  const live = reviewData?.reviewSummary.currentPatchVersion
  if (live != null && live > 0) return live
  return patches[patches.length - 1]?.version ?? 1
}

export function mergeSessionWithReviewData(
  session: SessionDetail,
  reviewData?: SessionReviewData | null,
): SessionDetail {
  if (!reviewData) return session
  if (reviewData.sessionId && reviewData.sessionId !== session.id) {
    return session
  }
  const pr = reviewData.prInfo
  const summary = reviewData.reviewSummary
  return {
    ...session,
    prExternalUrl: pr?.externalUrl ?? session.prExternalUrl,
    prExternalId: pr?.externalId ?? session.prExternalId,
    prStatus: pr?.status ?? session.prStatus,
    prPreviewTitle: pr?.title ?? session.prPreviewTitle,
    prPreviewBody: pr?.body ?? session.prPreviewBody,
    latestExecutionSummary:
      summary.validationSummary?.trim() || session.latestExecutionSummary,
    patchSummary:
      summary.changedFilesCount != null && summary.changedFilesCount > 0
        ? `${summary.changedFilesCount} file${summary.changedFilesCount === 1 ? '' : 's'} changed · code revision ${summary.currentPatchVersion ?? 1}`
        : session.patchSummary,
  }
}
