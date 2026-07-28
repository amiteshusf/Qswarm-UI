# API contract integration

The QSwarm frontend consumes a **versioned backend contract bundle** instead of handwritten route strings or guessed response shapes.

## Authoritative bundle

- **Contract version:** `2026.07.28.1`
- **Synced location:** `src/api/backend-contract/`
- **Interim source:** `reference/backend/ui-api-contract/` (or `BACKEND_CONTRACT_SOURCE` in CI)

## Workflow

1. **Sync** — `npm run contract:sync` copies the bundle, verifies SHA-256 checksums (`openapi-ui-v1.json`, fixture bundle, `contract-manifest.json`), and writes `sync-metadata.json`.
2. **Generate** — `npm run contract:generate` emits:
   - `src/api/generated/backend-routes.ts` (48 operations / 43 routes)
   - `src/api/generated/backend-workflow.ts`
   - `src/api/generated/backend-types.ts`
   - `src/api/generated/generated-stamp.ts`
3. **Verify** — `npm run contract:verify` fails CI when generated files are stale.
4. **Runtime handshake** — On startup (live API mode), `GET /api/v1/meta/contract` is compared with the bundled contract. Incompatible or unknown contracts block normal routing via `ContractCompatibilityPage`.
5. **Tests** — `src/api/contract-integration.test.ts` dynamically loads every fixture from `fixtures/index.json`, validates wire schemas, and checks workflow token coverage.

## API client rules

- All HTTP calls go through `src/api/client.ts` using `operationHref(operationId, pathParams, query)`.
- Wire validation uses `src/api/generated/backend-schemas.ts` and `src/api/wire-schemas.ts`.
- UI view models stay in `src/api/schemas.ts` with explicit adapters under `src/api/adapters/`.

## Missing backend fixtures (blocking full mutation coverage)

| Operation | Status | Note |
|-----------|--------|------|
| `publishTestDesign` | missing | `sprint1.publish.mutation` — backend follow-up |
| `prepareSessionPlan` | skipped | `sprint2.session.prepare-plan.mutation` |
| `analyzeTestDesignRun` | missing | mutation response deferred |

Contract flow tests fail with **“backend contract fixture missing”** rather than inventing shapes when these are required.

## Deployment gates

`npm run build` runs `contract:verify` before TypeScript and Vite production build. Full pre-release check:

```bash
npm run contract:check
```

## Diagnostics

Settings → **Advanced → API contract diagnostics** shows bundled vs live contract version, checksums, backend commit, and compatibility status.
