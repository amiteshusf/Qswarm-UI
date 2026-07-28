/**
 * Operation → Zod schema registry for backend wire validation.
 * Schemas are maintained against backend-contract/schemas and fixtures.
 */
import { z } from 'zod'

import {
  dashboardSchema,
  sessionBriefSchema,
  sessionDetailSchema,
  sessionReviewDataSchema,
  sessionSummarySchema,
  settingsSchema,
  storyListSchema,
  testDesignRunSchema,
} from '@/api/schemas'
import type { OperationId } from '@/api/generated/backend-routes'
import {
  artifactVersionRefSchema,
  backendErrorDetailSchema,
  jiraStoryDetailWireSchema,
  testCaseListWireSchema,
  testDesignReviewDataWireSchema,
} from '@/api/wire-schemas'

export const canonicalBackendErrorDetailSchema = backendErrorDetailSchema.extend({
  action: z.string().optional(),
  currentStage: z.string().optional(),
  allowedActions: z.array(z.string()).optional(),
  retryable: z.boolean().optional(),
  context: z.record(z.string(), z.unknown()).optional(),
})

export const canonicalBackendErrorBodySchema = z.object({
  detail: z.union([
    canonicalBackendErrorDetailSchema,
    z.array(
      z.object({
        type: z.string().optional(),
        loc: z.array(z.union([z.string(), z.number()])).optional(),
        msg: z.string(),
        input: z.unknown().optional(),
      }),
    ),
    z.string(),
  ]),
})

export const fastApiValidationErrorBodySchema = z.object({
  error: z.object({
    code: z.string().optional(),
    message: z.string().optional(),
    details: z
      .array(
        z.object({
          loc: z.array(z.union([z.string(), z.number()])).optional(),
          msg: z.string(),
          type: z.string().optional(),
        }),
      )
      .optional(),
  }),
})

const operationResponseSchemas: Partial<Record<OperationId, z.ZodType<unknown>>> = {
  getDashboard: dashboardSchema,
  getSettings: settingsSchema,
  listStories: storyListSchema,
  getStory: jiraStoryDetailWireSchema,
  getTestDesignRun: testDesignRunSchema,
  getTestDesignRunAnalysis: artifactVersionRefSchema,
  getTestDesignPlan: artifactVersionRefSchema,
  getTestDesignReviewData: testDesignReviewDataWireSchema,
  listTestCases: testCaseListWireSchema,
  getTestCase: z.record(z.string(), z.unknown()),
  listSessions: z.array(sessionSummarySchema),
  getSessionDetail: sessionDetailSchema,
  getSessionBrief: sessionBriefSchema,
  getSessionReviewData: sessionReviewDataSchema,
  getMetaContract: z.object({
    contractVersion: z.string(),
    compatibleFrontendContract: z.string().optional(),
    openapiSha256: z.string().optional(),
    fixtureBundleSha256: z.string().optional(),
    backendGitCommit: z.string().optional(),
  }),
}

export function getOperationResponseSchema(
  operationId: OperationId,
): z.ZodType<unknown> | undefined {
  return operationResponseSchemas[operationId]
}

export function parseOperationResponse<T>(
  operationId: OperationId,
  data: unknown,
): T {
  const schema = getOperationResponseSchema(operationId)
  if (!schema) return data as T
  return schema.parse(data) as T
}

export {
  backendErrorDetailSchema,
  canonicalBackendErrorDetailSchema as backendErrorWireSchema,
}
