import { z } from 'zod'

const SESSION_STATUS_VALUES = [
  'draft',
  'plan_ready',
  'queued',
  'running',
  'awaiting_review',
  'revising',
  'succeeded',
  'failed',
  'cancelled',
] as const

function coerceSessionStatus(raw: unknown): (typeof SESSION_STATUS_VALUES)[number] {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase()
  if ((SESSION_STATUS_VALUES as readonly string[]).includes(s))
    return s as (typeof SESSION_STATUS_VALUES)[number]
  if (s === 'pending') return 'draft'
  if (s === 'plan_ready') return 'plan_ready'
  if (
    s === 'planning' ||
    s === 'generating' ||
    s === 'executing' ||
    s === 'creating_pr'
  )
    return 'running'
  if (s === 'approved_for_pr') return 'awaiting_review'
  if (s === 'pr_created' || s === 'complete') return 'succeeded'
  if (s === 'pr_failed') return 'failed'
  return 'draft'
}

/** UI session lifecycle; accepts common backend/BFF synonyms. */
export const sessionStatusSchema = z
  .union([z.enum(SESSION_STATUS_VALUES), z.string()])
  .transform((v) => coerceSessionStatus(v))

/**
 * Repository connection as returned by GET/PATCH/POST `/api/v1/repo-connections`.
 * Live backend (`qswarm.onrender.com`): list is `{ items: [...] }`; rows use camelCase;
 * `credentialReference` may be null (e.g. SSH); writes use `owner`/`repo`/`authRef`.
 */
export const repoConnectionSchema = z.object({
  id: z.string(),
  provider: z.string(),
  ownerOrOrg: z.string(),
  repoName: z.string(),
  projectOrWorkspace: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
  cloneUrl: z.string().nullable().optional(),
  defaultBranch: z.string(),
  authType: z.string().optional(),
  credentialReference: z.string().nullable(),
  isActive: z.boolean().optional(),
  createdBy: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const branchPolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  baseBranch: z.string(),
  branchPattern: z.string(),
  prTitleTemplate: z.string(),
  prBodyTemplate: z.string(),
  repoConnectionId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const EXECUTION_STATUSES = ['pending', 'running', 'passed', 'failed', 'skipped'] as const

function coerceExecutionStatus(raw: unknown): (typeof EXECUTION_STATUSES)[number] {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase()
  if ((EXECUTION_STATUSES as readonly string[]).includes(s))
    return s as (typeof EXECUTION_STATUSES)[number]
  if (s === 'success' || s === 'completed') return 'passed'
  if (s === 'error' || s === 'failure') return 'failed'
  return 'pending'
}

export const executionAttemptSchema = z.object({
  id: z.string(),
  roundNumber: z.coerce.number(),
  status: z
    .union([z.enum(EXECUTION_STATUSES), z.string()])
    .transform((v) => coerceExecutionStatus(v)),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  summary: z.string().optional(),
  exitCode: z.number().nullable().optional(),
})

export const patchFileChangeSchema = z.object({
  path: z.string(),
  changeType: z
    .enum(['modified', 'created', 'deleted', 'renamed'])
    .optional(),
  summary: z.string().optional(),
  beforeContent: z.string().optional(),
  afterContent: z.string().optional(),
  unifiedDiff: z.string().optional(),
  additions: z.coerce.number().optional(),
  deletions: z.coerce.number().optional(),
})

export const patchVersionSchema = z.object({
  id: z.string(),
  version: z.coerce.number(),
  label: z.string().optional(),
  createdAt: z.string(),
  filesChanged: z.coerce.number().optional(),
  additions: z.coerce.number().optional(),
  deletions: z.coerce.number().optional(),
  /** Per-file diffs when backend provides them (optional). */
  files: z.array(patchFileChangeSchema).optional(),
})

const ROUND_STATUSES = ['planned', 'active', 'complete', 'failed'] as const

function coerceRoundStatus(raw: unknown): (typeof ROUND_STATUSES)[number] {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
  if ((ROUND_STATUSES as readonly string[]).includes(s))
    return s as (typeof ROUND_STATUSES)[number]
  if (s === 'in_progress' || s === 'running') return 'active'
  if (s === 'completed' || s === 'done' || s === 'success') return 'complete'
  if (s === 'failed' || s === 'error') return 'failed'
  return 'planned'
}

export const roundSchema = z.object({
  id: z.string(),
  number: z.coerce.number(),
  title: z.string(),
  status: z
    .union([z.enum(ROUND_STATUSES), z.string()])
    .transform((v) => coerceRoundStatus(v)),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  notes: z.string().optional(),
})

const REVIEW_STATUSES = ['open', 'addressed', 'dismissed'] as const

function coerceReviewStatus(raw: unknown): (typeof REVIEW_STATUSES)[number] {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase()
  if ((REVIEW_STATUSES as readonly string[]).includes(s))
    return s as (typeof REVIEW_STATUSES)[number]
  if (s === 'recorded' || s === 'pending') return 'open'
  if (s === 'applied' || s === 'resolved') return 'addressed'
  if (s === 'failed' || s === 'rejected') return 'dismissed'
  return 'open'
}

export const reviewRequestSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  instruction: z.string(),
  scope: z.string().optional(),
  status: z
    .union([z.enum(REVIEW_STATUSES), z.string()])
    .transform((v) => coerceReviewStatus(v)),
})

/** Session row in list, dashboard recentSessions, and detail header fields. */
export const sessionSummarySchema = z.object({
  id: z.string(),
  status: sessionStatusSchema,
  /** Raw backend session status (e.g. planning, generating, pr_created). */
  workflowStatus: z.string().optional(),
  engine: z.string(),
  repoConnectionId: z.string(),
  sourceRef: z.string(),
  sourceLabel: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  branchPolicyId: z.string().optional(),
  approvedCaseId: z.string().optional(),
  jobStatus: z.string().optional(),
  currentRoundNumber: z.coerce.number().optional(),
})

export const sessionDetailSchema = sessionSummarySchema.extend({
  repoConnectionId: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (v == null || v === '' ? '' : String(v))),
  branchPolicyId: z.string().nullish().transform((v) => v ?? undefined),
  rounds: z.array(roundSchema).default([]),
  patches: z.array(patchVersionSchema).default([]),
  executions: z.array(executionAttemptSchema).default([]),
  reviews: z.array(reviewRequestSchema).default([]),
  latestExecutionSummary: z.string().optional(),
  patchSummary: z.string().optional(),
  prPreviewTitle: z.string().optional(),
  prPreviewBody: z.string().optional(),
  prExternalUrl: z.string().nullable().optional(),
  prExternalId: z.string().nullable().optional(),
  prStatus: z.string().nullable().optional(),
})

function normalizeSessionCountsRecord(
  raw: Record<string, number>,
): Record<z.infer<typeof sessionStatusSchema>, number> {
  const base: Record<z.infer<typeof sessionStatusSchema>, number> = {
    draft: 0,
    plan_ready: 0,
    queued: 0,
    running: 0,
    awaiting_review: 0,
    revising: 0,
    succeeded: 0,
    failed: 0,
    cancelled: 0,
  }
  for (const [k, v] of Object.entries(raw)) {
    const nk = coerceSessionStatus(k)
    base[nk] = (base[nk] ?? 0) + (typeof v === 'number' && !Number.isNaN(v) ? v : 0)
  }
  return base
}

export const dashboardSchema = z
  .object({
    sessionCounts: z.record(z.string(), z.number()),
    recentSessions: z.array(sessionSummarySchema),
    repositoryConnectionCount: z.coerce.number().optional(),
    branchPolicyCount: z.coerce.number().optional(),
    environment: z.string().optional(),
    applicationName: z.string().optional(),
  })
  .transform((d) => ({
    recentSessions: d.recentSessions,
    sessionCounts: normalizeSessionCountsRecord(d.sessionCounts),
    repositoryConnectionCount: d.repositoryConnectionCount,
    branchPolicyCount: d.branchPolicyCount,
    environment: d.environment,
    applicationName: d.applicationName,
  }))

/** GET `/api/v1/settings` — read-only deployment slice (live backend shape). */
export const settingsSchema = z.object({
  applicationName: z.string(),
  environment: z.string(),
  debug: z.boolean(),
  jira: z.object({
    useStub: z.boolean(),
    configured: z.boolean(),
  }),
  codingProvider: z.string(),
  workspaceRoot: z.string(),
  claudeCodeEnabled: z.boolean(),
  copilotAgentEnabled: z.boolean(),
  notes: z.string().optional(),
})

/**
 * Trimmed form values for repo connection create/edit (same keys as the UI).
 * Wire JSON for POST/PATCH uses `owner` / `repo` / `authRef` — see `repoConnectionFormToWire`.
 */
export const repoConnectionFormSchema = z
  .object({
    provider: z.string().min(1),
    ownerOrOrg: z.string().min(1),
    repoName: z.string().min(1),
    displayName: z.string().optional(),
    cloneUrl: z.union([z.string().url(), z.literal('')]).optional(),
    defaultBranch: z.string().min(1),
    credentialReference: z.string().min(1),
  })
  .transform((v) => ({
    provider: v.provider.trim(),
    ownerOrOrg: v.ownerOrOrg.trim(),
    repoName: v.repoName.trim(),
    displayName: v.displayName?.trim() || undefined,
    defaultBranch: v.defaultBranch.trim(),
    credentialReference: v.credentialReference.trim(),
    cloneUrl: v.cloneUrl === '' ? undefined : v.cloneUrl?.trim(),
  }))

export type RepoConnectionFormValues = z.input<typeof repoConnectionFormSchema>

/** POST/PATCH `/api/v1/repo-connections` JSON body (live backend). */
export type RepoConnectionWireBody = {
  provider: string
  owner: string
  repo: string
  authRef: string
  defaultBranch: string
  displayName?: string
  cloneUrl?: string
}

export function repoConnectionFormToWire(
  v: z.infer<typeof repoConnectionFormSchema>,
): RepoConnectionWireBody {
  return {
    provider: v.provider,
    owner: v.ownerOrOrg,
    repo: v.repoName,
    authRef: v.credentialReference,
    defaultBranch: v.defaultBranch,
    displayName: v.displayName,
    cloneUrl: v.cloneUrl,
  }
}

export const branchPolicyInputSchema = z
  .object({
    name: z.string().min(1),
    baseBranch: z.string().min(1),
    branchPattern: z.string().min(1),
    prTitleTemplate: z.string().min(1),
    prBodyTemplate: z.string().min(1),
    repoConnectionId: z.string().min(1),
  })
  .transform((v) => ({
    name: v.name.trim(),
    baseBranch: v.baseBranch.trim(),
    branchPattern: v.branchPattern.trim(),
    prTitleTemplate: v.prTitleTemplate.trim(),
    prBodyTemplate: v.prBodyTemplate.trim(),
    repoConnectionId: v.repoConnectionId.trim(),
  }))

export const sessionCreateInputSchema = z
  .object({
    repoConnectionId: z.string().min(1),
    branchPolicyId: z.string().optional(),
    engine: z.string().min(1),
    sourceRef: z.string().min(1),
    sourceLabel: z.string().optional(),
  })
  .transform((v) => ({
    repoConnectionId: v.repoConnectionId.trim(),
    branchPolicyId: v.branchPolicyId?.trim() || undefined,
    engine: v.engine.trim() || 'stub',
    sourceRef: v.sourceRef.trim(),
    sourceLabel: v.sourceLabel?.trim() || undefined,
  }))

export const revisionRequestSchema = z
  .object({
    instruction: z.string().min(1),
    scope: z.string().optional(),
  })
  .transform((v) => ({
    instruction: v.instruction.trim(),
    scope: v.scope?.trim() || undefined,
  }))

// --- Test case automation backlog ---

export const automationBacklogStatusSchema = z.enum([
  'not_automated',
  'in_progress',
  'automated',
  'failed',
])

export const automationBacklogTestCaseSchema = z.object({
  id: z.string(),
  caseId: z.string().optional(),
  title: z.string(),
  sourceSystem: z.string().optional(),
  sourceReference: z.string().optional(),
  storyKey: z.string().optional(),
  storyTitle: z.string().optional(),
  testDesignRunId: z.string().optional(),
  automationStatus: automationBacklogStatusSchema,
  targetArea: z.string().optional(),
  repoConnectionId: z.string().optional(),
  branchPolicyId: z.string().optional(),
  sessionId: z.string().nullable().optional(),
  objective: z.string().optional(),
  stepsPreview: z.string().optional(),
  approvedAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export const automationBacklogListSchema = z.object({
  items: z.array(automationBacklogTestCaseSchema),
  total: z.coerce.number().optional(),
})

export const automateTestCaseInputSchema = z
  .object({
    repositoryConnectionId: z.string().min(1),
    branchPolicyId: z.string().optional(),
    engine: z.string().min(1),
  })
  .transform((v) => ({
    repositoryConnectionId: v.repositoryConnectionId.trim(),
    branchPolicyId: v.branchPolicyId?.trim() || undefined,
    engine: v.engine.trim() || 'stub',
  }))

export type AutomateTestCaseInput = z.infer<typeof automateTestCaseInputSchema>
export type AutomateTestCaseFormValues = z.input<typeof automateTestCaseInputSchema>

// --- Session product endpoints (GET /sessions/{id}/brief, /review-data) ---

export const sessionBriefStateSchema = z.object({
  status: z.string(),
  workflowStatus: z.string().optional(),
  jobStatus: z.string().optional(),
  currentRoundNumber: z.coerce.number().optional(),
  planApproved: z.boolean().optional(),
  planApprovedAt: z.string().optional(),
  nextActions: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const sessionSourceSummarySchema = z.object({
  sourceSystem: z.string().optional(),
  sourceReference: z.string(),
  caseId: z.string().optional(),
  sourceTitle: z.string().optional(),
  objective: z.string().optional(),
  missingInformation: z.array(z.string()).optional(),
})

export const sessionBriefRepositorySchema = z.object({
  owner: z.string().optional(),
  name: z.string().optional(),
  baseBranch: z.string().optional(),
  displayName: z.string().optional(),
  provider: z.string().optional(),
  defaultBranch: z.string().optional(),
  cloneUrlRedacted: z.boolean().optional(),
})

export const sessionBriefBranchPolicySchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  baseBranch: z.string().optional(),
  branchPattern: z.string().optional(),
  prTitleTemplate: z.string().optional(),
  prBodyTemplate: z.string().optional(),
  repoConnectionId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export const sessionAutomationBriefSchema = z.object({
  available: z.boolean(),
  planVersion: z.coerce.number().optional(),
  planVersionId: z.string().optional(),
  frameworkType: z.string().optional(),
  targetTestFile: z.string().optional(),
  filesToModify: z.array(z.string()).optional(),
  actionOnTargetTestFile: z.string().optional(),
  frameworkSummary: z.record(z.string(), z.unknown()).optional(),
  repoContextSummary: z.record(z.string(), z.unknown()).optional(),
  summary: z.string().optional(),
})

export const sessionBriefSchema = z.object({
  sessionId: z.string(),
  sessionState: sessionBriefStateSchema,
  sourceSummary: sessionSourceSummarySchema,
  setup: z.object({
    engine: z.string(),
    repositoryConnectionId: z.string(),
    repository: sessionBriefRepositorySchema.optional(),
    branchPolicy: sessionBriefBranchPolicySchema.optional(),
    branchPolicyId: z.string().optional(),
    workspaceConfigured: z.boolean().optional(),
  }),
  automationBrief: sessionAutomationBriefSchema,
})

export const reviewChangedFileSchema = z.object({
  path: z.string(),
  action: z.enum(['modify', 'create', 'delete', 'rename']).optional(),
  currentContent: z.string().optional(),
  previousContent: z.string().optional(),
  beforeContent: z.string().optional(),
  afterContent: z.string().optional(),
  beforeLabel: z.string().optional(),
  afterLabel: z.string().optional(),
  isCurrent: z.boolean().optional(),
  hasDiff: z.boolean().optional(),
  contentChanged: z.boolean().optional(),
  summary: z.string().optional(),
  additions: z.coerce.number().optional(),
  deletions: z.coerce.number().optional(),
  unifiedDiff: z.string().optional(),
})

export const reviewConversationMessageSchema = z.object({
  id: z.string(),
  type: z.string(),
  actor: z.string(),
  text: z.string(),
  createdAt: z.string(),
  roundNumber: z.coerce.number().optional(),
  status: z.string().optional(),
  scope: z.string().optional(),
})

export const sessionPrInfoSchema = z
  .object({
    status: z.string().optional(),
    title: z.string().optional(),
    sourceBranch: z.string().optional(),
    targetBranch: z.string().optional(),
    provider: z.string().optional(),
    body: z.string().optional(),
    externalUrl: z.string().nullable().optional(),
    externalId: z.string().nullable().optional(),
    codeReviewRequestId: z.string().optional(),
  })
  .nullable()

export const sessionReviewSummarySchema = z.object({
  currentPatchVersion: z.coerce.number().optional(),
  currentPatchVersionId: z.string().optional(),
  latestExecutionStatus: z.string().optional(),
  validationSummary: z.string().optional(),
  changedFilesCount: z.coerce.number().optional(),
  reviewState: z.string().optional(),
  workflowStatus: z.string().optional(),
  nextActions: z.array(z.string()).optional(),
  currentPatchCreatedAt: z.string().optional(),
})

export const sessionReviewDataSchema = z.object({
  sessionId: z.string(),
  reviewSummary: sessionReviewSummarySchema,
  changedFiles: z.array(reviewChangedFileSchema).default([]),
  reviewConversation: z.array(reviewConversationMessageSchema).default([]),
  prInfo: sessionPrInfoSchema,
})

export type SessionStatus = z.infer<typeof sessionStatusSchema>
export type RepoConnection = z.infer<typeof repoConnectionSchema>
export type PatchFileChange = z.infer<typeof patchFileChangeSchema>
export type PatchVersion = z.infer<typeof patchVersionSchema>
export type BranchPolicy = z.infer<typeof branchPolicySchema>
export type SessionDetail = z.infer<typeof sessionDetailSchema>
export type SessionSummary = z.infer<typeof sessionSummarySchema>
export type Dashboard = z.infer<typeof dashboardSchema>
export type Settings = z.infer<typeof settingsSchema>
export type RepoConnectionInput = RepoConnectionWireBody
export type BranchPolicyInput = z.infer<typeof branchPolicyInputSchema>
export type SessionCreateInput = z.infer<typeof sessionCreateInputSchema>

/** Local / RHF: branch & session forms (pre-transform where applicable). */
export type BranchPolicyFormValues = z.input<typeof branchPolicyInputSchema>
export type SessionCreateFormValues = z.input<typeof sessionCreateInputSchema>
export type SessionBrief = z.infer<typeof sessionBriefSchema>
export type SessionReviewData = z.infer<typeof sessionReviewDataSchema>
export type ReviewChangedFile = z.infer<typeof reviewChangedFileSchema>
export type ReviewConversationMessage = z.infer<
  typeof reviewConversationMessageSchema
>
export type SessionPrInfo = z.infer<typeof sessionPrInfoSchema>
export type AutomationBacklogTestCase = z.infer<
  typeof automationBacklogTestCaseSchema
>
export type AutomationBacklogStatus = z.infer<typeof automationBacklogStatusSchema>

// --- Sprint 1: Jira stories & test-design runs ---

export const jiraStoryReadinessSchema = z.enum([
  'ready',
  'partial',
  'missing_ac',
])

export const jiraStoryAcceptanceCriteriaStatusSchema = z.enum([
  'ready',
  'partial',
  'missing_ac',
])

export const jiraStorySchema = z.object({
  storyKey: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.string(),
  sprint: z.string().nullable(),
  projectKey: z.string(),
  assignee: z.string().nullable(),
  readiness: jiraStoryReadinessSchema,
  acceptanceCriteriaStatus: jiraStoryAcceptanceCriteriaStatusSchema,
  missingInformation: z.array(z.string()),
  hasActiveRun: z.boolean(),
  activeRunId: z.string().nullable(),
  jiraUrl: z.string().url(),
})

export const storyListSchema = z.object({
  stories: z.array(jiraStorySchema),
  total: z.number(),
})

/** @deprecated Use storyListSchema */
export const jiraStoryListSchema = storyListSchema

const TEST_DESIGN_CURRENT_STAGES = [
  'intake_ready',
  'analyzing_requirements',
  'analysis_ready',
  'preparing_test_design_plan',
  'awaiting_plan_approval',
  'plan_revision_requested',
  'plan_approved',
  'generating_test_cases',
  'awaiting_test_case_review',
  'revising_test_cases',
  'approved',
  'publishing',
  'automation_ready',
  'completed',
  'legacy_awaiting_approval',
] as const

export const testDesignCurrentStageSchema = z.enum(TEST_DESIGN_CURRENT_STAGES)

const TEST_DESIGN_NEXT_ACTIONS = [
  'analyze_requirements',
  'request_analysis_revision',
  'prepare_plan',
  'approve_plan',
  'request_plan_changes',
  'generate_test_cases',
  'request_test_case_changes',
  'approve_test_design',
  'publish_test_cases',
  'open_automation_backlog',
] as const

export const testDesignNextActionSchema = z.enum(TEST_DESIGN_NEXT_ACTIONS)

export const testDesignSourceStorySchema = z.object({
  storyKey: z.string(),
  intakeArtifactId: z.string().nullable(),
})

export const productWorkspaceSchema = z.object({
  mode: z.string(),
  stage: z.string(),
})

export const requirementAnalysisSummarySchema = z.object({
  summary: z.string().optional(),
  readinessStatus: z.string().optional(),
  storyKey: z.string().optional(),
  acceptanceCriteriaCount: z.coerce.number().optional(),
  gapsCount: z.coerce.number().optional(),
})

export const testDesignPlanSummarySchema = z.object({
  version: z.coerce.number().optional(),
  versionId: z.string().optional(),
  summary: z.string().optional(),
  estimatedCaseCount: z.coerce.number().optional(),
})

export const reviewIssueSchema = z.object({
  id: z.string(),
  status: z.string(),
  summary: z.string().optional(),
  instruction: z.string().optional(),
  scope: z.string().optional(),
})

export const testCaseRecordSchema = z.object({
  id: z.string(),
  recordId: z.string().optional(),
  draftId: z.string().optional(),
  title: z.string(),
  objective: z.string().optional(),
  priority: z.string().optional(),
  caseType: z.string().optional(),
  automationCandidate: z.boolean().optional(),
  version: z.coerce.number().optional(),
  linkedAcceptanceCriteria: z.array(z.string()).optional(),
})

export const testDesignRunVersionSchema = z.object({
  id: z.string().optional(),
  version: z.coerce.number(),
  versionId: z.string().optional(),
  label: z.string().optional(),
  createdAt: z.string().optional(),
  caseCount: z.coerce.number().optional(),
})

export const testDesignRunSchema = z.object({
  id: z.string().uuid(),
  storyKey: z.string(),
  workflowName: z.string(),
  status: z.string(),
  currentStep: z.string(),
  currentStage: testDesignCurrentStageSchema,
  nextActions: z.array(testDesignNextActionSchema),
  blockedReason: z.string().nullable(),
  initiatedBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  sourceStory: testDesignSourceStorySchema,
  requirementAnalysis: requirementAnalysisSummarySchema.nullable(),
  testDesignPlan: testDesignPlanSummarySchema.nullable(),
  reviewIssue: reviewIssueSchema.nullable(),
  versions: z.array(testDesignRunVersionSchema),
  testCaseRecords: z.array(testCaseRecordSchema),
  automationReadyTestCases: z.array(testCaseRecordSchema),
  approvalId: z.string().nullable(),
  productWorkspace: productWorkspaceSchema,
})

/** @deprecated Use testDesignCurrentStageSchema */
export const testDesignRunStatusSchema = testDesignCurrentStageSchema

export const requirementAnalysisSchema = z.object({
  runId: z.string(),
  storyKey: z.string(),
  storyTitle: z.string(),
  summary: z.string().optional(),
  acceptanceCriteria: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        covered: z.boolean().optional(),
      }),
    )
    .optional(),
  businessRules: z.array(z.string()).optional(),
  gaps: z
    .array(
      z.object({
        id: z.string(),
        description: z.string(),
        severity: z.enum(['high', 'medium', 'low']).optional(),
      }),
    )
    .optional(),
  dependencies: z.array(z.string()).optional(),
  assumptions: z.array(z.string()).optional(),
  risks: z.array(z.string()).optional(),
  proposedScope: z.string().optional(),
  readinessStatus: z
    .enum(['ready', 'needs_clarification', 'blocked'])
    .optional(),
  missingInformation: z.array(z.string()).optional(),
})

export const testDesignPlanSchema = z.object({
  runId: z.string(),
  version: z.coerce.number(),
  versionId: z.string().optional(),
  functionalAreas: z.array(z.string()).optional(),
  positiveScenarios: z.array(z.string()).optional(),
  negativeScenarios: z.array(z.string()).optional(),
  boundaryCoverage: z.array(z.string()).optional(),
  dataVariations: z.array(z.string()).optional(),
  automationCandidates: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
  traceability: z
    .array(
      z.object({
        acceptanceCriteriaId: z.string(),
        coverage: z.string(),
      }),
    )
    .optional(),
  estimatedCaseCount: z.coerce.number().optional(),
  summary: z.string().optional(),
})

export const testCaseDraftSchema = z.object({
  id: z.string(),
  draftId: z.string().optional(),
  version: z.coerce.number().optional(),
  title: z.string(),
  objective: z.string().optional(),
  preconditions: z.array(z.string()).optional(),
  data: z.string().optional(),
  steps: z.array(z.string()).optional(),
  expectedResults: z.array(z.string()).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  type: z
    .enum(['functional', 'negative', 'boundary', 'smoke', 'regression'])
    .optional(),
  automationCandidate: z.boolean().optional(),
  linkedAcceptanceCriteria: z.array(z.string()).optional(),
  changeType: z
    .enum(['added', 'modified', 'removed', 'unchanged'])
    .optional(),
})

export const testDesignVersionSchema = z.object({
  version: z.coerce.number(),
  versionId: z.string().optional(),
  label: z.string().optional(),
  createdAt: z.string(),
  caseCount: z.coerce.number().optional(),
  changeSummary: z.string().optional(),
  addedCount: z.coerce.number().optional(),
  modifiedCount: z.coerce.number().optional(),
  removedCount: z.coerce.number().optional(),
})

export const testDesignPublicationItemSchema = z.object({
  externalId: z.string().optional(),
  externalUrl: z.string().optional(),
  title: z.string(),
  status: z.string(),
  testCaseId: z.string().optional(),
})

export const testDesignPublicationResultSchema = z.object({
  destination: z.string().optional(),
  status: z.string(),
  publishedCount: z.coerce.number().optional(),
  failedCount: z.coerce.number().optional(),
  readyForAutomationCount: z.coerce.number().optional(),
  items: z.array(testDesignPublicationItemSchema).optional(),
})

export const testDesignReviewSummarySchema = z.object({
  currentVersion: z.coerce.number().optional(),
  currentVersionId: z.string().optional(),
  totalCases: z.coerce.number().optional(),
  automationCandidateCount: z.coerce.number().optional(),
  gapsRemaining: z.coerce.number().optional(),
  traceabilityCoverage: z.string().optional(),
  reviewState: z.string().optional(),
  workflowStatus: z.string().optional(),
  nextActions: z.array(z.string()).optional(),
})

export const testDesignReviewDataSchema = z.object({
  runId: z.string(),
  reviewSummary: testDesignReviewSummarySchema,
  testCases: z.array(testCaseDraftSchema).default([]),
  versions: z.array(testDesignVersionSchema).default([]),
  reviewConversation: z.array(reviewConversationMessageSchema).default([]),
  publicationResult: testDesignPublicationResultSchema.nullable().optional(),
})

export const testDesignRevisionInputSchema = z
  .object({
    instruction: z.string().min(1),
    scope: z.string().optional(),
    focusArea: z.string().optional(),
  })
  .transform((v) => ({
    instruction: v.instruction.trim(),
    scope: v.scope?.trim() || undefined,
    focusArea: v.focusArea?.trim() || undefined,
  }))

export type JiraStory = z.infer<typeof jiraStorySchema>
export type TestDesignRun = z.infer<typeof testDesignRunSchema>
export type TestDesignCurrentStage = z.infer<typeof testDesignCurrentStageSchema>
export type TestDesignNextAction = z.infer<typeof testDesignNextActionSchema>
export type TestCaseRecord = z.infer<typeof testCaseRecordSchema>
export type RequirementAnalysisSummary = z.infer<
  typeof requirementAnalysisSummarySchema
>
export type TestDesignPlanSummary = z.infer<typeof testDesignPlanSummarySchema>
export type ReviewIssue = z.infer<typeof reviewIssueSchema>
export type RequirementAnalysis = z.infer<typeof requirementAnalysisSchema>
export type TestDesignPlan = z.infer<typeof testDesignPlanSchema>
export type TestCaseDraft = z.infer<typeof testCaseDraftSchema>
export type TestDesignReviewData = z.infer<typeof testDesignReviewDataSchema>
export type TestDesignRevisionInput = z.infer<
  typeof testDesignRevisionInputSchema
>
export type TestDesignRunStatus = TestDesignCurrentStage
