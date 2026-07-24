# Live backend contract (inspected)

Captured from **`https://qswarm.onrender.com`** with path prefix **`/api/v1`**.  
**Authoritative OpenAPI:** `reference/backend/docs/openapi-ui-v1.json` (synced 2026-07-24).  
**Frontend route manifest:** `src/api/backend-route-manifest.ts`  
**Compatibility report:** `docs/FRONTEND_API_COMPATIBILITY_REPORT.md`  
**Contract fixtures:** `src/api/contract-fixtures/`

## Conventions

- JSON uses **camelCase** keys for these routes.
- List endpoints vary: some return a **top-level array**, others **`{ "items": [...] }`**.

## `GET /api/v1/dashboard` — BFF / aggregate

- **Shape:** `{ sessionCounts, recentSessions, ... }` — the UI validates **`sessionCounts`** and **`recentSessions`** only; other top-level keys (e.g. `repositoryConnectionCount`, `branchPolicyCount`, `applicationName`, `environment`) are accepted and ignored by Zod.
- **`recentSessions` items** include at least: `id`, `status`, `engine`, `repoConnectionId`, `sourceRef`, `createdAt`, `updatedAt`.
- **Often present (not on plain session list):** `approvedCaseId` (UUID string), `jobStatus` (e.g. `pending`, `pr_created`, `pr_creation_failed`), `currentRoundNumber` (number).
- **`sourceLabel`:** may be absent on dashboard rows (list uses it for approved-case id in some deployments).

## `GET /api/v1/repo-connections`

- **Shape:** `{ "items": [ RepoConnection, ... ] }` (not a bare array on this deployment).
- **Item fields:** `id`, `provider`, `displayName`, `ownerOrOrg`, `repoName`, `projectOrWorkspace` (nullable), `cloneUrl` (nullable), `defaultBranch`, `authType`, `credentialReference` (**nullable**), `isActive`, `createdBy`, `createdAt`, `updatedAt`.

## `GET /api/v1/repo-connections/{id}`

- **Shape:** single **RepoConnection** object (same fields as list items).

## `POST /api/v1/repo-connections` / `PATCH ...`

- **Write body (POST validation):** `provider`, `owner`, `repo`, `authRef` (required, min length 1); optional `defaultBranch`, `displayName`, `cloneUrl`, etc.
- **PATCH** accepts the same logical identifiers (e.g. `owner` updates `ownerOrOrg`); empty `{}` may still return 200.

## `GET /api/v1/branch-policies`

- **Shape:** top-level **array**.
- **Items:** `id`, `name`, `baseBranch`, `branchPattern`, `prTitleTemplate`, `prBodyTemplate`, `repoConnectionId`, `createdAt`, `updatedAt`.

## `POST /api/v1/branch-policies`

- **Body:** `name`, `repositoryConnectionId` (**not** `repoConnectionId`), `baseBranch`, `branchPattern`, `prTitleTemplate`; `prBodyTemplate` may default to empty string if omitted.

## `PATCH /api/v1/branch-policies/{id}`

- **Body:** use **`repoConnectionId`** (and other fields); sending **`repositoryConnectionId`** caused **500** in a probe — UI sends PATCH bodies keyed like GET responses.

## `GET /api/v1/sessions`

- **Shape:** top-level **array** of summaries: `id`, `status`, `engine`, `repoConnectionId`, `sourceRef`, `sourceLabel`, `createdAt`, `updatedAt`.

## `POST /api/v1/sessions`

- **Body (OpenAPI `UiAutomationSessionCreate`):** `repositoryConnectionId` (UUID, not `repoConnectionId`), `engine` (default `stub`), `sourceRef`, **`createdBy`** (default `qswarm-web`; override with `VITE_SESSION_CREATED_BY`), optional `branchPolicyId`, `sourceLabel`, `approvedCaseId`, etc.
- **HTTP 201** on success.

## `GET /api/v1/sessions/{id}`

- **Shape:** session detail with `rounds`, `patches`, `executions`, `reviews`, previews, etc. (matches the UI’s `sessionDetailSchema` direction).

## `GET /api/v1/settings`

- **Shape:** flat read-only slice, e.g. `applicationName`, `environment`, `debug`, `jira: { useStub, configured }`, `codingProvider`, `workspaceRoot`, `claudeCodeEnabled`, `copilotAgentEnabled`, `notes` — **not** the older nested `engine` / `infrastructure` / `source` document.

## `GET /api/v1/stories`

- **Query:** `projectKey`, `status`, `q`, `limit` (OpenAPI)
- **Client-side only:** `readiness` filter applied after fetch when the UI requests it
- **Response:**

```json
{
  "stories": [
    {
      "storyKey": "STUB-1",
      "title": "Stub result for JQL...",
      "description": "Stub Jira issue...",
      "status": "Open",
      "sprint": null,
      "projectKey": "STUB",
      "assignee": null,
      "readiness": "partial",
      "acceptanceCriteriaStatus": "partial",
      "missingInformation": ["Few explicit acceptance criteria were found"],
      "hasActiveRun": false,
      "activeRunId": null,
      "jiraUrl": "https://usfoods.atlassian.net/browse/STUB-1"
    }
  ],
  "total": 1
}
```

- **Item fields:** `storyKey`, `title`, `description`, `status`, `sprint` (nullable), `projectKey`, `assignee` (nullable), `readiness`, `acceptanceCriteriaStatus`, `missingInformation[]`, `hasActiveRun`, `activeRunId` (nullable), `jiraUrl`

## `GET /api/v1/stories/{storyKey}`

- **Response:** single story object (same fields as list item)

## `POST /api/v1/stories/{key}/test-design-runs`

- **Body:** `{ initiatedBy }` (default `qswarm-web`)
- **Response:** `testDesignRunSchema` — opens existing run if one is active for the story

## `GET /api/v1/test-design-runs/{id}`

- **Response:** workspace run detail (canonical id is `id`, UUID)
- **Top-level fields:** `id`, `storyKey`, `workflowName`, `status`, `currentStep`, `currentStage`, `nextActions[]`, `blockedReason` (nullable), `initiatedBy`, `createdAt`, `updatedAt`, `sourceStory`, `requirementAnalysis` (nullable), `testDesignPlan` (nullable), `reviewIssue` (nullable), `versions[]`, `testCaseRecords[]`, `automationReadyTestCases[]`, `approvalId` (nullable), `productWorkspace`
- **`sourceStory`:** `{ storyKey, intakeArtifactId }` only — not a full Jira story
- **`currentStage` values:** `intake_ready`, `analyzing_requirements`, `analysis_ready`, `preparing_test_design_plan`, `awaiting_plan_approval`, `plan_revision_requested`, `plan_approved`, `generating_test_cases`, `awaiting_test_case_review`, `revising_test_cases`, `approved`, `publishing`, `automation_ready`, `completed`, `legacy_awaiting_approval`
- **`nextActions` examples:** `analyze_requirements`, `prepare_plan`, `approve_plan`, `request_plan_changes`, `generate_test_cases`, `request_test_case_changes`, `approve_test_design`, `publish_test_cases`, `open_automation_backlog`
- **Errors:** `{ "detail": { "code": "not_found", "message": "...", "field": null } }`

Example `intake_ready` response:

```json
{
  "id": "38d476a7-8294-4acd-909b-36de472f18d0",
  "storyKey": "NSP-696",
  "workflowName": "sprint1_qswarm_workspace",
  "status": "pending",
  "currentStep": "intake_ready",
  "currentStage": "intake_ready",
  "nextActions": ["analyze_requirements"],
  "blockedReason": null,
  "initiatedBy": "qswarm-web",
  "createdAt": "2026-07-24T12:22:13.387184+00:00",
  "updatedAt": "2026-07-24T12:22:13.387184+00:00",
  "sourceStory": {
    "storyKey": "NSP-696",
    "intakeArtifactId": "7995e03e-0881-4027-9650-ddabe2540da0"
  },
  "requirementAnalysis": null,
  "testDesignPlan": null,
  "reviewIssue": null,
  "versions": [],
  "testCaseRecords": [],
  "automationReadyTestCases": [],
  "approvalId": null,
  "productWorkspace": {
    "mode": "qswarm_first",
    "stage": "intake_ready"
  }
}
```

## `GET /api/v1/test-design-runs/{id}/analysis`

- **Response:** `UiArtifactVersionRef` (`version`, `artifactId`, `content`)

## `GET /api/v1/test-design-runs/{id}/plan`

- **Response:** `UiArtifactVersionRef`

## `GET /api/v1/test-design-runs/{id}/review-data`

- **Response wire:** `workflowRunId`, `reviewSummary`, `testCases[]`, `conversation[]`, `versions[]`, `publication`
- **UI adapter:** `adaptTestDesignReviewData()` in `src/api/adapters/test-design.ts`

## Sprint 1 mutations

| Path | Body / query |
|------|----------------|
| `POST .../analyze` | `actor_id` query (no body) |
| `POST .../prepare-plan` | `actor_id` query |
| `POST .../approve-plan` | `actor_id` query |
| `POST .../request-plan-revision` | `{ actorId, instruction, scope? }` |
| `POST .../generate-test-cases` | `actor_id` query |
| `POST .../request-revision` | `{ actorId, instruction, scope? }` |
| `POST .../approve` | `{ actorId, notes? }` |
| `POST .../publish` | `actor_id` query |

**Example `nextActions`:** `analyze_requirements`, `prepare_test_design_plan`, `request_analysis_revision`, `approve_plan`, `request_plan_changes`, `generate_test_cases`, `request_test_case_changes`, `approve_test_design`, `publish_test_cases`, `open_automation_backlog`

## `GET /api/v1/test-cases`

- **Shape:** `{ items: UiTestCaseRecord[], total? }`
- **Query:** `status` (e.g. `automation_ready`), `workflowRunId`, `sourceStoryKey`, `limit`
- **UI:** Automation Backlog page; `not_automated` tab maps to `status=automation_ready`

## `GET /api/v1/test-cases/{id}`

- **Shape:** single backlog test case (same fields as list item)

## `POST /api/v1/test-cases/{id}/automate`

- **Body:** `{ createdBy, engine, repositoryConnectionId, baseBranch? }` (`UiTestCaseAutomate`)
- **Response:** `sessionDetailSchema` — opens the plan-first session flow for that test case

## `GET /api/v1/sessions/{id}/brief`

- **Shape:** `{ sessionId, sessionState, sourceSummary, setup, automationBrief }`
- **`sessionState`:** `status`, `workflowStatus`, `jobStatus`, `currentRoundNumber`, `planApproved`, `planApprovedAt`, `nextActions[]`, timestamps
- **`sourceSummary`:** `sourceReference`, `sourceTitle`, `caseId`, `objective`, optional `missingInformation[]`
- **`setup`:** `engine`, `repositoryConnectionId`, nested `repository`, `branchPolicy`, `workspaceConfigured`
- **`automationBrief`:** `available`, `summary`, optional `targetTestFile`, `filesToModify`, `frameworkType`, etc.

## `GET /api/v1/sessions/{id}/review-data`

- **Shape:** `{ sessionId, reviewSummary, changedFiles[], reviewConversation[], prInfo }`
- **`changedFiles[]`:** `path`, `action` (`modify`|`create`|…), `beforeContent`/`previousContent`, `afterContent`/`currentContent`, `unifiedDiff`, `summary`, line counts
- **`reviewConversation[]`:** `id`, `type`, `actor`, `text`, `createdAt`, optional `roundNumber`, `status`, `scope`
- **`prInfo`:** nullable; `externalUrl`, `externalId`, `title`, `body`, `status`, branches


All are **synchronous** on hosted Render (HTTP **200**, not 202). Start and revision can take **5–15+ minutes** (clone, npm, Copilot CLI, Playwright).

### Plan-first flow

- **prepare-plan** — `{ actorId }`; returns session detail with `status: plan_ready`; brief `nextActions` become `approve_plan`, `request_plan_revision`.
- **approve-plan** — `{ actorId }`; sets `sessionState.planApproved: true`; `nextActions` become `start_automation`.
- **request-plan-revision** — `{ actorId, instruction }` (aliases `instructionText`, optional `scope` / `targetScope`); revises the automation plan before run.
- **start** — optional `{ actorId, repositoryConnectionId }`; requires plan approval when plan-first flow is active; returns full detail.
- **request-revision** — `{ actorId, instruction }` (aliases `instructionText`, `scope` / `targetScope`); **422** `revision_no_material_change` when Copilot made no scoped edits.
- **approve** — `{ actorId }`; **409** `invalid_state` when not awaiting review.
- **create-pr** — required `{ actorId, repositoryConnectionId }`; response may include `prExternalUrl`, `prExternalId`, `prStatus`.

### Session schemas

- List/detail include **`workflowStatus`** (raw backend, e.g. `planning`, `pr_created`) alongside coerced UI **`status`**.
- Detail may include **`prExternalUrl`**, **`prExternalId`**, **`prStatus`** after create-pr.
