import { z } from 'zod'

/** GET sub-resource artifact envelope (analysis, plan, embedded run refs). */
export const artifactVersionRefSchema = z.object({
  version: z.coerce.number(),
  artifactId: z.string(),
  content: z.record(z.string(), z.unknown()),
  createdAt: z.string().nullable().optional(),
  planApproved: z.boolean().nullable().optional(),
  planApprovedAt: z.string().nullable().optional(),
  planApprovedBy: z.string().nullable().optional(),
})

export const reviewIssueWireSchema = z.object({
  reviewJiraIssueKey: z.string().nullable().optional(),
  publishStatus: z.string().nullable().optional(),
})

export const testDesignVersionWireSchema = z.object({
  id: z.string().optional(),
  artifactId: z.string().optional(),
  versionNumber: z.coerce.number().optional(),
  version: z.coerce.number().optional(),
  parentVersionId: z.string().nullable().optional(),
  versionAction: z.string().nullable().optional(),
  sourceFeedbackId: z.string().nullable().optional(),
  isCurrent: z.boolean().optional(),
  createdBy: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  notes: z.string().nullable().optional(),
  caseCount: z.coerce.number().optional(),
  label: z.string().optional(),
})

export const testCaseRegistryRecordSchema = z.object({
  id: z.string(),
  registryKey: z.string(),
  workflowRunId: z.string(),
  sourceStoryKey: z.string(),
  sourceSystem: z.string().nullable().optional(),
  externalId: z.string().nullable().optional(),
  externalUrl: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  objective: z.string().nullable().optional(),
  caseType: z.string().nullable().optional(),
  caseIndex: z.number().nullable().optional(),
  steps: z.array(z.string()).default([]),
  expectedResults: z.array(z.string()).default([]),
  preconditions: z.array(z.string()).default([]),
  approvalStatus: z.string().nullable().optional(),
  publicationStatus: z.string().nullable().optional(),
  publicationError: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  automationStatus: z.string().nullable().optional(),
  automationSessionId: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  priority: z.string().optional(),
  automationCandidate: z.boolean().optional(),
  linkedAcceptanceCriteria: z.array(z.string()).optional(),
  versionNumber: z.coerce.number().optional(),
})

export const testCaseListWireSchema = z.object({
  items: z.array(testCaseRegistryRecordSchema),
  total: z.coerce.number().optional(),
})

export const testDesignReviewSummaryWireSchema = z.object({
  status: z.string().optional(),
  currentVersion: z.coerce.number().optional(),
  currentVersionId: z.string().optional(),
  testCaseCount: z.coerce.number().optional(),
  gapsCount: z.coerce.number().optional(),
  automationCandidateCount: z.coerce.number().optional(),
  traceabilityCoverage: z.string().optional(),
  nextActions: z.array(z.string()).optional(),
  workflowStatus: z.string().optional(),
})

export const testDesignConversationWireSchema = z.object({
  id: z.string(),
  type: z.string(),
  actor: z.string(),
  text: z.string(),
  createdAt: z.string(),
  roundNumber: z.coerce.number().optional(),
  status: z.string().optional(),
  scope: z.string().optional(),
})

export const testDesignPublicationWireSchema = z.object({
  destination: z.string().optional(),
  status: z.string().optional(),
  publishedCount: z.coerce.number().optional(),
  failedCount: z.coerce.number().optional(),
  readyForAutomationCount: z.coerce.number().optional(),
  records: z
    .array(
      z.object({
        externalId: z.string().optional(),
        externalUrl: z.string().optional(),
        title: z.string().optional(),
        status: z.string().optional(),
        testCaseId: z.string().optional(),
      }),
    )
    .optional(),
})

export const testDesignReviewDataWireSchema = z.object({
  workflowRunId: z.string(),
  reviewSummary: testDesignReviewSummaryWireSchema,
  testCases: z.array(testCaseRegistryRecordSchema).default([]),
  conversation: z.array(testDesignConversationWireSchema).default([]),
  versions: z.array(testDesignVersionWireSchema).default([]),
  publication: testDesignPublicationWireSchema.nullable().optional(),
})

export const backendErrorDetailSchema = z.object({
  code: z.string(),
  message: z.string(),
  field: z.string().nullable().optional(),
})

/** Live GET /stories/{storyKey} may return list-row or legacy detail fields. */
export const jiraStoryDetailWireSchema = z
  .object({
    storyKey: z.string(),
    title: z.string(),
    description: z.string().optional(),
    status: z.string().nullable().optional(),
    sprint: z.string().nullable().optional(),
    projectKey: z.string().optional(),
    assignee: z.string().nullable().optional(),
    readiness: z.enum(['ready', 'partial', 'missing_ac']).optional(),
    acceptanceCriteriaStatus: z
      .enum(['ready', 'partial', 'missing_ac'])
      .optional(),
    missingInformation: z.array(z.string()).optional(),
    hasActiveRun: z.boolean().optional(),
    activeRunId: z.string().nullable().optional(),
    activeWorkflowRunId: z.string().nullable().optional(),
    jiraUrl: z.string().optional(),
    labels: z.array(z.string()).optional(),
    issueType: z.string().optional(),
    priority: z.string().optional(),
    activeWorkflowRunStatus: z.string().nullable().optional(),
    activeWorkflowStage: z.string().nullable().optional(),
  })
  .passthrough()

export type ArtifactVersionRef = z.infer<typeof artifactVersionRefSchema>
export type TestCaseRegistryRecord = z.infer<typeof testCaseRegistryRecordSchema>
export type TestDesignReviewDataWire = z.infer<
  typeof testDesignReviewDataWireSchema
>
