# Live backend contract (inspected)

Captured from **`https://qswarm.onrender.com`** with path prefix **`/api/v1`** (June 2026). Use this alongside `src/api/schemas.ts` when aligning the UI.

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

## `GET /api/v1/test-cases/automation-backlog`

- **Shape:** `{ items: AutomationBacklogTestCase[], total? }` or top-level array
- **Query:** optional `q` (search), `status` (`not_automated`, `in_progress`, `automated`, `failed`)
- **Item fields:** `id`, `caseId`, `title`, `sourceSystem`, `sourceReference`, `storyKey`, `storyTitle`, `automationStatus`, `targetArea`, `repoConnectionId`, `sessionId`, `objective`, `stepsPreview`, timestamps

## `GET /api/v1/test-cases/{id}`

- **Shape:** single backlog test case (same fields as list item)

## `POST /api/v1/test-cases/{id}/automate`

- **Body:** `{ actorId, createdBy, repositoryConnectionId, branchPolicyId?, engine, codingEngine? }`
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
