#!/usr/bin/env node
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const OUT = path.join(ROOT, 'reference/backend/ui-api-contract')
const OPENAPI_SRC = path.join(ROOT, 'reference/backend/docs/openapi-ui-v1.json')
const CONTRACT_FIXTURES_SRC = path.join(ROOT, 'src/api/contract-fixtures')

const VERSION = '2026.07.28.1'
const BACKEND_GIT_COMMIT = 'interim-from-openapi'

/** Stable camelCase operationIds keyed by METHOD path */
const OPERATION_IDS = {
  'GET /api/v1/branch-policies': 'listBranchPolicies',
  'POST /api/v1/branch-policies': 'createBranchPolicy',
  'GET /api/v1/branch-policies/{policy_id}': 'getBranchPolicy',
  'PATCH /api/v1/branch-policies/{policy_id}': 'updateBranchPolicy',
  'GET /api/v1/dashboard': 'getDashboard',
  'GET /api/v1/repo-connections': 'listRepoConnections',
  'POST /api/v1/repo-connections': 'createRepoConnection',
  'GET /api/v1/repo-connections/{connection_id}': 'getRepoConnection',
  'PATCH /api/v1/repo-connections/{connection_id}': 'updateRepoConnection',
  'GET /api/v1/sessions': 'listSessions',
  'POST /api/v1/sessions': 'createSession',
  'GET /api/v1/sessions/{session_id}': 'getSessionDetail',
  'POST /api/v1/sessions/{session_id}/approve': 'approveSession',
  'POST /api/v1/sessions/{session_id}/approve-plan': 'approveSessionPlan',
  'GET /api/v1/sessions/{session_id}/brief': 'getSessionBrief',
  'POST /api/v1/sessions/{session_id}/create-pr': 'createSessionPr',
  'POST /api/v1/sessions/{session_id}/prepare-plan': 'prepareSessionPlan',
  'POST /api/v1/sessions/{session_id}/request-plan-revision': 'requestSessionPlanRevision',
  'POST /api/v1/sessions/{session_id}/request-revision': 'requestSessionRevision',
  'GET /api/v1/sessions/{session_id}/review-data': 'getSessionReviewData',
  'POST /api/v1/sessions/{session_id}/start': 'startSession',
  'GET /api/v1/settings': 'getSettings',
  'GET /api/v1/stories': 'listStories',
  'GET /api/v1/stories/{story_key}': 'getStory',
  'POST /api/v1/stories/{story_key}/test-design-runs': 'createTestDesignRun',
  'GET /api/v1/test-cases': 'listTestCases',
  'GET /api/v1/test-cases/{record_id}': 'getTestCase',
  'POST /api/v1/test-cases/{record_id}/automate': 'automateTestCase',
  'POST /api/v1/test-cases/{record_id}/publish': 'publishTestCase',
  'POST /api/v1/test-design-runs/bulk': 'bulkCreateTestDesignRuns',
  'GET /api/v1/test-design-runs/{run_id}': 'getTestDesignRun',
  'GET /api/v1/test-design-runs/{run_id}/analysis': 'getTestDesignRunAnalysis',
  'POST /api/v1/test-design-runs/{run_id}/analyze': 'analyzeTestDesignRun',
  'POST /api/v1/test-design-runs/{run_id}/approve': 'approveTestDesign',
  'POST /api/v1/test-design-runs/{run_id}/approve-plan': 'approveTestDesignPlan',
  'POST /api/v1/test-design-runs/{run_id}/generate-test-cases': 'generateTestDesignTestCases',
  'GET /api/v1/test-design-runs/{run_id}/plan': 'getTestDesignPlan',
  'POST /api/v1/test-design-runs/{run_id}/prepare-plan': 'prepareTestDesignPlan',
  'POST /api/v1/test-design-runs/{run_id}/publish': 'publishTestDesign',
  'POST /api/v1/test-design-runs/{run_id}/request-plan-revision': 'requestTestDesignPlanRevision',
  'POST /api/v1/test-design-runs/{run_id}/request-revision': 'requestTestDesignRevision',
  'GET /api/v1/test-design-runs/{run_id}/review-data': 'getTestDesignReviewData',
  'GET /api/v1/meta/contract': 'getMetaContract',
  'GET /api/v1/meta/health': 'getMetaHealth',
  'GET /api/v1/health': 'getHealth',
  'GET /api/v1/review-queue': 'getReviewQueue',
  'GET /api/v1/engines': 'listEngines',
  'GET /api/v1/integration-status': 'getIntegrationStatus',
}

const FEATURE_AREAS = {
  'GET /api/v1/dashboard': 'setup',
  'GET /api/v1/settings': 'setup',
  'GET /api/v1/repo-connections': 'setup',
  'POST /api/v1/repo-connections': 'setup',
  'GET /api/v1/repo-connections/{connection_id}': 'setup',
  'PATCH /api/v1/repo-connections/{connection_id}': 'setup',
  'GET /api/v1/branch-policies': 'setup',
  'POST /api/v1/branch-policies': 'setup',
  'GET /api/v1/branch-policies/{policy_id}': 'setup',
  'PATCH /api/v1/branch-policies/{policy_id}': 'setup',
  'GET /api/v1/engines': 'setup',
  'GET /api/v1/integration-status': 'setup',
  'GET /api/v1/meta/contract': 'meta',
  'GET /api/v1/meta/health': 'meta',
  'GET /api/v1/health': 'meta',
  'GET /api/v1/review-queue': 'meta',
}

const RESPONSE_SCHEMA_REFS = {
  getDashboard: 'schemas/dashboard.json',
  getSettings: 'schemas/settings.json',
  listStories: 'schemas/story-list.json',
  getStory: 'schemas/story-detail.json',
  getTestDesignRun: 'schemas/test-design-run.json',
  getTestDesignRunAnalysis: 'schemas/artifact-ref.json',
  getTestDesignPlan: 'schemas/artifact-ref.json',
  getTestDesignReviewData: 'schemas/test-design-review-data.json',
  listTestCases: 'schemas/test-case-list.json',
  getTestCase: 'schemas/test-case-record.json',
  listSessions: 'schemas/session-list.json',
  getSessionDetail: 'schemas/session-detail.json',
  getSessionBrief: 'schemas/session-brief.json',
  getSessionReviewData: 'schemas/session-review-data.json',
  listRepoConnections: 'schemas/repo-connection-list.json',
  getRepoConnection: 'schemas/repo-connection.json',
  listBranchPolicies: 'schemas/branch-policy-list.json',
  getBranchPolicy: 'schemas/branch-policy.json',
  getMetaContract: 'schemas/meta-contract.json',
  getMetaHealth: 'schemas/health.json',
  getHealth: 'schemas/health.json',
  getReviewQueue: 'schemas/review-queue.json',
  listEngines: 'schemas/engine-list.json',
  getIntegrationStatus: 'schemas/integration-status.json',
}

const FRONTEND_ONLY_ROUTES = new Set([
  'GET /api/v1/meta/contract',
  'GET /api/v1/meta/health',
  'GET /api/v1/health',
  'GET /api/v1/review-queue',
  'GET /api/v1/engines',
  'GET /api/v1/integration-status',
])

const STAGE_FIXTURE_FILES = [
  ['intake_ready', 'test-design-run-intake-ready.json'],
  ['analysis_ready', 'test-design-run-analysis-ready.json'],
  ['awaiting_plan_approval', 'test-design-run-awaiting-plan-approval.json'],
  ['plan_approved', 'test-design-run-plan-approved.json'],
  ['awaiting_test_case_review', 'test-design-run-awaiting-test-case-review.json'],
  ['approved', 'test-design-run-approved.json'],
  ['automation_ready', 'test-design-run-automation-ready.json'],
  ['legacy_awaiting_approval', 'test-design-run-legacy-awaiting-approval.json'],
]

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
}

function sha256Concat(filePaths) {
  const hash = crypto.createHash('sha256')
  for (const filePath of [...filePaths].sort()) {
    hash.update(fs.readFileSync(filePath))
  }
  return hash.digest('hex')
}

const REQUEST_BODY_SCHEMA_REFS = {
  createBranchPolicy: 'schemas/branch-policy-create.json',
  updateBranchPolicy: 'schemas/branch-policy-update.json',
  createRepoConnection: 'schemas/repo-connection-create.json',
  updateRepoConnection: 'schemas/repo-connection-update.json',
  createSession: 'schemas/session-create.json',
  approveSession: 'schemas/session-approve.json',
  approveSessionPlan: 'schemas/session-approve-plan.json',
  createSessionPr: 'schemas/session-create-pr.json',
  prepareSessionPlan: 'schemas/session-prepare-plan.json',
  requestSessionPlanRevision: 'schemas/session-revision-request.json',
  requestSessionRevision: 'schemas/session-revision-request.json',
  startSession: 'schemas/session-start.json',
  createTestDesignRun: 'schemas/test-design-run-create.json',
  bulkCreateTestDesignRuns: 'schemas/test-design-run-bulk-create.json',
  approveTestDesign: 'schemas/test-design-approve.json',
  requestTestDesignPlanRevision: 'schemas/test-design-revision-request.json',
  requestTestDesignRevision: 'schemas/test-design-revision-request.json',
  automateTestCase: 'schemas/test-case-automate.json',
  publishTestCase: 'schemas/test-case-publish.json',
}

function resolveSchemaRef(schema) {
  if (!schema?.$ref) return undefined
  const name = schema.$ref.replace('#/components/schemas/', '')
  return `schemas/openapi-components/${name}.json`
}

function extractParameters(op, pathParams = []) {
  const params = []
  for (const p of pathParams) {
    params.push({
      name: p.name,
      in: 'path',
      required: p.required ?? true,
      schema: p.schema ?? { type: 'string' },
    })
  }
  for (const p of op.parameters ?? []) {
    params.push({
      name: p.name,
      in: p.in,
      required: p.required ?? false,
      schema: p.schema ?? { type: 'string' },
      ...(p.description ? { description: p.description } : {}),
    })
  }
  return params
}

function successResponse(op) {
  const codes = Object.keys(op.responses ?? {})
    .map(Number)
    .filter((c) => c >= 200 && c < 300)
  return codes.length ? Math.min(...codes) : 200
}

function responseSchemaRef(operationId, op) {
  if (RESPONSE_SCHEMA_REFS[operationId]) return RESPONSE_SCHEMA_REFS[operationId]
  const success = String(successResponse(op))
  const content = op.responses?.[success]?.content?.['application/json']?.schema
  return resolveSchemaRef(content) ?? 'schemas/unknown.json'
}

function requestBodySchemaRef(operationId, op) {
  if (REQUEST_BODY_SCHEMA_REFS[operationId]) return REQUEST_BODY_SCHEMA_REFS[operationId]
  const content = op.requestBody?.content?.['application/json']?.schema
  return resolveSchemaRef(content)
}

function featureArea(routeKey) {
  if (FEATURE_AREAS[routeKey]) return FEATURE_AREAS[routeKey]
  if (routeKey.includes('/sessions')) return 'sprint2'
  if (
    routeKey.includes('/test-design-runs') ||
    routeKey.includes('/stories') ||
    routeKey.includes('/test-cases')
  ) {
    return 'sprint1'
  }
  return 'setup'
}

function buildRouteManifest(openapi) {
  const operations = []

  for (const [routePath, methods] of Object.entries(openapi.paths)) {
    if (!routePath.startsWith('/api/v1')) continue
    const pathParams = methods.parameters ?? []
    for (const [method, op] of Object.entries(methods)) {
      if (method === 'parameters' || !op || typeof op !== 'object') continue
      const routeKey = `${method.toUpperCase()} ${routePath}`
      const operationId = OPERATION_IDS[routeKey]
      if (!operationId) throw new Error(`Missing operationId mapping for ${routeKey}`)
      const entry = {
        operationId,
        method: method.toUpperCase(),
        path: routePath,
        parameters: extractParameters(op, pathParams),
        responseSchema: responseSchemaRef(operationId, op),
        successStatus: successResponse(op),
        tags: op.tags ?? [],
        featureArea: featureArea(routeKey),
        source: 'openapi-ui-v1',
        openapiOperationId: op.operationId,
      }
      const bodyRef = requestBodySchemaRef(operationId, op)
      if (bodyRef) entry.requestBodySchema = bodyRef
      operations.push(entry)
    }
  }

  for (const routeKey of FRONTEND_ONLY_ROUTES) {
    const [method, routePath] = routeKey.split(' ')
    const operationId = OPERATION_IDS[routeKey]
    operations.push({
      operationId,
      method,
      path: routePath,
      parameters: [],
      responseSchema: RESPONSE_SCHEMA_REFS[operationId],
      successStatus: 200,
      tags: ['ui-v1', 'frontend-consumed'],
      featureArea: featureArea(routeKey),
      source: 'frontend-consumed',
      note: 'Documented setup/meta route consumed by QSwarm Web; not yet in openapi-ui-v1.json',
    })
  }

  operations.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method))
  const uniquePaths = new Set(operations.map((o) => o.path))
  return {
    version: VERSION,
    generatedAt: new Date().toISOString(),
    operationCount: operations.length,
    routeCount: uniquePaths.size,
    openapiRouteCount: 37,
    frontendMetaRouteCount: 6,
    note:
      '43 unique route paths (37 from openapi-ui-v1.json + 6 frontend-consumed setup/meta paths). operationCount includes multiple HTTP methods on shared paths.',
    operations,
  }
}

function buildWorkflowContract() {
  return {
    version: VERSION,
    sprint1: {
      workflowName: 'sprint1_qswarm_workspace',
      stages: [
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
      ],
      actions: [
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
      ],
      stageActionMap: {
        intake_ready: ['analyze_requirements'],
        analysis_ready: ['prepare_plan'],
        awaiting_plan_approval: ['request_plan_changes', 'approve_plan'],
        plan_approved: ['generate_test_cases'],
        awaiting_test_case_review: ['request_test_case_changes', 'approve_test_design'],
        approved: ['publish_test_cases'],
        automation_ready: ['open_automation_backlog'],
        legacy_awaiting_approval: ['approve_test_design'],
      },
    },
    sprint2: {
      workflowName: 'sprint2_automation_session',
      sessionStatuses: [
        'draft',
        'plan_ready',
        'queued',
        'running',
        'awaiting_review',
        'revising',
        'succeeded',
        'failed',
        'cancelled',
      ],
      sessionStages: [
        'draft',
        'queued',
        'plan_review',
        'plan_approved',
        'running',
        'revising',
        'ready_for_review',
        'ready_to_publish',
        'published',
        'failed',
        'cancelled',
      ],
      nextActions: [
        'prepare_plan',
        'start_automation',
        'approve_plan',
        'request_plan_revision',
        'request_changes',
        'approve',
        'create_pr',
        'view_summary',
      ],
      statusActionMap: {
        draft: ['prepare_plan', 'start_automation'],
        plan_ready: ['approve_plan', 'request_plan_revision'],
        awaiting_review: ['request_changes', 'approve'],
        succeeded: ['view_summary'],
        failed: ['view_summary'],
        cancelled: ['view_summary'],
      },
      mutationActions: [
        'prepare_plan',
        'approve_plan',
        'request_plan_revision',
        'start',
        'revise',
        'approve',
        'create_pr',
      ],
    },
  }
}

const SCHEMAS = {
  'schemas/dashboard.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'DashboardResponse',
    type: 'object',
    required: ['sessionCounts', 'recentSessions'],
    properties: {
      sessionCounts: { type: 'object', additionalProperties: { type: 'integer' } },
      recentSessions: { type: 'array', items: { $ref: 'session-summary.json' } },
      repositoryConnectionCount: { type: 'integer' },
      branchPolicyCount: { type: 'integer' },
      environment: { type: 'string' },
      applicationName: { type: 'string' },
    },
  },
  'schemas/settings.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'SettingsResponse',
    type: 'object',
    required: ['applicationName', 'environment'],
    properties: {
      applicationName: { type: 'string' },
      environment: { type: 'string' },
      debug: { type: 'boolean' },
      jira: { type: 'object' },
      codingProvider: { type: 'string' },
      workspaceRoot: { type: 'string' },
      claudeCodeEnabled: { type: 'boolean' },
      copilotAgentEnabled: { type: 'boolean' },
      notes: { type: 'string' },
    },
  },
  'schemas/story-list.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'StoryListResponse',
    type: 'object',
    required: ['stories', 'total'],
    properties: {
      stories: { type: 'array', items: { $ref: 'story-detail.json' } },
      total: { type: 'integer' },
    },
  },
  'schemas/story-detail.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'StoryDetail',
    type: 'object',
    required: ['storyKey', 'title'],
    properties: {
      storyKey: { type: 'string' },
      title: { type: 'string' },
      description: { type: 'string' },
      status: { type: ['string', 'null'] },
      sprint: { type: ['string', 'null'] },
      projectKey: { type: 'string' },
      assignee: { type: ['string', 'null'] },
      readiness: { type: 'string', enum: ['ready', 'partial', 'missing_ac'] },
      acceptanceCriteriaStatus: { type: 'string' },
      missingInformation: { type: 'array', items: { type: 'string' } },
      hasActiveRun: { type: 'boolean' },
      activeRunId: { type: ['string', 'null'] },
      jiraUrl: { type: 'string', format: 'uri' },
    },
  },
  'schemas/test-design-run.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'TestDesignRun',
    type: 'object',
    required: ['id', 'storyKey', 'currentStage', 'nextActions'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      storyKey: { type: 'string' },
      workflowName: { type: 'string' },
      status: { type: 'string' },
      currentStep: { type: 'string' },
      currentStage: { type: 'string' },
      nextActions: { type: 'array', items: { type: 'string' } },
      blockedReason: { type: ['string', 'null'] },
      initiatedBy: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      sourceStory: { type: 'object' },
      requirementAnalysis: { type: ['object', 'null'] },
      testDesignPlan: { type: ['object', 'null'] },
      versions: { type: 'array' },
      reviewIssue: { type: ['object', 'null'] },
      testCaseRecords: { type: 'array' },
      automationReadyTestCases: { type: 'array' },
      approvalId: { type: ['string', 'null'] },
      productWorkspace: { type: 'object' },
    },
  },
  'schemas/artifact-ref.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'ArtifactVersionRef',
    type: 'object',
    required: ['version', 'artifactId', 'content'],
    properties: {
      version: { type: 'integer' },
      artifactId: { type: 'string' },
      content: { type: 'object' },
      createdAt: { type: ['string', 'null'] },
    },
  },
  'schemas/test-design-review-data.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'TestDesignReviewData',
    type: 'object',
    required: ['workflowRunId', 'reviewSummary'],
    properties: {
      workflowRunId: { type: 'string' },
      reviewSummary: { type: 'object' },
      testCases: { type: 'array' },
      conversation: { type: 'array' },
      versions: { type: 'array' },
      publication: { type: ['object', 'null'] },
    },
  },
  'schemas/test-case-list.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'TestCaseListResponse',
    type: 'object',
    required: ['items'],
    properties: {
      items: { type: 'array', items: { $ref: 'test-case-record.json' } },
      total: { type: 'integer' },
    },
  },
  'schemas/test-case-record.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'TestCaseRecord',
    type: 'object',
    required: ['id', 'registryKey', 'workflowRunId', 'sourceStoryKey'],
    properties: {
      id: { type: 'string' },
      registryKey: { type: 'string' },
      workflowRunId: { type: 'string' },
      sourceStoryKey: { type: 'string' },
      title: { type: ['string', 'null'] },
      automationStatus: { type: 'string' },
    },
  },
  'schemas/session-list.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'SessionListResponse',
    type: 'object',
    properties: {
      items: { type: 'array', items: { $ref: 'session-detail.json' } },
      total: { type: 'integer' },
    },
  },
  'schemas/session-detail.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'SessionDetail',
    type: 'object',
    required: ['id', 'status', 'engine', 'repoConnectionId', 'sourceRef'],
    properties: {
      id: { type: 'string' },
      status: { type: 'string' },
      engine: { type: 'string' },
      repoConnectionId: { type: 'string' },
      sourceRef: { type: 'string' },
      sourceLabel: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      rounds: { type: 'array' },
      patches: { type: 'array' },
      executions: { type: 'array' },
      reviews: { type: 'array' },
    },
  },
  'schemas/session-brief.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'SessionBrief',
    type: 'object',
    required: ['sessionId', 'sessionState', 'sourceSummary', 'setup'],
    properties: {
      sessionId: { type: 'string' },
      sessionState: { type: 'object' },
      sourceSummary: { type: 'object' },
      setup: { type: 'object' },
      automationBrief: { type: 'object' },
    },
  },
  'schemas/session-review-data.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'SessionReviewData',
    type: 'object',
    required: ['sessionId', 'reviewSummary'],
    properties: {
      sessionId: { type: 'string' },
      reviewSummary: { type: 'object' },
      changedFiles: { type: 'array' },
      reviewConversation: { type: 'array' },
      prInfo: { type: ['object', 'null'] },
    },
  },
  'schemas/repo-connection-list.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'RepoConnectionListResponse',
    type: 'object',
    properties: {
      items: { type: 'array', items: { $ref: 'repo-connection.json' } },
    },
  },
  'schemas/repo-connection.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'RepoConnection',
    type: 'object',
    required: ['id', 'provider'],
    properties: {
      id: { type: 'string' },
      provider: { type: 'string' },
      ownerOrOrg: { type: 'string' },
      repoName: { type: 'string' },
      defaultBranch: { type: 'string' },
    },
  },
  'schemas/branch-policy-list.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'BranchPolicyListResponse',
    type: 'object',
    properties: {
      items: { type: 'array', items: { $ref: 'branch-policy.json' } },
    },
  },
  'schemas/branch-policy.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'BranchPolicy',
    type: 'object',
    required: ['id', 'name'],
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      baseBranch: { type: 'string' },
      branchPattern: { type: 'string' },
    },
  },
  'schemas/meta-contract.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'MetaContractResponse',
    type: 'object',
    required: ['version'],
    properties: {
      version: { type: 'string' },
      backendGitCommit: { type: 'string' },
      routeCount: { type: 'integer' },
      operationCount: { type: 'integer' },
    },
  },
  'schemas/health.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'HealthResponse',
    type: 'object',
    properties: {
      status: { type: 'string' },
      environment: { type: 'string' },
      version: { type: 'string' },
    },
  },
  'schemas/review-queue.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'ReviewQueueResponse',
    type: 'object',
    properties: {
      items: { type: 'array' },
      total: { type: 'integer' },
    },
  },
  'schemas/engine-list.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'EngineListResponse',
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'label'],
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            enabled: { type: 'boolean' },
          },
        },
      },
    },
  },
  'schemas/integration-status.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'IntegrationStatusResponse',
    type: 'object',
    properties: {
      jira: { type: 'object' },
      github: { type: 'object' },
      codingProvider: { type: 'object' },
    },
  },
  'schemas/backend-error-detail.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'BackendErrorDetail',
    type: 'object',
    required: ['code', 'message'],
    properties: {
      code: { type: 'string' },
      message: { type: 'string' },
      field: { type: ['string', 'null'] },
    },
  },
  'schemas/branch-policy-create.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'BranchPolicyCreate',
    type: 'object',
    required: ['name', 'repositoryConnectionId', 'baseBranch', 'branchPattern'],
    properties: {
      name: { type: 'string' },
      repositoryConnectionId: { type: 'string', format: 'uuid' },
      baseBranch: { type: 'string' },
      branchPattern: { type: 'string' },
      prTitleTemplate: { type: 'string' },
      prBodyTemplate: { type: 'string' },
    },
  },
  'schemas/branch-policy-update.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'BranchPolicyUpdate',
    type: 'object',
    properties: {
      name: { type: 'string' },
      repoConnectionId: { type: 'string', format: 'uuid' },
      baseBranch: { type: 'string' },
      branchPattern: { type: 'string' },
    },
  },
  'schemas/repo-connection-create.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'RepoConnectionCreate',
    type: 'object',
    required: ['provider', 'owner', 'repo', 'authRef'],
    properties: {
      provider: { type: 'string' },
      owner: { type: 'string' },
      repo: { type: 'string' },
      authRef: { type: 'string', minLength: 1 },
      defaultBranch: { type: 'string' },
      displayName: { type: 'string' },
    },
  },
  'schemas/repo-connection-update.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'RepoConnectionUpdate',
    type: 'object',
    properties: {
      owner: { type: 'string' },
      repo: { type: 'string' },
      defaultBranch: { type: 'string' },
      displayName: { type: 'string' },
    },
  },
  'schemas/session-create.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'SessionCreate',
    type: 'object',
    required: ['repositoryConnectionId', 'engine', 'sourceRef', 'createdBy'],
    properties: {
      repositoryConnectionId: { type: 'string', format: 'uuid' },
      engine: { type: 'string' },
      sourceRef: { type: 'string' },
      createdBy: { type: 'string' },
      branchPolicyId: { type: 'string', format: 'uuid' },
      sourceLabel: { type: 'string' },
      approvedCaseId: { type: 'string' },
    },
  },
  'schemas/session-approve.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'SessionApprove',
    type: 'object',
    properties: { actorId: { type: 'string' } },
  },
  'schemas/session-approve-plan.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'SessionApprovePlan',
    type: 'object',
    properties: { actorId: { type: 'string' } },
  },
  'schemas/session-create-pr.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'SessionCreatePr',
    type: 'object',
    properties: { actorId: { type: 'string' } },
  },
  'schemas/session-prepare-plan.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'SessionPreparePlan',
    type: 'object',
    properties: { actorId: { type: 'string' } },
  },
  'schemas/session-revision-request.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'SessionRevisionRequest',
    type: 'object',
    required: ['actorId', 'instruction'],
    properties: {
      actorId: { type: 'string' },
      instruction: { type: 'string' },
      scope: { type: 'string' },
    },
  },
  'schemas/session-start.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'SessionStart',
    type: 'object',
    properties: { actorId: { type: 'string' } },
  },
  'schemas/test-design-run-create.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'TestDesignRunCreate',
    type: 'object',
    required: ['initiatedBy'],
    properties: { initiatedBy: { type: 'string' } },
  },
  'schemas/test-design-run-bulk-create.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'TestDesignRunBulkCreate',
    type: 'object',
    properties: {
      storyKeys: { type: 'array', items: { type: 'string' } },
      initiatedBy: { type: 'string' },
    },
  },
  'schemas/test-design-run-actor-query.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'ActorQuery',
    type: 'object',
    properties: { actor_id: { type: 'string' } },
  },
  'schemas/test-design-approve.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'TestDesignApprove',
    type: 'object',
    properties: { actorId: { type: 'string' } },
  },
  'schemas/test-design-revision-request.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'TestDesignRevisionRequest',
    type: 'object',
    required: ['actorId', 'instruction'],
    properties: {
      actorId: { type: 'string' },
      instruction: { type: 'string' },
      scope: { type: 'string' },
    },
  },
  'schemas/test-case-automate.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'TestCaseAutomate',
    type: 'object',
    required: ['createdBy', 'engine', 'repositoryConnectionId'],
    properties: {
      createdBy: { type: 'string' },
      engine: { type: 'string' },
      repositoryConnectionId: { type: 'string', format: 'uuid' },
      baseBranch: { type: 'string' },
    },
  },
  'schemas/test-case-publish.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'TestCasePublish',
    type: 'object',
    properties: { actorId: { type: 'string' } },
  },
  'schemas/session-summary.json': {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'SessionSummary',
    type: 'object',
    required: ['id', 'status'],
    properties: {
      id: { type: 'string' },
      status: { type: 'string' },
      engine: { type: 'string' },
      repoConnectionId: { type: 'string' },
      sourceRef: { type: 'string' },
      createdAt: { type: 'string' },
      updatedAt: { type: 'string' },
    },
  },
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest))
  fs.copyFileSync(src, dest)
}

function listFilesRecursive(dir, base = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...listFilesRecursive(full, base))
    else files.push(path.relative(base, full))
  }
  return files
}

async function loadStageFixtures() {
  const mod = await import(
    pathToFileURL(
      path.join(ROOT, 'src/api/mocks/fixtures/test-design-runs.ts'),
    ).href
  )
  return mod.ALL_TEST_DESIGN_RUN_FIXTURES
}

function buildFixtureIndex() {
  const fixtures = [
    {
      operationId: 'getDashboard',
      path: '/api/v1/dashboard',
      method: 'GET',
      file: 'fixtures/dashboard.json',
      variantTags: ['setup', 'success'],
    },
    {
      operationId: 'getSettings',
      path: '/api/v1/settings',
      method: 'GET',
      file: 'fixtures/settings.json',
      variantTags: ['setup', 'success'],
    },
    {
      operationId: 'listStories',
      path: '/api/v1/stories',
      method: 'GET',
      file: 'fixtures/stories-list.json',
      variantTags: ['sprint1', 'success'],
    },
    {
      operationId: 'getStory',
      path: '/api/v1/stories/{story_key}',
      method: 'GET',
      file: 'fixtures/story-detail.json',
      variantTags: ['sprint1', 'success'],
    },
    {
      operationId: 'getTestDesignReviewData',
      path: '/api/v1/test-design-runs/{run_id}/review-data',
      method: 'GET',
      file: 'fixtures/test-design-review-data-intake.json',
      variantTags: ['sprint1', 'stage:intake_ready', 'success'],
    },
    {
      operationId: 'listTestCases',
      path: '/api/v1/test-cases',
      method: 'GET',
      file: 'fixtures/test-case-list.json',
      variantTags: ['sprint1', 'success', 'empty'],
    },
    ...STAGE_FIXTURE_FILES.map(([stage, file]) => ({
      operationId: 'getTestDesignRun',
      path: '/api/v1/test-design-runs/{run_id}',
      method: 'GET',
      file: `fixtures/${file}`,
      variantTags: ['sprint1', `stage:${stage}`, 'success'],
    })),
    {
      operationId: 'getTestDesignRun',
      path: '/api/v1/test-design-runs/{run_id}',
      method: 'GET',
      file: null,
      variantTags: ['sprint1', 'error:not_found'],
      status: 'missing',
      note: 'Use errors/not-found.json for 404 contract tests',
    },
    {
      operationId: 'analyzeTestDesignRun',
      path: '/api/v1/test-design-runs/{run_id}/analyze',
      method: 'POST',
      file: null,
      variantTags: ['sprint1', 'mutation'],
      status: 'missing',
      note: 'Mutation response fixture deferred to backend follow-up',
    },
    {
      operationId: 'publishTestDesign',
      path: '/api/v1/test-design-runs/{run_id}/publish',
      method: 'POST',
      file: null,
      variantTags: ['sprint1', 'mutation:publish'],
      status: 'missing',
      note: 'sprint1.publish.mutation — backend follow-up',
    },
    {
      operationId: 'prepareSessionPlan',
      path: '/api/v1/sessions/{session_id}/prepare-plan',
      method: 'POST',
      file: null,
      variantTags: ['sprint2', 'mutation:prepare-plan'],
      status: 'skipped',
      note: 'sprint2.session.prepare-plan.mutation — skipped',
    },
  ]

  return {
    version: VERSION,
    fixtures,
    missing: fixtures.filter((f) => f.status === 'missing' || f.status === 'skipped'),
  }
}

async function main() {
  const openapi = JSON.parse(fs.readFileSync(OPENAPI_SRC, 'utf8'))
  const routeManifest = buildRouteManifest(openapi)
  const workflowContract = buildWorkflowContract()

  copyFile(OPENAPI_SRC, path.join(OUT, 'openapi-ui-v1.json'))

  for (const [rel, schema] of Object.entries(SCHEMAS)) {
    writeJson(path.join(OUT, rel), schema)
  }

  writeJson(path.join(OUT, 'errors/not-found.json'), {
    detail: {
      code: 'not_found',
      message: 'Workflow run not found',
      field: null,
    },
  })
  writeJson(path.join(OUT, 'errors/invalid-state.json'), {
    detail: {
      code: 'invalid_state',
      message: 'Action not allowed in current state',
      field: null,
    },
  })
  writeJson(path.join(OUT, 'errors/validation-422.json'), {
    detail: [
      {
        type: 'value_error',
        loc: ['body', 'instruction'],
        msg: 'Field required',
        input: null,
      },
    ],
  })

  const fixtureCopies = [
    ['dashboard.json', 'fixtures/dashboard.json'],
    ['settings.json', 'fixtures/settings.json'],
    ['stories-list.json', 'fixtures/stories-list.json'],
    ['story-detail.json', 'fixtures/story-detail.json'],
    ['test-design-run-intake-ready.json', 'fixtures/test-design-run-intake-ready.json'],
    ['test-design-review-data-intake.json', 'fixtures/test-design-review-data-intake.json'],
    ['test-case-list.json', 'fixtures/test-case-list.json'],
    ['error-not-found.json', 'fixtures/errors/not-found.json'],
    ['error-invalid-state.json', 'fixtures/errors/invalid-state.json'],
  ]

  for (const [srcName, destRel] of fixtureCopies) {
    copyFile(path.join(CONTRACT_FIXTURES_SRC, srcName), path.join(OUT, destRel))
  }

  const stageFixtures = await loadStageFixtures()
  for (const [stage, fileName] of STAGE_FIXTURE_FILES) {
    const fixture = stageFixtures.find((f) => f.currentStage === stage)
    if (!fixture) throw new Error(`Missing stage fixture for ${stage}`)
    writeJson(path.join(OUT, 'fixtures', fileName), fixture)
  }

  writeJson(path.join(OUT, 'route-manifest.json'), routeManifest)
  writeJson(path.join(OUT, 'workflow-contract.json'), workflowContract)

  const fixtureIndex = buildFixtureIndex()
  writeJson(path.join(OUT, 'fixtures/index.json'), fixtureIndex)

  const artifactSet = new Set([
    'contract-manifest.json',
    'route-manifest.json',
    'workflow-contract.json',
    'openapi-ui-v1.json',
    'checksums.json',
    'fixtures/index.json',
    'errors/not-found.json',
    'errors/invalid-state.json',
    'errors/validation-422.json',
    ...listFilesRecursive(path.join(OUT, 'fixtures')).map((f) => `fixtures/${f}`),
    ...listFilesRecursive(path.join(OUT, 'schemas')).map((f) => `schemas/${f}`),
  ])
  const artifacts = [...artifactSet].sort()

  const contractManifest = {
    version: VERSION,
    backendGitCommit: BACKEND_GIT_COMMIT,
    generatedAt: new Date().toISOString(),
    description:
      'Interim UI API contract bundle for QSwarm Web; routes derived from openapi-ui-v1.json plus frontend-consumed setup/meta routes.',
    operationCount: routeManifest.operationCount,
    routeCount: routeManifest.routeCount,
    artifacts,
  }

  writeJson(path.join(OUT, 'contract-manifest.json'), contractManifest)

  const fixtureFiles = listFilesRecursive(path.join(OUT, 'fixtures'))
    .filter((f) => f.endsWith('.json') && f !== 'index.json')
    .map((f) => path.join(OUT, 'fixtures', f))

  const checksums = {
    version: VERSION,
    algorithm: 'sha256',
    files: {
      'openapi-ui-v1.json': sha256File(path.join(OUT, 'openapi-ui-v1.json')),
      'contract-manifest.json': sha256File(path.join(OUT, 'contract-manifest.json')),
      'fixture-bundle': sha256Concat(fixtureFiles),
    },
  }
  writeJson(path.join(OUT, 'checksums.json'), checksums)

  const created = listFilesRecursive(OUT).map((f) => `reference/backend/ui-api-contract/${f}`).sort()
  console.log(JSON.stringify({ routeCount: routeManifest.routeCount, operationCount: routeManifest.operationCount, fileCount: created.length, files: created }, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
