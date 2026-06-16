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

## `GET /api/v1/sessions/{id}`

- **Shape:** session detail with `rounds`, `patches`, `executions`, `reviews`, previews, etc. (matches the UI’s `sessionDetailSchema` direction).

## `GET /api/v1/settings`

- **Shape:** flat read-only slice, e.g. `applicationName`, `environment`, `debug`, `jira: { useStub, configured }`, `codingProvider`, `workspaceRoot`, `claudeCodeEnabled`, `copilotAgentEnabled`, `notes` — **not** the older nested `engine` / `infrastructure` / `source` document.

## Mutations not fully validated here

- `POST /sessions` returned **500** for synthetic probes (no structured validation body captured).
- Session lifecycle POSTs were not re-probed in this pass; the UI keeps existing JSON bodies.
