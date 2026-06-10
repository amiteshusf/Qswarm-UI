import { z } from 'zod'

export const sessionStatusSchema = z.enum([
  'draft',
  'queued',
  'running',
  'awaiting_review',
  'revising',
  'succeeded',
  'failed',
  'cancelled',
])

export const repoProviderSchema = z.enum([
  'github',
  'gitlab',
  'bitbucket',
  'other',
])

export const repoConnectionSchema = z.object({
  id: z.string(),
  provider: repoProviderSchema,
  owner: z.string(),
  repo: z.string(),
  displayName: z.string().optional(),
  cloneUrl: z.string().optional(),
  defaultBranch: z.string(),
  authRef: z.string(),
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

export const executionAttemptSchema = z.object({
  id: z.string(),
  roundNumber: z.number(),
  status: z.enum(['pending', 'running', 'passed', 'failed', 'skipped']),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  summary: z.string().optional(),
  exitCode: z.number().nullable().optional(),
})

export const patchVersionSchema = z.object({
  id: z.string(),
  version: z.number(),
  label: z.string().optional(),
  createdAt: z.string(),
  filesChanged: z.number().optional(),
  additions: z.number().optional(),
  deletions: z.number().optional(),
})

export const roundSchema = z.object({
  id: z.string(),
  number: z.number(),
  title: z.string(),
  status: z.enum(['planned', 'active', 'complete', 'failed']),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  notes: z.string().optional(),
})

export const reviewRequestSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  instruction: z.string(),
  scope: z.string().optional(),
  status: z.enum(['open', 'addressed', 'dismissed']),
})

export const sessionDetailSchema = z.object({
  id: z.string(),
  status: sessionStatusSchema,
  engine: z.string(),
  repoConnectionId: z.string(),
  branchPolicyId: z.string().optional(),
  sourceRef: z.string(),
  sourceLabel: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  rounds: z.array(roundSchema),
  patches: z.array(patchVersionSchema),
  executions: z.array(executionAttemptSchema),
  reviews: z.array(reviewRequestSchema),
  latestExecutionSummary: z.string().optional(),
  patchSummary: z.string().optional(),
  prPreviewTitle: z.string().optional(),
  prPreviewBody: z.string().optional(),
})

export const sessionSummarySchema = sessionDetailSchema.pick({
  id: true,
  status: true,
  engine: true,
  repoConnectionId: true,
  sourceRef: true,
  sourceLabel: true,
  createdAt: true,
  updatedAt: true,
})

export const dashboardSchema = z.object({
  sessionCounts: z.record(sessionStatusSchema, z.number()),
  recentSessions: z.array(sessionSummarySchema),
})

export const settingsSchema = z.object({
  engine: z.object({
    defaultEngine: z.string(),
    maxRounds: z.number(),
    temperature: z.number().optional(),
    notes: z.string().optional(),
  }),
  infrastructure: z.object({
    provider: z.string(),
    region: z.string().optional(),
    runnerImage: z.string().optional(),
    concurrency: z.number().optional(),
  }),
  source: z.object({
    system: z.string(),
    webhookUrl: z.string().optional(),
    apiTokenRef: z.string().optional(),
  }),
  future: z
    .object({
      framework: z.string().optional(),
      runtime: z.string().optional(),
    })
    .optional(),
})

export const repoConnectionInputSchema = z.object({
  provider: repoProviderSchema,
  owner: z.string().min(1),
  repo: z.string().min(1),
  displayName: z.string().optional(),
  cloneUrl: z.union([z.string().url(), z.literal('')]).optional(),
  defaultBranch: z.string().min(1),
  authRef: z.string().min(1),
})

export const branchPolicyInputSchema = z.object({
  name: z.string().min(1),
  baseBranch: z.string().min(1),
  branchPattern: z.string().min(1),
  prTitleTemplate: z.string().min(1),
  prBodyTemplate: z.string().min(1),
  repoConnectionId: z.string().optional(),
})

export const sessionCreateInputSchema = z.object({
  repoConnectionId: z.string().min(1),
  branchPolicyId: z.string().optional(),
  engine: z.string().min(1),
  sourceRef: z.string().min(1),
  sourceLabel: z.string().optional(),
})

export const revisionRequestSchema = z.object({
  instruction: z.string().min(1),
  scope: z.string().optional(),
})

export type SessionStatus = z.infer<typeof sessionStatusSchema>
export type RepoConnection = z.infer<typeof repoConnectionSchema>
export type BranchPolicy = z.infer<typeof branchPolicySchema>
export type SessionDetail = z.infer<typeof sessionDetailSchema>
export type SessionSummary = z.infer<typeof sessionSummarySchema>
export type Dashboard = z.infer<typeof dashboardSchema>
export type Settings = z.infer<typeof settingsSchema>
export type RepoConnectionInput = z.infer<typeof repoConnectionInputSchema>
export type BranchPolicyInput = z.infer<typeof branchPolicyInputSchema>
export type SessionCreateInput = z.infer<typeof sessionCreateInputSchema>
