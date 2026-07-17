import type { PatchFileChange, PatchVersion, SessionDetail } from '@/api/schemas'
import { useMockData } from '@/lib/env'

/** Demo file payloads for mock / preview when API omits per-file diffs. */
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
+import { CheckoutPage } from '../pages/checkout.page'
 
 test('partial refund shows correct balance', async ({ page }) => {
-  await page.goto('/checkout')
-  await page.click('[data-testid=refund-partial]')
-  await expect(page.locator('.balance')).toHaveText('$12.00')
+  const checkout = new CheckoutPage(page)
+  await checkout.goto()
+  await checkout.requestPartialRefund()
+  await checkout.expectBalance('$12.00')
 })`,
  },
  {
    path: 'tests/e2e/pages/checkout.page.ts',
    changeType: 'created',
    summary: 'Shared checkout page object for refund flows.',
    additions: 36,
    deletions: 0,
    afterContent: `import { expect, type Page } from '@playwright/test'

export class CheckoutPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/checkout')
  }

  async requestPartialRefund() {
    await this.page.getByTestId('refund-partial').click()
  }

  async expectBalance(amount: string) {
    await expect(this.page.locator('.balance')).toHaveText(amount)
  }
}`,
  },
  {
    path: 'services/refunds/validate.ts',
    changeType: 'modified',
    summary: 'Guard against negative partial refund amounts.',
    additions: 18,
    deletions: 3,
    beforeContent: `export function validatePartialRefund(amount: number) {
  return amount > 0
}`,
    afterContent: `export function validatePartialRefund(amount: number, balance: number) {
  if (amount <= 0) return false
  if (amount > balance) return false
  return true
}`,
  },
]

const DEMO_FILES_V1: PatchFileChange[] = DEMO_FILES_V2.slice(0, 2).map((f) => ({
  ...f,
  summary: f.summary?.replace('Hardens', 'Initial pass —'),
}))

export function getPatchFiles(
  patch: PatchVersion,
  session: Pick<SessionDetail, 'id' | 'sourceRef'>,
): PatchFileChange[] {
  if (patch.files?.length) return patch.files

  if (useMockData) {
    if (patch.version >= 2) return DEMO_FILES_V2
    if (patch.version === 1) return DEMO_FILES_V1
  }

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

export function getSelectedPatch(
  patches: PatchVersion[],
  version: number,
): PatchVersion | undefined {
  return patches.find((p) => p.version === version) ?? patches[patches.length - 1]
}

export function defaultPatchVersion(patches: PatchVersion[]): number {
  return patches[patches.length - 1]?.version ?? 1
}
