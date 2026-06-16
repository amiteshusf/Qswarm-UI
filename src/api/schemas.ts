import { z } from 'zod'

const SESSION_STATUS_VALUES = [
  'draft',
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

export const patchVersionSchema = z.object({
  id: z.string(),
  version: z.coerce.number(),
  label: z.string().optional(),
  createdAt: z.string(),
  filesChanged: z.coerce.number().optional(),
  additions: z.coerce.number().optional(),
  deletions: z.coerce.number().optional(),
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

/** Session row in dashboard `recentSessions` (BFF / aggregate; superset of list fields). */
export const sessionSummarySchema = z.object({
  id: z.string(),
  status: sessionStatusSchema,
  engine: z.string(),
  repoConnectionId: z.string(),
  sourceRef: z.string(),
  sourceLabel: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  approvedCaseId: z.string().optional(),
  jobStatus: z.string().optional(),
  currentRoundNumber: z.coerce.number().optional(),
})

export const sessionDetailSchema = z.object({
  id: z.string(),
  status: sessionStatusSchema,
  engine: z.string(),
  repoConnectionId: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (v == null || v === '' ? '' : String(v))),
  branchPolicyId: z.string().nullish().transform((v) => v ?? undefined),
  sourceRef: z.string(),
  sourceLabel: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  rounds: z.array(roundSchema).default([]),
  patches: z.array(patchVersionSchema).default([]),
  executions: z.array(executionAttemptSchema).default([]),
  reviews: z.array(reviewRequestSchema).default([]),
  latestExecutionSummary: z.string().optional(),
  patchSummary: z.string().optional(),
  prPreviewTitle: z.string().optional(),
  prPreviewBody: z.string().optional(),
})

function normalizeSessionCountsRecord(
  raw: Record<string, number>,
): Record<z.infer<typeof sessionStatusSchema>, number> {
  const base: Record<z.infer<typeof sessionStatusSchema>, number> = {
    draft: 0,
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
  })
  .transform((d) => ({
    recentSessions: d.recentSessions,
    sessionCounts: normalizeSessionCountsRecord(d.sessionCounts),
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

export type SessionStatus = z.infer<typeof sessionStatusSchema>
export type RepoConnection = z.infer<typeof repoConnectionSchema>
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
