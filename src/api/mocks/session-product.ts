import type { SessionBrief, SessionDetail, SessionReviewData } from '@/api/schemas'

export function buildMockSessionBrief(
  session: SessionDetail,
  repoDisplayName = 'Payments API',
): SessionBrief {
  const isPreRun =
    session.status === 'draft' || session.status === 'queued'

  return {
    sessionId: session.id,
    sessionState: {
      status: session.status,
      workflowStatus: session.workflowStatus,
      currentRoundNumber: session.currentRoundNumber ?? 0,
      nextActions: isPreRun ? ['start_automation'] : ['view_summary'],
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    },
    sourceSummary: {
      sourceSystem: 'qswarm_ui',
      sourceReference: session.sourceRef,
      caseId: session.sourceLabel ?? session.sourceRef,
      sourceTitle: session.sourceLabel ?? session.sourceRef,
      objective: `Automate and verify: ${session.sourceLabel ?? session.sourceRef}`,
      missingInformation: isPreRun
        ? ['Full test steps will be inferred at start']
        : undefined,
    },
    setup: {
      engine: session.engine,
      repositoryConnectionId: session.repoConnectionId,
      repository: {
        owner: 'acme',
        name: 'payments-api',
        displayName: repoDisplayName,
        provider: 'github',
        defaultBranch: 'main',
        baseBranch: 'main',
      },
      branchPolicyId: session.branchPolicyId,
      branchPolicy: session.branchPolicyId
        ? {
            id: session.branchPolicyId,
            name: 'Mainline QA',
            baseBranch: 'main',
            branchPattern: 'qswarm/{session}',
          }
        : undefined,
      workspaceConfigured: !isPreRun,
    },
    automationBrief: isPreRun
      ? {
          available: false,
          summary:
            'Automation plan will be generated when you start this run.',
        }
      : {
          available: true,
          planVersion: 2,
          frameworkType: 'playwright',
          targetTestFile: 'tests/e2e/checkout/refund.spec.ts',
          filesToModify: [
            'tests/e2e/checkout/refund.spec.ts',
            'tests/e2e/pages/checkout.page.ts',
          ],
          actionOnTargetTestFile: 'modify',
          summary:
            'QSwarm will harden refund validation and reuse the checkout page object.',
        },
  }
}

export function buildMockSessionReviewData(
  session: SessionDetail,
): SessionReviewData {
  const latestPatch = session.patches[session.patches.length - 1]
  const hasChanges = (latestPatch?.filesChanged ?? 0) > 0

  return {
    sessionId: session.id,
    reviewSummary: {
      currentPatchVersion: latestPatch?.version ?? 0,
      latestExecutionStatus:
        session.executions[session.executions.length - 1]?.status ?? 'pending',
      validationSummary: session.latestExecutionSummary ?? '',
      changedFilesCount: latestPatch?.filesChanged ?? 0,
      reviewState: session.status,
      workflowStatus: session.workflowStatus,
      nextActions:
        session.status === 'awaiting_review'
          ? ['request_changes', 'approve']
          : [],
    },
    changedFiles: hasChanges
      ? [
          {
            path: 'tests/e2e/checkout/refund.spec.ts',
            action: 'modify' as const,
            summary: 'Hardens partial-refund assertion and reuses page object.',
            additions: 42,
            deletions: 8,
            beforeContent: `test('partial refund', async ({ page }) => {
  await page.goto('/checkout')
})`,
            afterContent: `test('partial refund', async ({ page }) => {
  const checkout = new CheckoutPage(page)
  await checkout.goto()
})`,
            unifiedDiff:
              '-  await page.goto(\'/checkout\')\n+  const checkout = new CheckoutPage(page)',
          },
        ]
      : [],
    reviewConversation: [
      ...session.reviews.map((r) => ({
        id: r.id,
        type: 'request_revision',
        actor: 'qswarm-web',
        text: r.instruction,
        createdAt: r.createdAt,
        status: r.status,
        scope: r.scope,
        roundNumber: 1,
      })),
      ...(session.latestExecutionSummary
        ? [
            {
              id: 'exec-latest',
              type: 'execution_result',
              actor: 'system',
              text: session.latestExecutionSummary,
              createdAt: session.updatedAt,
              status: 'passed',
              roundNumber: 1,
            },
          ]
        : []),
    ],
    prInfo: session.prExternalUrl
      ? {
          status: session.prStatus ?? 'created',
          title: session.prPreviewTitle,
          externalUrl: session.prExternalUrl,
          externalId: session.prExternalId,
          body: session.prPreviewBody,
        }
      : null,
  }
}
