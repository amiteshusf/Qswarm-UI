import type {
  AutomationBacklogTestCase,
  RequirementAnalysis,
  TestDesignPlan,
  TestDesignReviewData,
} from '@/api/schemas'
import type {
  ArtifactVersionRef,
  TestCaseRegistryRecord,
  TestDesignReviewDataWire,
} from '@/api/wire-schemas'

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

export function artifactRefToRequirementAnalysis(
  runId: string,
  storyKey: string,
  ref: ArtifactVersionRef,
): RequirementAnalysis {
  const content = asRecord(ref.content)
  const gapsRaw = content.gaps
  const acRaw = content.acceptanceCriteria

  return {
    runId,
    storyKey,
    storyTitle: String(content.storyTitle ?? content.title ?? storyKey),
    summary: typeof content.summary === 'string' ? content.summary : undefined,
    acceptanceCriteria: Array.isArray(acRaw)
      ? acRaw.map((row, index) => {
          const item = asRecord(row)
          return {
            id: String(item.id ?? `ac-${index + 1}`),
            text: String(item.text ?? item.description ?? ''),
            covered:
              typeof item.covered === 'boolean' ? item.covered : undefined,
          }
        })
      : undefined,
    businessRules: Array.isArray(content.businessRules)
      ? content.businessRules.map(String)
      : undefined,
    gaps: Array.isArray(gapsRaw)
      ? gapsRaw.map((row, index) => {
          const item = asRecord(row)
          return {
            id: String(item.id ?? `gap-${index + 1}`),
            description: String(item.description ?? item.text ?? ''),
            severity:
              item.severity === 'high' ||
              item.severity === 'medium' ||
              item.severity === 'low'
                ? item.severity
                : undefined,
          }
        })
      : undefined,
    dependencies: Array.isArray(content.dependencies)
      ? content.dependencies.map(String)
      : undefined,
    assumptions: Array.isArray(content.assumptions)
      ? content.assumptions.map(String)
      : undefined,
    risks: Array.isArray(content.risks)
      ? content.risks.map(String)
      : undefined,
    proposedScope:
      typeof content.proposedScope === 'string'
        ? content.proposedScope
        : undefined,
    readinessStatus:
      content.readinessStatus === 'ready' ||
      content.readinessStatus === 'needs_clarification' ||
      content.readinessStatus === 'blocked'
        ? content.readinessStatus
        : undefined,
    missingInformation: Array.isArray(content.missingInformation)
      ? content.missingInformation.map(String)
      : undefined,
  }
}

export function artifactRefToTestDesignPlan(
  runId: string,
  ref: ArtifactVersionRef,
): TestDesignPlan {
  const content = asRecord(ref.content)
  return {
    runId,
    version: ref.version,
    versionId: ref.artifactId,
    functionalAreas: Array.isArray(content.functionalAreas)
      ? content.functionalAreas.map(String)
      : undefined,
    positiveScenarios: Array.isArray(content.positiveScenarios)
      ? content.positiveScenarios.map(String)
      : undefined,
    negativeScenarios: Array.isArray(content.negativeScenarios)
      ? content.negativeScenarios.map(String)
      : undefined,
    boundaryCoverage: Array.isArray(content.boundaryCoverage)
      ? content.boundaryCoverage.map(String)
      : undefined,
    dataVariations: Array.isArray(content.dataVariations)
      ? content.dataVariations.map(String)
      : undefined,
    automationCandidates: Array.isArray(content.automationCandidates)
      ? content.automationCandidates.map(String)
      : undefined,
    exclusions: Array.isArray(content.exclusions)
      ? content.exclusions.map(String)
      : undefined,
    traceability: Array.isArray(content.traceability)
      ? content.traceability.map((row, index) => {
          const item = asRecord(row)
          return {
            acceptanceCriteriaId: String(
              item.acceptanceCriteriaId ?? item.id ?? `ac-${index + 1}`,
            ),
            coverage: String(item.coverage ?? ''),
          }
        })
      : undefined,
    estimatedCaseCount:
      typeof content.estimatedCaseCount === 'number'
        ? content.estimatedCaseCount
        : undefined,
    summary: typeof content.summary === 'string' ? content.summary : undefined,
  }
}

export function adaptTestDesignReviewData(
  wire: TestDesignReviewDataWire,
): TestDesignReviewData {
  const summary = wire.reviewSummary
  return {
    runId: wire.workflowRunId,
    reviewSummary: {
      currentVersion: summary.currentVersion,
      currentVersionId: summary.currentVersionId,
      totalCases: summary.testCaseCount,
      automationCandidateCount: summary.automationCandidateCount,
      gapsRemaining: summary.gapsCount,
      traceabilityCoverage: summary.traceabilityCoverage,
      reviewState: summary.status,
      workflowStatus: summary.workflowStatus,
      nextActions: summary.nextActions,
    },
    testCases: wire.testCases.map((tc, index) => ({
      id: tc.id,
      draftId: tc.registryKey ?? tc.externalId ?? undefined,
      version: tc.versionNumber ?? summary.currentVersion ?? undefined,
      title: tc.title ?? `Test case ${index + 1}`,
      objective: tc.objective ?? undefined,
      preconditions: tc.preconditions,
      steps: tc.steps,
      expectedResults: tc.expectedResults,
      priority:
        tc.priority === 'critical' ||
        tc.priority === 'high' ||
        tc.priority === 'medium' ||
        tc.priority === 'low'
          ? tc.priority
          : undefined,
      automationCandidate: tc.automationCandidate,
      linkedAcceptanceCriteria: tc.linkedAcceptanceCriteria,
    })),
    versions: wire.versions.map((v) => ({
      version: v.versionNumber ?? v.version ?? 1,
      versionId: v.id,
      label: v.notes ?? v.versionAction ?? undefined,
      createdAt: v.createdAt ?? new Date(0).toISOString(),
      caseCount: v.caseCount,
      changeSummary: v.versionAction ?? undefined,
    })),
    reviewConversation: wire.conversation.map((msg) => ({
      id: msg.id,
      type: msg.type,
      actor: msg.actor,
      text: msg.text,
      createdAt: msg.createdAt,
      roundNumber: msg.roundNumber,
      status: msg.status,
      scope: msg.scope,
    })),
    publicationResult: wire.publication
      ? {
          destination: wire.publication.destination,
          status: wire.publication.status ?? 'unknown',
          publishedCount: wire.publication.publishedCount,
          failedCount: wire.publication.failedCount,
          readyForAutomationCount: wire.publication.readyForAutomationCount,
          items: wire.publication.records?.map((item) => ({
            externalId: item.externalId,
            externalUrl: item.externalUrl,
            title: item.title ?? '',
            status: item.status ?? 'unknown',
            testCaseId: item.testCaseId,
          })),
        }
      : null,
  }
}

function mapAutomationStatus(
  raw: string | null | undefined,
): AutomationBacklogTestCase['automationStatus'] {
  const s = String(raw ?? 'not_automated').toLowerCase()
  if (s === 'automation_ready' || s === 'not_automated' || s === 'ready') {
    return 'not_automated'
  }
  if (s === 'in_progress' || s === 'automating') return 'in_progress'
  if (s === 'automated' || s === 'complete' || s === 'completed') {
    return 'automated'
  }
  if (s === 'failed' || s === 'error') return 'failed'
  return 'not_automated'
}

export function toAutomationBacklogItem(
  record: TestCaseRegistryRecord,
): AutomationBacklogTestCase {
  const stepsPreview =
    record.steps.length > 0 ? record.steps.slice(0, 3).join(' → ') : undefined
  return {
    id: record.id,
    caseId: record.registryKey,
    title: record.title ?? record.registryKey,
    sourceSystem: record.sourceSystem ?? undefined,
    sourceReference: record.externalId ?? record.registryKey,
    storyKey: record.sourceStoryKey,
    testDesignRunId: record.workflowRunId,
    automationStatus: mapAutomationStatus(record.automationStatus),
    sessionId: record.automationSessionId,
    objective: record.objective ?? undefined,
    stepsPreview,
    approvedAt: record.publishedAt ?? undefined,
    updatedAt: record.updatedAt ?? undefined,
  }
}

export function isAutomationInProgress(
  record: TestCaseRegistryRecord,
): boolean {
  return Boolean(
    record.automationSessionId &&
      mapAutomationStatus(record.automationStatus) === 'in_progress',
  )
}
