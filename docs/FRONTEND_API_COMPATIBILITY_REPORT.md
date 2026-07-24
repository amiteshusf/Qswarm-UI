# Frontend API compatibility report

**Audit date:** 2026-07-24  
**OpenAPI source:** `reference/backend/docs/openapi-ui-v1.json` (synced from `https://qswarm.onrender.com/openapi.json`)  
**Route manifest:** `src/api/backend-route-manifest.ts`

## Summary

The frontend API client was aligned to backend OpenAPI for all 37 `/api/v1` UI routes. A central route manifest now drives every HTTP call; OpenAPI coverage and contract-flow tests guard against alias drift.

## Incorrect URLs corrected

| Feature | Was | Now |
|---------|-----|-----|
| Analyze requirements | `POST .../analyze-requirements` | `POST .../analyze?actor_id=` |
| Prepare plan | `POST .../prepare-test-design-plan` | `POST .../prepare-plan?actor_id=` |
| Requirement analysis | `GET .../requirement-analysis` | `GET .../analysis` |
| Test design plan | `GET .../test-design-plan` | `GET .../plan` |
| Case revision | `POST .../request-test-case-revision` | `POST .../request-revision` |
| Automation backlog | `GET .../test-cases/automation-backlog` | `GET .../test-cases?status=automation_ready` |
| Settings update | `PATCH .../settings` (removed — not in OpenAPI) | N/A |

## Request body corrections

| Endpoint | Was | Now |
|----------|-----|-----|
| `POST /stories/{key}/test-design-runs` | `{ actorId, createdBy }` | `{ initiatedBy }` |
| `POST /test-design-runs/{id}/analyze` | JSON `{ actorId }` body | No body; `actor_id` query param |
| `POST /test-design-runs/{id}/prepare-plan` | JSON body | No body; `actor_id` query |
| `POST /test-design-runs/{id}/approve-plan` | JSON body | No body; `actor_id` query |
| `POST /test-design-runs/{id}/generate-test-cases` | JSON body | No body; `actor_id` query |
| `POST /test-design-runs/{id}/publish` | JSON body | No body; `actor_id` query |
| `POST /test-design-runs/{id}/approve` | `{ actorId }` only | `{ actorId }` via `UiWorkspaceApprove` |
| `POST /test-design-runs/{id}/request-plan-revision` | `instructionText`, `focusArea` | `{ actorId, instruction, scope? }` |
| `POST /test-design-runs/{id}/request-revision` | `instructionText`, `focusArea` | `{ actorId, instruction, scope? }` |
| `POST /sessions/{id}/request-*-revision` | `instructionText`, `targetScope` aliases | `{ actorId, instruction, scope? }` |
| `POST /test-cases/{id}/automate` | `actorId`, `approvedCaseId`, `sourceRef`, … | `{ createdBy, engine, repositoryConnectionId, baseBranch }` |
| `POST /sessions` | included `codingEngine` | OpenAPI fields only |

## Response schema corrections

| Resource | Change |
|----------|--------|
| Run detail embedded `requirementAnalysis` / `testDesignPlan` | `UiArtifactVersionRef` wire shape (`version`, `artifactId`, `content`) |
| Run `reviewIssue` | `reviewJiraIssueKey`, `publishStatus` |
| Run `testCaseRecords` | `registryKey`, `workflowRunId`, `sourceStoryKey` required |
| Review data | Wire: `workflowRunId`, `conversation`, `publication`; adapted to UI model |
| Test case registry | `UiTestCaseRecord` wire → `AutomationBacklogTestCase` adapter |
| Story detail | Legacy/detail wire → `JiraStory` adapter (list row remains canonical) |

## Query parameter corrections

| Endpoint | Was | Now |
|----------|-----|-----|
| `GET /stories` | `project`, `sprint`, `readiness` | `projectKey`, `status`, `q`, `limit`; `readiness` filtered client-side |
| `GET /test-cases` | `q` (undocumented) | `status`, `workflowRunId`, `sourceStoryKey`, `limit`; search client-side |

## Error contract

All routes use backend `detail` object (`code`, `message`, `field`). Existing `extractBackendMessage` / `extractBackendErrorCode` already parse this shape.

## Files added

- `src/api/backend-route-manifest.ts`
- `src/api/wire-schemas.ts`
- `src/api/adapters/test-design.ts`
- `src/api/adapters/stories.ts`
- `src/api/contract-fixtures/*.json`
- `reference/backend/docs/openapi-ui-v1.json`
- Tests: `openapi-coverage.test.ts`, `api-routes.test.ts`, `contract-fixtures.test.ts`, `contract-flow.test.ts`

## Backend ambiguities (unresolved)

1. **`GET /stories/{storyKey}`** — OpenAPI documents `UiStorySummary`, but live API sometimes returns a legacy detail object (`labels`, `issueType`, `activeWorkflowRunId`). Frontend uses `jiraStoryDetailWireSchema` + `adaptJiraStoryDetail()`.
2. **`POST /test-cases/{id}/automate`** — UI collects `branchPolicyId`, but OpenAPI `UiTestCaseAutomate` has no such field; omitted from wire body.
3. **OpenAPI route count** — Deployed OpenAPI exposes 37 `/api/v1` routes; product docs mention 44 (may include non-UI or health routes).

## Verification

- **65 tests passed**
- **TypeScript:** `tsc -b` clean
- **Production build:** `vite build` succeeded
